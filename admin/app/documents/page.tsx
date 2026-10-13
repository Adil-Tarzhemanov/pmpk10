import { redirect } from "next/navigation";
import { isSignedIn, endSession } from "@/lib/auth";
import { readJson, writeJson, uploadFile } from "@/lib/github";
import { ACCEPT, MAX_UPLOAD, SAVE_MESSAGES, acceptable, errorCode, extension, isSaveError } from "@/lib/save";
import { Chrome } from "../chrome";
import { ConfirmButton, ErrorMessage, FileField } from "../controls";

export const dynamic = "force-dynamic";

type Doc = { title: string; meta: string; href: string; tbd?: string };
type Group = { title: string; items: Doc[] };
type Docs = { groups: Group[]; [key: string]: unknown };

function sizeLabel(bytes: number): string {
  const kb = bytes / 1024;
  return kb < 1024 ? `${Math.round(kb)} КБ` : `${(kb / 1024).toFixed(1)} МБ`;
}

/**
 * Документы: выложить файл и убрать устаревший.
 *
 * Правка идёт по одному действию за раз, а не «отредактируйте весь список
 * и нажмите сохранить». Причина простая: в списке девять документов в трёх
 * группах, и форма на всё сразу — это место, где легко снести чужую строку
 * и не заметить.
 *
 * Названия групп и порядок не редактируются: это структура раздела, она
 * задана нормативкой и меняется раз в несколько лет через разработчика.
 */
export default async function Documents({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  if (!(await isSignedIn())) redirect("/login");
  const { saved, error } = await searchParams;

  let ru: Docs | null = null;
  let loadError = "";
  try {
    ru = (await readJson<Docs>("content/documents/ru.json")).data;
  } catch (e) {
    loadError = e instanceof Error ? e.message : "Не удалось загрузить документы";
  }

  async function signOut() {
    "use server";
    await endSession();
    redirect("/login");
  }

  async function addDoc(formData: FormData) {
    "use server";
    if (!(await isSignedIn())) redirect("/login");

    const title = String(formData.get("title") ?? "").trim();
    /* Без перевода на казахской версии будет русское название — лучше, чем пустая строка */
    const titleKk = String(formData.get("titleKk") ?? "").trim() || title;
    const groupIndex = Number(formData.get("group") ?? -1);
    const file = formData.get("file");

    if (title.length < 3 || !(file instanceof File) || file.size === 0) {
      redirect("/documents?error=fields");
    }
    if (!acceptable(file, "document")) redirect("/documents?error=file");

    let problem = "";
    try {
      const href = await uploadFile(file.name, Buffer.from(await file.arrayBuffer()));
      const meta = `${extension(file.name).toUpperCase()} · ${sizeLabel(file.size)}`;

      for (const [path, docTitle] of [
        ["content/documents/ru.json", title],
        ["content/documents/kk.json", titleKk],
      ] as const) {
        const { data, sha } = await readJson<Docs>(path);
        const doc: Doc = { title: docTitle, meta, href };
        const groups = data.groups.map((g, i) =>
          i === groupIndex ? { ...g, items: [...g.items, doc] } : g,
        );
        await writeJson(path, { ...data, groups }, `Добавлен документ: ${title}`, sha);
      }
    } catch (e) {
      problem = errorCode(e);
    }
    if (problem) redirect(`/documents?error=${problem}`);
    redirect("/documents?saved=1");
  }

  async function removeDoc(formData: FormData) {
    "use server";
    if (!(await isSignedIn())) redirect("/login");
    const g = Number(formData.get("g"));
    const i = Number(formData.get("i"));
    /* Номер строки — с экрана, который мог устареть: другая вкладка уже
       убрала строку выше, и под этим номером теперь соседний документ.
       Название и ссылка подтверждают, что убираем именно то, что видели */
    const title = String(formData.get("title") ?? "");
    const href = String(formData.get("href") ?? "");

    let problem = "";
    try {
      const files = await Promise.all(
        ["content/documents/ru.json", "content/documents/kk.json"].map(async (path) => ({
          path,
          ...(await readJson<Docs>(path)),
        })),
      );
      const seen = files[0].data.groups[g]?.items[i];
      if (!seen || seen.title !== title || seen.href !== href) {
        problem = "changed";
      } else {
        for (const { path, data, sha } of files) {
          const groups = data.groups.map((group, gi) =>
            gi === g ? { ...group, items: group.items.filter((_, ii) => ii !== i) } : group,
          );
          await writeJson(path, { ...data, groups }, `Убран документ: ${title}`, sha);
        }
      }
    } catch (e) {
      problem = errorCode(e);
    }
    if (problem) redirect(`/documents?error=${problem}`);
    redirect("/documents?saved=1");
  }

  return (
    <Chrome signOut={signOut} back={{ href: "/", label: "Все разделы" }}>
      <h1>Документы</h1>
      <p className="lede">Файлы, которые посетитель может скачать со страницы «Документы».</p>

      {loadError ? <p className="msg msg--err">{loadError}</p> : null}
      {saved ? <p className="msg msg--ok">Сохранено. Сайт обновится в течение минуты.</p> : null}
      {error === "fields" ? <ErrorMessage text="Укажите название и выберите файл." /> : null}
      {isSaveError(error) ? <ErrorMessage text={SAVE_MESSAGES[error]} /> : null}

      {ru ? (
        <>
          <h2>Выложить документ</h2>
          <form action={addDoc} className="card">
            <div className="field">
              <label htmlFor="title">Название</label>
              <input id="title" name="title" type="text" required />
              <span className="hint">Так документ увидит посетитель.</span>
            </div>
            <div className="field">
              <label htmlFor="titleKk">Атауы (на казахском)</label>
              <input id="titleKk" name="titleKk" type="text" />
              <span className="hint">Не заполните — на казахской версии будет русское название.</span>
            </div>
            <div className="field">
              <label htmlFor="group">В какой раздел</label>
              <select id="group" name="group" defaultValue="0">
                {ru.groups.map((g, i) => (
                  <option key={g.title} value={i}>{g.title}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="file">Файл</label>
              <FileField id="file" name="file" accept={ACCEPT.document} maxBytes={MAX_UPLOAD} required />
              <span className="hint">PDF, Word, Excel или картинка, не больше 4 МБ. Формат и вес подставятся сами.</span>
            </div>
            <button className="btn btn--primary" type="submit">Выложить</button>
          </form>

          <h2>Уже выложено</h2>
          {ru.groups.map((group, g) => (
            <section key={group.title} style={{ marginBottom: 24 }}>
              <p style={{ fontWeight: 600, marginBottom: 8 }}>{group.title}</p>
              <ul className="list">
                {group.items.map((doc, i) => (
                  <li key={`${i}-${doc.href}`}>
                    <span className="list__main">
                      <strong>{doc.title}</strong>
                      <span className="list__date">
                        {doc.meta}
                        {doc.tbd ? ` · ${doc.tbd}` : ""}
                      </span>
                    </span>
                    <form action={removeDoc}>
                      <input type="hidden" name="g" value={g} />
                      <input type="hidden" name="i" value={i} />
                      <input type="hidden" name="title" value={doc.title} />
                      <input type="hidden" name="href" value={doc.href} />
                      <ConfirmButton question={`Убрать с сайта «${doc.title}»?`}>Убрать</ConfirmButton>
                    </form>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </>
      ) : null}
    </Chrome>
  );
}

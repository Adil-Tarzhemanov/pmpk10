import { redirect } from "next/navigation";
import { isSignedIn, endSession } from "@/lib/auth";
import { readJson, writeJson, uploadImage } from "@/lib/github";
import { Chrome } from "../chrome";

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
    const groupIndex = Number(formData.get("group") ?? -1);
    const file = formData.get("file");

    if (title.length < 3 || !(file instanceof File) || file.size === 0) {
      redirect("/documents?error=fields");
    }
    const upload = file as File;

    const bytes = Buffer.from(await upload.arrayBuffer());
    const href = await uploadImage(upload.name, bytes);
    const ext = (upload.name.split(".").pop() ?? "").toUpperCase();

    const doc: Doc = { title, meta: `${ext} · ${sizeLabel(upload.size)}`, href };

    for (const path of ["content/documents/ru.json", "content/documents/kk.json"]) {
      const { data, sha } = await readJson<Docs>(path);
      const groups = data.groups.map((g, i) =>
        i === groupIndex ? { ...g, items: [...g.items, doc] } : g,
      );
      await writeJson(path, { ...data, groups }, `Добавлен документ: ${title}`, sha);
    }
    redirect("/documents?saved=1");
  }

  async function removeDoc(formData: FormData) {
    "use server";
    if (!(await isSignedIn())) redirect("/login");
    const g = Number(formData.get("g"));
    const i = Number(formData.get("i"));

    for (const path of ["content/documents/ru.json", "content/documents/kk.json"]) {
      const { data, sha } = await readJson<Docs>(path);
      const groups = data.groups.map((group, gi) =>
        gi === g ? { ...group, items: group.items.filter((_, ii) => ii !== i) } : group,
      );
      await writeJson(path, { ...data, groups }, "Убран документ", sha);
    }
    redirect("/documents?saved=1");
  }

  return (
    <Chrome signOut={signOut} back={{ href: "/", label: "Все разделы" }}>
      <h1>Документы</h1>
      <p className="lede">Файлы, которые посетитель может скачать со страницы «Документы».</p>

      {loadError ? <p className="msg msg--err">{loadError}</p> : null}
      {saved ? <p className="msg msg--ok">Сохранено. Сайт обновится в течение минуты.</p> : null}
      {error === "fields" ? (
        <p className="msg msg--err">Укажите название и выберите файл.</p>
      ) : null}

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
              <label htmlFor="group">В какой раздел</label>
              <select id="group" name="group" defaultValue="0">
                {ru.groups.map((g, i) => (
                  <option key={g.title} value={i}>{g.title}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="file">Файл</label>
              <input id="file" name="file" type="file" required />
              <span className="hint">Формат и вес подставятся сами.</span>
            </div>
            <button className="btn btn--primary" type="submit">Выложить</button>
          </form>

          <h2>Уже выложено</h2>
          {ru.groups.map((group, g) => (
            <section key={group.title} style={{ marginBottom: 24 }}>
              <p style={{ fontWeight: 600, marginBottom: 8 }}>{group.title}</p>
              <ul className="list">
                {group.items.map((doc, i) => (
                  <li key={doc.title}>
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
                      <button className="btn btn--danger" type="submit">Убрать</button>
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

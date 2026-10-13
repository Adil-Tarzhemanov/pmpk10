import { redirect } from "next/navigation";
import { isSignedIn, endSession } from "@/lib/auth";
import { ConflictError, readJson, writeJson } from "@/lib/github";
import { SAVE_MESSAGES, errorCode, isSaveError } from "@/lib/save";
import {
  PAGES,
  blank,
  filePath,
  isPageKey,
  label,
  rebuild,
  type Json,
  type PageKey,
} from "@/lib/pages";
import { Chrome } from "../../chrome";
import { ErrorMessage } from "../../controls";

export const dynamic = "force-dynamic";

/**
 * Правка текстов страницы.
 *
 * Русская и казахская версии стоят рядом в одном поле: так видно, что
 * казахскую забыли, — на сайте обе версии равноправны, и текст, забытый
 * на одной из них, обнаруживается уже от посетителя.
 *
 * Пункты списков удаляются галочкой, а не кнопкой: кнопка отправила бы
 * форму и потеряла остальные несохранённые правки.
 */
export default async function PageEditor({
  params,
  searchParams,
}: {
  params: Promise<{ key: string }>;
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  if (!(await isSignedIn())) redirect("/login");

  const { key } = await params;
  if (!isPageKey(key)) redirect("/pages");
  const page = PAGES[key];
  const { saved, error } = await searchParams;

  let ru: Json | null = null;
  let kk: Json | null = null;
  let shaRu = "";
  let shaKk = "";
  let loadError = "";
  try {
    ({ data: ru, sha: shaRu } = await readJson<Json>(filePath(key, "ru")));
    ({ data: kk, sha: shaKk } = await readJson<Json>(filePath(key, "kk")));
  } catch (e) {
    loadError = e instanceof Error ? e.message : "Не удалось открыть тексты страницы";
  }

  async function signOut() {
    "use server";
    await endSession();
    redirect("/login");
  }

  async function save(formData: FormData) {
    "use server";
    if (!(await isSignedIn())) redirect("/login");

    /* Поля формы адресуют пункты списков по номерам. Если файл успели
       сохранить из другой вкладки, номера могли сдвинуться, и правка легла
       бы не на тот пункт. sha с экрана это ловит: оба файла сверяются
       до записи, чтобы не сохранить один язык из двух */
    let problem = "";
    try {
      const files = await Promise.all(
        (["ru", "kk"] as const).map(async (lang) => {
          const path = filePath(key as PageKey, lang);
          return { lang, path, ...(await readJson<Json>(path)) };
        }),
      );
      if (files.some((f) => f.sha !== formData.get(`sha::${f.lang}`))) {
        throw new ConflictError("Тексты изменены после открытия формы");
      }
      for (const { lang, path, data, sha } of files) {
        const next = rebuild(data, "", formData, lang);
        await writeJson(path, next, `Изменены тексты: ${PAGES[key as PageKey].title}`, sha);
      }
    } catch (e) {
      problem = errorCode(e);
    }
    if (problem) redirect(`/pages/${key}?error=${problem}`);
    redirect(`/pages/${key}?saved=1`);
  }

  return (
    <Chrome signOut={signOut} back={{ href: "/pages", label: "Тексты страниц" }}>
      <h1>{page.title}</h1>
      <p className="lede">{page.hint}</p>

      {loadError ? <p className="msg msg--err">{loadError}</p> : null}
      {saved ? (
        <p className="msg msg--ok">Сохранено. Сайт обновится в течение минуты.</p>
      ) : null}
      {isSaveError(error) ? <ErrorMessage text={SAVE_MESSAGES[error]} /> : null}

      {ru ? (
        <form action={save}>
          <input type="hidden" name="sha::ru" value={shaRu} />
          <input type="hidden" name="sha::kk" value={shaKk} />
          <Node node={ru} other={kk} path="" heading="" />
          <p className="row">
            <button className="btn btn--primary" type="submit">
              Сохранить
            </button>
          </p>
        </form>
      ) : null}
    </Chrome>
  );
}

/** Значение по пути в казахской версии: структура у файлов одинаковая */
function mirror(node: Json | null | undefined, step: string | number): Json | undefined {
  if (node === null || node === undefined || typeof node !== "object") return undefined;
  return Array.isArray(node)
    ? node[Number(step)]
    : (node as Record<string, Json>)[String(step)];
}

function Node({
  node,
  other,
  path,
  heading,
}: {
  node: Json;
  other: Json | null | undefined;
  path: string;
  heading: string;
}) {
  if (typeof node === "string") {
    return (
      <Pair
        path={path}
        heading={heading}
        ru={node}
        kk={typeof other === "string" ? other : ""}
      />
    );
  }

  if (Array.isArray(node)) {
    return (
      <section className="card">
        {heading ? <h2>{heading}</h2> : null}
        {node.map((item, i) => (
          <div key={`${path}.${i}`} className="field">
            <Node node={item} other={mirror(other, i)} path={`${path}.${i}`} heading="" />
            <label className="hint">
              <input type="checkbox" name={`del::${path}.${i}`} /> удалить этот пункт
            </label>
          </div>
        ))}
        {node.length > 0 ? (
          <div className="field">
            <span className="hint">Новый пункт — заполните, чтобы добавить</span>
            <Node node={blank(node[0])} other={blank(node[0])} path={`${path}.new`} heading="" />
          </div>
        ) : null}
      </section>
    );
  }

  if (node && typeof node === "object") {
    const entries = Object.entries(node);
    return (
      <section className={heading ? "card" : undefined}>
        {heading ? <h2>{heading}</h2> : null}
        {entries.map(([childKey, value]) => (
          <Node
            key={`${path}.${childKey}`}
            node={value}
            other={mirror(other, childKey)}
            path={`${path}.${childKey}`}
            heading={typeof value === "object" && value !== null ? label(childKey) : label(childKey)}
          />
        ))}
      </section>
    );
  }

  /* Числа и флаги (координаты карты, признаки «уточняется») редактор не
     показывает: это настройки, а не текст. Сохранятся как были. */
  return null;
}

/** Одно поле: русский текст и казахский рядом */
function Pair({
  path,
  heading,
  ru,
  kk,
}: {
  path: string;
  heading: string;
  ru: string;
  kk: string;
}) {
  const rows = Math.min(10, Math.max(2, Math.ceil(Math.max(ru.length, kk.length) / 70)));
  return (
    <div className="field">
      <label htmlFor={`ru::${path}`}>{heading || "Текст"}</label>
      <textarea id={`ru::${path}`} name={`ru::${path}`} rows={rows} defaultValue={ru} />
      <label htmlFor={`kk::${path}`} className="hint">
        на казахском
      </label>
      <textarea id={`kk::${path}`} name={`kk::${path}`} rows={rows} defaultValue={kk} />
    </div>
  );
}

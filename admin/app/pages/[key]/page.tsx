import { redirect } from "next/navigation";
import { isSignedIn, endSession } from "@/lib/auth";
import { readJson, writeJson } from "@/lib/github";
import {
  PAGES,
  filePath,
  isPageKey,
  label,
  rebuild,
  type Json,
  type PageKey,
} from "@/lib/pages";
import { Chrome } from "../../chrome";

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
  let loadError = "";
  try {
    ru = (await readJson<Json>(filePath(key, "ru"))).data;
    kk = (await readJson<Json>(filePath(key, "kk"))).data;
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

    /* Файлы перечитываем перед записью: sha из них подтверждает, что с
       момента открытия экрана никто не сохранил свою версию поверх */
    for (const lang of ["ru", "kk"] as const) {
      const path = filePath(key as PageKey, lang);
      const { data, sha } = await readJson<Json>(path);
      const next = rebuild(data, "", formData, lang);
      await writeJson(path, next, `Изменены тексты: ${PAGES[key as PageKey].title}`, sha);
    }
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
      {error ? <p className="msg msg--err">Не удалось сохранить. Попробуйте ещё раз.</p> : null}

      {ru ? (
        <form action={save}>
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

/** Образец пункта с пустыми полями — строка формы для нового элемента */
function blank(sample: Json): Json {
  if (typeof sample === "string") return "";
  if (Array.isArray(sample)) return sample.length > 0 ? [blank(sample[0])] : [];
  if (sample && typeof sample === "object") {
    return Object.fromEntries(Object.entries(sample).map(([k, v]) => [k, blank(v)]));
  }
  return sample;
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

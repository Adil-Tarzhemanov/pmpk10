import Link from "next/link";
import { redirect } from "next/navigation";
import { isSignedIn, endSession } from "@/lib/auth";
import { listDir, readJson } from "@/lib/github";
import { Chrome } from "../chrome";

export const dynamic = "force-dynamic";

type News = { date: string; dateLabel: string; title: string; summary: string };

/**
 * Список новостей.
 *
 * Русская и казахская версии одной новости лежат в файлах с одинаковым
 * именем: так работает переключатель языка на сайте. Поэтому список
 * строится по русской папке, а рядом показывается, есть ли казахская —
 * иначе легко выложить новость наполовину и не заметить.
 */
export default async function NewsList() {
  if (!(await isSignedIn())) redirect("/login");

  async function signOut() {
    "use server";
    await endSession();
    redirect("/login");
  }

  let items: { slug: string; ru: News; hasKk: boolean }[] = [];
  let error = "";

  try {
    const [ruFiles, kkFiles] = await Promise.all([
      listDir("content/news/ru"),
      listDir("content/news/kk").catch(() => []),
    ]);
    const kkNames = new Set(kkFiles.map((f) => f.name));

    items = await Promise.all(
      ruFiles.map(async (f) => {
        const { data } = await readJson<News>(f.path);
        return { slug: f.name.replace(/\.json$/, ""), ru: data, hasKk: kkNames.has(f.name) };
      }),
    );
    items.sort((a, b) => b.ru.date.localeCompare(a.ru.date));
  } catch (e) {
    error = e instanceof Error ? e.message : "Не удалось загрузить новости";
  }

  return (
    <Chrome signOut={signOut} back={{ href: "/", label: "Все разделы" }}>
      <h1>Новости</h1>
      <p className="lede">Свежие показываются на главной странице сайта.</p>

      {error ? <p className="msg msg--err">{error}</p> : null}

      <p className="row">
        <Link className="btn btn--primary" href="/news/new">
          Добавить новость
        </Link>
      </p>

      {items.length === 0 && !error ? (
        <p className="msg msg--ok">
          Новостей пока нет. На сайте в этом месте написано, что они появятся позже.
        </p>
      ) : null}

      <ul className="list" style={{ marginTop: 18 }}>
        {items.map((item) => (
          <li key={item.slug}>
            <span className="list__main">
              <strong>{item.ru.title}</strong>
              <span className="list__date">
                {item.ru.dateLabel}
                {item.hasKk ? "" : " · нет казахской версии"}
              </span>
            </span>
            <Link className="btn btn--ghost" href={`/news/${item.slug}`}>
              Изменить
            </Link>
          </li>
        ))}
      </ul>
    </Chrome>
  );
}

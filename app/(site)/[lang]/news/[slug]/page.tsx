import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { NotFoundBody } from "@/components/NotFoundBody";
import { Band } from "@/components/ui";
import { getNews, getNewsItem } from "@/lib/content";
import { getDictionary } from "@/lib/dictionary";
import {
  htmlLang,
  isLocale,
  locales,
  ogLocale,
  path,
  type Locale,
} from "@/lib/i18n";
import { absoluteUrl } from "@/lib/site";

/**
 * Адреса всех новостей на обоих языках известны на этапе сборки, поэтому
 * возвращаем сразу полный список пар «язык + новость». Slug у русской и
 * казахской версии одинаковый — иначе переключатель языка на странице
 * новости уводил бы в никуда.
 *
 * Пока новостей нет, список пуст, а при output: "export" пустой массив
 * роняет сборку: хотя бы один адрес обязан быть. Отдаём заглушечный slug —
 * страница по нему вызовет notFound() и отдаст обычную 404. Как только
 * заказчица добавит первую новость через CMS, заглушка исчезнет сама,
 * и вручную возвращать этот маршрут не придётся.
 */
const NO_NEWS_PLACEHOLDER = "net-novostey";

/* Новость может выйти на одном языке раньше, чем на другом: админка
   разрешает сохранить её без перевода. Страница нужна на обоих языках
   всё равно — на неё ведёт переключатель языка, и без неё посетитель
   получил бы 404. Там, где перевода нет, она отправляет к оригиналу. */
const allSlugs = () => [...new Set(locales.flatMap((l) => getNews(l).map((item) => item.slug)))];

export function generateStaticParams() {
  const slugs = allSlugs();
  return locales.flatMap((lang) =>
    (slugs.length > 0 ? slugs : [NO_NEWS_PLACEHOLDER]).map((slug) => ({ lang, slug })),
  );
}

/** Язык, на котором новость есть, если на этом её нет */
const otherLocale = (lang: Locale, slug: string) =>
  locales.find((l) => l !== lang && getNewsItem(l, slug));

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/news/[slug]">): Promise<Metadata> {
  const { lang, slug } = await params;
  if (!isLocale(lang)) return {};

  const item = getNewsItem(lang, slug);
  if (!item) return { robots: { index: false, follow: false } };

  const route = `/news/${slug}`;
  const translated = locales.filter((l) => getNewsItem(l, slug));
  return {
    title: item.title,
    description: item.summary,
    openGraph: {
      type: "article",
      title: item.title,
      description: item.summary,
      publishedTime: item.date,
      url: absoluteUrl(path(lang, route)),
      locale: ogLocale[lang],
    },
    alternates: {
      canonical: absoluteUrl(path(lang, route)),
      languages: Object.fromEntries(
        translated.map((l) => [htmlLang[l], absoluteUrl(path(l, route))]),
      ),
    },
  };
}

export default async function NewsItemPage({
  params,
}: PageProps<"/[lang]/news/[slug]">) {
  const { lang, slug } = await params;
  if (!isLocale(lang)) notFound();

  const dict = getDictionary(lang);
  const item = getNewsItem(lang, slug);
  if (!item) {
    const other = otherLocale(lang, slug);
    if (!other) return <NotFoundBody />;
    return (
      <Band>
        <div style={{ maxWidth: "60ch" }}>
          <h1 style={{ marginBlock: "0 16px" }}>{dict.news.onlyOther}</h1>
          <p style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 28 }}>
            <Link className="btn btn--primary" href={path(other, `/news/${slug}`)} hrefLang={other}>
              {dict.news.openOther}
            </Link>
            <Link className="btn btn--ghost" href={path(lang, "/news")}>
              {dict.common.backToNews}
            </Link>
          </p>
        </div>
      </Band>
    );
  }

  return (
    <Band>
      <article style={{ maxWidth: "68ch" }}>
        <p className="eyebrow">
          {dict.common.published}{" "}
          <time dateTime={item.date}>{item.dateLabel}</time>
        </p>
        <h1 style={{ fontSize: "clamp(1.75rem, 1.3rem + 1.6vw, 2.5rem)", marginBlock: "12px 20px" }}>
          {item.title}
        </h1>
        <p className="lede">{item.summary}</p>

        <div className="prose">
          {item.body.map((paragraph) => (
            <p key={paragraph.slice(0, 40)}>{paragraph}</p>
          ))}
        </div>

        <p style={{ marginTop: 32 }}>
          <Link className="btn btn--ghost" href={path(lang, "/news")}>
            ← {dict.common.backToNews}
          </Link>
        </p>
      </article>
    </Band>
  );
}

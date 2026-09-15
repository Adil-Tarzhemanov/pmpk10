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

export function generateStaticParams() {
  const params = locales.flatMap((lang) =>
    getNews(lang).map((item) => ({ lang, slug: item.slug })),
  );

  return params.length > 0
    ? params
    : locales.map((lang) => ({ lang, slug: NO_NEWS_PLACEHOLDER }));
}

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/news/[slug]">): Promise<Metadata> {
  const { lang, slug } = await params;
  if (!isLocale(lang)) return {};

  const item = getNewsItem(lang, slug);
  if (!item) return { robots: { index: false, follow: false } };

  const route = `/news/${slug}`;
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
        locales.map((l) => [htmlLang[l], absoluteUrl(path(l, route))]),
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
  if (!item) return <NotFoundBody />;

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

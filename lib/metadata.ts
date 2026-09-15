import type { Metadata } from "next";
import { getDictionary } from "@/lib/dictionary";
import type { PageKey } from "@/lib/dictionary/types";
import { htmlLang, isLocale, locales, ogLocale, path } from "@/lib/i18n";
import { absoluteUrl } from "@/lib/site";

/**
 * Метатеги страницы: заголовок, описание, canonical и hreflang.
 *
 * hreflang обязателен для двуязычного сайта — он говорит поисковику, что
 * /ru/documents и /kk/documents это одна страница на двух языках, а не
 * дубликаты, за которые понижают выдачу.
 */
export function buildPageMetadata(
  lang: string,
  key: PageKey,
  route: string,
): Metadata {
  if (!isLocale(lang)) return {};

  const meta = getDictionary(lang).meta[key];

  return {
    title: meta.title,
    description: meta.description,
    openGraph: {
      title: meta.title,
      description: meta.description,
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

import type { MetadataRoute } from "next";
import { getNews } from "@/lib/content";
import { htmlLang, locales, path } from "@/lib/i18n";
import { pageUrl } from "@/lib/site";

/**
 * Карта сайта. При статическом экспорте собирается один раз при сборке и
 * попадает в out/sitemap.xml — отдавать её умеет любой веб-сервер.
 *
 * У каждого адреса перечислены языковые версии (alternates): так поисковик
 * понимает, что русская и казахская страницы — одна и та же, а не дубли.
 */
/* robots.txt и sitemap.xml — это route handlers. При output: "export"
   им нужно явно сказать, что ответ статический: иначе сборка считает,
   что обработчик может зависеть от запроса, и падает. */
export const dynamic = "force-static";

const staticRoutes = [
  "/",
  "/about",
  "/documents",
  "/news",
  "/anticorruption",
  "/vacancies",
  "/contacts",
];

const alternatesFor = (route: string) => ({
  languages: Object.fromEntries(
    locales.map((locale) => [htmlLang[locale], pageUrl(path(locale, route))]),
  ),
});

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = locales.flatMap((locale) =>
    staticRoutes.map((route) => ({
      url: pageUrl(path(locale, route)),
      changeFrequency: (route === "/news" ? "weekly" : "monthly") as
        | "weekly"
        | "monthly",
      priority: route === "/" ? 1 : 0.7,
      alternates: alternatesFor(route),
    })),
  );

  const news = locales.flatMap((locale) =>
    getNews(locale).map((item) => {
      const route = `/news/${item.slug}`;
      return {
        url: pageUrl(path(locale, route)),
        lastModified: item.date,
        changeFrequency: "yearly" as const,
        priority: 0.5,
        alternates: alternatesFor(route),
      };
    }),
  );

  return [...pages, ...news];
}

/**
 * Базовый адрес сайта. Нужен для canonical, hreflang, Open Graph и
 * sitemap.xml — там требуются абсолютные ссылки.
 *
 * Домен для ПМПК № 10 ещё не выбран (в ТЗ по ошибке указан rgurpo.kz из
 * чужого документа). Пока указывает на демо-адрес; когда домен купят,
 * достаточно задать NEXT_PUBLIC_SITE_URL при сборке — код менять не нужно.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://pmpk10-demo.vercel.app"
).replace(/\/$/, "");

/**
 * Демо-сборка на *.vercel.app. Такую версию нельзя пускать в индекс:
 * на ней настоящие телефон, почта и адрес учреждения, а домен чужой.
 * Попав в выдачу, демо стало бы дублем будущего официального сайта и
 * отбирало бы у него позиции. Как только сборка пойдёт с настоящим
 * доменом (NEXT_PUBLIC_SITE_URL), индексация откроется сама.
 */
export const IS_PREVIEW = /\.vercel\.app$/.test(SITE_URL);

export const absoluteUrl = (route: string) =>
  `${SITE_URL}${route.startsWith("/") ? route : `/${route}`}`;

/**
 * Адрес страницы со слешем на конце — именно так их отдаёт сборка
 * (trailingSlash: true). Нужен там, где Next не нормализует ссылку сам:
 * в sitemap.xml. Для файлов вроде /sitemap.xml берите absoluteUrl.
 */
export const pageUrl = (route: string) => {
  const url = absoluteUrl(route);
  return url.endsWith("/") ? url : `${url}/`;
};

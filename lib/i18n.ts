/**
 * Языки сайта. По ТЗ казахский и русский равноправны, поэтому у каждого
 * свой префикс в адресе (/ru/..., /kk/...) — ни один не «главный».
 * Отдельные адреса нужны и для SEO: у каждой языковой версии свои
 * title, description и canonical.
 */
export const locales = ["ru", "kk"] as const;

export type Locale = (typeof locales)[number];

/** Куда ведёт корень сайта, если язык определить не удалось */
export const defaultLocale: Locale = "ru";

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

/** Значение атрибута lang у <html> */
export const htmlLang: Record<Locale, string> = {
  ru: "ru",
  kk: "kk",
};

/** Значение og:locale для соцсетей и мессенджеров */
export const ogLocale: Record<Locale, string> = {
  ru: "ru_RU",
  kk: "kk_KZ",
};

/** Подпись на переключателе языков */
export const localeLabel: Record<Locale, string> = {
  ru: "РУС",
  kk: "ҚАЗ",
};

/** Собирает адрес внутри нужной языковой версии: path('kk', '/documents') → '/kk/documents' */
export function path(locale: Locale, route: string): string {
  return route === "/" ? `/${locale}` : `/${locale}${route}`;
}

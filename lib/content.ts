import fs from "node:fs";
import path from "node:path";
import type { Locale } from "@/lib/i18n";

/**
 * Контент лежит обычными JSON-файлами в content/. Это сделано под второй
 * этап с Decap CMS: у неё git-бэкенд, она правит ровно эти файлы и коммитит
 * их в репозиторий. Базы данных и серверной админки нет — ломать и хостить
 * отдельно нечего.
 *
 * Читаем через fs, а не import: когда редактор добавит через CMS новую
 * новость, она подхватится следующей сборкой сама, без правок кода.
 */
const CONTENT_DIR = path.join(process.cwd(), "content");

function readJson<T>(...segments: string[]): T {
  const file = path.join(CONTENT_DIR, ...segments);
  return JSON.parse(fs.readFileSync(file, "utf8")) as T;
}

/* ---------------------------------------------------------------- Организация */

export type SiteContent = {
  legalName: string;
  shortName: string;
  authority: string;
  address: string;
  addressTbd: boolean;
  /** Точка на карте. verified — подтвердил ли заказчик, что пин стоит верно */
  geo: { lat: number; lon: number; zoom: number; verified: boolean };
  phone: string;
  phoneTbd: boolean;
  phoneHref: string;
  whatsapp: string;
  whatsappTbd: boolean;
  email: string;
  emailTbd: boolean;
  hours: string;
  /** Часы приёма детей — они короче рабочего дня и заканчиваются до обеда */
  reception: string;
  hoursShort: string;
  bookingUrl: string;
  links: { label: string; href: string; note: string }[];
};

export const getSite = (locale: Locale) =>
  readJson<SiteContent>("site", `${locale}.json`);

/* ------------------------------------------------------------------- Главная */

export type HomeContent = {
  hero: {
    eyebrow: string;
    title: string;
    lede: string;
    facts: { value: string; label: string }[];
  };
  booking: {
    eyebrow: string;
    title: string;
    when: string;
    whenStrong: string;
    whenTail: string;
    cta: string;
    howCta: string;
    note: string;
    docsCta: string;
  };
  /** Пошаговая инструкция по записи через birge.astana.kz */
  online: {
    eyebrow: string;
    title: string;
    lede: string;
    phoneNote: string;
    steps: string[];
    moreCta: string;
  };
  steps: {
    eyebrow: string;
    title: string;
    lede: string;
    items: { n: string; title: string; text: string }[];
  };
  papers: {
    eyebrow: string;
    title: string;
    /** note — что нести: оригинал, копию или и то и другое */
    items: { text: string; note: string }[];
    note: string;
  };
  services: {
    eyebrow: string;
    title: string;
    items: { title: string; text: string }[];
  };
  linksBlock: { eyebrow: string; title: string };
  newsBlock: { eyebrow: string; title: string };
};

export const getHome = (locale: Locale) =>
  readJson<HomeContent>("pages", `home.${locale}.json`);

/* --------------------------------------------------------------------- О нас */

export type AboutContent = {
  eyebrow: string;
  title: string;
  lede: string;
  mission: { eyebrow: string; text: string };
  goals: { title: string; items: string[] };
  functions: { eyebrow: string; title: string; items: string[] };
  staff: {
    title: string;
    people: { role: string; note: string; noteTbd?: boolean }[];
    note: string;
  };
};

export const getAbout = (locale: Locale) =>
  readJson<AboutContent>("pages", `about.${locale}.json`);

/* ---------------------------------------------------------------- Документы */

export type DocumentItem = {
  title: string;
  meta: string;
  href: string;
  tbd?: string;
};

export type DocumentsContent = {
  eyebrow: string;
  title: string;
  lede: string;
  groups: { title: string; items: DocumentItem[] }[];
  note: { title: string; text: string };
};

export const getDocuments = (locale: Locale) =>
  readJson<DocumentsContent>("documents", `${locale}.json`);

/* --------------------------------------------------- Противодействие коррупции */

export type AnticorruptionContent = {
  eyebrow: string;
  title: string;
  lede: string;
  channels: { label: string; value: string; tbd?: string; note: string }[];
  memo: { title: string; items: string[] };
  reports: { title: string; items: DocumentItem[]; note: string };
};

export const getAnticorruption = (locale: Locale) =>
  readJson<AnticorruptionContent>("pages", `anticorruption.${locale}.json`);

/* ----------------------------------------------------------------- Вакансии */

export type VacanciesContent = {
  eyebrow: string;
  title: string;
  lede: string;
  items: {
    role: string;
    chips: string[];
    requirementsTitle: string;
    requirements: string[];
    offerTitle: string;
    offer: string[];
  }[];
  empty: string;
};

export const getVacancies = (locale: Locale) =>
  readJson<VacanciesContent>("vacancies", `${locale}.json`);

/* ------------------------------------------------------------------ Новости */

export type NewsItem = {
  slug: string;
  date: string;
  dateLabel: string;
  title: string;
  summary: string;
  /** Фотография из CMS. Без неё карточка получает узор из illustrations */
  image?: string;
  body: string[];
};

/** Новости, отсортированные от свежих к старым */
export function getNews(locale: Locale): NewsItem[] {
  const dir = path.join(CONTENT_DIR, "news", locale);
  if (!fs.existsSync(dir)) return [];

  return fs
    .readdirSync(dir)
    .filter((name) => name.endsWith(".json"))
    .map((name) => ({
      slug: name.replace(/\.json$/, ""),
      ...readJson<Omit<NewsItem, "slug">>("news", locale, name),
    }))
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function getNewsItem(locale: Locale, slug: string): NewsItem | null {
  return getNews(locale).find((item) => item.slug === slug) ?? null;
}

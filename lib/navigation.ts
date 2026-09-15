import type { NavKey } from "@/lib/dictionary/types";

/**
 * Главное меню повторяет обязательную структуру сайта из п. 2 ТЗ.
 * Раздела «Обратная связь» нет: заказчица просила убрать форму, вопросы
 * принимаются по телефону и почте со страницы контактов.
 */
export const mainNav: { key: NavKey; route: string }[] = [
  { key: "home", route: "/" },
  { key: "about", route: "/about" },
  { key: "documents", route: "/documents" },
  { key: "news", route: "/news" },
  { key: "anticorruption", route: "/anticorruption" },
  { key: "vacancies", route: "/vacancies" },
  { key: "contacts", route: "/contacts" },
];

/** Колонка «Разделы» в подвале */
export const footerSections: { key: NavKey; route: string }[] = [
  { key: "about", route: "/about" },
  { key: "documents", route: "/documents" },
  { key: "news", route: "/news" },
  { key: "contacts", route: "/contacts" },
];

/** Колонка «Открытость» в подвале */
export const footerOpenness: { key: NavKey; route: string }[] = [
  { key: "anticorruption", route: "/anticorruption" },
  { key: "vacancies", route: "/vacancies" },
];

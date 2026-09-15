/**
 * Словарь интерфейса: подписи меню, кнопок и служебных панелей.
 * Здесь лежит только то, что не редактируется заказчиком через CMS —
 * тексты разделов вынесены в content/*.json.
 */
export type Dictionary = {
  /** Заголовки и описания страниц для <head> */
  meta: Record<PageKey, { title: string; description: string }>;

  topbar: {
    official: string;
    a11yToggle: string;
    langGroup: string;
  };

  a11y: {
    fontSize: string;
    scheme: string;
    schemeNormal: string;
    schemeInverse: string;
    off: string;
    barLabel: string;
  };

  masthead: {
    skipToContent: string;
    menu: string;
    callAria: string;
    navLabel: string;
    home: string;
  };

  nav: Record<NavKey, string>;

  footer: {
    tagline: string;
    sections: string;
    openness: string;
    resources: string;
    copyright: string;
    bin: string;
  };

  news: {
    /** Показывается, пока в content/news/ нет ни одной новости */
    empty: string;
  };

  contacts: {
    heading: string;
    address: string;
    phone: string;
    whatsapp: string;
    email: string;
    hours: string;
    reception: string;
    mapTitle: string;
    route: string;
    pinTbd: string;
    more: string;
  };

  common: {
    readMore: string;
    allNews: string;
    backToNews: string;
    download: string;
    tbd: string;
    published: string;
    moreInSection: string;
  };
};

export type NavKey =
  | "home"
  | "about"
  | "services"
  | "news"
  | "documents"
  | "anticorruption"
  | "vacancies"
  | "contacts";

export type PageKey =
  | "home"
  | "about"
  | "documents"
  | "news"
  | "anticorruption"
  | "vacancies"
  | "contacts";

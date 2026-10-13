/**
 * Тексты страниц сайта: «О нас», главная, противодействие коррупции.
 *
 * Отдельного экрана на каждую страницу здесь нет и не будет: форма
 * строится по самому JSON. Полей в этих файлах под четыре сотни, они
 * разной вложенности, и руками расписать их — значит переписывать
 * админку при каждой правке текста на сайте.
 *
 * Отсюда и ограничение: структуру файла редактор не меняет. Можно
 * поправить текст, добавить пункт в список и убрать пункт. Завести новый
 * раздел страницы нельзя — это уже вёрстка, а не текст.
 */

export type Json = string | number | boolean | null | Json[] | { [key: string]: Json };

export type PageKey = "about" | "home" | "anticorruption";

export const PAGES: Record<PageKey, { title: string; hint: string }> = {
  about: {
    title: "О нас",
    hint: "Миссия, цели, функции учреждения и состав специалистов",
  },
  home: {
    title: "Главная",
    hint: "Первый экран, порядок записи, направления работы, шаги приёма",
  },
  anticorruption: {
    title: "Противодействие коррупции",
    hint: "Текст раздела и порядок обращения",
  },
};

export const isPageKey = (value: string): value is PageKey => value in PAGES;

export const filePath = (key: PageKey, lang: "ru" | "kk") =>
  `content/pages/${key}.${lang}.json`;

/** Подписи вместо английских ключей: редактор их читает, а не разработчик */
const LABELS: Record<string, string> = {
  eyebrow: "Надзаголовок",
  title: "Заголовок",
  lede: "Вступление",
  text: "Текст",
  note: "Примечание",
  items: "Пункты",
  people: "Специалисты",
  steps: "Шаги",
  role: "Должность",
  name: "ФИО",
  n: "Номер шага",
  cta: "Надпись на кнопке",
  label: "Надпись",
  summary: "Краткое описание",
  question: "Вопрос",
  answer: "Ответ",
};

export const label = (key: string) => LABELS[key] ?? key;

/** Образец пункта с пустыми полями — строка формы для нового элемента */
export function blank(sample: Json): Json {
  if (typeof sample === "string") return "";
  if (Array.isArray(sample)) return sample.length > 0 ? [blank(sample[0])] : [];
  if (sample && typeof sample === "object") {
    return Object.fromEntries(Object.entries(sample).map(([k, v]) => [k, blank(v)]));
  }
  return sample;
}

/**
 * Пункт пуст на обоих языках. Решать по одному языку нельзя: пункт,
 * заполненный только по-русски, попал бы в русский файл и не попал в
 * казахский, списки разошлись бы на одну позицию, и дальше каждому
 * русскому пункту в форме стоял бы в пару чужой казахский.
 *
 * Пункт без текстовых полей в форме (только числа и флаги) пустым не
 * считается: редактор его не видит и стереть не мог.
 */
function blankInForm(form: FormData, path: string): boolean {
  let found = false;
  for (const [name, value] of form.entries()) {
    const field = name.replace(/^(ru|kk)::/, "");
    if (field === name || (field !== path && !field.startsWith(`${path}.`))) continue;
    found = true;
    if (String(value).trim() !== "") return false;
  }
  return found;
}

/**
 * Собрать новый JSON из формы, идя по старому.
 *
 * Старый файл здесь — образец структуры: какие поля есть и какого типа.
 * Из формы берутся только строки. Числа и флаги (координаты карты,
 * признаки «уточняется») редактор не показывает и не трогает: это
 * настройки, а не текст, и испортить их одной опечаткой слишком легко.
 */
export function rebuild(
  original: Json,
  path: string,
  form: FormData,
  lang: "ru" | "kk",
): Json {
  if (Array.isArray(original)) {
    const kept: Json[] = [];
    original.forEach((item, i) => {
      const at = `${path}.${i}`;
      if (form.get(`del::${at}`) || blankInForm(form, at)) return;
      kept.push(rebuild(item, at, form, lang));
    });
    // Последняя строка формы — пустая, для нового пункта. Её образец —
    // первый элемент списка без текста: по нему видно, из каких полей
    // состоит пункт, а его собственные строки в новый пункт не попадают.
    if (original.length > 0 && !blankInForm(form, `${path}.new`)) {
      kept.push(rebuild(blank(original[0]), `${path}.new`, form, lang));
    }
    return kept;
  }

  if (original && typeof original === "object") {
    const out: Record<string, Json> = {};
    for (const [key, value] of Object.entries(original)) {
      out[key] = rebuild(value, `${path}.${key}`, form, lang);
    }
    return out;
  }

  if (typeof original === "string") {
    const value = form.get(`${lang}::${path}`);
    return value === null ? original : String(value).replace(/\r\n/g, "\n").trim();
  }

  return original;
}

/** Значение по пути вида `mission.text` или `goals.items.2` */
export function at(data: Json, path: string): Json | undefined {
  let node: Json | undefined = data;
  for (const step of path.split(".").filter(Boolean)) {
    if (node === null || node === undefined || typeof node !== "object") return undefined;
    node = Array.isArray(node) ? node[Number(step)] : (node as Record<string, Json>)[step];
  }
  return node;
}

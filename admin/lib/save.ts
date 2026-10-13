import { ConflictError } from "@/lib/github";

/**
 * Что пошло не так при сохранении — код для адреса `?error=…`.
 *
 * Ошибка внутри server action без перехвата показывает редактору
 * стандартную страницу сбоя Next, и он не понимает, сохранилось ли
 * что-нибудь. Поэтому каждое сохранение ловит ошибку, а экран по коду
 * объясняет её человеческими словами.
 */
export type SaveError = "conflict" | "changed" | "failed" | "file";

export function errorCode(e: unknown): SaveError {
  if (e instanceof ConflictError) return "conflict";
  console.error(e);
  return "failed";
}

export const SAVE_MESSAGES: Record<SaveError, string> = {
  conflict:
    "Пока вы редактировали, кто-то уже сохранил свою версию. Обновите страницу и внесите правку ещё раз.",
  changed:
    "Список успел измениться в другой вкладке или у другого сотрудника. Обновите страницу и повторите.",
  failed: "Не удалось сохранить: сервер не ответил. Попробуйте ещё раз через минуту.",
  file: "Файл не подходит: он больше 4 МБ или такого формата нельзя выложить на сайт.",
};

export const isSaveError = (value: string | undefined): value is SaveError =>
  value !== undefined && value in SAVE_MESSAGES;

/**
 * Предел размера файла. Запрос на Vercel не может быть больше 4,5 МБ,
 * поэтому 4 МБ на сам файл плюс запас на остальные поля формы.
 * next.config.ts поднимает лимит server actions с 1 МБ до этого же уровня.
 */
export const MAX_UPLOAD = 4 * 1024 * 1024;

const IMAGE_TYPES = ["jpg", "jpeg", "png", "webp"];
/* Без html, svg и js: файл ляжет на домен сайта и откроется как его страница */
const DOCUMENT_TYPES = ["pdf", "doc", "docx", "xls", "xlsx", "odt", "rtf", ...IMAGE_TYPES];

export const extension = (name: string) =>
  name.includes(".") ? (name.split(".").pop() ?? "").toLowerCase() : "";

export function acceptable(file: File, kind: "image" | "document"): boolean {
  const allowed = kind === "image" ? IMAGE_TYPES : DOCUMENT_TYPES;
  return file.size > 0 && file.size <= MAX_UPLOAD && allowed.includes(extension(file.name));
}

export const ACCEPT = {
  image: IMAGE_TYPES.map((e) => `.${e}`).join(","),
  document: DOCUMENT_TYPES.map((e) => `.${e}`).join(","),
};

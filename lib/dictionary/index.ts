import type { Locale } from "@/lib/i18n";
import type { Dictionary } from "./types";
import { ru } from "./ru";
import { kk } from "./kk";

const dictionaries: Record<Locale, Dictionary> = { ru, kk };

/**
 * Словарь интерфейса для выбранного языка. Словари статические и лежат
 * в бандле сервера: страницы собираются на этапе сборки, в браузер
 * уезжает только готовый HTML нужного языка.
 */
export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}

export type { Dictionary } from "./types";

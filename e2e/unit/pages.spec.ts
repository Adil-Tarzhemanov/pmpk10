import { expect, test } from "@playwright/test";
import { rebuild, type Json } from "../../admin/lib/pages";

/**
 * Сборка JSON страницы из формы «Тексты страниц» (admin/lib/pages.ts).
 * Форма адресует поля путями вида `ru::goals.items.2`; удаление — галочкой
 * `del::goals.items.2`, новый пункт — строкой `…items.new`.
 */
const form = (fields: Record<string, string>) => {
  const data = new FormData();
  for (const [name, value] of Object.entries(fields)) data.set(name, value);
  return data;
};

const ru: Json = { title: "Цели", items: ["Первая", "Вторая"], flag: true, n: 3 };
const kk: Json = { title: "Мақсаттар", items: ["Бірінші", "Екінші"], flag: true, n: 3 };

const both = (fields: Record<string, string>) => {
  const data = form(fields);
  return { ru: rebuild(ru, "", data, "ru"), kk: rebuild(kk, "", data, "kk") };
};

const unchanged = {
  "ru::.title": "Цели", "kk::.title": "Мақсаттар",
  "ru::.items.0": "Первая", "kk::.items.0": "Бірінші",
  "ru::.items.1": "Вторая", "kk::.items.1": "Екінші",
  "ru::.items.new": "", "kk::.items.new": "",
};

test("без правок файл остаётся прежним, числа и флаги не трогаются", () => {
  expect(both(unchanged)).toEqual({ ru, kk });
});

test("галочка удаляет пункт на обоих языках", () => {
  const { ru: r, kk: k } = both({ ...unchanged, "del::.items.0": "on" });
  expect(r).toMatchObject({ items: ["Вторая"] });
  expect(k).toMatchObject({ items: ["Екінші"] });
});

test("пункт, добавленный только на русском, появляется в обоих списках", () => {
  // Раньше казахский список оставался короче, и дальше каждому русскому
  // пункту в форме стоял в пару чужой казахский
  const { ru: r, kk: k } = both({ ...unchanged, "ru::.items.new": "Третья" });
  expect(r).toMatchObject({ items: ["Первая", "Вторая", "Третья"] });
  expect(k).toMatchObject({ items: ["Бірінші", "Екінші", ""] });
});

test("пункт, стёртый только на одном языке, остаётся в обоих", () => {
  const { ru: r, kk: k } = both({ ...unchanged, "ru::.items.1": "" });
  expect(r).toMatchObject({ items: ["Первая", ""] });
  expect(k).toMatchObject({ items: ["Бірінші", "Екінші"] });
});

test("пункт, стёртый на обоих языках, убирается", () => {
  const { ru: r, kk: k } = both({ ...unchanged, "ru::.items.1": "", "kk::.items.1": "" });
  expect(r).toMatchObject({ items: ["Первая"] });
  expect(k).toMatchObject({ items: ["Бірінші"] });
});

test("новый пункт-объект не наследует текст первого пункта", () => {
  const people: Json = { people: [{ role: "Психолог", note: "Ведёт приём", tbd: false }] };
  const data = form({
    "ru::.people.0.role": "Психолог", "ru::.people.0.note": "Ведёт приём",
    "ru::.people.new.role": "Логопед", "ru::.people.new.note": "",
  });
  expect(rebuild(people, "", data, "ru")).toEqual({
    people: [
      { role: "Психолог", note: "Ведёт приём", tbd: false },
      { role: "Логопед", note: "", tbd: false },
    ],
  });
});

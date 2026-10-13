import { expect, test, type Page } from "@playwright/test";

/**
 * Собранный сайт из out/ — ровно то, что ляжет на хостинг. Ссылки и
 * картинки внутри страниц проверяет scripts/check-build.mjs без браузера;
 * здесь то, что видно только в браузере: язык, скрипты, вёрстка.
 */
const ROUTES = ["/", "/about/", "/documents/", "/news/", "/anticorruption/", "/vacancies/", "/contacts/"];
const LOCALES = ["ru", "kk"] as const;

function watchErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  return errors;
}

for (const lang of LOCALES) {
  for (const route of ROUTES) {
    const url = `/${lang}${route}`;
    test(`${url} открывается без ошибок и умещается в телефон`, async ({ page }) => {
      const errors = watchErrors(page);
      await page.setViewportSize({ width: 360, height: 740 });
      const response = await page.goto(url);
      expect(response?.status()).toBe(200);

      await expect(page.locator("html")).toHaveAttribute("lang", lang);
      await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
      expect(await page.title()).not.toBe("");

      // ТЗ: вёрстка корректна на телефоне — ничего не вылезает вбок
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow).toBeLessThanOrEqual(0);
      expect(errors).toEqual([]);
    });
  }
}

test("переключатель языка ведёт на ту же страницу", async ({ page }) => {
  await page.goto("/ru/vacancies/");
  await page.getByRole("group", { name: "Язык сайта" }).getByRole("link", { name: "ҚАЗ" }).click();
  await expect(page).toHaveURL(/\/kk\/vacancies\/$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "kk");
});

test("корень ведёт на версию по языку браузера", async ({ browser }) => {
  for (const [locale, expected] of [["ru-RU", /\/ru\/$/], ["kk-KZ", /\/kk\/$/]] as const) {
    const context = await browser.newContext({ locale });
    const page = await context.newPage();
    await page.goto("/");
    await expect(page).toHaveURL(expected);
    await context.close();
  }
});

test("несуществующий адрес отдаёт 404 со ссылками на обе версии", async ({ page }) => {
  const response = await page.goto("/ru/net-takoy-stranicy/");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: /Страница не найдена/ })).toBeVisible();
  await expect(page.getByRole("link", { name: "На главную" })).toHaveAttribute("href", "/ru/");
  await expect(page.getByRole("link", { name: "Басты бетке" })).toHaveAttribute("href", "/kk/");
});

test("версия для слабовидящих включается и сохраняется между страницами", async ({ page }) => {
  await page.goto("/ru/");
  await page.getByRole("button", { name: "Для слабовидящих" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-a11y", "on");
  await page.getByRole("button", { name: "A++" }).click();

  await page.goto("/ru/contacts/");
  await expect(page.locator("html")).toHaveAttribute("data-a11y", "on");
  await expect(page.getByRole("button", { name: "A++" })).toHaveAttribute("aria-pressed", "true");

  await page.getByRole("button", { name: "Обычная версия" }).click();
  await expect(page.locator("html")).not.toHaveAttribute("data-a11y", "on");
});

test("ссылка «перейти к содержимому» есть для клавиатуры", async ({ page }) => {
  await page.goto("/ru/");
  await page.keyboard.press("Tab");
  const focused = page.locator(":focus");
  await expect(focused).toHaveAttribute("href", /#/);
});

import { expect, test, type Browser, type Page } from "@playwright/test";
import { ADMIN_PASSWORD, GITHUB_URL } from "./env";

/**
 * Админка против поддельного GitHub (e2e/fake-github.mjs): каждый тест
 * начинает с копии content/ и смотрит, что именно легло в «репозиторий».
 *
 * Первая часть — обычная работа редактора. Вторая — ошибки, найденные
 * проверкой 12.10.2026 (docs/reviews/2026-10-12-proverka.md), чтобы они
 * не вернулись.
 */

type Commit = { method: string; path: string; message: string };

async function github<T = unknown>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${GITHUB_URL}${path}`, init);
  return (await res.json()) as T;
}

/** Файл «репозитория» как JSON, или null, если его нет */
async function repoFile<T = Record<string, unknown>>(path: string): Promise<T | null> {
  const res = await fetch(`${GITHUB_URL}/repos/e2e/pmpk10/contents/${path}`);
  if (res.status === 404) return null;
  const { content } = (await res.json()) as { content: string };
  return JSON.parse(Buffer.from(content, "base64").toString("utf8")) as T;
}

/** Изменить файл в обход админки — как будто его сохранили из другой вкладки */
async function changeBehindTheBack(path: string, edit: (data: Record<string, unknown>) => void) {
  const data = (await repoFile(path))!;
  edit(data);
  await fetch(`${GITHUB_URL}/__write?path=${encodeURIComponent(path)}`, {
    method: "POST",
    body: JSON.stringify(data, null, 2) + "\n",
  });
}

const commits = () => github<Commit[]>("/__commits");

async function signIn(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Пароль").fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Войти" }).click();
  await expect(page.getByRole("heading", { name: "Что нужно изменить?" })).toBeVisible();
}

/** Вторая вкладка того же редактора */
async function secondTab(browser: Browser, page: Page): Promise<Page> {
  const context = await browser.newContext({ storageState: await page.context().storageState() });
  return context.newPage();
}

const accept = (page: Page) => page.once("dialog", (d) => d.accept());
const dismiss = (page: Page) => page.once("dialog", (d) => d.dismiss());

test.beforeEach(async () => {
  await github("/__reset", { method: "POST" });
});

/* ------------------------------------------------------- Работа редактора */

test.describe("работа редактора", () => {
  test("без входа любой экран ведёт на вход; неверный пароль не пускает", async ({ page }) => {
    await page.goto("/news");
    await expect(page).toHaveURL(/\/login$/);
    await page.getByLabel("Пароль").fill("не тот пароль");
    await page.getByRole("button", { name: "Войти" }).click();
    await expect(page.locator("p[role=alert]")).toHaveText(/Неверный пароль/);
  });

  test("новость на двух языках: создать, найти в списке, удалить", async ({ page }) => {
    await signIn(page);
    await page.getByRole("link", { name: /Новости/ }).click();
    await page.getByRole("link", { name: "Добавить новость" }).click();
    await page.getByLabel("Дата").fill("2026-09-15");
    await page.getByLabel("Заголовок").fill("День открытых дверей");
    await page.getByLabel("Краткое описание").fill("Приглашаем родителей.");
    await page.getByLabel("Текст новости").fill("Первый абзац.\n\nВторой абзац.");
    await page.getByLabel("Тақырып").fill("Ашық есік күні");
    await page.getByRole("button", { name: "Сохранить" }).click();

    await expect(page.getByText("День открытых дверей")).toBeVisible();
    const ru = await repoFile("content/news/ru/den-otkrytyh-dverey.json");
    expect(ru).toMatchObject({
      date: "2026-09-15",
      dateLabel: "15 сентября 2026",
      body: ["Первый абзац.", "Второй абзац."],
    });
    expect(await repoFile("content/news/kk/den-otkrytyh-dverey.json")).toMatchObject({ title: "Ашық есік күні" });

    await page.getByRole("link", { name: "Изменить" }).click();
    dismiss(page);
    await page.getByRole("button", { name: "Удалить новость" }).click();
    expect(await repoFile("content/news/ru/den-otkrytyh-dverey.json")).not.toBeNull();

    accept(page);
    await page.getByRole("button", { name: "Удалить новость" }).click();
    await expect(page.getByText("Новостей пока нет")).toBeVisible();
    expect(await repoFile("content/news/ru/den-otkrytyh-dverey.json")).toBeNull();
    expect(await repoFile("content/news/kk/den-otkrytyh-dverey.json")).toBeNull();
  });

  test("контакты меняются в обоих языках, кнопка звонка выводится из телефона", async ({ page }) => {
    await signIn(page);
    await page.goto("/contacts");
    await page.getByLabel("Телефон").fill("8 (7172) 55-66-77");
    await page.getByLabel("Мекенжай").fill("Астана, Есіл ауданы");
    await page.getByRole("button", { name: "Сохранить" }).click();
    await expect(page.getByText("Сохранено.")).toBeVisible();

    const ru = await repoFile("content/site/ru.json");
    const kk = await repoFile("content/site/kk.json");
    expect(ru).toMatchObject({ phone: "8 (7172) 55-66-77", phoneHref: "+77172556677" });
    expect(kk).toMatchObject({ phone: "8 (7172) 55-66-77", address: "Астана, Есіл ауданы" });
  });

  test("документ выкладывается с казахским названием и убирается после вопроса", async ({ page }) => {
    await signIn(page);
    await page.goto("/documents");
    await page.getByLabel("Название", { exact: true }).fill("Положение о консультации");
    await page.getByLabel("Атауы (на казахском)").fill("Консультация туралы ереже");
    await page.getByLabel("В какой раздел").selectOption({ label: "Документы учреждения" });
    await page.getByLabel("Файл").setInputFiles({ name: "polozhenie.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4 test") });
    await page.getByRole("button", { name: "Выложить" }).click();
    await expect(page.getByText("Сохранено.")).toBeVisible();

    const ru = await repoFile<{ groups: { items: { title: string; href: string; meta: string }[] }[] }>("content/documents/ru.json");
    const kk = await repoFile<{ groups: { items: { title: string; href: string }[] }[] }>("content/documents/kk.json");
    const added = ru!.groups[2].items.at(-1)!;
    expect(added).toMatchObject({ title: "Положение о консультации", meta: "PDF · 0 КБ" });
    expect(kk!.groups[2].items.at(-1)).toEqual({ title: "Консультация туралы ереже", meta: added.meta, href: added.href });
    expect((await commits()).some((c) => c.path === `public${added.href}`)).toBe(true);

    accept(page);
    await page.getByRole("listitem").filter({ hasText: "Положение о консультации" }).getByRole("button", { name: "Убрать" }).click();
    await expect(page.getByText("Сохранено.")).toBeVisible();
    expect((await repoFile<{ groups: { items: unknown[] }[] }>("content/documents/ru.json"))!.groups[2].items).toHaveLength(2);
  });

  test("вакансия открывается на обоих языках и закрывается", async ({ page }) => {
    await signIn(page);
    await page.goto("/vacancies");
    await page.getByLabel("Должность").fill("Логопед");
    await page.getByLabel("Условия").fill("Полная занятость\nОпыт от 1 года");
    await page.getByLabel("Лауазымы").fill("Логопед");
    await page.getByRole("button", { name: "Открыть вакансию" }).click();
    await expect(page.getByText("Сохранено.")).toBeVisible();
    expect(await repoFile("content/vacancies/kk.json")).toMatchObject({
      items: [{ role: "Логопед", requirementsTitle: "Талаптар" }],
    });

    accept(page);
    await page.getByRole("button", { name: "Закрыть" }).click();
    await expect(page.getByText("Сейчас открытых вакансий нет.")).toBeVisible();
    expect(await repoFile("content/vacancies/ru.json")).toMatchObject({ items: [] });
  });

  test("тексты страницы: правка и новый пункт попадают в оба языка", async ({ page }) => {
    await signIn(page);
    await page.goto("/pages/about");
    await page.locator('textarea[name="ru::.goals.title"]').fill("Наши цели");
    await page.locator('textarea[name="ru::.goals.items.new"]').fill("Новая цель");
    await page.getByRole("button", { name: "Сохранить" }).click();
    await expect(page.getByText("Сохранено.")).toBeVisible();

    const ru = await repoFile<{ goals: { title: string; items: string[] } }>("content/pages/about.ru.json");
    const kk = await repoFile<{ goals: { items: string[] } }>("content/pages/about.kk.json");
    expect(ru!.goals.title).toBe("Наши цели");
    expect(ru!.goals.items.at(-1)).toBe("Новая цель");
    expect(kk!.goals.items).toHaveLength(ru!.goals.items.length);
  });
});

/* --------------------------------------- Ошибки проверки 12.10.2026 */

test.describe("ошибки, найденные проверкой", () => {
  test("фото больше 1 МБ загружается в новость", async ({ page }) => {
    await signIn(page);
    await page.goto("/news/new");
    await page.getByLabel("Дата").fill("2026-10-01");
    await page.getByLabel("Заголовок").fill("Новость с большим фото");
    await page.getByLabel("Фотография").setInputFiles({
      name: "foto.jpg", mimeType: "image/jpeg", buffer: Buffer.alloc(2 * 1024 * 1024, 1),
    });
    await page.getByRole("button", { name: "Сохранить" }).click();
    await expect(page).toHaveURL(/\/news$/);
    const ru = await repoFile<{ image: string }>("content/news/ru/novost-s-bolshim-foto.json");
    expect(ru!.image).toMatch(/^\/uploads\/\d+-foto\.jpg$/);
  });

  test("файл больше 4 МБ не уходит на сервер, редактор видит причину", async ({ page }) => {
    await signIn(page);
    await page.goto("/documents");
    await page.getByLabel("Название", { exact: true }).fill("Слишком большой");
    await page.getByLabel("Файл").setInputFiles({
      name: "big.pdf", mimeType: "application/pdf", buffer: Buffer.alloc(5 * 1024 * 1024, 1),
    });
    await page.getByRole("button", { name: "Выложить" }).click();
    expect(await page.getByLabel("Файл").evaluate((el: HTMLInputElement) => el.validationMessage)).toMatch(/больше 4 МБ/);
    expect(await commits()).toEqual([]);
  });

  test("файл, который откроется как страница сайта, не выкладывается", async ({ page }) => {
    await signIn(page);
    await page.goto("/documents");
    await page.getByLabel("Название", { exact: true }).fill("Страница");
    await page.getByLabel("Файл").setInputFiles({ name: "page.html", mimeType: "text/html", buffer: Buffer.from("<script>1</script>") });
    await page.getByRole("button", { name: "Выложить" }).click();
    await expect(page.locator("p[role=alert]")).toHaveText(/Файл не подходит/);
    expect(await commits()).toEqual([]);
  });

  test("вторая новость с тем же заголовком не затирает первую и не роняет экран", async ({ page }) => {
    await signIn(page);
    for (const summary of ["Первая", "Вторая"]) {
      await page.goto("/news/new");
      await page.getByLabel("Дата").fill("2026-06-01");
      await page.getByLabel("Заголовок").fill("График на лето");
      await page.getByLabel("Краткое описание").fill(summary);
      await page.getByRole("button", { name: "Сохранить" }).click();
      await expect(page).toHaveURL(/\/news$/);
    }
    expect(await repoFile("content/news/ru/grafik-na-leto.json")).toMatchObject({ summary: "Первая" });
    expect(await repoFile("content/news/ru/grafik-na-leto-2.json")).toMatchObject({ summary: "Вторая" });
  });

  test("у казахской версии новости дата прописью по-казахски и меняется вместе с датой", async ({ page }) => {
    await signIn(page);
    await page.goto("/news/new");
    await page.getByLabel("Дата").fill("2026-09-15");
    await page.getByLabel("Заголовок").fill("Семинар для родителей");
    await page.getByLabel("Тақырып").fill("Ата-аналарға семинар");
    await page.getByRole("button", { name: "Сохранить" }).click();
    await expect(page).toHaveURL(/\/news$/);
    expect(await repoFile("content/news/kk/seminar-dlya-roditeley.json")).toMatchObject({ dateLabel: "15 қыркүйек 2026" });

    await page.goto("/news/seminar-dlya-roditeley");
    await page.getByLabel("Дата").fill("2026-10-03");
    await page.getByRole("button", { name: "Сохранить" }).click();
    await expect(page).toHaveURL(/\/news$/);
    expect(await repoFile("content/news/kk/seminar-dlya-roditeley.json")).toMatchObject({ dateLabel: "3 қазан 2026" });
  });

  test("стёртый казахский заголовок снимает казахскую версию новости", async ({ page }) => {
    await signIn(page);
    await page.goto("/news/new");
    await page.getByLabel("Дата").fill("2026-09-20");
    await page.getByLabel("Заголовок").fill("Объявление");
    await page.getByLabel("Тақырып").fill("Хабарландыру");
    await page.getByRole("button", { name: "Сохранить" }).click();
    await expect(page).toHaveURL(/\/news$/);

    await page.goto("/news/obyavlenie");
    await page.getByLabel("Тақырып").fill("");
    await page.getByRole("button", { name: "Сохранить" }).click();
    await expect(page).toHaveURL(/\/news$/);
    await expect(page.getByText("нет казахской версии")).toBeVisible();
    expect(await repoFile("content/news/kk/obyavlenie.json")).toBeNull();
  });

  test("сбой GitHub при сохранении — понятное сообщение, а не страница сбоя", async ({ page }) => {
    await signIn(page);
    await page.goto("/contacts");
    await github("/__fail?status=502", { method: "POST" });
    await page.getByRole("button", { name: "Сохранить" }).click();
    await expect(page.locator("p[role=alert]")).toHaveText(/Не удалось сохранить/);
  });

  test("контакты, сохранённые в другой вкладке, не затираются", async ({ page }) => {
    await signIn(page);
    await page.goto("/contacts");
    await changeBehindTheBack("content/site/ru.json", (d) => { d.email = "other@edu.kz"; });

    await page.getByLabel("Телефон").fill("8 (7172) 00-00-00");
    await page.getByRole("button", { name: "Сохранить" }).click();
    await expect(page.locator("p[role=alert]")).toHaveText(/кто-то уже сохранил/);
    expect(await repoFile("content/site/ru.json")).toMatchObject({ email: "other@edu.kz" });
    expect(await commits()).toEqual([]);
  });

  test("тексты страницы, сохранённые в другой вкладке, не затираются", async ({ page, browser }) => {
    await signIn(page);
    await page.goto("/pages/about");
    const other = await secondTab(browser, page);
    await other.goto("/pages/about");
    await other.locator('input[name="del::.goals.items.0"]').check();
    await other.getByRole("button", { name: "Сохранить" }).click();
    await expect(other.getByText("Сохранено.")).toBeVisible();

    // В первой вкладке пункт 1 — всё ещё прежний второй пункт; после удаления
    // в другой вкладке под номером 1 стоит уже третий
    await page.locator('textarea[name="ru::.goals.items.1"]').fill("Правка второго пункта");
    await page.getByRole("button", { name: "Сохранить" }).click();
    await expect(page.locator("p[role=alert]")).toHaveText(/кто-то уже сохранил/);
    const ru = await repoFile<{ goals: { items: string[] } }>("content/pages/about.ru.json");
    expect(ru!.goals.items).not.toContain("Правка второго пункта");
  });

  test("документ, убранный в другой вкладке, не уводит удаление на соседний", async ({ page, browser }) => {
    await signIn(page);
    await page.goto("/documents");
    const other = await secondTab(browser, page);
    await other.goto("/documents");
    accept(other);
    await other.getByRole("listitem").filter({ hasText: "График приёма специалистов" }).getByRole("button", { name: "Убрать" }).click();
    await expect(other.getByText("Сохранено.")).toBeVisible();

    // В первой вкладке список старый: «Годовой отчёт» там второй, а в файле уже первый
    accept(page);
    await page.getByRole("listitem").filter({ hasText: "Годовой отчёт" }).getByRole("button", { name: "Убрать" }).click();
    await expect(page.locator("p[role=alert]")).toHaveText(/Список успел измениться/);
    const ru = await repoFile<{ groups: { items: { title: string }[] }[] }>("content/documents/ru.json");
    expect(ru!.groups[2].items.map((i) => i.title)).toEqual(["Годовой отчёт о деятельности за 2025 год"]);
  });

  test("вакансия, закрытая в другой вкладке, не уводит закрытие на соседнюю", async ({ page, browser }) => {
    await signIn(page);
    for (const role of ["Психолог", "Логопед"]) {
      await page.goto("/vacancies");
      await page.getByLabel("Должность").fill(role);
      await page.getByRole("button", { name: "Открыть вакансию" }).click();
      await expect(page.getByText("Сохранено.")).toBeVisible();
    }
    const other = await secondTab(browser, page);
    await other.goto("/vacancies");
    accept(other);
    await other.getByRole("listitem").filter({ hasText: "Психолог" }).getByRole("button", { name: "Закрыть" }).click();
    await expect(other.getByText("Сохранено.")).toBeVisible();

    accept(page);
    await page.getByRole("listitem").filter({ hasText: "Логопед" }).getByRole("button", { name: "Закрыть" }).click();
    await expect(page.locator("p[role=alert]")).toHaveText(/Список успел измениться/);
    expect(await repoFile("content/vacancies/ru.json")).toMatchObject({ items: [{ role: "Логопед" }] });
  });

  test("после пяти неверных паролей вход закрывается", async ({ browser }) => {
    // Свой адрес, чтобы счётчик не задел остальные тесты
    const context = await browser.newContext({ extraHTTPHeaders: { "x-forwarded-for": "10.0.0.99" } });
    const page = await context.newPage();
    for (let i = 0; i < 5; i++) {
      await page.goto("/login");
      await page.getByLabel("Пароль").fill(`неверный-${i}`);
      await page.getByRole("button", { name: "Войти" }).click();
      await expect(page.locator("p[role=alert]")).toHaveText(/Неверный пароль/);
    }
    await page.getByLabel("Пароль").fill(ADMIN_PASSWORD);
    await page.getByRole("button", { name: "Войти" }).click();
    await expect(page.locator("p[role=alert]")).toHaveText(/Вход закрыт на 15 минут/);
    await context.close();
  });
});

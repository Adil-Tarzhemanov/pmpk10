import { defineConfig, devices } from "@playwright/test";
import { ADMIN_PORT, ADMIN_URL, GITHUB_PORT, GITHUB_URL, SITE_PORT, SITE_URL, adminEnv } from "./e2e/env";

/**
 * Сквозные проверки (docs/testing.md):
 *   unit  — логика админки без браузера (сборка JSON из формы);
 *   site  — собранный сайт из out/, как его раздаст хостинг;
 *   admin — собранная админка против поддельного GitHub (e2e/fake-github.mjs).
 *
 * До запуска нужны обе сборки: `npm run build` и `npm run build --prefix admin`.
 * `npm run e2e` делает их сам.
 */
export default defineConfig({
  testDir: "./e2e",
  // Поддельный репозиторий один на все тесты админки: по одному, по порядку
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: { locale: "ru-RU", trace: "retain-on-failure" },
  projects: [
    { name: "unit", testMatch: /unit\/.*\.spec\.ts/ },
    { name: "site", testMatch: /site\.spec\.ts/, use: { ...devices["Desktop Chrome"], baseURL: SITE_URL } },
    { name: "admin", testMatch: /admin\.spec\.ts/, use: { ...devices["Desktop Chrome"], baseURL: ADMIN_URL } },
  ],
  webServer: [
    {
      command: "node e2e/serve-static.mjs",
      env: { SITE_PORT: String(SITE_PORT) },
      url: `${SITE_URL}/ru/`,
      reuseExistingServer: false,
    },
    {
      command: "node e2e/fake-github.mjs",
      env: { FAKE_GITHUB_PORT: String(GITHUB_PORT) },
      url: `${GITHUB_URL}/__health`,
      reuseExistingServer: false,
    },
    {
      command: `npm run start --prefix admin -- -p ${ADMIN_PORT} -H 127.0.0.1`,
      env: adminEnv,
      url: `${ADMIN_URL}/login`,
      reuseExistingServer: false,
      timeout: 120_000,
    },
  ],
});

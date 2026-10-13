import { scryptSync } from "node:crypto";

/**
 * Как запускаются сквозные тесты: сайт из out/, поддельный GitHub и
 * собранная админка, каждый на своём порту. Порты необычные, чтобы не
 * столкнуться с `next dev` (3000) и `npm run dev` админки (3100).
 */
export const SITE_PORT = 4310;
export const GITHUB_PORT = 4311;
export const ADMIN_PORT = 4312;

export const SITE_URL = `http://127.0.0.1:${SITE_PORT}`;
export const GITHUB_URL = `http://127.0.0.1:${GITHUB_PORT}`;
export const ADMIN_URL = `http://127.0.0.1:${ADMIN_PORT}`;

export const ADMIN_PASSWORD = "e2e-admin-password";

const salt = Buffer.from("00112233445566778899aabbccddeeff", "hex");

export const adminEnv: Record<string, string> = {
  ADMIN_PASSWORD_HASH: `${salt.toString("hex")}:${scryptSync(ADMIN_PASSWORD, salt, 64).toString("hex")}`,
  ADMIN_SESSION_SECRET: "e2e-session-secret-that-is-long-enough-0123456789",
  CONTENT_API: GITHUB_URL,
  CONTENT_REPO: "e2e/pmpk10",
  CONTENT_TOKEN: "e2e-token",
  CONTENT_BRANCH: "main",
  SITE_URL,
};

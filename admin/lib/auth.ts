import { createHmac, scryptSync, timingSafeEqual, randomBytes } from "node:crypto";
import { cookies } from "next/headers";

/**
 * Вход в админку.
 *
 * Сотруднику учреждения нужен логин и пароль, а не аккаунт на GitHub и не
 * разбирательство с OAuth. Поэтому здесь своя проверка пароля, а коммитит
 * правки сервер — своим токеном, которого редактор не видит и о котором не
 * знает. Про GitHub в интерфейсе не упоминается ни разу.
 *
 * Пароль хранится не открытым текстом, а солью и хешем scrypt в переменной
 * окружения ADMIN_PASSWORD_HASH (формат `соль:хеш`, оба в hex). Сгенерировать:
 *
 *   node -e "const{scryptSync,randomBytes}=require('crypto');const s=randomBytes(16);console.log(s.toString('hex')+':'+scryptSync(process.argv[1],s,64).toString('hex'))" 'ваш-пароль'
 *
 * Сессия — подписанная кука, без базы и без хранилища сессий: подпись сама
 * подтверждает, что куку выдали мы, а срок годности лежит внутри неё.
 */

const COOKIE = "pmpk_admin";
const TTL_MS = 12 * 60 * 60 * 1000; // рабочий день

function secret(): string {
  const value = process.env.ADMIN_SESSION_SECRET;
  if (!value || value.length < 32) {
    throw new Error("ADMIN_SESSION_SECRET не задан или короче 32 символов");
  }
  return value;
}

/** Сравнение с постоянным временем: иначе по скорости ответа подбирают пароль */
function sameBytes(a: Buffer, b: Buffer): boolean {
  return a.length === b.length && timingSafeEqual(a, b);
}

export function checkPassword(password: string): boolean {
  const stored = process.env.ADMIN_PASSWORD_HASH;
  if (!stored || !stored.includes(":")) return false;

  const [saltHex, hashHex] = stored.split(":");
  try {
    const salt = Buffer.from(saltHex, "hex");
    const expected = Buffer.from(hashHex, "hex");
    const actual = scryptSync(password, salt, expected.length);
    return sameBytes(actual, expected);
  } catch {
    return false;
  }
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("hex");
}

export async function startSession(): Promise<void> {
  const expires = Date.now() + TTL_MS;
  // Случайная часть нужна, чтобы две сессии, начатые в одну миллисекунду,
  // не получили одинаковый токен
  const payload = `${expires}.${randomBytes(8).toString("hex")}`;
  const jar = await cookies();
  jar.set(COOKIE, `${payload}.${sign(payload)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: Math.floor(TTL_MS / 1000),
  });
}

export async function endSession(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export async function isSignedIn(): Promise<boolean> {
  const jar = await cookies();
  const raw = jar.get(COOKIE)?.value;
  if (!raw) return false;

  const parts = raw.split(".");
  if (parts.length !== 3) return false;
  const [expires, nonce, mac] = parts;

  const payload = `${expires}.${nonce}`;
  let ok = false;
  try {
    ok = sameBytes(Buffer.from(mac, "hex"), Buffer.from(sign(payload), "hex"));
  } catch {
    return false;
  }
  if (!ok) return false;

  return Number(expires) > Date.now();
}

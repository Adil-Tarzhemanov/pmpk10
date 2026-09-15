/**
 * Чтение и запись контента сайта через GitHub Contents API.
 *
 * Токен живёт только на сервере, в переменной окружения. Редактор его не
 * видит, аккаунт на GitHub ему не нужен, и само слово GitHub в интерфейсе
 * не появляется: для него это просто «сохранить».
 *
 * Правка уходит коммитом в репозиторий, Vercel ловит push и пересобирает
 * сайт — обычно меньше минуты. Поэтому отдельного хранилища не нужно:
 * единственный источник правды остаётся один, репозиторий.
 */

const API = "https://api.github.com";

function config() {
  const repo = process.env.CONTENT_REPO; // Adil-Tarzhemanov/pmpk10
  const token = process.env.CONTENT_TOKEN;
  const branch = process.env.CONTENT_BRANCH ?? "main";
  if (!repo || !token) {
    throw new Error("CONTENT_REPO или CONTENT_TOKEN не заданы");
  }
  return { repo, token, branch };
}

async function call(path: string, init?: RequestInit) {
  const { token } = config();
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub ${res.status}: ${text.slice(0, 300)}`);
  }
  return res;
}

export type FileEntry = { path: string; name: string };

/** Список файлов в папке репозитория */
export async function listDir(dir: string): Promise<FileEntry[]> {
  const { repo, branch } = config();
  const res = await call(`/repos/${repo}/contents/${dir}?ref=${branch}`);
  const data = (await res.json()) as { path: string; name: string; type: string }[];
  return data
    .filter((e) => e.type === "file" && e.name.endsWith(".json"))
    .map((e) => ({ path: e.path, name: e.name }));
}

/** Содержимое файла плюс его sha — он нужен, чтобы перезаписать файл */
export async function readJson<T>(path: string): Promise<{ data: T; sha: string }> {
  const { repo, branch } = config();
  const res = await call(`/repos/${repo}/contents/${path}?ref=${branch}`);
  const file = (await res.json()) as { content: string; sha: string };
  const text = Buffer.from(file.content, "base64").toString("utf8");
  return { data: JSON.parse(text) as T, sha: file.sha };
}

/**
 * Запись файла. sha обязателен при перезаписи существующего: GitHub
 * отклонит коммит, если файл успели изменить с момента чтения. Это защита
 * от того, что две правки затрут друг друга.
 */
export async function writeJson(
  path: string,
  data: unknown,
  message: string,
  sha?: string,
): Promise<void> {
  const { repo, branch } = config();
  const text = JSON.stringify(data, null, 2) + "\n";
  await call(`/repos/${repo}/contents/${path}`, {
    method: "PUT",
    body: JSON.stringify({
      message,
      content: Buffer.from(text, "utf8").toString("base64"),
      branch,
      ...(sha ? { sha } : {}),
    }),
  });
}

export async function deleteFile(path: string, sha: string, message: string): Promise<void> {
  const { repo, branch } = config();
  await call(`/repos/${repo}/contents/${path}`, {
    method: "DELETE",
    body: JSON.stringify({ message, sha, branch }),
  });
}

/** Загрузка картинки. Возвращает адрес, по которому она будет на сайте */
export async function uploadImage(name: string, bytes: Buffer): Promise<string> {
  const { repo, branch } = config();
  // Имя чистим и делаем уникальным: иначе два «foto.jpg» затрут друг друга
  const safe = name.toLowerCase().replace(/[^a-z0-9.]+/g, "-").replace(/^-|-$/g, "");
  const file = `${Date.now()}-${safe}`;
  const path = `public/uploads/${file}`;
  await call(`/repos/${repo}/contents/${path}`, {
    method: "PUT",
    body: JSON.stringify({
      message: `Загружено изображение ${file}`,
      content: bytes.toString("base64"),
      branch,
    }),
  });
  return `/uploads/${file}`;
}

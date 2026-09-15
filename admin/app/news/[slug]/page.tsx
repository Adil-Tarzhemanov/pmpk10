import { redirect } from "next/navigation";
import { isSignedIn, endSession } from "@/lib/auth";
import { readJson, writeJson, deleteFile, uploadImage } from "@/lib/github";
import { Chrome } from "../../chrome";

export const dynamic = "force-dynamic";

type News = {
  date: string;
  dateLabel: string;
  title: string;
  summary: string;
  image?: string;
  body: string[];
};

const EMPTY: News = { date: "", dateLabel: "", title: "", summary: "", body: [] };

const MONTHS = [
  "января", "февраля", "марта", "апреля", "мая", "июня",
  "июля", "августа", "сентября", "октября", "ноября", "декабря",
];

/** «2026-09-15» → «15 сентября 2026». Редактор дату прописью не набирает */
function dateLabel(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

/** Заголовок → адрес новости латиницей */
function slugify(title: string): string {
  const map: Record<string, string> = {
    а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z",
    и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r",
    с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "c", ч: "ch", ш: "sh",
    щ: "sch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
  };
  return title
    .toLowerCase()
    .split("")
    .map((ch) => map[ch] ?? ch)
    .join("")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60) || `novost-${Date.now()}`;
}

/**
 * Одна новость: создание и правка.
 *
 * Русская и казахская версии редактируются на одном экране и сохраняются
 * вместе. Так сделано намеренно: у них обязано совпадать имя файла, иначе
 * переключатель языка на странице новости уводит в никуда. Разнеси их по
 * двум экранам — и рано или поздно кто-нибудь выложит половину.
 */
export default async function NewsEditor({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  if (!(await isSignedIn())) redirect("/login");

  const { slug } = await params;
  const { error } = await searchParams;
  const isNew = slug === "new";

  let ru = EMPTY;
  let kk = EMPTY;
  let ruSha: string | undefined;
  let kkSha: string | undefined;
  let loadError = "";

  if (!isNew) {
    try {
      const a = await readJson<News>(`content/news/ru/${slug}.json`);
      ru = a.data;
      ruSha = a.sha;
      try {
        const b = await readJson<News>(`content/news/kk/${slug}.json`);
        kk = b.data;
        kkSha = b.sha;
      } catch {
        /* казахской версии может не быть */
      }
    } catch (e) {
      loadError = e instanceof Error ? e.message : "Не удалось открыть новость";
    }
  }

  async function signOut() {
    "use server";
    await endSession();
    redirect("/login");
  }

  async function save(formData: FormData) {
    "use server";
    if (!(await isSignedIn())) redirect("/login");

    const date = String(formData.get("date") ?? "").trim();
    const titleRu = String(formData.get("titleRu") ?? "").trim();
    if (!date || titleRu.length < 3) {
      redirect(`/news/${slug}?error=fields`);
    }

    const target = isNew ? slugify(titleRu) : slug;

    /* Картинку грузим до записи новости: если она не пройдёт, лучше
       остановиться, чем сохранить новость со ссылкой в никуда */
    let image = String(formData.get("currentImage") ?? "") || undefined;
    const file = formData.get("image");
    if (file instanceof File && file.size > 0) {
      const bytes = Buffer.from(await file.arrayBuffer());
      image = await uploadImage(file.name, bytes);
    }

    const toBody = (value: string) =>
      value.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);

    const ruDoc: News = {
      date,
      dateLabel: dateLabel(date),
      title: titleRu,
      summary: String(formData.get("summaryRu") ?? "").trim(),
      ...(image ? { image } : {}),
      body: toBody(String(formData.get("bodyRu") ?? "")),
    };

    const titleKk = String(formData.get("titleKk") ?? "").trim();
    const message = `${isNew ? "Добавлена" : "Изменена"} новость: ${titleRu}`;

    await writeJson(`content/news/ru/${target}.json`, ruDoc, message, isNew ? undefined : ruSha);

    if (titleKk) {
      const kkDoc: News = {
        date,
        dateLabel: String(formData.get("dateLabelKk") ?? "").trim() || dateLabel(date),
        title: titleKk,
        summary: String(formData.get("summaryKk") ?? "").trim(),
        ...(image ? { image } : {}),
        body: toBody(String(formData.get("bodyKk") ?? "")),
      };
      await writeJson(`content/news/kk/${target}.json`, kkDoc, message, kkSha);
    }

    redirect("/news");
  }

  async function remove() {
    "use server";
    if (!(await isSignedIn())) redirect("/login");
    const message = `Удалена новость: ${slug}`;
    if (ruSha) await deleteFile(`content/news/ru/${slug}.json`, ruSha, message);
    if (kkSha) await deleteFile(`content/news/kk/${slug}.json`, kkSha, message);
    redirect("/news");
  }

  return (
    <Chrome signOut={signOut} back={{ href: "/news", label: "Все новости" }}>
      <h1>{isNew ? "Новая новость" : "Изменить новость"}</h1>

      {loadError ? <p className="msg msg--err">{loadError}</p> : null}
      {error === "fields" ? (
        <p className="msg msg--err">Заполните дату и заголовок на русском.</p>
      ) : null}

      <form action={save}>
        <div className="card">
          <div className="field">
            <label htmlFor="date">Дата</label>
            <input id="date" name="date" type="date" defaultValue={ru.date} required />
            <span className="hint">Дата прописью подставится сама.</span>
          </div>

          <div className="field">
            <label htmlFor="image">Фотография</label>
            <input id="image" name="image" type="file" accept="image/*" />
            <input type="hidden" name="currentImage" defaultValue={ru.image ?? ""} />
            <span className="hint">
              {ru.image
                ? "Фотография уже есть. Выберите новую, чтобы заменить."
                : "Необязательно. Без неё карточка получит узор в цветах сайта."}
            </span>
          </div>
        </div>

        <h2>На русском</h2>
        <div className="card">
          <div className="field">
            <label htmlFor="titleRu">Заголовок</label>
            <input id="titleRu" name="titleRu" type="text" defaultValue={ru.title} required />
          </div>
          <div className="field">
            <label htmlFor="summaryRu">Краткое описание</label>
            <textarea id="summaryRu" name="summaryRu" defaultValue={ru.summary} />
            <span className="hint">Одно-два предложения, показывается в карточке.</span>
          </div>
          <div className="field">
            <label htmlFor="bodyRu">Текст новости</label>
            <textarea id="bodyRu" name="bodyRu" defaultValue={ru.body.join("\n\n")} style={{ minHeight: 220 }} />
            <span className="hint">Абзацы разделяйте пустой строкой.</span>
          </div>
        </div>

        <h2>На казахском</h2>
        <div className="card">
          <div className="field">
            <label htmlFor="titleKk">Тақырып</label>
            <input id="titleKk" name="titleKk" type="text" defaultValue={kk.title} />
            <span className="hint">
              Оставьте пустым, если перевода пока нет: тогда новость выйдет только на русском.
            </span>
          </div>
          <div className="field">
            <label htmlFor="dateLabelKk">Күні жазбаша</label>
            <input id="dateLabelKk" name="dateLabelKk" type="text" defaultValue={kk.dateLabel} placeholder="15 қыркүйек 2026" />
          </div>
          <div className="field">
            <label htmlFor="summaryKk">Қысқаша сипаттама</label>
            <textarea id="summaryKk" name="summaryKk" defaultValue={kk.summary} />
          </div>
          <div className="field">
            <label htmlFor="bodyKk">Жаңалық мәтіні</label>
            <textarea id="bodyKk" name="bodyKk" defaultValue={kk.body.join("\n\n")} style={{ minHeight: 220 }} />
          </div>
        </div>

        <p className="row" style={{ marginTop: 20 }}>
          <button className="btn btn--primary" type="submit">Сохранить</button>
        </p>
      </form>

      {!isNew && ruSha ? (
        <form action={remove} style={{ marginTop: 32 }}>
          <button className="btn btn--danger" type="submit">Удалить новость</button>
        </form>
      ) : null}
    </Chrome>
  );
}

import { redirect } from "next/navigation";
import { isSignedIn, endSession } from "@/lib/auth";
import { readJson, writeJson, deleteFile, uploadFile, exists } from "@/lib/github";
import { ACCEPT, MAX_UPLOAD, SAVE_MESSAGES, acceptable, errorCode, isSaveError } from "@/lib/save";
import { Chrome } from "../../chrome";
import { ConfirmButton, ErrorMessage, FileField } from "../../controls";

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

const MONTHS = {
  ru: [
    "января", "февраля", "марта", "апреля", "мая", "июня",
    "июля", "августа", "сентября", "октября", "ноября", "декабря",
  ],
  kk: [
    "қаңтар", "ақпан", "наурыз", "сәуір", "мамыр", "маусым",
    "шілде", "тамыз", "қыркүйек", "қазан", "қараша", "желтоқсан",
  ],
};

/**
 * «2026-09-15» → «15 сентября 2026» или «15 қыркүйек 2026». Редактор дату
 * прописью не набирает ни на одном языке: набранная руками подпись
 * расходится с датой, как только дату поправят.
 */
function dateLabel(iso: string, lang: "ru" | "kk"): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return `${d} ${MONTHS[lang][m - 1]} ${y}`;
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

    const file = formData.get("image");
    const hasFile = file instanceof File && file.size > 0;
    if (hasFile && !acceptable(file, "image")) redirect(`/news/${slug}?error=file`);

    /* Браузер отправляет переносы строк из textarea как \r\n: без замены
       пустая строка между абзацами не находилась, и вся новость выходила
       одним абзацем */
    const toBody = (value: string) =>
      value.replace(/\r\n?/g, "\n").split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);

    const titleKk = String(formData.get("titleKk") ?? "").trim();
    const message = `${isNew ? "Добавлена" : "Изменена"} новость: ${titleRu}`;

    let problem = "";
    try {
      /* Одинаковый заголовок у двух новостей — обычное дело («График
         приёма на лето»). Адрес тогда получает номер, а не затирает старую */
      let target = slug;
      if (isNew) {
        const base = slugify(titleRu);
        target = base;
        for (let n = 2; await exists(`content/news/ru/${target}.json`); n++) target = `${base}-${n}`;
      }

      /* Картинку грузим до записи новости: если она не пройдёт, лучше
         остановиться, чем сохранить новость со ссылкой в никуда */
      let image = String(formData.get("currentImage") ?? "") || undefined;
      if (file instanceof File && hasFile) {
        image = await uploadFile(file.name, Buffer.from(await file.arrayBuffer()));
      }

      const ruDoc: News = {
        date,
        dateLabel: dateLabel(date, "ru"),
        title: titleRu,
        summary: String(formData.get("summaryRu") ?? "").trim(),
        ...(image ? { image } : {}),
        body: toBody(String(formData.get("bodyRu") ?? "")),
      };
      await writeJson(`content/news/ru/${target}.json`, ruDoc, message, isNew ? undefined : ruSha);

      if (titleKk) {
        const kkDoc: News = {
          date,
          dateLabel: dateLabel(date, "kk"),
          title: titleKk,
          summary: String(formData.get("summaryKk") ?? "").trim(),
          ...(image ? { image } : {}),
          body: toBody(String(formData.get("bodyKk") ?? "")),
        };
        await writeJson(`content/news/kk/${target}.json`, kkDoc, message, kkSha);
      } else if (kkSha) {
        /* Казахский заголовок стёрли — значит, перевод снят. Иначе на
           казахской версии сайта осталась бы прежняя редакция новости */
        await deleteFile(`content/news/kk/${target}.json`, kkSha, message);
      }
    } catch (e) {
      problem = errorCode(e);
    }
    /* redirect() работает исключением, поэтому стоит вне try */
    if (problem) redirect(`/news/${slug}?error=${problem}`);
    redirect("/news");
  }

  async function remove() {
    "use server";
    if (!(await isSignedIn())) redirect("/login");
    const message = `Удалена новость: ${slug}`;
    let problem = "";
    try {
      if (ruSha) await deleteFile(`content/news/ru/${slug}.json`, ruSha, message);
      if (kkSha) await deleteFile(`content/news/kk/${slug}.json`, kkSha, message);
    } catch (e) {
      problem = errorCode(e);
    }
    if (problem) redirect(`/news/${slug}?error=${problem}`);
    redirect("/news");
  }

  return (
    <Chrome signOut={signOut} back={{ href: "/news", label: "Все новости" }}>
      <h1>{isNew ? "Новая новость" : "Изменить новость"}</h1>

      {loadError ? <p className="msg msg--err">{loadError}</p> : null}
      {error === "fields" ? (
        <ErrorMessage text="Заполните дату и заголовок на русском." />
      ) : null}
      {isSaveError(error) ? <ErrorMessage text={SAVE_MESSAGES[error]} /> : null}

      <form action={save}>
        <div className="card">
          <div className="field">
            <label htmlFor="date">Дата</label>
            <input id="date" name="date" type="date" defaultValue={ru.date} required />
            <span className="hint">Дата прописью подставится сама.</span>
          </div>

          <div className="field">
            <label htmlFor="image">Фотография</label>
            <FileField id="image" name="image" accept={ACCEPT.image} maxBytes={MAX_UPLOAD} />
            <input type="hidden" name="currentImage" defaultValue={ru.image ?? ""} />
            <span className="hint">
              {ru.image
                ? "Фотография уже есть. Выберите новую, чтобы заменить."
                : "Необязательно. Без неё карточка получит узор в цветах сайта."}{" "}
              JPG, PNG или WebP, не больше 4 МБ.
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
          <ConfirmButton question="Удалить новость с сайта на обоих языках?">Удалить новость</ConfirmButton>
        </form>
      ) : null}
    </Chrome>
  );
}

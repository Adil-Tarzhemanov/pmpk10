import { redirect } from "next/navigation";
import { isSignedIn, endSession } from "@/lib/auth";
import { readJson, writeJson } from "@/lib/github";
import { Chrome } from "../chrome";

export const dynamic = "force-dynamic";

type Site = {
  phone: string;
  phoneHref: string;
  whatsapp: string;
  email: string;
  address: string;
  reception: string;
  hours: string;
  hoursShort: string;
  [key: string]: unknown;
};

/** «8 (778) 090-22-35» → «+77780902235» для кнопки звонка */
function toTel(display: string): string {
  const digits = display.replace(/\D/g, "");
  if (!digits) return "";
  const full = digits.length === 11 && digits.startsWith("8") ? `7${digits.slice(1)}` : digits;
  return `+${full}`;
}

/**
 * Контакты и график.
 *
 * Правится на двух языках сразу: телефон и почта у них общие, а адрес и
 * часы приёма пишутся словами и потому у каждого языка свои. Если менять
 * их по отдельности, русская и казахская версии разъезжаются — на прошлом
 * сайте это уже было.
 *
 * Поле для кнопки звонка редактор не заполняет: оно выводится из телефона.
 * Разработчику это очевидно, сотруднику учреждения — нет, и ошибка там
 * тихая: кнопка просто не сработает.
 */
export default async function Contacts({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  if (!(await isSignedIn())) redirect("/login");
  const { saved, error } = await searchParams;

  let ru: Site | null = null;
  let kk: Site | null = null;
  let ruSha = "";
  let kkSha = "";
  let loadError = "";

  try {
    const a = await readJson<Site>("content/site/ru.json");
    const b = await readJson<Site>("content/site/kk.json");
    ru = a.data; ruSha = a.sha;
    kk = b.data; kkSha = b.sha;
  } catch (e) {
    loadError = e instanceof Error ? e.message : "Не удалось загрузить контакты";
  }

  async function signOut() {
    "use server";
    await endSession();
    redirect("/login");
  }

  async function save(formData: FormData) {
    "use server";
    if (!(await isSignedIn())) redirect("/login");

    const phone = String(formData.get("phone") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    if (!phone || !email.includes("@")) {
      redirect("/contacts?error=fields");
    }

    const a = await readJson<Site>("content/site/ru.json");
    const b = await readJson<Site>("content/site/kk.json");

    const common = {
      phone,
      phoneHref: toTel(phone),
      whatsapp: String(formData.get("whatsapp") ?? "").trim(),
      email,
      // Метки «уточняется» снимаем: раз заполнили, значит данные есть
      phoneTbd: false,
      emailTbd: false,
      whatsappTbd: false,
      addressTbd: false,
    };

    await writeJson(
      "content/site/ru.json",
      {
        ...a.data,
        ...common,
        address: String(formData.get("addressRu") ?? "").trim(),
        reception: String(formData.get("receptionRu") ?? "").trim(),
        hours: String(formData.get("hoursRu") ?? "").trim(),
        hoursShort: String(formData.get("hoursShortRu") ?? "").trim(),
      },
      "Изменены контакты и график (рус)",
      a.sha,
    );

    await writeJson(
      "content/site/kk.json",
      {
        ...b.data,
        ...common,
        address: String(formData.get("addressKk") ?? "").trim(),
        reception: String(formData.get("receptionKk") ?? "").trim(),
        hours: String(formData.get("hoursKk") ?? "").trim(),
        hoursShort: String(formData.get("hoursShortKk") ?? "").trim(),
      },
      "Изменены контакты и график (каз)",
      b.sha,
    );

    redirect("/contacts?saved=1");
  }

  return (
    <Chrome signOut={signOut} back={{ href: "/", label: "Все разделы" }}>
      <h1>Контакты и график</h1>
      <p className="lede">Меняются сразу везде: в шапке, подвале и на странице контактов.</p>

      {loadError ? <p className="msg msg--err">{loadError}</p> : null}
      {saved ? <p className="msg msg--ok">Сохранено. Сайт обновится в течение минуты.</p> : null}
      {error === "fields" ? (
        <p className="msg msg--err">Проверьте телефон и адрес почты.</p>
      ) : null}

      {ru && kk ? (
        <form action={save}>
          <div className="card">
            <div className="field">
              <label htmlFor="phone">Телефон</label>
              <input id="phone" name="phone" type="text" defaultValue={ru.phone} required />
              <span className="hint">Кнопка звонка настроится сама.</span>
            </div>
            <div className="field">
              <label htmlFor="whatsapp">WhatsApp</label>
              <input id="whatsapp" name="whatsapp" type="text" defaultValue={ru.whatsapp} />
            </div>
            <div className="field">
              <label htmlFor="email">Электронная почта</label>
              <input id="email" name="email" type="text" defaultValue={ru.email} required />
            </div>
          </div>

          <h2>На русском</h2>
          <div className="card">
            <div className="field">
              <label htmlFor="addressRu">Адрес</label>
              <input id="addressRu" name="addressRu" type="text" defaultValue={ru.address} />
            </div>
            <div className="field">
              <label htmlFor="receptionRu">Часы приёма</label>
              <input id="receptionRu" name="receptionRu" type="text" defaultValue={ru.reception} />
              <span className="hint">Например: Пн–Пт 09:30–14:20, по предварительной записи</span>
            </div>
            <div className="field">
              <label htmlFor="hoursRu">Часы работы</label>
              <input id="hoursRu" name="hoursRu" type="text" defaultValue={ru.hours} />
            </div>
            <div className="field">
              <label htmlFor="hoursShortRu">Короткая строка для шапки</label>
              <input id="hoursShortRu" name="hoursShortRu" type="text" defaultValue={ru.hoursShort} />
              <span className="hint">Помещается в одну строку вверху страницы.</span>
            </div>
          </div>

          <h2>На казахском</h2>
          <div className="card">
            <div className="field">
              <label htmlFor="addressKk">Мекенжай</label>
              <input id="addressKk" name="addressKk" type="text" defaultValue={kk.address} />
            </div>
            <div className="field">
              <label htmlFor="receptionKk">Қабылдау уақыты</label>
              <input id="receptionKk" name="receptionKk" type="text" defaultValue={kk.reception} />
            </div>
            <div className="field">
              <label htmlFor="hoursKk">Жұмыс уақыты</label>
              <input id="hoursKk" name="hoursKk" type="text" defaultValue={kk.hours} />
            </div>
            <div className="field">
              <label htmlFor="hoursShortKk">Шапкадағы қысқа жол</label>
              <input id="hoursShortKk" name="hoursShortKk" type="text" defaultValue={kk.hoursShort} />
            </div>
          </div>

          <p className="row" style={{ marginTop: 20 }}>
            <button className="btn btn--primary" type="submit">Сохранить</button>
          </p>
        </form>
      ) : null}
    </Chrome>
  );
}

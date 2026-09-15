import { redirect } from "next/navigation";
import { isSignedIn, endSession } from "@/lib/auth";
import { readJson, writeJson } from "@/lib/github";
import { Chrome } from "../chrome";

export const dynamic = "force-dynamic";

type Vacancy = {
  role: string;
  chips: string[];
  requirementsTitle: string;
  requirements: string[];
  offerTitle: string;
  offer: string[];
};
type Vacancies = { items: Vacancy[]; [key: string]: unknown };

const lines = (value: string) =>
  value.split("\n").map((l) => l.trim()).filter(Boolean);

/**
 * Вакансии: открыть и закрыть.
 *
 * Русская и казахская версии заполняются на одном экране. Если казахскую
 * не заполнить, вакансия появится только на русской версии сайта, а на
 * казахской раздел останется пустым — это хуже, чем отсутствие вакансии,
 * поэтому поле подписано явно.
 *
 * Когда список пуст, страница сайта сама показывает «открытых вакансий
 * нет» — отдельно ничего выключать не надо.
 */
export default async function Vacancies({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  if (!(await isSignedIn())) redirect("/login");
  const { saved, error } = await searchParams;

  let ru: Vacancies | null = null;
  let loadError = "";
  try {
    ru = (await readJson<Vacancies>("content/vacancies/ru.json")).data;
  } catch (e) {
    loadError = e instanceof Error ? e.message : "Не удалось загрузить вакансии";
  }

  async function signOut() {
    "use server";
    await endSession();
    redirect("/login");
  }

  async function add(formData: FormData) {
    "use server";
    if (!(await isSignedIn())) redirect("/login");

    const roleRu = String(formData.get("roleRu") ?? "").trim();
    if (roleRu.length < 3) redirect("/vacancies?error=fields");

    const build = (lang: "Ru" | "Kk", fallbackRole: string): Vacancy => ({
      role: String(formData.get(`role${lang}`) ?? "").trim() || fallbackRole,
      chips: lines(String(formData.get(`chips${lang}`) ?? "")),
      requirementsTitle: lang === "Ru" ? "Требования" : "Талаптар",
      requirements: lines(String(formData.get(`req${lang}`) ?? "")),
      offerTitle: lang === "Ru" ? "Что предлагаем" : "Не ұсынамыз",
      offer: lines(String(formData.get(`offer${lang}`) ?? "")),
    });

    for (const [path, lang] of [
      ["content/vacancies/ru.json", "Ru"],
      ["content/vacancies/kk.json", "Kk"],
    ] as const) {
      const { data, sha } = await readJson<Vacancies>(path);
      await writeJson(
        path,
        { ...data, items: [...data.items, build(lang, roleRu)] },
        `Открыта вакансия: ${roleRu}`,
        sha,
      );
    }
    redirect("/vacancies?saved=1");
  }

  async function close(formData: FormData) {
    "use server";
    if (!(await isSignedIn())) redirect("/login");
    const i = Number(formData.get("i"));
    for (const path of ["content/vacancies/ru.json", "content/vacancies/kk.json"]) {
      const { data, sha } = await readJson<Vacancies>(path);
      await writeJson(
        path,
        { ...data, items: data.items.filter((_, index) => index !== i) },
        "Закрыта вакансия",
        sha,
      );
    }
    redirect("/vacancies?saved=1");
  }

  return (
    <Chrome signOut={signOut} back={{ href: "/", label: "Все разделы" }}>
      <h1>Вакансии</h1>
      <p className="lede">
        Пока список пуст, на сайте написано, что открытых вакансий нет.
      </p>

      {loadError ? <p className="msg msg--err">{loadError}</p> : null}
      {saved ? <p className="msg msg--ok">Сохранено. Сайт обновится в течение минуты.</p> : null}
      {error === "fields" ? <p className="msg msg--err">Укажите должность.</p> : null}

      {ru ? (
        <>
          <h2>Открытые вакансии</h2>
          {ru.items.length === 0 ? (
            <p className="msg msg--ok">Сейчас открытых вакансий нет.</p>
          ) : (
            <ul className="list">
              {ru.items.map((v, i) => (
                <li key={v.role}>
                  <span className="list__main">
                    <strong>{v.role}</strong>
                    <span className="list__date">{v.chips.join(" · ")}</span>
                  </span>
                  <form action={close}>
                    <input type="hidden" name="i" value={i} />
                    <button className="btn btn--danger" type="submit">Закрыть</button>
                  </form>
                </li>
              ))}
            </ul>
          )}

          <h2>Открыть вакансию</h2>
          <form action={add}>
            <div className="card">
              <div className="field">
                <label htmlFor="roleRu">Должность</label>
                <input id="roleRu" name="roleRu" type="text" required />
              </div>
              <div className="field">
                <label htmlFor="chipsRu">Условия</label>
                <textarea id="chipsRu" name="chipsRu" placeholder={"Полная занятость\nОпыт от 1 года\nОклад по единой тарифной сетке"} />
                <span className="hint">По одному в строке.</span>
              </div>
              <div className="field">
                <label htmlFor="reqRu">Требования</label>
                <textarea id="reqRu" name="reqRu" />
                <span className="hint">По одному в строке.</span>
              </div>
              <div className="field">
                <label htmlFor="offerRu">Что предлагаем</label>
                <textarea id="offerRu" name="offerRu" />
                <span className="hint">По одному в строке.</span>
              </div>
            </div>

            <h2>На казахском</h2>
            <div className="card">
              <div className="field">
                <label htmlFor="roleKk">Лауазымы</label>
                <input id="roleKk" name="roleKk" type="text" />
                <span className="hint">
                  Не заполните — на казахской версии сайта вакансия выйдет с русским названием.
                </span>
              </div>
              <div className="field">
                <label htmlFor="chipsKk">Шарттар</label>
                <textarea id="chipsKk" name="chipsKk" />
              </div>
              <div className="field">
                <label htmlFor="reqKk">Талаптар</label>
                <textarea id="reqKk" name="reqKk" />
              </div>
              <div className="field">
                <label htmlFor="offerKk">Не ұсынамыз</label>
                <textarea id="offerKk" name="offerKk" />
              </div>
            </div>

            <p className="row" style={{ marginTop: 20 }}>
              <button className="btn btn--primary" type="submit">Открыть вакансию</button>
            </p>
          </form>
        </>
      ) : null}
    </Chrome>
  );
}

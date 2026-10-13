import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { checkPassword, startSession, isSignedIn, signInLocked, recordFailure } from "@/lib/auth";

/**
 * Вход. Одно поле: пароль учреждения. Логина нет намеренно — правят
 * один-два человека, и лишнее поле только добавляет шанс ошибиться.
 */
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (await isSignedIn()) redirect("/");
  const { error } = await searchParams;

  async function signIn(formData: FormData) {
    "use server";
    const password = String(formData.get("password") ?? "");
    const h = await headers();
    const who = h.get("x-forwarded-for")?.split(",")[0].trim() || h.get("x-real-ip") || "local";
    if (signInLocked(who)) redirect("/login?error=locked");
    if (!checkPassword(password)) {
      recordFailure(who);
      redirect("/login?error=1");
    }
    await startSession();
    redirect("/");
  }

  return (
    <div className="wrap login">
      <h1>Редактирование сайта</h1>
      <p className="lede">ПМПК № 10, акимат города Астаны</p>

      {error === "locked" ? (
        <p className="msg msg--err" role="alert">
          Слишком много неверных попыток. Вход закрыт на 15 минут.
        </p>
      ) : error ? (
        <p className="msg msg--err" role="alert">Неверный пароль. Попробуйте ещё раз.</p>
      ) : null}

      <form action={signIn} className="card">
        <div className="field">
          <label htmlFor="password">Пароль</label>
          <input id="password" name="password" type="password" required autoFocus autoComplete="current-password" />
        </div>
        <button className="btn btn--primary" type="submit">Войти</button>
      </form>
    </div>
  );
}

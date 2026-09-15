import { redirect } from "next/navigation";
import { checkPassword, startSession, isSignedIn } from "@/lib/auth";

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
    if (!checkPassword(password)) {
      redirect("/login?error=1");
    }
    await startSession();
    redirect("/");
  }

  return (
    <div className="wrap login">
      <h1>Редактирование сайта</h1>
      <p className="lede">ПМПК № 10, акимат города Астаны</p>

      {error ? <p className="msg msg--err">Неверный пароль. Попробуйте ещё раз.</p> : null}

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

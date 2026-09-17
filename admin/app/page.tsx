import Link from "next/link";
import { redirect } from "next/navigation";
import { isSignedIn, endSession } from "@/lib/auth";
import { Chrome } from "./chrome";

/**
 * Главный экран: задачи, которые у учреждения возникают в жизни.
 *
 * Первые четыре — то, что меняется постоянно. Тексты страниц вынесены
 * отдельно и последними: их правят редко, а полей там сотни, и в общем
 * списке они утопили бы нужное.
 */
export default async function Home() {
  if (!(await isSignedIn())) redirect("/login");

  async function signOut() {
    "use server";
    await endSession();
    redirect("/login");
  }

  return (
    <Chrome signOut={signOut}>
      <h1>Что нужно изменить?</h1>
      <p className="lede">
        После сохранения сайт обновится сам, обычно в течение минуты.
      </p>

      <div className="tiles">
        <Link className="tile" href="/news">
          <strong>Новости</strong>
          <span>Добавить, изменить или убрать новость</span>
        </Link>
        <Link className="tile" href="/contacts">
          <strong>Контакты и график</strong>
          <span>Телефон, почта, адрес, часы приёма</span>
        </Link>
        <Link className="tile" href="/documents">
          <strong>Документы</strong>
          <span>Выложить файл или убрать устаревший</span>
        </Link>
        <Link className="tile" href="/vacancies">
          <strong>Вакансии</strong>
          <span>Открыть или закрыть вакансию</span>
        </Link>
        <Link className="tile" href="/pages">
          <strong>Тексты страниц</strong>
          <span>«О нас», главная, противодействие коррупции</span>
        </Link>
      </div>
    </Chrome>
  );
}

import Link from "next/link";
import { redirect } from "next/navigation";
import { isSignedIn, endSession } from "@/lib/auth";
import { Chrome } from "./chrome";

/**
 * Главный экран: четыре задачи, которые у учреждения возникают в жизни.
 * Остальные тексты сайта — миссия, инструкция по записи, направления
 * работы — пишутся один раз и меняются через разработчика: выносить их
 * сюда значило бы утопить нужное в ненужном.
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
      </div>
    </Chrome>
  );
}

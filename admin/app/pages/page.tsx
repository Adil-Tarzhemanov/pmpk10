import Link from "next/link";
import { redirect } from "next/navigation";
import { isSignedIn, endSession } from "@/lib/auth";
import { PAGES } from "@/lib/pages";
import { Chrome } from "../chrome";

/** Выбор страницы, тексты которой правим */
export default async function Pages() {
  if (!(await isSignedIn())) redirect("/login");

  async function signOut() {
    "use server";
    await endSession();
    redirect("/login");
  }

  return (
    <Chrome signOut={signOut} back={{ href: "/", label: "Все разделы" }}>
      <h1>Тексты страниц</h1>
      <p className="lede">
        Здесь правятся тексты, которые меняются редко: миссия, описания
        разделов, порядок обращения. Новости, контакты, документы и вакансии —
        на своих экранах.
      </p>

      <div className="tiles">
        {Object.entries(PAGES).map(([key, page]) => (
          <Link key={key} className="tile" href={`/pages/${key}`}>
            <strong>{page.title}</strong>
            <span>{page.hint}</span>
          </Link>
        ))}
      </div>
    </Chrome>
  );
}

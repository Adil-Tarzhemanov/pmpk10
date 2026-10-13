import Link from "next/link";

/* Адрес сайта меняется при переезде на свой домен — без правки кода */
const SITE_URL = (process.env.SITE_URL ?? "https://pmpk10-demo.vercel.app").replace(/\/$/, "");

/** Общая обвязка: шапка с выходом и ссылкой на сайт */
export function Chrome({
  children,
  signOut,
  back,
}: {
  children: React.ReactNode;
  signOut: () => Promise<void>;
  back?: { href: string; label: string };
}) {
  return (
    <>
      <header className="top">
        <div className="top__inner">
          <span className="top__name">ПМПК № 10</span>
          <Link href="/">Все разделы</Link>
          <a href={`${SITE_URL}/ru/`} target="_blank" rel="noopener noreferrer">
            Открыть сайт
          </a>
          <span className="top__spacer" />
          <form action={signOut}>
            <button className="btn btn--ghost" type="submit" style={{ color: "#fff", borderColor: "rgba(255,255,255,.4)" }}>
              Выйти
            </button>
          </form>
        </div>
      </header>
      <main className="wrap">
        {back ? (
          <p style={{ marginTop: 0 }}>
            <Link href={back.href}>← {back.label}</Link>
          </p>
        ) : null}
        {children}
      </main>
    </>
  );
}

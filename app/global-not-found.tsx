import type { Metadata } from "next";
import { NotFoundBody } from "@/components/NotFoundBody";
import { fontVariables } from "@/lib/fonts";
import "@/app/globals.css";

/**
 * Страница 404 для адресов, которых нет вовсе: из неё собирается out/404.html,
 * который хостинг отдаёт на любой неизвестный адрес.
 *
 * Без этого файла 404.html собирался из стандартной заглушки Next —
 * «404 This page could not be found» по-английски, без шапки и стилей сайта:
 * корневых layout'ов у сайта два (выбор языка и языковые версии), и общего,
 * в который встала бы своя страница, нет. global-not-found не нуждается в
 * layout'е — поэтому стили и шрифты подключены здесь же.
 */
export const metadata: Metadata = {
  title: "Страница не найдена · Бет табылмады — ПМПК № 10",
  robots: { index: false, follow: true },
};

export default function GlobalNotFound() {
  return (
    <html lang="ru" className={fontVariables}>
      <body>
        <main id="main">
          <NotFoundBody />
        </main>
      </body>
    </html>
  );
}

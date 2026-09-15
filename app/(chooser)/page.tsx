import Link from "next/link";
import { BrandMark } from "@/components/icons";
import { getSite } from "@/lib/content";
import { defaultLocale, locales, path } from "@/lib/i18n";

/**
 * Корень сайта. Обе языковые версии равноправны и живут по своим адресам,
 * поэтому здесь только развилка.
 *
 * Язык выбираем на клиенте: у статического сайта нет серверной части,
 * которая разобрала бы заголовок Accept-Language и сделала честный 302.
 * Скрипт стоит до разметки и срабатывает сразу, ещё до отрисовки. Если
 * JavaScript выключен, человек видит две кнопки — это и есть запасной путь.
 *
 * Если хостинг умеет редиректы, правило на его стороне лучше: оно мгновенное
 * и не требует загрузки страницы. Примеры для nginx и Apache — в README.
 */
const REDIRECT_SCRIPT = `
(function () {
  try {
    var lang = (navigator.language || "").toLowerCase();
    var target = lang.indexOf("kk") === 0 || lang.indexOf("kz") === 0 ? "/kk/" : "/${defaultLocale}/";
    location.replace(target);
  } catch (e) {
    /* не смогли определить язык — остаёмся на развилке с кнопками */
  }
})();
`;

export default function LanguageChooser() {
  const site = getSite(defaultLocale);

  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: REDIRECT_SCRIPT }} />

      <main className="chooser">
        <BrandMark size={64} />
        <h1>{site.legalName}</h1>
        <p>Выберите язык · Тілді таңдаңыз</p>

        <div className="chooser__links">
          {locales.map((locale) => (
            <Link
              key={locale}
              className="btn btn--primary"
              href={path(locale, "/")}
              hrefLang={locale}
              lang={locale}
            >
              {locale === "ru" ? "Русский" : "Қазақша"}
            </Link>
          ))}
        </div>
      </main>
    </>
  );
}

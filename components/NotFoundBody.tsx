import Link from "next/link";
import { Band } from "@/components/ui";
import { getDictionary } from "@/lib/dictionary";
import { locales, path } from "@/lib/i18n";

/**
 * Содержимое страницы «не найдено». Вынесено отдельно, потому что рисуется
 * из двух мест: обычного not-found.tsx и маршрута новости, когда новости
 * с таким адресом нет. При статическом экспорте notFound() отдал бы там
 * стандартную страницу Next вместо нашей.
 *
 * Двуязычная намеренно: по несуществующему адресу язык посетителя
 * неизвестен, а гадать на госсайте неуместно.
 */
export function NotFoundBody() {
  return (
    <Band>
      <div style={{ maxWidth: "60ch" }}>
        <p className="eyebrow">404</p>
        <h1 style={{ marginBlock: "12px 16px" }}>
          Страница не найдена · Бет табылмады
        </h1>
        <p className="lede">
          Возможно, адрес набран с ошибкой или раздел переехал.
          Начните с главной страницы.
        </p>
        <p className="lede" lang="kk" style={{ marginTop: 12 }}>
          Мекенжай қате терілген немесе бөлім ауысқан болуы мүмкін.
          Басты беттен бастаңыз.
        </p>

        <p style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 28 }}>
          {locales.map((locale) => (
            <Link
              key={locale}
              className="btn btn--primary"
              href={path(locale, "/")}
              lang={locale}
              hrefLang={locale}
            >
              {getDictionary(locale).masthead.home}
            </Link>
          ))}
        </p>
      </div>
    </Band>
  );
}

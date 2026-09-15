"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { localeLabel, locales, type Locale } from "@/lib/i18n";

/**
 * Переключатель языка ведёт на ту же страницу в другой языковой версии,
 * а не на главную: человек, читающий вакансии, остаётся на вакансиях.
 *
 * Это ссылки, а не кнопки: адрес действительно меняется, поэтому работают
 * «открыть в новой вкладке», кнопка «назад» и индексация обеих версий.
 * Текущий язык помечен aria-current, а не aria-pressed — ссылка не
 * переключатель состояния.
 */
export function LangSwitch({
  current,
  label,
}: {
  current: Locale;
  label: string;
}) {
  const pathname = usePathname() ?? `/${current}`;

  const hrefFor = (locale: Locale) => {
    // ['', 'ru', 'documents', ''] — первый непустой сегмент всегда язык
    const segments = pathname.split("/");
    segments[1] = locale;
    return segments.join("/") || `/${locale}`;
  };

  return (
    <div className="langs" role="group" aria-label={label}>
      {locales.map((locale) => (
        <Link
          key={locale}
          href={hrefFor(locale)}
          hrefLang={locale}
          lang={locale}
          aria-current={locale === current ? "true" : undefined}
        >
          {localeLabel[locale]}
        </Link>
      ))}
    </div>
  );
}

"use client";

import { EyeIcon } from "@/components/icons";
import { LangSwitch } from "@/components/LangSwitch";
import { useA11y } from "@/components/A11yProvider";
import type { Dictionary } from "@/lib/dictionary";
import type { SiteContent } from "@/lib/content";
import type { Locale } from "@/lib/i18n";

/**
 * Верхняя служебная панель: принадлежность к акимату, ссылки на госресурсы,
 * переключатель языка и кнопка версии для слабовидящих. Такой набор —
 * фактический стандарт государственных сайтов Казахстана.
 */
export function TopBar({
  locale,
  dict,
  site,
}: {
  locale: Locale;
  dict: Dictionary;
  site: SiteContent;
}) {
  const { on, toggle } = useA11y();
  const gov = site.links.filter((link) =>
    ["egov.kz", "astana.gov.kz"].includes(link.label),
  );

  return (
    <div className="topbar">
      <div className="wrap topbar__inner">
        <span className="hide-sm">{dict.topbar.official}</span>
        {gov.map((link) => (
          <a
            key={link.label}
            className="hide-sm"
            href={link.href}
            rel="noopener noreferrer"
            target="_blank"
          >
            {link.label}
          </a>
        ))}
        <span className="topbar__spacer" />

        <LangSwitch current={locale} label={dict.topbar.langGroup} />

        <button
          type="button"
          className="tool"
          onClick={toggle}
          aria-pressed={on}
        >
          <EyeIcon />
          <span>{dict.topbar.a11yToggle}</span>
        </button>
      </div>
    </div>
  );
}

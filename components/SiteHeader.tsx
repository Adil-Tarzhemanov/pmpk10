"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { BrandMark, BurgerIcon, PhoneIcon } from "@/components/icons";
import { mainNav } from "@/lib/navigation";
import { path, type Locale } from "@/lib/i18n";
import type { Dictionary } from "@/lib/dictionary";
import type { SiteContent } from "@/lib/content";

/**
 * Шапка и главное меню. Собраны в один клиентский компонент, потому что
 * бургер в шапке управляет меню под ней — состояние у них общее.
 */
export function SiteHeader({
  locale,
  dict,
  site,
}: {
  locale: Locale;
  dict: Dictionary;
  site: SiteContent;
}) {
  const pathname = usePathname() ?? "";
  const [open, setOpen] = useState(false);

  const isCurrent = (route: string) => {
    if (route.includes("#")) return false;
    const href = path(locale, route);
    return pathname === href || pathname === `${href}/`;
  };

  return (
    <>
      <header className="masthead">
        <div className="wrap masthead__inner">
          <Link className="brand" href={path(locale, "/")}>
            <span className="brand__mark">
              <BrandMark />
            </span>
            <span>
              <span className="brand__name">{site.legalName}</span>
              <span className="brand__short">{site.shortName}</span>
              <span className="brand__sub">{site.authority}</span>
            </span>
          </Link>

          <div className="masthead__contact">
            <div className="masthead__phone">{site.phone}</div>
            <div className="masthead__hours">{site.hoursShort}</div>
          </div>

          <a
            className="callbtn"
            href={`tel:${site.phoneHref}`}
            aria-label={dict.masthead.callAria}
          >
            <PhoneIcon />
          </a>

          <button
            type="button"
            className="burger"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-controls="mainnav"
          >
            <BurgerIcon />
            <span>{dict.masthead.menu}</span>
          </button>
        </div>
      </header>

      {/* Клик по пункту закрывает меню: на телефоне оно раскрыто на весь
          экран и иначе осталось бы висеть поверх новой страницы */}
      <nav
        className="nav"
        id="mainnav"
        data-open={open}
        aria-label={dict.masthead.navLabel}
        onClick={() => setOpen(false)}
      >
        <div className="wrap">
          <ul className="nav__list">
            {mainNav.map((item) => (
              <li key={item.key}>
                <Link
                  href={path(locale, item.route)}
                  aria-current={isCurrent(item.route) ? "page" : undefined}
                >
                  {dict.nav[item.key]}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </>
  );
}

import Link from "next/link";
import { footerOpenness, footerSections } from "@/lib/navigation";
import { path, type Locale } from "@/lib/i18n";
import type { Dictionary } from "@/lib/dictionary";
import type { SiteContent } from "@/lib/content";

export function SiteFooter({
  locale,
  dict,
  site,
}: {
  locale: Locale;
  dict: Dictionary;
  site: SiteContent;
}) {
  return (
    <footer className="footer">
      <div className="wrap">
        <div className="footer__grid">
          <div>
            <div className="footer__name">{site.legalName}</div>
            <p style={{ marginTop: 14, fontSize: ".875rem", color: "#90B4C2" }}>
              {dict.footer.tagline}
            </p>
          </div>

          <div>
            <h2>{dict.footer.sections}</h2>
            <ul>
              {footerSections.map((item) => (
                <li key={item.key}>
                  <Link href={path(locale, item.route)}>{dict.nav[item.key]}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2>{dict.footer.openness}</h2>
            <ul>
              {footerOpenness.map((item) => (
                <li key={item.key}>
                  <Link href={path(locale, item.route)}>{dict.nav[item.key]}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2>{dict.footer.resources}</h2>
            <ul>
              {site.links.map((link) => (
                <li key={link.label}>
                  <a href={link.href} rel="noopener noreferrer" target="_blank">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="footer__bottom">
          <span>{dict.footer.copyright}</span>
          <span
            className="tbd"
            style={{
              background: "transparent",
              color: "#FFC48A",
              borderColor: "#FFC48A",
            }}
          >
            {dict.footer.bin}
          </span>
        </div>
      </div>
    </footer>
  );
}

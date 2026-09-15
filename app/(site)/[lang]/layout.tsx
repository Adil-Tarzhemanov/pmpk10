import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { fontVariables } from "@/lib/fonts";
import "@/app/globals.css";

import { A11yBar } from "@/components/A11yBar";
import { A11yProvider } from "@/components/A11yProvider";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { TopBar } from "@/components/TopBar";
import { getSite } from "@/lib/content";
import { getDictionary } from "@/lib/dictionary";
import { htmlLang, isLocale, locales, ogLocale, path } from "@/lib/i18n";
import { absoluteUrl, IS_PREVIEW, SITE_URL } from "@/lib/site";

/** Обе языковые версии собираются на этапе сборки в статические файлы */
export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata({
  params,
}: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};

  const dict = getDictionary(lang);
  const site = getSite(lang);

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: dict.meta.home.title,
      template: `%s — ${site.shortName}`,
    },
    description: dict.meta.home.description,
    applicationName: site.shortName,
    openGraph: {
      type: "website",
      siteName: site.shortName,
      locale: ogLocale[lang],
      alternateLocale: locales.filter((l) => l !== lang).map((l) => ogLocale[l]),
    },
    alternates: {
      canonical: path(lang, "/"),
      languages: Object.fromEntries(
        locales.map((l) => [htmlLang[l], absoluteUrl(path(l, "/"))]),
      ),
    },
    /* robots.txt просит не обходить, мета-тег — не индексировать:
       порознь их обходят, вместе они демо из выдачи держат */
    robots: IS_PREVIEW ? { index: false, follow: false } : undefined,
    other: { "theme-color": "#0E4E66" },
  };
}

export default async function RootLayout({
  children,
  params,
}: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const dict = getDictionary(lang);
  const site = getSite(lang);

  return (
    <html lang={htmlLang[lang]} className={fontVariables}>
      <body>
        {/* Первый таб-стоп на странице — пропустить меню и уйти в текст */}
        <a className="skip" href="#main">
          {dict.masthead.skipToContent}
        </a>

        <A11yProvider>
          <TopBar locale={lang} dict={dict} site={site} />
          <A11yBar dict={dict} />
          <SiteHeader locale={lang} dict={dict} site={site} />

          <main id="main">{children}</main>

          <SiteFooter locale={lang} dict={dict} site={site} />
        </A11yProvider>
      </body>
    </html>
  );
}

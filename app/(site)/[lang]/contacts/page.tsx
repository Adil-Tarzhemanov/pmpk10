import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ContactDetails } from "@/components/ContactDetails";
import { MapBlock } from "@/components/MapBlock";
import { getSite } from "@/lib/content";
import { getDictionary } from "@/lib/dictionary";
import { isLocale } from "@/lib/i18n";
import { buildPageMetadata } from "@/lib/metadata";

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/contacts">): Promise<Metadata> {
  const { lang } = await params;
  return buildPageMetadata(lang, "contacts", "/contacts");
}

export default async function ContactsPage({
  params,
}: PageProps<"/[lang]/contacts">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const dict = getDictionary(lang);
  const site = getSite(lang);

  return (
    <section className="band">
      <div className="wrap contacts">
        <div>
          <p className="eyebrow">{dict.nav.contacts}</p>
          <h1 style={{ fontSize: "1.75rem", marginBlock: "10px 24px" }}>
            {dict.contacts.heading}
          </h1>

          <ContactDetails dict={dict} site={site} full />
        </div>

        <MapBlock dict={dict} site={site} />
      </div>
    </section>
  );
}

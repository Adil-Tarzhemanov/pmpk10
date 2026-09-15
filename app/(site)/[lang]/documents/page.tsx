import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Band, BandHead, DocList, Note } from "@/components/ui";
import { getDocuments } from "@/lib/content";
import { isLocale } from "@/lib/i18n";
import { buildPageMetadata } from "@/lib/metadata";

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/documents">): Promise<Metadata> {
  const { lang } = await params;
  return buildPageMetadata(lang, "documents", "/documents");
}

export default async function DocumentsPage({
  params,
}: PageProps<"/[lang]/documents">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const docs = getDocuments(lang);

  return (
    <Band>
      <BandHead
        as="h1"
        eyebrow={docs.eyebrow}
        title={docs.title}
        lede={docs.lede}
      />

      {docs.groups.map((group) => (
        <div className="docgroup" key={group.title}>
          <h2 className="docgroup__title">{group.title}</h2>
          <DocList items={group.items} />
        </div>
      ))}

      <Note title={docs.note.title} style={{ marginTop: 34 }}>
        <p>{docs.note.text}</p>
      </Note>
    </Band>
  );
}

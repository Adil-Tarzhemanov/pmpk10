import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Band, BandHead, Bullets, DocList, Note, Tbd } from "@/components/ui";
import { getAnticorruption } from "@/lib/content";
import { isLocale } from "@/lib/i18n";
import { buildPageMetadata } from "@/lib/metadata";

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/anticorruption">): Promise<Metadata> {
  const { lang } = await params;
  return buildPageMetadata(lang, "anticorruption", "/anticorruption");
}

export default async function AnticorruptionPage({
  params,
}: PageProps<"/[lang]/anticorruption">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const page = getAnticorruption(lang);

  return (
    <Band>
      <BandHead
        as="h1"
        eyebrow={page.eyebrow}
        title={page.title}
        lede={page.lede}
      />

      {/* Каналы обращения стоят первыми и крупно: родитель, у которого
          вымогают деньги, должен увидеть куда звонить сразу, а не после
          трёх абзацев про антикоррупционную политику */}
      <div className="channels">
        {page.channels.map((channel) => (
          <div className="channel" key={channel.label}>
            <div className="channel__label">{channel.label}</div>
            <div className="channel__value">
              {channel.value}
              {channel.tbd ? <> <Tbd>{channel.tbd}</Tbd></> : null}
            </div>
            <p>{channel.note}</p>
          </div>
        ))}
      </div>

      <div className="split" style={{ marginTop: 44 }}>
        <Note title={page.memo.title}>
          <div style={{ marginTop: 12 }}>
            <Bullets items={page.memo.items} />
          </div>
        </Note>

        <div>
          <h2 className="subhead" style={{ marginTop: 0 }}>
            {page.reports.title}
          </h2>
          <DocList items={page.reports.items} />
          <p
            style={{
              marginTop: 16,
              fontSize: ".875rem",
              color: "var(--muted)",
            }}
          >
            {page.reports.note}
          </p>
        </div>
      </div>
    </Band>
  );
}

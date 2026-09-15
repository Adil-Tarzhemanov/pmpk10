import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AboutScene, RoleIcon } from "@/components/illustrations";
import { Band, BandHead, Bullets, Note, Tbd } from "@/components/ui";
import { getAbout } from "@/lib/content";
import { getDictionary } from "@/lib/dictionary";
import { isLocale } from "@/lib/i18n";
import { buildPageMetadata } from "@/lib/metadata";

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/about">): Promise<Metadata> {
  const { lang } = await params;
  return buildPageMetadata(lang, "about", "/about");
}

export default async function AboutPage({ params }: PageProps<"/[lang]/about">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const dict = getDictionary(lang);
  const about = getAbout(lang);

  return (
    <>
      <Band>
        <BandHead
          as="h1"
          eyebrow={about.eyebrow}
          title={about.title}
          lede={about.lede}
        />

        <div className="split">
          <div>
            <p className="eyebrow">{about.mission.eyebrow}</p>
            <p className="lede" style={{ marginTop: 12 }}>
              {about.mission.text}
            </p>

            <h2 className="subhead">{about.goals.title}</h2>
            <Bullets items={about.goals.items} />
          </div>

          <div>
            <p className="eyebrow">{about.functions.eyebrow}</p>
            <h2 style={{ fontSize: "1.25rem", marginBlock: "10px 18px" }}>
              {about.functions.title}
            </h2>
            <ol className="numlist reveal">
              {about.functions.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ol>
          </div>
        </div>
      </Band>

      <Band surface>
        <h2 className="subhead" style={{ marginTop: 0 }}>
          {about.staff.title}
        </h2>

        <div className="people reveal-row">
          {about.staff.people.map((person) => (
            <div className="person" key={person.role}>
              <div className="person__ava" aria-hidden="true">
                <RoleIcon role={person.role} />
              </div>
              <h3 className="person__role">{person.role}</h3>
              <p className="person__name">
                {person.note}
                {person.noteTbd ? <> <Tbd>{dict.common.tbd}</Tbd></> : null}
              </p>
            </div>
          ))}

          {/* Специалистов восемь, сетка трёхколоночная — девятая ячейка
              пустовала. Ставим туда иллюстрацию вместо дырки */}
          <AboutScene />
        </div>

        <Note tone="sky" style={{ marginTop: 28 }}>
          <p>{about.staff.note}</p>
        </Note>
      </Band>
    </>
  );
}

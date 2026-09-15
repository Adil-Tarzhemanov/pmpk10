import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { EmptyArt } from "@/components/illustrations";
import { Band, BandHead, Bullets, Note } from "@/components/ui";
import { getVacancies } from "@/lib/content";
import { isLocale } from "@/lib/i18n";
import { buildPageMetadata } from "@/lib/metadata";

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/vacancies">): Promise<Metadata> {
  const { lang } = await params;
  return buildPageMetadata(lang, "vacancies", "/vacancies");
}

export default async function VacanciesPage({
  params,
}: PageProps<"/[lang]/vacancies">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const page = getVacancies(lang);

  return (
    <Band>
      <BandHead
        as="h1"
        eyebrow={page.eyebrow}
        title={page.title}
        lede={page.lede}
      />

      {page.items.length === 0 ? (
        <Note tone="sky">
          <div className="empty">
            <EmptyArt />
            <p>{page.empty}</p>
          </div>
        </Note>
      ) : (
        <div className="vacancies reveal-row">
          {page.items.map((vacancy) => (
            <article className="vacancy" key={vacancy.role}>
              <div>
                <h2>{vacancy.role}</h2>
                <div className="chips">
                  {vacancy.chips.map((chip) => (
                    <span className="chip" key={chip}>
                      {chip}
                    </span>
                  ))}
                </div>

                <h3 className="subhead">{vacancy.requirementsTitle}</h3>
                <Bullets items={vacancy.requirements} />
              </div>

              <div className="vacancy__aside">
                <h3>{vacancy.offerTitle}</h3>
                <Bullets items={vacancy.offer} />
              </div>
            </article>
          ))}
        </div>
      )}
    </Band>
  );
}

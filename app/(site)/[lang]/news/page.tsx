import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { EmptyArt, NewsCover } from "@/components/illustrations";
import { Band, BandHead, Note } from "@/components/ui";
import { getNews } from "@/lib/content";
import { getDictionary } from "@/lib/dictionary";
import { isLocale, path } from "@/lib/i18n";
import { buildPageMetadata } from "@/lib/metadata";

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/news">): Promise<Metadata> {
  const { lang } = await params;
  return buildPageMetadata(lang, "news", "/news");
}

export default async function NewsPage({ params }: PageProps<"/[lang]/news">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const dict = getDictionary(lang);
  const news = getNews(lang);

  return (
    <Band>
      <BandHead
        as="h1"
        eyebrow={dict.nav.news}
        title={dict.meta.news.title}
        lede={news.length === 0 ? undefined : dict.meta.news.description}
      />

      {news.length === 0 ? (
        <Note tone="sky">
          <div className="empty">
            <EmptyArt />
            <p>{dict.news.empty}</p>
          </div>
        </Note>
      ) : (
        <div className="news reveal-row">
          {news.map((item) => (
            <article className="card" key={item.slug}>
              <div className="card__img" aria-hidden="true">
                <NewsCover item={item} />
              </div>
              <div className="card__body">
                {/* Машиночитаемая дата — для поисковиков и читалок,
                    человеку показываем её же прописью */}
                <time className="card__date" dateTime={item.date}>
                  {item.dateLabel}
                </time>
                <h2>{item.title}</h2>
                <p>{item.summary}</p>
                <Link
                  className="card__more"
                  href={path(lang, `/news/${item.slug}`)}
                >
                  {dict.common.readMore}
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </Band>
  );
}

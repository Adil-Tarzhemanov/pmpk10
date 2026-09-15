import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CalendarCheckIcon, CalendarIcon, GlobeIcon, BookIcon, BuildingIcon } from "@/components/icons";
import { EmptyArt, HeroBackdrop, HeroScene, NewsCover, ServiceIcon } from "@/components/illustrations";
import { Band, BandHead, Note } from "@/components/ui";
import { ContactDetails } from "@/components/ContactDetails";
import { MapBlock } from "@/components/MapBlock";
import { getHome, getNews, getSite } from "@/lib/content";
import { getDictionary } from "@/lib/dictionary";
import { isLocale, path, type Locale } from "@/lib/i18n";

export async function generateMetadata({
  params,
}: PageProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const dict = getDictionary(lang);
  return {
    title: { absolute: dict.meta.home.title },
    description: dict.meta.home.description,
  };
}

/** Иконка для плитки госресурса подбирается по домену */
function LinkIcon({ label }: { label: string }) {
  if (label.startsWith("birge")) return <CalendarCheckIcon />;
  if (label.startsWith("special")) return <BookIcon />;
  if (label.startsWith("astana")) return <BuildingIcon />;
  return <GlobeIcon />;
}

export default async function HomePage({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const locale: Locale = lang;

  const dict = getDictionary(locale);
  const site = getSite(locale);
  const home = getHome(locale);
  const news = getNews(locale).slice(0, 3);

  return (
    <>
      {/* ======================= ГЕРОЙ ======================= */}
      <section className="hero">
        <HeroBackdrop />
        <div className="wrap hero__grid">
          {/* Слева — кто мы и зачем, справа — что сделать прямо сейчас.
              Иллюстрация держит левую колонку, цифры — правую: так обе
              заканчиваются на одной высоте и под ними нет пустой полосы */}
          <div>
            <p className="eyebrow">{home.hero.eyebrow}</p>
            <h1>{home.hero.title}</h1>
            <p className="lede">{home.hero.lede}</p>
            <HeroScene />
          </div>

          {/* Запись на приём — главный сценарий родителя, поэтому она
              стоит в первом экране, а не в глубине сайта. Иллюстрация
              идёт следом за карточкой: так правая колонка догоняет левую
              по высоте и под первым экраном не остаётся пустой полосы */}
          <div className="hero__aside">
          <aside className="booking" aria-labelledby="booking-h">
            <p className="eyebrow">{home.booking.eyebrow}</p>
            <h2 id="booking-h" style={{ marginTop: 8 }}>
              {home.booking.title}
            </h2>

            <div className="booking__when">
              <CalendarIcon />
              <span>
                {home.booking.when}
                <strong>{home.booking.whenStrong}</strong>
                {home.booking.whenTail}
              </span>
            </div>

            <a
              className="btn btn--primary btn--block"
              href={site.bookingUrl}
              rel="noopener noreferrer"
              target="_blank"
            >
              {home.booking.cta}
            </a>
            <p className="booking__note">{home.booking.note}</p>

            <hr
              style={{
                border: 0,
                borderTop: "1px solid var(--line)",
                margin: "20px 0 16px",
              }}
            />
            <div className="booking__links">
              <a className="btn btn--ghost btn--block" href="#online">
                {home.booking.howCta}
              </a>
              <a className="btn btn--ghost btn--block" href="#papers">
                {home.booking.docsCta}
              </a>
            </div>
          </aside>

            <div className="hero__facts">
              {home.hero.facts.map((fact) => (
                <div className="fact" key={fact.label}>
                  <div className="fact__n">{fact.value}</div>
                  <div className="fact__t">{fact.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============ ИНСТРУКЦИЯ ПО ЗАПИСИ ЧЕРЕЗ ПОРТАЛ ============ */}
      {/* Инструкция длинная, в карточку записи она не помещается —
          выносим отдельным блоком, карточка ведёт сюда якорем */}
      <Band id="online">
        <BandHead
          eyebrow={home.online.eyebrow}
          title={home.online.title}
          lede={home.online.lede}
        />
        <ol className="numlist numlist--two reveal">
          {home.online.steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>

        {/* Телефон и кнопка — строкой под списком: в узкой колонке сбоку
            они занимали шестую часть высоты, а остальное пустовало */}
        <div className="online__foot">
          <Note tone="sky">
            <p>{home.online.phoneNote}</p>
            <p className="note__phone">
              <a href={`tel:${site.phoneHref}`}>{site.phone}</a>
            </p>
          </Note>
          <a
            className="btn btn--primary"
            href={site.bookingUrl}
            rel="noopener noreferrer"
            target="_blank"
          >
            {home.online.moreCta}
          </a>
        </div>
      </Band>

      {/* ======================= ШАГИ ======================= */}
      <Band surface id="how">
        <BandHead
          eyebrow={home.steps.eyebrow}
          title={home.steps.title}
          lede={home.steps.lede}
        />
        <ol className="steps reveal-row">
          {home.steps.items.map((step) => (
            <li className="step" key={step.n}>
              <div className="step__n">{step.n}</div>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </li>
          ))}
        </ol>
      </Band>

      {/* ================= ДОКУМЕНТЫ НА ПРИЁМ + УСЛУГИ ================= */}
      <section className="band" id="papers">
        <div className="wrap split">
          <div>
            <p className="eyebrow">{home.papers.eyebrow}</p>
            <h2 style={{ fontSize: "1.75rem", marginBlock: "10px 20px" }}>
              {home.papers.title}
            </h2>
            <ul className="checklist">
              {home.papers.items.map((item) => (
                <li key={item.text}>
                  <span>
                    {item.text}
                    <span className="checklist__note">{item.note}</span>
                  </span>
                </li>
              ))}
            </ul>
            <p
              style={{
                marginTop: 20,
                fontSize: ".9375rem",
                color: "var(--muted)",
              }}
            >
              {home.papers.note}
            </p>
          </div>

          <div id="services">
            <p className="eyebrow">{home.services.eyebrow}</p>
            <h2 style={{ fontSize: "1.75rem", marginBlock: "10px 20px" }}>
              {home.services.title}
            </h2>
            <div className="services">
              {home.services.items.map((service, index) => (
                <div className="service" key={service.title}>
                  <span className="service__icon">
                    <ServiceIcon index={index} />
                  </span>
                  <div>
                    <h3>{service.title}</h3>
                    <p>{service.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ======================= НОВОСТИ ======================= */}
      <Band surface id="news">
        <BandHead
          eyebrow={home.newsBlock.eyebrow}
          title={home.newsBlock.title}
        />
        {/* Пока новостей нет, блок не исчезает: раздел в меню есть,
            и человеку понятнее увидеть объяснение, чем пустоту */}
        {news.length === 0 ? (
          <Note tone="sky">
            <div className="empty">
              <EmptyArt />
              <p>{dict.news.empty}</p>
            </div>
          </Note>
        ) : (
          <>
            <div className="news reveal-row">
              {news.map((item) => (
                <article className="card" key={item.slug}>
                  <div className="card__img" aria-hidden="true">
                    <NewsCover item={item} />
                  </div>
                  <div className="card__body">
                    <div className="card__date">{item.dateLabel}</div>
                    <h3>{item.title}</h3>
                    <p>{item.summary}</p>
                    <Link
                      className="card__more"
                      href={path(locale, `/news/${item.slug}`)}
                    >
                      {dict.common.readMore}
                    </Link>
                  </div>
                </article>
              ))}
            </div>
            <p style={{ marginTop: 28 }}>
              <Link className="btn btn--ghost" href={path(locale, "/news")}>
                {dict.common.allNews}
              </Link>
            </p>
          </>
        )}
      </Band>

      {/* ======================= ГОСРЕСУРСЫ ======================= */}
      <Band>
        <BandHead
          eyebrow={home.linksBlock.eyebrow}
          title={home.linksBlock.title}
        />
        <div className="tiles reveal-row">
          {site.links.map((link) => (
            <a
              className="tile"
              key={link.label}
              href={link.href}
              rel="noopener noreferrer"
              target="_blank"
            >
              <LinkIcon label={link.label} />
              <h3>{link.label}</h3>
              <p>{link.note}</p>
            </a>
          ))}
        </div>
      </Band>

      {/* ======================= КОНТАКТЫ КРАТКО ======================= */}
      <Band surface>
        <div className="contacts">
          <div>
            <p className="eyebrow">{dict.nav.contacts}</p>
            <h2 style={{ fontSize: "1.75rem", marginBlock: "10px 24px" }}>
              {dict.contacts.heading}
            </h2>
            <ContactDetails dict={dict} site={site} />
            <p style={{ marginTop: 26 }}>
              <Link className="btn btn--primary" href={path(locale, "/contacts")}>
                {dict.contacts.more}
              </Link>
            </p>
          </div>

          {/* Правая половина сетки пустовала — ставим карту: родителю на
              главной полезнее увидеть, куда ехать, чем белое поле */}
          <MapBlock dict={dict} site={site} />
        </div>
      </Band>

    </>
  );
}

import { DownloadIcon, FileIcon } from "@/components/icons";
import type { DocumentItem } from "@/lib/content";

/** Полоса-секция. Фон чередуется, чтобы соседние блоки не сливались. */
export function Band({
  surface = false,
  id,
  children,
}: {
  surface?: boolean;
  id?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={surface ? "band band--surface" : "band"} id={id}>
      <div className="wrap">{children}</div>
    </section>
  );
}

/** Шапка секции: надзаголовок, заголовок и вводный абзац. */
export function BandHead({
  eyebrow,
  title,
  lede,
  as: Heading = "h2",
}: {
  eyebrow: string;
  title: string;
  lede?: string;
  as?: "h1" | "h2";
}) {
  return (
    <div className="band__head">
      <p className="eyebrow">{eyebrow}</p>
      <Heading>{title}</Heading>
      {lede ? <p>{lede}</p> : null}
    </div>
  );
}

/** Бейдж «уточняется» — метка данных, которых у нас пока нет от заказчика. */
export function Tbd({ children }: { children: React.ReactNode }) {
  return <span className="tbd">{children}</span>;
}

/** Выноска: памятка, оговорка, порядок действий. */
export function Note({
  title,
  tone = "apricot",
  style,
  children,
}: {
  title?: string;
  tone?: "apricot" | "sky";
  style?: React.CSSProperties;
  children: React.ReactNode;
}) {
  return (
    <div className={tone === "sky" ? "note note--sky" : "note"} style={style}>
      {title ? <h3>{title}</h3> : null}
      {children}
    </div>
  );
}

/** Маркированный список без галочек. */
export function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="bullets">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

/**
 * Список документов. Строка целиком — ссылка на файл: так по ней проще
 * попасть и мышью, и пальцем. Иконки декоративные, формат и вес файла
 * названы текстом, а не только картинкой.
 */
export function DocList({ items }: { items: DocumentItem[] }) {
  return (
    <div className="doclist reveal-row">
      {items.map((item) => (
        <a className="doc" href={item.href} key={item.title}>
          <FileIcon className="doc__icon" />
          <span className="doc__body">
            <span className="doc__title">
              {item.title} {item.tbd ? <Tbd>{item.tbd}</Tbd> : null}
            </span>
            <span className="doc__meta">{item.meta}</span>
          </span>
          <DownloadIcon className="doc__dl" />
        </a>
      ))}
    </div>
  );
}

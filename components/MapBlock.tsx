import { Tbd } from "@/components/ui";
import type { SiteContent } from "@/lib/content";
import type { Dictionary } from "@/lib/dictionary";

/**
 * Карта проезда. Подложка — встраиваемая карта OpenStreetMap: она не требует
 * ни ключа API, ни аккаунта, ни оплаты за показы, а на статическом хостинге
 * это единственный вариант, который точно переживёт смену подрядчика.
 * 2ГИС, Яндекс и Google подключены ссылками «построить маршрут»: родитель
 * открывает маршрут в том приложении, которым пользуется, а мы при этом не
 * грузим их счётчики на каждую страницу контактов.
 *
 * iframe с lazy — карта весит больше самой страницы и тянуть её до того,
 * как человек доскроллит, незачем.
 */
export function MapBlock({
  dict,
  site,
}: {
  dict: Dictionary;
  site: SiteContent;
}) {
  const { lat, lon, zoom } = site.geo;

  /* Окно карты вокруг точки. Чем больше zoom, тем уже рамка: 17 — уровень,
     на котором видно двор и подъезды, но ещё читаются названия улиц. */
  const span = 0.012 / Math.pow(2, zoom - 15);
  const bbox = [lon - span, lat - span / 2, lon + span, lat + span / 2]
    .map((n) => n.toFixed(6))
    .join("%2C");

  const embed =
    `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}` +
    `&layer=mapnik&marker=${lat}%2C${lon}`;

  const routes = [
    { label: "2ГИС", href: `https://2gis.kz/astana/directions/points/%7C${lon}%2C${lat}` },
    { label: "Яндекс", href: `https://yandex.kz/maps/?rtext=~${lat}%2C${lon}` },
    { label: "Google", href: `https://www.google.com/maps/dir/?api=1&destination=${lat}%2C${lon}` },
  ];

  return (
    <div>
      <div className="map">
        <iframe
          src={embed}
          title={dict.contacts.mapTitle}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>

      {/* Ссылки живут вне .map: в версии для слабовидящих карта скрыта,
          а способ доехать нужен там тем более */}
      <p className="map__foot">
        <span className="map__addr">
          {site.address}
          {site.geo.verified ? null : <> <Tbd>{dict.contacts.pinTbd}</Tbd></>}
        </span>
        <span className="map__routes">
          <span>{dict.contacts.route}</span>
          {routes.map((route) => (
            <a
              key={route.label}
              href={route.href}
              rel="noopener noreferrer"
              target="_blank"
            >
              {route.label}
            </a>
          ))}
        </span>
      </p>
    </div>
  );
}

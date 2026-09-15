import { Tbd } from "@/components/ui";
import type { SiteContent } from "@/lib/content";
import type { Dictionary } from "@/lib/dictionary";

/**
 * Реквизиты учреждения. Один компонент на краткий блок главной и на
 * страницу контактов — чтобы телефон не разъехался между страницами,
 * когда заказчица пришлёт настоящий.
 */
export function ContactDetails({
  dict,
  site,
  full = false,
}: {
  dict: Dictionary;
  site: SiteContent;
  full?: boolean;
}) {
  return (
    <dl className="dl">
      <dt>{dict.contacts.address}</dt>
      <dd>
        {site.address}
        {site.addressTbd ? <> <Tbd>{dict.common.tbd}</Tbd></> : null}
      </dd>

      <dt>{dict.contacts.phone}</dt>
      <dd>
        <a href={`tel:${site.phoneHref}`}>{site.phone}</a>
        {site.phoneTbd ? <> <Tbd>{dict.common.tbd}</Tbd></> : null}
      </dd>

      {full ? (
        <>
          <dt>{dict.contacts.whatsapp}</dt>
          <dd>
            {site.whatsapp}
            {site.whatsappTbd ? <> <Tbd>{dict.common.tbd}</Tbd></> : null}
          </dd>

          <dt>{dict.contacts.email}</dt>
          <dd>
            <a href={`mailto:${site.email}`}>{site.email}</a>
            {site.emailTbd ? <> <Tbd>{dict.common.tbd}</Tbd></> : null}
          </dd>
        </>
      ) : null}

      <dt>{dict.contacts.reception}</dt>
      <dd>{site.reception}</dd>

      <dt>{dict.contacts.hours}</dt>
      <dd>{site.hours}</dd>
    </dl>
  );
}

/**
 * Декоративная графика: фон героя, иконки направлений работы, портреты-
 * заглушки специалистов, картинки новостей и пустых состояний.
 *
 * Всё векторное и инлайновое. Причин две. Оптимизатор картинок при
 * output: "export" отключён, и любой растр пришлось бы отдавать как есть —
 * а SVG весит килобайты и не мылится на ретине. И только инлайновый SVG
 * видит CSS-переменные темы: те же рисунки сами перекрашиваются в тёмной
 * теме, вместо того чтобы светить белым прямоугольником.
 *
 * Вся графика здесь декоративная: смысл несёт соседний текст, поэтому
 * aria-hidden и пустой alt — читалка не должна её проговаривать.
 */

const svg = (size: number) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true as const,
});

/* ------------------------------------------------------------ Фон героя */

/**
 * Подложка первого экрана: мягкие пятна фирменных цветов и тонкая сетка.
 * Никакой анимации — фон, который шевелится, отвлекает от текста, ради
 * которого человек и пришёл. Прозрачности низкие намеренно: контраст
 * заголовка и лида не должен просесть ни на пиксель.
 */
export function HeroBackdrop() {
  return (
    <svg
      className="hero__art"
      viewBox="0 0 1440 620"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="hb-a" cx=".5" cy=".5" r=".5">
          <stop offset="0" stopColor="var(--sky)" stopOpacity=".28" />
          <stop offset="1" stopColor="var(--sky)" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="hb-b" cx=".5" cy=".5" r=".5">
          <stop offset="0" stopColor="var(--apricot)" stopOpacity=".22" />
          <stop offset="1" stopColor="var(--apricot)" stopOpacity="0" />
        </radialGradient>
        <pattern id="hb-dots" width="26" height="26" patternUnits="userSpaceOnUse">
          <circle cx="1.5" cy="1.5" r="1.5" fill="var(--sky-deep)" opacity=".07" />
        </pattern>
      </defs>

      <rect width="1440" height="620" fill="url(#hb-dots)" />
      <ellipse cx="1180" cy="120" rx="520" ry="380" fill="url(#hb-a)" />
      <ellipse cx="180" cy="540" rx="460" ry="320" fill="url(#hb-b)" />

      {/* Дуга — «сопровождение», линия, которая ведёт и не обрывается */}
      <path
        d="M-40 470C240 470 300 250 620 250s420 190 900 120"
        stroke="var(--sky)"
        strokeOpacity=".16"
        strokeWidth="2"
        fill="none"
      />
    </svg>
  );
}

/* ------------------------------------------------------- Сцена в герое */

/**
 * Иллюстрация под первым экраном: дети играют.
 *
 * Взята готовой из unDraw (undraw.co) — библиотека профессиональных
 * векторных иллюстраций. Лицензия разрешает коммерческое использование и
 * изменение без указания авторства; запрещено перепродавать, распространять
 * паками и обучать на них модели — ничего из этого мы не делаем. Фирменный
 * акцент подставлен вместо исходного фиолетового: см. public/illustrations.
 *
 * Рисунок, а не фотография, и это осознанно: снимки «наших специалистов» или
 * «детей на приёме», которых не существует, выдавали бы вымысел за факт —
 * рядом с карточками состава, подписанными настоящими должностями, это
 * недопустимо. Иллюстрация ничего не утверждает, но сайт про детей перестаёт
 * выглядеть ведомственным бланком.
 *
 * Декоративная: смысл несёт текст рядом, поэтому пустой alt и aria-hidden.
 */
export function HeroScene() {
  return (
    /* eslint-disable-next-line @next/next/no-img-element -- при output: "export" оптимизатор отключён, next/image выдал бы тот же <img> с обвязкой */
    <img
      className="hero__scene"
      src="/illustrations/children.svg"
      alt=""
      aria-hidden="true"
      width={865}
      height={439}
      decoding="async"
    />
  );
}

/**
 * Родители с ребёнком — на странице «О нас», рядом с текстом миссии:
 * помогаем ребёнку и даём родителям понятный план. Оттуда же, что и сцена
 * в герое, и с той же лицензией.
 */
export function AboutScene() {
  return (
    /* eslint-disable-next-line @next/next/no-img-element -- при output: "export" оптимизатор отключён, next/image выдал бы тот же <img> с обвязкой */
    <img
      className="about__art"
      src="/illustrations/family.svg"
      alt=""
      aria-hidden="true"
      width={453}
      height={472}
      loading="lazy"
      decoding="async"
    />
  );
}

/* -------------------------------------------------- Направления работы */

function DiagnosticIcon() {
  return (
    <svg {...svg(24)}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4.5 4.5M11 8.5v5M8.5 11h5" />
    </svg>
  );
}

function RouteIcon() {
  return (
    <svg {...svg(24)}>
      <path d="M6 20V9a3 3 0 0 1 3-3h6a3 3 0 0 0 3-3" />
      <circle cx="6" cy="20" r="2" />
      <circle cx="18" cy="4" r="2" />
      <path d="M10 12h6" />
    </svg>
  );
}

function FamilyIcon() {
  return (
    <svg {...svg(24)}>
      <circle cx="8" cy="7.5" r="2.8" />
      <circle cx="17" cy="9" r="2.2" />
      <path d="M3 19c0-2.8 2.2-5 5-5s5 2.2 5 5M15 19c0-2 .8-3.6 2.2-4.4" />
    </svg>
  );
}

function ReferralIcon() {
  return (
    <svg {...svg(24)}>
      <path d="M4 5.5h9a2 2 0 0 1 2 2V20H6a2 2 0 0 1-2-2Z" />
      <path d="M15 10h3.5a1.5 1.5 0 0 1 1.5 1.5V20h-5" />
      <path d="M7.5 9.5h4M7.5 13h4" />
    </svg>
  );
}

function MethodIcon() {
  return (
    <svg {...svg(24)}>
      <path d="M4 6.5A2.5 2.5 0 0 1 6.5 4H19v13.5H6.5A2.5 2.5 0 0 0 4 20Z" />
      <path d="M9 8.5h6M9 12h4" />
    </svg>
  );
}

const SERVICE_ICONS = [
  DiagnosticIcon,
  RouteIcon,
  FamilyIcon,
  ReferralIcon,
  MethodIcon,
];

/** Иконка направления работы. Порядок совпадает с порядком в контенте. */
export function ServiceIcon({ index }: { index: number }) {
  const Icon = SERVICE_ICONS[index % SERVICE_ICONS.length];
  return <Icon />;
}

/* ------------------------------------------------------- Специалисты */

function SpeechIcon() {
  return (
    <svg {...svg(22)}>
      <path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v7a2.5 2.5 0 0 1-2.5 2.5H10l-4.5 3.5v-3.5A2.5 2.5 0 0 1 4 13.5Z" />
      <path d="M8.5 10h.01M12 10h.01M15.5 10h.01" />
    </svg>
  );
}

function MindIcon() {
  return (
    <svg {...svg(22)}>
      <path d="M12 20.5s-6.8-4.2-6.8-9.3a4 4 0 0 1 6.8-2.8 4 4 0 0 1 6.8 2.8c0 5.1-6.8 9.3-6.8 9.3Z" />
    </svg>
  );
}

function BlocksIcon() {
  return (
    <svg {...svg(22)}>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.4" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.4" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.4" />
      <path d="M14.5 17h5.5M17.2 14.2v5.6" />
    </svg>
  );
}

function MedicalIcon() {
  return (
    <svg {...svg(22)}>
      <path d="M7 3.5v5a5 5 0 0 0 10 0v-5" />
      <path d="M5 3.5h4M15 3.5h4" />
      <path d="M12 13.5v2a4 4 0 0 0 8 0v-1" />
      <circle cx="20" cy="11.5" r="2" />
    </svg>
  );
}

function PulseIcon() {
  return (
    <svg {...svg(22)}>
      <path d="M3 12h3.5L9 5.5 13 18l2.5-6H21" />
    </svg>
  );
}

function VisionIcon() {
  return (
    <svg {...svg(22)}>
      <path d="M2.5 12S6 6 12 6s9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
      <circle cx="12" cy="12" r="2.6" />
    </svg>
  );
}

function LeadIcon() {
  return (
    <svg {...svg(22)}>
      <path d="M4 20.5V8l8-4.5L20 8v12.5" />
      <path d="M9.5 20.5v-5h5v5" />
    </svg>
  );
}

function PeopleIcon() {
  return (
    <svg {...svg(22)}>
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 20c0-3 2.5-5.5 5.5-5.5s5.5 2.5 5.5 5.5" />
      <path d="M16 5.5a3 3 0 0 1 0 5.8M17.5 14.6c1.8.8 3 2.5 3 4.4" />
    </svg>
  );
}

/**
 * Портрет-заглушка подбирается по должности: так восемь карточек состава
 * различаются с одного взгляда, а не выглядят одинаковым серым кружком.
 * Ключи — по корню слова, чтобы одинаково ловить русский и казахский.
 */
const ROLE_ICONS: { match: RegExp; Icon: () => React.JSX.Element }[] = [
  { match: /руковод|басшы/i, Icon: LeadIcon },
  { match: /логопед/i, Icon: SpeechIcon },
  { match: /психолог/i, Icon: MindIcon },
  { match: /дефектолог/i, Icon: BlocksIcon },
  { match: /психиатр/i, Icon: MedicalIcon },
  { match: /невропатолог|невролог/i, Icon: PulseIcon },
  { match: /офтальмолог/i, Icon: VisionIcon },
  { match: /социальн|әлеумет/i, Icon: PeopleIcon },
];

export function RoleIcon({ role }: { role: string }) {
  const found = ROLE_ICONS.find((entry) => entry.match.test(role));
  const Icon = found ? found.Icon : PeopleIcon;
  return <Icon />;
}

/* ----------------------------------------------------------- Новости */

/**
 * Картинка-обложка новости. Фотографий у нас нет, а пустой серый
 * прямоугольник читается как «изображение не загрузилось». Рисуем
 * геометрический узор, детерминированно выведенный из адреса новости:
 * у каждой он свой и не меняется при пересборке, а вся лента при этом
 * остаётся в фирменной палитре.
 *
 * Когда заказчица начнёт прикладывать к новостям настоящие фотографии,
 * этот узор заменится на них — сюда можно будет не возвращаться.
 */
export function NewsArt({ seed }: { seed: string }) {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) % 100000;
  }

  const rotate = hash % 360;
  const shift = hash % 40;
  const variant = hash % 3;
  const id = `na-${hash}`;

  return (
    <svg
      className="card__art"
      viewBox="0 0 320 180"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={id} gradientTransform={`rotate(${rotate} .5 .5)`}>
          <stop offset="0" stopColor="var(--sky-wash)" />
          <stop offset="1" stopColor="var(--apricot-wash)" />
        </linearGradient>
      </defs>

      <rect width="320" height="180" fill={`url(#${id})`} />

      <g stroke="var(--sky)" strokeOpacity=".45" fill="none" strokeWidth="1.5">
        {variant === 0 ? (
          <>
            <circle cx={70 + shift} cy="60" r="46" />
            <circle cx={210 + shift} cy="120" r="66" />
          </>
        ) : null}
        {variant === 1 ? (
          <>
            <path d={`M${-10 + shift} 150 Q 80 40 170 110 T 340 70`} />
            <path d={`M${-10 + shift} 176 Q 80 66 170 136 T 340 96`} />
          </>
        ) : null}
        {variant === 2 ? (
          <>
            <rect x={40 + shift} y="34" width="92" height="92" rx="10" />
            <rect x={150 + shift} y="70" width="120" height="120" rx="10" />
          </>
        ) : null}
      </g>

      <circle cx={262 - shift} cy="44" r="12" fill="var(--apricot)" opacity=".5" />
    </svg>
  );
}

/**
 * Обложка новости: настоящая фотография, если редактор её приложил, иначе
 * узор. Пустого серого прямоугольника быть не должно — он читается как
 * «картинка не загрузилась».
 */
export function NewsCover({ item }: { item: { slug: string; image?: string; title: string } }) {
  if (!item.image) return <NewsArt seed={item.slug} />;
  return (
    /* eslint-disable-next-line @next/next/no-img-element -- при output: "export" оптимизатор отключён, next/image выдал бы тот же <img> с обвязкой */
    <img
      className="card__photo"
      src={item.image}
      alt=""
      loading="lazy"
      decoding="async"
    />
  );
}

/* ----------------------------------------------------- Пустые состояния */

/**
 * Рисунок для раздела, в котором пока ничего нет. Нужен, чтобы пустая
 * страница читалась как «здесь пока пусто», а не как сломанная вёрстка.
 */
export function EmptyArt() {
  return (
    <svg className="empty__art" viewBox="0 0 120 96" aria-hidden="true">
      <rect
        x="14" y="20" width="74" height="62" rx="6"
        fill="var(--surface-2)" stroke="var(--line)" strokeWidth="1.5"
      />
      <rect
        x="32" y="10" width="74" height="62" rx="6"
        fill="var(--surface)" stroke="var(--line-strong)" strokeWidth="1.5"
      />
      <path
        d="M44 28h50M44 40h50M44 52h30"
        stroke="var(--line)"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle cx="92" cy="62" r="13" fill="var(--sky-wash)" stroke="var(--sky)" strokeWidth="1.5" />
      <path d="M92 56v12M86 62h12" stroke="var(--sky)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

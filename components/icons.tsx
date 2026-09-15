/**
 * Иконки инлайном: их несколько штук, отдельная библиотека и запрос за
 * спрайтом ради этого не нужны. Все декоративные — aria-hidden, смысл
 * несёт соседний текст.
 */
type IconProps = { size?: number; className?: string };

const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  "aria-hidden": true as const,
});

export function PhoneIcon({ size = 21, className }: IconProps) {
  return (
    <svg {...base(size)} strokeWidth={1.9} className={className}>
      <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z" />
    </svg>
  );
}

export function BurgerIcon({ size = 18, className }: IconProps) {
  return (
    <svg {...base(size)} strokeWidth={2} className={className}>
      <path d="M3 6h18M3 12h18M3 18h18" />
    </svg>
  );
}

export function EyeIcon({ size = 17, className }: IconProps) {
  return (
    <svg {...base(size)} strokeWidth={1.8} className={className}>
      <path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12Z" />
      <circle cx="12" cy="12" r="2.6" />
    </svg>
  );
}

export function CalendarIcon({ size = 20, className }: IconProps) {
  return (
    <svg {...base(size)} strokeWidth={1.7} className={className}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M8 3v4M16 3v4M3 10h18" />
    </svg>
  );
}

export function CalendarCheckIcon({ size = 26, className }: IconProps) {
  return (
    <svg {...base(size)} strokeWidth={1.6} className={className}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M8 3v4M16 3v4M3 10h18M9 15l2 2 4-4" />
    </svg>
  );
}

export function FileIcon({ size = 22, className }: IconProps) {
  return (
    <svg {...base(size)} strokeWidth={1.6} className={className}>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z" />
      <path d="M14 3v5h5" />
    </svg>
  );
}

export function DownloadIcon({ size = 20, className }: IconProps) {
  return (
    <svg {...base(size)} strokeWidth={1.7} className={className}>
      <path d="M12 4v11m0 0 4-4m-4 4-4-4M5 19h14" />
    </svg>
  );
}

export function GlobeIcon({ size = 26, className }: IconProps) {
  return (
    <svg {...base(size)} strokeWidth={1.6} className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 2.7 2.5 15.3 0 18M12 3c-2.5 2.7-2.5 15.3 0 18" />
    </svg>
  );
}

export function BookIcon({ size = 26, className }: IconProps) {
  return (
    <svg {...base(size)} strokeWidth={1.6} className={className}>
      <path d="M4 6h7a2 2 0 0 1 2 2v11a2 2 0 0 0-2-2H4Z" />
      <path d="M20 6h-7a2 2 0 0 0-2 2v11a2 2 0 0 1 2-2h7Z" />
    </svg>
  );
}

export function BuildingIcon({ size = 26, className }: IconProps) {
  return (
    <svg {...base(size)} strokeWidth={1.6} className={className}>
      <path d="M3 21h18M5 21V10l7-5 7 5v11" />
      <path d="M10 21v-6h4v6" />
    </svg>
  );
}

/**
 * Эмблема учреждения — растровая, взята с официального аккаунта
 * @pmpk10_astana. Оптимизатор картинок при статическом экспорте отключён,
 * поэтому обычный <img> честнее, чем next/image: тот здесь ничего не даёт.
 */
export function BrandMark({ size = 52, className }: { size?: number; className?: string }) {
  return (
    /* eslint-disable-next-line @next/next/no-img-element -- при output: "export" оптимизатор отключён, next/image выдал бы тот же <img> с обвязкой */
    <img
      src="/logo.png"
      width={size}
      height={size}
      alt=""
      aria-hidden="true"
      className={className ? `brandmark ${className}` : "brandmark"}
      decoding="async"
    />
  );
}

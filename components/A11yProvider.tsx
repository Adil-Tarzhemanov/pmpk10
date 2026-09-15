"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
} from "react";

/**
 * Версия для слабовидящих.
 *
 * Настройки живут в localStorage, а не в состоянии React: человеку,
 * которому нужен крупный шрифт, незачем включать его заново на каждой
 * странице. Читаем их через useSyncExternalStore — этот хук для того и
 * сделан, чтобы подписываться на внешнее хранилище: при гидратации он
 * берёт серверный снимок, а сразу после — настоящий из браузера, и
 * разметка сервера с разметкой клиента не расходятся.
 *
 * Применяются настройки атрибутами на <html>: так их видит вся
 * дизайн-система из globals.css, включая блоки, отрисованные на сервере.
 */
type Scheme = "normal" | "inverse";

type Settings = {
  on: boolean;
  fontScale: string;
  scheme: Scheme;
};

type A11yState = Settings & {
  toggle: () => void;
  disable: () => void;
  setFontScale: (value: string) => void;
  setScheme: (value: Scheme) => void;
};

const STORAGE_KEY = "pmpk10-a11y";
const CHANGE_EVENT = "pmpk10-a11y-change";

const DEFAULTS: Settings = { on: false, fontScale: "1", scheme: "normal" };

/** Снимок — строка, а не объект: у примитива стабильная ссылка */
function readRaw(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? "";
  } catch {
    /* приватный режим или запрет на хранилище — работаем без памяти */
    return "";
  }
}

function subscribe(onChange: () => void) {
  window.addEventListener(CHANGE_EVENT, onChange);
  // storage срабатывает в других вкладках — настройки едут за человеком
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

function write(settings: Settings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    /* см. выше: без памяти настройки живут до перезагрузки страницы */
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function parse(raw: string): Settings {
  if (!raw) return DEFAULTS;
  try {
    const parsed = JSON.parse(raw) as Partial<Settings>;
    return {
      on: parsed.on === true,
      fontScale: parsed.fontScale ?? DEFAULTS.fontScale,
      scheme: parsed.scheme === "inverse" ? "inverse" : "normal",
    };
  } catch {
    return DEFAULTS;
  }
}

const A11yContext = createContext<A11yState | null>(null);

export function A11yProvider({ children }: { children: React.ReactNode }) {
  const raw = useSyncExternalStore(subscribe, readRaw, () => "");
  const settings = useMemo(() => parse(raw), [raw]);

  /* Единственная задача эффекта — синхронизировать <html> с настройками.
     Никакого setState здесь нет: состояние снаружи, в localStorage. */
  useEffect(() => {
    const root = document.documentElement;

    if (settings.on) {
      root.setAttribute("data-a11y", "on");
      root.setAttribute("data-a11y-scheme", settings.scheme);
      root.style.setProperty("--fs", settings.fontScale);
    } else {
      root.removeAttribute("data-a11y");
      root.removeAttribute("data-a11y-scheme");
      root.style.setProperty("--fs", "1");
    }
  }, [settings]);

  /* Правим всегда от свежего значения из хранилища, а не от снимка в
     замыкании — иначе соседняя вкладка могла бы затереть чужой выбор */
  const update = useCallback(
    (patch: Partial<Settings>) => write({ ...parse(readRaw()), ...patch }),
    [],
  );

  const toggle = useCallback(
    () => update({ on: !parse(readRaw()).on }),
    [update],
  );
  const disable = useCallback(() => write(DEFAULTS), []);
  const setFontScale = useCallback(
    (fontScale: string) => update({ fontScale }),
    [update],
  );
  const setScheme = useCallback(
    (scheme: Scheme) => update({ scheme }),
    [update],
  );

  const value = useMemo(
    () => ({ ...settings, toggle, disable, setFontScale, setScheme }),
    [settings, toggle, disable, setFontScale, setScheme],
  );

  return <A11yContext.Provider value={value}>{children}</A11yContext.Provider>;
}

export function useA11y(): A11yState {
  const value = useContext(A11yContext);
  if (!value) throw new Error("useA11y используется вне A11yProvider");
  return value;
}

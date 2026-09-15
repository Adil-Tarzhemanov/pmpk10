"use client";

import { useA11y } from "@/components/A11yProvider";
import type { Dictionary } from "@/lib/dictionary";

const FONT_SCALES = [
  { value: "1", label: "A" },
  { value: "1.25", label: "A+" },
  { value: "1.5", label: "A++" },
];

/**
 * Панель настроек версии для слабовидящих. Появляется только когда версия
 * включена — за показ отвечает CSS (:root[data-a11y="on"] .a11y-bar),
 * поэтому панель есть в разметке всегда и не «прыгает» при гидратации.
 */
export function A11yBar({ dict }: { dict: Dictionary }) {
  const { fontScale, scheme, setFontScale, setScheme, disable } = useA11y();

  return (
    <div className="a11y-bar">
      <div className="wrap a11y-bar__inner" role="group" aria-label={dict.a11y.barLabel}>
        <div className="a11y-bar__group">
          <span>{dict.a11y.fontSize}</span>
          {FONT_SCALES.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setFontScale(item.value)}
              aria-pressed={fontScale === item.value}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="a11y-bar__group">
          <span>{dict.a11y.scheme}</span>
          <button
            type="button"
            onClick={() => setScheme("normal")}
            aria-pressed={scheme === "normal"}
          >
            {dict.a11y.schemeNormal}
          </button>
          <button
            type="button"
            onClick={() => setScheme("inverse")}
            aria-pressed={scheme === "inverse"}
          >
            {dict.a11y.schemeInverse}
          </button>
        </div>

        <div className="a11y-bar__group">
          <button type="button" onClick={disable}>
            {dict.a11y.off}
          </button>
        </div>
      </div>
    </div>
  );
}

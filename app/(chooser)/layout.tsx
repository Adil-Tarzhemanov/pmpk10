import type { Metadata } from "next";
import { fontVariables } from "@/lib/fonts";
import "@/app/globals.css";

/**
 * Второй корневой layout — только для страницы выбора языка по адресу «/».
 *
 * Корневых layout'ов у сайта два, и это не прихоть: атрибут lang у <html>
 * должен совпадать с языком страницы, а задать его можно только в том
 * layout'е, который этот <html> и рисует. Поэтому языковые страницы живут
 * под своим корнем в app/(site)/[lang], а развилка — под этим.
 *
 * Группы в скобках на адреса не влияют: (chooser) даёт «/», а не «/chooser».
 */
export const metadata: Metadata = {
  title: "ПМПК № 10 Астана — выбор языка · тілді таңдау",
  // Индексировать надо сами языковые версии, а не развилку между ними
  robots: { index: false, follow: true },
};

export default function ChooserLayout({
  children,
}: LayoutProps<"/">) {
  return (
    <html lang="ru" className={fontVariables}>
      <body>{children}</body>
    </html>
  );
}

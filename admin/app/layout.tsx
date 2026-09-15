import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Редактирование сайта · ПМПК № 10",
  // Панель в поиске не нужна ни при каких обстоятельствах
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}

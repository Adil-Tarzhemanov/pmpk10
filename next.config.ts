import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Статический экспорт: `next build` кладёт готовый сайт в out/.
     Ему не нужен Node на сервере — подойдёт любой shared-хостинг,
     что укладывается в требование ТЗ по размещению и в бюджет. */
  output: "export",

  /* Адреса вида /documents/ вместо /documents.html — так каталоги
     раздаёт любой веб-сервер без правил переписывания URL */
  trailingSlash: true,

  /* Оптимизатор картинок требует сервер, при экспорте его нет */
  images: { unoptimized: true },
};

export default nextConfig;

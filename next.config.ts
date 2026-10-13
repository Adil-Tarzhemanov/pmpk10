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

  /* Своя страница 404 для неизвестных адресов (app/global-not-found.tsx):
     у сайта два корневых layout'а, и обычный not-found в 404.html не попадает */
  experimental: { globalNotFound: true },
};

export default nextConfig;

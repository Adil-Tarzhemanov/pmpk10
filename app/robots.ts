import type { MetadataRoute } from "next";
import { absoluteUrl, IS_PREVIEW } from "@/lib/site";

/* robots.txt и sitemap.xml — это route handlers. При output: "export"
   им нужно явно сказать, что ответ статический: иначе сборка считает,
   что обработчик может зависеть от запроса, и падает. */
export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  // Демо целиком закрыто: см. IS_PREVIEW в lib/site.ts
  if (IS_PREVIEW) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Админку CMS индексировать незачем
      disallow: "/admin/",
    },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}

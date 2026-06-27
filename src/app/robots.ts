import type { MetadataRoute } from "next";

/**
 * Next.js 16 robots.ts 约定
 *
 * 自动生成 /robots.txt：
 * - 允许所有爬虫（*）
 * - 允许收录静态公开页面
 * - 禁止收录需登录的路径（dashboard / admin / api / chat）
 * - 指向 sitemap.xml
 */
export default function robots(): MetadataRoute.Robots {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "https://randu.ai";

  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/workspace",
          "/docs",
          "/courses",
          "/dashboard/api-docs",
          "/workflow",
        ],
        disallow: [
          "/dashboard",
          "/admin",
          "/api",
          "/chat",
          "/login",
          "/register",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}

import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

// 站点基础 URL（必须配置 NEXT_PUBLIC_APP_URL）
function getBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_APP_URL;
  if (!url) {
    // 兜底：避免构建时抛错
    return "https://randuai.cn";
  }
  return url.replace(/\/$/, "");
}

// 静态页面配置：路径 + 更新频率 + 优先级
const STATIC_ROUTES: Array<{
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
}> = [
  { path: "/", changeFrequency: "daily", priority: 1.0 },
  { path: "/workspace", changeFrequency: "daily", priority: 0.9 },
  { path: "/marketplace", changeFrequency: "daily", priority: 0.9 },
  { path: "/pricing", changeFrequency: "weekly", priority: 0.7 },
  { path: "/credits", changeFrequency: "weekly", priority: 0.6 },
  { path: "/artifacts", changeFrequency: "monthly", priority: 0.5 },
  { path: "/academy/articles", changeFrequency: "weekly", priority: 0.7 },
  { path: "/academy/videos", changeFrequency: "weekly", priority: 0.7 },
  { path: "/docs", changeFrequency: "weekly", priority: 0.8 },
  { path: "/courses", changeFrequency: "weekly", priority: 0.8 },
  { path: "/dashboard/api-docs", changeFrequency: "weekly", priority: 0.7 },
  { path: "/login", changeFrequency: "yearly", priority: 0.3 },
  { path: "/register", changeFrequency: "yearly", priority: 0.4 },
];

/**
 * Next.js 16 sitemap.ts 约定
 *
 * 自动生成 /sitemap.xml，包含：
 * - 静态页面（首页、工作台、教程、课程、API 文档）
 * - 工作流详情页 /workflow/[id]（动态查询数据库）
 *
 * 不包含需要登录的页面（dashboard、admin 等）。
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getBaseUrl();
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((r) => ({
    url: `${baseUrl}${r.path}`,
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));

  // 动态查询所有 active 工作流
  let workflowEntries: MetadataRoute.Sitemap = [];
  try {
    const workflows = await prisma.workflow.findMany({
      where: { status: "active" },
      select: {
        id: true,
        updatedAt: true,
      },
      orderBy: { sortOrder: "asc" },
    });

    workflowEntries = workflows.map((w) => ({
      url: `${baseUrl}/workflow/${w.id}`,
      lastModified: w.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));
  } catch {
    // 数据库不可用时返回静态 sitemap
  }

  return [...staticEntries, ...workflowEntries];
}

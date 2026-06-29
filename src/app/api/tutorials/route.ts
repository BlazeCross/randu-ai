import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 允许的教程类型
const ALLOWED_TYPES = ["article", "video"];

/**
 * GET /api/tutorials - 公开教程列表
 *
 * 查询参数：
 * - type: 类型筛选（article | video），不传则返回全部
 *
 * 返回已发布的教程（published=true），按 sortOrder 升序排序。
 * 无需鉴权，但 VIP 教程仅返回元信息 + 摘要，content/videoUrl 字段被过滤。
 * 调用 /api/tutorials/[id] 可在登录且订阅后获取完整内容。
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type")?.trim() || undefined;

  const where: Record<string, unknown> = { published: true };
  if (type && ALLOWED_TYPES.includes(type)) {
    where.type = type;
  }

  const tutorials = await prisma.tutorial.findMany({
    where,
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    select: {
      id: true,
      type: true,
      title: true,
      category: true,
      cover: true,
      excerpt: true,
      sortOrder: true,
      studyCount: true,
      viewCount: true,
      accessLevel: true,
      createdAt: true,
      // 注意：故意不返回 content / videoUrl
      // VIP 教程完整内容需登录且订阅后通过 /api/tutorials/[id] 获取
      // free 教程的完整内容也通过 [id] 获取，列表仅返回摘要
    },
  });

  return NextResponse.json({ tutorials });
}

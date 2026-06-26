import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

// 历史记录分页大小
const PAGE_SIZE = 20;

/**
 * GET /api/history - 任务历史记录（分页）
 *
 * 返回当前用户的任务历史，关联 Workflow 获取名称和图标，
 * 支持通过 ?status=completed|failed|running 过滤，?page=1 分页。
 */
export const GET = requireAuth(async (request, { userId }) => {
  const url = new URL(request.url);
  const page = Math.max(1, Number(url.searchParams.get("page") ?? "1"));
  const status = url.searchParams.get("status");

  // 构建查询条件
  const where: { userId: string; status?: string } = { userId };
  if (
    status &&
    ["pending", "running", "completed", "failed"].includes(status)
  ) {
    where.status = status;
  }

  // 并行查询：列表 + 总数（减少串行 RTT）
  const [items, total] = await Promise.all([
    prisma.usageLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        workflow: {
          select: {
            id: true,
            name: true,
            icon: true,
            category: true,
            // Phase 2.8：新增 outputType，便于前台按输出类型渲染结果
            outputType: true,
            // coverImage 用于无 thumbnail 时回退缩略图
            coverImage: true,
          },
        },
      },
    }),
    prisma.usageLog.count({ where }),
  ]);

  return NextResponse.json({
    items,
    total,
    page,
    pageSize: PAGE_SIZE,
    totalPages: Math.ceil(total / PAGE_SIZE),
  });
});

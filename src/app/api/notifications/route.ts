import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

// 列表分页大小
const PAGE_SIZE = 20;

/**
 * GET /api/notifications - 通知列表 + 未读数
 *
 * 返回最近的通知（分页），同时附带 unreadCount 供导航栏红点使用。
 * 通过 ?page=1 分页，默认第 1 页。
 */
export const GET = requireAuth(async (request, { userId }) => {
  const url = new URL(request.url);
  const page = Math.max(1, Number(url.searchParams.get("page") ?? "1"));

  // 并行查询：列表 + 未读数（减少串行 RTT）
  const [items, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        type: true,
        title: true,
        content: true,
        link: true,
        isRead: true,
        createdAt: true,
      },
    }),
    prisma.notification.count({ where: { userId } }),
    prisma.notification.count({ where: { userId, isRead: false } }),
  ]);

  return NextResponse.json({
    items,
    total,
    unreadCount,
    page,
    pageSize: PAGE_SIZE,
    totalPages: Math.ceil(total / PAGE_SIZE),
  });
});

/**
 * PATCH /api/notifications - 全部标记为已读
 *
 * 将当前用户所有未读通知标记为已读，返回更新条数。
 */
export const PATCH = requireAuth(async (_request, { userId }) => {
  const result = await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });
  return NextResponse.json({ updated: result.count });
});

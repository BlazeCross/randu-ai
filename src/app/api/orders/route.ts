import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

const PAGE_SIZE = 20;

/**
 * GET /api/orders - 当前用户的订单列表
 *
 * 分页查询当前登录用户的订单，按创建时间倒序。
 * 支持通过 status 参数筛选（pending | paid | failed）。
 *
 * 响应：
 * - items: 订单数组
 * - total: 总数
 * - page / pageSize / totalPages
 */
export const GET = requireAuth(async (request, { userId }) => {
  const url = new URL(request.url);
  const page = Math.max(1, Number(url.searchParams.get("page") ?? "1"));
  const status = url.searchParams.get("status")?.trim() || undefined;

  // 校验 status 合法值
  const validStatuses = ["pending", "paid", "failed", "refunded"];
  const where: Record<string, unknown> = { userId };
  if (status && validStatuses.includes(status)) {
    where.status = status;
  }

  const [items, total] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        orderNo: true,
        type: true,
        credits: true,
        amount: true,
        status: true,
        paymentMethod: true,
        paymentId: true,
        paidAt: true,
        createdAt: true,
        plan: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    }),
    prisma.order.count({ where }),
  ]);

  return NextResponse.json({
    items: items.map((o) => ({
      ...o,
      amount: Number(o.amount),
    })),
    total,
    page,
    pageSize: PAGE_SIZE,
    totalPages: Math.ceil(total / PAGE_SIZE),
  });
});

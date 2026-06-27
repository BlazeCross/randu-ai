import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

const PAGE_SIZE = 20;

const VALID_STATUSES = ["pending", "paid", "failed", "refunded"];
const VALID_TYPES = ["subscription", "credits"];

/**
 * GET /api/admin/orders - 后台订单列表
 *
 * admin 及以上权限可访问。
 * 支持分页 + 多条件筛选：
 * - page: 页码（默认 1）
 * - status: 订单状态（pending | paid | failed | refunded）
 * - type: 订单类型（subscription | credits）
 * - userId: 指定用户 ID
 * - orderNo: 订单号模糊搜索
 *
 * 响应：
 * - items: 订单列表（含关联的用户和套餐信息）
 * - total / page / pageSize / totalPages
 * - stats: 各状态订单统计
 */
export const GET = requireAdmin(async (request) => {
  const url = new URL(request.url);
  const page = Math.max(1, Number(url.searchParams.get("page") ?? "1"));
  const status = url.searchParams.get("status")?.trim() || undefined;
  const type = url.searchParams.get("type")?.trim() || undefined;
  const userId = url.searchParams.get("userId")?.trim() || undefined;
  const orderNo = url.searchParams.get("orderNo")?.trim() || undefined;

  // 构建查询条件
  const where: Record<string, unknown> = {};
  if (status && VALID_STATUSES.includes(status)) {
    where.status = status;
  }
  if (type && VALID_TYPES.includes(type)) {
    where.type = type;
  }
  if (userId) {
    where.userId = userId;
  }
  if (orderNo) {
    where.orderNo = { contains: orderNo, mode: "insensitive" };
  }

  // 并行查询：列表 + 总数 + 统计
  const [items, total, stats] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        orderNo: true,
        userId: true,
        type: true,
        credits: true,
        amount: true,
        status: true,
        paymentMethod: true,
        paymentId: true,
        paidAt: true,
        createdAt: true,
        refundStatus: true,
        refundedAt: true,
        plan: {
          select: { id: true, name: true },
        },
        user: {
          select: { id: true, nickname: true, email: true, phone: true },
        },
      },
    }),
    prisma.order.count({ where }),
    // 统计各状态订单数（仅针对全部订单，不受筛选影响）
    prisma.order.groupBy({
      by: ["status"],
      _count: { status: true },
    }),
  ]);

  // 转换统计为对象
  const statusStats: Record<string, number> = {
    pending: 0,
    paid: 0,
    failed: 0,
    refunded: 0,
  };
  for (const s of stats) {
    statusStats[s.status] = s._count.status;
  }

  return NextResponse.json({
    items: items.map((o) => ({
      ...o,
      amount: Number(o.amount),
    })),
    total,
    page,
    pageSize: PAGE_SIZE,
    totalPages: Math.ceil(total / PAGE_SIZE),
    stats: statusStats,
  });
});

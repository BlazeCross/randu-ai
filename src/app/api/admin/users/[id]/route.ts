import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

/**
 * GET /api/admin/users/[id] - 获取单个用户详情（含关联统计）
 *
 * 返回完整字段（不含 passwordHash）+ 关联统计：
 * - usageLogCount: 使用记录数
 * - orderCount: 订单数
 * - apiKeyCount: API Key 数
 * - paidOrderCount: 已支付订单数
 *
 * admin 及以上权限可调用。用户不存在返回 404。
 */
export const GET = requireAdmin(async (_request, { params }) => {
  const { id } = await params!;

  if (!id) {
    return NextResponse.json({ message: "缺少用户 ID" }, { status: 400 });
  }

  // 并行查询用户详情与各关联统计
  const [user, usageLogCount, orderCount, apiKeyCount, paidOrderCount] =
    await Promise.all([
      prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          email: true,
          phone: true,
          role: true,
          nickname: true,
          avatar: true,
          status: true,
          trialExpiresAt: true,
          isSubscribed: true,
          subscriptionPlan: true,
          credits: true,
          totalUsed: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.usageLog.count({ where: { userId: id } }),
      prisma.order.count({ where: { userId: id } }),
      prisma.apiKey.count({ where: { userId: id } }),
      prisma.order.count({ where: { userId: id, status: "paid" } }),
    ]);

  if (!user) {
    return NextResponse.json({ message: "用户不存在" }, { status: 404 });
  }

  return NextResponse.json({
    user: {
      ...user,
      usageLogCount,
      orderCount,
      apiKeyCount,
      paidOrderCount,
    },
  });
});

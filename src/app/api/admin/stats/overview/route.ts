import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getOnlineCount } from "@/lib/online";

/**
 * GET /api/admin/stats/overview - 后台数据概览
 *
 * 返回平台核心指标：
 * - 用户：总数、今日新增、活跃用户数、被拉黑用户数
 * - 工作流：上架中数量、总数量
 * - 使用：今日调用次数、累计调用次数、今日成功/失败次数
 * - 在线：当前在线人数（最近 2 分钟心跳）
 * - 收入：今日订单数、今日已支付金额、累计已支付金额
 *
 * admin 及以上权限可调用。
 */
export const GET = requireAdmin(async () => {
  // 今日零点（上海时区），用于"今日"统计
  const now = new Date();
  const todayStart = new Date(
    Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), -8, 0, 0, 0),
  );

  // 并行查询所有指标，减少总耗时
  const [
    totalUsers,
    newUsersToday,
    blockedUsers,
    activeWorkflows,
    totalWorkflows,
    usageToday,
    totalUsage,
    successUsageToday,
    failedUsageToday,
    ordersToday,
    paidRevenueToday,
    totalPaidRevenue,
  ] = await Promise.all([
    // 用户统计
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: todayStart } } }),
    prisma.user.count({ where: { status: "blocked" } }),
    // 工作流统计（不含软删除）
    prisma.workflow.count({ where: { isDeleted: false, status: "active" } }),
    prisma.workflow.count({ where: { isDeleted: false } }),
    // 使用量统计
    prisma.usageLog.count({ where: { createdAt: { gte: todayStart } } }),
    prisma.usageLog.count(),
    prisma.usageLog.count({
      where: { createdAt: { gte: todayStart }, status: "completed" },
    }),
    prisma.usageLog.count({
      where: { createdAt: { gte: todayStart }, status: "failed" },
    }),
    // 订单统计
    prisma.order.count({ where: { createdAt: { gte: todayStart } } }),
    prisma.order.aggregate({
      _sum: { amount: true },
      where: {
        status: "paid",
        paidAt: { gte: todayStart },
      },
    }),
    prisma.order.aggregate({
      _sum: { amount: true },
      where: { status: "paid" },
    }),
  ]);

  return NextResponse.json({
    users: {
      total: totalUsers,
      newToday: newUsersToday,
      blocked: blockedUsers,
    },
    workflows: {
      active: activeWorkflows,
      total: totalWorkflows,
    },
    usage: {
      today: usageToday,
      total: totalUsage,
      successToday: successUsageToday,
      failedToday: failedUsageToday,
    },
    online: getOnlineCount(),
    revenue: {
      ordersToday,
      paidToday: Number(paidRevenueToday._sum.amount ?? 0),
      totalPaid: Number(totalPaidRevenue._sum.amount ?? 0),
    },
    fetchedAt: now.toISOString(),
  });
});

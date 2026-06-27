import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

// 上海时区 UTC+8，用于将本地零点转换为 UTC
const SHANGHAI_OFFSET_HOURS = -8;

/**
 * 将 "YYYY-MM-DD" 字符串解析为该日上海零点对应的 UTC Date
 * @param dateStr 日期字符串，如 "2026-06-27"
 * @returns 上海时间当日 00:00:00 的 UTC Date
 */
function parseShanghaiDateStart(dateStr: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]) - 1; // Date.UTC 月份从 0 开始
  const day = Number(match[3]);
  // 上海 00:00:00 = UTC 前一天 16:00:00，即偏移 -8 小时
  return new Date(Date.UTC(year, month, day, SHANGHAI_OFFSET_HOURS, 0, 0, 0));
}

/**
 * 将上海零点 Date 增加指定天数
 */
function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

/**
 * 将 UTC Date 转换为上海时区的 "YYYY-MM-DD" 字符串
 */
function toShanghaiDateString(date: Date): string {
  // 上海时间 = UTC + 8 小时
  const shanghai = new Date(date.getTime() + 8 * 60 * 60 * 1000);
  const year = shanghai.getUTCFullYear();
  const month = String(shanghai.getUTCMonth() + 1).padStart(2, "0");
  const day = String(shanghai.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * GET /api/admin/stats/cost - 成本核算
 *
 * admin 及以上权限可访问。
 * 查询参数：
 * - startDate: 起始日期（YYYY-MM-DD，默认今日）
 * - endDate: 截止日期（YYYY-MM-DD，默认今日，含当日）
 *
 * 返回：
 * - totalCost：总 API 成本（CallLog.apiCost 之和）
 * - totalRevenue：总收入（已支付订单金额之和）
 * - profit：利润 = 收入 - 成本
 * - profitMargin：利润率 = 利润 / 收入
 * - breakdown：按 endpoint 分组的成本统计
 * - dailyTrend：按天分组的成本趋势
 */
export const GET = requireAdmin(async (request) => {
  const url = new URL(request.url);
  const startDateParam = url.searchParams.get("startDate")?.trim();
  const endDateParam = url.searchParams.get("endDate")?.trim();

  // 今日零点（上海时区）
  const now = new Date();
  const todayStart = new Date(
    Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), SHANGHAI_OFFSET_HOURS, 0, 0, 0),
  );

  // 解析起始日期，默认今日
  let startDate: Date;
  if (startDateParam) {
    const parsed = parseShanghaiDateStart(startDateParam);
    if (!parsed) {
      return NextResponse.json(
        { message: "startDate 格式错误，需为 YYYY-MM-DD" },
        { status: 400 },
      );
    }
    startDate = parsed;
  } else {
    startDate = todayStart;
  }

  // 解析截止日期，默认今日（含当日，所以 endDate 为次日零点， exclusive）
  let endDate: Date;
  if (endDateParam) {
    const parsed = parseShanghaiDateStart(endDateParam);
    if (!parsed) {
      return NextResponse.json(
        { message: "endDate 格式错误，需为 YYYY-MM-DD" },
        { status: 400 },
      );
    }
    // 含当日：endDate 设为次日零点（exclusive 上界）
    endDate = addDays(parsed, 1);
  } else {
    // 默认今日含当日：明日零点
    endDate = addDays(todayStart, 1);
  }

  // 起始不能晚于截止
  if (startDate >= endDate) {
    return NextResponse.json(
      { message: "startDate 不能晚于 endDate" },
      { status: 400 },
    );
  }

  // 并行查询：总成本 + 总收入 + 按 endpoint 分组
  const [costAggregate, revenueAggregate, breakdownGroup] = await Promise.all([
    // 总 API 成本
    prisma.callLog.aggregate({
      _sum: { apiCost: true },
      where: {
        createdAt: { gte: startDate, lt: endDate },
      },
    }),
    // 总收入（已支付订单）
    prisma.order.aggregate({
      _sum: { amount: true },
      where: {
        status: "paid",
        paidAt: { gte: startDate, lt: endDate },
      },
    }),
    // 按 endpoint 分组的成本
    prisma.callLog.groupBy({
      by: ["endpoint"],
      _sum: { apiCost: true },
      _count: { id: true },
      where: {
        createdAt: { gte: startDate, lt: endDate },
      },
      orderBy: { endpoint: "asc" },
    }),
  ]);

  const totalCost = Number(costAggregate._sum.apiCost ?? 0);
  const totalRevenue = Number(revenueAggregate._sum.amount ?? 0);
  const profit = totalRevenue - totalCost;
  const profitMargin = totalRevenue > 0 ? profit / totalRevenue : 0;

  // 按天分组的成本趋势：查询范围内的调用记录，JS 聚合到天
  const dailyLogs = await prisma.callLog.findMany({
    where: {
      createdAt: { gte: startDate, lt: endDate },
    },
    select: {
      apiCost: true,
      createdAt: true,
    },
  });

  // 按上海日期聚合
  const dailyMap = new Map<string, { cost: number; count: number }>();
  for (const log of dailyLogs) {
    const dateStr = toShanghaiDateString(log.createdAt);
    const existing = dailyMap.get(dateStr) ?? { cost: 0, count: 0 };
    existing.cost += Number(log.apiCost);
    existing.count += 1;
    dailyMap.set(dateStr, existing);
  }

  // 转为数组并按日期升序
  const dailyTrend = Array.from(dailyMap.entries())
    .map(([date, val]) => ({
      date,
      cost: Math.round(val.cost * 10000) / 10000, // 保留 4 位小数
      count: val.count,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // breakdown 转换
  const breakdown = breakdownGroup.map((g) => ({
    endpoint: g.endpoint,
    cost: Math.round(Number(g._sum.apiCost ?? 0) * 10000) / 10000,
    count: g._count.id,
  }));

  return NextResponse.json({
    startDate: toShanghaiDateString(startDate),
    endDate: toShanghaiDateString(addDays(endDate, -1)),
    totalCost: Math.round(totalCost * 10000) / 10000,
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    profit: Math.round(profit * 100) / 100,
    profitMargin: Math.round(profitMargin * 10000) / 10000,
    breakdown,
    dailyTrend,
    fetchedAt: new Date().toISOString(),
  });
});

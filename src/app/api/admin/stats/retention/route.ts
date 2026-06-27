import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

// 上海时区 UTC+8，用于将本地零点转换为 UTC
const SHANGHAI_OFFSET_HOURS = -8;
// 最大可查询天数
const MAX_DAYS = 90;
// 留存分析的留存偏移天数
const RETENTION_OFFSETS = [1, 3, 7, 14, 30] as const;
// 最大偏移天数（用于扩展活动数据查询窗口）
const MAX_OFFSET_DAYS = Math.max(...RETENTION_OFFSETS);

interface CohortRow {
  cohort_date: Date;
  size: bigint;
  d0: bigint;
  d1: bigint;
  d3: bigint;
  d7: bigint;
  d14: bigint;
  d30: bigint;
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
  const shanghai = new Date(date.getTime() + 8 * 60 * 60 * 1000);
  const year = shanghai.getUTCFullYear();
  const month = String(shanghai.getUTCMonth() + 1).padStart(2, "0");
  const day = String(shanghai.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * GET /api/admin/stats/retention - 留存分析（cohort 矩阵）
 *
 * 查询参数：
 * - days：统计最近 N 天的注册用户（默认 30，最大 90）
 *
 * 返回 cohort 留存矩阵：
 * - cohorts：按注册日期分组（每日一个 cohort）
 * - 每个 cohort：注册日期、注册人数、D0/D1/D3/D7/D14/D30 留存人数与留存率
 * - 留存定义：用户在某天有 CallLog 或 EventLog 记录
 *
 * 使用单条 SQL 完成，避免 N+1；按时间范围过滤活动数据避免全表扫描。
 */
export const GET = requireAdmin(async (request) => {
  try {
    const url = new URL(request.url);
    const daysParam = url.searchParams.get("days")?.trim();

    let days = 30;
    if (daysParam) {
      const parsed = Number(daysParam);
      if (!Number.isFinite(parsed) || parsed <= 0) {
        return NextResponse.json(
          { message: "days 需为正整数" },
          { status: 400 },
        );
      }
      days = Math.min(Math.floor(parsed), MAX_DAYS);
    }

    // 今日零点（上海时区），作为 endDate（不含）
    const now = new Date();
    const todayStart = new Date(
      Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), SHANGHAI_OFFSET_HOURS, 0, 0, 0),
    );
    // 起始日期 = 今日零点 - days 天
    const startDate = addDays(todayStart, -days);

    // 活动数据查询窗口需覆盖到最后一个 cohort 的 D30 留存，
    // 即 endDate + 最大偏移天数（多留 1 天保证边界完整）
    const activityEnd = addDays(todayStart, MAX_OFFSET_DAYS + 1);

    // 单条 SQL 完成 cohort 留存矩阵计算
    // - cohort：取 days 天内注册的用户，按上海日期分组
    // - activity：取 call_logs + event_logs 的 (user_id, 活动日) 去重集合
    // - LEFT JOIN 后用条件聚合统计各留存日的活跃用户数
    // 使用 (created_at + INTERVAL '8 hours')::date 转换为上海时区日期，
    // 与现有 toShanghaiDateString 逻辑保持一致
    const rows = await prisma.$queryRaw<CohortRow[]>`
      WITH cohort AS (
        SELECT
          id,
          (created_at + INTERVAL '8 hours')::date AS cohort_date
        FROM users
        WHERE created_at >= ${startDate} AND created_at < ${todayStart}
      ),
      activity AS (
        SELECT user_id, (created_at + INTERVAL '8 hours')::date AS act_date
        FROM call_logs
        WHERE created_at >= ${startDate} AND created_at < ${activityEnd}
        UNION
        SELECT user_id, (created_at + INTERVAL '8 hours')::date AS act_date
        FROM event_logs
        WHERE created_at >= ${startDate} AND created_at < ${activityEnd}
      )
      SELECT
        c.cohort_date,
        COUNT(DISTINCT c.id) AS size,
        COUNT(DISTINCT CASE WHEN a.act_date = c.cohort_date THEN c.id END) AS d0,
        COUNT(DISTINCT CASE WHEN a.act_date = c.cohort_date + 1 THEN c.id END) AS d1,
        COUNT(DISTINCT CASE WHEN a.act_date = c.cohort_date + 3 THEN c.id END) AS d3,
        COUNT(DISTINCT CASE WHEN a.act_date = c.cohort_date + 7 THEN c.id END) AS d7,
        COUNT(DISTINCT CASE WHEN a.act_date = c.cohort_date + 14 THEN c.id END) AS d14,
        COUNT(DISTINCT CASE WHEN a.act_date = c.cohort_date + 30 THEN c.id END) AS d30
      FROM cohort c
      LEFT JOIN activity a ON a.user_id = c.id
      GROUP BY c.cohort_date
      ORDER BY c.cohort_date DESC
    `;

    // 转换为前端友好结构（bigint → number，计算留存率）
    const cohorts = rows.map((row) => {
      const size = Number(row.size);
      const d0 = Number(row.d0);
      const d1 = Number(row.d1);
      const d3 = Number(row.d3);
      const d7 = Number(row.d7);
      const d14 = Number(row.d14);
      const d30 = Number(row.d30);
      // 留存率 = 留存人数 / 注册人数；cohort 为空时记为 0
      const rate = (n: number) =>
        size > 0 ? Math.round((n / size) * 1000) / 1000 : 0;
      return {
        date: toShanghaiDateString(row.cohort_date),
        size,
        d0: { count: d0, rate: rate(d0) },
        d1: { count: d1, rate: rate(d1) },
        d3: { count: d3, rate: rate(d3) },
        d7: { count: d7, rate: rate(d7) },
        d14: { count: d14, rate: rate(d14) },
        d30: { count: d30, rate: rate(d30) },
      };
    });

    return NextResponse.json({
      days,
      cohorts,
      fetchedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("留存分析查询失败:", error);
    return NextResponse.json(
      { message: "服务器内部错误" },
      { status: 500 },
    );
  }
});

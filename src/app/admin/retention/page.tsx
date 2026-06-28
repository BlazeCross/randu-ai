"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

interface CohortRetention {
  date: string;
  size: number;
  d0: { count: number; rate: number };
  d1: { count: number; rate: number };
  d3: { count: number; rate: number };
  d7: { count: number; rate: number };
  d14: { count: number; rate: number };
  d30: { count: number; rate: number };
}

interface RetentionResponse {
  days: number;
  cohorts: CohortRetention[];
  fetchedAt: string;
}

// 留存列配置
const RETENTION_COLUMNS: { key: keyof CohortRetention; label: string }[] = [
  { key: "d0", label: "D0" },
  { key: "d1", label: "D1" },
  { key: "d3", label: "D3" },
  { key: "d7", label: "D7" },
  { key: "d14", label: "D14" },
  { key: "d30", label: "D30" },
];

// 可选统计天数
const DAYS_OPTIONS = [7, 14, 30, 60, 90];

/**
 * 根据留存率计算背景色（越高越绿，越低越浅）
 * - 0%      → 透明
 * - 1~100%  → 从浅绿到深绿的渐变
 */
function rateBgColor(rate: number): string {
  if (rate <= 0) return "transparent";
  // 留存率 0~1，映射到 alpha 0.1~0.6
  const alpha = Math.min(0.1 + rate * 0.5, 0.6).toFixed(2);
  // 使用 success 色（绿色）的 rgb + 动态 alpha
  return `rgba(34, 197, 94, ${alpha})`;
}

export default function AdminRetentionPage() {
  const { token } = useAuth();

  const [days, setDays] = useState(30);
  const [data, setData] = useState<RetentionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRetention = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("days", String(days));

      const res = await fetch(
        `/api/admin/stats/retention?${params.toString()}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (!res.ok) {
        const msg = await res.json().catch(() => ({}));
        throw new Error(msg.message || `请求失败 (${res.status})`);
      }
      const result = (await res.json()) as RetentionResponse;
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "获取留存数据失败");
    } finally {
      setLoading(false);
    }
  }, [token, days]);

  useEffect(() => {
    fetchRetention();
  }, [fetchRetention]);

  return (
    <div className="space-y-5">
      {/* 面包屑 */}
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/admin" className="hover:text-foreground">
          后台首页
        </Link>
        <span className="text-muted-foreground">/</span>
        <span className="font-medium text-foreground">留存分析</span>
      </nav>

      {/* 日期范围选择器 */}
      <div className="rounded-[var(--radius)] border border-border bg-card p-4 shadow-[var(--shadow-xs)]">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              统计周期（最近 N 天注册用户）
            </label>
            <select
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="rounded-[var(--radius-sm)] border border-border bg-card px-3 py-2 text-sm focus:border-primary/50 focus:shadow-[var(--glow-primary)] focus:outline-none transition-all duration-200"
            >
              {DAYS_OPTIONS.map((d) => (
                <option key={d} value={d}>
                  最近 {d} 天
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={fetchRetention}
            className="rounded-[var(--radius-sm)] bg-gradient-to-r from-primary to-primary-500 px-4 py-2 text-sm font-medium text-white shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] transition-colors"
          >
            查询
          </button>
        </div>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="rounded-[var(--radius-sm)] border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* 留存说明 */}
      <div className="rounded-[var(--radius-sm)] border border-border bg-background px-4 py-3 text-xs text-muted-foreground">
        <p>
          留存定义：用户在某天有调用记录（CallLog）或行为埋点（EventLog）即视为当日留存。
          单元格显示「留存人数 / 注册人数 (留存率%)」，颜色越深表示留存率越高。
        </p>
      </div>

      {/* Cohort 留存表格 */}
      <div className="overflow-hidden rounded-[var(--radius)] border border-border bg-card shadow-[var(--shadow-sm)]">
        <div className="border-b border-border px-4 py-3 sm:px-6">
          <h2 className="text-sm font-semibold text-foreground">
            Cohort 留存矩阵
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {data
              ? `共 ${data.cohorts.length} 个 cohort · 最近 ${data.days} 天`
              : "按注册日期分组，统计各 cohort 的留存情况"}
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <svg
              className="h-8 w-8 animate-spin text-primary"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
          </div>
        ) : !data || data.cohorts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-sm text-muted-foreground">
            <p>暂无留存数据</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="sticky left-0 z-10 bg-muted/50 px-3 py-2.5 text-left text-xs uppercase tracking-wider font-medium text-muted-foreground">
                    注册日期
                  </th>
                  <th className="px-3 py-2.5 text-right text-xs uppercase tracking-wider font-medium text-muted-foreground">
                    注册人数
                  </th>
                  {RETENTION_COLUMNS.map((col) => (
                    <th
                      key={col.key}
                      className="px-3 py-2.5 text-center text-xs uppercase tracking-wider font-medium text-muted-foreground"
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.cohorts.map((cohort) => (
                  <tr
                    key={cohort.date}
                    className="border-b border-border last:border-0 hover:bg-muted/50"
                  >
                    <td className="sticky left-0 z-10 bg-card px-3 py-2.5 font-medium text-foreground">
                      {cohort.date}
                    </td>
                    <td className="px-3 py-2.5 text-right text-foreground">
                      {cohort.size}
                    </td>
                    {RETENTION_COLUMNS.map((col) => {
                      const cell = cohort[col.key] as {
                        count: number;
                        rate: number;
                      };
                      const percent = (cell.rate * 100).toFixed(1);
                      return (
                        <td
                          key={col.key}
                          className="px-3 py-2.5 text-center"
                          style={{ backgroundColor: rateBgColor(cell.rate) }}
                          title={`留存 ${cell.count} / ${cohort.size} (${percent}%)`}
                        >
                          <div className="font-medium text-foreground">
                            {cell.count}
                            <span className="text-muted-foreground">
                              {" "}
                              / {cohort.size}
                            </span>
                          </div>
                          <div className="text-[11px] text-muted-foreground">
                            {percent}%
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

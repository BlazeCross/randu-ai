"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

interface BreakdownItem {
  endpoint: string;
  cost: number;
  count: number;
}

interface DailyTrendItem {
  date: string;
  cost: number;
  count: number;
}

interface CostResponse {
  startDate: string;
  endDate: string;
  totalCost: number;
  totalRevenue: number;
  profit: number;
  profitMargin: number;
  breakdown: BreakdownItem[];
  dailyTrend: DailyTrendItem[];
  fetchedAt: string;
}

// 获取今日日期字符串（YYYY-MM-DD），使用本地时区
function todayStr(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// 金额格式化
function formatMoney(value: number): string {
  return value.toFixed(2);
}

export default function AdminCostPage() {
  const { token } = useAuth();

  // 日期范围，默认今日
  const [startDate, setStartDate] = useState(todayStr());
  const [endDate, setEndDate] = useState(todayStr());

  const [data, setData] = useState<CostResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCost = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("startDate", startDate);
      params.set("endDate", endDate);

      const res = await fetch(`/api/admin/stats/cost?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const msg = await res.json().catch(() => ({}));
        throw new Error(msg.message || `请求失败 (${res.status})`);
      }
      const result = (await res.json()) as CostResponse;
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "获取成本数据失败");
    } finally {
      setLoading(false);
    }
  }, [token, startDate, endDate]);

  useEffect(() => {
    fetchCost();
  }, [fetchCost]);

  // 统计卡片配置
  const cards = [
    {
      label: "总成本",
      value: data ? `¥${formatMoney(data.totalCost)}` : "—",
      desc: "API 调用成本",
      color: "text-red-600",
    },
    {
      label: "总收入",
      value: data ? `¥${formatMoney(data.totalRevenue)}` : "—",
      desc: "已支付订单",
      color: "text-success-700",
    },
    {
      label: "利润",
      value: data ? `¥${formatMoney(data.profit)}` : "—",
      desc: "收入 - 成本",
      color: data && data.profit >= 0 ? "text-primary-700" : "text-red-600",
    },
    {
      label: "利润率",
      value: data ? `${(data.profitMargin * 100).toFixed(2)}%` : "—",
      desc: "利润 / 收入",
      color: "text-foreground",
    },
  ];

  return (
    <div className="space-y-5">
      {/* 面包屑 */}
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/admin" className="hover:text-foreground">
          后台首页
        </Link>
        <span className="text-muted-foreground">/</span>
        <span className="font-medium text-foreground">成本核算</span>
      </nav>

      {/* 日期范围选择器 */}
      <div className="rounded-[var(--radius)] border border-border bg-card p-4 shadow-[var(--shadow-xs)]">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              起始日期
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="rounded-[var(--radius-sm)] border border-border bg-card px-3 py-2 text-sm focus:border-primary/50 focus:shadow-[var(--glow-primary)] focus:outline-none transition-all duration-200"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              截止日期
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="rounded-[var(--radius-sm)] border border-border bg-card px-3 py-2 text-sm focus:border-primary/50 focus:shadow-[var(--glow-primary)] focus:outline-none transition-all duration-200"
            />
          </div>
          <button
            onClick={fetchCost}
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

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-[var(--radius-sm)] border border-border bg-card p-4 shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] transition-all duration-200"
          >
            <p className="text-xs font-medium text-muted-foreground">
              {card.label}
            </p>
            <p className={`mt-1 font-mono text-2xl font-bold tabular-nums ${card.color}`}>
              {loading ? "—" : card.value}
            </p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">{card.desc}</p>
          </div>
        ))}
      </div>

      {/* 按接口分组的成本明细 */}
      <div className="overflow-hidden rounded-[var(--radius)] border border-border bg-card shadow-[var(--shadow-xs)]">
        <div className="border-b border-border px-4 py-3 sm:px-6">
          <h2 className="text-sm font-semibold text-foreground">
            接口成本明细
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {data
              ? `${data.startDate} ~ ${data.endDate}`
              : "按接口分组的成本统计"}
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
        ) : !data || data.breakdown.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm text-muted-foreground">所选区间暂无调用记录</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground sm:px-6">
                    接口
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    调用次数
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    成本（元）
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    占比
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-card">
                {data.breakdown.map((item) => {
                  const ratio =
                    data.totalCost > 0
                      ? (item.cost / data.totalCost) * 100
                      : 0;
                  return (
                    <tr key={item.endpoint} className="hover:bg-muted/30 transition-colors duration-100">
                      <td className="px-4 py-3 text-sm font-mono text-foreground sm:px-6">
                        {item.endpoint}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-muted-foreground">
                        {item.count}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-semibold text-red-600">
                        ¥{item.cost.toFixed(4)}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-muted-foreground">
                        {ratio.toFixed(1)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              {data.breakdown.length > 0 && (
                <tfoot className="bg-background">
                  <tr>
                    <td className="px-4 py-3 text-sm font-medium text-foreground sm:px-6">
                      合计
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-medium text-foreground">
                      {data.breakdown.reduce(
                        (sum, item) => sum + item.count,
                        0,
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-bold text-red-600">
                      ¥{data.totalCost.toFixed(4)}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-muted-foreground">
                      100%
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}
      </div>

      {/* 每日成本趋势 */}
      {data && data.dailyTrend.length > 0 && (
        <div className="overflow-hidden rounded-[var(--radius)] border border-border bg-card shadow-[var(--shadow-xs)]">
          <div className="border-b border-border px-4 py-3 sm:px-6">
            <h2 className="text-sm font-semibold text-foreground">
              每日成本趋势
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground sm:px-6">
                    日期
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    调用次数
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    成本（元）
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-card">
                {data.dailyTrend.map((item) => (
                  <tr key={item.date} className="hover:bg-muted/30 transition-colors duration-100">
                    <td className="px-4 py-3 text-sm text-foreground sm:px-6">
                      {item.date}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-muted-foreground">
                      {item.count}
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-semibold text-red-600">
                      ¥{item.cost.toFixed(4)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

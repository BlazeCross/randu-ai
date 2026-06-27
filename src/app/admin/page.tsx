"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";

/**
 * 后台数据概览接口（对应 /api/admin/stats/overview 返回结构）
 */
interface OverviewData {
  users: {
    total: number;
    newToday: number;
    blocked: number;
  };
  workflows: {
    active: number;
    total: number;
  };
  usage: {
    today: number;
    total: number;
    successToday: number;
    failedToday: number;
  };
  online: number;
  revenue: {
    ordersToday: number;
    paidToday: number;
    totalPaid: number;
  };
  fetchedAt: string;
}

/**
 * 数据卡片配置
 */
interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  /** 副标题中需要高亮的数字（如"今日新增 +5"中的 5） */
  highlight?: boolean;
  icon: React.ReactNode;
  accent: "primary" | "success" | "amber" | "blue" | "purple" | "red";
}

// 主题色映射
const ACCENT_STYLES: Record<
  StatCardProps["accent"],
  { bg: string; iconBg: string; iconText: string }
> = {
  primary: {
    bg: "from-primary-50 to-white",
    iconBg: "bg-primary-100",
    iconText: "text-primary-600",
  },
  success: {
    bg: "from-success-50 to-white",
    iconBg: "bg-success-100",
    iconText: "text-success-600",
  },
  amber: {
    bg: "from-amber-50 to-white",
    iconBg: "bg-amber-100",
    iconText: "text-amber-600",
  },
  blue: {
    bg: "from-blue-50 to-white",
    iconBg: "bg-blue-100",
    iconText: "text-blue-600",
  },
  purple: {
    bg: "from-purple-50 to-white",
    iconBg: "bg-purple-100",
    iconText: "text-purple-600",
  },
  red: {
    bg: "from-red-50 to-white",
    iconBg: "bg-red-100",
    iconText: "text-red-600",
  },
};

/**
 * 单个数据卡片
 */
function StatCard({
  title,
  value,
  subtitle,
  highlight,
  icon,
  accent,
}: StatCardProps) {
  const styles = ACCENT_STYLES[accent];
  return (
    <div
      className={`relative overflow-hidden rounded-[var(--radius)] border border-border bg-gradient-to-br ${styles.bg} p-5 transition-shadow hover:shadow-md`}
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="mt-2 text-3xl font-bold text-foreground">{value}</p>
          {subtitle && (
            <p className="mt-1 text-xs text-muted-foreground">
              {highlight ? (
                <span className="font-semibold text-success-600">
                  {subtitle}
                </span>
              ) : (
                subtitle
              )}
            </p>
          )}
        </div>
        <div
          className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-[var(--radius-sm)] ${styles.iconBg} ${styles.iconText}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

/**
 * 格式化金额：分 → 元（数据库 amount 是 Decimal 元，直接展示）
 */
function formatCurrency(amount: number): string {
  return `¥${amount.toFixed(2)}`;
}

/**
 * 格式化时间戳为 "HH:mm:ss"
 */
function formatTime(iso: string): string {
  return new Date(iso).toLocaleString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

/**
 * 后台首页：数据概览
 *
 * - 拉取 /api/admin/stats/overview 获取平台核心指标
 * - 6 个数据卡片：用户、工作流、在线、今日使用、今日收入、累计收入
 * - 60 秒自动刷新 + 手动刷新按钮
 * - 失败时显示错误提示和重试按钮
 */
export default function AdminHomePage() {
  const { token } = useAuth();
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!token) return;
    try {
      setError(null);
      const res = await fetch("/api/admin/stats/overview", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const msg = await res.json().catch(() => ({}));
        throw new Error(msg.message || `请求失败 (${res.status})`);
      }
      const json = (await res.json()) as OverviewData;
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "获取数据失败");
    } finally {
      setLoading(false);
    }
  }, [token]);

  // 初始加载 + 60 秒自动刷新
  useEffect(() => {
    fetchData();
    const timer = setInterval(fetchData, 60 * 1000);
    return () => clearInterval(timer);
  }, [fetchData]);

  // 手动刷新
  const handleRefresh = () => {
    setLoading(true);
    fetchData();
  };

  // 加载中（首次）
  if (loading && !data) {
    return (
      <div className="flex h-full items-center justify-center">
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
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      </div>
    );
  }

  // 错误态（且无数据）
  if (error && !data) {
    return (
      <div className="flex h-full flex-col items-center justify-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
          <svg
            className="h-7 w-7 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <p className="mb-4 text-sm text-foreground">{error}</p>
        <button
          onClick={handleRefresh}
          className="rounded-[var(--radius-sm)] bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover"
        >
          重试
        </button>
      </div>
    );
  }

  if (!data) return null;

  // 使用量成功率（避免除零）
  const successRate =
    data.usage.today > 0
      ? Math.round((data.usage.successToday / data.usage.today) * 100)
      : null;

  return (
    <div className="space-y-6">
      {/* 顶部：标题 + 刷新按钮 + 更新时间 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            平台数据概览
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {data.fetchedAt && `最后更新：${formatTime(data.fetchedAt)}`}
            {error && (
              <span className="ml-2 text-red-600">（刷新失败：{error}）</span>
            )}
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] border border-border bg-card px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted disabled:opacity-50"
        >
          <svg
            className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          刷新
        </button>
      </div>

      {/* 数据卡片网格 */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* 总用户数 */}
        <StatCard
          title="总用户数"
          value={data.users.total}
          subtitle={
            data.users.newToday > 0
              ? `今日新增 +${data.users.newToday}`
              : "今日暂无新增"
          }
          highlight={data.users.newToday > 0}
          accent="primary"
          icon={
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={1.8}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-5.13a4 4 0 11-8 0 4 4 0 018 0zm6 0a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
          }
        />

        {/* 工作流数 */}
        <StatCard
          title="工作流数"
          value={data.workflows.total}
          subtitle={`上架中 ${data.workflows.active} 个`}
          accent="blue"
          icon={
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={1.8}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 6a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM9 9h6m-6 4h6m-6 4h4"
              />
            </svg>
          }
        />

        {/* 在线人数 */}
        <StatCard
          title="当前在线"
          value={data.online}
          subtitle="最近 2 分钟心跳"
          accent="success"
          icon={
            <span className="relative flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success-400 opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-success-500" />
            </span>
          }
        />

        {/* 今日使用量 */}
        <StatCard
          title="今日使用量"
          value={data.usage.today}
          subtitle={
            successRate !== null
              ? `成功率 ${successRate}%（成功 ${data.usage.successToday} / 失败 ${data.usage.failedToday}）`
              : "暂无调用"
          }
          accent="purple"
          icon={
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={1.8}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          }
        />

        {/* 今日收入 */}
        <StatCard
          title="今日收入"
          value={formatCurrency(data.revenue.paidToday)}
          subtitle={`今日订单 ${data.revenue.ordersToday} 笔`}
          accent="amber"
          icon={
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={1.8}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          }
        />

        {/* 累计收入 */}
        <StatCard
          title="累计收入"
          value={formatCurrency(data.revenue.totalPaid)}
          subtitle={`累计使用 ${data.usage.total} 次`}
          accent="red"
          icon={
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={1.8}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          }
        />
      </div>

      {/* 被拉黑用户提示 */}
      {data.users.blocked > 0 && (
        <div className="rounded-[var(--radius-sm)] border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-center gap-3">
            <svg
              className="h-5 w-5 flex-shrink-0 text-amber-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <p className="text-sm text-amber-900">
              当前有 <strong>{data.users.blocked}</strong> 个用户处于封禁状态，
              可在「用户管理」中查看详情。
            </p>
          </div>
        </div>
      )}

      {/* 提示信息 */}
      <div className="rounded-[var(--radius-sm)] border border-border bg-card p-4">
        <div className="flex items-start gap-3">
          <svg
            className="mt-0.5 h-5 w-5 flex-shrink-0 text-muted-foreground"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={1.8}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div className="text-sm text-muted-foreground">
            <p className="font-medium text-foreground">数据说明</p>
            <ul className="mt-1 space-y-0.5 text-xs text-muted-foreground">
              <li>· 数据每 60 秒自动刷新一次，也可点击右上角手动刷新</li>
              <li>· "今日"按上海时区（UTC+8）零点计算</li>
              <li>· "在线人数"基于最近 2 分钟心跳统计，容器重启后会清零</li>
              <li>· 收入仅统计已支付订单，未支付订单不计入</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

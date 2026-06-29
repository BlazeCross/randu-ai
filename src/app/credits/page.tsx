"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { SkeletonListItem } from "@/components/ui/Skeleton";
import { cx } from "@/lib/cn";

// ===== 类型定义 =====

// 使用记录类型（对应 /api/user/usage 返回的 usageLogs 元素）
interface UsageLog {
  id: string;
  userId: string;
  workflowId: string;
  taskId: string | null;
  status: string;
  tokensUsed: number;
  creditsCost: number;
  source: string;
  inputUrl: string | null;
  outputUrl: string | null;
  thumbnail: string | null;
  errorMessage: string | null;
  createdAt: string;
  completedAt: string | null;
  workflow: {
    id: string;
    name: string;
    icon: string | null;
    category: string;
    outputType: string;
  } | null;
}

// /api/user/usage 接口返回结构
interface UsageData {
  usageLogs: UsageLog[];
  trialUsageCount: number;
  trialLimit: number;
  trialExpiresAt: string;
  isTrialExpired: boolean;
}

// 状态标签配置
const statusConfig: Record<
  string,
  { label: string; bg: string; text: string }
> = {
  pending: {
    label: "等待中",
    bg: "bg-muted",
    text: "text-muted-foreground",
  },
  running: {
    label: "运行中",
    bg: "bg-accent",
    text: "text-accent-foreground",
  },
  completed: {
    label: "已完成",
    bg: "bg-success/15",
    text: "text-success",
  },
  failed: {
    label: "失败",
    bg: "bg-destructive/15",
    text: "text-destructive",
  },
};

// 赚取积分方式
const EARN_METHODS: Array<{
  title: string;
  desc: string;
  reward: string;
  href?: string;
  cta?: string;
  icon: "gift" | "users" | "cart" | "calendar";
}> = [
  {
    title: "每日签到",
    desc: "每日登录并完成一次签到即可领取积分奖励，连续签到可获更多积分",
    reward: "+5 积分/日",
    href: "/dashboard",
    cta: "去签到",
    icon: "calendar",
  },
  {
    title: "邀请好友",
    desc: "分享你的专属邀请码给好友注册，双方均可获得积分奖励，多邀多得",
    reward: "+50 积分/人",
    href: "/dashboard/invite",
    cta: "查看邀请",
    icon: "users",
  },
  {
    title: "购买积分包",
    desc: "选择适合的积分套餐或点数包套餐，立即获得大量积分，购买越多越优惠",
    reward: "最低 7 折",
    href: "/pricing",
    cta: "立即购买",
    icon: "cart",
  },
  {
    title: "注册赠送",
    desc: "新用户首次注册将自动获得赠送积分，开启你的 AI 工作流之旅",
    reward: "+500 积分",
    href: "/register",
    cta: "去注册",
    icon: "gift",
  },
];

// 积分套餐购买入口卡片（点击跳转 /pricing）
const CREDIT_PACKAGES: Array<{
  name: string;
  price: string;
  credits: string;
  highlight: boolean;
  tag?: string;
}> = [
  {
    name: "体验包",
    price: "¥6",
    credits: "50 积分",
    highlight: false,
    tag: "7 天有效",
  },
  {
    name: "月卡",
    price: "¥30",
    credits: "300 积分",
    highlight: false,
    tag: "30 天有效",
  },
  {
    name: "季卡",
    price: "¥88",
    credits: "1000 积分",
    highlight: true,
    tag: "9 折优惠",
  },
  {
    name: "年卡",
    price: "¥299",
    credits: "5000 积分",
    highlight: false,
    tag: "85 折优惠",
  },
];

// 格式化日期时间
function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function CreditsPage() {
  const { user, token, loading } = useAuth();

  const [usageData, setUsageData] = useState<UsageData | null>(null);
  const [usageLoading, setUsageLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 已登录时拉取使用记录
  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    setError(null);
    // 通过微任务延迟 setState，避免 effect 内同步 setState 触发级联渲染
    Promise.resolve()
      .then(() => {
        if (cancelled) return null;
        setUsageLoading(true);
        return fetch("/api/user/usage", {
          headers: { Authorization: `Bearer ${token}` },
        });
      })
      .then((res) => (res && res.ok ? res.json() : null))
      .then((data: UsageData | null) => {
        if (cancelled) return;
        if (data) {
          setUsageData(data);
        } else {
          setError("获取积分明细失败，请稍后重试");
        }
      })
      .catch(() => {
        if (cancelled) return;
        setError("网络错误，请稍后重试");
      })
      .finally(() => {
        if (!cancelled) setUsageLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  // 加载中：显示加载动画
  if (loading) {
    return (
      <main className="flex flex-1 items-center justify-center bg-background">
        <svg
          className="h-10 w-10 animate-spin text-primary"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden
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
      </main>
    );
  }

  // 未登录：显示登录提示
  if (!user) {
    return (
      <main className="flex flex-1 items-center justify-center bg-background px-4">
        <div className="text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <svg
              className="h-8 w-8 text-muted-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              aria-hidden
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
          <h2 className="mb-2 text-xl font-semibold text-foreground">
            请先登录
          </h2>
          <p className="mb-6 text-sm text-muted-foreground">
            登录后即可查看你的积分余额与消费记录
          </p>
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary-hover"
          >
            前往登录
          </Link>
        </div>
      </main>
    );
  }

  // 当前积分余额
  const credits = user.credits ?? 0;

  // 已消费积分总数（从 usageLogs 累计 creditsCost）
  const totalUsed = usageData
    ? usageData.usageLogs.reduce(
        (sum, log) => sum + (log.creditsCost > 0 ? log.creditsCost : 0),
        0,
      )
    : 0;

  return (
    <main className="flex-1 bg-background">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {/* 面包屑 + 标题 */}
        <div className="mb-6">
          <nav className="mb-2 text-xs text-muted-foreground">
            <Link href="/dashboard" className="hover:text-primary">
              个人中心
            </Link>
            <span className="mx-1">/</span>
            <span className="text-muted-foreground">我的积分</span>
          </nav>
          <h1 className="text-2xl font-bold text-foreground">我的积分</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            查看积分余额、消费明细与赚取方式
          </p>
        </div>

        {/* ===== Hero：积分余额卡片 ===== */}
        <section className="mb-8 relative overflow-hidden rounded-[var(--radius)] border border-primary/30 bg-gradient-to-br from-primary/5 via-card to-card p-6 sm:p-8">
          {/* 装饰 */}
          <div className="pointer-events-none absolute inset-0" aria-hidden>
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
            <div className="absolute -left-10 bottom-0 h-40 w-40 rounded-full bg-primary/5 blur-3xl" />
          </div>
          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-muted-foreground">当前积分余额</p>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-5xl font-bold tracking-tight text-primary sm:text-6xl">
                  {credits.toLocaleString()}
                </span>
                <span className="text-base text-muted-foreground">积分</span>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span>
                  当前套餐：
                  <span className="font-medium text-foreground">
                    {user.subscriptionPlan || "免费版"}
                  </span>
                </span>
                <span>
                  累计消耗：
                  <span className="font-medium text-foreground">
                    {totalUsed} 积分
                  </span>
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Link
                href="/pricing"
                className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-primary to-primary-400 px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-sm)] transition-all hover:shadow-[var(--shadow-md)] hover:brightness-110"
              >
                充值积分
              </Link>
              <Link
                href="/dashboard/invite"
                className="inline-flex items-center justify-center rounded-full border border-border bg-card px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-accent/30"
              >
                邀请赚积分
              </Link>
            </div>
          </div>
        </section>

        {/* ===== 积分套餐购买入口 ===== */}
        <section className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-foreground">
              积分套餐
            </h2>
            <Link
              href="/pricing"
              className="text-sm font-medium text-primary hover:text-primary-hover"
            >
              查看全部 →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {CREDIT_PACKAGES.map((pkg) => (
              <Link
                key={pkg.name}
                href="/pricing"
                className={cx(
                  "group flex flex-col rounded-[var(--radius)] border bg-card p-4 transition-all duration-200 hover:-translate-y-0.5",
                  pkg.highlight
                    ? "border-primary shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)]"
                    : "border-border hover:border-primary/30",
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-foreground">
                    {pkg.name}
                  </span>
                  {pkg.tag && (
                    <span
                      className={cx(
                        "rounded-full px-1.5 py-0.5 text-[10px] font-medium",
                        pkg.highlight
                          ? "bg-primary/15 text-primary"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      {pkg.tag}
                    </span>
                  )}
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {pkg.credits}
                </p>
                <div className="mt-3 flex items-baseline">
                  <span
                    className={cx(
                      "text-xl font-bold",
                      pkg.highlight ? "text-primary" : "text-foreground",
                    )}
                  >
                    {pkg.price}
                  </span>
                </div>
                <span
                  className={cx(
                    "mt-3 inline-flex items-center justify-center rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                    pkg.highlight
                      ? "bg-primary text-primary-foreground group-hover:brightness-110"
                      : "border border-border bg-background text-foreground group-hover:border-primary/40",
                  )}
                >
                  立即购买
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* ===== 积分明细列表 ===== */}
        <section className="mb-8 rounded-[var(--radius)] border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-4 py-4 sm:px-6">
            <h2 className="text-base font-semibold text-foreground">
              积分明细
            </h2>
            {usageData && usageData.usageLogs.length > 0 && (
              <Link
                href="/dashboard/history"
                className="text-sm font-medium text-primary hover:text-primary-hover"
              >
                查看全部 →
              </Link>
            )}
          </div>

          {error && (
            <div className="border-b border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive sm:px-6">
              {error}
            </div>
          )}

          {usageLoading ? (
            <div className="divide-y divide-border">
              {Array.from({ length: 5 }).map((_, i) => (
                <SkeletonListItem key={i} />
              ))}
            </div>
          ) : usageData && usageData.usageLogs.length > 0 ? (
            <div className="divide-y divide-border">
              {usageData.usageLogs.slice(0, 10).map((log) => {
                const status =
                  statusConfig[log.status] || statusConfig.pending;
                const cost = log.creditsCost > 0 ? log.creditsCost : 0;
                return (
                  <div
                    key={log.id}
                    className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium text-foreground">
                          {log.workflow?.name ?? "未知工作流"}
                        </span>
                        {log.source === "api" && (
                          <span className="inline-flex items-center rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground">
                            API
                          </span>
                        )}
                        <span
                          className={cx(
                            "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                            status.bg,
                            status.text,
                          )}
                        >
                          {status.label}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatDate(log.createdAt)}
                        {log.tokensUsed > 0 && ` · ${log.tokensUsed} tokens`}
                      </p>
                    </div>
                    <div className="text-right">
                      {cost > 0 ? (
                        <span className="text-sm font-semibold text-destructive">
                          -{cost}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          不消耗
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <svg
                  className="h-6 w-6 text-muted-foreground"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  aria-hidden
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </div>
              <p className="text-sm text-muted-foreground">暂无积分明细</p>
              <p className="mt-1 text-xs text-muted-foreground">
                使用工作流后将在此处显示积分消耗记录
              </p>
              <Link
                href="/workspace"
                className="mt-4 text-sm font-medium text-primary hover:text-primary-hover"
              >
                去使用工作流 →
              </Link>
            </div>
          )}
        </section>

        {/* ===== 赚取积分方式 ===== */}
        <section>
          <div className="mb-4">
            <h2 className="text-base font-semibold text-foreground">
              赚取积分
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              多种方式获取积分，畅享 AI 工作流
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {EARN_METHODS.map((method) => (
              <div
                key={method.title}
                className="flex items-start gap-4 rounded-[var(--radius)] border border-border bg-card p-5 transition-colors hover:border-primary/30"
              >
                {/* 图标 */}
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <EarnIcon name={method.icon} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-semibold text-foreground">
                      {method.title}
                    </h3>
                    <span className="inline-flex items-center rounded-full bg-success/15 px-2 py-0.5 text-xs font-medium text-success">
                      {method.reward}
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                    {method.desc}
                  </p>
                  {method.href && method.cta && (
                    <Link
                      href={method.href}
                      className="mt-3 inline-flex items-center text-xs font-medium text-primary hover:text-primary-hover"
                    >
                      {method.cta}
                      <svg
                        className="ml-0.5 h-3 w-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        aria-hidden
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

// ===== 辅助组件 =====

// 赚取积分方式图标
function EarnIcon({ name }: { name: "gift" | "users" | "cart" | "calendar" }) {
  const path = {
    gift: "M20 12v10H4V12M2 7h20v5H2zM12 22V7M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z",
    users:
      "M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 10-4-4 4 4 0 004 4zm6 0a4 4 0 10-4-4",
    cart:
      "M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z",
    calendar:
      "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
  }[name];

  return (
    <svg
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      strokeWidth={2}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d={path}
      />
    </svg>
  );
}

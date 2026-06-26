"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import UpgradePrompt from "@/components/upgrade/UpgradePrompt";
import SubscriptionCard, {
  type TrialStatus,
} from "@/components/dashboard/SubscriptionCard";

// 使用记录类型（对应 /api/user/usage 返回的 usageLogs 元素）
interface UsageLog {
  id: string;
  userId: string;
  workflowId: string;
  taskId: string | null;
  status: string;
  tokensUsed: number;
  inputUrl: string | null;
  outputUrl: string | null;
  errorMessage: string | null;
  createdAt: string;
  completedAt: string | null;
}

// 使用记录接口返回结构
interface UsageData {
  usageLogs: UsageLog[];
  trialUsageCount: number;
  trialLimit: number;
  trialExpiresAt: string;
  isTrialExpired: boolean;
}

// 状态标签配置：颜色和文案
const statusConfig: Record<
  string,
  { label: string; bg: string; text: string }
> = {
  pending: {
    label: "等待中",
    bg: "bg-neutral-100",
    text: "text-neutral-600",
  },
  running: {
    label: "运行中",
    bg: "bg-primary-100",
    text: "text-primary-700",
  },
  completed: {
    label: "已完成",
    bg: "bg-success-100",
    text: "text-success-700",
  },
  failed: {
    label: "失败",
    bg: "bg-red-100",
    text: "text-red-600",
  },
};

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

export default function DashboardPage() {
  const router = useRouter();
  const { user, token, loading, logout } = useAuth();

  const [usageData, setUsageData] = useState<UsageData | null>(null);
  const [usageLoading, setUsageLoading] = useState(false);
  // 升级套餐弹窗：null 表示不显示，'expired' 试用过期，'limit_reached' 次数用完
  const [upgradeReason, setUpgradeReason] = useState<
    "limit_reached" | "expired" | null
  >(null);

  // 已登录时获取使用记录
  useEffect(() => {
    if (!token) return;
    let cancelled = false;
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
        if (data) setUsageData(data);
      })
      .catch(() => {
        // 获取使用记录失败，静默处理
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
      <main className="flex flex-1 items-center justify-center bg-neutral-50">
        <svg
          className="h-10 w-10 animate-spin text-primary"
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
      </main>
    );
  }

  // 未登录：提示登录
  if (!user) {
    return (
      <main className="flex flex-1 items-center justify-center bg-neutral-50 px-4">
        <div className="text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100">
            <svg
              className="h-8 w-8 text-neutral-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
          <h2 className="mb-2 text-xl font-semibold text-neutral-900">
            请先登录
          </h2>
          <p className="mb-6 text-sm text-neutral-500">
            登录后即可查看个人中心和使用记录
          </p>
          <button
            onClick={() => router.push("/login")}
            className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-primary-600/25 transition-all hover:bg-primary-hover"
          >
            前往登录
          </button>
        </div>
      </main>
    );
  }

  // 试用使用次数与上限（SubscriptionCard 内部计算进度条）
  const trialUsageCount = usageData?.trialUsageCount ?? 0;
  const trialLimit = usageData?.trialLimit ?? 10;

  // 套餐状态
  const isSubscribed = user.isSubscribed;
  const isTrialExpired = user.isTrialExpired;
  // 试用次数已用完（未订阅且达到上限）
  const trialLimitReached = !isSubscribed && trialUsageCount >= trialLimit;

  return (
    <main className="flex-1 bg-neutral-50">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {/* 页面标题 */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">个人中心</h1>
            <p className="mt-1 text-sm text-neutral-500">
              管理你的账号、试用状态和使用记录
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/history"
              className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-50"
            >
              任务历史
            </Link>
            <Link
              href="/dashboard/keys"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-hover"
            >
              API Key 管理
            </Link>
            <button
              onClick={() => {
                logout();
                router.push("/login");
              }}
              className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-600 transition-colors hover:border-neutral-400 hover:text-neutral-900"
            >
              退出登录
            </button>
          </div>
        </div>

        {/* 试用过期/次数用完提示横幅：已订阅用户不显示 */}
        {!isSubscribed && (isTrialExpired || trialLimitReached) && (
          <div
            className={`mb-6 flex flex-col items-start justify-between gap-4 rounded-2xl border p-5 sm:flex-row sm:items-center ${
              isTrialExpired
                ? "border-red-200 bg-red-50"
                : "border-amber-200 bg-amber-50"
            }`}
          >
            <div className="flex items-start gap-3">
              <svg
                className={`mt-0.5 h-5 w-5 flex-shrink-0 ${
                  isTrialExpired ? "text-red-600" : "text-amber-600"
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div>
                <p
                  className={`text-sm font-semibold ${
                    isTrialExpired ? "text-red-900" : "text-amber-900"
                  }`}
                >
                  {isTrialExpired
                    ? "试用已过期，请升级套餐继续使用"
                    : `试用次数已用完（${trialUsageCount}/${trialLimit} 次）`}
                </p>
                <p
                  className={`mt-0.5 text-xs ${
                    isTrialExpired ? "text-red-700" : "text-amber-700"
                  }`}
                >
                  {isTrialExpired
                    ? "您的 7 天试用期已结束，升级后即可无限制使用"
                    : "试用额度已用完，升级套餐即可继续使用"}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() =>
                setUpgradeReason(isTrialExpired ? "expired" : "limit_reached")
              }
              className={`inline-flex flex-shrink-0 items-center justify-center rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors ${
                isTrialExpired
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-primary hover:bg-primary-hover"
              }`}
            >
              升级套餐
            </button>
          </div>
        )}

        {/* 顶部：用户信息卡片 + 订阅状态卡片 */}
        <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* 用户信息卡片 */}
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-base font-semibold text-neutral-900">
              账号信息
            </h2>
            <div className="space-y-3">
              {/* 邮箱 */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-500">邮箱</span>
                <span className="text-sm font-medium text-neutral-900">
                  {user.email || "未绑定"}
                </span>
              </div>
              {/* 手机号 */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-500">手机号</span>
                <span className="text-sm font-medium text-neutral-900">
                  {user.phone || "未绑定"}
                </span>
              </div>
              {/* 注册时间 */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-500">注册时间</span>
                <span className="text-sm font-medium text-neutral-900">
                  {formatDate(user.createdAt)}
                </span>
              </div>
              {/* 套餐状态 */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-500">套餐状态</span>
                {isSubscribed ? (
                  <span className="inline-flex items-center rounded-full bg-success-100 px-3 py-0.5 text-xs font-medium text-success-700">
                    已订阅
                    {user.subscriptionPlan && ` · ${user.subscriptionPlan}`}
                  </span>
                ) : isTrialExpired ? (
                  <span className="inline-flex items-center rounded-full bg-red-100 px-3 py-0.5 text-xs font-medium text-red-600">
                    试用已过期
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full bg-primary-100 px-3 py-0.5 text-xs font-medium text-primary-700">
                    试用中
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* 订阅状态卡片：根据状态展示试用中/已订阅/试用已过期 */}
          <SubscriptionCard
            user={user}
            trialStatus={
              {
                trialUsageCount,
                trialLimit,
                trialExpiresAt: usageData?.trialExpiresAt ?? user.trialExpiresAt,
                isTrialExpired,
              } satisfies TrialStatus
            }
            onUpgrade={() =>
              setUpgradeReason(
                isTrialExpired ? "expired" : trialLimitReached ? "limit_reached" : "expired",
              )
            }
          />
        </div>

        {/* 使用记录列表 */}
        <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm">
          <div className="border-b border-neutral-200 px-4 py-4 sm:px-6">
            <h2 className="text-base font-semibold text-neutral-900">
              使用记录
            </h2>
          </div>

          {usageLoading ? (
            // 使用记录加载中
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
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            </div>
          ) : usageData && usageData.usageLogs.length > 0 ? (
            // 使用记录列表
            <div className="divide-y divide-neutral-100">
              {usageData.usageLogs.map((log) => {
                const status =
                  statusConfig[log.status] || statusConfig.pending;
                return (
                  <div
                    key={log.id}
                    className="flex items-center justify-between px-4 py-4 transition-colors hover:bg-neutral-50 sm:px-6"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-neutral-900">
                          工作流
                        </span>
                        <span className="text-xs text-neutral-400">
                          #{log.workflowId.slice(-8)}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-neutral-400">
                        {formatDate(log.createdAt)}
                        {log.tokensUsed > 0 &&
                          ` · 消耗 ${log.tokensUsed} tokens`}
                      </p>
                    </div>
                    <span
                      className={`ml-4 inline-flex flex-shrink-0 items-center rounded-full px-3 py-0.5 text-xs font-medium ${status.bg} ${status.text}`}
                    >
                      {status.label}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            // 无使用记录
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100">
                <svg
                  className="h-6 w-6 text-neutral-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </div>
              <p className="text-sm text-neutral-500">暂无使用记录</p>
              <Link
                href="/workspace"
                className="mt-4 text-sm font-medium text-primary hover:text-primary-hover"
              >
                去使用工作流 →
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* 升级套餐提示弹窗：试用过期或次数用完时显示 */}
      {upgradeReason && (
        <UpgradePrompt
          reason={upgradeReason}
          onClose={() => setUpgradeReason(null)}
        />
      )}
    </main>
  );
}

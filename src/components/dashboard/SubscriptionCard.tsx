"use client";

import { getPlanByName, type PlanInfo } from "@/lib/plans";
import type { User } from "@/lib/auth-context";

// 试用状态信息（对应 /api/user/usage 返回的试用相关字段）
export interface TrialStatus {
  // 试用期内已使用次数
  trialUsageCount: number;
  // 试用次数上限
  trialLimit: number;
  // 试用到期时间（ISO 字符串）
  trialExpiresAt: string;
  // 试用是否已过期
  isTrialExpired: boolean;
}

interface SubscriptionCardProps {
  // 当前登录用户信息
  user: User;
  // 试用状态信息
  trialStatus: TrialStatus;
  // 点击"升级套餐"/"续费"按钮的回调
  onUpgrade: () => void;
}

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

/**
 * 订阅状态卡片组件
 *
 * 根据用户当前的订阅状态展示不同内容：
 * - 试用中：显示"试用中"标签 + 到期时间 + 剩余天数 + 已用次数/上限
 * - 已订阅：显示当前套餐名 + 每日调用限额 + 续费/升级按钮
 * - 未订阅且试用过期：显示"试用已过期" + 升级套餐按钮
 *
 * 使用 Tailwind 主题色（primary/success/neutral）保证视觉一致性。
 */
export default function SubscriptionCard({
  user,
  trialStatus,
  onUpgrade,
}: SubscriptionCardProps) {
  const { isSubscribed, subscriptionPlan } = user;
  const { trialUsageCount, trialLimit, isTrialExpired } = trialStatus;

  // 已订阅：从套餐常量中获取套餐信息
  const subscribedPlan: PlanInfo | null = isSubscribed
    ? subscriptionPlan
      ? getPlanByName(subscriptionPlan)
      : null
    : null;

  // 试用使用进度百分比
  const progressPercent = Math.min((trialUsageCount / trialLimit) * 100, 100);

  // 已订阅状态
  if (isSubscribed) {
    return (
      <div className="rounded-2xl border border-success-200 bg-gradient-to-br from-success-50 to-white p-6 shadow-sm">
        {/* 头部：套餐状态标签 + 套餐名 */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-neutral-900">
            订阅状态
          </h2>
          <span className="inline-flex items-center rounded-full bg-success-100 px-3 py-0.5 text-xs font-medium text-success-700">
            已订阅
            {subscriptionPlan && ` · ${subscriptionPlan}`}
          </span>
        </div>

        <div className="space-y-3">
          {/* 当前套餐 */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-neutral-500">当前套餐</span>
            <span className="text-sm font-semibold text-neutral-900">
              {subscriptionPlan ?? "未知套餐"}
            </span>
          </div>

          {/* 每日调用限额 */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-neutral-500">每日调用限额</span>
            <span className="text-sm font-semibold text-primary-700">
              {subscribedPlan ? `${subscribedPlan.dailyLimit} 次/天` : "不限"}
            </span>
          </div>

          {/* 套餐功能（如有） */}
          {subscribedPlan && subscribedPlan.features.length > 0 && (
            <div>
              <span className="text-sm text-neutral-500">套餐权益</span>
              <ul className="mt-2 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                {subscribedPlan.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-1.5 text-xs text-neutral-600"
                  >
                    <svg
                      className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-success-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* 操作按钮：续费 / 升级 */}
        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={onUpgrade}
            className="inline-flex flex-1 items-center justify-center rounded-xl border border-primary-200 bg-white px-4 py-2.5 text-sm font-semibold text-primary-700 transition-colors hover:bg-primary-50"
          >
            续费
          </button>
          <button
            type="button"
            onClick={onUpgrade}
            className="inline-flex flex-1 items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary-600/25 transition-all hover:bg-primary-hover"
          >
            升级套餐
          </button>
        </div>
      </div>
    );
  }

  // 试用已过期状态
  if (isTrialExpired) {
    return (
      <div className="rounded-2xl border border-red-200 bg-gradient-to-br from-red-50 to-white p-6 shadow-sm">
        {/* 头部：试用已过期标签 */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-neutral-900">
            订阅状态
          </h2>
          <span className="inline-flex items-center rounded-full bg-red-100 px-3 py-0.5 text-xs font-medium text-red-600">
            试用已过期
          </span>
        </div>

        <div className="space-y-3">
          {/* 状态说明 */}
          <div className="rounded-xl bg-red-50/60 p-4">
            <div className="flex items-start gap-2.5">
              <svg
                className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600"
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
                <p className="text-sm font-semibold text-red-900">
                  试用已过期
                </p>
                <p className="mt-0.5 text-xs text-red-700">
                  您的试用期已结束，升级套餐即可继续使用全部功能
                </p>
              </div>
            </div>
          </div>

          {/* 试用到期时间 */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-neutral-500">试用到期时间</span>
            <span className="text-sm font-medium text-neutral-900">
              {formatDate(user.trialExpiresAt)}
            </span>
          </div>
        </div>

        {/* 升级套餐按钮 */}
        <button
          type="button"
          onClick={onUpgrade}
          className="mt-5 w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary-600/25 transition-all hover:bg-primary-hover"
        >
          升级套餐
        </button>
      </div>
    );
  }

  // 试用中状态（默认）
  return (
    <div className="rounded-2xl border border-primary-200 bg-gradient-to-br from-primary-50 to-white p-6 shadow-sm">
      {/* 头部：试用中标签 */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold text-neutral-900">
          订阅状态
        </h2>
        <span className="inline-flex items-center rounded-full bg-primary-100 px-3 py-0.5 text-xs font-medium text-primary-700">
          试用中
        </span>
      </div>

      <div className="space-y-4">
        {/* 试用到期时间 */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-neutral-500">试用到期时间</span>
          <span className="text-sm font-medium text-neutral-900">
            {formatDate(user.trialExpiresAt)}
          </span>
        </div>

        {/* 剩余天数 */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-neutral-500">剩余天数</span>
          <span
            className={`text-sm font-bold ${
              user.daysRemaining > 0 ? "text-success-600" : "text-red-600"
            }`}
          >
            {user.daysRemaining} 天
          </span>
        </div>

        {/* 试用使用次数 + 进度条 */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm text-neutral-500">试用使用次数</span>
            <span className="text-sm font-medium text-neutral-900">
              {trialUsageCount} / {trialLimit}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-100">
            <div
              className={`h-full rounded-full transition-all ${
                progressPercent >= 100
                  ? "bg-red-500"
                  : progressPercent >= 80
                    ? "bg-amber-500"
                    : "bg-primary"
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* 升级套餐按钮 */}
      <button
        type="button"
        onClick={onUpgrade}
        className="mt-5 w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary-600/25 transition-all hover:bg-primary-hover"
      >
        升级套餐
      </button>
    </div>
  );
}

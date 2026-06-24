"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TRIAL_LIMIT, TRIAL_DAYS } from "@/lib/trial";

// 升级提示原因
type UpgradeReason = "limit_reached" | "expired";

interface UpgradePromptProps {
  reason: UpgradeReason;
  onClose?: () => void;
}

// 套餐数据（硬编码，Phase 2 接入支付后可改为接口获取）
const PLANS = [
  {
    name: "基础版",
    price: "99",
    dailyLimit: "30 次/天",
    features: ["每日 30 次工作流调用", "基础工作流库访问", "社区技术支持", "标准响应速度"],
    highlighted: false,
  },
  {
    name: "专业版",
    price: "299",
    dailyLimit: "100 次/天",
    features: [
      "每日 100 次工作流调用",
      "全部工作流库访问",
      "优先技术支持",
      "加速响应速度",
    ],
    highlighted: true,
  },
  {
    name: "企业版",
    price: "999",
    dailyLimit: "1000 次/天",
    features: [
      "每日 1000 次工作流调用",
      "专属工作流定制",
      "专属客户经理",
      "SLA 服务保障",
    ],
    highlighted: false,
  },
];

/**
 * 升级套餐提示弹窗
 *
 * 触发场景：
 * - limit_reached：试用次数已用完（10 次）
 * - expired：7 天试用期已结束
 *
 * 展示三个套餐对比，点击"立即升级"暂时提示支付功能即将开放（Phase 2）
 */
export default function UpgradePrompt({ reason, onClose }: UpgradePromptProps) {
  const router = useRouter();
  const [showPayTip, setShowPayTip] = useState(false);

  // 标题与说明文案
  const title = reason === "limit_reached" ? "试用次数已用完" : "试用已过期";
  const description =
    reason === "limit_reached"
      ? `您已使用完 ${TRIAL_LIMIT} 次免费试用额度，升级套餐即可继续使用`
      : `您的 ${TRIAL_DAYS} 天试用期已结束，升级套餐即可继续使用`;

  // 关闭弹窗
  const handleClose = () => {
    setShowPayTip(false);
    onClose?.();
  };

  // 点击"立即升级"：暂时提示支付功能即将开放，或跳转个人中心
  const handleUpgrade = () => {
    setShowPayTip(true);
  };

  // 跳转个人中心
  const handleGoDashboard = () => {
    handleClose();
    router.push("/dashboard");
  };

  return (
    // 遮罩层：点击空白处关闭
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="upgrade-prompt-title"
    >
      <div
        className="animate-scale-in relative max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 关闭按钮 */}
        <button
          type="button"
          onClick={handleClose}
          aria-label="关闭"
          className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100 text-neutral-500 transition-colors hover:bg-neutral-200 hover:text-neutral-700"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* 头部：标题与说明 */}
        <div className="border-b border-neutral-100 px-6 py-8 text-center sm:px-10">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary-100">
            <svg
              className="h-7 w-7 text-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
          <h2
            id="upgrade-prompt-title"
            className="text-2xl font-bold text-neutral-900"
          >
            {title}
          </h2>
          <p className="mt-2 text-sm text-neutral-600">{description}</p>
        </div>

        {/* 套餐对比 */}
        <div className="px-6 py-8 sm:px-10">
          <h3 className="mb-6 text-center text-base font-semibold text-neutral-900">
            选择适合你的套餐
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-6">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`relative flex flex-col rounded-2xl border p-5 transition-all ${
                  plan.highlighted
                    ? "border-primary-600 bg-primary-50/40 shadow-lg shadow-primary-600/10"
                    : "border-neutral-200 bg-white"
                }`}
              >
                {/* 推荐标签 */}
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="inline-flex rounded-full bg-primary px-3 py-0.5 text-xs font-semibold text-white shadow">
                      推荐
                    </span>
                  </div>
                )}

                {/* 套餐名称 */}
                <h4 className="text-base font-semibold text-neutral-900">
                  {plan.name}
                </h4>

                {/* 价格 */}
                <div className="mt-3 flex items-baseline">
                  <span className="text-3xl font-bold tracking-tight text-neutral-900">
                    ¥{plan.price}
                  </span>
                  <span className="ml-1 text-sm text-neutral-500">/月</span>
                </div>

                {/* 每日次数 */}
                <p className="mt-1 text-xs font-medium text-primary-700">
                  {plan.dailyLimit}
                </p>

                {/* 功能列表 */}
                <ul className="mt-4 flex-1 space-y-2">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-2 text-xs text-neutral-600"
                    >
                      <svg
                        className="mt-0.5 h-4 w-4 flex-shrink-0 text-success-500"
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

                {/* 立即升级按钮 */}
                <button
                  type="button"
                  onClick={handleUpgrade}
                  className={`mt-5 w-full rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
                    plan.highlighted
                      ? "bg-primary text-white hover:bg-primary-hover"
                      : "bg-neutral-100 text-neutral-900 hover:bg-neutral-200"
                  }`}
                >
                  立即升级
                </button>
              </div>
            ))}
          </div>

          {/* 底部：跳转个人中心 */}
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={handleGoDashboard}
              className="text-sm font-medium text-neutral-500 transition-colors hover:text-primary"
            >
              前往个人中心查看账号信息 →
            </button>
          </div>
        </div>

        {/* 支付功能即将开放提示（Phase 2） */}
        {showPayTip && (
          <div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4"
            onClick={(e) => e.stopPropagation()}
            role="alertdialog"
            aria-modal="true"
          >
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary-100">
                <svg
                  className="h-6 w-6 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="mb-2 text-lg font-semibold text-neutral-900">
                支付功能即将开放
              </h3>
              <p className="mb-6 text-sm text-neutral-500">
                在线订阅支付功能正在开发中（Phase 2），敬请期待
              </p>
              <button
                type="button"
                onClick={() => setShowPayTip(false)}
                className="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
              >
                知道了
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

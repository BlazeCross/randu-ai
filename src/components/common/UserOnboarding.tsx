"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

const ONBOARDING_KEY = "onboarding_completed";

// 引导步骤配置
const STEPS = [
  {
    title: "欢迎使用燃渡AI",
    description: "燃渡AI 是一站式 AI 工作流服务平台，让你能够触手可及地使用各类 AI 能力。",
    features: [
      { label: "工作流", desc: "Coze 工作流执行，自动化处理复杂任务" },
      { label: "智能体对话", desc: "多场景智能体，随时在线交流" },
      { label: "API 接入", desc: "开放 API，便捷集成到你的应用" },
    ],
  },
  {
    title: "新用户福利",
    description: "我们已为你账户赠送 500 积分，可在工作台中自由使用各项 AI 能力。",
    features: [],
  },
  {
    title: "开始探索",
    description: "准备好开始你的 AI 之旅了吗？选择一个入口立即体验。",
    features: [],
  },
] as const;

/**
 * 新用户引导弹窗
 *
 * - 仅在用户登录后、且未完成引导时显示
 * - 使用 localStorage 标记 onboarding_completed，避免重复打扰
 * - 3 步介绍，最后一步引导前往工作台或智能体
 */
export default function UserOnboarding() {
  const { user, loading } = useAuth();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // 未登录或加载中不处理
    if (loading || !user) return;
    try {
      const done = localStorage.getItem(ONBOARDING_KEY);
      if (!done) {
        // 通过微任务延迟 setState，避免 effect 内同步 setState 触发级联渲染
        Promise.resolve().then(() => setOpen(true));
      }
    } catch {
      // localStorage 不可用（隐私模式等），静默忽略
    }
  }, [loading, user]);

  const complete = () => {
    try {
      localStorage.setItem(ONBOARDING_KEY, "1");
    } catch {
      // 忽略写入失败
    }
    setOpen(false);
  };

  if (!open) return null;

  return <OnboardingModal onClose={complete} />;
}

function OnboardingModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0);
  const total = STEPS.length;
  const current = STEPS[step];
  const isLast = step === total - 1;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="新用户引导"
    >
      <div className="animate-scale-in relative w-full max-w-md overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-2xl">
        {/* 右上角关闭（跳过） */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-10 rounded-lg p-1.5 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700"
          aria-label="跳过引导"
        >
          <svg
            className="h-5 w-5"
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

        {/* 步骤头部：彩色渐变条 */}
        <div className="h-2 w-full bg-gradient-to-r from-primary-400 to-primary-700" />

        <div className="p-6 sm:p-8">
          {/* 步骤指示器 */}
          <div className="mb-5 flex items-center gap-2">
            {STEPS.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === step
                    ? "w-6 bg-primary"
                    : i < step
                      ? "w-1.5 bg-primary-300"
                      : "w-1.5 bg-neutral-200"
                }`}
              />
            ))}
            <span className="ml-auto text-xs font-medium text-neutral-400">
              {step + 1} / {total}
            </span>
          </div>

          {/* 标题 */}
          <h2 className="text-xl font-bold text-neutral-900 sm:text-2xl">
            {current.title}
          </h2>
          <p className="mt-2 text-sm leading-6 text-neutral-600">
            {current.description}
          </p>

          {/* 步骤内容 */}
          <div className="mt-5">
            {step === 0 && (
              <ul className="space-y-3">
                {current.features.map((f) => (
                  <li
                    key={f.label}
                    className="flex items-start gap-3 rounded-xl border border-neutral-200 bg-neutral-50 p-3"
                  >
                    <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary-100 text-primary-700">
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
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-neutral-900">
                        {f.label}
                      </p>
                      <p className="text-xs text-neutral-500">{f.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {step === 1 && (
              <div className="flex flex-col items-center rounded-xl border border-primary-200 bg-primary-50 p-6 text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-100 text-primary-700">
                  <svg
                    className="h-7 w-7"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </span>
                <p className="mt-3 text-3xl font-bold text-primary-700">500</p>
                <p className="text-sm font-medium text-primary-800">赠送到账积分</p>
                <p className="mt-1 text-xs text-primary-600">
                  可在工作台用于执行工作流、生成视频与图片等
                </p>
              </div>
            )}

            {step === 2 && (
              <div className="grid gap-3 sm:grid-cols-2">
                <Link
                  href="/dashboard"
                  onClick={onClose}
                  className="group flex flex-col items-start rounded-xl border border-neutral-200 bg-white p-4 transition-colors hover:border-primary-300 hover:bg-primary-50"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-100 text-primary-700 transition-colors group-hover:bg-primary-200">
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4 5a1 1 0 011-1h4a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v14a1 1 0 01-1 1h-4a1 1 0 01-1-1V5z"
                      />
                    </svg>
                  </span>
                  <p className="mt-2 text-sm font-semibold text-neutral-900">
                    进入工作台
                  </p>
                  <p className="text-xs text-neutral-500">查看积分与管理账户</p>
                </Link>
                <Link
                  href="/chat"
                  onClick={onClose}
                  className="group flex flex-col items-start rounded-xl border border-neutral-200 bg-white p-4 transition-colors hover:border-primary-300 hover:bg-primary-50"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-100 text-primary-700 transition-colors group-hover:bg-primary-200">
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.86 9.86 0 01-4-.8L3 20l1.3-3.9A7.96 7.96 0 013 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                      />
                    </svg>
                  </span>
                  <p className="mt-2 text-sm font-semibold text-neutral-900">
                    智能体对话
                  </p>
                  <p className="text-xs text-neutral-500">立即开始与 AI 交流</p>
                </Link>
              </div>
            )}
          </div>

          {/* 底部操作 */}
          <div className="mt-6 flex items-center justify-between gap-3">
            {step > 0 ? (
              <button
                type="button"
                onClick={() => setStep((s) => s - 1)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-800"
              >
                上一步
              </button>
            ) : (
              <span />
            )}

            {isLast ? (
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg bg-primary px-6 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-hover"
              >
                开始使用
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setStep((s) => s + 1)}
                className="rounded-lg bg-primary px-6 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-hover"
              >
                下一步
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

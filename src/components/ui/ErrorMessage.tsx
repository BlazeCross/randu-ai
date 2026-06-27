/**
 * 统一错误提示组件
 *
 * 用于在页面中统一展示错误/警告/信息提示，支持可选的重试按钮。
 * - error：红色（用于失败、网络错误等）
 * - warning：琥珀色（用于超时、次数用完等）
 * - info：主题色 primary（用于提示性信息）
 */

"use client";

import { useCallback, type ReactNode } from "react";

export type ErrorMessageType = "error" | "warning" | "info";

interface ErrorMessageProps {
  // 提示文案
  message: ReactNode;
  // 可选的重试回调，提供时显示「重试」按钮
  onRetry?: () => void;
  // 提示类型，默认 error
  type?: ErrorMessageType;
  // 重试按钮文案，默认「重试」
  retryText?: string;
}

// 各类型对应的图标路径（heroicons outline 风格）
const ICON_PATHS: Record<ErrorMessageType, string> = {
  error:
    "M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z",
  warning:
    "M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  info: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
};

// 各类型对应的样式
const STYLES: Record<
  ErrorMessageType,
  { container: string; icon: string; text: string; retry: string }
> = {
  error: {
    container: "border-destructive/30 bg-destructive/10",
    icon: "text-destructive",
    text: "text-destructive",
    retry:
      "bg-destructive text-destructive-foreground hover:bg-[color-mix(in_srgb,var(--destructive)_90%,#000)] focus:ring-[var(--ring)]",
  },
  warning: {
    container: "border-accent bg-accent",
    icon: "text-accent-foreground",
    text: "text-accent-foreground",
    retry:
      "bg-foreground text-background hover:bg-[color-mix(in_srgb,var(--foreground)_90%,#000)] focus:ring-[var(--ring)]",
  },
  info: {
    container: "border-primary/30 bg-primary/10",
    icon: "text-primary",
    text: "text-primary",
    retry:
      "bg-primary text-primary-foreground hover:bg-[color-mix(in_srgb,var(--primary)_90%,#000)] focus:ring-[var(--ring)]",
  },
};

export default function ErrorMessage({
  message,
  onRetry,
  type = "error",
  retryText = "重试",
}: ErrorMessageProps) {
  const styles = STYLES[type];

  const handleRetry = useCallback(() => {
    onRetry?.();
  }, [onRetry]);

  return (
    <div
      role={type === "error" ? "alert" : "status"}
      className={`flex items-start gap-3 rounded-xl border px-4 py-3 ${styles.container}`}
    >
      {/* 图标 */}
      <svg
        className={`mt-0.5 h-5 w-5 flex-shrink-0 ${styles.icon}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        strokeWidth={2}
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d={ICON_PATHS[type]}
        />
      </svg>

      {/* 文案 */}
      <p className={`flex-1 text-sm leading-6 ${styles.text}`}>{message}</p>

      {/* 重试按钮 */}
      {onRetry && (
        <button
          type="button"
          onClick={handleRetry}
          className={`inline-flex flex-shrink-0 items-center justify-center rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 ${styles.retry}`}
        >
          {retryText}
        </button>
      )}
    </div>
  );
}

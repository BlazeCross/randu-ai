"use client";

import { useEffect } from "react";
import Link from "next/link";

/**
 * 错误页面动作配置
 */
interface ErrorAction {
  /** 按钮文案 */
  label: string;
  /** 跳转路径：提供时渲染为 Link */
  href?: string;
  /** 点击回调：提供时渲染为 button */
  onClick?: () => void;
}

/**
 * 统一错误页面组件 props
 */
interface ErrorPageProps {
  /** 错误标题，如 "页面加载失败" */
  title: string;
  /** 错误详情（错误消息或摘要） */
  message?: string;
  /** 重试函数（来自 error.tsx 的 reset） */
  reset?: () => void;
  /** 自定义动作按钮；不传时使用默认 "重试 + 返回首页" */
  actions?: ErrorAction[];
  /** 需要记录到 console 的 error 对象（仅在 error.tsx 中使用） */
  error?: Error & { digest?: string };
}

/**
 * 统一错误页面组件
 *
 * - 客户端组件：路由级 error.tsx 通过 props 注入 reset/error
 * - 居中卡片布局，使用 var(--destructive) 色调
 * - 默认动作：「重试」（调用 reset）+「返回首页」（Link 到 /）
 * - 通过 actions 数组可自定义按钮文案与跳转目标
 */
export default function ErrorPage({
  title,
  message,
  reset,
  actions,
  error,
}: ErrorPageProps) {
  // 上报错误到日志服务（这里仅 console）
  useEffect(() => {
    if (error) {
      console.error("[RouteError]", error);
    }
  }, [error]);

  // 默认动作：reset 存在时附带「重试」，末尾追加「返回首页」
  const defaultActions: ErrorAction[] = [];
  if (reset) {
    defaultActions.push({ label: "重试", onClick: reset });
  }
  defaultActions.push({ label: "返回首页", href: "/" });
  const finalActions = actions ?? defaultActions;

  return (
    <main className="flex flex-1 items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md text-center">
        {/* 错误图标：destructive 色调 */}
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
          <svg
            className="h-8 w-8 text-destructive"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        <h1 className="mb-3 text-2xl font-bold text-foreground">{title}</h1>

        {message && (
          <p className="mb-8 break-words text-sm text-muted-foreground">
            {message}
          </p>
        )}

        {/* 动作按钮：第一个为主按钮（primary），其余为次按钮（outline） */}
        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          {finalActions.map((action, i) => {
            const isPrimary = i === 0;
            const baseClass =
              "inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold transition-colors";
            const variantClass = isPrimary
              ? "bg-primary text-primary-foreground hover:bg-primary-hover"
              : "border border-border bg-card text-foreground hover:border-primary hover:text-primary";

            // 含 href 渲染为 Link，否则渲染为 button
            if (action.href) {
              return (
                <Link
                  key={i}
                  href={action.href}
                  className={`${baseClass} ${variantClass}`}
                >
                  {action.label}
                </Link>
              );
            }
            return (
              <button
                key={i}
                type="button"
                onClick={action.onClick}
                className={`${baseClass} ${variantClass}`}
              >
                {action.label}
              </button>
            );
          })}
        </div>
      </div>
    </main>
  );
}

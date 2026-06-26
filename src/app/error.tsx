"use client";

import { useEffect } from "react";
import Link from "next/link";

/**
 * 全局错误边界
 *
 * Next.js App Router 的 error.tsx 自动捕获子树的运行时错误。
 * 必须为客户端组件。
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // 上报到日志服务（这里仅 console）
    console.error("[AppError]", error);
  }, [error]);

  return (
    <main className="flex flex-1 items-center justify-center bg-gradient-to-b from-primary-50 via-white to-white px-4 py-12">
      <div className="w-full max-w-md text-center">
        <div className="mb-6 text-7xl font-bold tracking-tight text-primary-200">
          500
        </div>
        <h1 className="mb-3 text-2xl font-bold text-neutral-900">
          出错了，服务器开小差了
        </h1>
        <p className="mb-8 text-sm text-neutral-600">
          抱歉，页面加载过程中出现了未预期的错误。
          {error.digest && (
            <span className="mt-2 block font-mono text-xs text-neutral-400">
              错误代码：{error.digest}
            </span>
          )}
        </p>
        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center justify-center rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-primary-600/25 transition-all hover:bg-primary-hover hover:shadow-xl active:scale-[0.98]"
          >
            <svg
              className="mr-2 h-4 w-4"
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
            重试
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-xl border border-neutral-300 bg-white px-6 py-3 text-sm font-semibold text-neutral-700 transition-colors hover:border-primary hover:text-primary"
          >
            返回首页
          </Link>
        </div>
      </div>
    </main>
  );
}

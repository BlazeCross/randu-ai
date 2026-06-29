"use client";

import ErrorPage from "@/components/ui/ErrorPage";

/**
 * 全局错误边界
 *
 * Next.js App Router 的 error.tsx 自动捕获子树的运行时错误。
 * 必须为客户端组件。
 *
 * 重构为使用统一的 ErrorPage 组件，确保与路由级 error.tsx 样式一致。
 * 保留原有标题「出错了，服务器开小差了」与错误详情展示逻辑。
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // 错误详情：优先展示 digest（服务端错误的可追溯标识）
  const detail = error.digest
    ? `抱歉，页面加载过程中出现了未预期的错误。错误代码：${error.digest}`
    : "抱歉，页面加载过程中出现了未预期的错误。";

  return (
    <ErrorPage
      title="出错了，服务器开小差了"
      message={detail}
      reset={reset}
      error={error}
    />
  );
}

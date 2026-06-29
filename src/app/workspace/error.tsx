"use client";

import ErrorPage from "@/components/ui/ErrorPage";

/**
 * 工作台路由级错误边界
 *
 * 当 /workspace 子树抛出运行时错误时显示。
 * - 标题：「工作台加载失败」
 * - 错误详情：error.message || error.digest
 * - 动作：「重试」（reset）+「返回首页」（/）
 */
export default function WorkspaceError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorPage
      title="工作台加载失败"
      message={error.message || error.digest}
      reset={reset}
      error={error}
    />
  );
}

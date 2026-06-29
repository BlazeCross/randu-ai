"use client";

import ErrorPage from "@/components/ui/ErrorPage";

/**
 * 个人中心路由级错误边界
 *
 * 当 /dashboard 子树抛出运行时错误时显示。
 * - 标题：「页面加载失败」
 * - 错误详情：error.message || error.digest
 * - 动作：「重试」（reset）+「返回首页」（/）
 */
export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorPage
      title="页面加载失败"
      message={error.message || error.digest}
      reset={reset}
      error={error}
    />
  );
}

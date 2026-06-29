"use client";

import ErrorPage from "@/components/ui/ErrorPage";

/**
 * 管理后台路由级错误边界
 *
 * 当 /admin 子树抛出运行时错误时显示。
 * - 标题：「管理后台加载失败」
 * - 错误详情：error.message || error.digest
 * - 动作：「重试」（reset）+「返回概览」（/admin）
 */
export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorPage
      title="管理后台加载失败"
      message={error.message || error.digest}
      reset={reset}
      error={error}
      actions={[
        { label: "重试", onClick: reset },
        { label: "返回概览", href: "/admin" },
      ]}
    />
  );
}

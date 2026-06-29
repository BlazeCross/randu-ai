"use client";

import ErrorPage from "@/components/ui/ErrorPage";

/**
 * 对话页路由级错误边界
 *
 * 当 /chat 子树抛出运行时错误时显示。
 * - 标题：「对话加载失败」
 * - 错误详情：error.message || error.digest
 * - 动作：「重试」（reset）+「新建对话」（/chat）
 */
export default function ChatError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorPage
      title="对话加载失败"
      message={error.message || error.digest}
      reset={reset}
      error={error}
      actions={[
        { label: "重试", onClick: reset },
        { label: "新建对话", href: "/chat" },
      ]}
    />
  );
}

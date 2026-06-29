"use client";

import Link from "next/link";
import type { ReactNode } from "react";

export interface EmptyStateProps {
  /** 图标（可选，默认用空盒子图标） */
  icon?: ReactNode;
  /** 标题，如"暂无记录" */
  title: string;
  /** 描述，如"开始使用后这里会显示你的记录" */
  description?: string;
  /** CTA 按钮（可选） */
  action?: {
    /** 按钮文字 */
    label: string;
    /** 跳转链接 */
    href?: string;
    /** 或点击事件 */
    onClick?: () => void;
  };
}

/**
 * 通用空状态组件
 *
 * 用于列表为空时的占位提示，支持自定义图标、标题、描述和 CTA 按钮。
 * 因为 action 可以传 onClick，所以标记为 "use client"。
 */
export default function EmptyState({
  icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  // 默认图标：空盒子
  const defaultIcon = (
    <svg
      className="h-12 w-12 text-muted-foreground"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
      />
    </svg>
  );

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center">
        {icon ?? defaultIcon}
      </div>
      <h3 className="text-lg font-medium text-foreground">{title}</h3>
      {description && (
        <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>
      )}
      {action && (
        <>
          {action.href ? (
            <Link
              href={action.href}
              className="mt-5 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
            >
              {action.label}
            </Link>
          ) : (
            <button
              type="button"
              onClick={action.onClick}
              className="mt-5 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
            >
              {action.label}
            </button>
          )}
        </>
      )}
    </div>
  );
}

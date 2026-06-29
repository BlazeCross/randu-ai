"use client";

import { type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import Avatar from "./Avatar";
import Badge from "./Badge";
import Popover from "./Popover";

// 简单的 className 拼接工具（过滤 falsy 值）
function cx(...args: Array<string | false | null | undefined>): string {
  return args.filter(Boolean).join(" ");
}

export interface UserQuickMenuProps {
  /** 变体：navbar 横向顶栏 / sidebar 纵向侧栏 / compact 仅头像 */
  variant?: "navbar" | "sidebar" | "compact";
  className?: string;
}

// 角色显示文案
const ROLE_LABELS: Record<string, string> = {
  user: "普通用户",
  admin: "管理员",
  super_admin: "超级管理员",
};

/**
 * 内联 SVG 图标容器
 * 统一 stroke currentColor / stroke-width 1.7 / stroke-linecap round
 */
function SvgIcon({ children }: { children: ReactNode }) {
  return (
    <svg
      className="h-4 w-4 flex-shrink-0"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {children}
    </svg>
  );
}

// 菜单链接配置
const MENU_ITEMS: Array<{ label: string; href: string; icon: ReactNode }> = [
  {
    label: "个人中心",
    href: "/dashboard",
    icon: (
      <path d="M3 12l9-9 9 9M5 10v10a1 1 0 001 1h3v-6a1 1 0 011-1h4a1 1 0 011 1v6h3a1 1 0 001-1V10" />
    ),
  },
  {
    label: "我的Key",
    href: "/dashboard/keys",
    icon: (
      <>
        <circle cx="8" cy="8" r="4" />
        <path d="M11 11l9 9m-3-3l2 2" />
      </>
    ),
  },
  {
    label: "消耗记录",
    href: "/dashboard/usage",
    icon: <path d="M4 20V10M10 20V4M16 20v-8M22 20H2" />,
  },
  {
    label: "工作流历史",
    href: "/dashboard/history",
    icon: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
  },
  {
    label: "我的订单",
    href: "/dashboard/orders",
    icon: (
      <>
        <rect x="5" y="4" width="14" height="18" rx="2" />
        <path d="M9 4a1 1 0 011-1h4a1 1 0 011 1" />
      </>
    ),
  },
  {
    label: "API文档",
    href: "/dashboard/api-docs",
    icon: <path d="M16 18l6-6-6-6M8 6l-6 6 6 6" />,
  },
  {
    label: "站内通知",
    href: "/dashboard/notifications",
    icon: <path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a4 4 0 01-7.4 0" />,
  },
  {
    label: "资料设置",
    href: "/dashboard/profile",
    icon: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z" />
      </>
    ),
  },
];

/**
 * UserQuickMenu 用户快捷菜单
 *
 * 用于页面右上角或侧栏底部的用户信息悬浮菜单。
 * - navbar 变体：横向排列 头像 + 名字 + 套餐 + 积分
 * - sidebar 变体：纵向，头像在上，信息在下
 * - compact 变体：仅头像
 * 点击触发器展开 Popover，包含用户信息块、菜单链接与退出按钮。
 */
export default function UserQuickMenu({
  variant = "navbar",
  className,
}: UserQuickMenuProps) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  // 加载中：显示骨架
  if (loading) {
    return (
      <div className="animate-pulse h-8 w-20 rounded-full bg-muted" />
    );
  }

  // 未登录：显示登录与注册链接
  if (!user) {
    return (
      <div className={cx("flex items-center gap-2", className)}>
        <Link
          href="/login"
          className="rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          登录
        </Link>
        <Link
          href="/register"
          className="rounded-full bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-[color-mix(in_srgb,var(--primary)_90%,#000)]"
        >
          免费注册
        </Link>
      </div>
    );
  }

  // 已登录：提取展示信息
  const name = user.nickname || user.email || "用户";
  const plan = user.subscriptionPlan || "免费版";
  const role = ROLE_LABELS[user.role] ?? "普通用户";

  // 退出登录
  const handleLogout = () => {
    logout();
    router.push("/");
  };

  // ---- 触发器：根据变体渲染 ----
  const renderTrigger = () => {
    if (variant === "compact") {
      return <Avatar src={user.avatar ?? undefined} name={name} size="sm" />;
    }

    if (variant === "sidebar") {
      return (
        <div className="flex w-full flex-col items-center gap-1.5">
          <Avatar src={user.avatar ?? undefined} name={name} size="md" />
          <span className="max-w-full truncate text-sm font-medium text-foreground">
            {name}
          </span>
          <div className="flex items-center gap-1.5">
            <Badge variant="primary">{plan}</Badge>
            <span className="text-xs text-muted-foreground">
              {user.credits} 点
            </span>
          </div>
        </div>
      );
    }

    // navbar 变体（默认）
    return (
      <div className="flex items-center gap-2">
        <Avatar src={user.avatar ?? undefined} name={name} size="sm" />
        <span className="hidden text-sm font-medium text-foreground sm:inline">
          {name}
        </span>
        <Link
          href="/pricing"
          onClick={(e) => e.stopPropagation()}
          className="transition-transform hover:scale-105"
          title="查看套餐"
        >
          <Badge variant="primary">{plan}</Badge>
        </Link>
        <Link
          href="/credits"
          onClick={(e) => e.stopPropagation()}
          className="hidden text-xs text-muted-foreground transition-colors hover:text-primary md:inline"
          title="积分余额"
        >
          {user.credits} 点
        </Link>
      </div>
    );
  };

  // ---- 悬浮面板内容 ----
  const renderContent = () => (
    <div className="w-64">
      {/* 顶部用户信息块 */}
      <div className="flex items-center gap-3 p-3">
        <Avatar src={user.avatar ?? undefined} name={name} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-foreground">
            {name}
          </div>
          <div className="text-xs text-muted-foreground">{role}</div>
          <div className="mt-1 flex items-center gap-2">
            <Badge variant="primary">{plan}</Badge>
            <span className="text-xs text-muted-foreground">
              积分余额 {user.credits} 点
            </span>
          </div>
        </div>
      </div>

      {/* 分割线 */}
      <div className="border-t border-border" />

      {/* 菜单链接 */}
      <div className="py-1">
        {MENU_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-2.5 rounded-[var(--radius-sm)] px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <SvgIcon>{item.icon}</SvgIcon>
            <span>{item.label}</span>
          </Link>
        ))}
      </div>

      {/* 分割线 */}
      <div className="border-t border-border" />

      {/* 退出登录 */}
      <div className="p-1">
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-2.5 rounded-[var(--radius-sm)] px-3 py-2 text-sm text-destructive transition-colors hover:bg-destructive/10"
        >
          <SvgIcon>
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
          </SvgIcon>
          <span>退出登录</span>
        </button>
      </div>
    </div>
  );

  return (
    <Popover
      trigger={renderTrigger()}
      content={renderContent()}
      align={variant === "sidebar" ? "center" : "end"}
      className={className}
    />
  );
}

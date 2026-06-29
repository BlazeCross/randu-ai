"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { UserRole } from "@/lib/auth";

/**
 * 后台侧边栏导航项
 *
 * role 字段表示该菜单项所需最低角色：
 * - "admin"       → admin / super_admin 可见
 * - "super_admin" → 仅 super_admin 可见
 */
interface NavItem {
  label: string;
  href: string;
  role: UserRole;
  icon: React.ReactNode;
}

/**
 * 后台侧边栏导航项配置
 *
 * 顺序即展示顺序。新增后台页面时在此追加即可。
 */
const navItems: NavItem[] = [
  {
    label: "数据概览",
    href: "/admin",
    role: "admin",
    icon: (
      <svg
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        strokeWidth={1.8}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
        />
      </svg>
    ),
  },
  {
    label: "工作流管理",
    href: "/admin/workflows",
    role: "admin",
    icon: (
      <svg
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        strokeWidth={1.8}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4 6a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM9 9h6m-6 4h6m-6 4h4"
        />
      </svg>
    ),
  },
  {
    label: "轮播图管理",
    href: "/admin/carousel",
    role: "admin",
    icon: (
      <svg
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        strokeWidth={1.8}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4 5a2 2 0 012-2h12a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V5zM4 19h16M8 15h8"
        />
      </svg>
    ),
  },
  {
    label: "图文教程管理",
    href: "/admin/tutorials/articles",
    role: "admin",
    icon: (
      <svg
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        strokeWidth={1.8}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
    ),
  },
  {
    label: "视频教程管理",
    href: "/admin/tutorials/videos",
    role: "admin",
    icon: (
      <svg
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        strokeWidth={1.8}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
        />
      </svg>
    ),
  },
  {
    label: "用户管理",
    href: "/admin/users",
    role: "admin",
    icon: (
      <svg
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        strokeWidth={1.8}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-5.13a4 4 0 11-8 0 4 4 0 018 0zm6 0a4 4 0 11-8 0 4 4 0 018 0z"
        />
      </svg>
    ),
  },
  {
    label: "订单管理",
    href: "/admin/orders",
    role: "admin",
    icon: (
      <svg
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        strokeWidth={1.8}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
        />
      </svg>
    ),
  },
  {
    label: "成本核算",
    href: "/admin/cost",
    role: "admin",
    icon: (
      <svg
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        strokeWidth={1.8}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9m6-9l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-3 9m0 0l-3-9m3 9l3-1"
        />
      </svg>
    ),
  },
  {
    label: "Key 总览",
    href: "/admin/keys",
    role: "admin",
    icon: (
      <svg
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        strokeWidth={1.8}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15 7a2 2 0 012 2m4 0a6 6 0 01-6 6 6 6 0 01-6-6 6 6 0 016-6zm-2 4l-3 3m0 0l-2-2m2 2l-3 3m6-6l3-3"
        />
      </svg>
    ),
  },
  {
    label: "操作日志",
    href: "/admin/action-logs",
    role: "super_admin",
    icon: (
      <svg
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        strokeWidth={1.8}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
    ),
  },
  {
    label: "公告管理",
    href: "/admin/notifications",
    role: "admin",
    icon: (
      <svg
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        strokeWidth={1.8}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M11 5.882V19.5a2.5 2.5 0 11-5 0V5.882a2.5 2.5 0 115 0zM5 19.5h6m-5 0V5.882A2.5 2.5 0 018.5 3.382m0 0a2.5 2.5 0 015 0v.618c0 2.5 1.5 4 4 4v2c-2.5 0-4-1.5-4-4M3 11l9-9"
        />
      </svg>
    ),
  },
  {
    label: "数据导出",
    href: "/admin/export",
    role: "admin",
    icon: (
      <svg
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        strokeWidth={1.8}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
        />
      </svg>
    ),
  },
  {
    label: "留存分析",
    href: "/admin/retention",
    role: "admin",
    icon: (
      <svg
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        strokeWidth={1.8}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
        />
      </svg>
    ),
  },
];

// 角色层级（与 auth.ts 中 ROLE_LEVEL 保持一致）
const ROLE_LEVEL: Record<UserRole, number> = {
  user: 0,
  admin: 1,
  super_admin: 2,
};

interface AdminSidebarProps {
  role: UserRole;
  /** 移动端抽屉是否展开，桌面端忽略此字段 */
  mobileOpen: boolean;
  /** 关闭移动端抽屉 */
  onClose: () => void;
}

/**
 * 后台侧边栏
 *
 * - 桌面端：固定左侧栏，宽度 256px
 * - 移动端：抽屉式，由父组件通过 mobileOpen 控制显隐
 * - 根据 role 过滤可见菜单项（super_admin 才能看到操作日志等敏感菜单）
 * - 当前页高亮：基于 usePathname 精确匹配 / 前缀匹配
 */
export default function AdminSidebar({
  role,
  mobileOpen,
  onClose,
}: AdminSidebarProps) {
  const pathname = usePathname();

  // 当前用户可见的导航项
  const visibleItems = navItems.filter(
    (item) => ROLE_LEVEL[role] >= ROLE_LEVEL[item.role],
  );

  // 判断菜单项是否激活：/admin 精确匹配，其它前缀匹配
  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <>
      {/* 移动端遮罩 */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-foreground/40 backdrop-blur-sm md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-border bg-gradient-to-b from-card to-surface-elevated transition-transform duration-300 md:translate-x-0 relative ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* 品牌光晕 */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent pointer-events-none" aria-hidden />

        {/* 品牌区 */}
        <div className="flex h-16 items-center gap-2 border-b border-border px-5">
          <span className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] bg-gradient-to-br from-primary-500 to-primary-700 text-white">
            燃
          </span>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-bold text-foreground">
              燃渡AI 后台
            </span>
            <span className="text-[10px] text-muted-foreground">
              {role === "super_admin" ? "超级管理员" : "管理员"}
            </span>
          </div>
        </div>

        {/* 导航菜单 */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {visibleItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                  active
                    ? "bg-primary/10 text-primary border-l-2 border-primary"
                    : "text-muted-foreground hover:bg-muted/80 hover:text-foreground border-l-2 border-transparent"
                }`}
              >
                <span
                  className={active ? "text-primary" : "text-muted-foreground"}
                >
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* 底部：返回前台 */}
        <div className="border-t border-border p-3">
          <Link
            href="/"
            onClick={onClose}
            className="flex items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2.5 text-sm font-medium text-muted-foreground transition-all duration-150 hover:bg-muted/80 hover:text-foreground"
          >
            <svg
              className="h-5 w-5 text-muted-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={1.8}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            返回前台
          </Link>
        </div>
      </aside>
    </>
  );
}

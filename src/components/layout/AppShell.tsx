"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import OnlineCount from "@/components/layout/OnlineCount";
import NotificationBell from "@/components/layout/NotificationBell";
import UserQuickMenu from "@/components/ui/UserQuickMenu";

// 简单的 className 拼接工具（过滤 falsy 值）
function cx(...args: Array<string | false | null | undefined>): string {
  return args.filter(Boolean).join(" ");
}

export interface AppShellProps {
  /** 主内容区 */
  children: ReactNode;
  /** 侧栏内容（导航项、历史记录、功能分类等，由各功能页提供） */
  sidebar: ReactNode;
  /** 顶栏标题 */
  title?: string;
  /** 顶栏副标题 */
  subtitle?: string;
  /** 是否显示教程按钮（默认 true） */
  showTutorial?: boolean;
  /** 教程页面链接 */
  tutorialHref?: string;
  /** 侧栏默认是否展开（默认 true） */
  defaultSidebarOpen?: boolean;
  /** 侧栏顶部额外内容（如搜索框） */
  sidebarHeader?: ReactNode;
}

/**
 * AppShell 功能页布局（模式 B）
 *
 * 参考图2布局：左侧功能栏（默认展开，可手动收起）+ 右侧主视觉/主操作区域。
 * 顶栏保持低调（48px，无边框），不作为视觉核心，仅提供导航辅助。
 *
 * - 侧栏宽度：展开 248px，收起 0px（CSS transition 动画）
 * - 顶栏：侧栏切换 + Logo + 标题 + 教程按钮 + 在线人数 + 通知 + 用户菜单
 * - 用户信息（头像/名字/套餐/积分）始终在顶栏右侧显示，悬浮展开常用功能
 */
export default function AppShell({
  children,
  sidebar,
  title,
  subtitle,
  showTutorial = true,
  tutorialHref = "/tutorial",
  defaultSidebarOpen = true,
  sidebarHeader,
}: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(defaultSidebarOpen);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* 侧栏 */}
      <aside
        className={cx(
          "flex flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300 ease-in-out",
          sidebarOpen ? "w-[248px]" : "w-0 overflow-hidden"
        )}
      >
        {/* 侧栏顶部（搜索框等） */}
        {sidebarHeader && (
          <div className="flex-none border-b border-sidebar-border p-3">
            {sidebarHeader}
          </div>
        )}
        {/* 侧栏内容（可滚动） */}
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          {sidebar}
        </div>
      </aside>

      {/* 主区域 */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* 低调顶栏（48px，无边框，非视觉核心） */}
        <header className="flex h-12 flex-none items-center gap-2 px-4">
          {/* 侧栏切换按钮 */}
          <button
            type="button"
            onClick={() => setSidebarOpen((v) => !v)}
            className="grid h-8 w-8 flex-none place-items-center rounded-[var(--radius-sm)] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label={sidebarOpen ? "收起侧栏" : "展开侧栏"}
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={1.7}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M3 12h18M3 6h18M3 18h18" />
            </svg>
          </button>

          {/* Logo（小） */}
          <Link href="/" className="flex flex-none items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt="燃渡AI"
              className="h-6 w-auto invert dark:invert-0"
            />
          </Link>

          {/* 标题区 */}
          {(title || subtitle) && (
            <div className="min-w-0">
              {title && (
                <div className="truncate text-sm font-semibold text-foreground">
                  {title}
                </div>
              )}
              {subtitle && (
                <div className="truncate text-xs text-muted-foreground">
                  {subtitle}
                </div>
              )}
            </div>
          )}

          {/* 弹性间隔 */}
          <div className="flex-1" />

          {/* 教程按钮 */}
          {showTutorial && (
            <Link
              href={tutorialHref}
              className="flex flex-none items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <svg
                className="h-3.5 w-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={1.7}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
              <span className="hidden sm:inline">教程</span>
            </Link>
          )}

          {/* 在线人数 */}
          <OnlineCount />

          {/* 通知铃铛 */}
          <NotificationBell />

          {/* 用户快捷菜单（头像/名字/套餐/积分 + 悬浮功能面板） */}
          <UserQuickMenu variant="navbar" />
        </header>

        {/* 主内容区（可滚动） */}
        <main className="min-h-0 flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useHeartbeat } from "@/hooks/useHeartbeat";
import OnlineCount from "@/components/layout/OnlineCount";
import NotificationBell from "@/components/layout/NotificationBell";
import UserQuickMenu from "@/components/ui/UserQuickMenu";
import ThemeToggle from "@/components/ui/ThemeToggle";

// 简单的 className 拼接工具（过滤 falsy 值）
function cx(...args: Array<string | false | null | undefined>): string {
  return args.filter(Boolean).join(" ");
}

// 主导航链接（教程已下线至功能页按钮，API 文档已迁入个人中心）
const navLinks = [
  { label: "首页", href: "/" },
  { label: "工作台", href: "/workspace" },
  { label: "智能体", href: "/chat" },
  { label: "定价", href: "/pricing" },
];

// 燃渡学院子菜单
const academySubLinks = [
  { label: "图文教程", href: "/academy/articles" },
  { label: "视频教程", href: "/academy/videos" },
];

/**
 * 全局导航栏组件
 *
 * - 固定在页面顶部，展示页（首页/登录/注册等）共享
 * - 功能页（智能体/工作流/学院）使用 AppShell 布局，不显示此 Navbar
 * - 已登录：显示通知铃铛 + 用户快捷菜单（头像/名字/套餐/积分）
 * - 未登录：显示"登录"和"免费注册"按钮
 * - 移动端：折叠为汉堡菜单
 */
export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  // 已登录用户启动心跳上报（每 30 秒更新在线状态）
  useHeartbeat();

  // 功能页使用 AppShell 布局（自带侧栏+低调顶栏），不渲染全局导航栏
  // 学院首页（/academy）为展示页，使用全局 Navbar；其下的图文/视频教程子页采用 AppShell
  const isAppShellRoute =
    pathname.startsWith("/chat") ||
    pathname.startsWith("/workspace") ||
    pathname.startsWith("/workflow") ||
    pathname.startsWith("/academy/articles") ||
    pathname.startsWith("/academy/videos") ||
    pathname.startsWith("/tutorial");
  const headerHeight = isAppShellRoute ? "h-12" : "h-16";

  // 判断链接是否激活
  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  // 退出登录
  const handleLogout = () => {
    logout();
    setMobileOpen(false);
    router.push("/");
  };

  // 导航链接样式
  const navLinkClass = (href: string) =>
    cx(
      "rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
      isActive(href)
        ? "bg-accent text-accent-foreground"
        : "text-muted-foreground hover:bg-muted hover:text-foreground"
    );

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--glass-border)] bg-[var(--glass-bg)] backdrop-blur-[var(--glass-blur)] transition-all duration-300">
      <nav className={cx("mx-auto flex w-full items-center justify-between px-4 lg:px-8", headerHeight)}>
        {/* 左侧：Logo + 桌面端导航链接 */}
        <div className="flex items-center gap-8">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2"
            onClick={() => setMobileOpen(false)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt="燃渡AI"
              className="h-8 w-auto invert dark:invert-0"
            />
            <span className="hidden text-lg font-bold text-foreground sm:inline">燃渡Ai</span>
          </Link>

          {/* 桌面端导航链接 */}
          <div className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={navLinkClass(link.href)}
              >
                {link.label}
              </Link>
            ))}

            {/* 燃渡学院（带悬浮下拉子菜单） */}
            <div className="group relative">
              <Link
                href="/academy"
                className={cx(
                  "flex items-center gap-1 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
                  isActive("/academy") || isActive("/courses")
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                燃渡学院
                <svg
                  className="h-3.5 w-3.5 transition-transform duration-200 group-hover:rotate-180"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </Link>
              {/* 悬浮子菜单 */}
              <div className="invisible absolute left-0 top-full pt-1 opacity-0 transition-all duration-200 group-hover:visible group-hover:opacity-100">
                <div className="min-w-[160px] overflow-hidden rounded-[var(--radius-lg)] border border-border bg-popover p-1 shadow-lg">
                  {academySubLinks.map((sub) => (
                    <Link
                      key={sub.href}
                      href={sub.href}
                      className="block rounded-[var(--radius-sm)] px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      {sub.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* 已登录时显示个人中心链接 */}
            {user && (
              <Link
                href="/dashboard"
                className={navLinkClass("/dashboard")}
              >
                个人中心
              </Link>
            )}
            {/* admin 及以上显示后台管理入口 */}
            {user &&
              (user.role === "admin" || user.role === "super_admin") && (
                <Link href="/admin" className={navLinkClass("/admin")}>
                  后台管理
                </Link>
              )}
          </div>
        </div>

        {/* 右侧：用户操作区 */}
        <div className="hidden items-center gap-3 md:flex">
          <OnlineCount />
          <ThemeToggle />
          {loading ? (
            // 加载中：显示占位
            <div className="h-8 w-20 animate-pulse rounded-full bg-muted" />
          ) : user ? (
            // 已登录：通知铃铛 + 用户快捷菜单（头像/名字/套餐/积分 + 悬浮功能面板）
            <>
              <NotificationBell />
              <UserQuickMenu variant="navbar" />
            </>
          ) : (
            // 未登录：显示登录和注册按钮
            <>
              <Link
                href="/login"
                className="rounded-full px-4 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                登录
              </Link>
              <Link
                href="/register"
                className="rounded-full bg-gradient-to-r from-primary to-primary-500 px-4 py-1.5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-sm)] transition-all duration-200 hover:shadow-[var(--shadow-md)] hover:scale-[1.02] active:scale-[0.98]"
              >
                免费注册
              </Link>
            </>
          )}
        </div>

        {/* 移动端：汉堡菜单按钮 */}
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-[var(--radius-sm)] p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:hidden active:scale-90"
          aria-label="切换菜单"
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((v) => !v)}
        >
          {mobileOpen ? (
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          ) : (
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          )}
        </button>
      </nav>

      {/* 移动端展开菜单 */}
      {mobileOpen && (
        <div className="border-t border-border bg-background md:hidden animate-expand">
          <div className="space-y-1 px-4 py-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={cx(
                  "block rounded-[var(--radius-sm)] px-3 py-2 text-sm font-medium transition-colors",
                  isActive(link.href)
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {link.label}
              </Link>
            ))}

            {/* 燃渡学院及子项 */}
            <Link
              href="/academy"
              onClick={() => setMobileOpen(false)}
              className={cx(
                "block rounded-[var(--radius-sm)] px-3 py-2 text-sm font-medium transition-colors",
                isActive("/academy") || isActive("/courses")
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              燃渡学院
            </Link>
            <Link
              href="/academy/articles"
              onClick={() => setMobileOpen(false)}
              className="block rounded-[var(--radius-sm)] px-3 py-2 pl-8 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              图文教程
            </Link>
            <Link
              href="/academy/videos"
              onClick={() => setMobileOpen(false)}
              className="block rounded-[var(--radius-sm)] px-3 py-2 pl-8 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              视频教程
            </Link>

            {user && (
              <>
                <Link
                  href="/dashboard"
                  onClick={() => setMobileOpen(false)}
                  className={cx(
                    "block rounded-[var(--radius-sm)] px-3 py-2 text-sm font-medium transition-colors",
                    isActive("/dashboard")
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  个人中心
                </Link>
                <Link
                  href="/dashboard/invite"
                  onClick={() => setMobileOpen(false)}
                  className="block rounded-[var(--radius-sm)] px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  邀请奖励
                </Link>
                <Link
                  href="/dashboard/notifications"
                  onClick={() => setMobileOpen(false)}
                  className={cx(
                    "block rounded-[var(--radius-sm)] px-3 py-2 text-sm font-medium transition-colors",
                    isActive("/dashboard/notifications")
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  通知中心
                </Link>
                {user.role === "admin" || user.role === "super_admin" ? (
                  <Link
                    href="/admin"
                    onClick={() => setMobileOpen(false)}
                    className={cx(
                      "block rounded-[var(--radius-sm)] px-3 py-2 text-sm font-medium transition-colors",
                      isActive("/admin")
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    后台管理
                  </Link>
                ) : null}
              </>
            )}
            {/* 移动端用户操作 */}
            <div className="border-t border-border pt-3">
              {loading ? null : user ? (
                <button
                  onClick={handleLogout}
                  className="block w-full rounded-[var(--radius-sm)] px-3 py-2 text-left text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
                >
                  退出登录
                </button>
              ) : (
                <div className="flex flex-col gap-2">
                  <Link
                    href="/login"
                    onClick={() => setMobileOpen(false)}
                    className="block rounded-[var(--radius-sm)] border border-border px-3 py-2 text-center text-sm font-medium text-foreground"
                  >
                    登录
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setMobileOpen(false)}
                    className="block rounded-[var(--radius-sm)] bg-primary px-3 py-2 text-center text-sm font-semibold text-primary-foreground"
                  >
                    免费注册
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

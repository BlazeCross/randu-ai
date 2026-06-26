"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useHeartbeat } from "@/hooks/useHeartbeat";
import OnlineCount from "@/components/layout/OnlineCount";
import NotificationBell from "@/components/layout/NotificationBell";

// 导航链接配置
const navLinks = [
  { label: "首页", href: "/" },
  { label: "工作台", href: "/workspace" },
  { label: "智能体", href: "/chat" },
  { label: "教程", href: "/docs" },
  { label: "课程", href: "/courses" },
];

/**
 * 全局导航栏组件
 *
 * - 固定在页面顶部，所有页面共享
 * - 已登录：显示"个人中心"链接 + 退出按钮
 * - 未登录：显示"登录"和"注册"按钮
 * - 移动端：折叠为汉堡菜单
 */
export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  // 已登录用户启动心跳上报（每 30 秒更新在线状态）
  useHeartbeat();

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

  return (
    <header className="sticky top-0 z-50 border-b border-neutral-200 bg-white/80 backdrop-blur-lg">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* 左侧：Logo + 桌面端导航链接 */}
        <div className="flex items-center gap-8">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 text-lg font-bold text-neutral-900"
            onClick={() => setMobileOpen(false)}
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 text-white">
              燃
            </span>
            <span>燃渡AI</span>
          </Link>

          {/* 桌面端导航链接 */}
          <div className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive(link.href)
                    ? "bg-primary-50 text-primary-700"
                    : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
                }`}
              >
                {link.label}
              </Link>
            ))}
            {/* 已登录时显示个人中心链接 */}
            {user && (
              <Link
                href="/dashboard"
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive("/dashboard")
                    ? "bg-primary-50 text-primary-700"
                    : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
                }`}
              >
                个人中心
              </Link>
            )}
            {/* admin 及以上显示后台管理入口 */}
            {user &&
              (user.role === "admin" || user.role === "super_admin") && (
                <Link
                  href="/admin"
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive("/admin")
                      ? "bg-primary-50 text-primary-700"
                      : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
                  }`}
                >
                  后台管理
                </Link>
              )}
          </div>
        </div>

        {/* 右侧：用户操作区 */}
        <div className="hidden items-center gap-3 md:flex">
          <OnlineCount />
          {loading ? (
            // 加载中：显示占位
            <div className="h-8 w-20 animate-pulse rounded-lg bg-neutral-100" />
          ) : user ? (
            // 已登录：显示通知铃铛 + 退出按钮
            <>
              <NotificationBell />
              <button
                onClick={handleLogout}
                className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-600 transition-colors hover:border-neutral-400 hover:text-neutral-900"
              >
                退出登录
              </button>
            </>
          ) : (
            // 未登录：显示登录和注册按钮
            <>
              <Link
                href="/login"
                className="rounded-lg px-4 py-2 text-sm font-medium text-neutral-600 transition-colors hover:text-neutral-900"
              >
                登录
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-hover"
              >
                免费注册
              </Link>
            </>
          )}
        </div>

        {/* 移动端：汉堡菜单按钮 */}
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-lg p-2 text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 md:hidden"
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
        <div className="border-t border-neutral-200 bg-white md:hidden">
          <div className="space-y-1 px-4 py-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive(link.href)
                    ? "bg-primary-50 text-primary-700"
                    : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
                }`}
              >
                {link.label}
              </Link>
            ))}
            {user && (
              <>
                <Link
                  href="/dashboard"
                  onClick={() => setMobileOpen(false)}
                  className={`block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive("/dashboard")
                      ? "bg-primary-50 text-primary-700"
                      : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
                  }`}
                >
                  个人中心
                </Link>
                <Link
                  href="/dashboard/notifications"
                  onClick={() => setMobileOpen(false)}
                  className={`block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive("/dashboard/notifications")
                      ? "bg-primary-50 text-primary-700"
                      : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
                  }`}
                >
                  通知中心
                </Link>
                {user.role === "admin" || user.role === "super_admin" ? (
                  <Link
                    href="/admin"
                    onClick={() => setMobileOpen(false)}
                    className={`block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      isActive("/admin")
                        ? "bg-primary-50 text-primary-700"
                        : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
                    }`}
                  >
                    后台管理
                  </Link>
                ) : null}
              </>
            )}
            {/* 移动端用户操作 */}
            <div className="border-t border-neutral-200 pt-3">
              {loading ? null : user ? (
                <button
                  onClick={handleLogout}
                  className="block w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
                >
                  退出登录
                </button>
              ) : (
                <div className="flex flex-col gap-2">
                  <Link
                    href="/login"
                    onClick={() => setMobileOpen(false)}
                    className="block rounded-lg border border-neutral-300 px-3 py-2 text-center text-sm font-medium text-neutral-600"
                  >
                    登录
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setMobileOpen(false)}
                    className="block rounded-lg bg-primary px-3 py-2 text-center text-sm font-semibold text-white"
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

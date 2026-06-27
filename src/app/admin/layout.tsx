"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import AdminSidebar from "@/components/admin/AdminSidebar";

/**
 * 后台路径 → 页面标题映射
 *
 * 用于顶栏显示当前页面标题。新增后台页面时在此追加。
 */
const PAGE_TITLES: Record<string, string> = {
  "/admin": "数据概览",
  "/admin/workflows": "工作流管理",
  "/admin/users": "用户管理",
  "/admin/orders": "订单管理",
  "/admin/cost": "成本核算",
  "/admin/keys": "Key 总览",
  "/admin/action-logs": "操作日志",
  "/admin/notifications": "公告管理",
  "/admin/retention": "留存分析",
};

/**
 * 根据当前 pathname 解析页面标题
 *
 * - 精确匹配优先（如 /admin/workflows）
 * - 否则按前缀匹配最长路径（如 /admin/workflows/new → 工作流管理）
 */
function resolveTitle(pathname: string): string {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  // 按路径段长度倒序匹配，保证最长前缀优先
  const sortedKeys = Object.keys(PAGE_TITLES).sort(
    (a, b) => b.length - a.length,
  );
  for (const key of sortedKeys) {
    if (pathname.startsWith(`${key}/`)) return PAGE_TITLES[key];
  }
  return "后台管理";
}

/**
 * 后台管理布局
 *
 * - 客户端组件：需 useAuth 获取角色 + useState 控制移动端抽屉
 * - 权限守卫：loading 时显示加载态；未登录跳转 /login；普通用户跳转 /
 * - 全屏覆盖（fixed inset-0 z-[60]）：完全遮蔽 root layout 的 Navbar，
 *   避免出现前台导航栏 + 后台侧边栏并存的双导航问题
 * - 布局：左侧固定侧边栏（桌面端 256px）+ 右侧顶栏 + 内容区
 */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading, logout } = useAuth();
  // 移动端侧边栏抽屉开关
  const [mobileOpen, setMobileOpen] = useState(false);

  // 权限守卫：仅 admin 及以上可访问后台
  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (user.role !== "admin" && user.role !== "super_admin") {
      // 普通用户无权访问后台，跳回首页
      router.replace("/");
    }
  }, [user, loading, router]);

  // 加载中：显示全屏加载态
  if (loading) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-neutral-50">
        <svg
          className="h-10 w-10 animate-spin text-primary"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      </div>
    );
  }

  // 未登录或权限不足：守卫已触发跳转，渲染 null 避免闪烁后台内容
  if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
    return null;
  }

  const pageTitle = resolveTitle(pathname);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <div className="fixed inset-0 z-[60] flex bg-neutral-50">
      {/* 侧边栏：桌面端固定，移动端抽屉 */}
      <AdminSidebar
        role={user.role}
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />

      {/* 主内容区：桌面端左侧留出 256px 侧边栏宽度 */}
      <div className="flex flex-1 flex-col md:pl-64">
        {/* 顶栏 */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-neutral-200 bg-white/95 px-4 backdrop-blur sm:px-6">
          {/* 左侧：移动端汉堡按钮 + 页面标题 */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="inline-flex items-center justify-center rounded-lg p-2 text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 md:hidden"
              aria-label="打开菜单"
            >
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
            </button>
            <h1 className="text-base font-semibold text-neutral-900 sm:text-lg">
              {pageTitle}
            </h1>
          </div>

          {/* 右侧：用户信息 + 退出按钮 */}
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 sm:flex">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-sm font-medium text-primary-700">
                {user.nickname?.[0] || user.email?.[0] || user.phone?.[0] || "U"}
              </span>
              <div className="flex flex-col leading-tight">
                <span className="text-sm font-medium text-neutral-900">
                  {user.nickname || user.email || user.phone || "管理员"}
                </span>
                <span className="text-[10px] text-neutral-500">
                  {user.role === "super_admin" ? "超级管理员" : "管理员"}
                </span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium text-neutral-600 transition-colors hover:border-neutral-400 hover:text-neutral-900"
            >
              退出
            </button>
          </div>
        </header>

        {/* 内容区：可滚动 */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}

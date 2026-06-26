"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

// 通知项类型（对应 GET /api/notifications 返回的 items 元素）
interface NotificationItem {
  id: string;
  type: string;
  title: string;
  content: string | null;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

interface NotificationData {
  items: NotificationItem[];
  total: number;
  unreadCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// 通知类型图标配置
const typeIconConfig: Record<
  string,
  { icon: string; bg: string; text: string }
> = {
  task_complete: {
    icon: "M5 13l4 4L19 7",
    bg: "bg-success-100",
    text: "text-success-600",
  },
  task_failed: {
    icon: "M6 18L18 6M6 6l12 12",
    bg: "bg-red-100",
    text: "text-red-600",
  },
  system: {
    icon: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    bg: "bg-primary-100",
    text: "text-primary-600",
  },
  announcement: {
    icon: "M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6a3.99 3.99 0 011.5-2.741M5.436 13.683L3 14m2.436-.317l4.5 1.641",
    bg: "bg-amber-100",
    text: "text-amber-600",
  },
};

// 格式化日期时间
function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function NotificationsPage() {
  const { token, loading, user } = useAuth();
  const router = useRouter();

  const [data, setData] = useState<NotificationData | null>(null);
  const [listLoading, setListLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [markingAll, setMarkingAll] = useState(false);
  // 正在标记已读的通知 ID
  const [markingId, setMarkingId] = useState<string | null>(null);

  /**
   * 获取通知列表
   */
  const fetchNotifications = useCallback(
    async (targetPage: number) => {
      if (!token) return;
      setListLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/notifications?page=${targetPage}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          throw new Error("获取通知失败");
        }
        const result = (await res.json()) as NotificationData;
        setData(result);
        setPage(targetPage);
      } catch (e) {
        setError(e instanceof Error ? e.message : "获取通知失败");
      } finally {
        setListLoading(false);
      }
    },
    [token],
  );

  useEffect(() => {
    if (token) {
      fetchNotifications(1);
    }
  }, [token, fetchNotifications]);

  /**
   * 标记单条已读
   */
  const handleMarkRead = useCallback(
    async (id: string) => {
      if (!token) return;
      setMarkingId(id);
      try {
        const res = await fetch(`/api/notifications/${id}`, {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        // 本地更新：标记为已读 + unreadCount - 1
        setData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            items: prev.items.map((item) =>
              item.id === id ? { ...item, isRead: true } : item,
            ),
            unreadCount: Math.max(0, prev.unreadCount - 1),
          };
        });
      } finally {
        setMarkingId(null);
      }
    },
    [token],
  );

  /**
   * 全部标记已读
   */
  const handleMarkAllRead = useCallback(async () => {
    if (!token || !data || data.unreadCount === 0) return;
    setMarkingAll(true);
    try {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          items: prev.items.map((item) => ({ ...item, isRead: true })),
          unreadCount: 0,
        };
      });
    } finally {
      setMarkingAll(false);
    }
  }, [token, data]);

  // 加载中
  if (loading) {
    return (
      <main className="flex flex-1 items-center justify-center bg-neutral-50">
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
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      </main>
    );
  }

  // 未登录
  if (!user) {
    return (
      <main className="flex flex-1 items-center justify-center bg-neutral-50 px-4">
        <div className="text-center">
          <h2 className="mb-2 text-xl font-semibold text-neutral-900">
            请先登录
          </h2>
          <p className="mb-6 text-sm text-neutral-500">登录后查看通知</p>
          <Link
            href="/login"
            className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-primary-600/25 transition-all hover:bg-primary-hover"
          >
            前往登录
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 bg-neutral-50">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        {/* 面包屑 + 标题 */}
        <div className="mb-6">
          <nav className="mb-2 text-xs text-neutral-400">
            <Link href="/dashboard" className="hover:text-primary">
              个人中心
            </Link>
            <span className="mx-1">/</span>
            <span className="text-neutral-600">通知中心</span>
          </nav>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-neutral-900">通知中心</h1>
              <p className="mt-1 text-sm text-neutral-500">
                {data && data.unreadCount > 0
                  ? `你有 ${data.unreadCount} 条未读通知`
                  : "暂无未读通知"}
              </p>
            </div>
            {data && data.unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                disabled={markingAll}
                className="rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-50 disabled:opacity-50"
              >
                {markingAll ? "处理中..." : "全部已读"}
              </button>
            )}
          </div>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4">
            <p className="flex-1 text-sm text-red-700">{error}</p>
            <button
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-600"
            >
              ✕
            </button>
          </div>
        )}

        {/* 通知列表 */}
        <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm">
          {listLoading ? (
            <div className="flex items-center justify-center py-16">
              <svg
                className="h-8 w-8 animate-spin text-primary"
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
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
            </div>
          ) : data && data.items.length > 0 ? (
            <div className="divide-y divide-neutral-100">
              {data.items.map((item) => {
                const iconCfg =
                  typeIconConfig[item.type] || typeIconConfig.system;
                return (
                  <div
                    key={item.id}
                    className={`px-4 py-4 transition-colors sm:px-6 ${
                      item.isRead ? "bg-white" : "bg-primary-50/30"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* 类型图标 */}
                      <div
                        className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full ${iconCfg.bg}`}
                      >
                        <svg
                          className={`h-4 w-4 ${iconCfg.text}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d={iconCfg.icon}
                          />
                        </svg>
                      </div>

                      {/* 内容区 */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-sm ${
                              item.isRead
                                ? "font-medium text-neutral-700"
                                : "font-semibold text-neutral-900"
                            }`}
                          >
                            {item.title}
                          </span>
                          {!item.isRead && (
                            <span className="h-2 w-2 flex-shrink-0 rounded-full bg-primary-500" />
                          )}
                        </div>
                        {item.content && (
                          <p className="mt-1 text-sm text-neutral-500">
                            {item.content}
                          </p>
                        )}
                        <div className="mt-2 flex items-center gap-3">
                          <span className="text-xs text-neutral-400">
                            {formatDate(item.createdAt)}
                          </span>
                          {item.link && (
                            <button
                              onClick={() => router.push(item.link!)}
                              className="text-xs font-medium text-primary hover:text-primary-hover"
                            >
                              查看 →
                            </button>
                          )}
                          {!item.isRead && (
                            <button
                              onClick={() => handleMarkRead(item.id)}
                              disabled={markingId === item.id}
                              className="text-xs text-neutral-400 hover:text-neutral-600 disabled:opacity-50"
                            >
                              {markingId === item.id ? "处理中..." : "标记已读"}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            // 空状态
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100">
                <svg
                  className="h-6 w-6 text-neutral-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
                  />
                </svg>
              </div>
              <p className="text-sm text-neutral-500">暂无通知</p>
            </div>
          )}
        </div>

        {/* 分页 */}
        {data && data.totalPages > 1 && (
          <div className="mt-6 flex items-center justify-center gap-2">
            <button
              onClick={() => fetchNotifications(page - 1)}
              disabled={page <= 1 || listLoading}
              className="rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-50 disabled:opacity-50"
            >
              上一页
            </button>
            <span className="text-sm text-neutral-500">
              {page} / {data.totalPages}
            </span>
            <button
              onClick={() => fetchNotifications(page + 1)}
              disabled={page >= data.totalPages || listLoading}
              className="rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-50 disabled:opacity-50"
            >
              下一页
            </button>
          </div>
        )}
      </div>
    </main>
  );
}

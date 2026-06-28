"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

// 未读数刷新间隔：60 秒（轻量轮询）
const UNREAD_REFRESH_MS = 60 * 1000;

/**
 * 通知铃铛组件（导航栏）
 *
 * 已登录用户每 60 秒拉取未读通知数，显示红点 + 数字。
 * 点击跳转到通知列表页 /dashboard/notifications。
 * 数字超过 99 显示 99+。
 */
export default function NotificationBell() {
  const { token, user } = useAuth();
  const router = useRouter();
  const [unread, setUnread] = useState(0);

  const fetchUnread = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch("/api/notifications?page=1", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = (await res.json()) as { unreadCount: number };
      setUnread(data.unreadCount);
    } catch {
      // 静默失败
    }
  }, [token]);

  useEffect(() => {
    if (!token || !user) {
      setUnread(0);
      return;
    }
    fetchUnread();
    const timer = setInterval(fetchUnread, UNREAD_REFRESH_MS);
    return () => clearInterval(timer);
  }, [token, user, fetchUnread]);

  // 未登录不显示
  if (!user) return null;

  return (
    <button
      type="button"
      onClick={() => router.push("/dashboard/notifications")}
      className="relative rounded-[var(--radius-sm)] p-2 text-muted-foreground transition-all duration-200 hover:scale-110 hover:text-primary"
      aria-label="通知"
      title="通知"
    >
      <svg
        className="h-5 w-5 transition-transform duration-300"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        strokeWidth={1.8}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
        />
      </svg>
      {unread > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white animate-pulse">
          {unread > 99 ? "99+" : unread}
        </span>
      )}
    </button>
  );
}

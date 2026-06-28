"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";

// 在线人数刷新间隔：60 秒
const ONLINE_REFRESH_MS = 60 * 1000;

/**
 * 在线人数显示组件
 *
 * 仅在已登录时拉取 /api/admin/stats/online（需 admin 权限）。
 * 普通用户拉取会返回 403，此时静默不显示在线人数。
 * 每 60 秒刷新一次。
 */
export default function OnlineCount() {
  const { token, user } = useAuth();
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    // 仅 admin 及以上权限才展示在线人数
    if (!token || !user) return;
    if (user.role !== "admin" && user.role !== "super_admin") return;

    let cancelled = false;

    const fetchCount = async () => {
      try {
        const res = await fetch("/api/admin/stats/online", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const data = (await res.json()) as { online: number };
        if (!cancelled) setCount(data.online);
      } catch {
        // 静默失败
      }
    };

    fetchCount();
    const timer = setInterval(fetchCount, ONLINE_REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [token, user]);

  // 未获取到在线人数（非 admin 或请求失败）时不显示
  if (count === null) return null;

  return (
    <span
      className="hidden items-center gap-1.5 rounded-lg bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground shadow-[var(--shadow-xs)] transition-all duration-200 md:inline-flex"
      title="最近 2 分钟内的在线用户数"
    >
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success-400 opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-success-500" />
      </span>
      在线 {count}
    </span>
  );
}

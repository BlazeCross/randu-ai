"use client";

import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";

// 心跳上报间隔：30 秒
const HEARTBEAT_INTERVAL_MS = 30 * 1000;

/**
 * 心跳上报 Hook
 *
 * 已登录用户挂载后每 30 秒调用一次 /api/heartbeat 上报在线状态。
 * 登出或 token 失效时自动停止。
 * 使用 sendBeacon 不可靠（部分浏览器需 header），这里用 fetch + keepalive
 * 保证页面关闭时也能发出最后一次心跳。
 */
export function useHeartbeat(): void {
  const { token } = useAuth();

  useEffect(() => {
    if (!token) return;

    let timer: ReturnType<typeof setInterval>;

    const sendHeartbeat = () => {
      fetch("/api/heartbeat", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        // keepalive: 页面关闭时也能发出请求
        keepalive: true,
      }).catch(() => {
        // 心跳失败静默处理，不打扰用户
      });
    };

    // 立即发送一次，随后每 30 秒发送
    sendHeartbeat();
    timer = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL_MS);

    return () => {
      clearInterval(timer);
    };
  }, [token]);
}

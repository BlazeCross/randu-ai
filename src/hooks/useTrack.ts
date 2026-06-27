"use client";

import { useCallback, useEffect } from "react";
import { trackEventClient } from "@/lib/analytics-client";

/**
 * 客户端埋点 Hook（18.1）
 *
 * 用法：
 * - 主动上报：const { track } = useTrack(); track("button_click", { id: "buy" });
 * - 页面浏览自动埋点：useTrackPageView("home");
 */
export function useTrack() {
  const track = useCallback(
    (event: string, properties?: Record<string, unknown>) => {
      trackEventClient(event, properties);
    },
    [],
  );
  return { track };
}

/**
 * 页面浏览自动埋点 Hook
 *
 * 挂载后自动上报一次 page_view 事件。
 * 仅在 pageName 变化时重新触发，避免重复上报。
 *
 * @param pageName 页面标识（如 "home" / "chat" / "dashboard"）
 */
export function useTrackPageView(pageName: string): void {
  useEffect(() => {
    trackEventClient("page_view", { page: pageName });
  }, [pageName]);
}

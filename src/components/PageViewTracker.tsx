"use client";

import { useTrackPageView } from "@/hooks/useTrack";

/**
 * 页面浏览埋点组件（用于服务端组件页面）
 *
 * 服务端组件无法直接调用 Hook，通过此客户端组件桥接。
 * 渲染为 null，不影响页面布局。
 *
 * @param page 页面标识
 */
export default function PageViewTracker({ page }: { page: string }) {
  useTrackPageView(page);
  return null;
}

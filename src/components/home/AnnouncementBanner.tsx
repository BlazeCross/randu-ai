"use client";

import { useEffect, useState } from "react";

interface Announcement {
  title: string;
  content: string | null;
  link: string | null;
  createdAt: string;
}

interface ApiResponse {
  announcement: Announcement | null;
}

// localStorage key：记录用户已关闭的最新公告（按 title+createdAt 标识）
const DISMISS_KEY = "randu-announcement-dismissed";

/**
 * 首页公告横幅
 *
 * - 从公开接口 /api/notifications/announcement 获取最新一条公告
 * - 若用户已关闭该条公告（按 title+createdAt 比对 localStorage），则不再展示
 * - 含 link 时整体可点击跳转
 * - 无公告或已关闭时返回 null，不占位
 */
export default function AnnouncementBanner() {
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/notifications/announcement", {
          cache: "no-store",
        });
        if (!res.ok) return;
        const data = (await res.json()) as ApiResponse;
        if (cancelled || !data.announcement) return;

        const ann = data.announcement;
        const signature = `${ann.title}|${ann.createdAt}`;

        // 检查用户是否已关闭该条公告
        let dismissed = "";
        try {
          dismissed = localStorage.getItem(DISMISS_KEY) ?? "";
        } catch {
          // localStorage 不可用时忽略，直接展示
        }

        if (dismissed === signature) return;

        setAnnouncement(ann);
        setVisible(true);
      } catch {
        // 静默失败，不阻塞首屏渲染
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleDismiss = () => {
    if (!announcement) return;
    const signature = `${announcement.title}|${announcement.createdAt}`;
    try {
      localStorage.setItem(DISMISS_KEY, signature);
    } catch {
      // localStorage 不可用时仅隐藏 UI
    }
    setVisible(false);
  };

  if (!visible || !announcement) return null;

  const Wrapper = announcement.link ? "a" : "div";
  const wrapperProps = announcement.link
    ? {
        href: announcement.link,
        target: "_blank" as const,
        rel: "noopener noreferrer",
      }
    : {};

  return (
    <div className="border-b border-primary-100 bg-gradient-to-r from-primary-50 to-success-50">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2.5 sm:px-6 lg:px-8">
        {/* 左侧喇叭图标 */}
        <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-700">
          <svg
            className="h-3.5 w-3.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6a1.94 1.94 0 011.5.718A4.001 4.001 0 0113 6a3.98 3.98 0 01-.318 1.583"
            />
          </svg>
        </span>

        {/* 中间公告内容 */}
        <Wrapper
          {...wrapperProps}
          className="flex min-w-0 flex-1 items-center gap-2 text-sm"
        >
          <span className="font-semibold text-primary-800">
            {announcement.title}
          </span>
          {announcement.content && (
            <>
              <span className="text-primary-300">·</span>
              <span className="truncate text-primary-700">
                {announcement.content}
              </span>
            </>
          )}
          {announcement.link && (
            <svg
              className="h-3 w-3 flex-shrink-0 text-primary-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
          )}
        </Wrapper>

        {/* 右侧关闭按钮 */}
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="关闭公告"
          className="flex-shrink-0 rounded-full p-1 text-primary-500 transition-colors hover:bg-primary-100 hover:text-primary-700"
        >
          <svg
            className="h-3.5 w-3.5"
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
        </button>
      </div>
    </div>
  );
}

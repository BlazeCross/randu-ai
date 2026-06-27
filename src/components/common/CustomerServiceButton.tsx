"use client";

import { useEffect, useRef, useState } from "react";

// 微信客服二维码占位图
const QR_IMAGE_URL =
  "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=WeChat%20customer%20service%20QR%20code%20placeholder&image_size=square_hd";

/**
 * 浮动客服按钮
 *
 * - 固定在页面右下角，z-50
 * - 点击展开客服面板（微信二维码、邮箱、工作时间）
 * - 点击外部关闭面板
 * - 移动端适配：按钮稍小，面板宽度自适应屏幕
 */
export default function CustomerServiceButton() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭面板
  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      const node = containerRef.current;
      if (node && !node.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, [open]);

  // 打开时按 Esc 关闭
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open]);

  return (
    <div
      ref={containerRef}
      className="fixed bottom-4 right-4 z-50 sm:bottom-6 sm:right-6"
    >
      {/* 客服面板 */}
      {open && (
        <div className="animate-scale-in absolute bottom-16 right-0 w-[calc(100vw-2rem)] max-w-xs origin-bottom-right rounded-2xl border border-neutral-200 bg-white p-4 shadow-2xl sm:bottom-20 sm:w-80">
          {/* 头部 */}
          <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-100 text-primary-700">
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M18 10c0-3.866-3.582-7-8-7s-8 3.134-8 7c0 1.657.617 3.18 1.657 4.406L3 21l4.219-1.406A8.97 8.97 0 0010 20c4.418 0 8-3.134 8-7z"
                />
              </svg>
            </span>
            <div>
              <p className="text-sm font-semibold text-neutral-900">在线客服</p>
              <p className="text-xs text-neutral-500">很高兴为您服务</p>
            </div>
          </div>

          {/* 微信二维码 */}
          <div className="mt-3 flex flex-col items-center">
            <div className="overflow-hidden rounded-xl border border-neutral-200 bg-neutral-50 p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={QR_IMAGE_URL}
                alt="微信客服二维码"
                className="h-32 w-32 rounded-lg object-cover"
                loading="lazy"
              />
            </div>
            <p className="mt-2 text-xs font-medium text-neutral-600">
              微信扫码添加客服
            </p>
          </div>

          {/* 联系信息 */}
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <svg
                className="h-4 w-4 flex-shrink-0 text-neutral-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              <dt className="text-neutral-500">邮箱</dt>
              <dd className="ml-auto font-medium text-neutral-800">
                support@randuai.cn
              </dd>
            </div>
            <div className="flex items-center gap-2">
              <svg
                className="h-4 w-4 flex-shrink-0 text-neutral-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <dt className="text-neutral-500">工作时间</dt>
              <dd className="ml-auto font-medium text-neutral-800">
                周一至周五 9:00-18:00
              </dd>
            </div>
          </dl>
        </div>
      )}

      {/* 浮动按钮 */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "关闭客服面板" : "打开客服面板"}
        aria-expanded={open}
        className="tap-feedback flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white shadow-lg transition-colors hover:bg-primary-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 sm:h-14 sm:w-14"
      >
        {open ? (
          <svg
            className="h-5 w-5 sm:h-6 sm:w-6"
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
            className="h-5 w-5 sm:h-6 sm:w-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M18 10A8 8 0 116.343 6.343M22 6l-10 7-3-3"
            />
          </svg>
        )}
      </button>
    </div>
  );
}

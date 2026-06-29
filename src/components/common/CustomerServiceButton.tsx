"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

/**
 * 浮动客服按钮
 *
 * - 固定在页面右下角，z-50
 * - 点击展开客服面板（微信二维码、邮箱、电话、工作时间）
 * - 图标使用耳机/对话气泡（符合客服语义）
 */
export default function CustomerServiceButton() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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
        <div className="animate-scale-in absolute bottom-16 right-0 w-[calc(100vw-2rem)] max-w-xs origin-bottom-right rounded-[var(--radius)] border border-border bg-card p-4 shadow-2xl sm:bottom-20 sm:w-80">
          {/* 头部 */}
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] bg-accent text-primary">
              {/* 耳机图标 */}
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
                  d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829a5 5 0 010-7.07l2.829-2.829m-12.728 0a9 9 0 000 12.728m0 0l2.829-2.829a5 5 0 000-7.07L5.636 5.636M9 22h6M12 11h.01"
                />
              </svg>
            </span>
            <div>
              <p className="text-sm font-semibold text-foreground">在线客服</p>
              <p className="text-xs text-muted-foreground">很高兴为您服务</p>
            </div>
          </div>

          {/* 微信二维码 */}
          <div className="mt-3 flex flex-col items-center">
            <div className="overflow-hidden rounded-[var(--radius-sm)] border border-border bg-background p-2">
              <Image
                src="/qrcode-wechat.jpg"
                alt="企业微信二维码"
                width={128}
                height={128}
                unoptimized
                className="h-32 w-32 rounded-[var(--radius-sm)] object-cover"
                loading="lazy"
              />
            </div>
            <p className="mt-2 text-xs font-medium text-muted-foreground">
              微信扫码添加客服
            </p>
          </div>

          {/* 联系信息 */}
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <svg
                className="h-4 w-4 flex-shrink-0 text-muted-foreground"
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
              <dt className="text-muted-foreground">邮箱</dt>
              <dd className="ml-auto font-medium text-foreground">
                1967948530@qq.com
              </dd>
            </div>
            <div className="flex items-center gap-2">
              <svg
                className="h-4 w-4 flex-shrink-0 text-muted-foreground"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                />
              </svg>
              <dt className="text-muted-foreground">电话</dt>
              <dd className="ml-auto font-medium text-foreground">
                17683255002
              </dd>
            </div>
            <div className="flex items-center gap-2">
              <svg
                className="h-4 w-4 flex-shrink-0 text-muted-foreground"
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
              <dt className="text-muted-foreground">工作时间</dt>
              <dd className="ml-auto font-medium text-foreground">
                周一至周五 9:00-18:00
              </dd>
            </div>
          </dl>
        </div>
      )}

      {/* 浮动按钮 - 耳机图标 */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "关闭客服面板" : "打开客服面板"}
        aria-expanded={open}
        className="tap-feedback flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors hover:bg-primary-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 sm:h-14 sm:w-14"
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
              d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829a5 5 0 010-7.07l2.829-2.829m-12.728 0a9 9 0 000 12.728m0 0l2.829-2.829a5 5 0 000-7.07L5.636 5.636M9 22h6M12 11h.01"
            />
          </svg>
        )}
      </button>
    </div>
  );
}

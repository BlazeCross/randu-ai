"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";

/**
 * 预约体验弹窗
 *
 * 点击"免费预约抢先体验"按钮后弹出，引导用户扫码加微信。
 * - 点击遮罩或 Esc 关闭
 * - body 滚动锁定
 * - 参考 Dify / 扣子 / 火山方舟等大厂的预约引导弹窗设计
 */
export default function BookingModal({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  const handleOpen = useCallback(() => setOpen(true), []);
  const handleClose = useCallback(() => setOpen(false), []);

  // Esc 关闭 + body 滚动锁定
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [open, handleClose]);

  return (
    <>
      <span onClick={handleOpen} className="contents cursor-pointer">
        {children}
      </span>

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          onClick={handleClose}
        >
          {/* 遮罩 */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" />

          {/* 弹窗内容 */}
          <div
            className="relative z-10 w-full max-w-md animate-scale-in rounded-[var(--radius-xl)] border border-border bg-card p-6 shadow-2xl sm:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 关闭按钮 */}
            <button
              type="button"
              onClick={handleClose}
              aria-label="关闭"
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <svg
                className="h-5 w-5"
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

            {/* 标题 */}
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-accent">
                <svg
                  className="h-7 w-7 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-foreground sm:text-2xl">
                免费预约抢先体验
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                扫描下方企业微信二维码，添加专属客服
                <br />
                获取 1 对 1 产品演示与免费体验名额
              </p>
            </div>

            {/* 二维码 */}
            <div className="mt-6 flex justify-center">
              <div className="overflow-hidden rounded-[var(--radius)] border-2 border-border bg-background p-3 shadow-sm">
                <Image
                  src="/qrcode-wechat.jpg"
                  alt="企业微信二维码"
                  width={180}
                  height={180}
                  unoptimized
                  className="h-44 w-44 rounded-[var(--radius-sm)] object-cover"
                />
              </div>
            </div>

            {/* 引导步骤 */}
            <div className="mt-6 space-y-2.5 rounded-[var(--radius)] bg-muted/50 p-4">
              <div className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  1
                </span>
                <p className="text-sm text-foreground">微信扫码添加客服好友</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  2
                </span>
                <p className="text-sm text-foreground">发送「预约体验」获取专属链接</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  3
                </span>
                <p className="text-sm text-foreground">客服协助开通账号，即可免费体验全部功能</p>
              </div>
            </div>

            {/* 联系方式 */}
            <div className="mt-4 flex items-center justify-center gap-6 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
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
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                1967948530@qq.com
              </span>
              <span className="inline-flex items-center gap-1.5">
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
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
                17683255002
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

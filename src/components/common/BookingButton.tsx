"use client";

import BookingModal from "./BookingModal";

/**
 * 预约体验按钮
 *
 * 客户端组件，可在服务端页面中直接使用。
 * 点击后弹出预约弹窗（微信二维码引导）。
 */
export default function BookingButton({
  label = "免费预约抢先体验",
  variant = "primary",
  className = "",
}: {
  label?: string;
  variant?: "primary" | "outline";
  className?: string;
}) {
  const baseClass =
    "inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold transition-colors cursor-pointer";
  const variantClass =
    variant === "primary"
      ? "bg-primary text-primary-foreground hover:bg-[color-mix(in_srgb,var(--primary)_90%,#000)]"
      : "border border-border bg-card text-foreground hover:bg-muted";

  return (
    <BookingModal>
      <button
        type="button"
        className={`${baseClass} ${variantClass} ${className}`}
      >
        {label}
      </button>
    </BookingModal>
  );
}

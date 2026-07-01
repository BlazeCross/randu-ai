"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cx } from "@/lib/cn";

type ButtonVariant = "primary" | "secondary" | "ghost" | "outline" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

const VARIANT_STYLES: Record<ButtonVariant, string> = {
  primary:
    "bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white shadow-md hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0.5",
  secondary:
    "bg-[#6366F1] text-white shadow-md hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0.5",
  ghost:
    "bg-transparent text-[#6366F1] hover:bg-[#6366F1]/10 active:bg-[#6366F1]/20",
  outline:
    "bg-transparent border border-[#6366F1] text-[#6366F1] hover:bg-[#6366F1]/10 active:bg-[#6366F1]/20",
  danger:
    "bg-[#EF4444] text-white shadow-md hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0.5",
};

const SIZE_STYLES: Record<ButtonSize, string> = {
  sm: "px-4 py-2 text-xs",
  md: "px-5 py-2.5 text-sm",
  lg: "px-6 py-3 text-base",
};

const SPINNER = (
  <svg
    className="animate-spin h-4 w-4 shrink-0"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
);

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className = "",
      variant = "primary",
      size = "md",
      loading = false,
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={cx(
          "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-200",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none",
          VARIANT_STYLES[variant],
          SIZE_STYLES[size],
          className,
        )}
        {...props}
      >
        {loading && (
          <span className={cx("flex items-center", loading && "opacity-70")}>
            {SPINNER}
          </span>
        )}
        <span className={loading ? "opacity-70" : ""}>{children}</span>
      </button>
    );
  },
);

Button.displayName = "Button";

export { Button };
export type { ButtonVariant, ButtonSize };

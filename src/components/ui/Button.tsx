import React from "react";
import { cx } from "@/lib/cn";

// 按钮变体
type ButtonVariant = "primary" | "ghost" | "outline" | "destructive";
// 按钮尺寸
type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** 变体：primary 主按钮 / ghost 幽灵按钮 / outline 描边按钮 / destructive 危险按钮 */
  variant?: ButtonVariant;
  /** 尺寸：sm 小 / md 中 / lg 大 */
  size?: ButtonSize;
  /** asChild 暂未实现，仅保留 API 兼容 */
  asChild?: boolean;
}

// 各变体样式
const VARIANT_STYLES: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-primary-foreground hover:bg-[color-mix(in_srgb,var(--primary)_90%,#000)] active:translate-y-px shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] hover:brightness-110",
  ghost:
    "bg-transparent text-foreground hover:bg-muted transition-all duration-150",
  outline: "bg-background text-foreground border border-border hover:border-primary/40 hover:bg-accent/30 transition-all duration-200",
  destructive:
    "bg-destructive text-destructive-foreground hover:bg-[color-mix(in_srgb,var(--destructive)_90%,#000)] active:translate-y-px",
};

// 各尺寸样式
const SIZE_STYLES: Record<ButtonSize, string> = {
  sm: "h-8 text-xs px-3",
  md: "h-9.5 text-sm px-4",
  lg: "h-11 text-sm px-5",
};

// 纯图标按钮固定尺寸
const ICON_ONLY_STYLES = "w-9.5 h-9.5 p-0";

/**
 * Button 按钮
 *
 * 基于 Doubao 设计系统的胶囊按钮，支持 4 种变体与 3 种尺寸。
 * 当 children 仅为单个图标元素时，自动切换为方形图标按钮。
 * 支持通过 children 传入 leadingIcon / trailingIcon。
 */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      asChild: _asChild,
      className,
      children,
      type = "button",
      ...rest
    },
    ref,
  ) => {
    // 检测是否为纯图标按钮：单个子元素且非文本/数字
    const childrenArray = React.Children.toArray(children);
    const isIconOnly =
      childrenArray.length === 1 && typeof childrenArray[0] !== "string";

    return (
      <button
        ref={ref}
        type={type}
        className={cx(
          "inline-flex items-center justify-center gap-1.5 rounded-full font-medium whitespace-nowrap select-none transition-colors active:scale-[0.97]",
          "focus-visible:outline-none focus-visible:shadow-[var(--glow-primary)]",
          "disabled:opacity-45 disabled:cursor-not-allowed",
          VARIANT_STYLES[variant],
          isIconOnly ? ICON_ONLY_STYLES : SIZE_STYLES[size],
          className,
        )}
        {...rest}
      >
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";

export default Button;

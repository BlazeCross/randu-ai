import React from "react";

// 简单的 className 拼接工具（过滤 falsy 值）
function cx(...args: Array<string | false | null | undefined>): string {
  return args.filter(Boolean).join(" ");
}

// 标签变体
type BadgeVariant =
  | "default"
  | "primary"
  | "success"
  | "danger"
  | "outline";

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement> {
  /** 变体：default 默认灰 / primary 品牌蓝 / success 绿 / danger 红 / outline 描边 */
  variant?: BadgeVariant;
  /** 是否显示圆点前缀 */
  dot?: boolean;
}

// 各变体样式
const BADGE_STYLES: Record<BadgeVariant, string> = {
  default: "bg-muted text-foreground",
  primary: "bg-accent text-accent-foreground",
  success: "bg-success/15 text-success-700",
  danger: "bg-destructive/15 text-destructive",
  outline: "border border-border text-foreground",
};

/**
 * Badge 标签
 *
 * 基于 Doubao 设计系统的胶囊标签，用于状态标记与分类。
 * 支持 5 种变体与可选圆点前缀。
 */
const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  (
    { variant = "default", dot = false, className, children, ...rest },
    ref,
  ) => {
    return (
      <span
        ref={ref}
        className={cx(
          "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
          BADGE_STYLES[variant],
          className,
        )}
        {...rest}
      >
        {dot && (
          <span className="w-1.5 h-1.5 rounded-full bg-current" aria-hidden />
        )}
        {children}
      </span>
    );
  },
);

Badge.displayName = "Badge";

export default Badge;

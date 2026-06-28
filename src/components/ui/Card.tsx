import React from "react";

// 简单的 className 拼接工具（过滤 falsy 值）
function cx(...args: Array<string | false | null | undefined>): string {
  return args.filter(Boolean).join(" ");
}

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 是否启用 hover 交互态（边框高亮 + 微浮起 + 背景晕染） */
  hover?: boolean;
}

/**
 * Card 卡片容器
 *
 * 基于 Doubao 设计系统的卡片，使用 --radius 圆角与边框优先策略。
 * hover 态会高亮边框、微浮起并叠加 accent 背景晕染。
 */
const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ hover = false, className, children, ...rest }, ref) => {
    return (
      <div
        ref={ref}
        className={cx(
          "bg-card border border-border rounded-[var(--radius)] transition-all duration-200",
          hover &&
            "cursor-pointer hover:border-[color-mix(in_srgb,var(--primary)_40%,var(--border))] hover:bg-[color-mix(in_srgb,var(--accent)_22%,var(--card))] hover:shadow-[var(--shadow-md)] hover:-translate-y-0.5",
          className,
        )}
        {...rest}
      >
        {children}
      </div>
    );
  },
);

Card.displayName = "Card";

/**
 * CardHeader 卡片头部
 * 带底部边框分隔，用于标题区
 */
export function CardHeader({
  className,
  children,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cx("border-b border-border/60 px-5 py-4", className)}
      {...rest}
    >
      {children}
    </div>
  );
}

/**
 * CardBody 卡片主体
 * 内容区，默认内边距
 */
export function CardBody({
  className,
  children,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cx("px-5 py-4", className)} {...rest}>
      {children}
    </div>
  );
}

/**
 * CardFooter 卡片底部
 * 带顶部边框分隔，用于操作区
 */
export function CardFooter({
  className,
  children,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cx("border-t border-border/60 px-5 py-4", className)}
      {...rest}
    >
      {children}
    </div>
  );
}

export default Card;

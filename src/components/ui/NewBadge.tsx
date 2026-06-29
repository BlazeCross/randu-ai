interface NewBadgeProps {
  size?: "sm" | "md";
  label?: string;
  className?: string;
}

/**
 * 小型橙色 "NEW" 标签组件
 * 用于标识最新上线的能力 / 工作流
 */
export default function NewBadge({
  size = "md",
  label = "NEW",
  className = "",
}: NewBadgeProps) {
  const sizeClasses =
    size === "sm" ? "text-[10px] px-1.5 py-0.5" : "text-xs px-2 py-0.5";
  return (
    <span
      className={`inline-flex items-center rounded-full bg-orange-500 font-semibold tracking-wide text-white shadow-[0_0_8px_rgba(249,115,22,0.45)] ${sizeClasses} ${className}`}
    >
      {label}
    </span>
  );
}

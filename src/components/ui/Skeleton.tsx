/**
 * 骨架屏基础组件
 *
 * 使用 Tailwind 内置的 animate-pulse 实现加载占位效果。
 * 提供多种形状预设，可灵活组合使用。
 */

type SkeletonShape = "rect" | "circle" | "text";

interface SkeletonProps {
  /** 形状：rect 矩形、circle 圆形、text 文本行 */
  shape?: SkeletonShape;
  /** 自定义宽度（默认 100%） */
  width?: string | number;
  /** 自定义高度（默认按 shape 默认） */
  height?: string | number;
  /** 圆角：仅 shape="rect" 时生效，默认按 shape 默认 */
  rounded?: string;
  /** 自定义 className */
  className?: string;
}

// 各形状的默认高度和圆角
const SHAPE_DEFAULTS: Record<
  SkeletonShape,
  { height: string; rounded: string }
> = {
  rect: { height: "1rem", rounded: "rounded-md" },
  circle: { height: "2.5rem", rounded: "rounded-full" },
  text: { height: "0.875rem", rounded: "rounded" },
};

export function Skeleton({
  shape = "rect",
  width = "100%",
  height,
  rounded,
  className = "",
}: SkeletonProps) {
  const defaults = SHAPE_DEFAULTS[shape];
  const style = {
    width: typeof width === "number" ? `${width}px` : width,
    height:
      height !== undefined
        ? typeof height === "number"
          ? `${height}px`
          : height
        : defaults.height,
  };
  const finalRounded = rounded ?? defaults.rounded;

  return (
    <div
      className={`animate-pulse bg-neutral-200 ${finalRounded} ${className}`}
      style={style}
      aria-hidden="true"
    />
  );
}

/**
 * 文本骨架行（多行）
 *
 * - lines: 行数（默认 3）
 * - 最后一行宽度较短（70%），更像真实文本
 */
export function SkeletonText({
  lines = 3,
  className = "",
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={`space-y-2 ${className}`} aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          shape="text"
          width={i === lines - 1 ? "70%" : "100%"}
        />
      ))}
    </div>
  );
}

/**
 * 列表项骨架（用于加载使用记录、订单列表等）
 *
 * 渲染一个横向布局：左侧文本块（标题+副标题）+ 右侧小标签
 */
export function SkeletonListItem() {
  return (
    <div
      className="flex items-center justify-between px-4 py-4 sm:px-6"
      aria-hidden="true"
    >
      <div className="flex-1 space-y-2">
        <Skeleton shape="text" width="40%" />
        <Skeleton shape="text" width="60%" height="0.75rem" />
      </div>
      <Skeleton shape="rect" width="4rem" height="1.5rem" rounded="rounded-full" />
    </div>
  );
}

/**
 * 卡片骨架（用于加载账号信息、订阅状态等卡片）
 */
export function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm" aria-hidden="true">
      <Skeleton shape="text" width="30%" className="mb-4" />
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between">
            <Skeleton shape="text" width="20%" />
            <Skeleton shape="text" width="40%" />
          </div>
        ))}
      </div>
    </div>
  );
}

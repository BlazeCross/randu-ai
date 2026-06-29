import { Skeleton } from "@/components/ui/Skeleton";

/**
 * 工作台加载骨架
 *
 * 布局：工作流卡片网格骨架（3 列 × 2 行 = 6 个卡片）。
 */
export default function Loading() {
  return (
    <main className="flex-1 bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* 页面标题骨架 */}
        <div className="mb-6">
          <Skeleton shape="rect" width="200px" height="2rem" className="mb-2" />
          <Skeleton shape="text" width="320px" />
        </div>

        {/* 工作流卡片网格骨架 */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="rounded-[var(--radius)] border border-border bg-card p-5"
            >
              {/* 图标 */}
              <Skeleton
                shape="rect"
                width={48}
                height={48}
                rounded="rounded-[var(--radius-lg)]"
                className="mb-4"
              />
              {/* 名称 */}
              <Skeleton shape="text" width="65%" className="mb-3" />
              {/* 描述 */}
              <Skeleton shape="text" width="100%" className="mb-2" />
              <Skeleton shape="text" width="80%" className="mb-5" />
              {/* 操作按钮 */}
              <div className="flex gap-3">
                <Skeleton
                  shape="rect"
                  width={80}
                  height={32}
                  rounded="rounded-[var(--radius-sm)]"
                />
                <Skeleton
                  shape="rect"
                  width={64}
                  height={32}
                  rounded="rounded-[var(--radius-sm)]"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

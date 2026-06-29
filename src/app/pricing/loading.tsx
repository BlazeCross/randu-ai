import { Skeleton } from "@/components/ui/Skeleton";

/**
 * 定价页加载骨架
 *
 * 布局：定价卡骨架（4 列卡片网格）。
 */
export default function Loading() {
  return (
    <main className="flex-1 bg-background">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* 页面标题骨架 */}
        <div className="mb-10 text-center">
          <Skeleton
            shape="rect"
            width="240px"
            height="2.5rem"
            className="mx-auto mb-4"
          />
          <div className="mx-auto max-w-2xl space-y-2">
            <Skeleton shape="text" width="100%" />
            <Skeleton shape="text" width="80%" className="mx-auto" />
          </div>
        </div>

        {/* 定价卡骨架：4 列 */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-[var(--radius)] border border-border bg-card p-6"
            >
              {/* 套餐名称 */}
              <Skeleton shape="text" width="50%" className="mb-4" />
              {/* 价格 */}
              <div className="mb-6 flex items-baseline gap-1">
                <Skeleton shape="text" width="30%" height="2rem" />
                <Skeleton shape="text" width="20%" height="0.875rem" />
              </div>
              {/* 功能列表 */}
              <div className="space-y-2.5">
                {Array.from({ length: 5 }).map((_, j) => (
                  <div key={j} className="flex items-center gap-2">
                    <Skeleton shape="circle" width={16} height={16} />
                    <Skeleton shape="text" width="80%" />
                  </div>
                ))}
              </div>
              {/* 按钮 */}
              <Skeleton
                shape="rect"
                height="2.75rem"
                rounded="rounded-full"
                className="mt-6"
              />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

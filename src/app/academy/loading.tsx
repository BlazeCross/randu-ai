import { Skeleton, SkeletonCard } from "@/components/ui/Skeleton";

/**
 * 燃渡学院首页加载骨架
 *
 * 布局：Hero 区骨架（标题 + 副标题 + 按钮）+ 学习路径卡片网格骨架。
 */
export default function Loading() {
  return (
    <main className="flex-1 bg-background">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Hero 区骨架 */}
        <section className="mx-auto max-w-3xl text-center">
          {/* 标签 */}
          <div className="mb-5 flex items-center justify-center gap-2">
            <Skeleton shape="rect" width="80px" height="1.5rem" rounded="rounded-full" />
            <Skeleton shape="rect" width="160px" height="1.5rem" rounded="rounded-full" />
          </div>
          {/* 标题 */}
          <Skeleton
            shape="rect"
            width="70%"
            height="2.5rem"
            className="mx-auto mb-5"
          />
          {/* 副标题 */}
          <div className="mx-auto mb-7 max-w-2xl space-y-2">
            <Skeleton shape="text" width="100%" />
            <Skeleton shape="text" width="90%" />
            <Skeleton shape="text" width="70%" />
          </div>
          {/* 按钮 */}
          <div className="flex items-center justify-center gap-3">
            <Skeleton shape="rect" width="140px" height="2.75rem" rounded="rounded-full" />
            <Skeleton shape="rect" width="120px" height="2.75rem" rounded="rounded-full" />
          </div>
        </section>

        {/* 数据统计卡片骨架 */}
        <section className="mt-12">
          <div className="grid grid-cols-1 gap-4 rounded-[var(--radius)] border border-border bg-card p-6 sm:grid-cols-3 sm:gap-6 sm:p-8">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="text-center">
                <Skeleton
                  shape="rect"
                  width="60%"
                  height="2.5rem"
                  className="mx-auto mb-2"
                />
                <Skeleton shape="text" width="80%" className="mx-auto" />
              </div>
            ))}
          </div>
        </section>

        {/* 学习路径卡片网格骨架 */}
        <section className="mt-16 sm:mt-20">
          <div className="mb-8 space-y-2">
            <Skeleton shape="rect" width="280px" height="2rem" />
            <Skeleton shape="text" width="60%" />
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

import {
  Skeleton,
  SkeletonListItem,
  SkeletonText,
} from "@/components/ui/Skeleton";

/**
 * 个人中心加载骨架
 *
 * 布局：使用 root layout 的 Navbar，主内容区显示
 * 个人资料卡骨架（大头像圆形 + 标题 + 文本）+ 账号信息卡 + 使用记录列表骨架。
 */
export default function Loading() {
  return (
    <main className="flex-1 bg-background">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {/* 页面标题 */}
        <div className="mb-6">
          <Skeleton shape="rect" width="180px" height="2rem" className="mb-2" />
          <Skeleton shape="text" width="280px" />
        </div>

        {/* 个人资料卡片：大头像圆形 + 标题 + 文本 */}
        <div className="mb-6 rounded-[var(--radius)] border border-border bg-card p-6 sm:p-8">
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
            <Skeleton shape="circle" width={96} height={96} />
            <div className="flex-1 space-y-3">
              <Skeleton shape="text" width="40%" />
              <Skeleton shape="text" width="60%" height="0.75rem" />
              <SkeletonText lines={3} />
            </div>
          </div>
        </div>

        {/* 账号信息 + 订阅状态卡片 */}
        <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div
              key={i}
              className="rounded-[var(--radius)] border border-border bg-card p-4 sm:p-5"
            >
              <Skeleton shape="text" width="30%" className="mb-3" />
              <div className="space-y-2.5">
                {Array.from({ length: 4 }).map((_, j) => (
                  <div key={j} className="flex items-center justify-between">
                    <Skeleton shape="text" width="25%" />
                    <Skeleton shape="text" width="40%" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* 使用记录列表骨架 */}
        <div className="rounded-[var(--radius)] border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-4 py-4 sm:px-6">
            <Skeleton shape="text" width="120px" />
            <Skeleton shape="text" width="80px" />
          </div>
          <div className="divide-y divide-border">
            {Array.from({ length: 5 }).map((_, i) => (
              <SkeletonListItem key={i} />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

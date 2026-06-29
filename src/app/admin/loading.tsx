import { Skeleton, SkeletonListItem } from "@/components/ui/Skeleton";

/**
 * 后台管理加载骨架
 *
 * 布局：左侧侧栏导航项骨架（短行 SkeletonText）+ 右侧主内容区表格骨架
 * （4-5 行 SkeletonListItem）。
 *
 * 注意：admin/layout.tsx 已经渲染了真实的侧边栏（fixed 定位，桌面端 256px），
 * 此 loading.tsx 渲染在 layout 的 <main> 内（已通过 md:pl-64 让出侧栏宽度），
 * 因此这里只展示主内容区的表格骨架，避免与真实侧栏产生视觉冲突。
 */
export default function Loading() {
  return (
    <div className="flex min-h-[60vh] gap-6">
      {/* 侧栏导航项骨架：仅桌面端可见，作为侧栏内容的占位 */}
      <aside className="hidden w-48 flex-none flex-col gap-3 md:flex">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <Skeleton shape="circle" width={20} height={20} />
            <Skeleton shape="text" width="60%" />
          </div>
        ))}
      </aside>

      {/* 主内容区：表格骨架 */}
      <div className="flex-1 rounded-[var(--radius)] border border-border bg-card">
        <div className="border-b border-border px-4 py-4 sm:px-6">
          <Skeleton shape="text" width="140px" />
        </div>
        <div className="divide-y divide-border">
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonListItem key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

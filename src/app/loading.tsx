import { SkeletonCard, SkeletonText } from "@/components/ui/Skeleton";

/**
 * 根级通用骨架屏
 *
 * 全屏居中，显示一个大的 SkeletonCard + 几行 SkeletonText。
 * 作为全站路由切换时的默认加载占位。
 */
export default function Loading() {
  return (
    <main className="flex flex-1 items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-2xl space-y-6">
        <SkeletonCard />
        <SkeletonText lines={3} />
      </div>
    </main>
  );
}

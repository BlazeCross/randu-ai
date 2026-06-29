import { Skeleton } from "@/components/ui/Skeleton";

/**
 * 对话页加载骨架
 *
 * 布局：左侧对话列表骨架（3-4 个对话项）+ 右侧对话区骨架（输入框在底部）。
 * 使用 flex-1 填充剩余视口高度，避免依赖 Navbar 高度（AppShell 路由为 h-12）。
 */
export default function Loading() {
  return (
    <main className="flex flex-1 flex-col bg-background">
      <div className="mx-auto flex w-full max-w-7xl flex-1 gap-0">
        {/* 左侧：对话列表骨架 */}
        <aside className="flex w-64 flex-none flex-col border-r border-border bg-card">
          {/* 新对话按钮骨架 */}
          <div className="p-3">
            <Skeleton
              shape="rect"
              height="2.5rem"
              rounded="rounded-[var(--radius-sm)]"
            />
          </div>
          {/* 对话项骨架 */}
          <div className="flex-1 space-y-2 px-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="flex items-start gap-2 rounded-[var(--radius-sm)] px-3 py-2"
              >
                <Skeleton shape="circle" width={14} height={14} />
                <div className="flex-1 space-y-1.5">
                  <Skeleton shape="text" width="80%" />
                  <Skeleton shape="text" width="40%" height="0.625rem" />
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* 右侧：对话区骨架 */}
        <section className="flex flex-1 flex-col">
          {/* 顶栏骨架 */}
          <div className="flex items-center gap-3 border-b border-border px-4 py-4">
            <Skeleton shape="circle" width={28} height={28} />
            <Skeleton shape="text" width="160px" />
          </div>

          {/* 对话内容区骨架（居中占位） */}
          <div className="flex flex-1 items-center justify-center p-6">
            <div className="w-full max-w-md space-y-4">
              <Skeleton shape="text" width="60%" className="mx-auto" />
              <Skeleton
                shape="text"
                width="80%"
                className="mx-auto"
                height="0.75rem"
              />
            </div>
          </div>

          {/* 底部输入框骨架 */}
          <div className="border-t border-border p-4">
            <Skeleton
              shape="rect"
              height="3rem"
              rounded="rounded-[var(--radius-sm)]"
            />
          </div>
        </section>
      </div>
    </main>
  );
}

"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/layout/AppShell";

// 工作流列表项（仅含教程所需字段）
interface WorkflowDocItem {
  id: string;
  name: string;
  description: string | null;
  category: string;
  icon: string | null;
  feishuDocUrl: string | null;
}

interface ListResponse {
  workflows: WorkflowDocItem[];
}

/**
 * 图文教程中心
 *
 * 展示所有工作流的飞书文档链接，按分类分组。
 * 点击卡片在新标签页打开飞书文档。
 *
 * 数据来源：GET /api/workflow/list（公开接口）
 * 搜索框实时筛选当前已加载的工作流（不发起新请求）。
 */
export default function ArticlesPage() {
  const [workflows, setWorkflows] = useState<WorkflowDocItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // 搜索关键词（输入框实时绑定，仅筛选当前已加载数据，不重新发请求）
  const [search, setSearch] = useState("");
  // 当前选中的分类（"全部" 表示不筛选）
  const [activeCategory, setActiveCategory] = useState<string>("全部");

  /**
   * 数据拉取：仅在挂载时请求一次。
   * 注意：为符合 React 19 的 react-hooks/set-state-in-effect 规则，
   * effect 内不同步调用 setState，所有状态更新均放在异步回调中。
   */
  useEffect(() => {
    let cancelled = false;
    fetch("/api/workflow/list", { cache: "no-store" })
      .then((res) => {
        if (!res.ok) throw new Error("获取文档列表失败");
        return res.json();
      })
      .then((data: ListResponse) => {
        if (cancelled) return;
        setWorkflows(data.workflows || []);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "获取文档列表失败");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // 筛选出有飞书文档的工作流
  const docsWithLink = workflows.filter(
    (w) => w.feishuDocUrl && w.feishuDocUrl.trim().length > 0,
  );

  // 所有分类（基于已加载数据，用于侧栏稳定展示）
  const categories: string[] = ["全部"];
  const seen = new Set<string>();
  for (const w of docsWithLink) {
    if (!seen.has(w.category)) {
      seen.add(w.category);
      categories.push(w.category);
    }
  }

  // 应用搜索 + 分类筛选（实时，不重新发请求）
  const keyword = search.trim().toLowerCase();
  const filtered = docsWithLink.filter((w) => {
    const matchesCategory =
      activeCategory === "全部" || w.category === activeCategory;
    const matchesSearch =
      !keyword ||
      w.name.toLowerCase().includes(keyword) ||
      (w.description?.toLowerCase().includes(keyword) ?? false);
    return matchesCategory && matchesSearch;
  });

  // 按分类分组
  const grouped: Record<string, WorkflowDocItem[]> = {};
  for (const w of filtered) {
    if (!grouped[w.category]) grouped[w.category] = [];
    grouped[w.category].push(w);
  }

  return (
    <AppShell
      title="图文教程"
      subtitle="查看每个工作流的详细使用教程"
      tutorialHref="/tutorial"
      sidebarHeader={
        <div className="relative">
          <svg
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z"
            />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索教程..."
            className="w-full rounded-[var(--radius-sm)] border border-transparent bg-background py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none"
          />
        </div>
      }
      sidebar={
        <div className="flex flex-col gap-1 p-2">
          <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            文档分类
          </div>
          {categories.map((cat) => {
            const active = activeCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={
                  active
                    ? "rounded-[var(--radius-sm)] bg-background px-3 py-2 text-left text-sm font-medium text-foreground"
                    : "rounded-[var(--radius-sm)] px-3 py-2 text-left text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                }
              >
                {cat}
              </button>
            );
          })}
        </div>
      }
    >
      <div className="p-6 lg:p-8">
        {/* 加载状态：骨架屏 */}
        {loading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div
                key={idx}
                className="animate-pulse rounded-[var(--radius)] border border-border bg-card p-5"
              >
                <div className="mb-3 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-[var(--radius-lg)] bg-muted" />
                  <div className="h-4 w-2/3 rounded bg-muted" />
                </div>
                <div className="mb-2 h-3 w-full rounded bg-muted" />
                <div className="h-3 w-5/6 rounded bg-muted" />
              </div>
            ))}
          </div>
        ) : error ? (
          // 错误状态
          <div className="rounded-[var(--radius)] border border-border bg-card p-8 text-center sm:p-12">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted text-3xl">
              ⚠️
            </div>
            <p className="text-base font-medium text-foreground">
              加载失败
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{error}</p>
          </div>
        ) : filtered.length === 0 ? (
          // 空状态
          <div className="rounded-[var(--radius)] border border-dashed border-border bg-card p-16 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted text-3xl">
              📚
            </div>
            <p className="text-base font-medium text-foreground">暂无教程文档</p>
            <p className="mt-1 text-sm text-muted-foreground">
              请尝试更换关键词或分类筛选条件
            </p>
          </div>
        ) : (
          // 按分类展示文档卡片
          <div className="space-y-8">
            {Object.entries(grouped).map(([category, items]) => (
              <section key={category}>
                <h2 className="mb-4 text-lg font-semibold text-foreground">
                  {category}
                </h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {items.map((w) => (
                    <a
                      key={w.id}
                      href={w.feishuDocUrl!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex flex-col rounded-[var(--radius)] border border-border bg-card p-5 transition-all hover:border-[color-mix(in_srgb,var(--primary)_40%,var(--border))] hover:bg-[color-mix(in_srgb,var(--accent)_22%,var(--card))]"
                    >
                      <div className="mb-3 flex items-center gap-3">
                        {w.icon ? (
                          <span className="text-2xl">{w.icon}</span>
                        ) : (
                          <span className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-lg)] bg-accent text-primary">
                            <svg
                              className="h-5 w-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              strokeWidth={1.8}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                              />
                            </svg>
                          </span>
                        )}
                        <h3 className="flex-1 text-sm font-semibold text-foreground group-hover:text-primary">
                          {w.name}
                        </h3>
                        <svg
                          className="h-4 w-4 flex-shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                          />
                        </svg>
                      </div>
                      {w.description && (
                        <p className="line-clamp-2 text-xs text-muted-foreground">
                          {w.description}
                        </p>
                      )}
                    </a>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}

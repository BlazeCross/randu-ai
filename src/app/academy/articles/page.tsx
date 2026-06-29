"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/layout/AppShell";
import Badge from "@/components/ui/Badge";
import { useAuth } from "@/hooks/useAuth";

// 教程数据（与 /api/tutorials 返回字段对齐）
interface Tutorial {
  id: string;
  type: string;
  title: string;
  category: string | null;
  cover: string | null;
  excerpt: string | null;
  sortOrder: number;
  studyCount: number;
  viewCount: number;
  accessLevel: string; // free | vip
  createdAt: string;
}

interface TutorialsResponse {
  tutorials: Tutorial[];
}

/**
 * 图文教程中心
 *
 * 数据来源：GET /api/tutorials?type=article（公开接口）
 * 展示已发布图文教程，按分类分组。
 * VIP 教程对未订阅用户显示锁定标识。
 */
export default function ArticlesPage() {
  const { user } = useAuth();
  const [tutorials, setTutorials] = useState<Tutorial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // 搜索关键词（输入框实时绑定，仅筛选当前已加载数据，不重新发请求）
  const [search, setSearch] = useState("");
  // 当前选中的分类（"全部" 表示不筛选）
  const [activeCategory, setActiveCategory] = useState<string>("全部");

  const isSubscribed = !!user?.isSubscribed;

  /**
   * 数据拉取：仅在挂载时请求一次。
   * 注意：为符合 React 19 的 react-hooks/set-state-in-effect 规则，
   * effect 内不同步调用 setState，所有状态更新均放在异步回调中。
   */
  useEffect(() => {
    let cancelled = false;
    fetch("/api/tutorials?type=article", { cache: "no-store" })
      .then((res) => {
        if (!res.ok) throw new Error("获取教程列表失败");
        return res.json();
      })
      .then((data: TutorialsResponse) => {
        if (cancelled) return;
        setTutorials(data.tutorials || []);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "获取教程列表失败");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // 所有分类（基于已加载数据，用于侧栏稳定展示）
  const categories: string[] = ["全部"];
  const seen = new Set<string>();
  for (const t of tutorials) {
    const cat = t.category || "未分类";
    if (!seen.has(cat)) {
      seen.add(cat);
      categories.push(cat);
    }
  }

  // 应用搜索 + 分类筛选（实时，不重新发请求）
  const keyword = search.trim().toLowerCase();
  const filtered = tutorials.filter((t) => {
    const cat = t.category || "未分类";
    const matchesCategory =
      activeCategory === "全部" || cat === activeCategory;
    const matchesSearch =
      !keyword ||
      t.title.toLowerCase().includes(keyword) ||
      (t.excerpt?.toLowerCase().includes(keyword) ?? false);
    return matchesCategory && matchesSearch;
  });

  // 按分类分组
  const grouped: Record<string, Tutorial[]> = {};
  for (const t of filtered) {
    const cat = t.category || "未分类";
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(t);
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
                className="animate-pulse overflow-hidden rounded-[var(--radius)] border border-border bg-card"
              >
                <div className="aspect-[16/9] w-full bg-muted" />
                <div className="p-5">
                  <div className="mb-3 h-3 w-1/4 rounded bg-muted" />
                  <div className="mb-2 h-4 w-3/4 rounded bg-muted" />
                  <div className="h-3 w-full rounded bg-muted" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          // 错误状态
          <div className="rounded-[var(--radius)] border border-border bg-card p-8 text-center sm:p-12">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted text-3xl">
              ⚠️
            </div>
            <p className="text-base font-medium text-foreground">加载失败</p>
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
          // 按分类展示教程卡片
          <div className="space-y-8">
            {Object.entries(grouped).map(([category, items]) => (
              <section key={category}>
                <h2 className="mb-4 text-lg font-semibold text-foreground">
                  {category}
                </h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {items.map((t) => {
                    const isVip = t.accessLevel === "vip";
                    const isLocked = isVip && !isSubscribed;
                    return (
                      <article
                        key={t.id}
                        className="group flex flex-col overflow-hidden rounded-[var(--radius)] border border-border bg-card transition-all hover:border-[color-mix(in_srgb,var(--primary)_40%,var(--border))] hover:bg-[color-mix(in_srgb,var(--accent)_22%,var(--card))]"
                      >
                        {/* 封面 */}
                        <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted">
                          {t.cover ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={t.cover}
                              alt={t.title}
                              className={`h-full w-full object-cover transition-transform duration-300 group-hover:scale-105 ${
                                isLocked ? "blur-sm" : ""
                              }`}
                              loading="lazy"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center">
                              <svg
                                className="h-12 w-12 text-muted-foreground/60"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                strokeWidth={1.5}
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                />
                              </svg>
                            </div>
                          )}
                          {/* VIP 锁定标识 */}
                          {isVip && (
                            <div className="absolute right-2 top-2">
                              {isLocked ? (
                                <Badge variant="gradient" className="gap-1">
                                  <svg
                                    className="h-3 w-3"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                    strokeWidth={2}
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                                    />
                                  </svg>
                                  VIP
                                </Badge>
                              ) : (
                                <Badge variant="gradient">VIP</Badge>
                              )}
                            </div>
                          )}
                        </div>
                        {/* 内容 */}
                        <div className="flex flex-1 flex-col p-5">
                          {t.category && (
                            <span className="mb-2 inline-flex w-fit items-center rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-primary">
                              {t.category}
                            </span>
                          )}
                          <h3 className="mb-2 text-sm font-semibold text-foreground group-hover:text-primary">
                            {t.title}
                          </h3>
                          {t.excerpt && (
                            <p className="line-clamp-2 flex-1 text-xs leading-5 text-muted-foreground">
                              {t.excerpt}
                            </p>
                          )}
                          {/* 学习人数 / 浏览次数 */}
                          <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="inline-flex items-center gap-1">
                              <svg
                                className="h-3.5 w-3.5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                strokeWidth={1.8}
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M12 14l9-5-9-5-9 5 9 5z M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z M12 14v6"
                                />
                              </svg>
                              {t.studyCount.toLocaleString()} 人学习
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <svg
                                className="h-3.5 w-3.5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                strokeWidth={1.8}
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                />
                              </svg>
                              {t.viewCount.toLocaleString()} 次浏览
                            </span>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}

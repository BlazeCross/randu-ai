"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import GlowCard from "@/components/ui/GlowCard";
import GradientText from "@/components/ui/GradientText";
import ScrollReveal from "@/components/ui/ScrollReveal";
import { cx } from "@/lib/cn";

// 工作流列表项类型（与 /api/workflow/list 返回结构一致）
interface WorkflowListItem {
  id: string;
  name: string;
  description: string | null;
  category: string;
  icon: string | null;
  status: string;
  feishuDocUrl: string | null;
}

// 行业筛选选项
const INDUSTRIES = [
  "全部",
  "电商",
  "新媒体",
  "教育",
  "企业",
  "其他",
] as const;

// 场景筛选选项
const SCENES = [
  "全部",
  "内容生成",
  "数据分析",
  "自动化",
  "效率工具",
] as const;

// 分类筛选选项
const CATEGORIES = [
  "全部",
  "文案写作",
  "图像生成",
  "视频创作",
  "效率工具",
  "更多",
] as const;

// 分类对应的渐变色（用于封面占位色块）
const CATEGORY_GRADIENTS: Record<string, string> = {
  文案写作: "from-chart-1/30 to-chart-2/20",
  图像生成: "from-primary/25 to-chart-3/20",
  视频创作: "from-success/25 to-chart-1/20",
  效率工具: "from-warning/25 to-chart-2/20",
};

// 琥珀色选中态
const AMBER_COLOR = "#E67E22";

// 模拟使用次数（实际项目中应从 API 获取）
const MOCK_USAGE_COUNTS: Record<string, number> = {
  "1": 1200,
  "2": 890,
  "3": 2300,
  "4": 560,
  "5": 1800,
  "6": 420,
  "7": 950,
  "8": 3100,
};

function getMockUsageCount(id: string): string {
  const count = MOCK_USAGE_COUNTS[id] || Math.floor(Math.random() * 2000) + 100;
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k`;
  }
  return count.toString();
}

export default function MarketplacePage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [category, setCategory] = useState<string>("全部");
  const [industry, setIndustry] = useState<string>("全部");
  const [scene, setScene] = useState<string>("全部");
  const [workflows, setWorkflows] = useState<WorkflowListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  // 从 localStorage 加载收藏状态
  useEffect(() => {
    try {
      const stored = localStorage.getItem("workflow-favorites");
      if (stored) {
        setFavorites(new Set(JSON.parse(stored)));
      }
    } catch {
      // ignore
    }
  }, []);

  // 切换收藏状态
  const toggleFavorite = useCallback((id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      try {
        localStorage.setItem("workflow-favorites", JSON.stringify([...next]));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  // 搜索防抖
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // 数据拉取
  useEffect(() => {
    let cancelled = false;

    const params = new URLSearchParams();
    // "全部" 和 "更多" 不传 category（更多 = 浏览全部）
    if (category && category !== "全部" && category !== "更多") {
      params.set("category", category);
    }
    if (debouncedSearch.trim()) {
      params.set("search", debouncedSearch.trim());
    }
    const query = params.toString();
    const url = `/api/workflow/list${query ? `?${query}` : ""}`;

    fetch(url, { cache: "no-store" })
      .then((res) => {
        if (!res.ok) throw new Error("获取工作流列表失败");
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;
        const list = (data as { workflows?: WorkflowListItem[] }).workflows ?? [];
        setWorkflows(list);
        setError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("获取工作流列表失败:", err);
        setError("加载失败，请稍后重试");
        setWorkflows([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [category, debouncedSearch, reloadKey, industry, scene]);

  const handleCategoryChange = (cat: string) => {
    setCategory(cat);
    setLoading(true);
  };

  const handleIndustryChange = (ind: string) => {
    setIndustry(ind);
    setLoading(true);
  };

  const handleSceneChange = (sc: string) => {
    setScene(sc);
    setLoading(true);
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setLoading(true);
  };

  const handleReload = () => {
    setReloadKey((k) => k + 1);
    setLoading(true);
  };

  return (
    <main className="flex-1 bg-background">
      {/* ===== Hero 区域 ===== */}
      <section className="relative overflow-hidden border-b border-border">
        {/* 背景装饰 */}
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-primary/8 blur-3xl" />
          <div className="absolute -left-20 bottom-0 h-72 w-72 rounded-full bg-chart-1/5 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-5xl px-4 py-16 text-center sm:px-6 sm:py-20 lg:px-8">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-xs font-semibold uppercase tracking-wider text-accent-foreground">
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            工作流市场
          </span>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-5xl">
            <GradientText>工作流市场</GradientText>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
            探索丰富的AI工作流，一键开启你的创意之旅
          </p>

          {/* 搜索栏 */}
          <div className="mx-auto mt-8 max-w-2xl">
            <div className="relative">
              <svg
                className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={2}
                aria-hidden
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
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="搜索工作流名称..."
                className="w-full rounded-full border border-border bg-card py-3.5 pl-14 pr-5 text-base text-foreground shadow-[var(--shadow-sm)] placeholder:text-muted-foreground focus:border-primary/50 focus:shadow-[var(--glow-primary)] focus:outline-none transition-all duration-200"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ===== 行业 + 场景双重筛选导航 ===== */}
      <section className="sticky top-16 z-30 border-b border-border bg-[var(--glass-bg)] backdrop-blur-[var(--glass-blur)]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* 行业筛选 */}
          <div className="flex items-center gap-2 overflow-x-auto py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <span className="shrink-0 text-xs font-semibold text-muted-foreground">行业:</span>
            {INDUSTRIES.map((ind) => {
              const active = industry === ind;
              return (
                <button
                  key={ind}
                  type="button"
                  onClick={() => handleIndustryChange(ind)}
                  className={cx(
                    "shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-all duration-200",
                    active
                      ? "text-white shadow-[var(--shadow-sm)]"
                      : "border border-border bg-card text-muted-foreground hover:border-amber-300 hover:text-foreground",
                  )}
                  style={active ? { backgroundColor: AMBER_COLOR } : undefined}
                >
                  {ind}
                </button>
              );
            })}
          </div>
          {/* 场景筛选 */}
          <div className="flex items-center gap-2 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <span className="shrink-0 text-xs font-semibold text-muted-foreground">场景:</span>
            {SCENES.map((sc) => {
              const active = scene === sc;
              return (
                <button
                  key={sc}
                  type="button"
                  onClick={() => handleSceneChange(sc)}
                  className={cx(
                    "shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-all duration-200",
                    active
                      ? "text-white shadow-[var(--shadow-sm)]"
                      : "border border-border bg-card text-muted-foreground hover:border-amber-300 hover:text-foreground",
                  )}
                  style={active ? { backgroundColor: AMBER_COLOR } : undefined}
                >
                  {sc}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== 工作流卡片网格 ===== */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        {loading ? (
          // 加载状态：骨架屏
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, idx) => (
              <div
                key={idx}
                className="overflow-hidden rounded-[var(--radius)] border border-border bg-card"
              >
                <div className="h-32 animate-shimmer" />
                <div className="p-5">
                  <div className="mb-3 h-5 w-2/3 rounded bg-muted" />
                  <div className="mb-2 h-3 w-full rounded bg-muted" />
                  <div className="mb-5 h-3 w-5/6 rounded bg-muted" />
                  <div className="h-9 w-full rounded-[var(--radius-sm)] bg-muted" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          // 错误状态
          <div className="rounded-[var(--radius)] border border-border bg-card p-8 text-center sm:p-12">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-2xl">
              ⚠️
            </div>
            <p className="text-base font-medium text-foreground">{error}</p>
            <button
              type="button"
              onClick={handleReload}
              className="mt-4 inline-flex items-center justify-center rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
            >
              重新加载
            </button>
          </div>
        ) : workflows.length === 0 ? (
          // 空状态
          <div className="rounded-[var(--radius)] border border-dashed border-border bg-card p-16 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted text-3xl">
              🔍
            </div>
            <p className="text-base font-medium text-foreground">未找到匹配的工作流</p>
            <p className="mt-1 text-sm text-muted-foreground">
              请尝试更换关键词或分类筛选条件
            </p>
          </div>
        ) : (
          // 工作流卡片网格
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {workflows.map((workflow, idx) => {
              const isFavorited = favorites.has(workflow.id);
              return (
                <ScrollReveal
                  key={workflow.id}
                  className={`stagger-${Math.min(idx + 1, 8)}`}
                >
                  <GlowCard glow className="group flex h-full flex-col p-0">
                    {/* 封面占位色块 */}
                    <div
                      className={cx(
                        "relative flex h-32 items-center justify-center bg-gradient-to-br overflow-hidden",
                        CATEGORY_GRADIENTS[workflow.category] || "from-accent to-primary/10",
                      )}
                    >
                      <span className="text-5xl drop-shadow-sm transition-transform duration-300 group-hover:scale-110">
                        {workflow.icon || "🤖"}
                      </span>
                      {/* 装饰性光斑 */}
                      <div className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full bg-primary/10 blur-2xl" />
                      {/* 收藏按钮 */}
                      <button
                        type="button"
                        onClick={(e) => toggleFavorite(workflow.id, e)}
                        className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm transition-all duration-200 hover:bg-black/60"
                        aria-label={isFavorited ? "取消收藏" : "收藏"}
                      >
                        <svg
                          className={cx(
                            "h-4 w-4 transition-colors duration-200",
                            isFavorited ? "fill-red-500 text-red-500" : "fill-transparent text-white",
                          )}
                          stroke="currentColor"
                          strokeWidth={2}
                          viewBox="0 0 24 24"
                          aria-hidden
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                          />
                        </svg>
                      </button>
                    </div>

                    {/* 卡片内容 */}
                    <Link
                      href={`/workspace/${workflow.id}/use`}
                      className="flex flex-1 flex-col p-5"
                    >
                      {/* 名称 */}
                      <h3 className="mb-1.5 text-base font-semibold text-foreground transition-colors group-hover:text-primary">
                        {workflow.name}
                      </h3>

                      {/* 描述 */}
                      <p className="mb-4 line-clamp-2 flex-1 text-sm leading-6 text-muted-foreground">
                        {workflow.description || "暂无描述"}
                      </p>

                      {/* 分类标签 + 使用次数 */}
                      <div className="mb-4 flex items-center justify-between gap-2">
                        <span className="inline-flex items-center rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-medium text-success">
                          {workflow.category}
                        </span>
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
                          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} aria-hidden>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                          </svg>
                          {getMockUsageCount(workflow.id)} 次使用
                        </span>
                      </div>

                      {/* 使用按钮 */}
                      <div className="inline-flex items-center justify-center rounded-[var(--radius-sm)] bg-gradient-to-r from-primary to-primary-500 px-4 py-2 text-sm font-medium text-primary-foreground shadow-[var(--shadow-xs)] transition-all duration-200 group-hover:shadow-[var(--shadow-md)] group-hover:brightness-110">
                        使用
                      </div>
                    </Link>
                  </GlowCard>
                </ScrollReveal>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}

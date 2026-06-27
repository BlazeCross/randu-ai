"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AppShell from "@/components/layout/AppShell";

// 教程文档项（与 /api/workflow/list 返回结构中的工作流项一致）
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

export default function TutorialPage() {
  // 搜索关键词（输入框实时绑定，本地筛选）
  const [search, setSearch] = useState("");
  // 当前选中的分类（"全部" 表示不筛选）
  const [category, setCategory] = useState<string>("全部");
  // 拥有 feishuDocUrl 的工作流（即教程文档）
  const [docs, setDocs] = useState<WorkflowDocItem[]>([]);
  // 加载状态
  const [loading, setLoading] = useState(true);
  // 错误信息
  const [error, setError] = useState<string | null>(null);
  // 重拉触发器
  const [reloadKey, setReloadKey] = useState(0);

  /**
   * 数据拉取：一次性获取全部工作流，筛选出有 feishuDocUrl 的项。
   * 注意：为符合 React 19 的 react-hooks/set-state-in-effect 规则，
   * effect 内不同步调用 setState，所有状态更新均放在异步回调中。
   */
  useEffect(() => {
    let cancelled = false;

    fetch("/api/workflow/list", { cache: "no-store" })
      .then((res) => {
        if (!res.ok) throw new Error("获取工作流列表失败");
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;
        const list = (data as ListResponse).workflows ?? [];
        const filtered = list.filter((w) => !!w.feishuDocUrl);
        setDocs(filtered);
        setError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("获取教程列表失败:", err);
        setError("加载失败，请稍后重试");
        setDocs([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  // 从数据中提取所有分类（去重，并在首位插入"全部"）
  const categories = useMemo(() => {
    const set = new Set<string>();
    docs.forEach((d) => set.add(d.category));
    return ["全部", ...Array.from(set)];
  }, [docs]);

  // 按搜索词与分类筛选，并按 category 分组
  const grouped = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    const filtered = docs.filter((d) => {
      const matchCategory = category === "全部" || d.category === category;
      const matchKeyword =
        !keyword ||
        d.name.toLowerCase().includes(keyword) ||
        (d.description?.toLowerCase().includes(keyword) ?? false);
      return matchCategory && matchKeyword;
    });
    const map = new Map<string, WorkflowDocItem[]>();
    filtered.forEach((d) => {
      if (!map.has(d.category)) map.set(d.category, []);
      map.get(d.category)!.push(d);
    });
    return Array.from(map.entries());
  }, [docs, search, category]);

  /** 点击重新加载 */
  const handleReload = () => {
    setReloadKey((k) => k + 1);
    setLoading(true);
  };

  return (
    <AppShell
      title="教程中心"
      subtitle="浏览所有工作流使用教程"
      showTutorial={false}
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
          {/* 快速入口 */}
          <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            快速入口
          </div>
          <Link
            href="/workspace"
            className="flex items-center gap-2 rounded-[var(--radius-sm)] px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={1.7}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span>返回工作台</span>
          </Link>
          <Link
            href="/academy/articles"
            className="flex items-center gap-2 rounded-[var(--radius-sm)] px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={1.7}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
            <span>图文教程</span>
          </Link>
          <Link
            href="/academy/videos"
            className="flex items-center gap-2 rounded-[var(--radius-sm)] px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={1.7}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <span>视频教程</span>
          </Link>

          <div className="my-2 border-t border-border" />

          {/* 分类列表 */}
          <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            教程分类
          </div>
          {categories.map((cat) => {
            const active = category === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
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
          <div className="space-y-10">
            {Array.from({ length: 2 }).map((_, gIdx) => (
              <section key={gIdx}>
                <div className="mb-4 h-6 w-32 animate-pulse rounded bg-muted" />
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {Array.from({ length: 3 }).map((_, idx) => (
                    <div
                      key={idx}
                      className="animate-pulse rounded-[var(--radius)] border border-border bg-card p-5"
                    >
                      <div className="mb-4 h-12 w-12 rounded-[var(--radius-lg)] bg-muted" />
                      <div className="mb-3 h-5 w-2/3 rounded bg-muted" />
                      <div className="mb-2 h-3 w-full rounded bg-muted" />
                      <div className="mb-4 h-3 w-5/6 rounded bg-muted" />
                      <div className="h-4 w-20 rounded bg-muted" />
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : error ? (
          // 错误状态
          <div className="rounded-[var(--radius)] border border-border bg-card p-8 sm:p-12">
            <p className="text-base font-medium text-foreground">{error}</p>
            <button
              type="button"
              onClick={handleReload}
              className="mt-4 inline-flex items-center rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
            >
              重新加载
            </button>
          </div>
        ) : grouped.length === 0 ? (
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
          // 按分类分组的文档卡片网格
          <div className="space-y-10">
            {grouped.map(([cat, items]) => (
              <section key={cat}>
                <h2 className="mb-4 text-lg font-semibold text-foreground">
                  {cat}
                  <span className="ml-2 text-sm font-normal text-muted-foreground">
                    {items.length} 篇
                  </span>
                </h2>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {items.map((doc) => (
                    <a
                      key={doc.id}
                      href={doc.feishuDocUrl as string}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex flex-col rounded-[var(--radius)] border border-border bg-card p-5 transition-all hover:border-[color-mix(in_srgb,var(--primary)_40%,var(--border))] hover:bg-[color-mix(in_srgb,var(--accent)_22%,var(--card))]"
                    >
                      <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-[var(--radius-lg)] bg-accent text-2xl">
                        {doc.icon || "📘"}
                      </div>
                      <h3 className="mb-2 text-base font-semibold text-foreground">
                        {doc.name}
                      </h3>
                      <p className="mb-4 line-clamp-2 flex-1 text-sm leading-6 text-muted-foreground">
                        {doc.description || "暂无描述"}
                      </p>
                      <div className="flex items-center gap-1.5 text-sm font-medium text-primary">
                        <span>查看文档</span>
                        <svg
                          className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          strokeWidth={1.7}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden
                        >
                          <path d="M7 17L17 7M7 7h10v10" />
                        </svg>
                      </div>
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

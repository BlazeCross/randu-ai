"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ErrorMessage from "@/components/ui/ErrorMessage";

// 工作流列表项类型（与 /api/workflow/list 返回结构一致）
interface WorkflowListItem {
  id: string;
  name: string;
  description: string | null;
  category: string;
  icon: string | null;
  status: string;
}

// 分类筛选选项
const CATEGORIES = [
  "全部",
  "视频生成",
  "内容创作",
  "数据处理",
  "自动化运营",
  "图像设计",
  "智能对话",
] as const;

export default function WorkspacePage() {
  // 搜索关键词（输入框实时绑定，触发防抖）
  const [search, setSearch] = useState("");
  // 防抖后的搜索关键词（延迟 300ms，避免每次按键都发请求）
  const [debouncedSearch, setDebouncedSearch] = useState("");
  // 当前选中的分类（"全部" 表示不筛选）
  const [category, setCategory] = useState<string>("全部");
  // 工作流列表
  const [workflows, setWorkflows] = useState<WorkflowListItem[]>([]);
  // 加载状态（初始即为加载中）
  const [loading, setLoading] = useState(true);
  // 错误信息
  const [error, setError] = useState<string | null>(null);
  // 重拉触发器：递增以触发重新请求（用于"重新加载"按钮）
  const [reloadKey, setReloadKey] = useState(0);

  // 搜索防抖：输入停止 300ms 后才更新 debouncedSearch，避免每次按键都触发请求
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  /**
   * 数据拉取：监听 debouncedSearch / category / reloadKey 变化
   * 注意：为符合 React 19 的 react-hooks/set-state-in-effect 规则，
   * effect 内不同步调用 setState，所有状态更新均放在异步回调中。
   * loading=true 在事件处理器中先行设置。
   */
  useEffect(() => {
    let cancelled = false;

    // 构造查询参数
    const params = new URLSearchParams();
    if (category && category !== "全部") {
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

    // 取消订阅：避免组件卸载或依赖变化后更新旧状态
    return () => {
      cancelled = true;
    };
  }, [category, debouncedSearch, reloadKey]);

  /** 切换分类（事件处理器中设置 loading） */
  const handleCategoryChange = (cat: string) => {
    setCategory(cat);
    setLoading(true);
  };

  /** 输入搜索词（事件处理器中设置 loading） */
  const handleSearchChange = (value: string) => {
    setSearch(value);
    setLoading(true);
  };

  /** 点击重新加载 */
  const handleReload = () => {
    setReloadKey((k) => k + 1);
    setLoading(true);
  };

  return (
    <main className="flex-1 bg-neutral-50">
      {/* 顶部区域：标题 + 搜索 + 分类筛选 */}
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">
            工作台
          </h1>
          <p className="mt-2 text-sm text-neutral-600">
            浏览并使用平台提供的全部 AI 工作流
          </p>

          {/* 搜索框 */}
          <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1 sm:max-w-md">
              <svg
                className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400"
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
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="搜索工作流名称..."
                className="w-full rounded-xl border border-neutral-300 bg-white py-2.5 pl-10 pr-4 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-200"
              />
            </div>
          </div>

          {/* 分类筛选标签 */}
          <div className="mt-4 flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => {
              const active = category === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => handleCategoryChange(cat)}
                  className={
                    active
                      ? "rounded-full bg-primary px-4 py-1.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-hover"
                      : "rounded-full border border-neutral-300 bg-white px-4 py-1.5 text-sm font-medium text-neutral-700 transition-colors hover:border-primary hover:text-primary"
                  }
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* 主体：工作流卡片列表 */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        {/* 加载状态：骨架屏 */}
        {loading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div
                key={idx}
                className="animate-pulse rounded-2xl border border-neutral-200 bg-white p-6"
              >
                <div className="mb-4 h-12 w-12 rounded-xl bg-neutral-200" />
                <div className="mb-3 h-5 w-2/3 rounded bg-neutral-200" />
                <div className="mb-2 h-3 w-full rounded bg-neutral-100" />
                <div className="mb-5 h-3 w-5/6 rounded bg-neutral-100" />
                <div className="flex gap-3">
                  <div className="h-8 w-20 rounded-lg bg-neutral-200" />
                  <div className="h-8 w-16 rounded-lg bg-neutral-100" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          // 错误状态
          <div className="rounded-2xl border border-neutral-200 bg-white p-8 sm:p-12">
            <ErrorMessage
              message={error}
              onRetry={handleReload}
              retryText="重新加载"
            />
          </div>
        ) : workflows.length === 0 ? (
          // 空状态
          <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-16 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100 text-3xl">
              📭
            </div>
            <p className="text-base font-medium text-neutral-900">暂无工作流</p>
            <p className="mt-1 text-sm text-neutral-500">
              请尝试更换关键词或分类筛选条件
            </p>
          </div>
        ) : (
          // 工作流卡片网格
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {workflows.map((workflow) => (
              <article
                key={workflow.id}
                className="group flex flex-col rounded-2xl border border-neutral-200 bg-white p-6 transition-all hover:-translate-y-1 hover:border-primary-200 hover:shadow-xl hover:shadow-primary-600/5"
              >
                {/* 图标 */}
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 text-2xl transition-colors group-hover:bg-primary-100">
                  {workflow.icon || "🤖"}
                </div>

                {/* 名称 */}
                <h3 className="mb-2 text-lg font-semibold text-neutral-900">
                  {workflow.name}
                </h3>

                {/* 描述 */}
                <p className="mb-4 line-clamp-2 flex-1 text-sm leading-6 text-neutral-600">
                  {workflow.description || "暂无描述"}
                </p>

                {/* 分类标签 */}
                <div className="mb-5">
                  <span className="inline-flex items-center rounded-full bg-success-50 px-2.5 py-0.5 text-xs font-medium text-success-700">
                    {workflow.category}
                  </span>
                </div>

                {/* 操作按钮 */}
                <div className="flex items-center gap-3">
                  <Link
                    href={`/workspace/${workflow.id}/use`}
                    className="inline-flex flex-1 items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
                  >
                    使用
                  </Link>
                  <Link
                    href={`/workflow/${workflow.id}`}
                    className="inline-flex items-center justify-center rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition-colors hover:border-primary hover:text-primary"
                  >
                    详情
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

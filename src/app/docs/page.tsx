"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

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
 * 教程文档中心
 *
 * 展示所有工作流的飞书文档链接，按分类分组。
 * 点击卡片在新标签页打开飞书文档。
 *
 * 数据来源：GET /api/workflow/list（公开接口）
 */
export default function DocsPage() {
  const [workflows, setWorkflows] = useState<WorkflowDocItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
  const docsWithoutLink = workflows.filter(
    (w) => !w.feishuDocUrl || w.feishuDocUrl.trim().length === 0,
  );

  // 按分类分组
  const grouped: Record<string, WorkflowDocItem[]> = {};
  for (const w of docsWithLink) {
    if (!grouped[w.category]) grouped[w.category] = [];
    grouped[w.category].push(w);
  }

  return (
    <main className="flex-1 bg-neutral-50">
      {/* 面包屑 */}
      <div className="border-b border-neutral-200 bg-white">
        <nav
          aria-label="面包屑"
          className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8"
        >
          <ol className="flex flex-wrap items-center gap-2 text-sm text-neutral-500">
            <li>
              <Link href="/" className="hover:text-primary">
                首页
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li className="font-medium text-neutral-900" aria-current="page">
              教程文档
            </li>
          </ol>
        </nav>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">
            教程文档中心
          </h1>
          <p className="mt-2 text-sm text-neutral-600">
            查看每个工作流的详细使用教程，点击卡片即可跳转飞书文档
          </p>
        </div>

        {/* 加载中 */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <svg
              className="h-10 w-10 animate-spin text-primary"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        ) : docsWithLink.length === 0 ? (
          /* 无文档 */
          <div className="rounded-2xl border border-neutral-200 bg-white p-12 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-neutral-100">
              <svg
                className="h-7 w-7 text-neutral-400"
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
            <p className="text-sm text-neutral-600">暂无教程文档</p>
            <p className="mt-1 text-xs text-neutral-400">
              管理员可在后台为工作流配置飞书文档链接
            </p>
          </div>
        ) : (
          /* 按分类展示文档卡片 */
          <div className="space-y-8">
            {Object.entries(grouped).map(([category, items]) => (
              <section key={category}>
                <h2 className="mb-4 text-lg font-semibold text-neutral-900">
                  {category}
                </h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {items.map((w) => (
                    <a
                      key={w.id}
                      href={w.feishuDocUrl!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex flex-col rounded-2xl border border-neutral-200 bg-white p-5 transition-all hover:border-primary hover:shadow-md"
                    >
                      <div className="mb-3 flex items-center gap-3">
                        {w.icon ? (
                          <span className="text-2xl">{w.icon}</span>
                        ) : (
                          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 text-primary">
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
                        <h3 className="flex-1 text-sm font-semibold text-neutral-900 group-hover:text-primary">
                          {w.name}
                        </h3>
                        <svg
                          className="h-4 w-4 flex-shrink-0 text-neutral-400 transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
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
                        <p className="line-clamp-2 text-xs text-neutral-500">
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

        {/* 暂无文档链接的工作流（仅在有文档时才显示） */}
        {docsWithoutLink.length > 0 && docsWithLink.length > 0 && (
          <div className="mt-12">
            <h2 className="mb-4 text-sm font-medium text-neutral-500">
              待补充文档
            </h2>
            <div className="flex flex-wrap gap-2">
              {docsWithoutLink.map((w) => (
                <span
                  key={w.id}
                  className="rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs text-neutral-400"
                >
                  {w.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

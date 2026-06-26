"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

// 历史记录项（对应 /api/history 返回的 items 元素）
interface HistoryItem {
  id: string;
  workflowId: string;
  taskId: string | null;
  status: string;
  tokensUsed: number;
  // Phase 2.8：积分消耗与来源
  creditsCost: number;
  source: string; // direct | api
  inputUrl: string | null;
  outputUrl: string | null;
  // Phase 2.8：缩略图（用于列表预览）
  thumbnail: string | null;
  errorMessage: string | null;
  createdAt: string;
  completedAt: string | null;
  workflow: {
    id: string;
    name: string;
    icon: string;
    category: string;
    // Phase 2.8：输出类型，用于渲染结果预览
    outputType: string;
    coverImage: string | null;
  } | null;
}

interface HistoryData {
  items: HistoryItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// 状态标签配置
const statusConfig: Record<
  string,
  { label: string; bg: string; text: string }
> = {
  pending: { label: "等待中", bg: "bg-neutral-100", text: "text-neutral-600" },
  running: { label: "运行中", bg: "bg-primary-100", text: "text-primary-700" },
  completed: { label: "已完成", bg: "bg-success-100", text: "text-success-700" },
  failed: { label: "失败", bg: "bg-red-100", text: "text-red-600" },
};

// 筛选选项
const filterOptions = [
  { value: "", label: "全部" },
  { value: "completed", label: "已完成" },
  { value: "running", label: "运行中" },
  { value: "failed", label: "失败" },
];

// 格式化日期时间
function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function HistoryPage() {
  const { token, loading, user } = useAuth();
  const router = useRouter();

  const [data, setData] = useState<HistoryData | null>(null);
  const [listLoading, setListLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  // 选中的详情记录（弹窗展示）
  const [detail, setDetail] = useState<HistoryItem | null>(null);

  /**
   * 获取历史记录
   */
  const fetchHistory = useCallback(
    async (targetPage: number, status: string) => {
      if (!token) return;
      setListLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({ page: String(targetPage) });
        if (status) params.set("status", status);
        const res = await fetch(`/api/history?${params}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          throw new Error("获取历史记录失败");
        }
        const result = (await res.json()) as HistoryData;
        setData(result);
        setPage(targetPage);
      } catch (e) {
        setError(e instanceof Error ? e.message : "获取历史记录失败");
      } finally {
        setListLoading(false);
      }
    },
    [token],
  );

  useEffect(() => {
    if (token) {
      fetchHistory(1, statusFilter);
    }
  }, [token, fetchHistory, statusFilter]);

  /**
   * 切换筛选
   */
  const handleFilterChange = (status: string) => {
    setStatusFilter(status);
  };

  // 加载中
  if (loading) {
    return (
      <main className="flex flex-1 items-center justify-center bg-neutral-50">
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
      </main>
    );
  }

  // 未登录
  if (!user) {
    return (
      <main className="flex flex-1 items-center justify-center bg-neutral-50 px-4">
        <div className="text-center">
          <h2 className="mb-2 text-xl font-semibold text-neutral-900">
            请先登录
          </h2>
          <p className="mb-6 text-sm text-neutral-500">登录后查看任务历史</p>
          <Link
            href="/login"
            className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-primary-600/25 transition-all hover:bg-primary-hover"
          >
            前往登录
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 bg-neutral-50">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {/* 面包屑 + 标题 */}
        <div className="mb-6">
          <nav className="mb-2 text-xs text-neutral-400">
            <Link href="/dashboard" className="hover:text-primary">
              个人中心
            </Link>
            <span className="mx-1">/</span>
            <span className="text-neutral-600">任务历史</span>
          </nav>
          <h1 className="text-2xl font-bold text-neutral-900">任务历史</h1>
          <p className="mt-1 text-sm text-neutral-500">
            {data ? `共 ${data.total} 条记录` : "查看你的任务执行历史"}
          </p>
        </div>

        {/* 筛选标签 */}
        <div className="mb-6 flex flex-wrap gap-2">
          {filterOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleFilterChange(opt.value)}
              className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
                statusFilter === opt.value
                  ? "bg-primary text-white"
                  : "border border-neutral-300 bg-white text-neutral-600 hover:bg-neutral-50"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4">
            <p className="flex-1 text-sm text-red-700">{error}</p>
            <button
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-600"
            >
              ✕
            </button>
          </div>
        )}

        {/* 历史记录列表 */}
        <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm">
          {listLoading ? (
            <div className="flex items-center justify-center py-16">
              <svg
                className="h-8 w-8 animate-spin text-primary"
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
          ) : data && data.items.length > 0 ? (
            <div className="divide-y divide-neutral-100">
              {data.items.map((item) => {
                const status =
                  statusConfig[item.status] || statusConfig.pending;
                const hasOutput = item.outputUrl && item.status === "completed";
                // Phase 2.8：缩略图优先级 thumbnail > outputUrl > workflow.coverImage
                const previewUrl =
                  item.thumbnail ||
                  (hasOutput ? item.outputUrl : null) ||
                  item.workflow?.coverImage ||
                  null;
                // Phase 2.8：来源徽章
                const isApiCall = item.source === "api";
                return (
                  <div
                    key={item.id}
                    className="flex items-start gap-4 px-4 py-4 transition-colors hover:bg-neutral-50 sm:px-6"
                  >
                    {/* 缩略图 / 占位 */}
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-neutral-100">
                      {previewUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={previewUrl}
                          alt="缩略图"
                          className="h-12 w-12 rounded-lg object-cover"
                        />
                      ) : (
                        <svg
                          className="h-6 w-6 text-neutral-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                          />
                        </svg>
                      )}
                    </div>

                    {/* 内容区 */}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium text-neutral-900">
                          {item.workflow?.name ?? "未知工作流"}
                        </span>
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${status.bg} ${status.text}`}
                        >
                          {status.label}
                        </span>
                        {isApiCall && (
                          <span className="inline-flex items-center rounded-full bg-purple-50 px-2 py-0.5 text-xs font-medium text-purple-700">
                            API
                          </span>
                        )}
                      </div>
                      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-neutral-400">
                        <span>{formatDate(item.createdAt)}</span>
                        {item.creditsCost > 0 && (
                          <span>消耗 {item.creditsCost} 积分</span>
                        )}
                        {item.tokensUsed > 0 && (
                          <span>{item.tokensUsed} tokens</span>
                        )}
                        {item.completedAt && (
                          <span>完成于 {formatDate(item.completedAt)}</span>
                        )}
                      </div>
                      {item.status === "failed" && item.errorMessage && (
                        <p className="mt-1 truncate text-xs text-red-500">
                          {item.errorMessage}
                        </p>
                      )}
                    </div>

                    {/* 操作按钮 */}
                    <div className="flex flex-shrink-0 gap-2">
                      <button
                        onClick={() => setDetail(item)}
                        className="rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs font-medium text-neutral-600 transition-colors hover:bg-neutral-50"
                      >
                        详情
                      </button>
                      {hasOutput && (
                        <a
                          href={item.outputUrl!}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-primary-hover"
                        >
                          下载
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            // 空状态
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100">
                <svg
                  className="h-6 w-6 text-neutral-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </div>
              <p className="text-sm text-neutral-500">暂无任务记录</p>
              <Link
                href="/workspace"
                className="mt-4 text-sm font-medium text-primary hover:text-primary-hover"
              >
                去使用工作流 →
              </Link>
            </div>
          )}
        </div>

        {/* 分页 */}
        {data && data.totalPages > 1 && (
          <div className="mt-6 flex items-center justify-center gap-2">
            <button
              onClick={() => fetchHistory(page - 1, statusFilter)}
              disabled={page <= 1 || listLoading}
              className="rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-50 disabled:opacity-50"
            >
              上一页
            </button>
            <span className="text-sm text-neutral-500">
              {page} / {data.totalPages}
            </span>
            <button
              onClick={() => fetchHistory(page + 1, statusFilter)}
              disabled={page >= data.totalPages || listLoading}
              className="rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-50 disabled:opacity-50"
            >
              下一页
            </button>
          </div>
        )}
      </div>

      {/* 详情弹窗 */}
      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h3 className="text-base font-semibold text-neutral-900">
                  任务详情
                </h3>
                <p className="mt-0.5 text-sm text-neutral-500">
                  {detail.workflow?.name ?? "未知工作流"}
                </p>
              </div>
              <button
                onClick={() => setDetail(null)}
                className="text-neutral-400 hover:text-neutral-600"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Phase 2.8：按 outputType 渲染结果预览 */}
            {detail.outputUrl && detail.status === "completed" ? (
              detail.workflow?.outputType === "image" ? (
                <div className="mb-4 overflow-hidden rounded-xl bg-neutral-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={detail.outputUrl}
                    alt="生成结果"
                    className="mx-auto max-h-[400px] w-full object-contain"
                  />
                </div>
              ) : detail.workflow?.outputType === "text" ? (
                <div className="mb-4 max-h-[300px] overflow-auto rounded-xl bg-neutral-50 p-4">
                  <pre className="whitespace-pre-wrap break-all font-mono text-xs text-neutral-800">
                    {detail.outputUrl}
                  </pre>
                  <button
                    onClick={() => {
                      navigator.clipboard
                        ?.writeText(detail.outputUrl || "")
                        .catch(() => {});
                    }}
                    className="mt-3 rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-50"
                  >
                    复制内容
                  </button>
                </div>
              ) : (
                <div className="mb-4 overflow-hidden rounded-xl bg-neutral-100">
                  <video
                    src={detail.outputUrl}
                    controls
                    className="w-full"
                    style={{ maxHeight: "400px" }}
                  />
                </div>
              )
            ) : detail.status === "failed" ? (
              <div className="mb-4 rounded-xl bg-red-50 p-4">
                <p className="text-sm text-red-700">
                  {detail.errorMessage || "任务执行失败"}
                </p>
              </div>
            ) : (
              <div className="mb-4 rounded-xl bg-neutral-50 p-4 text-center">
                <p className="text-sm text-neutral-500">
                  任务{statusConfig[detail.status]?.label ?? "进行中"}
                </p>
              </div>
            )}

            {/* 详细信息 */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-neutral-500">任务 ID</span>
                <p className="mt-0.5 break-all font-mono text-xs text-neutral-900">
                  {detail.id}
                </p>
              </div>
              <div>
                <span className="text-neutral-500">Coze Task ID</span>
                <p className="mt-0.5 break-all font-mono text-xs text-neutral-900">
                  {detail.taskId ?? "-"}
                </p>
              </div>
              <div>
                <span className="text-neutral-500">创建时间</span>
                <p className="mt-0.5 text-neutral-900">
                  {formatDate(detail.createdAt)}
                </p>
              </div>
              <div>
                <span className="text-neutral-500">完成时间</span>
                <p className="mt-0.5 text-neutral-900">
                  {detail.completedAt ? formatDate(detail.completedAt) : "-"}
                </p>
              </div>
              <div>
                <span className="text-neutral-500">积分消耗</span>
                <p className="mt-0.5 text-neutral-900">
                  {detail.creditsCost > 0 ? `${detail.creditsCost}` : "-"}
                </p>
              </div>
              <div>
                <span className="text-neutral-500">Token 消耗</span>
                <p className="mt-0.5 text-neutral-900">
                  {detail.tokensUsed > 0 ? `${detail.tokensUsed}` : "-"}
                </p>
              </div>
              <div>
                <span className="text-neutral-500">调用来源</span>
                <p className="mt-0.5 text-neutral-900">
                  {detail.source === "api" ? "API 调用" : "页面直调"}
                </p>
              </div>
              <div>
                <span className="text-neutral-500">工作流分类</span>
                <p className="mt-0.5 text-neutral-900">
                  {detail.workflow?.category ?? "-"}
                </p>
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="mt-5 flex gap-3">
              {detail.outputUrl && detail.status === "completed" && (
                <a
                  href={detail.outputUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 rounded-xl bg-primary px-4 py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
                >
                  下载结果
                </a>
              )}
              {detail.workflow && (
                <button
                  onClick={() => {
                    router.push(`/workspace/${detail.workflow!.id}/use`);
                    setDetail(null);
                  }}
                  className="flex-1 rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-center text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
                >
                  再次使用
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

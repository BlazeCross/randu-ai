"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

/**
 * Key 列表项（对应 /api/admin/keys 返回）
 */
interface KeyListItem {
  id: string;
  keyPrefix: string;
  name: string;
  status: string;
  creditsUsed: number;
  totalCalls: number;
  lastUsedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  qpsLimit: number;
  dailyLimit: number;
  dailyUsed: number;
  webhookUrl: string | null;
  user: {
    id: string;
    nickname: string | null;
    email: string | null;
    phone: string | null;
  };
}

interface ListResponse {
  keys: KeyListItem[];
  total: number;
  page: number;
  pageSize: number;
}

// 状态徽章样式
const STATUS_BADGES: Record<
  string,
  { label: string; bg: string; text: string }
> = {
  active: { label: "正常", bg: "bg-success-50", text: "text-success-700" },
  inactive: { label: "已停用", bg: "bg-neutral-100", text: "text-neutral-700" },
  revoked: { label: "已吊销", bg: "bg-red-50", text: "text-red-700" },
};

// 自动刷新间隔（毫秒）
const AUTO_REFRESH_INTERVAL = 60000;

/**
 * 格式化日期（上海时区）
 */
function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Shanghai",
  });
}

/**
 * 后台 Key 总览页
 *
 * 功能：
 * - 搜索（Key 名称 / 前缀 / 用户邮箱 / 手机号 / 昵称 模糊匹配）
 * - 状态筛选（全部 / 正常 / 已停用 / 已吊销）
 * - 表格展示：Key 前缀、名称、状态、所属用户、累计消耗、调用次数、最后使用、过期时间、创建时间
 * - 分页
 * - 60 秒自动刷新 + 手动刷新按钮
 */
export default function AdminKeysPage() {
  const { token } = useAuth();

  // 列表数据
  const [keys, setKeys] = useState<KeyListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 筛选条件
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  /**
   * 拉取 Key 列表
   */
  const fetchKeys = useCallback(
    async (targetPage = 1) => {
      if (!token) return;
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          page: String(targetPage),
          pageSize: String(pageSize),
        });
        if (search.trim()) params.set("search", search.trim());
        if (statusFilter) params.set("status", statusFilter);

        const res = await fetch(`/api/admin/keys?${params.toString()}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          const msg = await res.json().catch(() => ({}));
          throw new Error(msg.message || `请求失败 (${res.status})`);
        }
        const data = (await res.json()) as ListResponse;
        setKeys(data.keys);
        setTotal(data.total);
        setPage(data.page);
      } catch (err) {
        setError(err instanceof Error ? err.message : "获取列表失败");
      } finally {
        setLoading(false);
      }
    },
    [token, pageSize, search, statusFilter],
  );

  // 初始加载 + 筛选条件变化时重新拉取（重置到第 1 页）
  useEffect(() => {
    fetchKeys(1);
  }, [fetchKeys]);

  // 60 秒自动刷新
  const latestFetch = useRef(fetchKeys);
  const latestPage = useRef(page);
  useEffect(() => {
    latestFetch.current = fetchKeys;
  }, [fetchKeys]);
  useEffect(() => {
    latestPage.current = page;
  }, [page]);
  useEffect(() => {
    const interval = setInterval(() => {
      latestFetch.current(latestPage.current);
    }, AUTO_REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchKeys(1);
  };

  const totalPages = Math.ceil(total / pageSize) || 1;

  return (
    <div className="space-y-5">
      {/* 面包屑 */}
      <nav className="flex items-center gap-1.5 text-sm text-neutral-500">
        <Link href="/admin" className="hover:text-neutral-900">
          后台首页
        </Link>
        <span className="text-neutral-300">/</span>
        <span className="font-medium text-neutral-900">Key 总览</span>
      </nav>

      {/* 顶部工具栏：搜索 + 筛选 + 刷新 */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <form
          onSubmit={handleSearchSubmit}
          className="flex flex-1 flex-wrap items-center gap-2"
        >
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索 Key 名称 / 前缀 / 用户..."
            className="w-full max-w-xs rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">全部状态</option>
            <option value="active">正常</option>
            <option value="inactive">已停用</option>
            <option value="revoked">已吊销</option>
          </select>
          <button
            type="submit"
            className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50"
          >
            搜索
          </button>
        </form>
        <button
          onClick={() => fetchKeys(page)}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-50 disabled:opacity-50"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          刷新
        </button>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* 列表表格 */}
      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white p-6">
        {loading ? (
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
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>
        ) : keys.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-sm text-neutral-500">暂无 API Key</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-neutral-200 text-xs uppercase text-neutral-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Key 前缀</th>
                  <th className="px-4 py-3 font-medium">名称</th>
                  <th className="px-4 py-3 font-medium">状态</th>
                  <th className="px-4 py-3 font-medium">所属用户</th>
                  <th className="px-4 py-3 font-medium">累计消耗</th>
                  <th className="px-4 py-3 font-medium">调用次数</th>
                  <th className="px-4 py-3 font-medium">频率限制</th>
                  <th className="px-4 py-3 font-medium">最后使用</th>
                  <th className="px-4 py-3 font-medium">过期时间</th>
                  <th className="px-4 py-3 font-medium">创建时间</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {keys.map((k) => {
                  const statusBadge =
                    STATUS_BADGES[k.status] || {
                      label: k.status,
                      bg: "bg-neutral-100",
                      text: "text-neutral-700",
                    };
                  const isExpired =
                    k.expiresAt !== null && new Date(k.expiresAt) <= new Date();
                  return (
                    <tr key={k.id} className="hover:bg-neutral-50">
                      <td className="px-4 py-3">
                        <code className="rounded bg-neutral-100 px-1.5 py-0.5 text-xs text-neutral-700">
                          {k.keyPrefix}…
                        </code>
                      </td>
                      <td className="px-4 py-3 font-medium text-neutral-900">
                        {k.name}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusBadge.bg} ${statusBadge.text}`}
                        >
                          {statusBadge.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/users/${k.user.id}`}
                          className="text-primary hover:text-primary-hover"
                        >
                          {k.user.nickname || k.user.email || k.user.phone || "未知用户"}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-neutral-600">
                        {k.creditsUsed}
                      </td>
                      <td className="px-4 py-3 text-neutral-600">
                        {k.totalCalls}
                      </td>
                      <td className="px-4 py-3 text-xs text-neutral-500">
                        <div>
                          {k.qpsLimit > 0 ? `${k.qpsLimit} QPS` : "不限QPS"}
                        </div>
                        <div>
                          {k.dailyLimit > 0
                            ? `${k.dailyUsed}/${k.dailyLimit}/日`
                            : "不限日调"}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-neutral-500">
                        {formatDate(k.lastUsedAt)}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {k.expiresAt ? (
                          <span
                            className={
                              isExpired
                                ? "font-medium text-red-600"
                                : "text-neutral-500"
                            }
                          >
                            {formatDate(k.expiresAt)}
                            {isExpired && " (已过期)"}
                          </span>
                        ) : (
                          <span className="text-neutral-400">永不过期</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-neutral-500">
                        {formatDate(k.createdAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 分页 */}
      {total > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-neutral-500">
            共 {total} 条，第 {page}/{totalPages} 页
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchKeys(page - 1)}
              disabled={page <= 1 || loading}
              className="rounded-lg border border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-50 disabled:opacity-50"
            >
              上一页
            </button>
            <button
              onClick={() => fetchKeys(page + 1)}
              disabled={page >= totalPages || loading}
              className="rounded-lg border border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-50 disabled:opacity-50"
            >
              下一页
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

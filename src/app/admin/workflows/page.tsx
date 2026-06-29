"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

/**
 * 工作流列表项（对应 /api/admin/workflows 返回）
 */
interface WorkflowItem {
  id: string;
  name: string;
  description: string | null;
  category: string;
  cozeWorkflowId: string;
  coverImage: string | null;
  outputType: string;
  creditsRequired: number;
  source: string;
  volcModel: string | null;
  status: string;
  isDeleted: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  _count: { usageLogs: number };
}

interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

// 状态标签样式
const STATUS_STYLES: Record<string, { label: string; bg: string; text: string }> = {
  active: { label: "上架中", bg: "bg-success-100", text: "text-success-700" },
  inactive: { label: "已下架", bg: "bg-muted", text: "text-muted-foreground" },
};

// 来源标签
const SOURCE_LABELS: Record<string, string> = {
  coze: "Coze",
  volcengine: "火山方舟",
};

// 输出类型标签
const OUTPUT_TYPE_LABELS: Record<string, string> = {
  text: "文本",
  image: "图片",
  video: "视频",
};

/**
 * 格式化日期
 */
function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * 后台工作流管理列表页
 *
 * 功能：
 * - 搜索（名称模糊匹配）
 * - 状态筛选（全部 / 上架 / 下架）
 * - 表格展示：名称、分类、来源、输出类型、消耗、状态、使用次数、创建时间
 * - 操作：编辑、上架/下架切换、删除（软删除）
 * - 分页
 * - 新建工作流按钮
 */
export default function AdminWorkflowsPage() {
  const router = useRouter();
  const { token } = useAuth();

  // 列表数据
  const [workflows, setWorkflows] = useState<WorkflowItem[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 筛选条件
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  // 操作中状态（防止重复点击）
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  /**
   * 拉取工作流列表
   */
  const fetchWorkflows = useCallback(
    async (page = 1) => {
      if (!token) return;
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          page: String(page),
          pageSize: "20",
        });
        if (search.trim()) params.set("search", search.trim());
        if (statusFilter) params.set("status", statusFilter);

        const res = await fetch(
          `/api/admin/workflows?${params.toString()}`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        if (!res.ok) {
          const msg = await res.json().catch(() => ({}));
          throw new Error(msg.message || `请求失败 (${res.status})`);
        }
        const data = (await res.json()) as {
          workflows: WorkflowItem[];
          pagination: Pagination;
        };
        setWorkflows(data.workflows);
        setPagination(data.pagination);
      } catch (err) {
        setError(err instanceof Error ? err.message : "获取列表失败");
      } finally {
        setLoading(false);
      }
    },
    [token, search, statusFilter],
  );

  // 初始加载 + 筛选条件变化时重新拉取
  useEffect(() => {
    fetchWorkflows(1);
  }, [fetchWorkflows]);

  /**
   * 切换上架/下架状态
   */
  const handleToggleStatus = async (workflow: WorkflowItem) => {
    if (!token) return;
    const newStatus = workflow.status === "active" ? "inactive" : "active";
    setActionLoading(workflow.id);
    try {
      const res = await fetch(`/api/admin/workflows/${workflow.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const msg = await res.json().catch(() => ({}));
        throw new Error(msg.message || "操作失败");
      }
      // 局部更新
      setWorkflows((prev) =>
        prev.map((w) => (w.id === workflow.id ? { ...w, status: newStatus } : w)),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "操作失败");
    } finally {
      setActionLoading(null);
    }
  };

  /**
   * 删除工作流（软删除）
   */
  const handleDelete = async (workflow: WorkflowItem) => {
    if (!token) return;
    // 二次确认
    if (
      !window.confirm(
        `确定要删除工作流「${workflow.name}」吗？\n\n这是软删除，工作流将不再展示，但历史记录会保留。`,
      )
    ) {
      return;
    }
    setActionLoading(workflow.id);
    try {
      const res = await fetch(`/api/admin/workflows/${workflow.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const msg = await res.json().catch(() => ({}));
        throw new Error(msg.message || "删除失败");
      }
      // 从列表移除
      setWorkflows((prev) => prev.filter((w) => w.id !== workflow.id));
      setPagination((prev) => ({
        ...prev,
        total: prev.total - 1,
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "删除失败");
    } finally {
      setActionLoading(null);
    }
  };

  /**
   * 搜索提交
   */
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchWorkflows(1);
  };

  return (
    <div className="space-y-5">
      {/* 顶部工具栏：搜索 + 筛选 + 新建按钮 */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <form onSubmit={handleSearchSubmit} className="flex flex-1 items-center gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索工作流名称..."
            className="w-full max-w-xs rounded-[var(--radius-sm)] border border-border px-3 py-2 text-sm focus:border-primary/50 focus:shadow-[var(--glow-primary)] focus:outline-none transition-all duration-200"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-[var(--radius-sm)] border border-border px-3 py-2 text-sm focus:border-primary/50 focus:shadow-[var(--glow-primary)] focus:outline-none transition-all duration-200"
          >
            <option value="">全部状态</option>
            <option value="active">上架中</option>
            <option value="inactive">已下架</option>
          </select>
          <button
            type="submit"
            className="rounded-[var(--radius-sm)] border border-border bg-card px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted"
          >
            搜索
          </button>
        </form>
        <button
          onClick={() => router.push("/admin/workflows/new")}
          className="inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] bg-gradient-to-r from-primary to-primary-500 px-4 py-2 text-sm font-semibold text-white shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] transition-colors"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          新建工作流
        </button>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="rounded-[var(--radius-sm)] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* 列表表格 */}
      <div className="overflow-hidden rounded-[var(--radius-sm)] border border-border bg-card shadow-[var(--shadow-xs)]">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <svg className="h-8 w-8 animate-spin text-primary" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
        ) : workflows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-sm text-muted-foreground">暂无工作流</p>
            <Link
              href="/admin/workflows/new"
              className="mt-3 text-sm font-medium text-primary hover:text-primary-hover"
            >
              新建第一个工作流 →
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-border bg-muted/50 text-xs uppercase tracking-wider font-medium text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">名称</th>
                  <th className="px-4 py-3 font-medium">分类</th>
                  <th className="px-4 py-3 font-medium">来源</th>
                  <th className="px-4 py-3 font-medium">输出</th>
                  <th className="px-4 py-3 font-medium">消耗</th>
                  <th className="px-4 py-3 font-medium">状态</th>
                  <th className="px-4 py-3 font-medium">使用次数</th>
                  <th className="px-4 py-3 font-medium">创建时间</th>
                  <th className="px-4 py-3 text-right font-medium">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {workflows.map((w) => {
                  const statusStyle = STATUS_STYLES[w.status] || STATUS_STYLES.inactive;
                  return (
                    <tr key={w.id} className="hover:bg-muted/30 transition-colors duration-100">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {w.coverImage ? (
                            <Image
                              src={w.coverImage}
                              alt={w.name}
                              width={32}
                              height={32}
                              className="h-8 w-8 flex-shrink-0 rounded object-cover"
                            />
                          ) : (
                            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded bg-muted text-xs text-muted-foreground">
                              {w.name[0] || "?"}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="truncate font-medium text-foreground">{w.name}</p>
                            {w.description && (
                              <p className="truncate text-xs text-muted-foreground">{w.description}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{w.category}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {SOURCE_LABELS[w.source] || w.source}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {OUTPUT_TYPE_LABELS[w.outputType] || w.outputType}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{w.creditsRequired}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}>
                          {statusStyle.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{w._count.usageLogs}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {formatDate(w.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => router.push(`/admin/workflows/${w.id}/edit`)}
                            disabled={actionLoading === w.id}
                            className="text-xs font-medium text-primary hover:text-primary-hover disabled:opacity-50"
                          >
                            编辑
                          </button>
                          <button
                            onClick={() => handleToggleStatus(w)}
                            disabled={actionLoading === w.id}
                            className="text-xs font-medium text-muted-foreground hover:text-foreground disabled:opacity-50"
                          >
                            {w.status === "active" ? "下架" : "上架"}
                          </button>
                          <button
                            onClick={() => handleDelete(w)}
                            disabled={actionLoading === w.id}
                            className="text-xs font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
                          >
                            删除
                          </button>
                        </div>
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
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            共 {pagination.total} 条，第 {pagination.page}/{pagination.totalPages} 页
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchWorkflows(pagination.page - 1)}
              disabled={pagination.page <= 1 || loading}
              className="rounded-[var(--radius-sm)] border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted disabled:opacity-50"
            >
              上一页
            </button>
            <button
              onClick={() => fetchWorkflows(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages || loading}
              className="rounded-[var(--radius-sm)] border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted disabled:opacity-50"
            >
              下一页
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

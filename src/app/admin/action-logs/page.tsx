"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

/**
 * 操作日志列表项（对应 /api/admin/action-logs 返回）
 */
interface ActionLogItem {
  id: string;
  operatorId: string;
  targetUserId: string | null;
  action: string;
  detail: unknown;
  ipAddress: string | null;
  createdAt: string;
  operator: {
    id: string;
    nickname: string | null;
    email: string | null;
    phone: string | null;
  } | null;
  targetUser: {
    id: string;
    nickname: string | null;
    email: string | null;
    phone: string | null;
  } | null;
}

interface ListResponse {
  logs: ActionLogItem[];
  total: number;
  page: number;
  pageSize: number;
}

// action 类型徽章样式
const ACTION_BADGES: Record<
  string,
  { label: string; bg: string; text: string }
> = {
  block: { label: "拉黑", bg: "bg-red-50", text: "text-red-700" },
  unblock: { label: "解封", bg: "bg-success-50", text: "text-success-700" },
  update_credits: {
    label: "修改积分",
    bg: "bg-amber-50",
    text: "text-amber-700",
  },
  update_plan: {
    label: "修改套餐",
    bg: "bg-primary-50",
    text: "text-primary-700",
  },
  set_role: {
    label: "设置角色",
    bg: "bg-purple-50",
    text: "text-purple-700",
  },
};

const ACTION_FILTERS: { value: string; label: string }[] = [
  { value: "block", label: "拉黑" },
  { value: "unblock", label: "解封" },
  { value: "update_credits", label: "修改积分" },
  { value: "update_plan", label: "修改套餐" },
  { value: "set_role", label: "设置角色" },
];

/**
 * 格式化日期（上海时区）
 */
function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZone: "Asia/Shanghai",
  });
}

/**
 * 取用户显示名
 */
function getDisplayName(
  u: ActionLogItem["operator"] | ActionLogItem["targetUser"] | null,
): string {
  if (!u) return "—";
  return u.nickname || u.email || u.phone || "未命名";
}

/**
 * 把 detail 渲染为可读字符串
 *
 * - null → —
 * - 对象 → key: value 拼接
 * - 其它 → JSON 字符串
 */
function formatDetail(detail: unknown): string {
  if (detail === null || detail === undefined) return "—";
  if (typeof detail === "object") {
    try {
      const entries = Object.entries(detail as Record<string, unknown>);
      if (entries.length === 0) return "—";
      // 中文 key 映射
      const keyLabel: Record<string, string> = {
        reason: "原因",
        oldCredits: "原积分",
        newCredits: "新积分",
        isSubscribed: "已订阅",
        subscriptionPlan: "套餐",
        oldRole: "原角色",
        newRole: "新角色",
      };
      const valueLabel: Record<string, string> = {
        user: "普通用户",
        admin: "管理员",
        super_admin: "超级管理员",
        true: "是",
        false: "否",
        null: "空",
      };
      return entries
        .map(([k, v]) => {
          const label = keyLabel[k] ?? k;
          const val =
            typeof v === "string"
              ? (valueLabel[v] ?? v)
              : v === null
                ? "空"
                : String(v);
          return `${label}: ${val}`;
        })
        .join("，");
    } catch {
      return JSON.stringify(detail);
    }
  }
  return String(detail);
}

/**
 * 后台操作日志查看页
 *
 * 功能：
 * - action 类型筛选（全部 / 拉黑 / 解封 / 修改积分 / 修改套餐 / 设置角色）
 * - 表格展示：操作者、目标用户、操作类型（徽章）、详情、IP 地址、时间
 * - 分页
 * - 手动刷新
 * - 支持 URL 参数 action / operatorId / targetUserId（用于从用户详情页跳转）
 *
 * 仅 super_admin 可访问（侧边栏与 API 均已限制）
 */
export default function AdminActionLogsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token, user: currentUser } = useAuth();

  // 来自 URL 的初始筛选
  const initialAction = searchParams.get("action") ?? "";
  const initialOperatorId = searchParams.get("operatorId") ?? "";
  const initialTargetUserId = searchParams.get("targetUserId") ?? "";

  // 列表数据
  const [logs, setLogs] = useState<ActionLogItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 筛选条件（action 暴露给用户，operatorId/targetUserId 仅从 URL 透传）
  const [actionFilter, setActionFilter] = useState(initialAction);
  // 固定筛选（来自 URL，不暴露输入框，仅展示"清除筛选"按钮）
  const [fixedOperatorId] = useState(initialOperatorId);
  const [fixedTargetUserId] = useState(initialTargetUserId);

  // 当前用户是否为 super_admin（侧边栏已限制，这里仅用于双重保险）
  const isSuperAdmin = currentUser?.role === "super_admin";

  /**
   * 拉取操作日志列表
   */
  const fetchLogs = useCallback(
    async (targetPage = 1) => {
      if (!token) return;
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          page: String(targetPage),
          pageSize: String(pageSize),
        });
        if (actionFilter) params.set("action", actionFilter);
        if (fixedOperatorId) params.set("operatorId", fixedOperatorId);
        if (fixedTargetUserId) params.set("targetUserId", fixedTargetUserId);

        const res = await fetch(`/api/admin/action-logs?${params.toString()}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          const msg = await res.json().catch(() => ({}));
          throw new Error(msg.message || `请求失败 (${res.status})`);
        }
        const data = (await res.json()) as ListResponse;
        setLogs(data.logs);
        setTotal(data.total);
        setPage(data.page);
      } catch (err) {
        setError(err instanceof Error ? err.message : "获取列表失败");
      } finally {
        setLoading(false);
      }
    },
    [token, pageSize, actionFilter, fixedOperatorId, fixedTargetUserId],
  );

  // 初始加载 + 筛选条件变化时重新拉取（重置到第 1 页）
  useEffect(() => {
    fetchLogs(1);
  }, [fetchLogs]);

  const totalPages = Math.ceil(total / pageSize) || 1;

  /**
   * 清除固定筛选（operatorId/targetUserId），跳回无筛选状态
   */
  const handleClearFixedFilter = () => {
    // 移除 URL 中的 operatorId/targetUserId 参数
    const params = new URLSearchParams(searchParams.toString());
    params.delete("operatorId");
    params.delete("targetUserId");
    router.replace(`/admin/action-logs?${params.toString()}`);
    // 刷新页面（state 也会重置）
    window.location.reload();
  };

  // 双重保险：非 super_admin 不渲染
  if (!isSuperAdmin) {
    return (
      <div className="rounded-[var(--radius)] border border-border bg-card p-12 text-center">
        <p className="text-sm text-muted-foreground">权限不足，仅超级管理员可查看操作日志</p>
        <Link
          href="/admin"
          className="mt-4 inline-flex items-center rounded-[var(--radius-sm)] bg-gradient-to-r from-primary to-primary-500 px-4 py-2 text-sm font-medium text-white shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)]"
        >
          返回后台首页
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* 面包屑 */}
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/admin" className="hover:text-foreground">
          后台首页
        </Link>
        <span className="text-muted-foreground">/</span>
        <span className="font-medium text-foreground">操作日志</span>
      </nav>

      {/* 顶部工具栏：筛选 + 刷新 */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="rounded-[var(--radius-sm)] border border-border px-3 py-2 text-sm focus:border-primary/50 focus:shadow-[var(--glow-primary)] focus:outline-none transition-all duration-200"
          >
            <option value="">全部操作</option>
            {ACTION_FILTERS.map((a) => (
              <option key={a.value} value={a.value}>
                {a.label}
              </option>
            ))}
          </select>

          {/* 固定筛选提示（来自 URL） */}
          {(fixedOperatorId || fixedTargetUserId) && (
            <div className="flex items-center gap-2 rounded-[var(--radius-sm)] bg-amber-50 px-3 py-1.5 text-xs text-amber-700">
              <span>
                已固定筛选：
                {fixedOperatorId && `操作者=${fixedOperatorId.slice(0, 8)}…`}
                {fixedOperatorId && fixedTargetUserId && " / "}
                {fixedTargetUserId && `目标用户=${fixedTargetUserId.slice(0, 8)}…`}
              </span>
              <button
                onClick={handleClearFixedFilter}
                className="font-medium text-amber-800 underline-offset-2 hover:underline"
              >
                清除
              </button>
            </div>
          )}
        </div>
        <button
          onClick={() => fetchLogs(page)}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] border border-border bg-card px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted disabled:opacity-50"
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

      {/* 说明 */}
      <div className="rounded-[var(--radius-sm)] border border-border bg-background px-4 py-2.5 text-xs text-muted-foreground">
        操作日志记录超级管理员对用户的所有敏感操作（拉黑 / 解封 / 修改积分 / 修改套餐 / 设置角色），不可篡改，仅可查看。
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="rounded-[var(--radius-sm)] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* 列表表格 */}
      <div className="overflow-hidden rounded-[var(--radius)] border border-border bg-card p-6 shadow-[var(--shadow-xs)]">
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
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-sm text-muted-foreground">暂无操作日志</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-muted/50 text-xs uppercase tracking-wider font-medium text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">操作者</th>
                  <th className="px-4 py-3 font-medium">目标用户</th>
                  <th className="px-4 py-3 font-medium">操作类型</th>
                  <th className="px-4 py-3 font-medium">详情</th>
                  <th className="px-4 py-3 font-medium">IP 地址</th>
                  <th className="px-4 py-3 font-medium">时间</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {logs.map((log) => {
                  const badge =
                    ACTION_BADGES[log.action] || {
                      label: log.action,
                      bg: "bg-muted",
                      text: "text-foreground",
                    };
                  return (
                    <tr key={log.id} className="hover:bg-muted/30 transition-colors duration-100">
                      <td className="px-4 py-3">
                        <button
                          onClick={() =>
                            log.operator &&
                            router.push(`/admin/users/${log.operator.id}`)
                          }
                          className="text-left hover:text-primary hover:underline"
                          disabled={!log.operator}
                        >
                          <div className="font-medium text-foreground">
                            {getDisplayName(log.operator)}
                          </div>
                          {log.operator?.email && (
                            <div className="text-xs text-muted-foreground">
                              {log.operator.email}
                            </div>
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        {log.targetUser ? (
                          <button
                            onClick={() =>
                              router.push(`/admin/users/${log.targetUser!.id}`)
                            }
                            className="text-left hover:text-primary hover:underline"
                          >
                            <div className="font-medium text-foreground">
                              {getDisplayName(log.targetUser)}
                            </div>
                            {log.targetUser.email && (
                              <div className="text-xs text-muted-foreground">
                                {log.targetUser.email}
                              </div>
                            )}
                          </button>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${badge.bg} ${badge.text}`}
                        >
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="max-w-xs truncate text-xs text-muted-foreground">
                          {formatDetail(log.detail)}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {log.ipAddress || "—"}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {formatDate(log.createdAt)}
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
          <p className="text-xs text-muted-foreground">
            共 {total} 条，第 {page}/{totalPages} 页
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchLogs(page - 1)}
              disabled={page <= 1 || loading}
              className="rounded-[var(--radius-sm)] border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted disabled:opacity-50"
            >
              上一页
            </button>
            <button
              onClick={() => fetchLogs(page + 1)}
              disabled={page >= totalPages || loading}
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

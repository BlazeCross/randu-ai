"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

/**
 * 用户列表项（对应 /api/admin/users 返回）
 */
interface UserListItem {
  id: string;
  nickname: string | null;
  email: string | null;
  phone: string | null;
  role: string;
  status: string;
  avatar: string | null;
  isSubscribed: boolean;
  subscriptionPlan: string | null;
  credits: number;
  totalUsed: number;
  createdAt: string;
}

interface ListResponse {
  users: UserListItem[];
  total: number;
  page: number;
  pageSize: number;
}

// 角色徽章样式
const ROLE_BADGES: Record<string, { label: string; bg: string; text: string }> = {
  user: { label: "普通用户", bg: "bg-muted", text: "text-foreground" },
  admin: { label: "管理员", bg: "bg-primary-50", text: "text-primary-700" },
  super_admin: {
    label: "超级管理员",
    bg: "bg-purple-50",
    text: "text-purple-700",
  },
};

// 状态徽章样式
const STATUS_BADGES: Record<
  string,
  { label: string; bg: string; text: string }
> = {
  active: { label: "正常", bg: "bg-success-50", text: "text-success-700" },
  blocked: { label: "已拉黑", bg: "bg-red-50", text: "text-red-700" },
};

// 自动刷新间隔（毫秒）
const AUTO_REFRESH_INTERVAL = 60000;

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
    timeZone: "Asia/Shanghai",
  });
}

/**
 * 取头像首字母占位
 */
function getInitial(
  nickname: string | null,
  email: string | null,
  phone: string | null,
): string {
  if (nickname) return nickname[0].toUpperCase();
  if (email) return email[0].toUpperCase();
  if (phone) return phone[0];
  return "U";
}

/**
 * 后台用户管理列表页
 *
 * 功能：
 * - 搜索（nickname/email/phone 模糊匹配）
 * - 角色筛选（全部 / 普通用户 / 管理员 / 超管）
 * - 状态筛选（全部 / 正常 / 已拉黑）
 * - 表格展示：用户、角色、状态、套餐、积分余额、累计使用、注册时间、操作
 * - 分页
 * - 60 秒自动刷新 + 手动刷新按钮
 */
export default function AdminUsersPage() {
  const router = useRouter();
  const { token, user: currentUser } = useAuth();

  // 列表数据
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 当前登录用户是否为 super_admin（决定是否显示快捷拉黑/解封按钮）
  const isSuperAdmin = currentUser?.role === "super_admin";

  // 行内快捷操作的进行中用户 ID（一次仅允许一个）
  const [quickActionUserId, setQuickActionUserId] = useState<string | null>(
    null,
  );

  /**
   * 行内快捷拉黑 / 解封：window.confirm 确认后 PATCH，成功后局部更新 state
   * 仅 super_admin 可触发（按钮仅在 isSuperAdmin 为 true 时渲染）
   */
  async function handleQuickBlock(u: UserListItem) {
    const next: "active" | "blocked" =
      u.status === "active" ? "blocked" : "active";
    const verb = next === "blocked" ? "拉黑" : "解封";
    const nickname = u.nickname || "该用户";
    const confirmed = window.confirm(
      `确定${verb}用户 ${nickname}？此操作将禁止该用户登录与使用平台功能。`,
    );
    if (!confirmed) return;
    if (!token) return;

    setQuickActionUserId(u.id);
    try {
      const res = await fetch(`/api/admin/users/${u.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: next }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        message?: string;
      };
      if (!res.ok) {
        alert(data.message || `${verb}失败 (${res.status})`);
        return;
      }
      // 局部更新列表中该用户的状态（不重新拉取列表）
      setUsers((prev) =>
        prev.map((x) =>
          x.id === u.id ? { ...x, status: next } : x,
        ),
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : `${verb}失败`);
    } finally {
      setQuickActionUserId(null);
    }
  }

  // 筛选条件
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  /**
   * 拉取用户列表
   */
  const fetchUsers = useCallback(
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
        if (roleFilter) params.set("role", roleFilter);
        if (statusFilter) params.set("status", statusFilter);

        const res = await fetch(`/api/admin/users?${params.toString()}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          const msg = await res.json().catch(() => ({}));
          throw new Error(msg.message || `请求失败 (${res.status})`);
        }
        const data = (await res.json()) as ListResponse;
        setUsers(data.users);
        setTotal(data.total);
        setPage(data.page);
      } catch (err) {
        setError(err instanceof Error ? err.message : "获取列表失败");
      } finally {
        setLoading(false);
      }
    },
    [token, pageSize, search, roleFilter, statusFilter],
  );

  // 初始加载 + 筛选条件变化时重新拉取（重置到第 1 页）
  useEffect(() => {
    fetchUsers(1);
  }, [fetchUsers]);

  // 60 秒自动刷新：用 ref 持有最新的 fetch 函数与页码，避免闭包过期
  const latestFetch = useRef(fetchUsers);
  const latestPage = useRef(page);
  useEffect(() => {
    latestFetch.current = fetchUsers;
  }, [fetchUsers]);
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
    fetchUsers(1);
  };

  const totalPages = Math.ceil(total / pageSize) || 1;

  return (
    <div className="space-y-5">
      {/* 面包屑 */}
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/admin" className="hover:text-foreground">
          后台首页
        </Link>
        <span className="text-muted-foreground">/</span>
        <span className="font-medium text-foreground">用户管理</span>
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
            placeholder="搜索昵称 / 邮箱 / 手机号..."
            className="w-full max-w-xs rounded-[var(--radius-sm)] border border-border px-3 py-2 text-sm focus:border-primary/50 focus:shadow-[var(--glow-primary)] focus:outline-none transition-all duration-200"
          />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="rounded-[var(--radius-sm)] border border-border px-3 py-2 text-sm focus:border-primary/50 focus:shadow-[var(--glow-primary)] focus:outline-none transition-all duration-200"
          >
            <option value="">全部角色</option>
            <option value="user">普通用户</option>
            <option value="admin">管理员</option>
            <option value="super_admin">超管</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-[var(--radius-sm)] border border-border px-3 py-2 text-sm focus:border-primary/50 focus:shadow-[var(--glow-primary)] focus:outline-none transition-all duration-200"
          >
            <option value="">全部状态</option>
            <option value="active">正常</option>
            <option value="blocked">已拉黑</option>
          </select>
          <button
            type="submit"
            className="rounded-[var(--radius-sm)] border border-border bg-card px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted"
          >
            搜索
          </button>
        </form>
        <button
          onClick={() => fetchUsers(page)}
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
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-sm text-muted-foreground">暂无用户</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-muted/50 text-xs uppercase tracking-wider font-medium text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">用户</th>
                  <th className="px-4 py-3 font-medium">角色</th>
                  <th className="px-4 py-3 font-medium">状态</th>
                  <th className="px-4 py-3 font-medium">套餐</th>
                  <th className="px-4 py-3 font-medium">积分余额</th>
                  <th className="px-4 py-3 font-medium">累计使用</th>
                  <th className="px-4 py-3 font-medium">注册时间</th>
                  <th className="px-4 py-3 text-right font-medium">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map((u) => {
                  const roleBadge =
                    ROLE_BADGES[u.role] || {
                      label: u.role,
                      bg: "bg-muted",
                      text: "text-foreground",
                    };
                  const statusBadge =
                    STATUS_BADGES[u.status] || {
                      label: u.status,
                      bg: "bg-muted",
                      text: "text-foreground",
                    };
                  return (
                    <tr key={u.id} className="hover:bg-muted/30 transition-colors duration-100">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {u.avatar ? (
                            <img
                              src={u.avatar}
                              alt={u.nickname || "用户"}
                              className="h-9 w-9 flex-shrink-0 rounded-full object-cover"
                            />
                          ) : (
                            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary-100 text-sm font-medium text-primary-700">
                              {getInitial(u.nickname, u.email, u.phone)}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="truncate font-medium text-foreground">
                              {u.nickname || "未设置昵称"}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                              {u.email || u.phone || "—"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${roleBadge.bg} ${roleBadge.text}`}
                        >
                          {roleBadge.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusBadge.bg} ${statusBadge.text}`}
                        >
                          {statusBadge.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {u.isSubscribed ? (
                          <div className="flex flex-col">
                            <span className="text-xs font-medium text-success-700">
                              已订阅
                            </span>
                            {u.subscriptionPlan && (
                              <span className="text-xs text-muted-foreground">
                                {u.subscriptionPlan}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            未订阅
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {u.credits}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {u.totalUsed}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {formatDate(u.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => router.push(`/admin/users/${u.id}`)}
                            className="text-xs font-medium text-primary hover:text-primary-hover"
                          >
                            查看
                          </button>
                          {isSuperAdmin && (
                            <button
                              onClick={() => handleQuickBlock(u)}
                              disabled={quickActionUserId === u.id}
                              className={`text-xs font-medium disabled:opacity-50 ${
                                u.status === "active"
                                  ? "text-red-600 hover:text-red-700"
                                  : "text-success-700 hover:text-success-800"
                              }`}
                            >
                              {quickActionUserId === u.id
                                ? "处理中..."
                                : u.status === "active"
                                  ? "拉黑"
                                  : "解封"}
                            </button>
                          )}
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
      {total > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            共 {total} 条，第 {page}/{totalPages} 页
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchUsers(page - 1)}
              disabled={page <= 1 || loading}
              className="rounded-[var(--radius-sm)] border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted disabled:opacity-50"
            >
              上一页
            </button>
            <button
              onClick={() => fetchUsers(page + 1)}
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

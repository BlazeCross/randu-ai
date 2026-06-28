"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

interface OrderItem {
  id: string;
  orderNo: string;
  userId: string;
  type: string;
  credits: number;
  amount: number;
  status: string;
  paymentMethod: string | null;
  paymentId: string | null;
  paidAt: string | null;
  createdAt: string;
  refundStatus: string;
  refundedAt: string | null;
  plan: { id: string; name: string } | null;
  user: {
    id: string;
    nickname: string | null;
    email: string | null;
    phone: string | null;
  };
}

interface ListResponse {
  items: OrderItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  stats: Record<string, number>;
}

// 状态徽章样式
const STATUS_BADGES: Record<string, { label: string; bg: string; text: string }> = {
  pending: { label: "待支付", bg: "bg-amber-100", text: "text-amber-700" },
  paid: { label: "已支付", bg: "bg-success-100", text: "text-success-700" },
  failed: { label: "失败", bg: "bg-red-100", text: "text-red-600" },
  refunded: { label: "已退款", bg: "bg-muted", text: "text-muted-foreground" },
};

// 类型徽章样式
const TYPE_BADGES: Record<string, { label: string; bg: string; text: string }> = {
  subscription: { label: "套餐订阅", bg: "bg-primary-100", text: "text-primary-700" },
  credits: { label: "积分充值", bg: "bg-purple-100", text: "text-purple-700" },
};

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

export default function AdminOrdersPage() {
  const { token } = useAuth();

  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 筛选条件
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [orderNoSearch, setOrderNoSearch] = useState("");

  // 分页
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState<Record<string, number>>({
    pending: 0,
    paid: 0,
    failed: 0,
    refunded: 0,
  });

  // 拉取订单列表
  const fetchOrders = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      if (typeFilter) params.set("type", typeFilter);
      if (orderNoSearch.trim()) params.set("orderNo", orderNoSearch.trim());
      params.set("page", String(page));

      const res = await fetch(`/api/admin/orders?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const msg = await res.json().catch(() => ({}));
        throw new Error(msg.message || `请求失败 (${res.status})`);
      }
      const data = (await res.json()) as ListResponse;
      setOrders(data.items || []);
      setTotalPages(data.totalPages);
      setStats(data.stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : "获取订单列表失败");
    } finally {
      setLoading(false);
    }
  }, [token, statusFilter, typeFilter, orderNoSearch, page]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // 修改筛选条件时回到第 1 页
  useEffect(() => {
    setPage(1);
  }, [statusFilter, typeFilter, orderNoSearch]);

  // 退款处理：弹出输入框收集退款原因，调用退款 API
  const handleRefund = useCallback(
    async (order: OrderItem) => {
      const reason = window.prompt(
        `确认退款订单 ${order.orderNo}？\n退款金额：¥${order.amount.toFixed(2)}\n退还积分：${Math.round(order.amount * 100)}\n请输入退款原因（可选）：`,
      );
      // 用户点击取消（返回 null）则中止
      if (reason === null) return;

      try {
        const res = await fetch(
          `/api/admin/orders/${order.id}/refund`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ reason: reason.trim() || undefined }),
          },
        );
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data.message || `退款失败 (${res.status})`);
        }
        // 成功后刷新列表
        await fetchOrders();
      } catch (err) {
        setError(err instanceof Error ? err.message : "退款失败");
      }
    },
    [token, fetchOrders],
  );

  return (
    <div className="space-y-5">
      {/* 面包屑 */}
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/admin" className="hover:text-foreground">
          后台首页
        </Link>
        <span className="text-muted-foreground">/</span>
        <span className="font-medium text-foreground">订单管理</span>
      </nav>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(["pending", "paid", "failed", "refunded"] as const).map((s) => {
          const config = STATUS_BADGES[s];
          return (
            <div
              key={s}
              className="rounded-[var(--radius-sm)] border border-border bg-card p-4 shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] transition-all duration-200"
            >
              <p className="text-xs font-medium text-muted-foreground">
                {config.label}
              </p>
              <p className={`mt-1 font-mono text-2xl font-bold tabular-nums ${config.text}`}>
                {stats[s] ?? 0}
              </p>
            </div>
          );
        })}
      </div>

      {/* 筛选区 */}
      <div className="rounded-[var(--radius)] border border-border bg-card p-4 shadow-[var(--shadow-xs)]">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {/* 状态筛选 */}
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              状态
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-[var(--radius-sm)] border border-border bg-card px-3 py-2 text-sm focus:border-primary/50 focus:shadow-[var(--glow-primary)] focus:outline-none transition-all duration-200"
            >
              <option value="">全部状态</option>
              <option value="pending">待支付</option>
              <option value="paid">已支付</option>
              <option value="failed">失败</option>
              <option value="refunded">已退款</option>
            </select>
          </div>

          {/* 类型筛选 */}
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              类型
            </label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full rounded-[var(--radius-sm)] border border-border bg-card px-3 py-2 text-sm focus:border-primary/50 focus:shadow-[var(--glow-primary)] focus:outline-none transition-all duration-200"
            >
              <option value="">全部类型</option>
              <option value="subscription">套餐订阅</option>
              <option value="credits">积分充值</option>
            </select>
          </div>

          {/* 订单号搜索 */}
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              订单号搜索
            </label>
            <input
              type="text"
              value={orderNoSearch}
              onChange={(e) => setOrderNoSearch(e.target.value)}
              placeholder="输入订单号"
              className="w-full rounded-[var(--radius-sm)] border border-border bg-card px-3 py-2 text-sm focus:border-primary/50 focus:shadow-[var(--glow-primary)] focus:outline-none transition-all duration-200"
            />
          </div>
        </div>
      </div>

      {/* 订单列表 */}
      <div className="overflow-hidden rounded-[var(--radius)] border border-border bg-card shadow-[var(--shadow-xs)]">
        {error && (
          <div className="border-b border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700 sm:px-6">
            {error}
          </div>
        )}

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
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm text-muted-foreground">暂无订单</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground sm:px-6">
                    订单
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    用户
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    类型
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    金额
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    状态
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    时间
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-card">
                {orders.map((order) => {
                  const status = STATUS_BADGES[order.status] || STATUS_BADGES.pending;
                  const type = TYPE_BADGES[order.type] || {
                    label: order.type,
                    bg: "bg-muted",
                    text: "text-muted-foreground",
                  };
                  return (
                    <tr key={order.id} className="hover:bg-muted/30 transition-colors duration-100">
                      <td className="px-4 py-3 text-sm sm:px-6">
                        <div className="font-mono text-xs text-foreground">
                          {order.orderNo}
                        </div>
                        {order.plan && (
                          <div className="mt-0.5 text-xs text-muted-foreground">
                            {order.plan.name}
                          </div>
                        )}
                        {order.credits > 0 && (
                          <div className="text-xs text-muted-foreground">
                            {order.credits} 积分
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {order.user.nickname ||
                          order.user.email ||
                          order.user.phone ||
                          "未知"}
                        <div className="text-xs text-muted-foreground">
                          {order.user.email || order.user.phone || ""}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${type.bg} ${type.text}`}
                        >
                          {type.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-mono font-semibold tabular-nums text-foreground">
                        ¥{order.amount.toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${status.bg} ${status.text}`}
                        >
                          {status.label}
                        </span>
                        {/* 退款状态徽章：已退款显示红色徽章 */}
                        {order.refundStatus === "refunded" && (
                          <span className="ml-1 inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                            已退款
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        <div>{formatDate(order.createdAt)}</div>
                        {order.paidAt && (
                          <div className="text-success-600">
                            支付于 {formatDate(order.paidAt)}
                          </div>
                        )}
                        {order.refundedAt && (
                          <div className="text-red-600">
                            退款于 {formatDate(order.refundedAt)}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {/* 退款按钮：仅已支付且未退款时显示 */}
                        {order.status === "paid" &&
                          order.refundStatus !== "refunded" && (
                            <button
                              onClick={() => handleRefund(order)}
                              className="rounded-[var(--radius-sm)] border border-red-200 bg-card px-2.5 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
                            >
                              退款
                            </button>
                          )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* 分页 */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border px-4 py-3 sm:px-6">
            <p className="text-xs text-muted-foreground">
              第 {page} / {totalPages} 页
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="rounded-[var(--radius-sm)] border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted disabled:opacity-50"
              >
                上一页
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="rounded-[var(--radius-sm)] border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted disabled:opacity-50"
              >
                下一页
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

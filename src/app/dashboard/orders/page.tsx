"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { SkeletonListItem } from "@/components/ui/Skeleton";

interface OrderItem {
  id: string;
  orderNo: string;
  type: string;
  credits: number;
  amount: number;
  status: string;
  paymentMethod: string | null;
  paymentId: string | null;
  paidAt: string | null;
  createdAt: string;
  plan: { id: string; name: string } | null;
}

interface OrdersResponse {
  items: OrderItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

interface PackagesResponse {
  paymentEnabled: boolean;
  plans: Array<{
    id: string;
    name: string;
    monthlyPrice: number;
    dailyLimit: number;
    features: string[];
  }>;
  creditsPackages: Array<{
    id: string;
    credits: number;
    price: number;
    label: string;
    bonus?: string;
  }>;
}

interface CreatePaymentResponse {
  orderId: string;
  orderNo: string;
  payUrl: string;
  message?: string;
}

// 状态标签配置
const statusConfig: Record<string, { label: string; bg: string; text: string }> = {
  pending: { label: "待支付", bg: "bg-amber-100", text: "text-amber-700" },
  paid: { label: "已支付", bg: "bg-success-100", text: "text-success-700" },
  failed: { label: "失败", bg: "bg-red-100", text: "text-red-600" },
  refunded: { label: "已退款", bg: "bg-neutral-100", text: "text-neutral-600" },
};

// 类型标签
const typeConfig: Record<string, { label: string; bg: string; text: string }> = {
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

export default function OrdersPage() {
  const { token, user, loading } = useAuth();

  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 套餐与积分包数据
  const [packages, setPackages] = useState<PackagesResponse | null>(null);

  // 创建订单中状态（记录哪个按钮在 loading）
  const [creatingKey, setCreatingKey] = useState<string | null>(null);

  // 拉取订单列表
  const fetchOrders = useCallback(async () => {
    if (!token) return;
    setOrdersLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/orders", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const msg = await res.json().catch(() => ({}));
        throw new Error(msg.message || `请求失败 (${res.status})`);
      }
      const data = (await res.json()) as OrdersResponse;
      setOrders(data.items || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "获取订单列表失败");
    } finally {
      setOrdersLoading(false);
    }
  }, [token]);

  // 拉取套餐和积分包
  useEffect(() => {
    let cancelled = false;
    fetch("/api/payment/packages")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: PackagesResponse | null) => {
        if (cancelled || !data) return;
        setPackages(data);
      })
      .catch(() => {
        // 静默失败
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // 创建支付订单并跳转到支付宝
  const handleCreatePayment = async (
    type: "subscription" | "credits",
    payload: { planName?: string; packageId?: string },
    key: string,
  ) => {
    if (!token) return;
    setCreatingKey(key);
    try {
      const res = await fetch("/api/payment/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ type, ...payload }),
      });
      const data = (await res.json().catch(() => ({}))) as CreatePaymentResponse;
      if (!res.ok || !data.payUrl) {
        throw new Error(data.message || "创建订单失败");
      }
      // 跳转到支付宝支付页面
      window.location.href = data.payUrl;
    } catch (err) {
      alert(err instanceof Error ? err.message : "创建订单失败");
    } finally {
      setCreatingKey(null);
    }
  };

  if (loading) {
    return (
      <main className="flex flex-1 items-center justify-center bg-neutral-50">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
      </main>
    );
  }

  if (!user) {
    return (
      <main className="flex flex-1 items-center justify-center bg-neutral-50 px-4">
        <div className="text-center">
          <h2 className="mb-2 text-xl font-semibold text-neutral-900">请先登录</h2>
          <Link href="/login" className="text-sm text-primary hover:text-primary-hover">
            前往登录 →
          </Link>
        </div>
      </main>
    );
  }

  const paymentEnabled = packages?.paymentEnabled ?? false;

  return (
    <main className="flex-1 bg-neutral-50">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {/* 面包屑 */}
        <nav className="mb-6 flex items-center gap-1.5 text-sm text-neutral-500">
          <Link href="/dashboard" className="hover:text-neutral-900">
            个人中心
          </Link>
          <span className="text-neutral-300">/</span>
          <span className="font-medium text-neutral-900">订单管理</span>
        </nav>

        {/* 套餐订阅区 */}
        <section className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-neutral-900">套餐订阅</h2>
            {!paymentEnabled && (
              <span className="rounded-full bg-amber-50 px-3 py-1 text-xs text-amber-700">
                支付功能暂未开放
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {packages?.plans.map((plan) => {
              const isCurrent = user.subscriptionPlan === plan.name;
              const key = `plan-${plan.id}`;
              return (
                <div
                  key={plan.id}
                  className={`flex flex-col rounded-2xl border bg-white p-5 shadow-sm ${
                    isCurrent ? "border-success-300 bg-success-50/30" : "border-neutral-200"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-semibold text-neutral-900">
                      {plan.name}
                    </h3>
                    {isCurrent && (
                      <span className="rounded-full bg-success-100 px-2 py-0.5 text-xs font-medium text-success-700">
                        当前
                      </span>
                    )}
                  </div>
                  <div className="mt-3 flex items-baseline">
                    <span className="text-3xl font-bold text-neutral-900">
                      ¥{plan.monthlyPrice}
                    </span>
                    <span className="ml-1 text-sm text-neutral-500">/月</span>
                  </div>
                  <p className="mt-1 text-xs text-primary-700">
                    每日 {plan.dailyLimit} 次调用
                  </p>
                  <ul className="mt-4 flex-1 space-y-2">
                    {plan.features.slice(0, 4).map((f) => (
                      <li key={f} className="flex items-start gap-2 text-xs text-neutral-600">
                        <svg
                          className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-success-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          strokeWidth={2}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    disabled={!paymentEnabled || isCurrent || creatingKey === key}
                    onClick={() =>
                      handleCreatePayment("subscription", { planName: plan.name }, key)
                    }
                    className={`mt-4 w-full rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
                      isCurrent
                        ? "cursor-not-allowed bg-neutral-100 text-neutral-400"
                        : paymentEnabled
                          ? "bg-primary text-white hover:bg-primary-hover disabled:opacity-50"
                          : "cursor-not-allowed bg-neutral-100 text-neutral-400"
                    }`}
                  >
                    {creatingKey === key
                      ? "创建订单中..."
                      : isCurrent
                        ? "当前套餐"
                        : "立即订阅"}
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        {/* 积分充值区 */}
        <section className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-neutral-900">积分充值</h2>
            <span className="text-sm text-neutral-500">
              当前积分：<strong className="text-primary-700">{user.credits}</strong>
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {packages?.creditsPackages.map((pkg) => {
              const key = `credits-${pkg.id}`;
              return (
                <div
                  key={pkg.id}
                  className="flex flex-col rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-neutral-900">
                      {pkg.credits}
                    </span>
                    {pkg.bonus && (
                      <span className="rounded-full bg-red-50 px-1.5 py-0.5 text-[10px] font-medium text-red-600">
                        {pkg.bonus}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-neutral-500">积分</p>
                  <div className="mt-3 flex items-baseline">
                    <span className="text-xl font-bold text-primary-700">
                      ¥{pkg.price}
                    </span>
                  </div>
                  <button
                    type="button"
                    disabled={!paymentEnabled || creatingKey === key}
                    onClick={() =>
                      handleCreatePayment("credits", { packageId: pkg.id }, key)
                    }
                    className={`mt-3 w-full rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                      paymentEnabled
                        ? "bg-primary text-white hover:bg-primary-hover disabled:opacity-50"
                        : "cursor-not-allowed bg-neutral-100 text-neutral-400"
                    }`}
                  >
                    {creatingKey === key ? "创建中..." : "立即充值"}
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        {/* 订单列表 */}
        <section className="rounded-2xl border border-neutral-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-4 sm:px-6">
            <h2 className="text-base font-semibold text-neutral-900">历史订单</h2>
            <button
              onClick={() => fetchOrders()}
              disabled={ordersLoading}
              className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-50 disabled:opacity-50"
            >
              刷新
            </button>
          </div>

          {error && (
            <div className="border-b border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700 sm:px-6">
              {error}
            </div>
          )}

          {ordersLoading ? (
            <div className="divide-y divide-neutral-100">
              {Array.from({ length: 5 }).map((_, i) => (
                <SkeletonListItem key={i} />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-sm text-neutral-500">暂无订单</p>
              <p className="mt-1 text-xs text-neutral-400">
                选择上方套餐或积分包即可创建订单
              </p>
            </div>
          ) : (
            <div className="divide-y divide-neutral-100">
              {orders.map((order) => {
                const status = statusConfig[order.status] || statusConfig.pending;
                const type = typeConfig[order.type] || {
                  label: order.type,
                  bg: "bg-neutral-100",
                  text: "text-neutral-600",
                };
                return (
                  <div
                    key={order.id}
                    className="px-4 py-4 sm:px-6"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${type.bg} ${type.text}`}
                          >
                            {type.label}
                          </span>
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${status.bg} ${status.text}`}
                          >
                            {status.label}
                          </span>
                          {order.plan && (
                            <span className="text-sm font-medium text-neutral-900">
                              {order.plan.name}
                            </span>
                          )}
                          {order.credits > 0 && (
                            <span className="text-xs text-neutral-600">
                              {order.credits} 积分
                            </span>
                          )}
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-neutral-400">
                          <span className="font-mono">{order.orderNo}</span>
                          <span>{formatDate(order.createdAt)}</span>
                          {order.paidAt && (
                            <span>支付于 {formatDate(order.paidAt)}</span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-base font-bold text-neutral-900">
                          ¥{order.amount.toFixed(2)}
                        </div>
                        {order.status === "pending" && (
                          <button
                            onClick={() =>
                              window.location.reload()
                            }
                            className="mt-1 text-xs text-primary hover:text-primary-hover"
                          >
                            已支付？刷新查看
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

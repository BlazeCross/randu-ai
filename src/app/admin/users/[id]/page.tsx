"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

/**
 * 用户详情（对应 /api/admin/users/[id] 返回）
 */
interface UserDetail {
  id: string;
  email: string | null;
  phone: string | null;
  role: string;
  nickname: string | null;
  avatar: string | null;
  status: string;
  trialExpiresAt: string;
  isSubscribed: boolean;
  subscriptionPlan: string | null;
  credits: number;
  totalUsed: number;
  createdAt: string;
  updatedAt: string;
  usageLogCount: number;
  orderCount: number;
  apiKeyCount: number;
  paidOrderCount: number;
}

// 角色徽章样式
const ROLE_BADGES: Record<string, { label: string; bg: string; text: string }> = {
  user: { label: "普通用户", bg: "bg-neutral-100", text: "text-neutral-700" },
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

// 操作按钮 tooltip 提示
const ACTION_DISABLED_TITLE = "Phase 2.6 接入";

/**
 * 后台用户详情页
 *
 * 功能：
 * - 卡片1 基本信息：头像 + 昵称 + 角色徽章 + 状态徽章 + 邮箱/手机/ID + 时间
 * - 卡片2 套餐与积分：订阅状态、套餐名、积分余额、累计使用、试用到期
 * - 卡片3 使用统计：使用记录数、订单数、已支付订单数、API Key 数
 * - 卡片4 操作区：敏感操作占位（Phase 2.6 接入），按钮全部 disabled
 */
export default function AdminUserDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { token, user: currentUser } = useAuth();
  const userId = params?.id;

  const [detail, setDetail] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 当前管理员是否为 super_admin（用于决定操作按钮的提示文案）
  const isSuperAdmin = currentUser?.role === "super_admin";

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    if (!token) {
      setLoadErrorState(setError, setLoading, "登录已失效，请重新登录");
      return;
    }

    fetch(`/api/admin/users/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) {
          return res.json().catch(() => ({})).then((msg) => {
            throw new Error(msg.message || `加载用户失败 (${res.status})`);
          });
        }
        return res.json();
      })
      .then((data: { user?: UserDetail }) => {
        if (cancelled || !data.user) return;
        setDetail(data.user);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "加载用户失败");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [userId, token]);

  // 加载中
  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
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
    );
  }

  // 加载失败
  if (error || !detail) {
    return (
      <div className="space-y-5">
        <Breadcrumbs label="用户管理" />
        <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-red-200 bg-white p-12 text-center">
          <p className="text-sm text-red-600">
            {error || "加载用户失败"}
          </p>
          <button
            onClick={() => router.push("/admin/users")}
            className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50"
          >
            返回用户列表
          </button>
        </div>
      </div>
    );
  }

  const roleBadge =
    ROLE_BADGES[detail.role] || {
      label: detail.role,
      bg: "bg-neutral-100",
      text: "text-neutral-700",
    };
  const statusBadge =
    STATUS_BADGES[detail.status] || {
      label: detail.status,
      bg: "bg-neutral-100",
      text: "text-neutral-700",
    };
  const breadcrumbLabel = detail.nickname || "用户";

  return (
    <div className="space-y-5">
      {/* 面包屑 + 返回 */}
      <div className="flex items-center justify-between">
        <nav className="flex items-center gap-1.5 text-sm text-neutral-500">
          <Link href="/admin" className="hover:text-neutral-900">
            后台首页
          </Link>
          <span className="text-neutral-300">/</span>
          <Link href="/admin/users" className="hover:text-neutral-900">
            用户管理
          </Link>
          <span className="text-neutral-300">/</span>
          <span className="font-medium text-neutral-900">{breadcrumbLabel}</span>
        </nav>
        <button
          onClick={() => router.push("/admin/users")}
          className="rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium text-neutral-600 hover:bg-neutral-50"
        >
          ← 返回
        </button>
      </div>

      {/* 卡片1 - 基本信息 */}
      <section className="rounded-2xl border border-neutral-200 bg-white p-6">
        <h2 className="mb-4 text-sm font-semibold text-neutral-900">基本信息</h2>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          {detail.avatar ? (
            <img
              src={detail.avatar}
              alt={detail.nickname || "用户"}
              className="h-16 w-16 flex-shrink-0 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-primary-100 text-xl font-medium text-primary-700">
              {getInitial(detail.nickname, detail.email, detail.phone)}
            </div>
          )}
          <div className="flex-1 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-lg font-semibold text-neutral-900">
                {detail.nickname || "未设置昵称"}
              </span>
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${roleBadge.bg} ${roleBadge.text}`}
              >
                {roleBadge.label}
              </span>
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusBadge.bg} ${statusBadge.text}`}
              >
                {statusBadge.label}
              </span>
            </div>
            <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
              <div>
                <span className="text-neutral-500">邮箱：</span>
                <span className="text-neutral-900">
                  {detail.email || "—"}
                </span>
              </div>
              <div>
                <span className="text-neutral-500">手机号：</span>
                <span className="text-neutral-900">
                  {detail.phone || "—"}
                </span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-neutral-500">用户 ID：</span>
                <span className="break-all text-xs text-neutral-700">
                  {detail.id}
                </span>
              </div>
              <div>
                <span className="text-neutral-500">注册时间：</span>
                <span className="text-xs text-neutral-700">
                  {formatDate(detail.createdAt)}
                </span>
              </div>
              <div>
                <span className="text-neutral-500">最后更新：</span>
                <span className="text-xs text-neutral-700">
                  {formatDate(detail.updatedAt)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 卡片2 - 套餐与积分 */}
      <section className="rounded-2xl border border-neutral-200 bg-white p-6">
        <h2 className="mb-4 text-sm font-semibold text-neutral-900">
          套餐与积分
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <InfoCell
            label="订阅状态"
            value={
              detail.isSubscribed ? (
                <span className="font-medium text-success-700">已订阅</span>
              ) : (
                <span className="text-neutral-500">未订阅</span>
              )
            }
          />
          <InfoCell
            label="套餐名称"
            value={detail.subscriptionPlan || "—"}
          />
          <InfoCell label="积分余额" value={String(detail.credits)} />
          <InfoCell label="累计使用次数" value={String(detail.totalUsed)} />
          <InfoCell
            label="试用到期时间"
            value={formatDate(detail.trialExpiresAt)}
            small
          />
        </div>
      </section>

      {/* 卡片3 - 使用统计 */}
      <section className="rounded-2xl border border-neutral-200 bg-white p-6">
        <h2 className="mb-4 text-sm font-semibold text-neutral-900">使用统计</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCell label="使用记录数" value={detail.usageLogCount} />
          <StatCell label="订单数" value={detail.orderCount} />
          <StatCell
            label="已支付订单数"
            value={detail.paidOrderCount}
            accent="success"
          />
          <StatCell label="API Key 数" value={detail.apiKeyCount} />
        </div>
      </section>

      {/* 卡片4 - 操作区 */}
      <section className="rounded-2xl border border-neutral-200 bg-white p-6">
        <h2 className="mb-4 text-sm font-semibold text-neutral-900">
          管理操作
        </h2>
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          敏感操作（拉黑 / 解封 / 改套餐 / 改余额 / 设置管理员）将在 Phase 2.6
          接入
        </div>
        <div className="flex flex-wrap gap-3">
          {/* 拉黑 / 解封（根据当前状态显示） */}
          <button
            disabled
            title={ACTION_DISABLED_TITLE}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white opacity-50"
          >
            {detail.status === "active" ? "拉黑用户" : "解封用户"}
          </button>
          <button
            disabled
            title={ACTION_DISABLED_TITLE}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white opacity-50"
          >
            修改套餐
          </button>
          <button
            disabled
            title={ACTION_DISABLED_TITLE}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white opacity-50"
          >
            修改余额
          </button>
          <button
            disabled
            title={ACTION_DISABLED_TITLE}
            className="rounded-lg bg-purple-700 px-4 py-2 text-sm font-medium text-white opacity-50"
          >
            {isSuperAdmin ? "设置管理员角色" : "设置管理员角色（仅超管）"}
          </button>
        </div>
        {!isSuperAdmin && (
          <p className="mt-3 text-xs text-neutral-400">
            提示：拉黑/解封、改套餐、改余额、设置管理员等操作仅超级管理员可用，将在
            Phase 2.6 接入。
          </p>
        )}
      </section>
    </div>
  );
}

/**
 * 面包屑组件（仅「后台首页」单层，用于错误态等简化场景）
 */
function Breadcrumbs({ label }: { label: string }) {
  return (
    <nav className="flex items-center gap-1.5 text-sm text-neutral-500">
      <Link href="/admin" className="hover:text-neutral-900">
        后台首页
      </Link>
      <span className="text-neutral-300">/</span>
      <span className="font-medium text-neutral-900">{label}</span>
    </nav>
  );
}

/**
 * 信息单元格
 */
function InfoCell({
  label,
  value,
  small,
}: {
  label: string;
  value: React.ReactNode;
  small?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-neutral-500">{label}</span>
      <span className={small ? "text-xs text-neutral-900" : "text-sm text-neutral-900"}>
        {value}
      </span>
    </div>
  );
}

/**
 * 统计单元格
 */
function StatCell({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: "success";
}) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
      <p className="text-xs text-neutral-500">{label}</p>
      <p
        className={`mt-1 text-2xl font-semibold ${
          accent === "success" ? "text-success-700" : "text-neutral-900"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

/**
 * 设置加载错误状态
 */
function setLoadErrorState(
  setError: (msg: string | null) => void,
  setLoading: (b: boolean) => void,
  message: string,
) {
  setError(message);
  setLoading(false);
}

"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
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

// 模态框类型
type ModalType = "plan" | "credits" | "role" | null;

// 用户角色字面量类型
type UserRoleLiteral = "user" | "admin" | "super_admin";

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
 * 后台用户详情页
 *
 * 功能：
 * - 卡片1 基本信息：头像 + 昵称 + 角色徽章 + 状态徽章 + 邮箱/手机/ID + 时间
 * - 卡片2 套餐与积分：订阅状态、套餐名、积分余额、累计使用、试用到期
 * - 卡片3 使用统计：使用记录数、订单数、已支付订单数、API Key 数
 * - 卡片4 操作区：仅 super_admin 可见的敏感操作（拉黑/解封/改套餐/改余额/设置角色）
 *   - 拉黑/解封用 window.confirm，其余用 modal 弹窗
 *   - 操作后通过 toast 提示并重新拉取用户数据
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

  // 模态框状态
  const [modal, setModal] = useState<ModalType>(null);
  const [planIsSubscribed, setPlanIsSubscribed] = useState(false);
  const [planName, setPlanName] = useState("");
  const [creditsInput, setCreditsInput] = useState("");
  const [roleSelect, setRoleSelect] =
    useState<UserRoleLiteral>("user");

  // toast 状态（3 秒后自动消失）
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 操作进行中（按钮禁用）
  const [actionLoading, setActionLoading] = useState(false);

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

  // 卸载时清理 toast 定时器
  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  /**
   * 显示 toast（3 秒后自动消失，新 toast 替换旧的）
   */
  function showToast(type: "success" | "error", message: string) {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    setToast({ type, message });
    toastTimerRef.current = setTimeout(() => {
      setToast(null);
      toastTimerRef.current = null;
    }, 3000);
  }

  /**
   * 重新拉取用户详情（操作成功后刷新本地数据）
   */
  async function refreshUser() {
    if (!token || !userId) return;
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = (await res.json()) as { user?: UserDetail };
      if (data.user) setDetail(data.user);
    } catch {
      // 静默失败，UI 已通过 toast 反馈操作结果
    }
  }

  /**
   * 调用 PATCH /api/admin/users/[id]
   * 成功返回响应数据；失败抛出带 message 的 Error
   */
  async function patchUser(
    body: Record<string, unknown>,
  ): Promise<{ user?: UserDetail; actionLogged?: boolean }> {
    if (!token || !userId) {
      throw new Error("登录已失效，请重新登录");
    }
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });
    const data = (await res.json().catch(() => ({}))) as {
      message?: string;
      user?: UserDetail;
      actionLogged?: boolean;
    };
    if (!res.ok) {
      throw new Error(data.message || `操作失败 (${res.status})`);
    }
    return data;
  }

  /**
   * 打开 modal 前根据当前用户详情初始化表单字段
   */
  function openModal(type: Exclude<ModalType, null>) {
    if (!detail) return;
    if (type === "plan") {
      setPlanIsSubscribed(detail.isSubscribed);
      setPlanName(detail.subscriptionPlan || "");
    } else if (type === "credits") {
      setCreditsInput(String(detail.credits));
    } else if (type === "role") {
      // 强制收敛到联合类型字面量，未知值默认为 user
      setRoleSelect(
        (detail.role === "user" ||
        detail.role === "admin" ||
        detail.role === "super_admin"
          ? detail.role
          : "user") as UserRoleLiteral,
      );
    }
    setModal(type);
  }

  /**
   * 拉黑 / 解封：使用 window.confirm 确认后 PATCH
   */
  async function handleBlockUnblock() {
    if (!detail) return;
    const next: "active" | "blocked" =
      detail.status === "active" ? "blocked" : "active";
    const verb = next === "blocked" ? "拉黑" : "解封";
    const nickname = detail.nickname || "该用户";
    const confirmed = window.confirm(
      `确定${verb}用户 ${nickname}？此操作将禁止该用户登录与使用平台功能。`,
    );
    if (!confirmed) return;

    setActionLoading(true);
    try {
      await patchUser({ status: next });
      showToast("success", `${verb}成功`);
      await refreshUser();
    } catch (err) {
      showToast(
        "error",
        err instanceof Error ? err.message : `${verb}失败`,
      );
    } finally {
      setActionLoading(false);
    }
  }

  /**
   * 修改套餐：提交 modal
   */
  async function handleSubmitPlan() {
    setActionLoading(true);
    try {
      await patchUser({
        isSubscribed: planIsSubscribed,
        subscriptionPlan: planName,
      });
      showToast("success", "套餐更新成功");
      setModal(null);
      await refreshUser();
    } catch (err) {
      showToast(
        "error",
        err instanceof Error ? err.message : "套餐更新失败",
      );
    } finally {
      setActionLoading(false);
    }
  }

  /**
   * 修改余额：提交 modal
   */
  async function handleSubmitCredits() {
    const n = Number(creditsInput);
    if (!Number.isInteger(n) || n < 0) {
      showToast("error", "积分必须为非负整数");
      return;
    }
    setActionLoading(true);
    try {
      await patchUser({ credits: n });
      showToast("success", "余额更新成功");
      setModal(null);
      await refreshUser();
    } catch (err) {
      showToast(
        "error",
        err instanceof Error ? err.message : "余额更新失败",
      );
    } finally {
      setActionLoading(false);
    }
  }

  /**
   * 设置角色：提交 modal
   */
  async function handleSubmitRole() {
    setActionLoading(true);
    try {
      await patchUser({ role: roleSelect });
      showToast("success", "角色更新成功");
      setModal(null);
      await refreshUser();
    } catch (err) {
      showToast(
        "error",
        err instanceof Error ? err.message : "角色更新失败",
      );
    } finally {
      setActionLoading(false);
    }
  }

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
        <div className="flex flex-col items-center justify-center gap-4 rounded-[var(--radius)] border border-red-200 bg-card p-12 text-center">
          <p className="text-sm text-red-600">
            {error || "加载用户失败"}
          </p>
          <button
            onClick={() => router.push("/admin/users")}
            className="rounded-[var(--radius-sm)] border border-border bg-card px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted"
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
      bg: "bg-muted",
      text: "text-foreground",
    };
  const statusBadge =
    STATUS_BADGES[detail.status] || {
      label: detail.status,
      bg: "bg-muted",
      text: "text-foreground",
    };
  const breadcrumbLabel = detail.nickname || "用户";

  return (
    <div className="space-y-5">
      {/* Toast */}
      {toast && (
        <div className="fixed left-1/2 top-4 z-[60] -translate-x-1/2">
          <div
            className={`rounded-[var(--radius-sm)] px-4 py-2 text-sm font-medium ${
              toast.type === "success"
                ? "bg-success-600 text-white"
                : "bg-red-600 text-white"
            }`}
          >
            {toast.message}
          </div>
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 backdrop-blur-sm"
          onClick={() => setModal(null)}
        >
          <div
            className="w-full max-w-md rounded-[var(--radius)] bg-card p-6"
            onClick={(e) => e.stopPropagation()}
          >
            {modal === "plan" && (
              <>
                <h3 className="mb-4 text-base font-semibold text-foreground">
                  修改套餐
                </h3>
                <div className="space-y-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={planIsSubscribed}
                      onChange={(e) => setPlanIsSubscribed(e.target.checked)}
                      className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                    />
                    <span className="text-sm text-foreground">已订阅</span>
                  </label>
                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">
                      套餐名称
                    </label>
                    <input
                      type="text"
                      value={planName}
                      onChange={(e) => setPlanName(e.target.value)}
                      placeholder="输入套餐名称（可留空）"
                      className="w-full rounded-[var(--radius-sm)] border border-border px-3 py-2 text-sm focus:border-primary/50 focus:shadow-[var(--glow-primary)] focus:outline-none transition-all duration-200"
                    />
                  </div>
                </div>
                <div className="mt-6 flex justify-end gap-2">
                  <button
                    onClick={() => setModal(null)}
                    className="rounded-[var(--radius-sm)] border border-border bg-card px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleSubmitPlan}
                    disabled={actionLoading}
                    className="rounded-[var(--radius-sm)] bg-gradient-to-r from-primary to-primary-500 px-4 py-2 text-sm font-medium text-white shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] disabled:opacity-50"
                  >
                    确定
                  </button>
                </div>
              </>
            )}

            {modal === "credits" && (
              <>
                <h3 className="mb-4 text-base font-semibold text-foreground">
                  修改余额
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">
                      积分余额（非负整数）
                    </label>
                    <input
                      type="number"
                      min={0}
                      step={1}
                      value={creditsInput}
                      onChange={(e) => setCreditsInput(e.target.value)}
                      className="w-full rounded-[var(--radius-sm)] border border-border px-3 py-2 text-sm focus:border-primary/50 focus:shadow-[var(--glow-primary)] focus:outline-none transition-all duration-200"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setCreditsInput(
                          String(Number(creditsInput || 0) + 50),
                        )
                      }
                      className="rounded-[var(--radius-sm)] border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted"
                    >
                      +50
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setCreditsInput(
                          String(Number(creditsInput || 0) + 100),
                        )
                      }
                      className="rounded-[var(--radius-sm)] border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted"
                    >
                      +100
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setCreditsInput(
                          String(Number(creditsInput || 0) + 500),
                        )
                      }
                      className="rounded-[var(--radius-sm)] border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted"
                    >
                      +500
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    当前余额：{detail.credits}
                  </p>
                </div>
                <div className="mt-6 flex justify-end gap-2">
                  <button
                    onClick={() => setModal(null)}
                    className="rounded-[var(--radius-sm)] border border-border bg-card px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleSubmitCredits}
                    disabled={actionLoading}
                    className="rounded-[var(--radius-sm)] bg-gradient-to-r from-primary to-primary-500 px-4 py-2 text-sm font-medium text-white shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] disabled:opacity-50"
                  >
                    确定
                  </button>
                </div>
              </>
            )}

            {modal === "role" && (
              <>
                <h3 className="mb-4 text-base font-semibold text-foreground">
                  设置角色
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">
                      角色
                    </label>
                    <select
                      value={roleSelect}
                      onChange={(e) =>
                        setRoleSelect(
                          e.target.value as UserRoleLiteral,
                        )
                      }
                      className="w-full rounded-[var(--radius-sm)] border border-border px-3 py-2 text-sm focus:border-primary/50 focus:shadow-[var(--glow-primary)] focus:outline-none transition-all duration-200"
                    >
                      <option value="user">普通用户</option>
                      <option value="admin">管理员</option>
                      <option value="super_admin">超级管理员</option>
                    </select>
                  </div>
                  {currentUser?.id === detail.id &&
                    roleSelect !== "super_admin" && (
                      <p className="rounded-[var(--radius-sm)] border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                        注意：不允许修改自己的角色
                      </p>
                    )}
                </div>
                <div className="mt-6 flex justify-end gap-2">
                  <button
                    onClick={() => setModal(null)}
                    className="rounded-[var(--radius-sm)] border border-border bg-card px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleSubmitRole}
                    disabled={actionLoading}
                    className="rounded-[var(--radius-sm)] bg-purple-700 px-4 py-2 text-sm font-medium text-white hover:bg-purple-800 disabled:opacity-50"
                  >
                    确定
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* 面包屑 + 返回 */}
      <div className="flex items-center justify-between">
        <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Link href="/admin" className="hover:text-foreground">
            后台首页
          </Link>
          <span className="text-muted-foreground">/</span>
          <Link href="/admin/users" className="hover:text-foreground">
            用户管理
          </Link>
          <span className="text-muted-foreground">/</span>
          <span className="font-medium text-foreground">{breadcrumbLabel}</span>
        </nav>
        <button
          onClick={() => router.push("/admin/users")}
          className="rounded-[var(--radius-sm)] border border-border bg-card px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted"
        >
          ← 返回
        </button>
      </div>

      {/* 卡片1 - 基本信息 */}
      <section className="rounded-[var(--radius)] border border-border bg-card p-6 shadow-[var(--shadow-xs)]">
        <h2 className="mb-4 text-sm font-semibold text-foreground">基本信息</h2>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          {detail.avatar ? (
            <Image
              src={detail.avatar}
              alt={detail.nickname || "用户"}
              width={64}
              height={64}
              unoptimized
              className="h-16 w-16 flex-shrink-0 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-primary-100 text-xl font-medium text-primary-700">
              {getInitial(detail.nickname, detail.email, detail.phone)}
            </div>
          )}
          <div className="flex-1 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-lg font-semibold text-foreground">
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
                <span className="text-muted-foreground">邮箱：</span>
                <span className="text-foreground">
                  {detail.email || "—"}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">手机号：</span>
                <span className="text-foreground">
                  {detail.phone || "—"}
                </span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-muted-foreground">用户 ID：</span>
                <span className="break-all text-xs text-foreground">
                  {detail.id}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">注册时间：</span>
                <span className="text-xs text-foreground">
                  {formatDate(detail.createdAt)}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">最后更新：</span>
                <span className="text-xs text-foreground">
                  {formatDate(detail.updatedAt)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 卡片2 - 套餐与积分 */}
      <section className="rounded-[var(--radius)] border border-border bg-card p-6 shadow-[var(--shadow-xs)]">
        <h2 className="mb-4 text-sm font-semibold text-foreground">
          套餐与积分
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <InfoCell
            label="订阅状态"
            value={
              detail.isSubscribed ? (
                <span className="font-medium text-success-700">已订阅</span>
              ) : (
                <span className="text-muted-foreground">未订阅</span>
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
      <section className="rounded-[var(--radius)] border border-border bg-card p-6 shadow-[var(--shadow-xs)]">
        <h2 className="mb-4 text-sm font-semibold text-foreground">使用统计</h2>
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
      <section className="rounded-[var(--radius)] border border-border bg-card p-6 shadow-[var(--shadow-xs)]">
        <h2 className="mb-4 text-sm font-semibold text-foreground">
          管理操作
        </h2>
        {isSuperAdmin ? (
          <>
            <div className="mb-4 rounded-[var(--radius-sm)] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
              敏感操作（拉黑 / 解封 / 改套餐 / 改余额 / 设置管理员）将记录到操作日志
            </div>
            <div className="flex flex-wrap gap-3">
              {/* 拉黑 / 解封（根据当前状态显示） */}
              <button
                onClick={handleBlockUnblock}
                disabled={actionLoading}
                className="rounded-[var(--radius-sm)] bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {detail.status === "active" ? "拉黑用户" : "解封用户"}
              </button>
              <button
                onClick={() => openModal("plan")}
                disabled={actionLoading}
                className="rounded-[var(--radius-sm)] bg-gradient-to-r from-primary to-primary-500 px-4 py-2 text-sm font-medium text-white shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] disabled:opacity-50"
              >
                修改套餐
              </button>
              <button
                onClick={() => openModal("credits")}
                disabled={actionLoading}
                className="rounded-[var(--radius-sm)] bg-gradient-to-r from-primary to-primary-500 px-4 py-2 text-sm font-medium text-white shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] disabled:opacity-50"
              >
                修改余额
              </button>
              <button
                onClick={() => openModal("role")}
                disabled={actionLoading}
                className="rounded-[var(--radius-sm)] bg-purple-700 px-4 py-2 text-sm font-medium text-white hover:bg-purple-800 disabled:opacity-50"
              >
                设置管理员角色
              </button>
            </div>
          </>
        ) : (
          <div className="rounded-[var(--radius-sm)] border border-border bg-background px-4 py-6 text-center text-sm text-muted-foreground">
            敏感操作仅超级管理员可用
          </div>
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
    <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
      <Link href="/admin" className="hover:text-foreground">
        后台首页
      </Link>
      <span className="text-muted-foreground">/</span>
      <span className="font-medium text-foreground">{label}</span>
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
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={small ? "text-xs text-foreground" : "text-sm text-foreground"}>
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
    <div className="rounded-[var(--radius-sm)] border border-border bg-background p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={`mt-1 font-mono text-2xl font-semibold tabular-nums ${
          accent === "success" ? "text-success-700" : "text-foreground"
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

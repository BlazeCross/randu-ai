"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

// API Key 类型（对应 GET /api/keys 返回的 keys 元素）
interface ApiKeyItem {
  id: string;
  keyPrefix: string;
  name: string;
  status: "active" | "inactive" | "revoked";
  creditsUsed: number;
  totalCalls: number;
  lastUsedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
}

// 创建 Key 后返回的明文 Key（仅显示一次）
interface CreatedKey {
  id: string;
  keyPrefix: string;
  key: string;
  name: string;
  createdAt: string;
}

// Key 状态标签配置
const keyStatusConfig: Record<
  string,
  { label: string; bg: string; text: string }
> = {
  active: {
    label: "正常",
    bg: "bg-success-100",
    text: "text-success-700",
  },
  inactive: {
    label: "停用",
    bg: "bg-neutral-100",
    text: "text-neutral-600",
  },
  revoked: {
    label: "已吊销",
    bg: "bg-red-100",
    text: "text-red-600",
  },
};

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

export default function KeysPage() {
  const { token, loading, user } = useAuth();

  const [keys, setKeys] = useState<ApiKeyItem[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 创建 Key 表单状态
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [creating, setCreating] = useState(false);

  // 新创建的明文 Key（弹窗展示一次）
  const [createdKey, setCreatedKey] = useState<CreatedKey | null>(null);
  const [copied, setCopied] = useState(false);

  // 操作中的 Key ID（禁用对应按钮，防止重复提交）
  const [actionKeyId, setActionKeyId] = useState<string | null>(null);

  // 确认弹窗：吊销 / 重置
  const [confirmAction, setConfirmAction] = useState<
    | { type: "revoke" | "reset"; key: ApiKeyItem }
    | null
  >(null);

  /**
   * 获取 Key 列表
   */
  const fetchKeys = useCallback(async () => {
    if (!token) return;
    setListLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/keys", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        throw new Error("获取 Key 列表失败");
      }
      const data = (await res.json()) as { keys: ApiKeyItem[] };
      setKeys(data.keys);
    } catch (e) {
      setError(e instanceof Error ? e.message : "获取 Key 列表失败");
    } finally {
      setListLoading(false);
    }
  }, [token]);

  // 登录后加载 Key 列表
  useEffect(() => {
    if (token) {
      fetchKeys();
    }
  }, [token, fetchKeys]);

  /**
   * 复制文本到剪贴板
   */
  const copyToClipboard = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // 剪贴板 API 不可用时静默失败
    }
  }, []);

  /**
   * 创建新 Key
   */
  const handleCreate = useCallback(async () => {
    if (!token) return;
    const name = newKeyName.trim();
    if (!name) {
      setError("请输入 Key 名称");
      return;
    }

    setCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/keys", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as {
          message?: string;
        };
        throw new Error(data.message || "创建 Key 失败");
      }
      const data = (await res.json()) as CreatedKey;
      setCreatedKey(data);
      setNewKeyName("");
      setShowCreateForm(false);
      // 刷新列表
      await fetchKeys();
    } catch (e) {
      setError(e instanceof Error ? e.message : "创建 Key 失败");
    } finally {
      setCreating(false);
    }
  }, [token, newKeyName, fetchKeys]);

  /**
   * 吊销 Key
   */
  const handleRevoke = useCallback(
    async (keyId: string) => {
      if (!token) return;
      setActionKeyId(keyId);
      try {
        const res = await fetch(`/api/keys/${keyId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          const data = (await res.json().catch(() => ({}))) as {
            message?: string;
          };
          throw new Error(data.message || "吊销 Key 失败");
        }
        setConfirmAction(null);
        await fetchKeys();
      } catch (e) {
        setError(e instanceof Error ? e.message : "吊销 Key 失败");
      } finally {
        setActionKeyId(null);
      }
    },
    [token, fetchKeys],
  );

  /**
   * 重置 Key（生成新明文 + 哈希）
   */
  const handleReset = useCallback(
    async (keyId: string) => {
      if (!token) return;
      setActionKeyId(keyId);
      try {
        const res = await fetch(`/api/keys/${keyId}`, {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          const data = (await res.json().catch(() => ({}))) as {
            message?: string;
          };
          throw new Error(data.message || "重置 Key 失败");
        }
        const data = (await res.json()) as CreatedKey;
        // 展示新的明文 Key
        setCreatedKey(data);
        setConfirmAction(null);
        await fetchKeys();
      } catch (e) {
        setError(e instanceof Error ? e.message : "重置 Key 失败");
      } finally {
        setActionKeyId(null);
      }
    },
    [token, fetchKeys],
  );

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
          <p className="mb-6 text-sm text-neutral-500">
            登录后即可管理你的 API Key
          </p>
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
            <span className="text-neutral-600">API Key 管理</span>
          </nav>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-neutral-900">
                API Key 管理
              </h1>
              <p className="mt-1 text-sm text-neutral-500">
                管理用于调用对外 API 的密钥
              </p>
            </div>
            <button
              onClick={() => setShowCreateForm((v) => !v)}
              className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary-600/25 transition-all hover:bg-primary-hover"
            >
              {showCreateForm ? "取消" : "创建新 Key"}
            </button>
          </div>
        </div>

        {/* 余额提示 */}
        <div className="mb-6 rounded-2xl border border-primary-200 bg-gradient-to-br from-primary-50 to-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-500">当前余额</p>
              <p className="mt-1 text-2xl font-bold text-primary-700">
                {user.credits} 点
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-neutral-500">累计调用</p>
              <p className="mt-1 text-lg font-semibold text-neutral-900">
                {user.totalUsed} 次
              </p>
            </div>
          </div>
        </div>

        {/* 创建表单 */}
        {showCreateForm && (
          <div className="mb-6 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-base font-semibold text-neutral-900">
              创建新 API Key
            </h2>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex-1">
                <label className="mb-1.5 block text-sm font-medium text-neutral-700">
                  Key 名称
                </label>
                <input
                  type="text"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  maxLength={30}
                  placeholder="例如：生产环境调用"
                  className="w-full rounded-xl border border-neutral-300 px-4 py-2.5 text-sm text-neutral-900 outline-none transition-colors focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                />
                <p className="mt-1 text-xs text-neutral-400">
                  用于标识 Key 的用途，最多 30 字
                </p>
              </div>
              <button
                onClick={handleCreate}
                disabled={creating || !newKeyName.trim()}
                className="rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
              >
                {creating ? "创建中..." : "创建"}
              </button>
            </div>
          </div>
        )}

        {/* 错误提示 */}
        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4">
            <svg
              className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="flex-1 text-sm text-red-700">{error}</p>
            <button
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-600"
            >
              ✕
            </button>
          </div>
        )}

        {/* Key 列表 */}
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
          ) : keys.length > 0 ? (
            <div className="divide-y divide-neutral-100">
              {keys.map((key) => {
                const status =
                  keyStatusConfig[key.status] || keyStatusConfig.active;
                const isRevoked = key.status === "revoked";
                return (
                  <div
                    key={key.id}
                    className="px-4 py-4 transition-colors hover:bg-neutral-50 sm:px-6"
                  >
                    <div className="flex items-start justify-between gap-4">
                      {/* 左侧：Key 信息 */}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-semibold text-neutral-900">
                            {key.name}
                          </span>
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${status.bg} ${status.text}`}
                          >
                            {status.label}
                          </span>
                        </div>
                        {/* Key 前缀（用于识别） */}
                        <div className="mt-1.5 flex items-center gap-1.5">
                          <code className="rounded bg-neutral-100 px-2 py-0.5 font-mono text-xs text-neutral-600">
                            {key.keyPrefix}••••••••
                          </code>
                          <button
                            onClick={() => copyToClipboard(key.keyPrefix)}
                            className="text-neutral-400 hover:text-primary-600"
                            title="复制前缀"
                          >
                            <svg
                              className="h-3.5 w-3.5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              strokeWidth={2}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3"
                              />
                            </svg>
                          </button>
                        </div>
                        {/* 用量统计 */}
                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-400">
                          <span>
                            调用 <strong className="text-neutral-600">{key.totalCalls}</strong> 次
                          </span>
                          <span>
                            消耗 <strong className="text-neutral-600">{key.creditsUsed}</strong> 点
                          </span>
                          {key.lastUsedAt && (
                            <span>最近使用 {formatDate(key.lastUsedAt)}</span>
                          )}
                          {key.expiresAt && (
                            <span>
                              过期时间 {formatDate(key.expiresAt)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* 右侧：操作按钮 */}
                      {!isRevoked && (
                        <div className="flex flex-shrink-0 gap-2">
                          <button
                            onClick={() =>
                              setConfirmAction({ type: "reset", key })
                            }
                            disabled={actionKeyId === key.id}
                            className="rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs font-medium text-neutral-600 transition-colors hover:border-neutral-400 hover:text-neutral-900 disabled:opacity-50"
                          >
                            重置
                          </button>
                          <button
                            onClick={() =>
                              setConfirmAction({ type: "revoke", key })
                            }
                            disabled={actionKeyId === key.id}
                            className="rounded-lg border border-red-300 bg-white px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
                          >
                            吊销
                          </button>
                        </div>
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
                    d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                  />
                </svg>
              </div>
              <p className="text-sm text-neutral-500">暂无 API Key</p>
              <p className="mt-1 text-xs text-neutral-400">
                创建 Key 后即可通过 X-API-Key 调用对外 API
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 明文 Key 展示弹窗（创建/重置后一次性显示） */}
      {createdKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-start gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-amber-100">
                <svg
                  className="h-5 w-5 text-amber-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-semibold text-neutral-900">
                  Key 已生成
                </h3>
                <p className="mt-0.5 text-sm text-neutral-500">
                  请立即复制保存，关闭后无法再次查看
                </p>
              </div>
            </div>

            {/* Key 明文 */}
            <div className="mb-4">
              <label className="mb-1.5 block text-xs font-medium text-neutral-500">
                API Key（明文）
              </label>
              <div className="flex items-center gap-2">
                <code className="flex-1 break-all rounded-xl bg-neutral-100 px-4 py-3 font-mono text-sm text-neutral-900">
                  {createdKey.key}
                </code>
                <button
                  onClick={() => copyToClipboard(createdKey.key)}
                  className="flex-shrink-0 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
                >
                  {copied ? "已复制" : "复制"}
                </button>
              </div>
            </div>

            {/* 使用说明 */}
            <div className="mb-5 rounded-xl bg-neutral-50 p-4">
              <p className="text-xs font-medium text-neutral-600">
                使用方式：
              </p>
              <p className="mt-1 font-mono text-xs text-neutral-500">
                curl -H &quot;X-API-Key: {createdKey.key}&quot; \\<br />
                &nbsp;&nbsp;https://randuai.cn/api/external/generate/copy
              </p>
            </div>

            <button
              onClick={() => {
                setCreatedKey(null);
                setCopied(false);
              }}
              className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
            >
              我已保存，关闭
            </button>
          </div>
        </div>
      )}

      {/* 确认弹窗：吊销 / 重置 */}
      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="mb-2 text-base font-semibold text-neutral-900">
              {confirmAction.type === "revoke"
                ? "确认吊销此 Key？"
                : "确认重置此 Key？"}
            </h3>
            <p className="mb-5 text-sm text-neutral-500">
              {confirmAction.type === "revoke"
                ? `吊销后，使用此 Key 的所有 API 请求将立即失败（返回 401）。此操作不可撤销。`
                : `重置后，将生成新的明文 Key，旧 Key 立即失效。请确保已通知所有使用方更新。`}
            </p>
            <div className="mb-5 rounded-xl bg-neutral-50 p-3">
              <p className="text-xs text-neutral-500">Key 名称</p>
              <p className="mt-0.5 text-sm font-medium text-neutral-900">
                {confirmAction.key.name}
              </p>
              <p className="mt-2 text-xs text-neutral-500">Key 前缀</p>
              <code className="mt-0.5 block font-mono text-xs text-neutral-600">
                {confirmAction.key.keyPrefix}••••••••
              </code>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmAction(null)}
                className="flex-1 rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
              >
                取消
              </button>
              <button
                onClick={() =>
                  confirmAction.type === "revoke"
                    ? handleRevoke(confirmAction.key.id)
                    : handleReset(confirmAction.key.id)
                }
                disabled={actionKeyId === confirmAction.key.id}
                className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-colors disabled:opacity-50 ${
                  confirmAction.type === "revoke"
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-primary hover:bg-primary-hover"
                }`}
              >
                {actionKeyId === confirmAction.key.id
                  ? "处理中..."
                  : confirmAction.type === "revoke"
                    ? "确认吊销"
                    : "确认重置"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

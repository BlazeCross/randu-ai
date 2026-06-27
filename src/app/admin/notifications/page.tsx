"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

interface AnnouncementItem {
  id: string;
  title: string;
  content: string | null;
  link: string | null;
  createdAt: string;
  recipientCount: number;
}

interface ListResponse {
  announcements: AnnouncementItem[];
}

interface CreateResponse {
  success?: boolean;
  recipientCount?: number;
  message?: string;
}

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
 * 后台公告管理页
 *
 * 功能：
 * - 创建公告（广播给所有活跃用户）
 * - 公告列表（去重展示 + 接收人数）
 * - 手动刷新
 *
 * admin 及以上权限可访问。
 */
export default function AdminNotificationsPage() {
  const { token } = useAuth();

  // 列表数据
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 表单状态
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [link, setLink] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  /**
   * 拉取公告列表
   */
  const fetchAnnouncements = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/notifications", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const msg = await res.json().catch(() => ({}));
        throw new Error(msg.message || `请求失败 (${res.status})`);
      }
      const data = (await res.json()) as ListResponse;
      setAnnouncements(data.announcements || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "获取公告列表失败");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  /**
   * 提交创建公告
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setFormError(null);
    setSuccessMsg(null);

    if (!title.trim()) {
      setFormError("公告标题不能为空");
      return;
    }
    if (title.trim().length > 100) {
      setFormError("公告标题不能超过 100 字");
      return;
    }
    if (content.length > 1000) {
      setFormError("公告内容不能超过 1000 字");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          link: link.trim() || undefined,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as CreateResponse;
      if (!res.ok) {
        setFormError(data.message || `创建失败 (${res.status})`);
        return;
      }
      setSuccessMsg(`公告已发送给 ${data.recipientCount ?? 0} 位活跃用户`);
      // 清空表单
      setTitle("");
      setContent("");
      setLink("");
      // 刷新列表
      fetchAnnouncements();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "创建公告失败");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* 面包屑 */}
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/admin" className="hover:text-foreground">
          后台首页
        </Link>
        <span className="text-muted-foreground">/</span>
        <span className="font-medium text-foreground">公告管理</span>
      </nav>

      {/* 创建公告卡片 */}
      <div className="rounded-[var(--radius)] border border-border bg-card p-6">
        <h2 className="mb-4 text-base font-semibold text-foreground">
          发布新公告
        </h2>

        {formError && (
          <div className="mb-4 rounded-[var(--radius-sm)] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {formError}
          </div>
        )}
        {successMsg && (
          <div className="mb-4 rounded-[var(--radius-sm)] border border-success-200 bg-success-50 px-4 py-3 text-sm text-success-700">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 标题 */}
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">
              公告标题 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="如：系统维护通知"
              maxLength={100}
              className="w-full rounded-[var(--radius-sm)] border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              {title.length}/100 字
            </p>
          </div>

          {/* 内容 */}
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">
              公告内容
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="公告详细内容..."
              rows={4}
              maxLength={1000}
              className="w-full rounded-[var(--radius-sm)] border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              {content.length}/1000 字
            </p>
          </div>

          {/* 链接 */}
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">
              跳转链接（可选）
            </label>
            <input
              type="url"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://..."
              className="w-full rounded-[var(--radius-sm)] border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* 提交按钮 */}
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={submitting || !title.trim()}
              className="rounded-[var(--radius-sm)] bg-primary px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
            >
              {submitting ? "发送中..." : "发布公告"}
            </button>
            <p className="text-xs text-muted-foreground">
              公告将发送给所有活跃用户，并显示在首页横幅
            </p>
          </div>
        </form>
      </div>

      {/* 公告列表 */}
      <div className="overflow-hidden rounded-[var(--radius)] border border-border bg-card p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground">
            历史公告
          </h2>
          <button
            onClick={() => fetchAnnouncements()}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted disabled:opacity-50"
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
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            刷新
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-[var(--radius-sm)] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
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
        ) : announcements.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm text-muted-foreground">暂无公告</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {announcements.map((a) => (
              <div key={a.id} className="py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-medium text-foreground">
                      {a.title}
                    </h3>
                    {a.content && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {a.content}
                      </p>
                    )}
                    {a.link && (
                      <a
                        href={a.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 inline-flex items-center gap-1 text-xs text-primary hover:text-primary-hover"
                      >
                        {a.link}
                        <svg
                          className="h-3 w-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                          />
                        </svg>
                      </a>
                    )}
                  </div>
                  <div className="flex flex-shrink-0 flex-col items-end gap-1 text-xs text-muted-foreground">
                    <span>{formatDate(a.createdAt)}</span>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-muted-foreground">
                      {a.recipientCount} 人收到
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

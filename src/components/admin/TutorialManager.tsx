"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useAuth } from "@/hooks/useAuth";

export type TutorialType = "article" | "video";

/**
 * 教程列表项（对应 /api/admin/tutorials 返回）
 */
interface Tutorial {
  id: string;
  type: string;
  title: string;
  category: string | null;
  cover: string | null;
  content: string | null;
  videoUrl: string | null;
  excerpt: string | null;
  sortOrder: number;
  published: boolean;
  studyCount: number;
  viewCount: number;
  accessLevel: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * 表单数据
 */
interface TutorialFormData {
  title: string;
  category: string;
  cover: string | null;
  content: string;
  videoUrl: string;
  excerpt: string;
  sortOrder: number;
  published: boolean;
  studyCount: number;
  viewCount: number;
  accessLevel: "free" | "vip";
}

function getDefaultFormData(): TutorialFormData {
  return {
    title: "",
    category: "",
    cover: null,
    content: "",
    videoUrl: "",
    excerpt: "",
    sortOrder: 0,
    published: false,
    studyCount: 0,
    viewCount: 0,
    accessLevel: "free",
  };
}

function adaptTutorialToForm(t: Tutorial): TutorialFormData {
  return {
    title: t.title,
    category: t.category ?? "",
    cover: t.cover,
    content: t.content ?? "",
    videoUrl: t.videoUrl ?? "",
    excerpt: t.excerpt ?? "",
    sortOrder: t.sortOrder,
    published: t.published,
    studyCount: t.studyCount,
    viewCount: t.viewCount,
    accessLevel: (t.accessLevel as "free" | "vip") ?? "free",
  };
}

interface TutorialManagerProps {
  /** 教程类型 */
  type: TutorialType;
}

/**
 * 教程后台管理（图文 + 视频共享）
 *
 * - 列表表格：封面、标题、分类、学习人数、浏览次数、权限、状态、操作
 * - 新增/编辑通过模态框表单
 * - 删除二次确认
 *
 * type=article：表单显示「内容」大文本框
 * type=video：表单显示「视频地址」输入框
 */
export default function TutorialManager({ type }: TutorialManagerProps) {
  const { token } = useAuth();
  const isVideo = type === "video";

  const [tutorials, setTutorials] = useState<Tutorial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 模态框状态
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<TutorialFormData>(getDefaultFormData);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // 封面上传
  const [coverUploading, setCoverUploading] = useState(false);
  const [coverUploadError, setCoverUploadError] = useState<string | null>(null);

  // 行操作中
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  /**
   * 拉取教程列表
   */
  const fetchTutorials = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ type });
      const res = await fetch(`/api/admin/tutorials?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const msg = await res.json().catch(() => ({}));
        throw new Error(msg.message || `请求失败 (${res.status})`);
      }
      const data = (await res.json()) as { tutorials: Tutorial[] };
      setTutorials(data.tutorials);
    } catch (err) {
      setError(err instanceof Error ? err.message : "获取列表失败");
    } finally {
      setLoading(false);
    }
  }, [token, type]);

  useEffect(() => {
    fetchTutorials();
  }, [fetchTutorials]);

  const openCreateModal = () => {
    setEditingId(null);
    setFormData(getDefaultFormData());
    setFormErrors({});
    setSubmitError(null);
    setCoverUploadError(null);
    setModalOpen(true);
  };

  const openEditModal = (t: Tutorial) => {
    setEditingId(t.id);
    setFormData(adaptTutorialToForm(t));
    setFormErrors({});
    setSubmitError(null);
    setCoverUploadError(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    if (submitting) return;
    setModalOpen(false);
  };

  const updateField = <K extends keyof TutorialFormData>(
    key: K,
    value: TutorialFormData[K],
  ) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    if (formErrors[key]) {
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  /**
   * 上传封面
   */
  const handleCoverUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;

    setCoverUploading(true);
    setCoverUploadError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      if (!res.ok) {
        const msg = await res.json().catch(() => ({}));
        throw new Error(msg.message || "上传失败");
      }
      const data = (await res.json()) as { url: string };
      updateField("cover", data.url);
    } catch (err) {
      setCoverUploadError(
        err instanceof Error ? err.message : "封面上传失败",
      );
    } finally {
      setCoverUploading(false);
      e.target.value = "";
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.title.trim()) {
      newErrors.title = "标题不能为空";
    }
    if (isVideo && !formData.videoUrl.trim()) {
      newErrors.videoUrl = "视频地址不能为空";
    }
    setFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * 提交表单
   */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (!validate()) return;

    setSubmitting(true);
    setSubmitError(null);
    try {
      const payload = {
        type,
        title: formData.title.trim(),
        category: formData.category.trim() || null,
        cover: formData.cover,
        content: isVideo ? null : (formData.content || null),
        videoUrl: isVideo ? formData.videoUrl.trim() || null : null,
        excerpt: formData.excerpt.trim() || null,
        sortOrder: formData.sortOrder,
        published: formData.published,
        studyCount: formData.studyCount,
        viewCount: formData.viewCount,
        accessLevel: formData.accessLevel,
      };

      const isEdit = editingId !== null;
      const url = isEdit
        ? `/api/admin/tutorials/${editingId}`
        : "/api/admin/tutorials";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(
          typeof json?.message === "string" ? json.message : "提交失败",
        );
      }

      setModalOpen(false);
      await fetchTutorials();
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "网络错误，提交失败",
      );
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * 切换发布状态
   */
  const handleTogglePublished = async (t: Tutorial) => {
    if (!token) return;
    setActionLoading(t.id);
    try {
      const res = await fetch(`/api/admin/tutorials/${t.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ published: !t.published }),
      });
      if (!res.ok) {
        const msg = await res.json().catch(() => ({}));
        throw new Error(msg.message || "操作失败");
      }
      setTutorials((prev) =>
        prev.map((x) =>
          x.id === t.id ? { ...x, published: !x.published } : x,
        ),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "操作失败");
    } finally {
      setActionLoading(null);
    }
  };

  /**
   * 删除教程
   */
  const handleDelete = async (t: Tutorial) => {
    if (!token) return;
    if (
      !window.confirm(
        `确定要删除${isVideo ? "视频" : "图文"}教程「${t.title}」吗？\n\n此操作不可恢复。`,
      )
    ) {
      return;
    }
    setActionLoading(t.id);
    try {
      const res = await fetch(`/api/admin/tutorials/${t.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const msg = await res.json().catch(() => ({}));
        throw new Error(msg.message || "删除失败");
      }
      setTutorials((prev) => prev.filter((x) => x.id !== t.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "删除失败");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-5">
      {/* 顶部工具栏 */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          共 {tutorials.length} 条{isVideo ? "视频" : "图文"}教程
        </p>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] bg-gradient-to-r from-primary to-primary-500 px-4 py-2 text-sm font-semibold text-white shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] transition-colors"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          新建{isVideo ? "视频" : "图文"}教程
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
        ) : tutorials.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-sm text-muted-foreground">
              暂无{isVideo ? "视频" : "图文"}教程
            </p>
            <button
              onClick={openCreateModal}
              className="mt-3 text-sm font-medium text-primary hover:text-primary-hover"
            >
              新建第一个{isVideo ? "视频" : "图文"}教程 →
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-muted/50 text-xs uppercase tracking-wider font-medium text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">封面</th>
                  <th className="px-4 py-3 font-medium">标题</th>
                  <th className="px-4 py-3 font-medium">分类</th>
                  <th className="px-4 py-3 font-medium">学习人数</th>
                  <th className="px-4 py-3 font-medium">浏览次数</th>
                  <th className="px-4 py-3 font-medium">权限</th>
                  <th className="px-4 py-3 font-medium">状态</th>
                  <th className="px-4 py-3 text-right font-medium">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {tutorials.map((t) => (
                  <tr key={t.id} className="hover:bg-muted/30 transition-colors duration-100">
                    <td className="px-4 py-3">
                      {t.cover ? (
                        <img
                          src={t.cover}
                          alt={t.title}
                          className="h-10 w-16 flex-shrink-0 rounded object-cover"
                        />
                      ) : (
                        <div className="flex h-10 w-16 items-center justify-center rounded bg-muted text-[10px] text-muted-foreground">
                          无封面
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{t.title}</p>
                      {t.excerpt && (
                        <p className="truncate text-xs text-muted-foreground">
                          {t.excerpt}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {t.category || "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {t.studyCount}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {t.viewCount}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          t.accessLevel === "vip"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-success-100 text-success-700"
                        }`}
                      >
                        {t.accessLevel === "vip" ? "VIP" : "免费"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          t.published
                            ? "bg-success-100 text-success-700"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {t.published ? "已发布" : "未发布"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(t)}
                          disabled={actionLoading === t.id}
                          className="text-xs font-medium text-primary hover:text-primary-hover disabled:opacity-50"
                        >
                          编辑
                        </button>
                        <button
                          onClick={() => handleTogglePublished(t)}
                          disabled={actionLoading === t.id}
                          className="text-xs font-medium text-muted-foreground hover:text-foreground disabled:opacity-50"
                        >
                          {t.published ? "下架" : "发布"}
                        </button>
                        <button
                          onClick={() => handleDelete(t)}
                          disabled={actionLoading === t.id}
                          className="text-xs font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
                        >
                          删除
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 新建/编辑模态框 */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
            onClick={closeModal}
            aria-hidden="true"
          />

          <div className="relative z-10 max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[var(--radius-sm)] border border-border bg-card shadow-[var(--shadow-lg)]">
            {/* 头部 */}
            <div className="flex items-center justify-between border-b border-border px-5 py-4 sticky top-0 bg-card z-10">
              <h2 className="text-base font-semibold text-foreground">
                {editingId
                  ? `编辑${isVideo ? "视频" : "图文"}教程`
                  : `新建${isVideo ? "视频" : "图文"}教程`}
              </h2>
              <button
                onClick={closeModal}
                disabled={submitting}
                className="text-muted-foreground hover:text-foreground disabled:opacity-50"
                aria-label="关闭"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* 表单 */}
            <form onSubmit={handleSubmit} className="space-y-5 p-5">
              {submitError && (
                <div className="rounded-[var(--radius-sm)] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {submitError}
                </div>
              )}

              {/* 标题 + 分类 */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">
                    标题 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => updateField("title", e.target.value)}
                    placeholder={isVideo ? "如：5 分钟学会视频剪辑" : "如：如何写好提示词"}
                    className={`w-full rounded-[var(--radius-sm)] border px-3 py-2 text-sm focus:border-primary/50 focus:shadow-[var(--glow-primary)] focus:outline-none transition-all duration-200 ${
                      formErrors.title ? "border-red-300" : "border-border"
                    }`}
                  />
                  {formErrors.title && (
                    <p className="mt-1 text-xs text-red-600">{formErrors.title}</p>
                  )}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">
                    分类
                  </label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => updateField("category", e.target.value)}
                    placeholder="如：入门教程"
                    className="w-full rounded-[var(--radius-sm)] border border-border px-3 py-2 text-sm focus:border-primary/50 focus:shadow-[var(--glow-primary)] focus:outline-none transition-all duration-200"
                  />
                </div>
              </div>

              {/* 封面 */}
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">
                  封面图
                </label>
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    {formData.cover ? (
                      <img
                        src={formData.cover}
                        alt="预览"
                        className="h-24 w-40 rounded-[var(--radius-sm)] border border-border object-cover"
                      />
                    ) : (
                      <div className="flex h-24 w-40 items-center justify-center rounded-[var(--radius-sm)] border border-dashed border-border bg-background">
                        <span className="text-xs text-muted-foreground">暂无封面</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-[var(--radius-sm)] border border-border bg-card px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {coverUploading ? "上传中..." : "选择图片"}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        onChange={handleCoverUpload}
                        disabled={coverUploading || submitting}
                        className="hidden"
                      />
                    </label>
                    {coverUploadError && (
                      <p className="mt-2 text-xs text-red-600">{coverUploadError}</p>
                    )}
                    <p className="mt-2 text-xs text-muted-foreground">
                      支持 JPG/PNG/WebP/GIF，建议尺寸 800×450
                    </p>
                    {formData.cover && (
                      <button
                        type="button"
                        onClick={() => updateField("cover", null)}
                        className="mt-2 text-xs font-medium text-red-600 hover:text-red-700"
                      >
                        移除封面
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* 摘要 */}
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">
                  摘要
                </label>
                <textarea
                  value={formData.excerpt}
                  onChange={(e) => updateField("excerpt", e.target.value)}
                  placeholder="教程摘要，将展示在列表中..."
                  rows={2}
                  className="w-full rounded-[var(--radius-sm)] border border-border px-3 py-2 text-sm focus:border-primary/50 focus:shadow-[var(--glow-primary)] focus:outline-none transition-all duration-200"
                />
              </div>

              {/* 内容 / 视频地址（按类型显示） */}
              {isVideo ? (
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">
                    视频地址 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="url"
                    value={formData.videoUrl}
                    onChange={(e) => updateField("videoUrl", e.target.value)}
                    placeholder="https://...mp4 或 CDN 地址"
                    className={`w-full rounded-[var(--radius-sm)] border px-3 py-2 text-sm focus:border-primary/50 focus:shadow-[var(--glow-primary)] focus:outline-none transition-all duration-200 ${
                      formErrors.videoUrl ? "border-red-300" : "border-border"
                    }`}
                  />
                  {formErrors.videoUrl && (
                    <p className="mt-1 text-xs text-red-600">{formErrors.videoUrl}</p>
                  )}
                </div>
              ) : (
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">
                    图文内容
                  </label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => updateField("content", e.target.value)}
                    placeholder="支持 Markdown / HTML..."
                    rows={10}
                    className="w-full rounded-[var(--radius-sm)] border border-border px-3 py-2 text-sm font-mono focus:border-primary/50 focus:shadow-[var(--glow-primary)] focus:outline-none transition-all duration-200"
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    支持 Markdown 语法，前台渲染为富文本
                  </p>
                </div>
              )}

              {/* 排序 + 权限 + 发布 */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">
                    排序值（越小越靠前）
                  </label>
                  <input
                    type="number"
                    value={formData.sortOrder}
                    onChange={(e) =>
                      updateField("sortOrder", Number(e.target.value) || 0)
                    }
                    className="w-full rounded-[var(--radius-sm)] border border-border px-3 py-2 text-sm focus:border-primary/50 focus:shadow-[var(--glow-primary)] focus:outline-none transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">
                    学习权限
                  </label>
                  <select
                    value={formData.accessLevel}
                    onChange={(e) =>
                      updateField(
                        "accessLevel",
                        e.target.value as "free" | "vip",
                      )
                    }
                    className="w-full rounded-[var(--radius-sm)] border border-border px-3 py-2 text-sm focus:border-primary/50 focus:shadow-[var(--glow-primary)] focus:outline-none transition-all duration-200"
                  >
                    <option value="free">免费</option>
                    <option value="vip">VIP</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">
                    发布状态
                  </label>
                  <select
                    value={formData.published ? "true" : "false"}
                    onChange={(e) =>
                      updateField("published", e.target.value === "true")
                    }
                    className="w-full rounded-[var(--radius-sm)] border border-border px-3 py-2 text-sm focus:border-primary/50 focus:shadow-[var(--glow-primary)] focus:outline-none transition-all duration-200"
                  >
                    <option value="false">未发布</option>
                    <option value="true">已发布</option>
                  </select>
                </div>
              </div>

              {/* 学习人数 + 浏览次数 */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">
                    学习人数
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formData.studyCount}
                    onChange={(e) =>
                      updateField("studyCount", Number(e.target.value) || 0)
                    }
                    className="w-full rounded-[var(--radius-sm)] border border-border px-3 py-2 text-sm focus:border-primary/50 focus:shadow-[var(--glow-primary)] focus:outline-none transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">
                    浏览次数
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formData.viewCount}
                    onChange={(e) =>
                      updateField("viewCount", Number(e.target.value) || 0)
                    }
                    className="w-full rounded-[var(--radius-sm)] border border-border px-3 py-2 text-sm focus:border-primary/50 focus:shadow-[var(--glow-primary)] focus:outline-none transition-all duration-200"
                  />
                </div>
              </div>

              {/* 操作按钮 */}
              <div className="flex items-center justify-end gap-3 border-t border-border pt-4 sticky bottom-0 bg-card">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={submitting}
                  className="rounded-[var(--radius-sm)] border border-border bg-card px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted disabled:opacity-50"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={submitting || coverUploading}
                  className="rounded-[var(--radius-sm)] bg-gradient-to-r from-primary to-primary-500 px-6 py-2 text-sm font-semibold text-white shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] transition-colors disabled:opacity-50"
                >
                  {submitting ? "提交中..." : editingId ? "保存修改" : "创建教程"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

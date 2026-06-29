"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";

/**
 * 轮播图列表项（对应 /api/admin/carousel 返回）
 */
interface CarouselSlide {
  id: string;
  title: string;
  description: string | null;
  image: string;
  link: string | null;
  badge: string | null;
  sortOrder: number;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * 表单数据
 */
interface SlideFormData {
  title: string;
  description: string;
  image: string | null;
  link: string;
  badge: string;
  sortOrder: number;
  published: boolean;
}

/**
 * 默认表单数据（新建模式）
 */
function getDefaultFormData(): SlideFormData {
  return {
    title: "",
    description: "",
    image: null,
    link: "",
    badge: "",
    sortOrder: 0,
    published: false,
  };
}

/**
 * 将列表项适配为表单数据（编辑模式）
 */
function adaptSlideToForm(slide: CarouselSlide): SlideFormData {
  return {
    title: slide.title,
    description: slide.description ?? "",
    image: slide.image,
    link: slide.link ?? "",
    badge: slide.badge ?? "",
    sortOrder: slide.sortOrder,
    published: slide.published,
  };
}

/**
 * 后台轮播图管理页面
 *
 * - 列表表格：缩略图、标题、链接、排序、状态、操作
 * - 新增/编辑通过模态框表单
 * - 删除二次确认
 */
export default function AdminCarouselPage() {
  const { token } = useAuth();

  // 列表数据
  const [slides, setSlides] = useState<CarouselSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 模态框状态
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<SlideFormData>(getDefaultFormData);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // 图片上传状态
  const [imageUploading, setImageUploading] = useState(false);
  const [imageUploadError, setImageUploadError] = useState<string | null>(
    null,
  );

  // 操作中状态（防止重复点击）
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  /**
   * 拉取轮播列表
   */
  const fetchSlides = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/carousel", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const msg = await res.json().catch(() => ({}));
        throw new Error(msg.message || `请求失败 (${res.status})`);
      }
      const data = (await res.json()) as { slides: CarouselSlide[] };
      setSlides(data.slides);
    } catch (err) {
      setError(err instanceof Error ? err.message : "获取列表失败");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchSlides();
  }, [fetchSlides]);

  /**
   * 打开新建模态框
   */
  const openCreateModal = () => {
    setEditingId(null);
    setFormData(getDefaultFormData());
    setFormErrors({});
    setSubmitError(null);
    setImageUploadError(null);
    setModalOpen(true);
  };

  /**
   * 打开编辑模态框
   */
  const openEditModal = (slide: CarouselSlide) => {
    setEditingId(slide.id);
    setFormData(adaptSlideToForm(slide));
    setFormErrors({});
    setSubmitError(null);
    setImageUploadError(null);
    setModalOpen(true);
  };

  /**
   * 关闭模态框
   */
  const closeModal = () => {
    if (submitting) return;
    setModalOpen(false);
  };

  /**
   * 更新单个字段
   */
  const updateField = <K extends keyof SlideFormData>(
    key: K,
    value: SlideFormData[K],
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
   * 上传图片
   */
  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;

    setImageUploading(true);
    setImageUploadError(null);
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
      updateField("image", data.url);
    } catch (err) {
      setImageUploadError(
        err instanceof Error ? err.message : "图片上传失败",
      );
    } finally {
      setImageUploading(false);
      e.target.value = "";
    }
  };

  /**
   * 表单校验
   */
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.title.trim()) {
      newErrors.title = "标题不能为空";
    }
    if (!formData.image) {
      newErrors.image = "请上传图片";
    }
    setFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * 提交表单（新建/更新）
   */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (!validate()) return;

    setSubmitting(true);
    setSubmitError(null);
    try {
      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        image: formData.image,
        link: formData.link.trim() || null,
        badge: formData.badge.trim() || null,
        sortOrder: formData.sortOrder,
        published: formData.published,
      };

      const isEdit = editingId !== null;
      const url = isEdit
        ? `/api/admin/carousel/${editingId}`
        : "/api/admin/carousel";
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

      // 关闭模态框 + 刷新列表
      setModalOpen(false);
      await fetchSlides();
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
  const handleTogglePublished = async (slide: CarouselSlide) => {
    if (!token) return;
    setActionLoading(slide.id);
    try {
      const res = await fetch(`/api/admin/carousel/${slide.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ published: !slide.published }),
      });
      if (!res.ok) {
        const msg = await res.json().catch(() => ({}));
        throw new Error(msg.message || "操作失败");
      }
      setSlides((prev) =>
        prev.map((s) =>
          s.id === slide.id ? { ...s, published: !s.published } : s,
        ),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "操作失败");
    } finally {
      setActionLoading(null);
    }
  };

  /**
   * 删除轮播
   */
  const handleDelete = async (slide: CarouselSlide) => {
    if (!token) return;
    if (
      !window.confirm(
        `确定要删除轮播图「${slide.title}」吗？\n\n此操作不可恢复。`,
      )
    ) {
      return;
    }
    setActionLoading(slide.id);
    try {
      const res = await fetch(`/api/admin/carousel/${slide.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const msg = await res.json().catch(() => ({}));
        throw new Error(msg.message || "删除失败");
      }
      setSlides((prev) => prev.filter((s) => s.id !== slide.id));
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
          共 {slides.length} 条轮播
        </p>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] bg-gradient-to-r from-primary to-primary-500 px-4 py-2 text-sm font-semibold text-white shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] transition-colors"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          新建轮播
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
        ) : slides.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-sm text-muted-foreground">暂无轮播图</p>
            <button
              onClick={openCreateModal}
              className="mt-3 text-sm font-medium text-primary hover:text-primary-hover"
            >
              新建第一个轮播 →
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-border bg-muted/50 text-xs uppercase tracking-wider font-medium text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">缩略图</th>
                  <th className="px-4 py-3 font-medium">标题</th>
                  <th className="px-4 py-3 font-medium">链接</th>
                  <th className="px-4 py-3 font-medium">标签</th>
                  <th className="px-4 py-3 font-medium">排序</th>
                  <th className="px-4 py-3 font-medium">状态</th>
                  <th className="px-4 py-3 text-right font-medium">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {slides.map((s) => (
                  <tr key={s.id} className="hover:bg-muted/30 transition-colors duration-100">
                    <td className="px-4 py-3">
                      <Image
                        src={s.image}
                        alt={s.title}
                        width={80}
                        height={40}
                        className="h-10 w-20 flex-shrink-0 rounded object-cover"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{s.title}</p>
                      {s.description && (
                        <p className="truncate text-xs text-muted-foreground">
                          {s.description}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 max-w-[200px]">
                      {s.link ? (
                        <a
                          href={s.link}
                          target="_blank"
                          rel="noreferrer"
                          className="truncate text-xs text-primary hover:text-primary-hover"
                        >
                          {s.link}
                        </a>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {s.badge ? (
                        <span className="inline-flex items-center rounded-full bg-primary-100 px-2 py-0.5 text-xs font-medium text-primary-700">
                          {s.badge}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {s.sortOrder}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          s.published
                            ? "bg-success-100 text-success-700"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {s.published ? "已发布" : "未发布"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(s)}
                          disabled={actionLoading === s.id}
                          className="text-xs font-medium text-primary hover:text-primary-hover disabled:opacity-50"
                        >
                          编辑
                        </button>
                        <button
                          onClick={() => handleTogglePublished(s)}
                          disabled={actionLoading === s.id}
                          className="text-xs font-medium text-muted-foreground hover:text-foreground disabled:opacity-50"
                        >
                          {s.published ? "下架" : "发布"}
                        </button>
                        <button
                          onClick={() => handleDelete(s)}
                          disabled={actionLoading === s.id}
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
          {/* 遮罩 */}
          <div
            className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
            onClick={closeModal}
            aria-hidden="true"
          />

          {/* 模态框主体 */}
          <div className="relative z-10 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[var(--radius-sm)] border border-border bg-card shadow-[var(--shadow-lg)]">
            {/* 头部 */}
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 className="text-base font-semibold text-foreground">
                {editingId ? "编辑轮播图" : "新建轮播图"}
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

              {/* 图片 */}
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">
                  轮播图图片 <span className="text-red-500">*</span>
                </label>
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    {formData.image ? (
                      <Image
                        src={formData.image}
                        alt="预览"
                        width={160}
                        height={96}
                        className="h-24 w-40 rounded-[var(--radius-sm)] border border-border object-cover"
                      />
                    ) : (
                      <div className="flex h-24 w-40 items-center justify-center rounded-[var(--radius-sm)] border border-dashed border-border bg-background">
                        <span className="text-xs text-muted-foreground">暂无图片</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-[var(--radius-sm)] border border-border bg-card px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {imageUploading ? "上传中..." : "选择图片"}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        onChange={handleImageUpload}
                        disabled={imageUploading || submitting}
                        className="hidden"
                      />
                    </label>
                    {imageUploadError && (
                      <p className="mt-2 text-xs text-red-600">{imageUploadError}</p>
                    )}
                    {formErrors.image && (
                      <p className="mt-2 text-xs text-red-600">{formErrors.image}</p>
                    )}
                    <p className="mt-2 text-xs text-muted-foreground">
                      支持 JPG/PNG/WebP/GIF，建议尺寸 1600×600
                    </p>
                    {formData.image && (
                      <button
                        type="button"
                        onClick={() => updateField("image", null)}
                        className="mt-2 text-xs font-medium text-red-600 hover:text-red-700"
                      >
                        移除图片
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* 标题 */}
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">
                  标题 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => updateField("title", e.target.value)}
                  placeholder="如：AI 创作大赛开启"
                  className={`w-full rounded-[var(--radius-sm)] border px-3 py-2 text-sm focus:border-primary/50 focus:shadow-[var(--glow-primary)] focus:outline-none transition-all duration-200 ${
                    formErrors.title ? "border-red-300" : "border-border"
                  }`}
                />
                {formErrors.title && (
                  <p className="mt-1 text-xs text-red-600">{formErrors.title}</p>
                )}
              </div>

              {/* 描述 */}
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">
                  描述
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => updateField("description", e.target.value)}
                  placeholder="轮播图描述文字..."
                  rows={2}
                  className="w-full rounded-[var(--radius-sm)] border border-border px-3 py-2 text-sm focus:border-primary/50 focus:shadow-[var(--glow-primary)] focus:outline-none transition-all duration-200"
                />
              </div>

              {/* 链接 + 标签 */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">
                    跳转链接
                  </label>
                  <input
                    type="url"
                    value={formData.link}
                    onChange={(e) => updateField("link", e.target.value)}
                    placeholder="https://..."
                    className="w-full rounded-[var(--radius-sm)] border border-border px-3 py-2 text-sm focus:border-primary/50 focus:shadow-[var(--glow-primary)] focus:outline-none transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">
                    标签（如：热门、新功能）
                  </label>
                  <input
                    type="text"
                    value={formData.badge}
                    onChange={(e) => updateField("badge", e.target.value)}
                    placeholder="如：热门"
                    className="w-full rounded-[var(--radius-sm)] border border-border px-3 py-2 text-sm focus:border-primary/50 focus:shadow-[var(--glow-primary)] focus:outline-none transition-all duration-200"
                  />
                </div>
              </div>

              {/* 排序 + 发布 */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                    发布状态
                  </label>
                  <div className="flex items-center gap-3 py-2">
                    <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-foreground">
                      <input
                        type="checkbox"
                        checked={formData.published}
                        onChange={(e) =>
                          updateField("published", e.target.checked)
                        }
                        className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                      />
                      {formData.published ? "已发布" : "未发布"}
                    </label>
                  </div>
                </div>
              </div>

              {/* 操作按钮 */}
              <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
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
                  disabled={submitting || imageUploading}
                  className="rounded-[var(--radius-sm)] bg-gradient-to-r from-primary to-primary-500 px-6 py-2 text-sm font-semibold text-white shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] transition-colors disabled:opacity-50"
                >
                  {submitting ? "提交中..." : editingId ? "保存修改" : "创建轮播"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

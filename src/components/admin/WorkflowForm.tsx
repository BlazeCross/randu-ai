"use client";

import { useState, type FormEvent } from "react";
import { useAuth } from "@/hooks/useAuth";
import SchemaBuilder, {
  type InputSchema,
} from "@/components/admin/SchemaBuilder";

/**
 * 工作流表单数据
 */
export interface WorkflowFormData {
  name: string;
  description: string;
  category: string;
  cozeWorkflowId: string;
  coverImage: string | null;
  inputSchema: InputSchema | null;
  outputType: "text" | "image" | "video";
  creditsRequired: number;
  source: "coze" | "volcengine";
  volcModel: string;
  icon: string;
  status: "active" | "inactive";
  feishuDocUrl: string;
  sortOrder: number;
}

/**
 * 编辑模式初始数据（从 API 获取的工作流详情）
 * 字段为 Prisma 返回的原始格式，需要转换
 */
export interface WorkflowInitialData {
  id?: string;
  name?: string;
  description?: string | null;
  category?: string;
  cozeWorkflowId?: string;
  coverImage?: string | null;
  inputSchema?: unknown;
  outputType?: string;
  creditsRequired?: number;
  source?: string;
  volcModel?: string | null;
  icon?: string | null;
  status?: string;
  feishuDocUrl?: string | null;
  sortOrder?: number;
}

interface WorkflowFormProps {
  /** 编辑模式传入，新建模式不传 */
  initialData?: WorkflowInitialData | null;
  /** 提交回调，返回成功/失败 */
  onSubmit: (data: WorkflowFormData) => Promise<void>;
  /** 提交按钮文案 */
  submitLabel: string;
  /** 提交中状态（由父组件控制） */
  submitting?: boolean;
}

/**
 * 默认表单数据（新建模式）
 */
function getDefaultFormData(): WorkflowFormData {
  return {
    name: "",
    description: "",
    category: "",
    cozeWorkflowId: "",
    coverImage: null,
    inputSchema: null,
    outputType: "text",
    creditsRequired: 1,
    source: "coze",
    volcModel: "",
    icon: "",
    status: "active",
    feishuDocUrl: "",
    sortOrder: 0,
  };
}

/**
 * 将编辑模式的 initialData 转换为表单数据
 */
function adaptInitialData(
  data: WorkflowInitialData | null | undefined,
): WorkflowFormData {
  if (!data) return getDefaultFormData();

  // inputSchema 可能是 Prisma Json 字段，需要类型转换
  let inputSchema: InputSchema | null = null;
  if (data.inputSchema && typeof data.inputSchema === "object") {
    inputSchema = data.inputSchema as InputSchema;
  }

  return {
    name: data.name ?? "",
    description: data.description ?? "",
    category: data.category ?? "",
    cozeWorkflowId: data.cozeWorkflowId ?? "",
    coverImage: data.coverImage ?? null,
    inputSchema,
    outputType: (data.outputType as WorkflowFormData["outputType"]) ?? "text",
    creditsRequired: data.creditsRequired ?? 1,
    source: (data.source as WorkflowFormData["source"]) ?? "coze",
    volcModel: data.volcModel ?? "",
    icon: data.icon ?? "",
    status: (data.status as WorkflowFormData["status"]) ?? "active",
    feishuDocUrl: data.feishuDocUrl ?? "",
    sortOrder: data.sortOrder ?? 0,
  };
}

/**
 * 工作流表单组件（新建/编辑共享）
 *
 * - 表单字段：名称、描述、分类、Coze ID、来源、输出类型、消耗点数、状态、排序、飞书文档
 * - 封面上传：调用 /api/upload，得到 URL 后存入表单状态
 * - 参数定义器：使用 SchemaBuilder 可视化编辑 inputSchema
 * - 表单验证：name, category, cozeWorkflowId 必填；source=volcengine 时 volcModel 必填
 *
 * @example
 * <WorkflowForm
 *   initialData={workflow}
 *   onSubmit={async (data) => { await createWorkflow(data); }}
 *   submitLabel="创建工作流"
 * />
 */
export default function WorkflowForm({
  initialData,
  onSubmit,
  submitLabel,
  submitting = false,
}: WorkflowFormProps) {
  const { token } = useAuth();
  const [formData, setFormData] = useState<WorkflowFormData>(() =>
    adaptInitialData(initialData),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [coverUploading, setCoverUploading] = useState(false);
  const [coverUploadError, setCoverUploadError] = useState<string | null>(null);

  /**
   * 更新单个字段
   */
  const updateField = <K extends keyof WorkflowFormData>(
    key: K,
    value: WorkflowFormData[K],
  ) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    // 清除该字段的错误
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  /**
   * 上传封面图
   */
  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
      updateField("coverImage", data.url);
    } catch (err) {
      setCoverUploadError(
        err instanceof Error ? err.message : "封面上传失败",
      );
    } finally {
      setCoverUploading(false);
      // 清空 input，允许重复上传同一文件
      e.target.value = "";
    }
  };

  /**
   * 表单校验
   */
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "工作流名称不能为空";
    }
    if (!formData.category.trim()) {
      newErrors.category = "分类不能为空";
    }
    if (!formData.cozeWorkflowId.trim()) {
      newErrors.cozeWorkflowId = "Coze 工作流 ID 不能为空";
    }
    if (formData.source === "volcengine" && !formData.volcModel.trim()) {
      newErrors.volcModel = "来源为火山方舟时必须指定模型 ID";
    }
    if (formData.creditsRequired < 0) {
      newErrors.creditsRequired = "消耗点数必须 ≥ 0";
    }

    // 校验参数定义器中的字段 name 和 label
    if (formData.inputSchema?.fields) {
      const fieldErrors: string[] = [];
      formData.inputSchema.fields.forEach((f, i) => {
        if (!f.name.trim()) {
          fieldErrors.push(`第 ${i + 1} 个字段的"字段名"不能为空`);
        }
        if (!f.label.trim()) {
          fieldErrors.push(`第 ${i + 1} 个字段的"显示名"不能为空`);
        }
        if (f.type === "select" && (!f.options || f.options.length === 0)) {
          fieldErrors.push(`第 ${i + 1} 个字段是下拉选择，必须添加至少一个选项`);
        }
      });
      if (fieldErrors.length > 0) {
        newErrors.inputSchema = fieldErrors.join("；");
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * 表单提交
   */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 基本信息卡片 */}
      <section className="rounded-[var(--radius-sm)] border border-border bg-card p-5">
        <h3 className="mb-4 text-base font-semibold text-foreground">基本信息</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* 名称 */}
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">
              工作流名称 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => updateField("name", e.target.value)}
              placeholder="如 服装换装视频生成"
              className={`w-full rounded-[var(--radius-sm)] border px-3 py-2 text-sm focus:outline-none focus:ring-1 ${
                errors.name
                  ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                  : "border-border focus:border-primary focus:ring-primary"
              }`}
            />
            {errors.name && (
              <p className="mt-1 text-xs text-red-600">{errors.name}</p>
            )}
          </div>

          {/* 分类 */}
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">
              分类 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.category}
              onChange={(e) => updateField("category", e.target.value)}
              placeholder="如 视频生成"
              className={`w-full rounded-[var(--radius-sm)] border px-3 py-2 text-sm focus:outline-none focus:ring-1 ${
                errors.category
                  ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                  : "border-border focus:border-primary focus:ring-primary"
              }`}
            />
            {errors.category && (
              <p className="mt-1 text-xs text-red-600">{errors.category}</p>
            )}
          </div>

          {/* 描述 */}
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-foreground">
              描述
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => updateField("description", e.target.value)}
              placeholder="简要描述工作流功能..."
              rows={3}
              className="w-full rounded-[var(--radius-sm)] border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>
      </section>

      {/* 接入配置卡片 */}
      <section className="rounded-[var(--radius-sm)] border border-border bg-card p-5">
        <h3 className="mb-4 text-base font-semibold text-foreground">接入配置</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* 来源 */}
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">
              来源
            </label>
            <select
              value={formData.source}
              onChange={(e) =>
                updateField(
                  "source",
                  e.target.value as WorkflowFormData["source"],
                )
              }
              className="w-full rounded-[var(--radius-sm)] border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="coze">Coze 工作流</option>
              <option value="volcengine">火山方舟</option>
            </select>
          </div>

          {/* Coze 工作流 ID / 火山模型 ID */}
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">
              {formData.source === "coze" ? (
                <>Coze 工作流 ID <span className="text-red-500">*</span></>
              ) : (
                <>火山方舟接入点 ID <span className="text-red-500">*</span></>
              )}
            </label>
            <input
              type="text"
              value={formData.cozeWorkflowId}
              onChange={(e) => updateField("cozeWorkflowId", e.target.value)}
              placeholder={
                formData.source === "coze"
                  ? "如 7654310872097488946"
                  : "如 ep-20260626151538-ktdhg"
              }
              className={`w-full rounded-[var(--radius-sm)] border px-3 py-2 text-sm focus:outline-none focus:ring-1 ${
                errors.cozeWorkflowId
                  ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                  : "border-border focus:border-primary focus:ring-primary"
              }`}
            />
            {errors.cozeWorkflowId && (
              <p className="mt-1 text-xs text-red-600">{errors.cozeWorkflowId}</p>
            )}
          </div>

          {/* 火山模型 ID（仅 source=volcengine 时显示） */}
          {formData.source === "volcengine" && (
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">
                火山模型 ID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.volcModel}
                onChange={(e) => updateField("volcModel", e.target.value)}
                placeholder="如 ep-20260626151538-ktdhg"
                className={`w-full rounded-[var(--radius-sm)] border px-3 py-2 text-sm focus:outline-none focus:ring-1 ${
                  errors.volcModel
                    ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                    : "border-border focus:border-primary focus:ring-primary"
                }`}
              />
              {errors.volcModel && (
                <p className="mt-1 text-xs text-red-600">{errors.volcModel}</p>
              )}
            </div>
          )}

          {/* 输出类型 */}
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">
              输出类型
            </label>
            <select
              value={formData.outputType}
              onChange={(e) =>
                updateField(
                  "outputType",
                  e.target.value as WorkflowFormData["outputType"],
                )
              }
              className="w-full rounded-[var(--radius-sm)] border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="text">文本</option>
              <option value="image">图片</option>
              <option value="video">视频</option>
            </select>
          </div>

          {/* 消耗点数 */}
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">
              消耗点数
            </label>
            <input
              type="number"
              min={0}
              value={formData.creditsRequired}
              onChange={(e) =>
                updateField("creditsRequired", Number(e.target.value) || 0)
              }
              className={`w-full rounded-[var(--radius-sm)] border px-3 py-2 text-sm focus:outline-none focus:ring-1 ${
                errors.creditsRequired
                  ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                  : "border-border focus:border-primary focus:ring-primary"
              }`}
            />
            {errors.creditsRequired && (
              <p className="mt-1 text-xs text-red-600">{errors.creditsRequired}</p>
            )}
          </div>

          {/* 状态 */}
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">
              状态
            </label>
            <select
              value={formData.status}
              onChange={(e) =>
                updateField(
                  "status",
                  e.target.value as WorkflowFormData["status"],
                )
              }
              className="w-full rounded-[var(--radius-sm)] border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="active">上架</option>
              <option value="inactive">下架</option>
            </select>
          </div>

          {/* 排序 */}
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
              className="w-full rounded-[var(--radius-sm)] border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* 飞书文档 URL */}
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-foreground">
              飞书文档 URL（可选）
            </label>
            <input
              type="url"
              value={formData.feishuDocUrl}
              onChange={(e) => updateField("feishuDocUrl", e.target.value)}
              placeholder="https://..."
              className="w-full rounded-[var(--radius-sm)] border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>
      </section>

      {/* 封面图卡片 */}
      <section className="rounded-[var(--radius-sm)] border border-border bg-card p-5">
        <h3 className="mb-4 text-base font-semibold text-foreground">封面图</h3>
        <div className="flex items-start gap-4">
          {/* 预览 */}
          <div className="flex-shrink-0">
            {formData.coverImage ? (
              <img
                src={formData.coverImage}
                alt="封面预览"
                className="h-24 w-40 rounded-[var(--radius-sm)] border border-border object-cover"
              />
            ) : (
              <div className="flex h-24 w-40 items-center justify-center rounded-[var(--radius-sm)] border border-dashed border-border bg-background">
                <span className="text-xs text-muted-foreground">暂无封面</span>
              </div>
            )}
          </div>
          {/* 上传按钮 */}
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
                disabled={coverUploading}
                className="hidden"
              />
            </label>
            {coverUploadError && (
              <p className="mt-2 text-xs text-red-600">{coverUploadError}</p>
            )}
            <p className="mt-2 text-xs text-muted-foreground">
              支持 JPG/PNG/WebP/GIF，最大 5MB，建议尺寸 800×400
            </p>
            {formData.coverImage && (
              <button
                type="button"
                onClick={() => updateField("coverImage", null)}
                className="mt-2 text-xs font-medium text-red-600 hover:text-red-700"
              >
                移除封面
              </button>
            )}
          </div>
        </div>
      </section>

      {/* 参数定义器卡片 */}
      <section className="rounded-[var(--radius-sm)] border border-border bg-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-foreground">
              输入参数定义
            </h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              定义工作流所需的输入参数，前台将自动生成对应表单
            </p>
          </div>
        </div>
        <SchemaBuilder
          value={formData.inputSchema}
          onChange={(value) => updateField("inputSchema", value)}
        />
        {errors.inputSchema && (
          <p className="mt-3 text-xs text-red-600">{errors.inputSchema}</p>
        )}
      </section>

      {/* 提交按钮 */}
      <div className="flex items-center justify-end gap-3">
        <button
          type="submit"
          disabled={submitting || coverUploading}
          className="rounded-[var(--radius-sm)] bg-primary px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
        >
          {submitting ? "提交中..." : submitLabel}
        </button>
      </div>
    </form>
  );
}

"use client";

import { useCallback, useMemo, useState } from "react";
import type { InputSchema, SchemaField } from "@/lib/schema";
import ImageUploader from "@/components/upload/ImageUploader";

/**
 * 表单值类型：字段名 → 值
 */
export type FormValues = Record<string, string | number | null>;

interface DynamicFormProps {
  /** 工作流参数定义 */
  schema: InputSchema;
  /** 提交回调：传入表单值对象 */
  onSubmit: (values: FormValues) => void | Promise<void>;
  /** 提交按钮文案，默认"提交任务" */
  submitLabel?: string;
  /** 是否提交中（禁用按钮） */
  submitting?: boolean;
  /** 是否禁用提交（外部条件未满足时，如试用次数用完） */
  disabled?: boolean;
  /** 禁用时的提示文案 */
  disabledHint?: string;
}

/**
 * 加载中旋转图标
 */
function Spinner({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      className={`${className} animate-spin`}
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth={4}
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

/**
 * 前台动态表单：根据后台定义的 inputSchema 自动渲染输入控件
 *
 * 支持字段类型：
 * - text：单行文本输入框
 * - textarea：多行文本输入框
 * - number：数字输入框
 * - image：图片上传组件（复用 ImageUploader）
 * - select：下拉选择框
 *
 * 提交时按字段名构造 { [name]: value } 对象传给父组件
 *
 * @example
 * <DynamicForm
 *   schema={workflow.inputSchema}
 *   onSubmit={(values) => handleRun(values)}
 *   submitting={isPolling}
 * />
 */
export default function DynamicForm({
  schema,
  onSubmit,
  submitLabel = "提交任务",
  submitting = false,
  disabled = false,
  disabledHint,
}: DynamicFormProps) {
  // 初始化表单值：每个字段使用 defaultValue 或空值
  const initialValues = useMemo<FormValues>(() => {
    const values: FormValues = {};
    for (const field of schema.fields) {
      if (field.defaultValue !== undefined && field.defaultValue !== null) {
        values[field.name] = field.defaultValue;
      } else {
        // image 类型默认空字符串，便于 ImageUploader 的 currentImage="" 处理
        values[field.name] = "";
      }
    }
    return values;
  }, [schema]);

  const [values, setValues] = useState<FormValues>(initialValues);
  // 校验错误：字段名 → 错误信息
  const [errors, setErrors] = useState<Record<string, string>>({});

  /**
   * 更新单个字段值
   */
  const setFieldValue = useCallback(
    (name: string, value: string | number | null) => {
      setValues((prev) => ({ ...prev, [name]: value }));
      // 清除该字段的错误
      if (errors[name]) {
        setErrors((prev) => {
          const next = { ...prev };
          delete next[name];
          return next;
        });
      }
    },
    [errors],
  );

  /**
   * 校验所有必填字段
   * @returns 是否校验通过
   */
  const validate = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};
    for (const field of schema.fields) {
      if (!field.required) continue;
      const value = values[field.name];
      const isEmpty =
        value === undefined ||
        value === null ||
        value === "" ||
        (typeof value === "string" && value.trim() === "");
      if (isEmpty) {
        newErrors[field.name] = `请填写「${field.label}」`;
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [schema.fields, values]);

  /**
   * 提交表单
   */
  const handleSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      if (submitting || disabled) return;

      if (!validate()) return;

      // 构造提交值：空字符串字段转为 undefined（不发送）
      const submitValues: FormValues = {};
      for (const field of schema.fields) {
        const v = values[field.name];
        if (v === "" || v === undefined || v === null) {
          // 非必填空值：跳过
          continue;
        }
        submitValues[field.name] = v;
      }

      await onSubmit(submitValues);
    },
    [submitting, disabled, validate, values, schema.fields, onSubmit],
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 逐字段渲染 */}
      {schema.fields.map((field) => (
        <FieldRenderer
          key={field.name}
          field={field}
          value={values[field.name]}
          error={errors[field.name]}
          onChange={(v) => setFieldValue(field.name, v)}
        />
      ))}

      {/* 提交按钮 */}
      <button
        type="submit"
        disabled={submitting || disabled}
        className="flex w-full items-center justify-center rounded-[var(--radius-sm)] bg-primary px-5 py-3.5 text-base font-semibold text-primary-foreground transition-all hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100"
      >
        {submitting ? (
          <>
            <Spinner className="mr-2 h-5 w-5" />
            提交中...
          </>
        ) : disabled ? (
          disabledHint || "暂不可用"
        ) : (
          submitLabel
        )}
      </button>
    </form>
  );
}

/**
 * 单个字段渲染器：根据字段类型分发到对应的输入控件
 */
function FieldRenderer({
  field,
  value,
  error,
  onChange,
}: {
  field: SchemaField;
  value: string | number | null | undefined;
  error?: string;
  onChange: (value: string | number | null) => void;
}) {
  return (
    <div>
      {/* 字段标签 */}
      <label className="mb-2 block text-sm font-semibold text-foreground">
        {field.label}
        {field.required && <span className="ml-0.5 text-red-500">*</span>}
      </label>

      {/* 字段控件（按类型分发） */}
      {field.type === "text" && (
        <input
          type="text"
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          className="w-full rounded-[var(--radius-sm)] border border-border bg-card px-4 py-2.5 text-sm transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      )}

      {field.type === "textarea" && (
        <textarea
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          rows={4}
          className="w-full rounded-[var(--radius-sm)] border border-border bg-card px-4 py-2.5 text-sm transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      )}

      {field.type === "number" && (
        <input
          type="number"
          value={value === null || value === undefined ? "" : String(value)}
          onChange={(e) => {
            const v = e.target.value;
            onChange(v === "" ? "" : Number(v));
          }}
          placeholder={field.placeholder}
          className="w-full rounded-[var(--radius-sm)] border border-border bg-card px-4 py-2.5 text-sm transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      )}

      {field.type === "select" && (
        <select
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-[var(--radius-sm)] border border-border bg-card px-4 py-2.5 text-sm transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="">
            {field.placeholder || "请选择"}
          </option>
          {field.options?.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      )}

      {field.type === "image" && (
        <ImageUploader
          currentImage={(value as string) ?? ""}
          onUploadSuccess={(url) => onChange(url)}
        />
      )}

      {/* 字段错误提示 */}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}

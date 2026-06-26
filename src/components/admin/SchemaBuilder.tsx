"use client";

import { useCallback } from "react";
// 重新导出共享类型，便于现有引用保持兼容
export type { SchemaField, InputSchema } from "@/lib/schema";
import type { SchemaField, InputSchema } from "@/lib/schema";

// 字段类型选项
const FIELD_TYPES: { value: SchemaField["type"]; label: string; desc: string }[] = [
  { value: "text", label: "单行文本", desc: "短文本输入" },
  { value: "textarea", label: "多行文本", desc: "长文本输入" },
  { value: "number", label: "数字", desc: "数值输入" },
  { value: "image", label: "图片上传", desc: "上传图片文件" },
  { value: "select", label: "下拉选择", desc: "从选项中选择" },
];

/**
 * 创建空字段（默认值）
 */
function createEmptyField(): SchemaField {
  return {
    name: "",
    label: "",
    type: "text",
    required: false,
    placeholder: "",
    defaultValue: null,
  };
}

interface SchemaBuilderProps {
  /** 当前 inputSchema（受控） */
  value: InputSchema | null;
  /** 字段变化回调 */
  onChange: (value: InputSchema) => void;
}

/**
 * 参数定义器：可视化编辑 inputSchema
 *
 * - 字段列表：每个字段一个卡片，支持增删改
 * - 字段属性：name, label, type, required, placeholder, defaultValue, options
 * - select 类型时显示 options 编辑器
 * - 字段顺序可通过上移/下移调整
 *
 * @example
 * const [schema, setSchema] = useState<InputSchema | null>(null);
 * <SchemaBuilder value={schema} onChange={setSchema} />
 */
export default function SchemaBuilder({
  value,
  onChange,
}: SchemaBuilderProps) {
  const fields = value?.fields ?? [];

  /**
   * 更新指定索引的字段
   */
  const updateField = useCallback(
    (index: number, patch: Partial<SchemaField>) => {
      const newFields = fields.map((f, i) =>
        i === index ? { ...f, ...patch } : f,
      );
      onChange({ fields: newFields });
    },
    [fields, onChange],
  );

  /**
   * 添加新字段
   */
  const addField = () => {
    onChange({ fields: [...fields, createEmptyField()] });
  };

  /**
   * 删除指定索引的字段
   */
  const removeField = (index: number) => {
    onChange({ fields: fields.filter((_, i) => i !== index) });
  };

  /**
   * 移动字段顺序
   */
  const moveField = (index: number, direction: "up" | "down") => {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === fields.length - 1) return;
    const newFields = [...fields];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    [newFields[index], newFields[targetIndex]] = [
      newFields[targetIndex],
      newFields[index],
    ];
    onChange({ fields: newFields });
  };

  /**
   * 更新 select 类型的 options（换行分隔）
   */
  const updateOptions = (index: number, text: string) => {
    const options = text
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    updateField(index, { options });
  };

  return (
    <div className="space-y-4">
      {/* 字段列表 */}
      {fields.length === 0 ? (
        <div className="rounded-lg border border-dashed border-neutral-300 bg-neutral-50 px-4 py-8 text-center">
          <p className="text-sm text-neutral-500">暂无字段</p>
          <p className="mt-1 text-xs text-neutral-400">
            添加字段后，前台将自动生成对应的表单输入项
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {fields.map((field, index) => (
            <div
              key={index}
              className="rounded-lg border border-neutral-200 bg-white p-4"
            >
              {/* 字段头部：序号 + 操作按钮 */}
              <div className="mb-3 flex items-center justify-between">
                <span className="inline-flex items-center gap-2 text-xs font-medium text-neutral-500">
                  <span className="flex h-5 w-5 items-center justify-center rounded bg-neutral-100 text-[10px]">
                    {index + 1}
                  </span>
                  字段
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => moveField(index, "up")}
                    disabled={index === 0}
                    className="rounded p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 disabled:opacity-30"
                    aria-label="上移"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => moveField(index, "down")}
                    disabled={index === fields.length - 1}
                    className="rounded p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 disabled:opacity-30"
                    aria-label="下移"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => removeField(index)}
                    className="rounded p-1 text-red-400 hover:bg-red-50 hover:text-red-600"
                    aria-label="删除"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* 字段属性表单 */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {/* 字段名（英文 name） */}
                <div>
                  <label className="mb-1 block text-xs font-medium text-neutral-600">
                    字段名 <span className="text-red-500">*</span>
                    <span className="ml-1 font-normal text-neutral-400">（前端 name 属性）</span>
                  </label>
                  <input
                    type="text"
                    value={field.name}
                    onChange={(e) => updateField(index, { name: e.target.value })}
                    placeholder="如 yuansitu"
                    className="w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                {/* 显示名（中文 label） */}
                <div>
                  <label className="mb-1 block text-xs font-medium text-neutral-600">
                    显示名 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={field.label}
                    onChange={(e) => updateField(index, { label: e.target.value })}
                    placeholder="如 原图"
                    className="w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                {/* 字段类型 */}
                <div>
                  <label className="mb-1 block text-xs font-medium text-neutral-600">
                    类型 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={field.type}
                    onChange={(e) =>
                      updateField(index, {
                        type: e.target.value as SchemaField["type"],
                      })
                    }
                    className="w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    {FIELD_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label} - {t.desc}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 是否必填 */}
                <div className="flex items-end">
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={field.required}
                      onChange={(e) =>
                        updateField(index, { required: e.target.checked })
                      }
                      className="h-4 w-4 rounded border-neutral-300 text-primary focus:ring-primary"
                    />
                    <span className="text-sm text-neutral-700">必填</span>
                  </label>
                </div>

                {/* 占位提示（非 image 类型） */}
                {field.type !== "image" && (
                  <div>
                    <label className="mb-1 block text-xs font-medium text-neutral-600">
                      占位提示
                    </label>
                    <input
                      type="text"
                      value={field.placeholder ?? ""}
                      onChange={(e) =>
                        updateField(index, { placeholder: e.target.value })
                      }
                      placeholder="如 请输入..."
                      className="w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                )}

                {/* 默认值（非 image、非 select 类型） */}
                {field.type !== "image" && field.type !== "select" && (
                  <div>
                    <label className="mb-1 block text-xs font-medium text-neutral-600">
                      默认值
                    </label>
                    <input
                      type={field.type === "number" ? "number" : "text"}
                      value={field.defaultValue?.toString() ?? ""}
                      onChange={(e) =>
                        updateField(index, {
                          defaultValue:
                            field.type === "number"
                              ? Number(e.target.value) || null
                              : e.target.value || null,
                        })
                      }
                      placeholder="可选"
                      className="w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                )}
              </div>

              {/* select 类型的选项编辑器 */}
              {field.type === "select" && (
                <div className="mt-3">
                  <label className="mb-1 block text-xs font-medium text-neutral-600">
                    选项列表 <span className="text-red-500">*</span>
                    <span className="ml-1 font-normal text-neutral-400">（每行一个选项）</span>
                  </label>
                  <textarea
                    value={(field.options ?? []).join("\n")}
                    onChange={(e) => updateOptions(index, e.target.value)}
                    placeholder={"商务\n休闲\n运动"}
                    rows={4}
                    className="w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  {field.options && field.options.length > 0 && (
                    <p className="mt-1 text-xs text-neutral-400">
                      已添加 {field.options.length} 个选项
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 添加字段按钮 */}
      <button
        type="button"
        onClick={addField}
        className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-neutral-300 bg-white py-2.5 text-sm font-medium text-neutral-600 transition-colors hover:border-primary hover:bg-primary-50 hover:text-primary-700"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        添加字段
      </button>
    </div>
  );
}

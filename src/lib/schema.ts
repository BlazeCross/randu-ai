/**
 * 工作流 inputSchema 共享类型定义
 *
 * 前后台共用：
 * - 后台 SchemaBuilder 编辑器（src/components/admin/SchemaBuilder.tsx）
 * - 前台 DynamicForm 动态表单（src/components/workflow/DynamicForm.tsx）
 * - 服务端 API 校验（/api/workflow/[id]/run）
 *
 * 数据库存储在 Workflow.inputSchema（Json? 类型）。
 */

/**
 * 单个字段定义（inputSchema.fields 元素）
 *
 * - name: 字段名（必填，提交时作为 Coze 工作流参数键名）
 * - label: 显示名（必填，前端 label 文本）
 * - type: 字段类型（必填）
 * - required: 是否必填
 * - placeholder: 占位提示
 * - defaultValue: 默认值（image 类型为 URL 字符串）
 * - options: 选项列表（仅 select 类型）
 */
export interface SchemaField {
  name: string;
  label: string;
  type: "text" | "textarea" | "number" | "image" | "select";
  required: boolean;
  placeholder?: string;
  defaultValue?: string | number | null;
  options?: string[];
}

/**
 * inputSchema 完整结构
 *
 * 工作流可以没有 inputSchema（null），此时前台使用默认行为
 * （兼容旧的"上传图片→生成视频"硬编码逻辑）
 */
export interface InputSchema {
  fields: SchemaField[];
}

/**
 * 工作流输出类型
 * - text：纯文本结果（如文案生成）
 * - image：图片结果（如 AI 绘画）
 * - video：视频结果（如服装换装）
 */
export type WorkflowOutputType = "text" | "image" | "video";

/**
 * 验证并解析 inputSchema
 *
 * 数据库中 inputSchema 是 Json 类型，可能是任意 JSON 值。
 * 本函数确保返回的要么是合法的 InputSchema 对象，要么是 null。
 *
 * @param raw 数据库中存储的原始值
 * @returns 合法的 InputSchema 或 null
 */
export function parseInputSchema(raw: unknown): InputSchema | null {
  if (!raw || typeof raw !== "object") return null;

  const obj = raw as Record<string, unknown>;
  const fieldsRaw = obj.fields;
  if (!Array.isArray(fieldsRaw)) return null;

  const fields: SchemaField[] = [];
  for (const item of fieldsRaw) {
    if (!item || typeof item !== "object") continue;
    const f = item as Record<string, unknown>;

    // name 与 type 是关键字段，缺失则跳过该字段
    const name = typeof f.name === "string" ? f.name.trim() : "";
    const type = typeof f.type === "string" ? f.type : "";
    if (!name || !type) continue;

    // 校验 type 是否合法
    if (!["text", "textarea", "number", "image", "select"].includes(type)) {
      continue;
    }

    fields.push({
      name,
      label: typeof f.label === "string" ? f.label : name,
      type: type as SchemaField["type"],
      required: Boolean(f.required),
      placeholder:
        typeof f.placeholder === "string" ? f.placeholder : undefined,
      defaultValue:
        f.defaultValue === undefined || f.defaultValue === null
          ? null
          : (f.defaultValue as string | number),
      options: Array.isArray(f.options)
        ? f.options.filter((o): o is string => typeof o === "string")
        : undefined,
    });
  }

  if (fields.length === 0) return null;
  return { fields };
}

/**
 * 验证并解析 outputType
 *
 * 默认为 "text"，非法值回退为 "text"
 */
export function parseOutputType(raw: unknown): WorkflowOutputType {
  if (
    raw === "text" ||
    raw === "image" ||
    raw === "video"
  ) {
    return raw;
  }
  return "text";
}

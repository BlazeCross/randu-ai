import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

/**
 * 更新工作流请求体（所有字段可选）
 */
interface UpdateWorkflowBody {
  name?: string;
  description?: string;
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

// 字段长度限制（与 route.ts 保持一致）
const NAME_MAX_LENGTH = 100;
const DESCRIPTION_MAX_LENGTH = 500;
const CATEGORY_MAX_LENGTH = 50;

// 允许的枚举值
const ALLOWED_OUTPUT_TYPES = ["text", "image", "video"];
const ALLOWED_SOURCES = ["coze", "volcengine"];
const ALLOWED_STATUSES = ["active", "inactive"];

/**
 * GET /api/admin/workflows/[id] - 获取单个工作流详情
 *
 * 返回完整字段，包含 inputSchema（编辑表单需要）。
 * 软删除的工作流也能查询（管理员可查看已删除的）。
 */
export const GET = requireAdmin(async (_request, { params }) => {
  const { id } = await params!;

  if (!id) {
    return NextResponse.json({ message: "缺少工作流 ID" }, { status: 400 });
  }

  const workflow = await prisma.workflow.findUnique({
    where: { id },
    include: {
      _count: {
        select: { usageLogs: true },
      },
    },
  });

  if (!workflow) {
    return NextResponse.json({ message: "工作流不存在" }, { status: 404 });
  }

  return NextResponse.json({ workflow });
});

/**
 * PATCH /api/admin/workflows/[id] - 更新工作流
 *
 * 仅更新请求体中提供的字段（部分更新）。
 * 校验规则与创建一致，但所有字段均为可选。
 *
 * 特殊处理：
 * - 若 source 改为 volcengine，需同时提供 volcModel
 *   （本次请求 body 或数据库已有值均算满足）
 */
export const PATCH = requireAdmin(async (request, { params }) => {
  const { id } = await params!;

  if (!id) {
    return NextResponse.json({ message: "缺少工作流 ID" }, { status: 400 });
  }

  const body = (await request.json().catch(() => ({}))) as UpdateWorkflowBody;

  // 先查询现有数据（用于 source/volcModel 联动校验）
  const existing = await prisma.workflow.findUnique({
    where: { id },
    select: { source: true, volcModel: true, isDeleted: true },
  });

  if (!existing || existing.isDeleted) {
    return NextResponse.json(
      { message: "工作流不存在或已删除" },
      { status: 404 },
    );
  }

  // 构建更新数据（仅包含 body 中提供的字段）
  const data: Record<string, unknown> = {};

  if (body.name !== undefined) {
    const name = body.name.trim();
    if (!name) {
      return NextResponse.json({ message: "工作流名称不能为空" }, { status: 400 });
    }
    if (name.length > NAME_MAX_LENGTH) {
      return NextResponse.json(
        { message: `工作流名称不能超过 ${NAME_MAX_LENGTH} 个字符` },
        { status: 400 },
      );
    }
    data.name = name;
  }

  if (body.description != null) {
    const description = body.description.trim();
    if (description.length > DESCRIPTION_MAX_LENGTH) {
      return NextResponse.json(
        { message: `描述不能超过 ${DESCRIPTION_MAX_LENGTH} 个字符` },
        { status: 400 },
      );
    }
    data.description = description || null;
  }

  if (body.category !== undefined) {
    const category = body.category.trim();
    if (!category) {
      return NextResponse.json({ message: "分类不能为空" }, { status: 400 });
    }
    if (category.length > CATEGORY_MAX_LENGTH) {
      return NextResponse.json(
        { message: `分类名称不能超过 ${CATEGORY_MAX_LENGTH} 个字符` },
        { status: 400 },
      );
    }
    data.category = category;
  }

  if (body.cozeWorkflowId !== undefined) {
    const cozeWorkflowId = body.cozeWorkflowId.trim();
    if (!cozeWorkflowId) {
      return NextResponse.json(
        { message: "Coze 工作流 ID 不能为空" },
        { status: 400 },
      );
    }
    data.cozeWorkflowId = cozeWorkflowId;
  }

  if (body.coverImage !== undefined) {
    data.coverImage = body.coverImage || null;
  }

  if (body.inputSchema !== undefined) {
    data.inputSchema = body.inputSchema as never;
  }

  if (body.outputType !== undefined) {
    if (!ALLOWED_OUTPUT_TYPES.includes(body.outputType)) {
      return NextResponse.json(
        { message: `输出类型无效，允许值：${ALLOWED_OUTPUT_TYPES.join(", ")}` },
        { status: 400 },
      );
    }
    data.outputType = body.outputType;
  }

  if (body.creditsRequired !== undefined) {
    const creditsRequired = Number(body.creditsRequired);
    if (!Number.isFinite(creditsRequired) || creditsRequired < 0) {
      return NextResponse.json(
        { message: "消耗点数必须为非负整数" },
        { status: 400 },
      );
    }
    data.creditsRequired = Math.floor(creditsRequired);
  }

  if (body.source !== undefined) {
    if (!ALLOWED_SOURCES.includes(body.source)) {
      return NextResponse.json(
        { message: `来源无效，允许值：${ALLOWED_SOURCES.join(", ")}` },
        { status: 400 },
      );
    }
    data.source = body.source;
  }

  if (body.volcModel !== undefined) {
    data.volcModel = body.volcModel?.trim() || null;
  }

  // source=volcengine 时 volcModel 必填校验（合并 body 与已有值）
  const finalSource = (data.source as string | undefined) ?? existing.source;
  const finalVolcModel =
    (data.volcModel as string | null | undefined) ?? existing.volcModel;
  if (finalSource === "volcengine" && !finalVolcModel) {
    return NextResponse.json(
      { message: "来源为火山方舟时必须指定 volcModel" },
      { status: 400 },
    );
  }

  if (body.icon !== undefined) {
    data.icon = body.icon || null;
  }

  if (body.status !== undefined) {
    if (!ALLOWED_STATUSES.includes(body.status)) {
      return NextResponse.json(
        { message: `状态无效，允许值：${ALLOWED_STATUSES.join(", ")}` },
        { status: 400 },
      );
    }
    data.status = body.status;
  }

  if (body.feishuDocUrl !== undefined) {
    data.feishuDocUrl = body.feishuDocUrl?.trim() || null;
  }

  if (body.sortOrder !== undefined) {
    const sortOrder = Number(body.sortOrder);
    if (!Number.isFinite(sortOrder)) {
      return NextResponse.json(
        { message: "排序值无效" },
        { status: 400 },
      );
    }
    data.sortOrder = Math.floor(sortOrder);
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ message: "没有需要更新的字段" }, { status: 400 });
  }

  try {
    const updated = await prisma.workflow.update({
      where: { id },
      data: data as never,
      select: {
        id: true,
        name: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ workflow: updated });
  } catch (error) {
    console.error("更新工作流失败:", error);
    return NextResponse.json({ message: "更新工作流失败" }, { status: 500 });
  }
});

/**
 * DELETE /api/admin/workflows/[id] - 软删除工作流
 *
 * 不真正删除记录，仅将 isDeleted 设为 true，保留数据用于历史查询。
 * 已软删除的工作流再次调用返回成功（幂等）。
 */
export const DELETE = requireAdmin(async (_request, { params }) => {
  const { id } = await params!;

  if (!id) {
    return NextResponse.json({ message: "缺少工作流 ID" }, { status: 400 });
  }

  const existing = await prisma.workflow.findUnique({
    where: { id },
    select: { isDeleted: true },
  });

  if (!existing) {
    return NextResponse.json({ message: "工作流不存在" }, { status: 404 });
  }

  if (existing.isDeleted) {
    // 幂等：已删除则直接返回成功
    return NextResponse.json({ ok: true, alreadyDeleted: true });
  }

  await prisma.workflow.update({
    where: { id },
    data: { isDeleted: true, status: "inactive" },
  });

  return NextResponse.json({ ok: true });
});

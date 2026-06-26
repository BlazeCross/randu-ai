import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

/**
 * 工作流列表项（后台用，含完整字段）
 */
interface AdminWorkflowListItem {
  id: string;
  name: string;
  description: string | null;
  category: string;
  cozeWorkflowId: string;
  coverImage: string | null;
  outputType: string;
  creditsRequired: number;
  source: string;
  volcModel: string | null;
  icon: string | null;
  status: string;
  isDeleted: boolean;
  feishuDocUrl: string | null;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
  _count: { usageLogs: number };
}

/**
 * 创建工作流请求体
 */
interface CreateWorkflowBody {
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

// 字段长度限制
const NAME_MAX_LENGTH = 100;
const DESCRIPTION_MAX_LENGTH = 500;
const CATEGORY_MAX_LENGTH = 50;

// 允许的枚举值
const ALLOWED_OUTPUT_TYPES = ["text", "image", "video"];
const ALLOWED_SOURCES = ["coze", "volcengine"];
const ALLOWED_STATUSES = ["active", "inactive"];

/**
 * GET /api/admin/workflows - 后台工作流列表
 *
 * 查询参数：
 * - page: 页码（默认 1）
 * - pageSize: 每页数量（默认 20，最大 100）
 * - search: 名称搜索（不区分大小写）
 * - category: 分类筛选
 * - status: 状态筛选（active | inactive）
 * - includeDeleted: 是否包含已软删除（默认 false）
 *
 * admin 及以上权限可调用。返回完整字段（含 coverImage、inputSchema 等）。
 */
export const GET = requireAdmin(async (request) => {
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const pageSize = Math.min(
    100,
    Math.max(1, parseInt(searchParams.get("pageSize") ?? "20", 10) || 20),
  );
  const search = searchParams.get("search")?.trim() || undefined;
  const category = searchParams.get("category")?.trim() || undefined;
  const status = searchParams.get("status")?.trim() || undefined;
  const includeDeleted = searchParams.get("includeDeleted") === "true";

  // 构建 where 条件
  const where: Record<string, unknown> = {};
  if (!includeDeleted) {
    where.isDeleted = false;
  }
  if (search) {
    where.name = { contains: search, mode: "insensitive" };
  }
  if (category) {
    where.category = category;
  }
  if (status && ALLOWED_STATUSES.includes(status)) {
    where.status = status;
  }

  // 并行查询列表和总数
  const [workflows, total] = await Promise.all([
    prisma.workflow.findMany({
      where,
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        _count: {
          select: { usageLogs: true },
        },
      },
    }),
    prisma.workflow.count({ where }),
  ]);

  const items: AdminWorkflowListItem[] = workflows.map((w) => ({
    id: w.id,
    name: w.name,
    description: w.description,
    category: w.category,
    cozeWorkflowId: w.cozeWorkflowId,
    coverImage: w.coverImage,
    outputType: w.outputType,
    creditsRequired: w.creditsRequired,
    source: w.source,
    volcModel: w.volcModel,
    icon: w.icon,
    status: w.status,
    isDeleted: w.isDeleted,
    feishuDocUrl: w.feishuDocUrl,
    sortOrder: w.sortOrder,
    createdAt: w.createdAt,
    updatedAt: w.updatedAt,
    _count: { usageLogs: w._count.usageLogs },
  }));

  return NextResponse.json({
    workflows: items,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  });
});

/**
 * POST /api/admin/workflows - 创建工作流
 *
 * 请求体字段见 CreateWorkflowBody。
 * 必填：name, category, cozeWorkflowId
 * 校验：
 * - name 非空且 ≤ 100 字符
 * - category 非空且 ≤ 50 字符
 * - cozeWorkflowId 非空
 * - outputType 必须在 ALLOWED_OUTPUT_TYPES 中
 * - source 必须在 ALLOWED_SOURCES 中
 * - source=volcengine 时 volcModel 必填
 * - status 必须在 ALLOWED_STATUSES 中
 *
 * 返回 201 + 创建的工作流（含 id）
 */
export const POST = requireAdmin(async (request) => {
  const body = (await request.json().catch(() => ({}))) as CreateWorkflowBody;

  // 字段校验
  const name = body.name?.trim();
  if (!name) {
    return NextResponse.json({ message: "工作流名称不能为空" }, { status: 400 });
  }
  if (name.length > NAME_MAX_LENGTH) {
    return NextResponse.json(
      { message: `工作流名称不能超过 ${NAME_MAX_LENGTH} 个字符` },
      { status: 400 },
    );
  }

  const category = body.category?.trim();
  if (!category) {
    return NextResponse.json({ message: "分类不能为空" }, { status: 400 });
  }
  if (category.length > CATEGORY_MAX_LENGTH) {
    return NextResponse.json(
      { message: `分类名称不能超过 ${CATEGORY_MAX_LENGTH} 个字符` },
      { status: 400 },
    );
  }

  const cozeWorkflowId = body.cozeWorkflowId?.trim();
  if (!cozeWorkflowId) {
    return NextResponse.json(
      { message: "Coze 工作流 ID 不能为空" },
      { status: 400 },
    );
  }

  const description = body.description?.trim() || null;
  if (description && description.length > DESCRIPTION_MAX_LENGTH) {
    return NextResponse.json(
      { message: `描述不能超过 ${DESCRIPTION_MAX_LENGTH} 个字符` },
      { status: 400 },
    );
  }

  // 枚举校验
  const outputType = body.outputType ?? "text";
  if (!ALLOWED_OUTPUT_TYPES.includes(outputType)) {
    return NextResponse.json(
      { message: `输出类型无效，允许值：${ALLOWED_OUTPUT_TYPES.join(", ")}` },
      { status: 400 },
    );
  }

  const source = body.source ?? "coze";
  if (!ALLOWED_SOURCES.includes(source)) {
    return NextResponse.json(
      { message: `来源无效，允许值：${ALLOWED_SOURCES.join(", ")}` },
      { status: 400 },
    );
  }

  const volcModel = body.volcModel?.trim() || null;
  if (source === "volcengine" && !volcModel) {
    return NextResponse.json(
      { message: "来源为火山方舟时必须指定 volcModel" },
      { status: 400 },
    );
  }

  const status = body.status ?? "active";
  if (!ALLOWED_STATUSES.includes(status)) {
    return NextResponse.json(
      { message: `状态无效，允许值：${ALLOWED_STATUSES.join(", ")}` },
      { status: 400 },
    );
  }

  // creditsRequired 必须 ≥ 0
  const creditsRequired = Number(body.creditsRequired ?? 1);
  if (!Number.isFinite(creditsRequired) || creditsRequired < 0) {
    return NextResponse.json(
      { message: "消耗点数必须为非负整数" },
      { status: 400 },
    );
  }

  try {
    const workflow = await prisma.workflow.create({
      data: {
        name,
        description,
        category,
        cozeWorkflowId,
        coverImage: body.coverImage || null,
        inputSchema: body.inputSchema as never,
        outputType,
        creditsRequired,
        source,
        volcModel,
        icon: body.icon || null,
        status,
        feishuDocUrl: body.feishuDocUrl?.trim() || null,
        sortOrder: body.sortOrder ?? 0,
      },
      select: { id: true, name: true, createdAt: true },
    });

    return NextResponse.json(
      { workflow },
      { status: 201 },
    );
  } catch (error) {
    console.error("创建工作流失败:", error);
    return NextResponse.json(
      { message: "创建工作流失败" },
      { status: 500 },
    );
  }
});

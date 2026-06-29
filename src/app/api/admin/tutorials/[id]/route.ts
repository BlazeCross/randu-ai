import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

/**
 * 更新教程请求体（所有字段可选）
 */
interface UpdateTutorialBody {
  type?: string;
  title?: string;
  category?: string | null;
  cover?: string | null;
  content?: string | null;
  videoUrl?: string | null;
  excerpt?: string | null;
  sortOrder?: number;
  published?: boolean;
  studyCount?: number;
  viewCount?: number;
  accessLevel?: string;
}

const ALLOWED_TYPES = ["article", "video"];
const ALLOWED_ACCESS_LEVELS = ["free", "vip"];

const TITLE_MAX_LENGTH = 200;
const CATEGORY_MAX_LENGTH = 50;
const EXCERPT_MAX_LENGTH = 500;

/**
 * GET /api/admin/tutorials/[id] - 获取单个教程详情
 */
export const GET = requireAdmin(async (_request, { params }) => {
  const { id } = await params!;

  if (!id) {
    return NextResponse.json({ message: "缺少教程 ID" }, { status: 400 });
  }

  const tutorial = await prisma.tutorial.findUnique({ where: { id } });

  if (!tutorial) {
    return NextResponse.json({ message: "教程不存在" }, { status: 404 });
  }

  return NextResponse.json({ tutorial });
});

/**
 * PUT /api/admin/tutorials/[id] - 更新教程
 *
 * 仅更新请求体中提供的字段（部分更新）。
 */
export const PUT = requireAdmin(async (request, { params }) => {
  const { id } = await params!;

  if (!id) {
    return NextResponse.json({ message: "缺少教程 ID" }, { status: 400 });
  }

  const body = (await request.json().catch(() => ({}))) as UpdateTutorialBody;

  const existing = await prisma.tutorial.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!existing) {
    return NextResponse.json({ message: "教程不存在" }, { status: 404 });
  }

  const data: Record<string, unknown> = {};

  if (body.type !== undefined) {
    if (!ALLOWED_TYPES.includes(body.type)) {
      return NextResponse.json(
        { message: `类型无效，允许值：${ALLOWED_TYPES.join(", ")}` },
        { status: 400 },
      );
    }
    data.type = body.type;
  }

  if (body.title !== undefined) {
    const title = body.title.trim();
    if (!title) {
      return NextResponse.json({ message: "标题不能为空" }, { status: 400 });
    }
    if (title.length > TITLE_MAX_LENGTH) {
      return NextResponse.json(
        { message: `标题不能超过 ${TITLE_MAX_LENGTH} 个字符` },
        { status: 400 },
      );
    }
    data.title = title;
  }

  if (body.category != null) {
    const category = body.category.trim();
    if (category.length > CATEGORY_MAX_LENGTH) {
      return NextResponse.json(
        { message: `分类不能超过 ${CATEGORY_MAX_LENGTH} 个字符` },
        { status: 400 },
      );
    }
    data.category = category || null;
  }

  if (body.cover !== undefined) {
    data.cover = body.cover?.trim() || null;
  }

  if (body.content !== undefined) {
    data.content = body.content ?? null;
  }

  if (body.videoUrl !== undefined) {
    data.videoUrl = body.videoUrl?.trim() || null;
  }

  if (body.excerpt != null) {
    const excerpt = body.excerpt.trim();
    if (excerpt.length > EXCERPT_MAX_LENGTH) {
      return NextResponse.json(
        { message: `摘要不能超过 ${EXCERPT_MAX_LENGTH} 个字符` },
        { status: 400 },
      );
    }
    data.excerpt = excerpt || null;
  }

  if (body.sortOrder !== undefined) {
    if (!Number.isFinite(body.sortOrder)) {
      return NextResponse.json({ message: "排序值无效" }, { status: 400 });
    }
    data.sortOrder = Math.floor(Number(body.sortOrder));
  }

  if (body.published !== undefined) {
    data.published = Boolean(body.published);
  }

  if (body.studyCount !== undefined) {
    if (!Number.isFinite(body.studyCount) || body.studyCount < 0) {
      return NextResponse.json(
        { message: "学习人数必须为非负整数" },
        { status: 400 },
      );
    }
    data.studyCount = Math.floor(Number(body.studyCount));
  }

  if (body.viewCount !== undefined) {
    if (!Number.isFinite(body.viewCount) || body.viewCount < 0) {
      return NextResponse.json(
        { message: "浏览次数必须为非负整数" },
        { status: 400 },
      );
    }
    data.viewCount = Math.floor(Number(body.viewCount));
  }

  if (body.accessLevel !== undefined) {
    if (!ALLOWED_ACCESS_LEVELS.includes(body.accessLevel)) {
      return NextResponse.json(
        { message: `访问级别无效，允许值：${ALLOWED_ACCESS_LEVELS.join(", ")}` },
        { status: 400 },
      );
    }
    data.accessLevel = body.accessLevel;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ message: "没有需要更新的字段" }, { status: 400 });
  }

  try {
    const updated = await prisma.tutorial.update({
      where: { id },
      data: data as never,
      select: { id: true, title: true, updatedAt: true },
    });

    return NextResponse.json({ tutorial: updated });
  } catch (error) {
    console.error("更新教程失败:", error);
    return NextResponse.json({ message: "更新教程失败" }, { status: 500 });
  }
});

/**
 * DELETE /api/admin/tutorials/[id] - 删除教程
 *
 * 物理删除（教程无软删除字段）。
 */
export const DELETE = requireAdmin(async (_request, { params }) => {
  const { id } = await params!;

  if (!id) {
    return NextResponse.json({ message: "缺少教程 ID" }, { status: 400 });
  }

  const existing = await prisma.tutorial.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!existing) {
    return NextResponse.json({ message: "教程不存在" }, { status: 404 });
  }

  try {
    await prisma.tutorial.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("删除教程失败:", error);
    return NextResponse.json({ message: "删除教程失败" }, { status: 500 });
  }
});

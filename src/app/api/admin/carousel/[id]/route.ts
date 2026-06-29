import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

/**
 * 更新轮播图请求体（所有字段可选）
 */
interface UpdateCarouselBody {
  title?: string;
  description?: string | null;
  image?: string;
  link?: string | null;
  badge?: string | null;
  sortOrder?: number;
  published?: boolean;
}

// 字段长度限制（与 route.ts 一致）
const TITLE_MAX_LENGTH = 100;
const DESCRIPTION_MAX_LENGTH = 300;
const LINK_MAX_LENGTH = 500;
const BADGE_MAX_LENGTH = 30;

/**
 * GET /api/admin/carousel/[id] - 获取单个轮播图详情
 */
export const GET = requireAdmin(async (_request, { params }) => {
  const { id } = await params!;

  if (!id) {
    return NextResponse.json({ message: "缺少轮播 ID" }, { status: 400 });
  }

  const slide = await prisma.carouselSlide.findUnique({ where: { id } });

  if (!slide) {
    return NextResponse.json({ message: "轮播图不存在" }, { status: 404 });
  }

  return NextResponse.json({ slide });
});

/**
 * PUT /api/admin/carousel/[id] - 更新轮播图
 *
 * 仅更新请求体中提供的字段（部分更新）。
 */
export const PUT = requireAdmin(async (request, { params }) => {
  const { id } = await params!;

  if (!id) {
    return NextResponse.json({ message: "缺少轮播 ID" }, { status: 400 });
  }

  const body = (await request.json().catch(() => ({}))) as UpdateCarouselBody;

  const existing = await prisma.carouselSlide.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!existing) {
    return NextResponse.json({ message: "轮播图不存在" }, { status: 404 });
  }

  // 构建更新数据（仅包含 body 中提供的字段）
  const data: Record<string, unknown> = {};

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

  if (body.image !== undefined) {
    const image = body.image.trim();
    if (!image) {
      return NextResponse.json({ message: "图片不能为空" }, { status: 400 });
    }
    data.image = image;
  }

  if (body.link != null) {
    const link = body.link.trim();
    if (link.length > LINK_MAX_LENGTH) {
      return NextResponse.json(
        { message: `链接不能超过 ${LINK_MAX_LENGTH} 个字符` },
        { status: 400 },
      );
    }
    data.link = link || null;
  }

  if (body.badge != null) {
    const badge = body.badge.trim();
    if (badge.length > BADGE_MAX_LENGTH) {
      return NextResponse.json(
        { message: `标签不能超过 ${BADGE_MAX_LENGTH} 个字符` },
        { status: 400 },
      );
    }
    data.badge = badge || null;
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

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ message: "没有需要更新的字段" }, { status: 400 });
  }

  try {
    const updated = await prisma.carouselSlide.update({
      where: { id },
      data: data as never,
      select: { id: true, title: true, updatedAt: true },
    });

    return NextResponse.json({ slide: updated });
  } catch (error) {
    console.error("更新轮播图失败:", error);
    return NextResponse.json({ message: "更新轮播图失败" }, { status: 500 });
  }
});

/**
 * DELETE /api/admin/carousel/[id] - 删除轮播图
 *
 * 物理删除（轮播图无软删除字段）。
 */
export const DELETE = requireAdmin(async (_request, { params }) => {
  const { id } = await params!;

  if (!id) {
    return NextResponse.json({ message: "缺少轮播 ID" }, { status: 400 });
  }

  const existing = await prisma.carouselSlide.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!existing) {
    return NextResponse.json({ message: "轮播图不存在" }, { status: 404 });
  }

  try {
    await prisma.carouselSlide.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("删除轮播图失败:", error);
    return NextResponse.json({ message: "删除轮播图失败" }, { status: 500 });
  }
});

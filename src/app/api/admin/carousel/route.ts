import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

/**
 * 创建轮播图请求体
 */
interface CreateCarouselBody {
  title?: string;
  description?: string | null;
  image?: string;
  link?: string | null;
  badge?: string | null;
  sortOrder?: number;
  published?: boolean;
}

// 字段长度限制
const TITLE_MAX_LENGTH = 100;
const DESCRIPTION_MAX_LENGTH = 300;
const LINK_MAX_LENGTH = 500;
const BADGE_MAX_LENGTH = 30;

/**
 * GET /api/admin/carousel - 后台轮播图列表
 *
 * 按 sortOrder 升序返回所有轮播（含未发布），admin 及以上权限可调用。
 */
export const GET = requireAdmin(async () => {
  const slides = await prisma.carouselSlide.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });

  return NextResponse.json({ slides });
});

/**
 * POST /api/admin/carousel - 新建轮播图
 *
 * 必填：title, image
 * 校验：title 非空且 ≤ 100 字符；image 非空
 * 返回 201 + 创建的轮播
 */
export const POST = requireAdmin(async (request) => {
  const body = (await request.json().catch(() => ({}))) as CreateCarouselBody;

  const title = body.title?.trim();
  if (!title) {
    return NextResponse.json({ message: "标题不能为空" }, { status: 400 });
  }
  if (title.length > TITLE_MAX_LENGTH) {
    return NextResponse.json(
      { message: `标题不能超过 ${TITLE_MAX_LENGTH} 个字符` },
      { status: 400 },
    );
  }

  const image = body.image?.trim();
  if (!image) {
    return NextResponse.json({ message: "图片不能为空" }, { status: 400 });
  }

  const description = body.description?.trim() || null;
  if (description && description.length > DESCRIPTION_MAX_LENGTH) {
    return NextResponse.json(
      { message: `描述不能超过 ${DESCRIPTION_MAX_LENGTH} 个字符` },
      { status: 400 },
    );
  }

  const link = body.link?.trim() || null;
  if (link && link.length > LINK_MAX_LENGTH) {
    return NextResponse.json(
      { message: `链接不能超过 ${LINK_MAX_LENGTH} 个字符` },
      { status: 400 },
    );
  }

  const badge = body.badge?.trim() || null;
  if (badge && badge.length > BADGE_MAX_LENGTH) {
    return NextResponse.json(
      { message: `标签不能超过 ${BADGE_MAX_LENGTH} 个字符` },
      { status: 400 },
    );
  }

  const sortOrder =
    Number.isFinite(body.sortOrder) ? Math.floor(Number(body.sortOrder)) : 0;

  try {
    const slide = await prisma.carouselSlide.create({
      data: {
        title,
        description,
        image,
        link,
        badge,
        sortOrder,
        published: Boolean(body.published),
      },
    });

    return NextResponse.json({ slide }, { status: 201 });
  } catch (error) {
    console.error("创建轮播图失败:", error);
    return NextResponse.json({ message: "创建轮播图失败" }, { status: 500 });
  }
});

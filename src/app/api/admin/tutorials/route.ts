import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

/**
 * 创建教程请求体
 */
interface CreateTutorialBody {
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

// 允许的教程类型
const ALLOWED_TYPES = ["article", "video"];
// 允许的访问级别
const ALLOWED_ACCESS_LEVELS = ["free", "vip"];

// 字段长度限制
const TITLE_MAX_LENGTH = 200;
const CATEGORY_MAX_LENGTH = 50;
const EXCERPT_MAX_LENGTH = 500;

/**
 * GET /api/admin/tutorials - 后台教程列表
 *
 * 查询参数：
 * - type: 类型筛选（article | video），不传则返回全部
 * - published: 发布状态筛选（true | false），不传则返回全部
 *
 * admin 及以上权限可调用。
 */
export const GET = requireAdmin(async (request) => {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type")?.trim() || undefined;
  const publishedParam = searchParams.get("published");

  const where: Record<string, unknown> = {};
  if (type && ALLOWED_TYPES.includes(type)) {
    where.type = type;
  }
  if (publishedParam === "true") {
    where.published = true;
  } else if (publishedParam === "false") {
    where.published = false;
  }

  const tutorials = await prisma.tutorial.findMany({
    where,
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });

  return NextResponse.json({ tutorials });
});

/**
 * POST /api/admin/tutorials - 新建教程
 *
 * 必填：type, title
 * 校验：
 * - type 必须在 ALLOWED_TYPES 中
 * - title 非空且 ≤ 200 字符
 * - accessLevel 必须在 ALLOWED_ACCESS_LEVELS 中
 * - type=video 时 videoUrl 推荐填写（不强制）
 *
 * 返回 201 + 创建的教程
 */
export const POST = requireAdmin(async (request) => {
  const body = (await request.json().catch(() => ({}))) as CreateTutorialBody;

  const type = body.type?.trim();
  if (!type) {
    return NextResponse.json({ message: "类型不能为空" }, { status: 400 });
  }
  if (!ALLOWED_TYPES.includes(type)) {
    return NextResponse.json(
      { message: `类型无效，允许值：${ALLOWED_TYPES.join(", ")}` },
      { status: 400 },
    );
  }

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

  const category = body.category?.trim() || null;
  if (category && category.length > CATEGORY_MAX_LENGTH) {
    return NextResponse.json(
      { message: `分类不能超过 ${CATEGORY_MAX_LENGTH} 个字符` },
      { status: 400 },
    );
  }

  const excerpt = body.excerpt?.trim() || null;
  if (excerpt && excerpt.length > EXCERPT_MAX_LENGTH) {
    return NextResponse.json(
      { message: `摘要不能超过 ${EXCERPT_MAX_LENGTH} 个字符` },
      { status: 400 },
    );
  }

  const accessLevel = body.accessLevel ?? "free";
  if (!ALLOWED_ACCESS_LEVELS.includes(accessLevel)) {
    return NextResponse.json(
      { message: `访问级别无效，允许值：${ALLOWED_ACCESS_LEVELS.join(", ")}` },
      { status: 400 },
    );
  }

  const sortOrder =
    Number.isFinite(body.sortOrder) ? Math.floor(Number(body.sortOrder)) : 0;

  const studyCount =
    Number.isFinite(body.studyCount) && Number(body.studyCount) >= 0
      ? Math.floor(Number(body.studyCount))
      : 0;

  const viewCount =
    Number.isFinite(body.viewCount) && Number(body.viewCount) >= 0
      ? Math.floor(Number(body.viewCount))
      : 0;

  try {
    const tutorial = await prisma.tutorial.create({
      data: {
        type,
        title,
        category,
        cover: body.cover?.trim() || null,
        content: body.content ?? null,
        videoUrl: body.videoUrl?.trim() || null,
        excerpt,
        sortOrder,
        published: Boolean(body.published),
        studyCount,
        viewCount,
        accessLevel,
      },
    });

    return NextResponse.json({ tutorial }, { status: 201 });
  } catch (error) {
    console.error("创建教程失败:", error);
    return NextResponse.json({ message: "创建教程失败" }, { status: 500 });
  }
});

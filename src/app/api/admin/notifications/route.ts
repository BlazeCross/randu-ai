import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

// 公告列表去重后的最大返回数
const MAX_ANNOUNCEMENTS = 20;

interface CreateBody {
  title?: unknown;
  content?: unknown;
  link?: unknown;
}

/**
 * GET /api/admin/notifications - 后台公告列表
 *
 * 返回最近的公告（去重后的）。
 * 公告是批量创建给所有用户的，因此同一条公告会有多条相同记录，
 * 这里按 title+content 去重，仅返回每条公告的一条代表记录。
 *
 * admin 及以上权限可调用。
 */
export const GET = requireAdmin(async () => {
  // 查询最近的公告记录（取较多条以便去重）
  const rawAnnouncements = await prisma.notification.findMany({
    where: { type: "announcement" },
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      id: true,
      title: true,
      content: true,
      link: true,
      createdAt: true,
    },
  });

  // 按 title+content 去重（同一条公告批量创建后内容相同）
  const seen = new Set<string>();
  const announcements: typeof rawAnnouncements = [];
  for (const a of rawAnnouncements) {
    const key = `${a.title}|${a.content ?? ""}`;
    if (seen.has(key)) continue;
    seen.add(key);
    announcements.push(a);
    if (announcements.length >= MAX_ANNOUNCEMENTS) break;
  }

  // 统计每条公告的接收人数（通过 title+content 匹配）
  const announcementStats = await Promise.all(
    announcements.map((a) =>
      prisma.notification.count({
        where: { type: "announcement", title: a.title, content: a.content },
      }),
    ),
  );

  const result = announcements.map((a, i) => ({
    id: a.id,
    title: a.title,
    content: a.content,
    link: a.link,
    createdAt: a.createdAt,
    recipientCount: announcementStats[i],
  }));

  return NextResponse.json({ announcements: result });
});

/**
 * POST /api/admin/notifications - 创建公告（广播给所有活跃用户）
 *
 * 请求体：
 * - title: 公告标题（必填，1-100 字）
 * - content: 公告内容（可选，最长 1000 字）
 * - link: 跳转链接（可选）
 *
 * 创建后会为每个活跃用户生成一条 type="announcement" 的通知，
 * 同时前台首页横幅会展示最新公告。
 *
 * admin 及以上权限可调用。
 */
export const POST = requireAdmin(async (request) => {
  let body: CreateBody;
  try {
    body = (await request.json()) as CreateBody;
  } catch {
    return NextResponse.json(
      { message: "请求体格式错误，需为 JSON" },
      { status: 400 },
    );
  }

  const title =
    typeof body.title === "string" ? body.title.trim() : "";
  if (!title) {
    return NextResponse.json(
      { message: "公告标题不能为空" },
      { status: 400 },
    );
  }
  if (title.length > 100) {
    return NextResponse.json(
      { message: "公告标题不能超过 100 字" },
      { status: 400 },
    );
  }

  const content =
    typeof body.content === "string" ? body.content.trim() : "";
  if (content.length > 1000) {
    return NextResponse.json(
      { message: "公告内容不能超过 1000 字" },
      { status: 400 },
    );
  }

  const link =
    typeof body.link === "string" && body.link.trim()
      ? body.link.trim()
      : null;

  // 查询所有活跃用户 ID
  const activeUsers = await prisma.user.findMany({
    where: { status: "active" },
    select: { id: true },
  });

  if (activeUsers.length === 0) {
    return NextResponse.json(
      { message: "没有活跃用户，公告未发送" },
      { status: 400 },
    );
  }

  // 批量创建公告通知
  await prisma.notification.createMany({
    data: activeUsers.map((u) => ({
      userId: u.id,
      type: "announcement",
      title,
      content: content || null,
      link,
    })),
  });

  return NextResponse.json({
    success: true,
    recipientCount: activeUsers.length,
  });
});

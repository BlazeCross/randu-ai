import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/notifications/announcement - 获取最新公告（公开接口）
 *
 * 返回最新的一条 type="announcement" 通知，用于前台首页横幅展示。
 * 无需鉴权，所有访客均可查看。
 * 公告是批量创建给所有用户的，这里只取最新一条即可。
 *
 * 响应：
 * - { announcement: { title, content, link, createdAt } } 或
 * - { announcement: null }（无公告时）
 */
export async function GET() {
  const announcement = await prisma.notification.findFirst({
    where: { type: "announcement" },
    orderBy: { createdAt: "desc" },
    select: {
      title: true,
      content: true,
      link: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ announcement });
}

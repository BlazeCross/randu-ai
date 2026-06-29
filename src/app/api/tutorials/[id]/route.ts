import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

/**
 * GET /api/tutorials/[id] - 获取单个教程详情
 *
 * - 需登录（requireAuth 守卫）
 * - free 教程：登录用户即可查看完整内容
 * - VIP 教程：需 isSubscribed=true 才能查看完整内容；未订阅返回 403 + 锁定标记
 *
 * 浏览次数（viewCount）+1（原子操作，失败不影响主流程）。
 */
export const GET = requireAuth(async (_request, { userId, params }) => {
  const { id } = await params!;

  if (!id) {
    return NextResponse.json({ message: "缺少教程 ID" }, { status: 400 });
  }

  const tutorial = await prisma.tutorial.findUnique({ where: { id } });

  if (!tutorial || !tutorial.published) {
    return NextResponse.json({ message: "教程不存在或未发布" }, { status: 404 });
  }

  // 异步累计浏览次数（不阻塞响应）
  prisma.tutorial
    .update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    })
    .catch(() => {
      // 忽略统计失败
    });

  // free 教程直接返回完整内容
  if (tutorial.accessLevel === "free") {
    return NextResponse.json({ tutorial });
  }

  // VIP 教程：需要登录且订阅
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isSubscribed: true, status: true },
  });

  if (!user) {
    return NextResponse.json({ message: "用户不存在" }, { status: 401 });
  }
  if (user.status === "blocked") {
    return NextResponse.json({ message: "账号已被封禁" }, { status: 403 });
  }
  if (!user.isSubscribed) {
    // 未订阅：返回摘要 + 锁定标记，便于前端引导订阅
    return NextResponse.json(
      {
        tutorial: {
          ...tutorial,
          content: null,
          videoUrl: null,
          locked: true,
        },
        message: "该教程为 VIP 内容，请订阅后查看",
      },
      { status: 403 },
    );
  }

  return NextResponse.json({ tutorial });
});

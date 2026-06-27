import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { ensureInviteCode, buildInviteUrl } from "@/lib/invite";

/**
 * GET /api/user/invite - 获取当前用户的邀请码与邀请统计
 *
 * 返回：{ inviteCode, inviteCount, inviteReward, inviteUrl }
 * 如果用户还没有邀请码，自动生成
 */
export const GET = requireAuth(async (_request, { userId }) => {
  try {
    // 确保用户拥有邀请码（不存在则生成）
    const inviteCode = await ensureInviteCode(userId);

    // 查询邀请统计
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        inviteCount: true,
        inviteReward: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { message: "用户不存在" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      inviteCode,
      inviteCount: user.inviteCount,
      inviteReward: user.inviteReward,
      inviteUrl: buildInviteUrl(inviteCode),
    });
  } catch (error) {
    console.error("获取邀请信息失败:", error);
    return NextResponse.json(
      { message: "服务器内部错误" },
      { status: 500 },
    );
  }
});

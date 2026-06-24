import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

// 试用期使用次数上限
const TRIAL_LIMIT = 10;
// 返回记录条数上限
const USAGE_LOG_LIMIT = 50;

// 获取当前用户的使用记录（需鉴权）
export const GET = requireAuth(async (_request, { userId }) => {
  try {
    // 查询用户以获取试用期到期时间
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { trialExpiresAt: true },
    });

    if (!user) {
      return NextResponse.json(
        { message: "用户不存在" },
        { status: 404 },
      );
    }

    // 查询使用记录（按 createdAt 降序，限制 50 条）
    const usageLogs = await prisma.usageLog.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: USAGE_LOG_LIMIT,
    });

    // 统计试用期内的使用次数（createdAt <= trialExpiresAt）
    const trialUsageCount = await prisma.usageLog.count({
      where: {
        userId,
        createdAt: { lte: user.trialExpiresAt },
      },
    });

    // 计算试用状态
    const now = Date.now();
    const isTrialExpired = user.trialExpiresAt.getTime() < now;

    return NextResponse.json({
      usageLogs,
      trialUsageCount,
      trialLimit: TRIAL_LIMIT,
      trialExpiresAt: user.trialExpiresAt,
      isTrialExpired,
    });
  } catch (error) {
    console.error("获取使用记录失败:", error);
    return NextResponse.json(
      { message: "服务器内部错误" },
      { status: 500 },
    );
  }
});

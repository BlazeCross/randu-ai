import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

// 获取当前用户信息（需鉴权）
export const GET = requireAuth(async (_request, { userId }) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        phone: true,
        trialExpiresAt: true,
        isSubscribed: true,
        subscriptionPlan: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { message: "用户不存在" },
        { status: 404 },
      );
    }

    // 计算试用状态
    const now = Date.now();
    const trialExpiresAt = user.trialExpiresAt.getTime();
    const isTrialExpired = trialExpiresAt < now;
    // 剩余天数（向上取整，至少 0）
    const daysRemaining = isTrialExpired
      ? 0
      : Math.ceil((trialExpiresAt - now) / (24 * 60 * 60 * 1000));

    return NextResponse.json({
      id: user.id,
      email: user.email,
      phone: user.phone,
      trialExpiresAt: user.trialExpiresAt,
      isSubscribed: user.isSubscribed,
      subscriptionPlan: user.subscriptionPlan,
      createdAt: user.createdAt,
      isTrialExpired,
      daysRemaining,
    });
  } catch (error) {
    console.error("获取用户信息失败:", error);
    return NextResponse.json(
      { message: "服务器内部错误" },
      { status: 500 },
    );
  }
});

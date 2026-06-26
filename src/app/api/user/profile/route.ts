import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

// 昵称长度限制
const NICKNAME_MAX_LENGTH = 20;

// 获取当前用户信息（需鉴权）
export const GET = requireAuth(async (_request, { userId }) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        phone: true,
        nickname: true,
        avatar: true,
        role: true,
        credits: true,
        totalUsed: true,
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
      nickname: user.nickname,
      avatar: user.avatar,
      role: user.role,
      credits: user.credits,
      totalUsed: user.totalUsed,
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

// 修改用户资料（当前仅支持修改昵称）
export const PATCH = requireAuth(async (request, { userId }) => {
  try {
    const body = (await request.json()) as { nickname?: string };

    // 校验昵称
    const nickname = body.nickname?.trim();
    if (!nickname) {
      return NextResponse.json(
        { message: "昵称不能为空" },
        { status: 400 },
      );
    }
    if (nickname.length > NICKNAME_MAX_LENGTH) {
      return NextResponse.json(
        { message: `昵称长度不能超过 ${NICKNAME_MAX_LENGTH} 个字符` },
        { status: 400 },
      );
    }

    // 更新昵称
    await prisma.user.update({
      where: { id: userId },
      data: { nickname },
    });

    return NextResponse.json({ nickname });
  } catch (error) {
    console.error("修改用户资料失败:", error);
    return NextResponse.json(
      { message: "服务器内部错误" },
      { status: 500 },
    );
  }
});

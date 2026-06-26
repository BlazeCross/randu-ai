import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiKey } from "@/lib/apiKey";

/**
 * GET /api/external/user/usage - 查询当前用户用量
 *
 * 鉴权：X-API-Key 请求头
 * 返回：{ credits, totalUsed, keyCreditsUsed, keyTotalCalls }
 *
 * 用于 Coze 插件查询用户剩余点数
 */
export const GET = requireApiKey(async (_request, { apiKeyId, userId }) => {
  const [user, apiKey] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { credits: true, totalUsed: true },
    }),
    prisma.apiKey.findUnique({
      where: { id: apiKeyId },
      select: { creditsUsed: true, totalCalls: true },
    }),
  ]);

  if (!user || !apiKey) {
    return NextResponse.json(
      { message: "用户或 Key 不存在" },
      { status: 404 },
    );
  }

  return NextResponse.json({
    credits: user.credits,
    totalUsed: user.totalUsed,
    keyCreditsUsed: apiKey.creditsUsed,
    keyTotalCalls: apiKey.totalCalls,
  });
});

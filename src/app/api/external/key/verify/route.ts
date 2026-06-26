import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiKey } from "@/lib/apiKey";

/**
 * GET /api/external/key/verify - 验证 API Key 有效性
 *
 * 鉴权：X-API-Key 请求头
 * 返回：{ valid: true, keyName, credits }
 *
 * 用于 Coze 插件在调用前检查 Key 是否有效
 */
export const GET = requireApiKey(async (_request, { apiKeyId, userId }) => {
  // 查询用户余额和 Key 信息
  const [user, apiKey] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { credits: true },
    }),
    prisma.apiKey.findUnique({
      where: { id: apiKeyId },
      select: { name: true, status: true, expiresAt: true, creditsUsed: true, totalCalls: true },
    }),
  ]);

  if (!user || !apiKey) {
    return NextResponse.json(
      { valid: false, message: "用户或 Key 不存在" },
      { status: 404 },
    );
  }

  return NextResponse.json({
    valid: true,
    keyName: apiKey.name,
    credits: user.credits,
    keyStats: {
      creditsUsed: apiKey.creditsUsed,
      totalCalls: apiKey.totalCalls,
      expiresAt: apiKey.expiresAt,
    },
  });
});

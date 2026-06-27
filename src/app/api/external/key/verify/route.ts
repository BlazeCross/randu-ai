import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiKey } from "@/lib/apiKey";
import { checkAndExpireCredits } from "@/lib/creditsExpiry";

/**
 * GET /api/external/key/verify - 验证 API Key 有效性
 *
 * 鉴权：X-API-Key 请求头
 * 返回：{ valid: true, keyName, credits }
 *
 * 用于 Coze 插件在调用前检查 Key 是否有效
 */
export const GET = requireApiKey(async (_request, { apiKeyId, userId }) => {
  // 验证时检查积分是否过期，过期则清零（17.3）
  const { credits: currentCredits } = await checkAndExpireCredits(userId);

  // 查询 Key 信息（用户余额已由上面的过期检查刷新）
  const apiKey = await prisma.apiKey.findUnique({
    where: { id: apiKeyId },
    select: { name: true, status: true, expiresAt: true, creditsUsed: true, totalCalls: true },
  });

  if (!apiKey) {
    return NextResponse.json(
      { valid: false, message: "用户或 Key 不存在" },
      { status: 404 },
    );
  }

  return NextResponse.json({
    valid: true,
    keyName: apiKey.name,
    credits: currentCredits,
    keyStats: {
      creditsUsed: apiKey.creditsUsed,
      totalCalls: apiKey.totalCalls,
      expiresAt: apiKey.expiresAt,
    },
  });
});

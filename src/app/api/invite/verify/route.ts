import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isValidInviteCodeFormat } from "@/lib/invite";
import {
  getClientIp,
  checkIpRateLimit,
  ipRateLimitedResponse,
} from "@/lib/ipRateLimit";

// 邀请码验证限流：10 次/分钟（防枚举）
const VERIFY_RATE_LIMIT_PER_MIN = 10;

interface VerifyBody {
  inviteCode?: string;
}

/**
 * POST /api/invite/verify - 验证邀请码有效性（注册时前端校验用）
 *
 * 无需鉴权；IP 维度限流 10 次/分钟，防止邀请码枚举攻击。
 *
 * 请求体：{ inviteCode }
 * 返回：{ valid: boolean, inviterNickname?: string }
 *   - 格式错误 → valid=false（不返回 nickname）
 *   - 不存在   → valid=false（不返回 nickname，行为与格式错误一致以防枚举）
 *   - 存在     → valid=true + inviterNickname（脱敏：仅返回昵称，不暴露其他信息）
 *
 * 注意：邀请人昵称为空时返回 null（前端可显示"匿名用户"）
 */
export async function POST(request: Request) {
  try {
    // IP 限流（防枚举）
    const clientIp = getClientIp(request);
    const ipResult = checkIpRateLimit(clientIp, VERIFY_RATE_LIMIT_PER_MIN);
    if (!ipResult.allowed) {
      return ipRateLimitedResponse(ipResult.retryAfterMs, VERIFY_RATE_LIMIT_PER_MIN);
    }

    const body = (await request.json()) as VerifyBody;
    const rawInviteCode = (body.inviteCode ?? "").trim().toUpperCase();

    // 格式校验：8 位有效字符集
    if (!rawInviteCode || !isValidInviteCodeFormat(rawInviteCode)) {
      return NextResponse.json({ valid: false });
    }

    // 查询邀请人
    const inviter = await prisma.user.findUnique({
      where: { inviteCode: rawInviteCode },
      select: { nickname: true },
    });

    if (!inviter) {
      // 不存在 → 返回 valid=false（与格式错误相同，避免信息泄露）
      return NextResponse.json({ valid: false });
    }

    return NextResponse.json({
      valid: true,
      inviterNickname: inviter.nickname ?? null,
    });
  } catch (error) {
    console.error("验证邀请码失败:", error);
    return NextResponse.json(
      { message: "服务器内部错误" },
      { status: 500 },
    );
  }
}

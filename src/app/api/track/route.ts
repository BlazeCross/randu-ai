import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { trackEventWithContext } from "@/lib/analytics";
import {
  getClientIp,
  checkIpRateLimit,
  ipRateLimitedResponse,
} from "@/lib/ipRateLimit";

// 每分钟最大上报次数（防滥用）
const TRACK_RATE_LIMIT = 30;

/**
 * POST /api/track - 客户端行为埋点上报（18.1）
 *
 * 鉴权：requireAuth（需登录）
 * 限流：按客户端 IP 限制 30 次/分钟
 * 行为：将事件写入 event_logs 表，失败静默不阻断
 */
export const POST = requireAuth(async (request, { userId }) => {
  // IP 限流：防止恶意刷量
  const clientIp = getClientIp(request);
  const rateLimit = checkIpRateLimit(clientIp, TRACK_RATE_LIMIT);
  if (!rateLimit.allowed) {
    return ipRateLimitedResponse(rateLimit.retryAfterMs, TRACK_RATE_LIMIT);
  }

  let body: { event?: string; properties?: Record<string, unknown> };
  try {
    body = (await request.json()) as {
      event?: string;
      properties?: Record<string, unknown>;
    };
  } catch {
    return NextResponse.json(
      { message: "请求体格式错误" },
      { status: 400 },
    );
  }

  const event = body.event?.trim();
  if (!event) {
    return NextResponse.json(
      { message: "event 不能为空" },
      { status: 400 },
    );
  }

  const userAgent = request.headers.get("user-agent") ?? undefined;

  // 写入埋点（失败静默，不影响响应）
  await trackEventWithContext(
    userId,
    event,
    body.properties,
    clientIp,
    userAgent,
  );

  return NextResponse.json({ ok: true });
});

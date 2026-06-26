import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { reportHeartbeat } from "@/lib/online";

/**
 * POST /api/heartbeat - 心跳上报（更新在线状态）
 *
 * 已登录用户前端每 30 秒调用一次，后端更新内存中的最后心跳时间。
 * 无需返回复杂数据，仅返回最小响应以减少带宽。
 */
export const POST = requireAuth(async (_request, { userId }) => {
  reportHeartbeat(userId);
  return NextResponse.json({ ok: true });
});

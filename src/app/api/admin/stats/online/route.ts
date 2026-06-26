import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getOnlineCount } from "@/lib/online";

/**
 * GET /api/admin/stats/online - 当前在线人数
 *
 * admin 及以上权限可调用，返回最近 2 分钟内有过心跳的用户数。
 */
export const GET = requireAdmin(async () => {
  return NextResponse.json({ online: getOnlineCount() });
});

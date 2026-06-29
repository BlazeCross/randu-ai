import { NextResponse } from "next/server";

// 登出接口：清除 httpOnly cookie
export async function POST() {
  const response = NextResponse.json({ message: "已登出" });
  // 清除 cookie（设置 maxAge=0 立即过期）
  response.headers.set("Set-Cookie", "token=; Path=/; Max-Age=0; SameSite=Lax; HttpOnly");
  return response;
}

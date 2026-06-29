import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signToken } from "@/lib/auth";
import {
  getClientIp,
  checkIpRateLimit,
  ipRateLimitedResponse,
} from "@/lib/ipRateLimit";

// JWT cookie 有效期（与 JWT exp 一致，7 天）
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60; // 7 天，单位秒

// 用于时序攻击防护的固定 dummy hash
const DUMMY_HASH = "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy";

/**
 * 构造 httpOnly cookie 字符串
 * 生产环境启用 Secure（HTTPS），开发环境不启用（HTTP localhost）
 */
function buildAuthCookie(token: string, request: Request): string {
  const isHttps = request.headers.get("x-forwarded-proto") === "https" ||
                  request.url.startsWith("https://");
  const parts = [
    `token=${token}`,
    "Path=/",
    `Max-Age=${COOKIE_MAX_AGE}`,
    "SameSite=Lax",
    "HttpOnly",
  ];
  if (isHttps) {
    parts.push("Secure");
  }
  return parts.join("; ");
}

// 登录接口请求体
interface LoginBody {
  account?: string;
  password?: string;
}

// 登录接口防爆破限流：每分钟 5 次（IP 维度）
const LOGIN_RATE_LIMIT_PER_MIN = 5;

export async function POST(request: Request) {
  try {
    // IP 限流（防爆破）
    const clientIp = getClientIp(request);
    const ipResult = checkIpRateLimit(clientIp, LOGIN_RATE_LIMIT_PER_MIN);
    if (!ipResult.allowed) {
      return ipRateLimitedResponse(ipResult.retryAfterMs, LOGIN_RATE_LIMIT_PER_MIN);
    }

    const body = (await request.json()) as LoginBody;
    const { account, password } = body;

    // 校验：account 和 password 必填
    if (!account || typeof account !== "string" || !account.trim()) {
      return NextResponse.json(
        { message: "请提供账号（邮箱或手机号）" },
        { status: 400 },
      );
    }
    if (!password || typeof password !== "string") {
      return NextResponse.json(
        { message: "请提供密码" },
        { status: 400 },
      );
    }

    const normalizedAccount = account.trim();

    // 根据账号格式命中唯一索引，避免 OR 全表扫描
    // 含 @ 视为邮箱，纯数字视为手机号，其余回退到 OR
    const isEmail = normalizedAccount.includes("@");
    const isPhone = /^\d{6,}$/.test(normalizedAccount);

    const user = isEmail
      ? await prisma.user.findUnique({ where: { email: normalizedAccount } })
      : isPhone
        ? await prisma.user.findUnique({ where: { phone: normalizedAccount } })
        : await prisma.user.findFirst({
            where: { OR: [{ email: normalizedAccount }, { phone: normalizedAccount }] },
          });

    // 账号不存在：执行 dummy bcrypt.compare 消除时序差异
    if (!user) {
      await bcrypt.compare(password, DUMMY_HASH);
      return NextResponse.json(
        { message: "账号不存在或密码错误" },
        { status: 401 },
      );
    }

    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return NextResponse.json(
        { message: "账号不存在或密码错误" },
        { status: 401 },
      );
    }

    // 签发 JWT
    const token = signToken(user.id);

    // 构造响应（同时下发 httpOnly cookie 和 token 给前端）
    const response = NextResponse.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        trialExpiresAt: user.trialExpiresAt,
        isSubscribed: user.isSubscribed,
      },
    });
    // 设置 httpOnly cookie（服务端管理，防 XSS 窃取）
    response.headers.set("Set-Cookie", buildAuthCookie(token, request));
    return response;
  } catch (error) {
    console.error("登录失败:", error);
    return NextResponse.json(
      { message: "服务器内部错误" },
      { status: 500 },
    );
  }
}

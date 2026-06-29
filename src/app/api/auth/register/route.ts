import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signToken } from "@/lib/auth";
import { isValidInviteCodeFormat } from "@/lib/invite";
import {
  getClientIp,
  checkIpRateLimit,
  ipRateLimitedResponse,
} from "@/lib/ipRateLimit";

// JWT cookie 有效期（与 JWT exp 一致，7 天）
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60; // 7 天，单位秒

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

// 注册接口请求体
interface RegisterBody {
  email?: string;
  phone?: string;
  password?: string;
  inviteCode?: string;
}

// 试用期时长：7 天
const TRIAL_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

// 注册赠送积分：500 点（约 5 元，技术方案 13.1 试用期转化漏斗）
const REGISTER_BONUS_CREDITS = 500;

// 邀请奖励积分：邀请人 +50，被邀请人 +50（额外奖励，不影响注册赠送 500 积分）
const INVITER_REWARD_CREDITS = 50;
const INVITEE_REWARD_CREDITS = 50;

// 注册接口防批量限流：每分钟 3 次（IP 维度）
const REGISTER_RATE_LIMIT_PER_MIN = 3;

// 可选头像风格（DiceBear API，新用户注册时随机分配一个）
const AVATAR_STYLES = [
  "bottts-neutral",
  "thumbs",
  "shapes",
  "identicon",
] as const;

/**
 * 生成随机头像 URL（DiceBear API）
 * 新用户注册时随机分配一个头像，后续可在个人资料页手动更改。
 * 若 DiceBear 不可达，Avatar 组件会自动回退到渐变背景 + 首字。
 */
function generateRandomAvatar(): string {
  const style =
    AVATAR_STYLES[Math.floor(Math.random() * AVATAR_STYLES.length)];
  const seed = Math.random().toString(36).slice(2, 10);
  return `https://api.dicebear.com/9.x/${style}/svg?seed=${seed}`;
}

export async function POST(request: Request) {
  try {
    // IP 限流（防批量注册）
    const clientIp = getClientIp(request);
    const ipResult = checkIpRateLimit(clientIp, REGISTER_RATE_LIMIT_PER_MIN);
    if (!ipResult.allowed) {
      return ipRateLimitedResponse(ipResult.retryAfterMs, REGISTER_RATE_LIMIT_PER_MIN);
    }

    const body = (await request.json()) as RegisterBody;
    const { email, phone, password } = body;

    // 校验：email 或 phone 至少提供一个
    const normalizedEmail = email?.trim() || undefined;
    const normalizedPhone = phone?.trim() || undefined;
    if (!normalizedEmail && !normalizedPhone) {
      return NextResponse.json(
        { message: "请至少提供邮箱或手机号其中之一" },
        { status: 400 },
      );
    }

    // 校验：手机号格式（11位，以1开头，第二位为3-9）
    if (normalizedPhone && !/^1[3-9]\d{9}$/.test(normalizedPhone)) {
      return NextResponse.json(
        { message: "手机号格式不正确，请输入11位有效手机号" },
        { status: 400 },
      );
    }

    // 校验：邮箱格式（简单校验）
    if (normalizedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return NextResponse.json(
        { message: "邮箱格式不正确" },
        { status: 400 },
      );
    }

    // 校验：密码长度 >= 6
    if (!password || typeof password !== "string" || password.length < 6) {
      return NextResponse.json(
        { message: "密码长度不能少于 6 位" },
        { status: 400 },
      );
    }

    // 校验邀请码格式（如果提供了）
    const rawInviteCode = body.inviteCode?.trim().toUpperCase() || "";
    const inviteCode = rawInviteCode || undefined;
    if (inviteCode && !isValidInviteCodeFormat(inviteCode)) {
      return NextResponse.json(
        { message: "邀请码格式不正确" },
        { status: 400 },
      );
    }

    // 唯一性校验：检查 email/phone 是否已注册
    if (normalizedEmail) {
      const existingEmail = await prisma.user.findUnique({
        where: { email: normalizedEmail },
        select: { id: true },
      });
      if (existingEmail) {
        return NextResponse.json(
          { message: "该邮箱已被注册" },
          { status: 400 },
        );
      }
    }
    if (normalizedPhone) {
      const existingPhone = await prisma.user.findUnique({
        where: { phone: normalizedPhone },
        select: { id: true },
      });
      if (existingPhone) {
        return NextResponse.json(
          { message: "该手机号已被注册" },
          { status: 400 },
        );
      }
    }

    // 校验邀请人：邀请码不存在 → 忽略（不阻断注册）
    let inviterId: string | undefined = undefined;
    if (inviteCode) {
      const inviter = await prisma.user.findUnique({
        where: { inviteCode },
        select: { id: true },
      });
      if (inviter) {
        inviterId = inviter.id;
      }
      // 邀请码不存在时静默忽略
    }

    // 使用 bcryptjs 哈希密码
    const passwordHash = await bcrypt.hash(password, 10);

    // 试用到期时间：7 天后
    const trialExpiresAt = new Date(Date.now() + TRIAL_DURATION_MS);

    // 注册成功后：邀请人 +50 积分、被邀请人 +50 积分（额外奖励）
    // 邀请人 inviteCount+1、inviteReward+50
    // 全部在事务中完成，避免并发作弊
    const result = await prisma.$transaction(async (tx) => {
      // 计算被邀请人初始积分：注册赠送 500 + 邀请奖励 50（如有邀请人）
      const initialCredits =
        REGISTER_BONUS_CREDITS +
        (inviterId ? INVITEE_REWARD_CREDITS : 0);

      // 创建用户记录
      const newUser = await tx.user.create({
        data: {
          email: normalizedEmail ?? null,
          phone: normalizedPhone ?? null,
          passwordHash,
          avatar: generateRandomAvatar(),
          trialExpiresAt,
          credits: initialCredits,
          inviterId: inviterId ?? null,
        },
      });

      // 若有邀请人：更新邀请人计数与积分
      // 自邀校验：inviterId !== newUser.id（逻辑上必然成立，因为邀请人先于被邀请人注册）
      if (inviterId && inviterId !== newUser.id) {
        await tx.user.update({
          where: { id: inviterId },
          data: {
            inviteCount: { increment: 1 },
            inviteReward: { increment: INVITER_REWARD_CREDITS },
            credits: { increment: INVITER_REWARD_CREDITS },
          },
        });
      }

      return newUser;
    });

    // 签发 JWT
    const token = signToken(result.id);

    // 构造响应（同时下发 httpOnly cookie 和 token 给前端）
    const response = NextResponse.json(
      {
        token,
        user: {
          id: result.id,
          email: result.email,
          phone: result.phone,
          trialExpiresAt: result.trialExpiresAt,
          isSubscribed: result.isSubscribed,
          credits: result.credits,
        },
      },
      { status: 201 },
    );
    // 设置 httpOnly cookie（服务端管理，防 XSS 窃取）
    response.headers.set("Set-Cookie", buildAuthCookie(token, request));
    return response;
  } catch (error) {
    console.error("注册失败:", error);
    return NextResponse.json(
      { message: "服务器内部错误" },
      { status: 500 },
    );
  }
}

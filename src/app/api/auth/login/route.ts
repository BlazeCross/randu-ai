import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signToken } from "@/lib/auth";

// 登录接口请求体
interface LoginBody {
  account?: string;
  password?: string;
}

export async function POST(request: Request) {
  try {
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

    // 账号不存在
    if (!user) {
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

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        trialExpiresAt: user.trialExpiresAt,
        isSubscribed: user.isSubscribed,
      },
    });
  } catch (error) {
    console.error("登录失败:", error);
    return NextResponse.json(
      { message: "服务器内部错误" },
      { status: 500 },
    );
  }
}

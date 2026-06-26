import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signToken } from "@/lib/auth";

// 注册接口请求体
interface RegisterBody {
  email?: string;
  phone?: string;
  password?: string;
}

// 试用期时长：7 天
const TRIAL_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

export async function POST(request: Request) {
  try {
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

    // 使用 bcryptjs 哈希密码
    const passwordHash = await bcrypt.hash(password, 10);

    // 试用到期时间：7 天后
    const trialExpiresAt = new Date(Date.now() + TRIAL_DURATION_MS);

    // 创建用户记录
    const user = await prisma.user.create({
      data: {
        email: normalizedEmail ?? null,
        phone: normalizedPhone ?? null,
        passwordHash,
        trialExpiresAt,
      },
    });

    // 签发 JWT
    const token = signToken(user.id);

    return NextResponse.json(
      {
        token,
        user: {
          id: user.id,
          email: user.email,
          phone: user.phone,
          trialExpiresAt: user.trialExpiresAt,
          isSubscribed: user.isSubscribed,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("注册失败:", error);
    return NextResponse.json(
      { message: "服务器内部错误" },
      { status: 500 },
    );
  }
}

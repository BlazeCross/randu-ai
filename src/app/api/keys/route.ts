import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { generateApiKey } from "@/lib/apiKey";

// Key 名称长度限制
const KEY_NAME_MAX_LENGTH = 30;

/**
 * GET /api/keys - 获取当前用户的 API Key 列表
 * 返回 keyPrefix（非完整 Key）、名称、状态、用量等，不返回 keyHash
 */
export const GET = requireAuth(async (_request, { userId }) => {
  const keys = await prisma.apiKey.findMany({
    where: { userId },
    select: {
      id: true,
      keyPrefix: true,
      name: true,
      status: true,
      creditsUsed: true,
      totalCalls: true,
      lastUsedAt: true,
      expiresAt: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ keys });
});

/**
 * POST /api/keys - 生成新的 API Key
 *
 * 请求体：{ name: string, expiresAt?: string (ISO date) }
 * 返回：{ id, keyPrefix, key, name, createdAt }
 * 注意：完整 Key（明文）仅在此返回一次，后续无法查看
 */
export const POST = requireAuth(async (request, { userId }) => {
  try {
    const body = (await request.json()) as {
      name?: string;
      expiresAt?: string;
    };

    const name = body.name?.trim();
    if (!name) {
      return NextResponse.json(
        { message: "请输入 Key 名称" },
        { status: 400 },
      );
    }
    if (name.length > KEY_NAME_MAX_LENGTH) {
      return NextResponse.json(
        { message: `Key 名称长度不能超过 ${KEY_NAME_MAX_LENGTH} 个字符` },
        { status: 400 },
      );
    }

    // 解析过期时间（可选）
    let expiresAt: Date | null = null;
    if (body.expiresAt) {
      const parsed = new Date(body.expiresAt);
      if (isNaN(parsed.getTime())) {
        return NextResponse.json(
          { message: "过期时间格式不正确" },
          { status: 400 },
        );
      }
      if (parsed <= new Date()) {
        return NextResponse.json(
          { message: "过期时间必须晚于当前时间" },
          { status: 400 },
        );
      }
      expiresAt = parsed;
    }

    // 生成新 Key
    const { plaintext, keyPrefix, keyHash } = generateApiKey();

    // 存入数据库
    const apiKey = await prisma.apiKey.create({
      data: {
        userId,
        keyPrefix,
        keyHash,
        name,
        expiresAt,
      },
      select: {
        id: true,
        keyPrefix: true,
        name: true,
        createdAt: true,
      },
    });

    // 明文 Key 仅返回一次
    return NextResponse.json(
      {
        id: apiKey.id,
        keyPrefix: apiKey.keyPrefix,
        key: plaintext,
        name: apiKey.name,
        createdAt: apiKey.createdAt,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("生成 API Key 失败:", error);
    return NextResponse.json(
      { message: "生成 API Key 失败" },
      { status: 500 },
    );
  }
});

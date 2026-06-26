import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { generateApiKey } from "@/lib/apiKey";

// Key 名称长度限制
const KEY_NAME_MAX_LENGTH = 30;
// 默认 QPS 限制（每秒最大请求数）
const DEFAULT_QPS_LIMIT = 5;
// 默认每日调用限额
const DEFAULT_DAILY_LIMIT = 1000;
// 允许的 QPS 限制范围
const MIN_QPS_LIMIT = 0;
const MAX_QPS_LIMIT = 100;
// 允许的每日限额范围
const MIN_DAILY_LIMIT = 0;
const MAX_DAILY_LIMIT = 100_000;

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
      qpsLimit: true,
      dailyLimit: true,
      dailyUsed: true,
      dailyResetAt: true,
      // 仅返回 webhookUrl（不返回 webhookSecret，安全考虑）
      webhookUrl: true,
      // webhookSecret 仅返回前 8 位 + 掩码（用于辨识是否已设置）
      // 完整 secret 仅在首次设置时通过 PUT 接口返回一次
    },
    orderBy: { createdAt: "desc" },
  });

  // 二次处理：脱敏 webhookSecret（如未来 select 中加入的话）
  // 这里直接不查询 webhookSecret，所以无需处理
  return NextResponse.json({ keys });
});

/**
 * POST /api/keys - 生成新的 API Key
 *
 * 请求体：{
 *   name: string,
 *   expiresAt?: string (ISO date),
 *   qpsLimit?: number,    // 每秒最大请求数，默认 5，0 表示不限制，范围 0-100
 *   dailyLimit?: number,  // 每日最大调用次数，默认 1000，0 表示不限制，范围 0-100000
 * }
 * 返回：{ id, keyPrefix, key, name, createdAt }
 * 注意：完整 Key（明文）仅在此返回一次，后续无法查看
 */
export const POST = requireAuth(async (request, { userId }) => {
  try {
    const body = (await request.json()) as {
      name?: string;
      expiresAt?: string;
      qpsLimit?: number;
      dailyLimit?: number;
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

    // 校验 QPS 限制
    const qpsLimit =
      body.qpsLimit === undefined
        ? DEFAULT_QPS_LIMIT
        : Number(body.qpsLimit);
    if (
      !Number.isInteger(qpsLimit) ||
      qpsLimit < MIN_QPS_LIMIT ||
      qpsLimit > MAX_QPS_LIMIT
    ) {
      return NextResponse.json(
        {
          message: `qpsLimit 必须是 ${MIN_QPS_LIMIT}-${MAX_QPS_LIMIT} 的整数`,
        },
        { status: 400 },
      );
    }

    // 校验每日限额
    const dailyLimit =
      body.dailyLimit === undefined
        ? DEFAULT_DAILY_LIMIT
        : Number(body.dailyLimit);
    if (
      !Number.isInteger(dailyLimit) ||
      dailyLimit < MIN_DAILY_LIMIT ||
      dailyLimit > MAX_DAILY_LIMIT
    ) {
      return NextResponse.json(
        {
          message: `dailyLimit 必须是 ${MIN_DAILY_LIMIT}-${MAX_DAILY_LIMIT} 的整数`,
        },
        { status: 400 },
      );
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
        qpsLimit,
        dailyLimit,
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

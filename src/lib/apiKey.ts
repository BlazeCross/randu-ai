import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Key 前缀
const KEY_PREFIX = "blaze_";
// 随机部分长度（不含前缀）
const KEY_RANDOM_LENGTH = 32;
// 用于生成随机串的字符集
const RANDOM_CHARS =
  "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

/**
 * 生成指定长度的随机字符串（使用 crypto.randomBytes，安全随机）
 */
function generateRandomString(length: number): string {
  const bytes = crypto.randomBytes(length);
  let result = "";
  for (let i = 0; i < length; i++) {
    result += RANDOM_CHARS[bytes[i] % RANDOM_CHARS.length];
  }
  return result;
}

/**
 * 对 API Key 进行 SHA-256 哈希
 * 数据库只存储哈希值，不存储明文
 */
export function hashApiKey(key: string): string {
  return crypto.createHash("sha256").update(key).digest("hex");
}

/**
 * 生成新的 API Key
 *
 * 格式：blaze_ + 32位随机字符串
 * 返回：
 * - plaintext: 完整明文 Key（仅在此返回一次，后续不可查看）
 * - keyPrefix: Key 前12位（用于列表展示，如 blaze_aB3xY9）
 * - keyHash: SHA-256 哈希（存入数据库）
 */
export function generateApiKey(): {
  plaintext: string;
  keyPrefix: string;
  keyHash: string;
} {
  const random = generateRandomString(KEY_RANDOM_LENGTH);
  const plaintext = KEY_PREFIX + random;
  // 前缀取 blaze_ + 前6位随机字符，共12位
  const keyPrefix = plaintext.slice(0, 12);
  const keyHash = hashApiKey(plaintext);
  return { plaintext, keyPrefix, keyHash };
}

// 验证结果类型
export interface ApiKeyValidationResult {
  apiKeyId: string;
  userId: string;
  keyName: string;
}

/**
 * 从请求中验证 API Key（用于对外 API 的鉴权）
 *
 * 流程：
 * 1. 从 X-API-Key 请求头提取 Key
 * 2. SHA-256 哈希后查找数据库
 * 3. 校验状态（active）和过期时间
 * 4. 校验用户状态（非 blocked）
 *
 * @param request 请求对象
 * @returns 验证成功返回 { apiKeyId, userId, keyName }，失败返回 NextResponse(401)
 */
export async function verifyApiKey(
  request: Request,
): Promise<ApiKeyValidationResult | NextResponse> {
  const rawKey = request.headers.get("x-api-key");
  if (!rawKey) {
    return NextResponse.json(
      { message: "缺少 API Key，请在 X-API-Key 请求头中提供" },
      { status: 401 },
    );
  }

  const keyHash = hashApiKey(rawKey);
  const record = await prisma.apiKey.findUnique({
    where: { keyHash },
    select: {
      id: true,
      status: true,
      expiresAt: true,
      name: true,
      user: { select: { id: true, status: true } },
    },
  });

  // Key 不存在
  if (!record) {
    return NextResponse.json(
      { message: "无效的 API Key" },
      { status: 401 },
    );
  }

  // Key 已停用或吊销
  if (record.status !== "active") {
    return NextResponse.json(
      { message: `API Key 已${record.status === "revoked" ? "被吊销" : "停用"}` },
      { status: 401 },
    );
  }

  // Key 已过期
  if (record.expiresAt && record.expiresAt < new Date()) {
    return NextResponse.json(
      { message: "API Key 已过期" },
      { status: 401 },
    );
  }

  // 用户已被封禁
  if (record.user.status === "blocked") {
    return NextResponse.json(
      { message: "账号已被封禁" },
      { status: 403 },
    );
  }

  return {
    apiKeyId: record.id,
    userId: record.user.id,
    keyName: record.name,
  };
}

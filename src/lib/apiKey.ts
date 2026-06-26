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

/**
 * 高阶函数：包装需要 API Key 鉴权的对外 Route Handler
 *
 * 流程：从 X-API-Key 头验证 Key → 注入 { apiKeyId, userId } → 调用 handler
 * 鉴权失败返回 401/403
 *
 * @example
 * export const POST = requireApiKey(async (request, { apiKeyId, userId }) => { ... });
 */
export function requireApiKey(
  handler: (
    request: Request,
    ctx: { apiKeyId: string; userId: string },
  ) => Promise<Response> | Response,
): (request: Request) => Promise<Response> {
  return async (request: Request): Promise<Response> => {
    const result = await verifyApiKey(request);
    if (result instanceof NextResponse) {
      return result;
    }
    return handler(request, result);
  };
}

/**
 * 扣减用户点数并更新 Key 用量统计（事务操作）
 *
 * @param userId    用户 ID
 * @param apiKeyId  API Key ID
 * @param credits   消耗点数
 */
export async function deductCredits(
  userId: string,
  apiKeyId: string,
  credits: number,
): Promise<void> {
  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: {
        credits: { decrement: credits },
        totalUsed: { increment: 1 },
      },
    }),
    prisma.apiKey.update({
      where: { id: apiKeyId },
      data: {
        creditsUsed: { increment: credits },
        totalCalls: { increment: 1 },
        lastUsedAt: new Date(),
      },
    }),
  ]);
}

/**
 * 记录 API 调用日志到 CallLog 表
 *
 * workflowId 字段可选：
 * - 同步调用（如 /api/external/generate/copy）通常不填
 * - 异步调用（如 /api/external/generate/video/status）可用于存储外部任务 ID
 *   便于幂等检查（避免重复扣点）
 */
export async function logApiCall(data: {
  apiKeyId: string;
  userId: string;
  endpoint: string;
  method: string;
  creditsCost: number;
  status: "success" | "failed";
  errorMessage?: string;
  responseTime: number;
  clientIp?: string;
  /** 可选：关联的外部任务 ID 或工作流 ID（用于异步任务幂等检查） */
  workflowId?: string;
}): Promise<void> {
  await prisma.callLog.create({ data });
}

/**
 * 从请求中提取客户端 IP
 */
export function getClientIp(request: Request): string | undefined {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    // x-forwarded-for 可能包含多个 IP，取第一个
    return forwarded.split(",")[0].trim();
  }
  return request.headers.get("x-real-ip") || undefined;
}

import { prisma } from "@/lib/prisma";

/**
 * 频率限制模块（Phase 3.4）
 *
 * 设计：
 * 1. QPS 限流（每秒最大请求数）：内存滑动窗口
 *    - 进程内 Map<apiKeyId, number[]>，存储最近 1 秒的时间戳
 *    - 单实例部署足够；多实例需替换为 Redis
 * 2. 每日限额：基于数据库 daily_used + daily_reset_at
 *    - 跨日时自动重置 daily_used=0
 *    - 使用 increment 原子操作避免并发问题
 *
 * 限制值约定：
 * - qpsLimit = 0 表示不限制 QPS
 * - dailyLimit = 0 表示不限制每日次数
 */

// ===== QPS 滑动窗口（内存） =====

interface SlidingWindow {
  /** 最近 1 秒内的请求时间戳（毫秒） */
  timestamps: number[];
}

// 进程内 Map：apiKeyId → 滑动窗口
const qpsWindows = new Map<string, SlidingWindow>();

// 滑动窗口长度（毫秒）：1 秒
const QPS_WINDOW_MS = 1000;
// 清理间隔（毫秒）：每 60 秒清理一次过期窗口
const CLEANUP_INTERVAL_MS = 60_000;
// 上次清理时间
let lastCleanupAt = 0;

/**
 * 检查并记录一次 QPS 请求
 *
 * @param apiKeyId   API Key ID
 * @param qpsLimit   每秒最大请求数（0 表示不限制）
 * @returns allowed=true 表示放行；allowed=false 表示触发限流，retryAfterMs 为建议等待毫秒数
 */
function checkQps(
  apiKeyId: string,
  qpsLimit: number,
): { allowed: boolean; retryAfterMs: number } {
  // 0 表示不限制
  if (qpsLimit <= 0) return { allowed: true, retryAfterMs: 0 };

  const now = Date.now();
  const windowStart = now - QPS_WINDOW_MS;

  // 取或创建窗口
  let window = qpsWindows.get(apiKeyId);
  if (!window) {
    window = { timestamps: [] };
    qpsWindows.set(apiKeyId, window);
  }

  // 移除窗口外的旧时间戳
  window.timestamps = window.timestamps.filter((t) => t > windowStart);

  // 检查是否超限
  if (window.timestamps.length >= qpsLimit) {
    // 计算最早一个时间戳过期时间
    const oldest = window.timestamps[0];
    const retryAfterMs = Math.max(oldest + QPS_WINDOW_MS - now, 100);
    return { allowed: false, retryAfterMs };
  }

  // 记录本次请求时间戳
  window.timestamps.push(now);
  return { allowed: true, retryAfterMs: 0 };
}

/**
 * 清理过期的 QPS 滑动窗口（防止内存泄漏）
 * 每 60 秒触发一次
 */
function cleanupExpiredWindows(): void {
  const now = Date.now();
  if (now - lastCleanupAt < CLEANUP_INTERVAL_MS) return;
  lastCleanupAt = now;

  const windowStart = now - QPS_WINDOW_MS;
  for (const [apiKeyId, window] of qpsWindows) {
    window.timestamps = window.timestamps.filter((t) => t > windowStart);
    if (window.timestamps.length === 0) {
      qpsWindows.delete(apiKeyId);
    }
  }
}

// ===== 每日限额（数据库） =====

/**
 * 获取当前 UTC 0 点时间（用于 daily_reset_at 比对）
 *
 * 例如：当前 2026-06-27 15:30:00 CST
 *   → 下次重置时间 2026-06-28 00:00:00 UTC
 *   = 2026-06-28 08:00:00 CST
 */
function getNextUtcMidnight(): Date {
  const now = new Date();
  const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0, 0));
  return next;
}

/**
 * 检查并记录一次每日调用
 *
 * 流程：
 * 1. 读取当前 daily_used / daily_limit / daily_reset_at
 * 2. 若 daily_reset_at 已过期：事务重置 daily_used=0 + 更新 daily_reset_at
 * 3. 若 daily_limit > 0 且 daily_used >= daily_limit：拒绝
 * 4. 原子 increment daily_used
 *
 * @param apiKeyId  API Key ID
 * @returns allowed=true 表示放行；allowed=false 表示触发每日限额
 */
async function checkDailyLimit(
  apiKeyId: string,
): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
  // 读取当前状态
  const apiKey = await prisma.apiKey.findUnique({
    where: { id: apiKeyId },
    select: {
      qpsLimit: true,
      dailyLimit: true,
      dailyUsed: true,
      dailyResetAt: true,
    },
  });

  if (!apiKey) {
    // Key 不存在（理论上 verifyApiKey 已拦截），保守拒绝
    return { allowed: false, remaining: 0, resetAt: getNextUtcMidnight() };
  }

  const now = new Date();
  const nextReset = getNextUtcMidnight();

  // 跨日重置：daily_reset_at 已早于今日 UTC 0 点
  // daily_reset_at 默认是 NOW()，所以这里用比较 nextReset 的前一天
  const todayUtcMidnight = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0),
  );

  if (apiKey.dailyResetAt <= todayUtcMidnight) {
    // 事务：重置计数 + 更新下次重置时间
    await prisma.apiKey.update({
      where: { id: apiKeyId },
      data: {
        dailyUsed: 0,
        dailyResetAt: nextReset,
      },
    });
    apiKey.dailyUsed = 0;
    apiKey.dailyResetAt = nextReset;
  }

  // 0 表示不限制
  if (apiKey.dailyLimit <= 0) {
    return {
      allowed: true,
      remaining: -1, // -1 表示不限制
      resetAt: apiKey.dailyResetAt,
    };
  }

  // 检查是否超限
  if (apiKey.dailyUsed >= apiKey.dailyLimit) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: apiKey.dailyResetAt,
    };
  }

  // 原子递增（避免并发问题）
  await prisma.apiKey.update({
    where: { id: apiKeyId },
    data: {
      dailyUsed: { increment: 1 },
    },
  });

  return {
    allowed: true,
    remaining: apiKey.dailyLimit - apiKey.dailyUsed - 1,
    resetAt: apiKey.dailyResetAt,
  };
}

// ===== 对外接口 =====

export interface RateLimitResult {
  /** 是否放行 */
  allowed: boolean;
  /** 触发限流的原因 */
  reason?: "qps" | "daily";
  /** 建议客户端等待毫秒数（仅 QPS 限流时返回） */
  retryAfterMs?: number;
  /** 下次重置时间（仅每日限流时返回） */
  resetAt?: Date;
  /** 今日剩余次数（仅每日限流相关，-1 表示不限制） */
  remaining?: number;
}

/**
 * 检查并记录一次请求的频率限制
 *
 * 流程：
 * 1. 先检查 QPS（内存），快
 * 2. 通过后检查每日限额（数据库）
 *
 * 注意：QPS 检查通过后会立即记录一次请求；
 *       若随后每日限额拒绝，会浪费一次 QPS 配额。
 *       这是可接受的取舍：每日限额拒绝的场景相对罕见，
 *       且 QPS 配额 1 秒后即恢复。
 *
 * @param apiKeyId   API Key ID
 * @param qpsLimit   每秒最大请求数（0 表示不限制）
 */
export async function checkRateLimit(
  apiKeyId: string,
  qpsLimit: number,
): Promise<RateLimitResult> {
  // 1. QPS 检查（内存，无 IO）
  cleanupExpiredWindows();
  const qpsResult = checkQps(apiKeyId, qpsLimit);
  if (!qpsResult.allowed) {
    return {
      allowed: false,
      reason: "qps",
      retryAfterMs: qpsResult.retryAfterMs,
    };
  }

  // 2. 每日限额检查（数据库）
  const dailyResult = await checkDailyLimit(apiKeyId);
  if (!dailyResult.allowed) {
    return {
      allowed: false,
      reason: "daily",
      resetAt: dailyResult.resetAt,
      remaining: 0,
    };
  }

  return {
    allowed: true,
    remaining: dailyResult.remaining,
    resetAt: dailyResult.resetAt,
  };
}

/**
 * 重置指定 Key 的每日计数（管理员手动重置）
 */
export async function resetDailyUsage(apiKeyId: string): Promise<void> {
  await prisma.apiKey.update({
    where: { id: apiKeyId },
    data: {
      dailyUsed: 0,
      dailyResetAt: getNextUtcMidnight(),
    },
  });
}

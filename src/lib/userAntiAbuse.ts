/**
 * 单用户防刷机制（Phase 17.1）
 *
 * 设计：
 * - 进程内内存计数，按 userId 维度限制每分钟最大调用次数
 * - 每日积分消耗上限：防止单用户过度占用算力
 * - IP 多账号检测：同一 IP 短时间内注册多账号告警
 *
 * 与其他限流模块的关系：
 * - rateLimit.ts：针对 API Key 的限流（QPS + 每日次数）
 * - ipRateLimit.ts：针对客户端 IP 的全局限流（防爆破、防滥用）
 * - userAntiAbuse.ts（本模块）：针对单用户的限流 + 异常行为检测
 *
 * 单实例部署足够；多实例需替换为 Redis
 */

// ===== 用户每分钟调用次数限制 =====

interface UserWindow {
  /** 窗口内请求时间戳列表 */
  timestamps: number[];
}

// 进程内 Map：userId → 滑动窗口
const userWindows = new Map<string, UserWindow>();

// 滑动窗口长度（毫秒）：1 分钟
const USER_WINDOW_MS = 60_000;
// 单用户每分钟最大调用次数
const USER_PER_MINUTE_LIMIT = 10;
// 清理间隔（毫秒）：每 5 分钟清理一次过期窗口
const CLEANUP_INTERVAL_MS = 5 * 60_000;
let lastCleanupAt = 0;

/**
 * 检查并记录一次用户调用
 *
 * @param userId 用户 ID
 * @param limit  每分钟最大调用次数（默认 10）
 * @returns allowed=true 表示放行；allowed=false 表示触发限流
 */
export function checkUserRateLimit(
  userId: string,
  limit: number = USER_PER_MINUTE_LIMIT,
): { allowed: boolean; retryAfterMs: number; remaining: number } {
  const now = Date.now();
  const windowStart = now - USER_WINDOW_MS;

  // 取或创建窗口
  let window = userWindows.get(userId);
  if (!window) {
    window = { timestamps: [] };
    userWindows.set(userId, window);
  }

  // 移除窗口外的旧时间戳
  window.timestamps = window.timestamps.filter((t) => t > windowStart);

  // 检查是否超限
  if (window.timestamps.length >= limit) {
    const oldest = window.timestamps[0];
    const retryAfterMs = Math.max(oldest + USER_WINDOW_MS - now, 100);
    return {
      allowed: false,
      retryAfterMs,
      remaining: 0,
    };
  }

  // 记录本次请求时间戳
  window.timestamps.push(now);
  return {
    allowed: true,
    retryAfterMs: 0,
    remaining: limit - window.timestamps.length,
  };
}

/**
 * 清理过期的用户滑动窗口（防止内存泄漏）
 * 每 5 分钟触发一次
 */
function cleanupExpiredUserWindows(): void {
  const now = Date.now();
  if (now - lastCleanupAt < CLEANUP_INTERVAL_MS) return;
  lastCleanupAt = now;

  const windowStart = now - USER_WINDOW_MS;
  for (const [userId, window] of userWindows) {
    window.timestamps = window.timestamps.filter((t) => t > windowStart);
    if (window.timestamps.length === 0) {
      userWindows.delete(userId);
    }
  }
}

// ===== 用户每日积分消耗上限 =====

// 进程内 Map：userId → { date, creditsUsed }
// date 用于跨日重置（格式：YYYY-MM-DD）
interface DailyCreditsRecord {
  date: string; // YYYY-MM-DD（UTC）
  creditsUsed: number;
}

const userDailyCredits = new Map<string, DailyCreditsRecord>();
// 单用户每日最大积分消耗（防止过度占用算力）
const USER_DAILY_CREDITS_LIMIT = 5000;

/**
 * 获取今日 UTC 日期字符串（YYYY-MM-DD）
 */
function getTodayUtcDate(): string {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}-${String(now.getUTCDate()).padStart(2, "0")}`;
}

/**
 * 检查并记录用户每日积分消耗
 *
 * @param userId      用户 ID
 * @param creditsCost 本次操作消耗的积分
 * @param limit       每日最大积分消耗（默认 5000）
 * @returns allowed=true 表示放行；allowed=false 表示超出每日上限
 */
export function checkUserDailyCredits(
  userId: string,
  creditsCost: number,
  limit: number = USER_DAILY_CREDITS_LIMIT,
): { allowed: boolean; remaining: number; resetAt: Date } {
  const today = getTodayUtcDate();
  const now = new Date();

  // 计算下次重置时间（UTC 0 点）
  const nextReset = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0, 0),
  );

  let record = userDailyCredits.get(userId);
  if (!record || record.date !== today) {
    // 新一天或首次记录：重置
    record = { date: today, creditsUsed: 0 };
    userDailyCredits.set(userId, record);
  }

  if (record.creditsUsed + creditsCost > limit) {
    return {
      allowed: false,
      remaining: Math.max(0, limit - record.creditsUsed),
      resetAt: nextReset,
    };
  }

  // 记录消耗（预扣）
  record.creditsUsed += creditsCost;

  return {
    allowed: true,
    remaining: limit - record.creditsUsed,
    resetAt: nextReset,
  };
}

/**
 * 退还已记录的每日积分消耗（用于调用失败后回滚）
 *
 * @param userId      用户 ID
 * @param creditsCost 要退还的积分
 */
export function refundUserDailyCredits(
  userId: string,
  creditsCost: number,
): void {
  const record = userDailyCredits.get(userId);
  if (!record) return;
  record.creditsUsed = Math.max(0, record.creditsUsed - creditsCost);
}

// ===== IP 多账号检测 =====

// 进程内 Map：ip → { date, userIds }
interface IpAccountRecord {
  date: string; // YYYY-MM-DD（UTC）
  userIds: Set<string>; // 当日该 IP 关联的用户 ID
}

const ipAccounts = new Map<string, IpAccountRecord>();
// 同一 IP 每日关联不同账号数阈值（超过则告警）
const IP_MULTI_ACCOUNT_THRESHOLD = 5;

/**
 * 记录 IP 关联的用户账号
 *
 * 用于检测同一 IP 短时间内注册/登录多账号的行为。
 * 当同一 IP 当日关联的不同账号数超过阈值时返回告警。
 *
 * @param ip     客户端 IP
 * @param userId 用户 ID
 * @returns suspicious=true 表示该 IP 关联过多账号，需要关注
 */
export function trackIpAccount(
  ip: string,
  userId: string,
): { suspicious: boolean; accountCount: number } {
  if (!ip || ip === "unknown") {
    return { suspicious: false, accountCount: 0 };
  }

  const today = getTodayUtcDate();

  let record = ipAccounts.get(ip);
  if (!record || record.date !== today) {
    record = { date: today, userIds: new Set() };
    ipAccounts.set(ip, record);
  }

  record.userIds.add(userId);
  const accountCount = record.userIds.size;

  return {
    suspicious: accountCount > IP_MULTI_ACCOUNT_THRESHOLD,
    accountCount,
  };
}

/**
 * 清理过期的 IP 账号记录（防止内存泄漏）
 * 在 trackIpAccount 调用时顺便清理，无需独立定时器
 */
function cleanupExpiredIpRecords(): void {
  const today = getTodayUtcDate();
  for (const [ip, record] of ipAccounts) {
    if (record.date !== today) {
      ipAccounts.delete(ip);
    }
  }
}

// ===== 综合防刷检查 =====

export interface AntiAbuseResult {
  /** 是否放行 */
  allowed: boolean;
  /** 触发限流的原因 */
  reason?: "user_rate" | "daily_credits";
  /** 建议客户端等待毫秒数（仅 user_rate 时返回） */
  retryAfterMs?: number;
  /** 下次重置时间（仅 daily_credits 时返回） */
  resetAt?: Date;
  /** 今日剩余积分（仅 daily_credits 相关） */
  remainingCredits?: number;
  /** IP 是否可疑（多账号） */
  ipSuspicious?: boolean;
}

/**
 * 综合防刷检查
 *
 * 集成：
 * 1. 用户每分钟调用次数限制
 * 2. 用户每日积分消耗上限
 * 3. IP 多账号检测（仅记录，不阻断）
 *
 * @param userId      用户 ID
 * @param creditsCost 本次操作消耗的积分
 * @param clientIp    客户端 IP（可选，用于多账号检测）
 */
export function checkAntiAbuse(
  userId: string,
  creditsCost: number,
  clientIp?: string,
): AntiAbuseResult {
  // 清理过期窗口
  cleanupExpiredUserWindows();

  // 1. 用户每分钟调用次数限制
  const rateResult = checkUserRateLimit(userId);
  if (!rateResult.allowed) {
    return {
      allowed: false,
      reason: "user_rate",
      retryAfterMs: rateResult.retryAfterMs,
    };
  }

  // 2. 用户每日积分消耗上限
  const creditsResult = checkUserDailyCredits(userId, creditsCost);
  if (!creditsResult.allowed) {
    return {
      allowed: false,
      reason: "daily_credits",
      resetAt: creditsResult.resetAt,
      remainingCredits: creditsResult.remaining,
    };
  }

  // 3. IP 多账号检测（仅记录，不阻断）
  let ipSuspicious = false;
  if (clientIp) {
    cleanupExpiredIpRecords();
    const ipResult = trackIpAccount(clientIp, userId);
    ipSuspicious = ipResult.suspicious;
  }

  return {
    allowed: true,
    remainingCredits: creditsResult.remaining,
    ipSuspicious,
  };
}

/**
 * 退还防刷检查中记录的积分消耗（用于调用失败后回滚）
 *
 * 同时回滚每日积分记录，但不回滚每分钟调用次数（调用确实发生过）
 *
 * @param userId      用户 ID
 * @param creditsCost 要退还的积分
 */
export function refundAntiAbuseCredits(
  userId: string,
  creditsCost: number,
): void {
  refundUserDailyCredits(userId, creditsCost);
}

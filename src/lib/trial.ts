/**
 * 试用期限制相关工具函数
 *
 * 与后端 /api/workflow/[id]/run 和 /api/user/usage 中的逻辑保持一致：
 * - 未订阅用户试用期 7 天内可使用 10 次
 * - 试用期到期或次数用完则需升级套餐
 */

// 试用期使用次数上限
export const TRIAL_LIMIT = 10;

// 试用期天数
export const TRIAL_DAYS = 7;

// 使用记录最小字段（兼容 /api/user/usage 返回的 usageLogs 元素）
interface UsageLogLike {
  createdAt: string;
}

/**
 * 统计试用期内的使用次数
 * 仅统计 createdAt <= trialExpiresAt 的记录
 *
 * @param usageLogs 使用记录列表
 * @param trialExpiresAt 试用期到期时间（ISO 字符串或 Date）
 * @returns 试用期内使用次数
 */
export function getTrialUsageCount(
  usageLogs: UsageLogLike[],
  trialExpiresAt: string | Date,
): number {
  const expiresAt = new Date(trialExpiresAt).getTime();
  if (Number.isNaN(expiresAt)) return 0;
  return usageLogs.filter((log) => {
    const createdAt = new Date(log.createdAt).getTime();
    return !Number.isNaN(createdAt) && createdAt <= expiresAt;
  }).length;
}

/**
 * 判断试用期是否已过期
 *
 * @param trialExpiresAt 试用期到期时间（ISO 字符串或 Date）
 * @returns true 表示已过期
 */
export function isTrialExpired(trialExpiresAt: string | Date): boolean {
  const expiresAt = new Date(trialExpiresAt).getTime();
  if (Number.isNaN(expiresAt)) return true;
  return expiresAt < Date.now();
}

/**
 * 计算试用剩余天数（向上取整）
 * 例如：剩余 0.1 天返回 1，剩余 2.0 天返回 2，已过期返回 0
 *
 * @param trialExpiresAt 试用期到期时间（ISO 字符串或 Date）
 * @returns 剩余天数（向上取整，最小为 0）
 */
export function getTrialDaysRemaining(trialExpiresAt: string | Date): number {
  const expiresAt = new Date(trialExpiresAt).getTime();
  if (Number.isNaN(expiresAt)) return 0;
  const diffMs = expiresAt - Date.now();
  if (diffMs <= 0) return 0;
  // 向上取整：1000 * 60 * 60 * 24 = 一天的毫秒数
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * 判断用户是否还能使用试用
 * - 已订阅用户始终可用（不受试用限制）
 * - 未订阅用户：试用未过期且使用次数未达上限时可用
 *
 * @param trialUsageCount 当前试用使用次数
 * @param trialLimit 试用次数上限
 * @param isSubscribed 是否已订阅
 * @returns true 表示可以继续使用
 */
export function canUseTrial(
  trialUsageCount: number,
  trialLimit: number,
  isSubscribed: boolean,
): boolean {
  if (isSubscribed) return true;
  return trialUsageCount < trialLimit;
}

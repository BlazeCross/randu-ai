/**
 * 在线人数统计（内存方案，无需 Redis）
 *
 * 原理：
 * - 维护一个模块级 Map<userId, lastSeenAt>
 * - 心跳上报时更新 lastSeenAt
 * - 统计最近 2 分钟内有过心跳的用户数为"在线人数"
 * - 每分钟惰性清理过期记录
 *
 * 注意：容器重启后在线数会清零（可接受）；规模化后可升级为 Redis。
 */

// 在线判定窗口：最近 2 分钟内有心跳视为在线
const ONLINE_WINDOW_MS = 2 * 60 * 1000;
// 清理间隔：每 60 秒执行一次惰性清理
const CLEANUP_INTERVAL_MS = 60 * 1000;

// 模块级在线用户表：userId → 最后心跳时间戳
const onlineMap = new Map<string, number>();
// 上次清理时间，用于惰性清理节流
let lastCleanupAt = 0;

/**
 * 上报心跳：更新用户的最后在线时间
 * 同时执行惰性清理（每 60 秒一次，移除超过 2 分钟未心跳的记录）
 */
export function reportHeartbeat(userId: string): void {
  const now = Date.now();
  onlineMap.set(userId, now);

  // 惰性清理：距上次清理超过 60 秒才执行
  if (now - lastCleanupAt >= CLEANUP_INTERVAL_MS) {
    cleanupExpired(now);
    lastCleanupAt = now;
  }
}

/**
 * 清理过期的在线记录（超过 2 分钟未心跳的移除）
 */
function cleanupExpired(now: number): void {
  const threshold = now - ONLINE_WINDOW_MS;
  for (const [userId, lastSeenAt] of onlineMap) {
    if (lastSeenAt < threshold) {
      onlineMap.delete(userId);
    }
  }
}

/**
 * 获取当前在线人数（最近 2 分钟内有过心跳的用户数）
 * 调用时顺带执行一次惰性清理，保证返回数据不过期
 */
export function getOnlineCount(): number {
  const now = Date.now();
  cleanupExpired(now);
  lastCleanupAt = now;
  return onlineMap.size;
}

import { NextResponse } from "next/server";

/**
 * 全局 IP 限流模块（Phase 4.2）
 *
 * 设计：
 * - 进程内内存计数，按 IP 维度限制每分钟最大请求数
 * - 滑动窗口算法（存储最近窗口内的请求时间戳）
 * - 单实例部署足够；多实例需替换为 Redis
 *
 * 应用场景：
 * - 登录/注册接口：防爆破（5 req/min）
 * - 文件上传接口：防滥用（20 req/min）
 * - 其他敏感接口
 *
 * 注意：与 src/lib/rateLimit.ts 的区别
 * - rateLimit.ts：针对 API Key 的限流（QPS + 每日限额）
 * - ipRateLimit.ts：针对客户端 IP 的全局限流（防爆破、防滥用）
 */

interface IpWindow {
  /** 窗口内请求时间戳列表 */
  timestamps: number[];
}

// 进程内 Map：clientIp → 窗口
const ipWindows = new Map<string, IpWindow>();

// 滑动窗口长度（毫秒）：1 分钟
const WINDOW_MS = 60_000;
// 清理间隔（毫秒）：每 5 分钟清理一次过期窗口
const CLEANUP_INTERVAL_MS = 5 * 60_000;
// 上次清理时间
let lastCleanupAt = 0;

/**
 * 从请求中提取客户端真实 IP
 *
 * 优先级：
 * 1. X-Forwarded-For 头（反向代理场景，取第一个 IP）
 * 2. X-Real-IP 头（Nginx 常用）
 * 3. CF-Connecting-IP 头（Cloudflare）
 * 4. request.headers.get("x-forwarded-for")
 * 5. 兜底：unknown
 *
 * 注意：X-Forwarded-For 可能被伪造，生产环境应在反向代理层
 * 强制覆盖该头。此处仅做基础提取。
 */
export function getClientIp(request: Request): string {
  const headers = request.headers;
  const xff = headers.get("x-forwarded-for");
  if (xff) {
    // X-Forwarded-For: client, proxy1, proxy2
    // 取第一个（最原始的客户端 IP）
    const firstIp = xff.split(",")[0]?.trim();
    if (firstIp) return firstIp;
  }
  const xRealIp = headers.get("x-real-ip");
  if (xRealIp) return xRealIp.trim();
  const cfIp = headers.get("cf-connecting-ip");
  if (cfIp) return cfIp.trim();
  return "unknown";
}

/**
 * 检查并记录一次 IP 请求
 *
 * @param ip        客户端 IP
 * @param maxPerMin 每分钟最大请求数
 * @returns allowed=true 表示放行；allowed=false 表示触发限流
 */
function checkIp(ip: string, maxPerMin: number): {
  allowed: boolean;
  retryAfterMs: number;
  remaining: number;
} {
  // 0 或负数表示不限制
  if (maxPerMin <= 0) {
    return { allowed: true, retryAfterMs: 0, remaining: -1 };
  }

  const now = Date.now();
  const windowStart = now - WINDOW_MS;

  // 取或创建窗口
  let window = ipWindows.get(ip);
  if (!window) {
    window = { timestamps: [] };
    ipWindows.set(ip, window);
  }

  // 移除窗口外的旧时间戳
  window.timestamps = window.timestamps.filter((t) => t > windowStart);

  // 检查是否超限
  if (window.timestamps.length >= maxPerMin) {
    const oldest = window.timestamps[0];
    const retryAfterMs = Math.max(oldest + WINDOW_MS - now, 1000);
    return {
      allowed: false,
      retryAfterMs,
      remaining: 0,
    };
  }

  // 记录本次请求
  window.timestamps.push(now);
  return {
    allowed: true,
    retryAfterMs: 0,
    remaining: maxPerMin - window.timestamps.length,
  };
}

/**
 * 清理过期的 IP 窗口（防止内存泄漏）
 */
function cleanupExpiredWindows(): void {
  const now = Date.now();
  if (now - lastCleanupAt < CLEANUP_INTERVAL_MS) return;
  lastCleanupAt = now;

  const windowStart = now - WINDOW_MS;
  for (const [ip, window] of ipWindows) {
    window.timestamps = window.timestamps.filter((t) => t > windowStart);
    if (window.timestamps.length === 0) {
      ipWindows.delete(ip);
    }
  }
}

export interface IpRateLimitResult {
  allowed: boolean;
  retryAfterMs: number;
  remaining: number;
  limit: number;
}

/**
 * 检查并记录一次 IP 限流
 *
 * @param ip        客户端 IP（由 getClientIp 提取）
 * @param maxPerMin 每分钟最大请求数
 */
export function checkIpRateLimit(
  ip: string,
  maxPerMin: number,
): IpRateLimitResult {
  cleanupExpiredWindows();
  const result = checkIp(ip, maxPerMin);
  return {
    ...result,
    limit: maxPerMin,
  };
}

/**
 * 构造 IP 限流失败的响应
 *
 * @param retryAfterMs 建议客户端等待毫秒数
 * @param limit        每分钟最大请求数
 */
export function ipRateLimitedResponse(
  retryAfterMs: number,
  limit: number,
): NextResponse {
  const retryAfterSec = Math.ceil(retryAfterMs / 1000);
  return NextResponse.json(
    {
      message: `请求过于频繁，请稍后再试（每分钟最多 ${limit} 次）`,
      retryAfter: retryAfterSec,
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfterSec),
        "X-RateLimit-Limit": String(limit),
        "X-RateLimit-Remaining": "0",
      },
    },
  );
}

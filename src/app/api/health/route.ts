import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 进程启动时间（用于计算 uptime）
const STARTED_AT = Date.now();

// 健康检查超时（毫秒）：DB 探活超过此时间视为不健康
const DB_PROBE_TIMEOUT_MS = 2000;

// 缓存最近一次健康状态，避免被高频探活压垮 DB
// 探活间隔小于 5 秒时直接复用上次结果
const CACHE_TTL_MS = 5000;
let cachedResult: { healthy: boolean; payload: unknown; at: number } | null = null;

/**
 * 健康检查端点（Phase 4.1）
 *
 * 设计：
 * - 不需要鉴权，可被 Docker HEALTHCHECK / 外部监控调用
 * - 检查项：DB 连接、内存使用、运行时长
 * - 5 秒缓存，防止高频探活压垮 DB
 * - healthy 返回 200；unhealthy 返回 503
 *
 * 用法：
 *   curl http://localhost:3000/api/health
 *   curl http://localhost:3000/api/health?skipCache=1
 */
export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const skipCache = url.searchParams.get("skipCache") === "1";

  // 命中缓存：5 秒内的探活直接复用
  if (!skipCache && cachedResult && Date.now() - cachedResult.at < CACHE_TTL_MS) {
    return NextResponse.json(cachedResult.payload, {
      status: cachedResult.healthy ? 200 : 503,
    });
  }

  // 探活 DB：用最轻量的查询
  let dbOk = false;
  let dbLatencyMs = 0;
  try {
    const probeStart = Date.now();
    // Promise.race 实现超时控制
    const result = await Promise.race([
      prisma.$queryRaw`SELECT 1`,
      new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error("DB probe timeout")),
          DB_PROBE_TIMEOUT_MS,
        ),
      ),
    ]);
    dbLatencyMs = Date.now() - probeStart;
    // SELECT 1 返回 [{ "?column?": 1 }]，能拿到数组即视为成功
    dbOk = Array.isArray(result);
  } catch (err) {
    dbOk = false;
    console.error("[health] DB probe failed:", err);
  }

  // 内存使用（Node.js process.memoryUsage）
  const mem = process.memoryUsage();
  const uptimeSec = Math.floor((Date.now() - STARTED_AT) / 1000);

  const payload = {
    status: dbOk ? "ok" : "degraded",
    healthy: dbOk,
    timestamp: new Date().toISOString(),
    uptime: {
      seconds: uptimeSec,
      human: formatUptime(uptimeSec),
    },
    db: {
      ok: dbOk,
      latencyMs: dbLatencyMs,
    },
    memory: {
      rssMb: Math.round(mem.rss / 1024 / 1024),
      heapUsedMb: Math.round(mem.heapUsed / 1024 / 1024),
      heapTotalMb: Math.round(mem.heapTotal / 1024 / 1024),
      externalMb: Math.round(mem.external / 1024 / 1024),
    },
    version: process.env.npm_package_version || "0.1.0",
  };

  // 写入缓存
  cachedResult = { healthy: dbOk, payload, at: Date.now() };

  return NextResponse.json(payload, { status: dbOk ? 200 : 503 });
}

/**
 * 将秒数格式化为人类可读的运行时长
 */
function formatUptime(sec: number): string {
  const d = Math.floor(sec / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const parts: string[] = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  parts.push(`${s}s`);
  return parts.join(" ");
}

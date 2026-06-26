import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * 在 DATABASE_URL 上追加连接池参数（Phase 4.4）
 *
 * Prisma 6 的 connection_limit / pool_timeout 只能通过 URL query 配置。
 * 若用户已在 DATABASE_URL 中显式设置，则尊重用户配置；否则追加默认值。
 *
 * 默认值依据：
 * - connection_limit=10：2核4G 服务器，PostgreSQL 默认 max_connections=100，
 *   留出余量给其他连接（管理工具、备份脚本等）
 * - pool_timeout=20：默认 10s 偏短，DB 抖动时易触发 P1001，提升至 20s
 */
function buildDatabaseUrl(): string {
  const baseUrl = process.env.DATABASE_URL;
  if (!baseUrl) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  // 已显式配置则尊重原值
  const hasConnectionLimit = /[?&]connection_limit=/.test(baseUrl);
  const hasPoolTimeout = /[?&]pool_timeout=/.test(baseUrl);

  if (hasConnectionLimit && hasPoolTimeout) {
    return baseUrl;
  }

  const params: string[] = [];
  if (!hasConnectionLimit) params.push("connection_limit=10");
  if (!hasPoolTimeout) params.push("pool_timeout=20");

  const separator = baseUrl.includes("?") ? "&" : "?";
  return `${baseUrl}${separator}${params.join("&")}`;
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: buildDatabaseUrl(),
      },
    },
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

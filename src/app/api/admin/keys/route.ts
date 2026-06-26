import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

// 允许的状态筛选值
const ALLOWED_STATUSES = ["active", "inactive", "revoked"];

/**
 * GET /api/admin/keys - 后台 Key 总览
 *
 * 查询参数：
 * - page: 页码（默认 1）
 * - pageSize: 每页数量（默认 20，最大 100）
 * - search: key name / keyPrefix / 用户邮箱 / 手机号 模糊匹配
 * - status: 状态筛选（active | inactive | revoked）
 *
 * admin 及以上权限可调用。不返回 keyHash（安全考虑）。
 * 按 createdAt desc 排序，包含所属用户信息。
 */
export const GET = requireAdmin(async (request) => {
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const pageSize = Math.min(
    100,
    Math.max(1, parseInt(searchParams.get("pageSize") ?? "20", 10) || 20),
  );
  const search = searchParams.get("search")?.trim() || undefined;
  const status = searchParams.get("status")?.trim() || undefined;

  // 构建 where 条件
  const where: Record<string, unknown> = {};
  if (status && ALLOWED_STATUSES.includes(status)) {
    where.status = status;
  }
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { keyPrefix: { contains: search, mode: "insensitive" } },
      {
        user: {
          OR: [
            { email: { contains: search, mode: "insensitive" } },
            { phone: { contains: search, mode: "insensitive" } },
            { nickname: { contains: search, mode: "insensitive" } },
          ],
        },
      },
    ];
  }

  // 并行查询列表和总数
  const [keys, total] = await Promise.all([
    prisma.apiKey.findMany({
      where,
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
        webhookUrl: true,
        user: {
          select: {
            id: true,
            nickname: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.apiKey.count({ where }),
  ]);

  return NextResponse.json({
    keys,
    total,
    page,
    pageSize,
  });
});

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

// 允许的角色筛选值
const ALLOWED_ROLES = ["user", "admin", "super_admin"];
// 允许的状态筛选值
const ALLOWED_STATUSES = ["active", "blocked"];

/**
 * GET /api/admin/users - 后台用户列表
 *
 * 查询参数：
 * - page: 页码（默认 1）
 * - pageSize: 每页数量（默认 20，最大 100）
 * - search: nickname/email/phone 模糊匹配（不区分大小写）
 * - role: 角色筛选（user | admin | super_admin）
 * - status: 状态筛选（active | blocked）
 *
 * admin 及以上权限可调用。不含 passwordHash。
 * 按 createdAt desc 排序。
 */
export const GET = requireAdmin(async (request) => {
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const pageSize = Math.min(
    100,
    Math.max(1, parseInt(searchParams.get("pageSize") ?? "20", 10) || 20),
  );
  const search = searchParams.get("search")?.trim() || undefined;
  const role = searchParams.get("role")?.trim() || undefined;
  const status = searchParams.get("status")?.trim() || undefined;

  // 构建 where 条件
  const where: Record<string, unknown> = {};
  if (search) {
    where.OR = [
      { nickname: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { phone: { contains: search, mode: "insensitive" } },
    ];
  }
  if (role && ALLOWED_ROLES.includes(role)) {
    where.role = role;
  }
  if (status && ALLOWED_STATUSES.includes(status)) {
    where.status = status;
  }

  // 并行查询列表和总数
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        nickname: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        avatar: true,
        isSubscribed: true,
        subscriptionPlan: true,
        credits: true,
        totalUsed: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.user.count({ where }),
  ]);

  return NextResponse.json({
    users,
    total,
    page,
    pageSize,
  });
});

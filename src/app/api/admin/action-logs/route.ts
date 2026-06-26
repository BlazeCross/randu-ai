import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/auth";

// 允许的 action 筛选值（与 prisma schema 注释保持一致）
const ALLOWED_ACTIONS = [
  "block",
  "unblock",
  "update_credits",
  "update_plan",
  "set_role",
] as const;

/**
 * GET /api/admin/action-logs - 后台敏感操作日志列表
 *
 * 查询参数：
 * - page: 页码（默认 1）
 * - pageSize: 每页数量（默认 20，最大 100）
 * - action: 操作类型筛选（block | unblock | update_credits | update_plan | set_role）
 * - operatorId: 操作者 ID 精确匹配
 * - targetUserId: 目标用户 ID 精确匹配
 *
 * 仅 super_admin 可调用。
 * 关联查询 operator 和 targetUser 的基本标识信息（id / nickname / email / phone）。
 * 按 createdAt desc 排序。
 */
export const GET = requireSuperAdmin(async (request) => {
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const pageSize = Math.min(
    100,
    Math.max(1, parseInt(searchParams.get("pageSize") ?? "20", 10) || 20),
  );
  const action = searchParams.get("action")?.trim() || undefined;
  const operatorId = searchParams.get("operatorId")?.trim() || undefined;
  const targetUserId = searchParams.get("targetUserId")?.trim() || undefined;

  // 构建 where 条件
  const where: Record<string, unknown> = {};
  if (action && (ALLOWED_ACTIONS as readonly string[]).includes(action)) {
    where.action = action;
  }
  if (operatorId) {
    where.operatorId = operatorId;
  }
  if (targetUserId) {
    where.targetUserId = targetUserId;
  }

  // 并行查询列表和总数
  const [logs, total] = await Promise.all([
    prisma.actionLog.findMany({
      where,
      select: {
        id: true,
        operatorId: true,
        targetUserId: true,
        action: true,
        detail: true,
        ipAddress: true,
        createdAt: true,
        operator: {
          select: {
            id: true,
            nickname: true,
            email: true,
            phone: true,
          },
        },
        targetUser: {
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
    prisma.actionLog.count({ where }),
  ]);

  return NextResponse.json({
    logs,
    total,
    page,
    pageSize,
  });
});

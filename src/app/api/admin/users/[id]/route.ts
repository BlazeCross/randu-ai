import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireSuperAdmin } from "@/lib/auth";

// 用户可改字段相关常量
const VALID_STATUS = ["active", "blocked"] as const;
const VALID_ROLES = ["user", "admin", "super_admin"] as const;

/**
 * 查询用户详情（含关联统计），GET 与 PATCH 共用
 * 不返回 passwordHash，附带 usageLog / order / apiKey / paidOrder 计数
 */
async function queryUserWithStats(id: string) {
  const [user, usageLogCount, orderCount, apiKeyCount, paidOrderCount] =
    await Promise.all([
      prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          email: true,
          phone: true,
          role: true,
          nickname: true,
          avatar: true,
          status: true,
          trialExpiresAt: true,
          isSubscribed: true,
          subscriptionPlan: true,
          credits: true,
          totalUsed: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.usageLog.count({ where: { userId: id } }),
      prisma.order.count({ where: { userId: id } }),
      prisma.apiKey.count({ where: { userId: id } }),
      prisma.order.count({ where: { userId: id, status: "paid" } }),
    ]);

  if (!user) return null;

  return {
    ...user,
    usageLogCount,
    orderCount,
    apiKeyCount,
    paidOrderCount,
  };
}

/**
 * 提取客户端 IP：优先 x-forwarded-for 第一个值，其次 x-real-ip
 */
function getClientIp(request: Request): string | null {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    null
  );
}

/**
 * GET /api/admin/users/[id] - 获取单个用户详情（含关联统计）
 *
 * 返回完整字段（不含 passwordHash）+ 关联统计：
 * - usageLogCount: 使用记录数
 * - orderCount: 订单数
 * - apiKeyCount: API Key 数
 * - paidOrderCount: 已支付订单数
 *
 * admin 及以上权限可调用。用户不存在返回 404。
 */
export const GET = requireAdmin(async (_request, { params }) => {
  const { id } = await params!;

  if (!id) {
    return NextResponse.json({ message: "缺少用户 ID" }, { status: 400 });
  }

  const user = await queryUserWithStats(id);

  if (!user) {
    return NextResponse.json({ message: "用户不存在" }, { status: 404 });
  }

  return NextResponse.json({ user });
});

interface PatchBody {
  status?: unknown;
  role?: unknown;
  credits?: unknown;
  isSubscribed?: unknown;
  subscriptionPlan?: unknown;
}

// 校验通过后整理出的有效更新载荷
interface ValidatedPatch {
  status?: "active" | "blocked";
  role?: "user" | "admin" | "super_admin";
  credits?: number;
  isSubscribed?: boolean;
  subscriptionPlan?: string;
}

/**
 * PATCH /api/admin/users/[id] - 修改用户敏感字段
 *
 * 仅 super_admin 可调用。请求体可选字段：
 * - status: "active" | "blocked"
 * - role: "user" | "admin" | "super_admin"
 * - credits: 非负整数
 * - isSubscribed: boolean
 * - subscriptionPlan: 字符串（可为空字符串）
 *
 * 安全限制：
 * - 不允许拉黑自己（status=blocked 且 target === operator）
 * - 不允许降级自己的角色（role !== super_admin 且 target === operator）
 *
 * 操作成功后写入 ActionLog，与用户更新在同一个事务中保证原子性。
 * 返回 { user: {...含统计}, actionLogged: true }
 */
export const PATCH = requireSuperAdmin(async (request, { userId, params }) => {
  const { id } = await params!;

  if (!id) {
    return NextResponse.json({ message: "缺少用户 ID" }, { status: 400 });
  }

  // 解析请求体
  let body: PatchBody;
  try {
    body = (await request.json()) as PatchBody;
  } catch {
    return NextResponse.json(
      { message: "请求体格式错误，需要合法 JSON" },
      { status: 400 },
    );
  }

  // 校验 status
  if (
    body.status !== undefined &&
    (typeof body.status !== "string" ||
      !VALID_STATUS.includes(body.status as (typeof VALID_STATUS)[number]))
  ) {
    return NextResponse.json(
      { message: "status 仅支持 active / blocked" },
      { status: 400 },
    );
  }

  // 校验 role
  if (
    body.role !== undefined &&
    (typeof body.role !== "string" ||
      !VALID_ROLES.includes(body.role as (typeof VALID_ROLES)[number]))
  ) {
    return NextResponse.json(
      { message: "role 仅支持 user / admin / super_admin" },
      { status: 400 },
    );
  }

  // 校验 credits：非负整数
  if (
    body.credits !== undefined &&
    (typeof body.credits !== "number" ||
      !Number.isInteger(body.credits) ||
      body.credits < 0)
  ) {
    return NextResponse.json(
      { message: "credits 必须为非负整数" },
      { status: 400 },
    );
  }

  // 校验 isSubscribed：boolean
  if (
    body.isSubscribed !== undefined &&
    typeof body.isSubscribed !== "boolean"
  ) {
    return NextResponse.json(
      { message: "isSubscribed 必须为 boolean" },
      { status: 400 },
    );
  }

  // 校验 subscriptionPlan：字符串（可为空字符串）
  if (
    body.subscriptionPlan !== undefined &&
    typeof body.subscriptionPlan !== "string"
  ) {
    return NextResponse.json(
      { message: "subscriptionPlan 必须为字符串" },
      { status: 400 },
    );
  }

  // 将校验通过的值整理为强类型载荷（窄化类型，避免后续 unknown 报错）
  const validated: ValidatedPatch = {};
  if (body.status !== undefined) {
    validated.status = body.status as "active" | "blocked";
  }
  if (body.role !== undefined) {
    validated.role = body.role as "user" | "admin" | "super_admin";
  }
  if (body.credits !== undefined) {
    validated.credits = body.credits as number;
  }
  if (body.isSubscribed !== undefined) {
    validated.isSubscribed = body.isSubscribed as boolean;
  }
  if (body.subscriptionPlan !== undefined) {
    validated.subscriptionPlan = body.subscriptionPlan as string;
  }

  // 不允许拉黑自己
  if (id === userId && validated.status === "blocked") {
    return NextResponse.json(
      { message: "不允许拉黑自己" },
      { status: 403 },
    );
  }

  // 不允许降级自己的角色（防止 super_admin 把自己降级导致系统失管）
  if (
    id === userId &&
    validated.role !== undefined &&
    validated.role !== "super_admin"
  ) {
    return NextResponse.json(
      { message: "不允许修改自己的角色" },
      { status: 403 },
    );
  }

  // 查询原用户（用于比对差异）
  const existing = await prisma.user.findUnique({
    where: { id },
    select: {
      role: true,
      status: true,
      credits: true,
      isSubscribed: true,
      subscriptionPlan: true,
    },
  });

  if (!existing) {
    return NextResponse.json({ message: "用户不存在" }, { status: 404 });
  }

  const ipAddress = getClientIp(request);

  try {
    await prisma.$transaction(async (tx) => {
      // 收集需要更新的字段
      const updateData: {
        status?: string;
        role?: string;
        credits?: number;
        isSubscribed?: boolean;
        subscriptionPlan?: string;
      } = {};
      if (validated.status !== undefined) updateData.status = validated.status;
      if (validated.role !== undefined) updateData.role = validated.role;
      if (validated.credits !== undefined) updateData.credits = validated.credits;
      if (validated.isSubscribed !== undefined)
        updateData.isSubscribed = validated.isSubscribed;
      if (validated.subscriptionPlan !== undefined)
        updateData.subscriptionPlan = validated.subscriptionPlan;

      await tx.user.update({
        where: { id },
        data: updateData,
      });

      // 计算需要写入的 ActionLog 记录（按变更类型分组，每种变更一条）
      interface PendingLog {
        action: string;
        detail: Record<string, unknown> | null;
      }
      const pendingLogs: PendingLog[] = [];

      // block / unblock：仅当 status 真正变化时记录
      if (
        validated.status !== undefined &&
        validated.status !== existing.status
      ) {
        if (validated.status === "blocked") {
          pendingLogs.push({
            action: "block",
            detail: { reason: null },
          });
        } else {
          pendingLogs.push({
            action: "unblock",
            detail: null,
          });
        }
      }

      // update_credits：仅当 credits 真正变化时记录
      if (
        validated.credits !== undefined &&
        validated.credits !== existing.credits
      ) {
        pendingLogs.push({
          action: "update_credits",
          detail: {
            oldCredits: existing.credits,
            newCredits: validated.credits,
          },
        });
      }

      // update_plan：isSubscribed 或 subscriptionPlan 任一变化即记录
      const planChanged =
        (validated.isSubscribed !== undefined &&
          validated.isSubscribed !== existing.isSubscribed) ||
        (validated.subscriptionPlan !== undefined &&
          validated.subscriptionPlan !== (existing.subscriptionPlan ?? ""));
      if (planChanged) {
        pendingLogs.push({
          action: "update_plan",
          detail: {
            isSubscribed:
              validated.isSubscribed !== undefined
                ? validated.isSubscribed
                : existing.isSubscribed,
            subscriptionPlan:
              validated.subscriptionPlan !== undefined
                ? validated.subscriptionPlan
                : existing.subscriptionPlan,
          },
        });
      }

      // set_role：仅当 role 真正变化时记录
      if (validated.role !== undefined && validated.role !== existing.role) {
        pendingLogs.push({
          action: "set_role",
          detail: { oldRole: existing.role, newRole: validated.role },
        });
      }

      // 批量创建 ActionLog 记录
      for (const log of pendingLogs) {
        await tx.actionLog.create({
          data: {
            operatorId: userId,
            targetUserId: id,
            action: log.action,
            detail: log.detail as never,
            ipAddress,
          },
        });
      }
    });
  } catch (err) {
    console.error("[PATCH /api/admin/users/[id]] 失败:", err);
    return NextResponse.json({ message: "服务器错误" }, { status: 500 });
  }

  // 重新查询返回带统计的用户
  const user = await queryUserWithStats(id);
  if (!user) {
    return NextResponse.json({ message: "用户不存在" }, { status: 404 });
  }

  return NextResponse.json({ user, actionLogged: true });
});

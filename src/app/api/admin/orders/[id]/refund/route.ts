import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/auth";

// 退款积分兑换比例：1 元 = 100 积分
const REFUND_CREDITS_PER_YUAN = 100;

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

interface RefundBody {
  reason?: unknown;
}

/**
 * POST /api/admin/orders/[id]/refund - 订单退款
 *
 * 仅 super_admin 可调用。请求体可选字段：
 * - reason: 退款原因（字符串，可为空）
 *
 * 流程：
 * 1. 校验订单存在且 status === "paid"
 * 2. 校验 refundStatus !== "refunded"（已退款不可重复）
 * 3. 事务操作：更新订单退费状态 + 退还用户积分 + 写入 ActionLog
 *
 * 退还积分 = 订单金额 × 100（1 元 = 100 积分）
 *
 * 返回更新后的订单（金额字段转为 number）
 */
export const POST = requireSuperAdmin(
  async (request, { userId, params }) => {
    const { id } = await params!;

    if (!id) {
      return NextResponse.json({ message: "缺少订单 ID" }, { status: 400 });
    }

    // 解析请求体（可为空）
    let body: RefundBody = {};
    try {
      const text = await request.text();
      if (text.trim()) {
        body = JSON.parse(text) as RefundBody;
      }
    } catch {
      return NextResponse.json(
        { message: "请求体格式错误，需要合法 JSON" },
        { status: 400 },
      );
    }

    // 校验 reason
    let reason: string | undefined;
    if (body.reason !== undefined && body.reason !== null) {
      if (typeof body.reason !== "string") {
        return NextResponse.json(
          { message: "reason 必须为字符串" },
          { status: 400 },
        );
      }
      reason = body.reason.trim() || undefined;
    }

    // 查询订单（含 user 关联）
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, nickname: true, email: true, phone: true },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ message: "订单不存在" }, { status: 404 });
    }

    // 校验订单状态：仅已支付订单可退款
    if (order.status !== "paid") {
      return NextResponse.json(
        { message: "订单未支付，无法退款" },
        { status: 400 },
      );
    }

    // 校验退款状态：已退款不可重复
    if (order.refundStatus === "refunded") {
      return NextResponse.json(
        { message: "订单已退款，不可重复退款" },
        { status: 400 },
      );
    }

    // 退款金额 = 订单金额（Decimal 转 number 计算积分）
    const refundAmount = Number(order.amount);
    // 退还积分 = 退款金额 × 100（1 元 = 100 积分）
    const creditsToReturn = Math.round(refundAmount * REFUND_CREDITS_PER_YUAN);

    const ipAddress = getClientIp(request);

    try {
      await prisma.$transaction(async (tx) => {
        // 1. 更新订单退费状态
        await tx.order.update({
          where: { id },
          data: {
            refundStatus: "refunded",
            refundReason: reason,
            refundedAt: new Date(),
            refundAmount: order.amount,
          },
        });

        // 2. 退还用户积分
        await tx.user.update({
          where: { id: order.userId },
          data: { credits: { increment: creditsToReturn } },
        });

        // 3. 写入 ActionLog（事务内，保证原子性）
        await tx.actionLog.create({
          data: {
            operatorId: userId,
            targetUserId: order.userId,
            action: "refund",
            detail: {
              orderId: id,
              orderNo: order.orderNo,
              amount: refundAmount,
              creditsReturned: creditsToReturn,
              reason: reason ?? null,
            } as never,
            ipAddress,
          },
        });
      });
    } catch (err) {
      console.error("[POST /api/admin/orders/[id]/refund] 失败:", err);
      return NextResponse.json({ message: "服务器错误" }, { status: 500 });
    }

    // 查询更新后的订单返回
    const updated = await prisma.order.findUnique({
      where: { id },
      select: {
        id: true,
        orderNo: true,
        userId: true,
        type: true,
        credits: true,
        amount: true,
        status: true,
        paymentMethod: true,
        paymentId: true,
        paidAt: true,
        createdAt: true,
        refundStatus: true,
        refundReason: true,
        refundedAt: true,
        refundAmount: true,
        plan: { select: { id: true, name: true } },
        user: {
          select: { id: true, nickname: true, email: true, phone: true },
        },
      },
    });

    if (!updated) {
      return NextResponse.json({ message: "订单不存在" }, { status: 404 });
    }

    return NextResponse.json({
      order: {
        ...updated,
        amount: Number(updated.amount),
        refundAmount: updated.refundAmount
          ? Number(updated.refundAmount)
          : null,
      },
      actionLogged: true,
    });
  },
);

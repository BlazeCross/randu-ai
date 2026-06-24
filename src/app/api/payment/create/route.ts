import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";

/**
 * 创建支付订单接口（Phase 2 完整实现）
 *
 * 当前版本（P1）为占位接口，返回 501 表示未实现。
 *
 * Phase 2 将接入 alipay-payment-integration：
 * - 接收 { planName } 请求体
 * - 校验套餐名称与价格
 * - 调用 createPaymentOrder 创建订单
 * - 调用支付宝 SDK 生成支付链接
 * - 返回 { orderId, payUrl }
 *
 * @example
 * 请求：POST /api/payment/create
 * Headers: Authorization: Bearer <token>
 * Body: { "planName": "专业版" }
 *
 * @param request Next.js Request 对象
 * @returns 501 占位响应（Phase 2 实现）
 */
export const POST = requireAuth(async () => {
  // Phase 2 将接入 alipay-payment-integration 实现完整支付流程
  return NextResponse.json(
    { message: "支付功能即将开放" },
    { status: 501 },
  );
});

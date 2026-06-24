import { NextResponse } from "next/server";

/**
 * 支付宝异步回调通知接口（Phase 2 完整实现）
 *
 * 当前版本（P1）为占位接口，直接返回 { success: true }。
 *
 * 注意：此接口不需要鉴权，由支付宝服务器主动调用。
 *
 * Phase 2 将接入 alipay-payment-integration：
 * - 解析支付宝 POST 表单参数
 * - 校验支付宝签名（防止伪造）
 * - 根据 trade_status 更新订单状态
 * - 支付成功时更新用户订阅状态（isSubscribed=true, subscriptionPlan=套餐名）
 * - 返回 "success" 字符串给支付宝（支付宝要求返回 success 才停止重试）
 *
 * @example
 * 请求：POST /api/payment/callback
 * Content-Type: application/x-www-form-urlencoded
 * Body: 支付宝回调参数（trade_status, out_trade_no, total_amount 等）
 *
 * @returns 200 { success: true }（占位）
 */
export async function POST() {
  // Phase 2 将接入 alipay-payment-integration 实现回调验签与订单更新
  return NextResponse.json({ success: true });
}

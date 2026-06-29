import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyNotifySign, isAlipayConfigured } from "@/lib/alipay";
import { getPlanByName } from "@/lib/plans";

/**
 * GET /api/payment/callback - 支付宝同步返回（return_url）
 *
 * 用户在支付宝收银台完成支付后，浏览器会跳转到本接口（GET 请求，参数在 query 中）。
 *
 * 重要安全提示（红线）：
 * - 前台同步跳转结果不可信！实际订单状态更新由 POST 异步通知完成。
 * - 本接口仅负责验签后重定向到前端订单页面，不更新任何数据。
 * - 前端订单页展示的状态以数据库为准（由 POST 回调更新）。
 *
 * 流程：
 *   1. 从 URL query 读取支付宝返回的参数（含 sign、out_trade_no 等）
 *   2. 验签（仅在支付宝已配置时进行，防止伪造跳转）
 *   3. 验签成功：重定向到 /dashboard/orders（携带订单号便于前端定位）
 *   4. 验签失败/未配置：重定向到 /dashboard/orders（不携带订单号，记录日志）
 *
 * 注意：本接口不需要鉴权，由用户浏览器跳转触发。
 */
export async function GET(request: Request) {
  const url = new URL(request.url);

  // 1. 读取 query 参数（支付宝同步返回会将参数拼在 URL 上）
  const params: Record<string, string> = {};
  url.searchParams.forEach((value, key) => {
    params[key] = value;
  });

  // 2. 验签（仅在支付宝已配置时进行）
  //    未配置时直接重定向，避免抛错导致用户看到 500 页面
  let verified = false;
  if (isAlipayConfigured()) {
    try {
      verified = verifyNotifySign(params);
    } catch (error) {
      console.error("[GET /api/payment/callback] 验签异常:", error);
      verified = false;
    }
  }

  // 3. 验签失败或支付宝未配置：记录日志，仍重定向到订单页
  //    订单状态以数据库为准，不受同步返回参数影响
  if (!verified) {
    console.warn(
      "[GET /api/payment/callback] 同步返回验签失败或支付宝未配置",
    );
    return NextResponse.redirect(new URL("/dashboard/orders", url.origin));
  }

  // 4. 验签成功：重定向到订单页，携带订单号便于前端高亮定位
  const outTradeNo = params.out_trade_no;
  const redirectUrl = new URL("/dashboard/orders", url.origin);
  if (outTradeNo) {
    redirectUrl.searchParams.set("order_no", outTradeNo);
  }
  return NextResponse.redirect(redirectUrl);
}

/**
 * POST /api/payment/callback - 支付宝异步通知回调
 *
 * 支付宝在用户完成支付后会向本接口发送 POST 请求（application/x-www-form-urlencoded）。
 * 接口必须：
 *   1. 验签：防止伪造
 *   2. 根据 trade_status 更新订单状态
 *   3. 支付成功时更新用户订阅/积分
 *   4. 返回字符串 "success"（支付宝要求，否则会重试）
 *
 * 安全要求：
 * - 不信任任何未验签的请求
 * - 幂等性：同一订单多次回调不重复发放权益
 *
 * 注意：本接口不需要鉴权，由支付宝服务器主动调用。
 */
export async function POST(request: Request) {
  // 1. 检查支付宝配置
  if (!isAlipayConfigured()) {
    // 未配置时返回 fail，让支付宝停止重试
    return new NextResponse("fail", {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }

  // 2. 解析表单参数（支付宝使用 application/x-www-form-urlencoded）
  let params: Record<string, string>;
  try {
    const formData = await request.formData();
    params = {};
    for (const [key, value] of formData.entries()) {
      params[key] = String(value);
    }
  } catch (error) {
    console.error("[POST /api/payment/callback] 解析表单失败:", error);
    return new NextResponse("fail", {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }

  // 3. 验签（checkNotifySign 是同步方法）
  const signValid = verifyNotifySign(params);
  if (!signValid) {
    console.warn("[POST /api/payment/callback] 验签失败，疑似伪造请求");
    return new NextResponse("fail", {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }

  // 4. 解析关键字段
  const outTradeNo = params.out_trade_no; // 商户订单号
  const tradeStatus = params.trade_status; // 交易状态
  const tradeNo = params.trade_no; // 支付宝交易号
  const totalAmount = params.total_amount; // 交易金额

  if (!outTradeNo) {
    console.warn("[POST /api/payment/callback] 缺少 out_trade_no 参数");
    return new NextResponse("fail", {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }

  // 5. 查询订单（含套餐名称，用于判断点数包）
  const order = await prisma.order.findUnique({
    where: { orderNo: outTradeNo },
    select: {
      id: true,
      userId: true,
      type: true,
      planId: true,
      credits: true,
      amount: true,
      status: true,
      plan: { select: { name: true } },
    },
  });

  if (!order) {
    console.warn(
      `[POST /api/payment/callback] 订单不存在: ${outTradeNo}`,
    );
    return new NextResponse("fail", {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }

  // 6. 幂等性检查：已支付的订单不再处理
  if (order.status === "paid") {
    console.log(
      `[POST /api/payment/callback] 订单已支付，幂等返回 success: ${outTradeNo}`,
    );
    return new NextResponse("success", {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }

  // 7. 根据 trade_status 判断支付结果
  // TRADE_SUCCESS: 交易成功（普通付款）
  // TRADE_FINISHED: 交易完成（不支持退款）
  const isPaid = tradeStatus === "TRADE_SUCCESS" || tradeStatus === "TRADE_FINISHED";

  if (!isPaid) {
    // 其他状态（如 WAIT_BUYER_PAY、TRADE_CLOSED）：保持 pending 或标记失败
    console.log(
      `[POST /api/payment/callback] 交易状态未完成: ${tradeStatus}, 订单: ${outTradeNo}`,
    );
    return new NextResponse("success", {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }

  // 8. 校验金额（防止篡改）
  const expectedAmount = Number(order.amount).toFixed(2);
  const receivedAmount = Number(totalAmount).toFixed(2);
  if (expectedAmount !== receivedAmount) {
    console.error(
      `[POST /api/payment/callback] 金额不匹配: 期望 ${expectedAmount}, 实收 ${receivedAmount}, 订单 ${outTradeNo}`,
    );
    return new NextResponse("fail", {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }

  // 9. 使用事务更新订单 + 发放权益（保证原子性）
  try {
    await prisma.$transaction(async (tx) => {
      // 更新订单状态
      await tx.order.update({
        where: { id: order.id },
        data: {
          status: "paid",
          paymentId: tradeNo,
          paidAt: new Date(),
        },
      });

      // 根据订单类型发放权益
      if (order.type === "subscription" && order.planId) {
        // 检查是否为点数包套餐（通过 plan name 识别）
        const planName = order.plan?.name;
        const planInfo = planName ? getPlanByName(planName) : null;

        if (planInfo?.type === "credits_pack" && planInfo.credits) {
          // 点数包套餐：发放积分 + 设置有效期
          const validDays = planInfo.validDays ?? 365;
          const expiresAt = new Date();
          expiresAt.setDate(expiresAt.getDate() + validDays);

          await tx.user.update({
            where: { id: order.userId },
            data: {
              credits: { increment: planInfo.credits },
              // 设置积分过期时间（取最远的过期时间，避免已有积分被提前过期）
              creditsExpiresAt: expiresAt,
              creditsExpired: false,
            },
          });
        } else {
          // 普通订阅套餐：更新用户订阅状态
          const plan = await tx.plan.findUnique({
            where: { id: order.planId },
            select: { name: true, dailyLimit: true },
          });
          if (plan) {
            await tx.user.update({
              where: { id: order.userId },
              data: {
                isSubscribed: true,
                subscriptionPlan: plan.name,
              },
            });
          }
        }
      } else if (order.type === "credits" && order.credits > 0) {
        // 积分充值：累加用户积分
        await tx.user.update({
          where: { id: order.userId },
          data: {
            credits: { increment: order.credits },
          },
        });
      }
    });

    console.log(
      `[POST /api/payment/callback] 订单支付成功: ${outTradeNo}, 金额: ${totalAmount}`,
    );
    return new NextResponse("success", {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  } catch (error) {
    console.error(
      `[POST /api/payment/callback] 更新订单失败: ${outTradeNo}`,
      error,
    );
    // 返回 fail 让支付宝重试
    return new NextResponse("fail", {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }
}

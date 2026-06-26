import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import {
  createPagePayment,
  generateOrderNo,
  isAlipayConfigured,
} from "@/lib/alipay";

// 积分包配置（一次性购买，单位：元）
// 价格梯度：购买越多越优惠
interface CreditsPackage {
  id: string;
  credits: number;
  price: number; // 单位：元
  label: string;
}

const CREDITS_PACKAGES: CreditsPackage[] = [
  { id: "pack_10", credits: 10, price: 1, label: "10 积分" },
  { id: "pack_50", credits: 50, price: 4.5, label: "50 积分（9折）" },
  { id: "pack_100", credits: 100, price: 8, label: "100 积分（8折）" },
  { id: "pack_500", credits: 500, price: 35, label: "500 积分（7折）" },
];

interface CreatePaymentBody {
  type?: unknown;
  planName?: unknown;
  packageId?: unknown;
}

/**
 * POST /api/payment/create - 创建支付订单
 *
 * 请求体：
 * - type: "subscription" | "credits"
 * - planName: 套餐名称（type=subscription 时必填，如"基础版"）
 * - packageId: 积分包 ID（type=credits 时必填，如"pack_100"）
 *
 * 流程：
 * 1. 鉴权
 * 2. 校验支付宝配置
 * 3. 解析参数并查询 Plan / 积分包
 * 4. 创建 Order 记录（status=pending）
 * 5. 调用支付宝电脑网站支付生成支付链接
 * 6. 返回 { orderId, payUrl }
 *
 * 响应：
 * - 200: { orderId, orderNo, payUrl }
 * - 400: 参数错误
 * - 503: 支付宝未配置
 */
export const POST = requireAuth(async (request, { userId }) => {
  // 1. 检查支付宝配置
  if (!isAlipayConfigured()) {
    return NextResponse.json(
      { message: "支付功能暂未开放，请联系管理员开通" },
      { status: 503 },
    );
  }

  // 2. 解析请求体
  let body: CreatePaymentBody;
  try {
    body = (await request.json()) as CreatePaymentBody;
  } catch {
    return NextResponse.json(
      { message: "请求体格式错误，需为 JSON" },
      { status: 400 },
    );
  }

  const type = typeof body.type === "string" ? body.type : "";
  if (type !== "subscription" && type !== "credits") {
    return NextResponse.json(
      { message: "type 参数必须为 subscription 或 credits" },
      { status: 400 },
    );
  }

  let subject: string;
  let amount: number;
  let planId: string | null = null;
  let credits = 0;

  if (type === "subscription") {
    // 订阅套餐
    const planName =
      typeof body.planName === "string" ? body.planName.trim() : "";
    if (!planName) {
      return NextResponse.json(
        { message: "planName 参数不能为空" },
        { status: 400 },
      );
    }

    const plan = await prisma.plan.findUnique({
      where: { name: planName },
      select: { id: true, name: true, monthlyPrice: true },
    });
    if (!plan) {
      return NextResponse.json(
        { message: `套餐「${planName}」不存在` },
        { status: 400 },
      );
    }

    planId = plan.id;
    amount = Number(plan.monthlyPrice);
    subject = `燃渡AI ${plan.name} 套餐订阅`;
  } else {
    // 积分充值
    const packageId =
      typeof body.packageId === "string" ? body.packageId.trim() : "";
    const pkg = CREDITS_PACKAGES.find((p) => p.id === packageId);
    if (!pkg) {
      return NextResponse.json(
        { message: "积分包不存在，请选择有效的积分包" },
        { status: 400 },
      );
    }
    credits = pkg.credits;
    amount = pkg.price;
    subject = `燃渡AI ${pkg.label} 充值`;
  }

  // 金额校验（防止 0 元或负数订单）
  if (!(amount > 0)) {
    return NextResponse.json(
      { message: "订单金额异常" },
      { status: 400 },
    );
  }

  // 3. 创建订单记录
  const orderNo = generateOrderNo();
  const order = await prisma.order.create({
    data: {
      orderNo,
      userId,
      type,
      planId,
      credits,
      amount,
      status: "pending",
      paymentMethod: "alipay",
    },
  });

  // 4. 调用支付宝生成支付链接
  try {
    const payUrl = await createPagePayment({
      orderNo: order.orderNo,
      amount,
      subject,
      body: subject,
    });

    return NextResponse.json({
      orderId: order.id,
      orderNo: order.orderNo,
      payUrl,
    });
  } catch (error) {
    // 支付宝调用失败：标记订单为失败
    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: "failed",
      },
    });

    console.error("[POST /api/payment/create] 支付宝调用失败:", error);
    const msg =
      error instanceof Error ? error.message : "生成支付链接失败";
    return NextResponse.json(
      { message: msg },
      { status: 500 },
    );
  }
});

// 导出积分包列表（供前端 /api/payment/packages 接口复用）
export { CREDITS_PACKAGES };

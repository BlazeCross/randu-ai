import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAlipayConfigured } from "@/lib/alipay";
import { getPlanByName } from "@/lib/plans";

// 积分包配置（与 /api/payment/create 保持一致）
// 这里独立定义避免循环依赖
interface CreditsPackage {
  id: string;
  credits: number;
  price: number;
  label: string;
  bonus?: string;
}

const CREDITS_PACKAGES: CreditsPackage[] = [
  { id: "pack_10", credits: 10, price: 1, label: "10 积分" },
  { id: "pack_50", credits: 50, price: 4.5, label: "50 积分", bonus: "9折" },
  { id: "pack_100", credits: 100, price: 8, label: "100 积分", bonus: "8折" },
  { id: "pack_500", credits: 500, price: 35, label: "500 积分", bonus: "7折" },
];

interface PlanItem {
  id: string;
  name: string;
  monthlyPrice: number;
  dailyLimit: number;
  features: string[];
  // Phase 17.2：点数包套餐扩展字段
  type: "subscription" | "credits_pack";
  credits?: number;
  validDays?: number;
}

/**
 * GET /api/payment/packages - 获取可购买的套餐和积分包列表（公开接口）
 *
 * 响应：
 * - paymentEnabled: 支付功能是否已开通
 * - plans: 套餐列表（从数据库读取，含订阅套餐和点数包套餐）
 * - creditsPackages: 积分包列表（硬编码，按量购买）
 */
export async function GET() {
  // 查询所有套餐
  const plans = await prisma.plan.findMany({
    orderBy: { monthlyPrice: "asc" },
    select: {
      id: true,
      name: true,
      monthlyPrice: true,
      dailyLimit: true,
      features: true,
    },
  });

  const planItems: PlanItem[] = plans.map((p) => {
    // 通过本地常量识别套餐类型（数据库无 type 列）
    const planInfo = getPlanByName(p.name);
    const type = planInfo?.type ?? "subscription";
    return {
      id: p.id,
      name: p.name,
      monthlyPrice: Number(p.monthlyPrice),
      dailyLimit: p.dailyLimit,
      features: Array.isArray(p.features)
        ? (p.features as unknown as string[]).filter(
            (f): f is string => typeof f === "string",
          )
        : [],
      type,
      credits: planInfo?.credits,
      validDays: planInfo?.validDays,
    };
  });

  return NextResponse.json({
    paymentEnabled: isAlipayConfigured(),
    plans: planItems,
    creditsPackages: CREDITS_PACKAGES,
  });
}

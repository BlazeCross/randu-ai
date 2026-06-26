/**
 * 套餐常量数据（前端使用）
 *
 * 与 prisma/seed.ts 中的 plansData 保持一致，
 * 供前端组件直接引用，避免在多处硬编码套餐数据。
 *
 * Phase 2 接入支付后，可改为通过 API 从 plans 表动态获取。
 */

// 单个套餐的常量结构
export interface PlanInfo {
  // 套餐名称（与 plans 表 name 字段一致）
  name: string;
  // 每日调用次数上限
  dailyLimit: number;
  // 月度价格（单位：元）
  monthlyPrice: number;
  // 功能列表
  features: string[];
}

// 套餐列表（与 seed.ts 中的 plansData 完全一致）
const PLANS: PlanInfo[] = [
  {
    name: "基础版",
    dailyLimit: 30,
    monthlyPrice: 99,
    features: ["每日30次调用", "基础工作流", "邮件支持"],
  },
  {
    name: "专业版",
    dailyLimit: 100,
    monthlyPrice: 299,
    features: ["每日100次调用", "全部工作流", "优先支持", "API接入"],
  },
  {
    name: "企业版",
    dailyLimit: 1000,
    monthlyPrice: 999,
    features: [
      "每日1000次调用",
      "全部工作流",
      "专属客服",
      "定制工作流",
      "API接入",
    ],
  },
];

/**
 * 根据套餐名称获取套餐信息
 * @param name 套餐名称
 * @returns 套餐信息，未找到返回 null
 */
export function getPlanByName(name: string): PlanInfo | null {
  return PLANS.find((plan) => plan.name === name) ?? null;
}

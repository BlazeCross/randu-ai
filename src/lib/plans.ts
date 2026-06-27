/**
 * 套餐常量数据（前端使用）
 *
 * 与 prisma/seed.ts + scripts/migrate-plans-v2.sql 保持一致，
 * 供前端组件直接引用，避免在多处硬编码套餐数据。
 *
 * 套餐分两类：
 * 1. 订阅套餐（基础版/专业版/企业版）：按月订阅，每日调用次数限制
 * 2. 点数包套餐（体验包/月卡/季卡/年卡）：一次性购买，点数有有效期
 *
 * Phase 2 接入支付后，可改为通过 API 从 plans 表动态获取。
 */

// 单个套餐的常量结构
export interface PlanInfo {
  // 套餐名称（与 plans 表 name 字段一致）
  name: string;
  // 每日调用次数上限（0 表示不限制）
  dailyLimit: number;
  // 月度价格（单位：元）
  monthlyPrice: number;
  // 功能列表
  features: string[];
  // 套餐类型：subscription=订阅 / credits_pack=点数包
  type: "subscription" | "credits_pack";
  // 点数包专用：购买的积分数量
  credits?: number;
  // 点数包专用：积分有效期天数（从购买日起算）
  validDays?: number;
}

// 套餐列表（与 seed.ts + migrate-plans-v2.sql 完全一致）
const PLANS: PlanInfo[] = [
  // ===== 订阅套餐 =====
  {
    name: "基础版",
    dailyLimit: 30,
    monthlyPrice: 99,
    features: ["每日30次调用", "基础工作流", "邮件支持"],
    type: "subscription",
  },
  {
    name: "专业版",
    dailyLimit: 100,
    monthlyPrice: 299,
    features: ["每日100次调用", "全部工作流", "优先支持", "API接入"],
    type: "subscription",
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
    type: "subscription",
  },

  // ===== 点数包套餐（Phase 17.2）=====
  {
    name: "体验包",
    dailyLimit: 0,
    monthlyPrice: 6,
    features: ["50点积分", "有效期7天", "适合体验试用"],
    type: "credits_pack",
    credits: 50,
    validDays: 7,
  },
  {
    name: "月卡",
    dailyLimit: 0,
    monthlyPrice: 30,
    features: ["300点积分", "有效期30天", "适合个人轻度使用"],
    type: "credits_pack",
    credits: 300,
    validDays: 30,
  },
  {
    name: "季卡",
    dailyLimit: 0,
    monthlyPrice: 88,
    features: ["1000点积分", "有效期90天", "9折优惠", "适合个人常规使用"],
    type: "credits_pack",
    credits: 1000,
    validDays: 90,
  },
  {
    name: "年卡",
    dailyLimit: 0,
    monthlyPrice: 299,
    features: ["5000点积分", "有效期365天", "85折优惠", "适合个人重度使用"],
    type: "credits_pack",
    credits: 5000,
    validDays: 365,
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

/**
 * 获取所有套餐
 */
export function getAllPlans(): PlanInfo[] {
  return PLANS;
}

/**
 * 获取订阅套餐列表
 */
export function getSubscriptionPlans(): PlanInfo[] {
  return PLANS.filter((p) => p.type === "subscription");
}

/**
 * 获取点数包套餐列表
 */
export function getCreditsPackPlans(): PlanInfo[] {
  return PLANS.filter((p) => p.type === "credits_pack");
}

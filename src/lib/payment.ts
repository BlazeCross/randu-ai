/**
 * 支付相关类型与接口（Phase 2 完整实现）
 *
 * 当前版本（P1）仅预留接口结构，所有函数均抛出错误，
 * Phase 2 将接入 alipay-payment-integration 实现完整的支付宝支付流程：
 * - 创建支付订单（PC 网站支付 / 手机网站支付）
 * - 查询支付状态
 * - 处理支付宝异步回调通知
 *
 * 接入时需安装支付宝 SDK 并配置以下环境变量：
 * - ALIPAY_APP_ID：支付宝应用 ID
 * - ALIPAY_APP_PRIVATE_KEY：应用私钥
 * - ALIPAY_PUBLIC_KEY：支付宝公钥
 * - ALIPAY_NOTIFY_URL：异步回调地址
 * - ALIPAY_RETURN_URL：同步跳转地址
 */

// 支付订单状态
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

// 支付订单实体（对应数据库 PaymentOrder 表，Phase 2 创建）
export interface PaymentOrder {
  // 订单 ID
  id: string;
  // 用户 ID
  userId: string;
  // 套餐名称（基础版/专业版/企业版）
  planName: string;
  // 金额（单位：元）
  amount: number;
  // 订单状态
  status: PaymentStatus;
  // 创建时间
  createdAt: Date;
  // 支付时间（成功支付后写入）
  paidAt?: Date;
}

// 创建订单参数
export interface CreateOrderParams {
  // 用户 ID
  userId: string;
  // 套餐名称
  planName: string;
  // 金额（单位：元）
  amount: number;
}

/**
 * 创建支付订单
 *
 * Phase 2 实现：
 * 1. 校验套餐名称与金额
 * 2. 在数据库中创建 PaymentOrder 记录（status=pending）
 * 3. 调用支付宝 SDK 创建交易，获取支付链接或二维码
 * 4. 返回订单信息（含支付链接）
 *
 * @param params 创建订单参数
 * @returns 支付订单信息
 */
export async function createPaymentOrder(
  params: CreateOrderParams,
): Promise<PaymentOrder> {
  // Phase 2 将接入 alipay-payment-integration
  void params; // 占位：Phase 2 将使用 params 创建订单
  throw new Error("支付功能即将开放，Phase 2 实现");
}

/**
 * 查询支付订单状态
 *
 * Phase 2 实现：
 * 1. 从数据库查询订单
 * 2. 调用支付宝 SDK 查询接口同步最新状态
 * 3. 如状态变更则更新数据库记录
 * 4. 返回订单信息
 *
 * @param orderId 订单 ID
 * @returns 支付订单信息
 */
export async function queryPaymentStatus(
  orderId: string,
): Promise<PaymentOrder> {
  // Phase 2 将接入 alipay-payment-integration
  void orderId; // 占位：Phase 2 将使用 orderId 查询订单
  throw new Error("支付功能即将开放，Phase 2 实现");
}

/**
 * 处理支付宝异步回调通知
 *
 * Phase 2 实现：
 * 1. 校验支付宝签名
 * 2. 解析回调参数（trade_status, out_trade_no, total_amount 等）
 * 3. 更新订单状态为 paid
 * 4. 更新用户订阅状态（isSubscribed=true, subscriptionPlan=套餐名）
 * 5. 返回 success 给支付宝
 *
 * @param data 支付宝回调数据
 * @returns 是否处理成功
 */
export async function handlePaymentCallback(data: unknown): Promise<boolean> {
  // Phase 2 将接入 alipay-payment-integration
  void data; // 占位：Phase 2 将使用 data 处理回调
  throw new Error("支付功能即将开放，Phase 2 实现");
}

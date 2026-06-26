import { AlipaySdk } from "alipay-sdk";

/**
 * 支付宝支付工具库
 *
 * 实现电脑网站支付（alipay.trade.page.pay）：
 * - 套餐订阅：一次性月费付款
 * - 积分充值：一次性积分包购买
 *
 * 安全红线：
 * - 私钥仅存于服务端环境变量，禁止传入客户端
 * - 异步通知必须验签
 * - 支付结果以异步通知为准，不信任前端跳转参数
 *
 * 必需的环境变量：
 * - ALIPAY_APP_ID：支付宝开放平台应用 ID
 * - ALIPAY_APP_PRIVATE_KEY：应用私钥（PEM 格式，去除头尾和换行）
 * - ALIPAY_PUBLIC_KEY：支付宝公钥（PEM 格式，去除头尾和换行）
 * - ALIPAY_GATEWAY：支付宝网关（正式: https://openapi.alipay.com/gateway.do, 沙箱: https://openapi-sandbox.dl.alipaydev.com/gateway.do）
 * - ALIPAY_NOTIFY_URL：异步通知回调地址（需公网可访问，例如 https://your-domain.com/api/payment/callback）
 * - ALIPAY_RETURN_URL：同步跳转返回地址（前端页面，例如 https://your-domain.com/dashboard/orders）
 */

interface AlipayConfig {
  appId: string;
  privateKey: string;
  alipayPublicKey: string;
  gateway: string;
  notifyUrl: string;
  returnUrl: string;
  signType: "RSA2";
}

// 模块级缓存：避免每次调用都重新读取环境变量并实例化 SDK
let cachedSdk: AlipaySdk | null = null;
let cachedConfig: AlipayConfig | null = null;

/**
 * 读取并校验支付宝配置
 *
 * 缺失任一必需变量时抛出 Error，调用方应捕获并返回友好错误
 */
function loadConfig(): AlipayConfig {
  if (cachedConfig) return cachedConfig;

  const appId = process.env.ALIPAY_APP_ID;
  const privateKey = process.env.ALIPAY_APP_PRIVATE_KEY;
  const alipayPublicKey = process.env.ALIPAY_PUBLIC_KEY;
  const gateway =
    process.env.ALIPAY_GATEWAY || "https://openapi.alipay.com/gateway.do";
  const notifyUrl = process.env.ALIPAY_NOTIFY_URL;
  const returnUrl = process.env.ALIPAY_RETURN_URL;

  const missing: string[] = [];
  if (!appId) missing.push("ALIPAY_APP_ID");
  if (!privateKey) missing.push("ALIPAY_APP_PRIVATE_KEY");
  if (!alipayPublicKey) missing.push("ALIPAY_PUBLIC_KEY");
  if (!notifyUrl) missing.push("ALIPAY_NOTIFY_URL");
  if (!returnUrl) missing.push("ALIPAY_RETURN_URL");

  if (missing.length > 0) {
    throw new Error(
      `支付宝配置缺失：${missing.join(", ")}。请在 .env 或环境变量中配置。` +
        `获取方式：登录 https://open.alipay.com → 控制台 → 我的应用 → 创建网页/移动应用 → 获取 AppID、配置密钥。`,
    );
  }

  const config: AlipayConfig = {
    appId: appId!,
    privateKey: privateKey!,
    alipayPublicKey: alipayPublicKey!,
    gateway,
    notifyUrl: notifyUrl!,
    returnUrl: returnUrl!,
    signType: "RSA2",
  };
  cachedConfig = config;
  return config;
}

/**
 * 获取支付宝 SDK 实例（单例）
 *
 * 复用同一实例，避免重复实例化开销
 */
export function getAlipaySdk(): AlipaySdk {
  if (cachedSdk) return cachedSdk;
  const config = loadConfig();
  cachedSdk = new AlipaySdk({
    appId: config.appId,
    privateKey: config.privateKey,
    alipayPublicKey: config.alipayPublicKey,
    gateway: config.gateway,
    signType: "RSA2",
  });
  return cachedSdk;
}

/**
 * 校验支付宝是否已配置（用于 UI 友好降级）
 *
 * 未配置时返回 false，调用方可提示用户「支付功能未开放」
 */
export function isAlipayConfigured(): boolean {
  try {
    loadConfig();
    return true;
  } catch {
    return false;
  }
}

/**
 * 生成订单号
 *
 * 格式：RD + 时间戳(14位) + 随机数(6位) = 22 位
 * 示例：RD20260627103045123456
 */
export function generateOrderNo(): string {
  const now = new Date();
  const ts =
    now.getFullYear().toString() +
    String(now.getMonth() + 1).padStart(2, "0") +
    String(now.getDate()).padStart(2, "0") +
    String(now.getHours()).padStart(2, "0") +
    String(now.getMinutes()).padStart(2, "0") +
    String(now.getSeconds()).padStart(2, "0");
  const rand = Math.floor(Math.random() * 1000000)
    .toString()
    .padStart(6, "0");
  return `RD${ts}${rand}`;
}

/**
 * 创建电脑网站支付订单并返回支付页面 URL
 *
 * 调用 alipay.trade.page.pay 接口，返回的是一段 HTML form 自动提交脚本。
 * 前端将其写入新窗口或当前页面即可跳转到支付宝收银台。
 *
 * @param params 订单参数
 * @returns 支付页面的 HTML 表单字符串（前端 document.write 即可跳转）
 */
export async function createPagePayment(params: {
  orderNo: string;
  amount: number; // 单位：元
  subject: string; // 订单标题
  body?: string; // 订单描述
}): Promise<string> {
  const sdk = getAlipaySdk();
  const config = loadConfig();

  const result = await sdk.pageExec("alipay.trade.page.pay", {
    method: "GET",
    bizContent: {
      out_trade_no: params.orderNo,
      product_code: "FAST_INSTANT_TRADE_PAY",
      total_amount: params.amount.toFixed(2),
      subject: params.subject,
      body: params.body ?? params.subject,
    },
    notify_url: config.notifyUrl,
    return_url: config.returnUrl,
  });

  // pageExec GET 模式返回的是完整 URL 字符串
  // 前端通过 window.location.href 跳转即可
  return typeof result === "string" ? result : String(result);
}

/**
 * 验证支付宝异步通知签名
 *
 * 安全要求：收到异步通知后必须先验签，确保通知确实来自支付宝服务器
 * 而非恶意第三方伪造。
 *
 * @param notifyParams 支付宝 POST 回来的表单参数对象
 * @returns true 验签通过，false 验签失败
 */
export function verifyNotifySign(
  notifyParams: Record<string, string>,
): boolean {
  try {
    const sdk = getAlipaySdk();
    // alipay-sdk 的 checkNotifySign 接受 plain object，返回 boolean
    return sdk.checkNotifySign(notifyParams);
  } catch (error) {
    console.error("[alipay] 验签失败:", error);
    return false;
  }
}

/**
 * 查询支付宝订单状态（主动对账）
 *
 * 用于异步通知未到达时主动查询订单是否已支付。
 * @param orderNo 商户订单号（out_trade_no）
 */
export async function queryTradeStatus(
  orderNo: string,
): Promise<{
  tradeStatus: string | null;
  tradeNo: string | null;
  buyerLogonId: string | null;
  totalAmount: string | null;
}> {
  const sdk = getAlipaySdk();
  const result = await sdk.exec("alipay.trade.query", {
    bizContent: {
      out_trade_no: orderNo,
    },
  });

  const data = (
    result as { alipay_trade_query_response?: Record<string, unknown> }
  ).alipay_trade_query_response;

  if (!data) {
    return {
      tradeStatus: null,
      tradeNo: null,
      buyerLogonId: null,
      totalAmount: null,
    };
  }

  return {
    tradeStatus: (data.trade_status as string) ?? null,
    tradeNo: (data.trade_no as string) ?? null,
    buyerLogonId: (data.buyer_logon_id as string) ?? null,
    totalAmount: (data.total_amount as string) ?? null,
  };
}

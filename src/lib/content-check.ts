/**
 * 阿里云绿网（Volcengine 内容安全）文本审核 API 封装
 *
 * 调用 ROA 风格接口，使用 AccessKey 签名鉴权
 *
 * 环境变量：
 * - VOLC_ACCESS_KEY      阿里云 AccessKey ID
 * - VOLC_SECRET_KEY      阿里云 AccessKey Secret
 *
 * API 文档：
 * - 服务地址：https://visual.volcengine.com
 * - 接口路径：/api/v1/text/moderation
 * - 请求方法：POST
 */

import crypto from "crypto";

// 火山引擎内容安全服务地址
const VOLC_CONTENT_MODERATION_HOST = "visual.volcengine.com";
const VOLC_CONTENT_MODERATION_PATH = "/api/v1/text/moderation";
const VOLC_CONTENT_MODERATION_REGION = "cn-north-1";

// 请求超时（毫秒）
const REQUEST_TIMEOUT_MS = 30000;

// ===== 类型定义 =====

export interface ContentCheckResult {
  /** 内容是否安全 */
  safe: boolean;
  /** 违规类别（当 safe=false 时有值） */
  reason?: string;
  /** 命中的敏感词列表（可选） */
  blockedWords?: string[];
  /** 原始响应（用于调试） */
  rawResponse?: unknown;
}

// ===== 签名工具 =====

/**
 * 生成 Volcengine API 签名（TC3-HMAC-SHA256）
 *
 * 参考：https://www.volcengine.com/docs/牡丹江内容安全/ API 签名方式
 */
function signTC3(secretKey: string, date: string, region: string, service: string, stringToSign: string): string {
  const kDate = crypto.createHmac("sha256", `TC3${secretKey}`).update(date).digest();
  const kRegion = crypto.createHmac("sha256", kDate).update(region).digest();
  const kService = crypto.createHmac("sha256", kRegion).update(service).digest();
  const kSigning = crypto.createHmac("sha256", kService).update("request").digest();
  return crypto.createHmac("sha256", kSigning).update(stringToSign).digest("hex");
}

/**
 * 构建并发送签名请求
 */
async function signedRequest(
  method: string,
  host: string,
  path: string,
  body: string,
  accessKey: string,
  secretKey: string,
): Promise<unknown> {
  const date = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  const datetime = new Date().toISOString().replace(/[:-]|\.\d{3}/g, ""); // YYYYMMDDTHHmmssZ
  const contentSha256 = crypto.createHash("sha256").update(body).digest("hex");

  // 规范请求
  const canonicalRequest = [
    method,
    path,
    "", // query string (empty)
    `content-type:application/json\nhost:${host}\nx-date:${datetime}`,
    "",
    "content-type;host;x-date",
    contentSha256,
  ].join("\n");

  // 规范请求哈希
  const hashedCanonicalRequest = crypto.createHash("sha256").update(canonicalRequest).digest("hex");

  // 签名串
  const algorithm = "TC3-HMAC-SHA256";
  const credentialScope = `${date}/${VOLC_CONTENT_MODERATION_REGION}/content_moderation/牡丹江请求`;
  const stringToSign = [
    algorithm,
    datetime,
    credentialScope,
    hashedCanonicalRequest,
  ].join("\n");

  // 计算签名
  const signature = signTC3(secretKey, date, VOLC_CONTENT_MODERATION_REGION, "content_moderation", stringToSign);

  // Authorization 头
  const authorization = `${algorithm} Credential=${accessKey}/${credentialScope}, SignedHeaders=content-type;host;x-date, Signature=${signature}`;

  // 发送请求
  const url = `https://${host}${path}`;
  const response = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      Host: host,
      "X-Date": datetime,
      Authorization: authorization,
    },
    body,
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => "");
    throw new Error(`内容审核 API 请求失败（${response.status}）：${errText}`);
  }

  return response.json();
}

// ===== 主审核函数 =====

/**
 * 调用阿里云绿网文本审核 API
 *
 * @param text 待审核文本
 * @returns 审核结果 { safe: boolean, reason?: string }
 *
 * @example
 * const result = await checkText("这是一段正常的文本");
 * console.log(result.safe); // true
 *
 * @example
 * const result = await checkText("包含敏感词的文本");
 * console.log(result.safe); // false
 * console.log(result.reason); // "包含违规信息"
 */
export async function checkText(text: string): Promise<ContentCheckResult> {
  // 参数校验
  if (!text || !text.trim()) {
    return { safe: true };
  }

  // 环境变量检查
  const accessKey = process.env.VOLC_ACCESS_KEY;
  const secretKey = process.env.VOLC_SECRET_KEY;

  if (!accessKey || !secretKey) {
    console.warn("[content-check] VOLC_ACCESS_KEY 或 VOLC_SECRET_KEY 未配置，跳过云端审核");
    // 降级：未配置时默认通过（本地审核已在调用处处理）
    return { safe: true };
  }

  try {
    // 构建请求体
    const requestBody = {
      scenes: ["standard"], // 标准审核场景
      tasks: [
        {
          data_id: `text_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          content: text,
        },
      ],
    };

    const bodyStr = JSON.stringify(requestBody);

    // 发送签名请求
    const response = await signedRequest(
      "POST",
      VOLC_CONTENT_MODERATION_HOST,
      VOLC_CONTENT_MODERATION_PATH,
      bodyStr,
      accessKey,
      secretKey,
    ) as {
      code?: number | string;
      message?: string;
      data?: {
        results?: Array<{
          data_id?: string;
          scene?: string;
          suggestion?: string;
          details?: Array<{
            label?: string;
            confidence?: number;
            words?: string[];
          }>;
        }>;
      };
    };

    // 解析响应
    if (response.code !== 0 && response.code !== "0" && response.code !== 200) {
      console.error("[content-check] API 返回错误:", response.message || response.code);
      // API 错误时降级通过，避免阻塞用户
      return { safe: true, rawResponse: response };
    }

    const results = response.data?.results;
    if (!results || results.length === 0) {
      return { safe: true, rawResponse: response };
    }

    const firstResult = results[0];
    const suggestion = firstResult.suggestion?.toLowerCase();

    // suggestion: pass / block / review
    if (suggestion === "block") {
      const details = firstResult.details || [];
      const allWords: string[] = [];
      let reason = "内容包含违规信息";

      for (const detail of details) {
        if (detail.words && detail.words.length > 0) {
          allWords.push(...detail.words);
        }
        if (detail.label) {
          reason = `内容包含${detail.label}类违规信息`;
        }
      }

      // 过滤日志
      console.log(`[content-check] 内容审核未通过: reason=${reason}, blockedWords=${JSON.stringify(allWords)}`);

      return {
        safe: false,
        reason,
        blockedWords: allWords.slice(0, 10), // 最多返回 10 个敏感词
        rawResponse: response,
      };
    }

    return { safe: true, rawResponse: response };
  } catch (error) {
    console.error("[content-check] 调用内容审核 API 异常:", error);
    // 网络错误时降级通过，避免阻塞用户
    return {
      safe: true,
      reason: error instanceof Error ? error.message : "内容审核服务异常",
    };
  }
}

/**
 * 过滤文本中的敏感词（用 *** 替换）
 *
 * @param text 原始文本
 * @param blockedWords 敏感词列表
 * @returns 脱敏后的文本
 *
 * @example
 * const masked = maskBlockedWords("代开发票请联系我", ["代开发票"]);
 * console.log(masked); // "***请联系我"
 */
export function maskBlockedWords(text: string, blockedWords: string[]): string {
  if (!blockedWords || blockedWords.length === 0 || !text) {
    return text;
  }

  let result = text;
  for (const word of blockedWords) {
    if (word && word.trim()) {
      // 替换敏感词为 ***
      const regex = new RegExp(word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
      result = result.replace(regex, "***");
    }
  }
  return result;
}

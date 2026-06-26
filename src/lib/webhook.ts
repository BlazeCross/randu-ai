import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";

/**
 * Webhook 模块（Phase 3.6）
 *
 * 用途：
 * 1. 接收火山方舟 Seedance 任务状态回调（POST /api/external/webhook/volcengine）
 * 2. 任务完成时主动转发事件给用户配置的 webhookUrl
 *
 * 安全：
 * - 转发给用户时使用 HMAC-SHA256 签名（webhookSecret）
 * - 用户在接收端通过 X-Webhook-Signature 头校验真实性
 *
 * 重试策略：
 * - 单次失败不重试（避免长任务阻塞）
 * - 用户可基于状态轮询接口兜底（幂等设计）
 */

// Webhook 转发超时（毫秒）
const WEBHOOK_FORWARD_TIMEOUT_MS = 10_000;

// Webhook 事件类型
export type WebhookEventType =
  | "video.task_completed"
  | "video.task_failed";

// Webhook 转发负载
export interface WebhookPayload {
  /** 事件类型 */
  event: WebhookEventType;
  /** 触发时间（ISO 8601） */
  timestamp: string;
  /** 关联的任务 ID（火山方舟任务 ID） */
  taskId: string;
  /** 任务状态：completed / failed */
  status: "completed" | "failed";
  /** 视频地址（仅 completed 时存在） */
  videoUrl?: string;
  /** 尾帧图片地址（仅生成时开启 return_last_frame 时存在） */
  lastFrameUrl?: string;
  /** 错误信息（仅 failed 时存在） */
  errorMessage?: string;
  /** Token 消耗 */
  tokensUsed?: number;
}

/**
 * 计算给定负载的 HMAC-SHA256 签名
 *
 * @param payload   负载对象（会被 JSON.stringify）
 * @param secret    API Key 的 webhookSecret
 * @returns 签名十六进制字符串
 */
export function signWebhookPayload(
  payload: WebhookPayload,
  secret: string,
): string {
  const body = JSON.stringify(payload);
  return crypto.createHmac("sha256", secret).update(body).digest("hex");
}

/**
 * 转发 Webhook 事件到用户配置的 URL
 *
 * 流程：
 * 1. 查找 UsageLog.taskId 关联的 API Key
 * 2. 若该 Key 配置了 webhookUrl + webhookSecret，则发送 POST 请求
 * 3. 请求头包含 X-Webhook-Signature（HMAC-SHA256 hex）
 *
 * 失败处理：
 * - 仅记录日志，不抛异常（避免阻塞 Webhook 接收端点）
 * - 用户可基于状态轮询接口兜底（幂等设计）
 *
 * @param taskId   火山方舟任务 ID
 * @param payload  事件负载
 */
export async function forwardWebhookEvent(
  taskId: string,
  payload: WebhookPayload,
): Promise<void> {
  try {
    // 查找任务关联的 API Key（通过 UsageLog → 关联链路）
    // UsageLog 没有 apiKeyId 关系，但 CallLog 表的 workflowId 字段保存了 taskId
    // 通过 CallLog 反查 apiKeyId，再获取 webhook 配置
    const callLog = await prisma.callLog.findFirst({
      where: { workflowId: taskId },
      select: {
        apiKeyId: true,
      },
    });

    if (!callLog) {
      // 无关联的 API Key 调用记录（可能来自直接工作台调用，非外部 API）
      // 静默跳过
      return;
    }

    const apiKey = await prisma.apiKey.findUnique({
      where: { id: callLog.apiKeyId },
      select: { webhookUrl: true, webhookSecret: true },
    });

    if (!apiKey || !apiKey.webhookUrl || !apiKey.webhookSecret) {
      // 用户未配置 Webhook，跳过
      return;
    }

    // 计算签名
    const signature = signWebhookPayload(payload, apiKey.webhookSecret);

    // 发送 POST 请求
    const res = await fetch(apiKey.webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Webhook-Signature": signature,
        "X-Webhook-Event": payload.event,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(WEBHOOK_FORWARD_TIMEOUT_MS),
    });

    if (!res.ok) {
      console.warn(
        `[webhook] 转发失败：${apiKey.webhookUrl} 返回 ${res.status}`,
      );
    }
  } catch (error) {
    // 转发失败：记录日志但不抛异常
    console.error(
      `[webhook] 转发异常：${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * 生成新的 Webhook 签名密钥
 *
 * 用于 API Key 创建/更新 webhookUrl 时自动生成 secret
 */
export function generateWebhookSecret(): string {
  return crypto.randomBytes(32).toString("hex");
}

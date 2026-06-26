import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { forwardWebhookEvent, type WebhookPayload } from "@/lib/webhook";

/**
 * POST /api/external/webhook/volcengine - 接收火山方舟 Seedance 任务回调
 *
 * 火山方舟在视频任务状态变化时会主动 POST 到此地址（callback_url）。
 * 回调请求体结构同查询任务 API 的返回体，包含：
 * - id: 任务 ID（cgt-xxx 格式）
 * - status: queued / running / cancelled / succeeded / failed / expired
 * - content: { video_url?, last_frame_url? }
 * - usage: { completion_tokens?, total_tokens? }
 * - error: { code?, message? }
 *
 * 处理流程：
 * 1. 解析回调负载，提取 taskId 和状态
 * 2. 仅在 succeeded/failed/expired 时更新 UsageLog（终态）
 * 3. 若任务完成且有 videoUrl，触发 Webhook 转发（用户配置的 webhookUrl）
 * 4. 直接返回 200（避免火山方舟重试）
 *
 * 注：此接口为公开接口（火山方舟调用，无 API Key 鉴权），
 *     仅校验请求体格式；非法请求会返回 400。
 */
export async function POST(request: Request): Promise<Response> {
  try {
    const body = (await request.json()) as {
      id?: string;
      status?: string;
      content?: { video_url?: string; last_frame_url?: string };
      usage?: { completion_tokens?: number; total_tokens?: number };
      error?: { code?: string; message?: string } | null;
    };

    // 基本校验
    if (!body.id || !body.status) {
      return NextResponse.json(
        { message: "请求体缺少 id 或 status 字段" },
        { status: 400 },
      );
    }

    const taskId = body.id;
    const rawStatus = body.status.toLowerCase();
    const now = new Date();

    // 查找关联的 UsageLog
    const usageLog = await prisma.usageLog.findFirst({
      where: { taskId },
      select: { id: true, status: true },
    });

    if (!usageLog) {
      // 未找到关联任务（可能直接来自工作台，非外部 API 调用）
      // 静默返回 200，避免火山方舟重试
      return NextResponse.json({ received: true, matched: false });
    }

    // 仅处理终态，避免每次状态变化都写库
    // queued/running → 跳过；succeeded/failed/expired/cancelled → 更新
    if (
      rawStatus === "succeeded" ||
      rawStatus === "failed" ||
      rawStatus === "expired" ||
      rawStatus === "cancelled"
    ) {
      const isSucceeded = rawStatus === "succeeded";
      const internalStatus = isSucceeded ? "completed" : "failed";

      // 已是终态则跳过（幂等：火山方舟可能重试）
      if (usageLog.status === "completed" || usageLog.status === "failed") {
        return NextResponse.json({ received: true, alreadyFinal: true });
      }

      // 更新 UsageLog
      await prisma.usageLog.update({
        where: { id: usageLog.id },
        data: {
          status: internalStatus,
          outputUrl: body.content?.video_url ?? null,
          completedAt: now,
          errorMessage: isSucceeded
            ? null
            : body.error?.message || body.error?.code || `任务${rawStatus}`,
        },
      });

      // 触发 Webhook 转发（仅终态）
      const payload: WebhookPayload = {
        event: isSucceeded
          ? "video.task_completed"
          : "video.task_failed",
        timestamp: now.toISOString(),
        taskId,
        status: isSucceeded ? "completed" : "failed",
        videoUrl: body.content?.video_url,
        lastFrameUrl: body.content?.last_frame_url,
        errorMessage: isSucceeded
          ? undefined
          : body.error?.message || body.error?.code,
        tokensUsed: body.usage?.completion_tokens ?? body.usage?.total_tokens,
      };

      // 异步转发（不阻塞响应）
      // 使用 void 标记故意不 await（避免火山方舟等待用户回调完成）
      void forwardWebhookEvent(taskId, payload);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[webhook/volcengine] 处理失败:", error);
    // 即便异常也返回 200，避免火山方舟重试
    return NextResponse.json({ received: true, error: true });
  }
}

/**
 * GET /api/external/webhook/volcengine - 探活接口
 *
 * 用于测试 URL 可达性。火山方舟在配置 callback_url 时可能发起探活请求。
 */
export function GET(): Response {
  return NextResponse.json({ ok: true, service: "volcengine-webhook" });
}

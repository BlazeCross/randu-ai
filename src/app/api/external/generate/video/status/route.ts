import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  requireApiKey,
  logApiCall,
  getClientIp,
} from "@/lib/apiKey";
import { getVideoTaskStatus } from "@/lib/volcengine";

// 视频生成消耗点数（与提交接口保持一致）
const VIDEO_CREDITS_COST = 30;

// CallLog 中用于标识已扣点记录的字段值
const STATUS_ENDPOINT = "/api/external/generate/video/status";

/**
 * GET /api/external/generate/video/status - 查询视频生成任务状态
 *
 * 鉴权：X-API-Key 请求头
 * 查询参数：taskId（必填，POST 接口返回的 taskId）
 *
 * 流程：
 * 1. 验证 API Key
 * 2. 查询 Volcengine 任务状态
 * 3. 若任务成功：
 *    - 幂等检查：查询 CallLog 是否已存在「该 taskId + endpoint + status=success」记录
 *    - 若不存在：扣点 + 记 CallLog（status=success）
 *    - 若已存在：跳过扣点（保证幂等，多次轮询不重复扣点）
 * 4. 若任务失败：记 CallLog（status=failed，不扣点）
 * 5. 返回状态 + 视频 URL（成功时）
 *
 * 幂等性设计：
 *   由于客户端可能多次轮询同一个 taskId，本接口通过查询 CallLog 表
 *   workflowId=taskId AND endpoint=STATUS_ENDPOINT AND status="success"
 *   来判断是否已扣点。已扣点的请求直接返回缓存的视频 URL。
 */
export const GET = requireApiKey(
  async (request, { apiKeyId, userId }) => {
    const startTime = Date.now();

    // 解析 taskId
    const url = new URL(request.url);
    const taskId = url.searchParams.get("taskId")?.trim();
    if (!taskId) {
      return NextResponse.json(
        { message: "缺少 taskId 查询参数" },
        { status: 400 },
      );
    }

    // 1. 幂等检查：是否已处理过此 taskId
    //    用 CallLog.workflowId 存储 Volcengine taskId（约定）
    const existingLog = await prisma.callLog.findFirst({
      where: {
        workflowId: taskId,
        endpoint: STATUS_ENDPOINT,
        userId,
      },
      select: {
        id: true,
        status: true,
        creditsCost: true,
        errorMessage: true,
      },
    });

    // 已有终态记录（success/failed），直接返回缓存结果
    if (existingLog && existingLog.status !== "pending") {
      if (existingLog.status === "success") {
        // 成功已扣点：重新查询 Volcengine 获取视频 URL（视频 URL 24 小时内有效）
        try {
          const result = await getVideoTaskStatus(taskId);
          if (result.status === "completed" && result.videoUrl) {
            return NextResponse.json({
              taskId,
              status: "succeeded",
              videoUrl: result.videoUrl,
              lastFrameUrl: result.lastFrameUrl ?? null,
              tokensUsed: result.tokensUsed ?? 0,
              creditsCost: existingLog.creditsCost,
              cached: true,
            });
          }
        } catch (error) {
          // 查询失败：返回缓存状态
          console.error("[video/status] 重新查询 Volcengine 失败:", error);
        }
        return NextResponse.json({
          taskId,
          status: "succeeded",
          videoUrl: null,
          message:
            "任务已完成并扣点，但视频 URL 可能已过期（24 小时有效期）",
          creditsCost: existingLog.creditsCost,
          cached: true,
        });
      }

      // failed 状态
      return NextResponse.json({
        taskId,
        status: "failed",
        errorMessage: existingLog.errorMessage ?? "任务执行失败",
        creditsCost: 0,
        cached: true,
      });
    }

    // 2. 查询 Volcengine 任务状态
    let volcResult;
    try {
      volcResult = await getVideoTaskStatus(taskId);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "查询视频任务失败";
      await logApiCall({
        apiKeyId,
        userId,
        endpoint: STATUS_ENDPOINT,
        method: "GET",
        creditsCost: 0,
        status: "failed",
        errorMessage,
        responseTime: Date.now() - startTime,
        clientIp: getClientIp(request),
        // 把 taskId 存到 workflowId 字段用于幂等检查
        workflowId: taskId,
      }).catch(() => {});

      return NextResponse.json(
        { message: `查询视频任务失败：${errorMessage}` },
        { status: 502 },
      );
    }

    // 3. 根据状态处理
    // pending / running：返回当前状态，不扣点
    if (volcResult.status === "pending" || volcResult.status === "running") {
      return NextResponse.json({
        taskId,
        status: volcResult.status === "pending" ? "queued" : "running",
        videoUrl: null,
        message: "任务处理中，请稍后重试",
      });
    }

    // 4. succeeded：扣点 + 记日志（幂等）
    if (volcResult.status === "completed") {
      // 再次检查（防止并发）：数据库中是否已有此 taskId 的 success 记录
      // 使用 upsert 模式：先尝试创建，若已存在则跳过
      // 这里通过 transaction 保证原子性
      try {
        await prisma.$transaction(async (tx) => {
          // 1. 检查是否已扣点
          const existing = await tx.callLog.findFirst({
            where: {
              workflowId: taskId,
              endpoint: STATUS_ENDPOINT,
              userId,
              status: "success",
            },
            select: { id: true },
          });

          if (existing) {
            // 已扣点：跳过
            return;
          }

          // 2. 扣点
          await tx.user.update({
            where: { id: userId },
            data: {
              credits: { decrement: VIDEO_CREDITS_COST },
              totalUsed: { increment: 1 },
            },
          });
          await tx.apiKey.update({
            where: { id: apiKeyId },
            data: {
              creditsUsed: { increment: VIDEO_CREDITS_COST },
              totalCalls: { increment: 1 },
              lastUsedAt: new Date(),
            },
          });

          // 3. 记 CallLog（status=success）
          await tx.callLog.create({
            data: {
              apiKeyId,
              userId,
              workflowId: taskId,
              endpoint: STATUS_ENDPOINT,
              method: "GET",
              creditsCost: VIDEO_CREDITS_COST,
              status: "success",
              responseTime: Date.now() - startTime,
              clientIp: getClientIp(request),
            },
          });
        });
      } catch (error) {
        console.error("[video/status] 扣点事务失败:", error);
        // 扣点失败不应阻塞返回视频 URL
      }

      return NextResponse.json({
        taskId,
        status: "succeeded",
        videoUrl: volcResult.videoUrl ?? null,
        lastFrameUrl: volcResult.lastFrameUrl ?? null,
        tokensUsed: volcResult.tokensUsed ?? 0,
        creditsCost: VIDEO_CREDITS_COST,
      });
    }

    // 5. failed：记日志，不扣点
    if (volcResult.status === "failed") {
      await logApiCall({
        apiKeyId,
        userId,
        endpoint: STATUS_ENDPOINT,
        method: "GET",
        creditsCost: 0,
        status: "failed",
        errorMessage: volcResult.errorMessage ?? "视频生成任务执行失败",
        responseTime: Date.now() - startTime,
        clientIp: getClientIp(request),
        workflowId: taskId,
      }).catch(() => {});

      return NextResponse.json({
        taskId,
        status: "failed",
        errorMessage: volcResult.errorMessage ?? "视频生成任务执行失败",
        creditsCost: 0,
      });
    }

    // 未知状态：返回当前状态
    return NextResponse.json({
      taskId,
      status: volcResult.status,
      videoUrl: null,
      message: "未知任务状态",
    });
  },
);

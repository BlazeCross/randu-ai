import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { getTaskStatus, type CozeTaskResult } from "@/lib/coze";

/**
 * 查询任务状态（需鉴权）
 *
 * 路由：GET /api/task/[id]/status
 * - 路径参数 id：UsageLog ID（创建任务时返回的 taskId）
 *
 * 流程：
 * 1. 查询当前用户的 UsageLog（确保只能查自己的任务）
 * 2. 不存在返回 404
 * 3. 若状态已是 completed/failed，直接返回（不重复查询 Coze）
 * 4. 若状态是 pending/running，调用 Coze 查询并同步更新
 * 5. 返回最新状态
 *
 * 错误响应：401 / 404 / 500
 */
export const GET = requireAuth(
  async (
    request: Request,
    { userId }: { userId: string },
  ) => {
    try {
      // 从 URL 中解析路径参数 id
      // 期望路径：/api/task/[id]/status
      const { pathname } = new URL(request.url);
      const segments = pathname.split("/").filter(Boolean);
      const logId = segments[segments.length - 2];

      if (!logId) {
        return NextResponse.json(
          { message: "缺少任务 ID" },
          { status: 400 },
        );
      }

      // 1. 查询当前用户的 UsageLog（关联 Workflow 获取 cozeWorkflowId）
      const usageLog = await prisma.usageLog.findUnique({
        where: { id: logId },
        include: {
          workflow: {
            select: { cozeWorkflowId: true },
          },
        },
      });

      // 2. 不存在或不属于当前用户
      if (!usageLog || usageLog.userId !== userId) {
        return NextResponse.json(
          { message: "任务不存在" },
          { status: 404 },
        );
      }

      // 3. 已是终态（completed/failed），直接返回
      if (
        usageLog.status === "completed" ||
        usageLog.status === "failed"
      ) {
        return NextResponse.json({
          status: usageLog.status,
          outputUrl: usageLog.outputUrl,
          errorMessage: usageLog.errorMessage,
          tokensUsed: usageLog.tokensUsed,
          createdAt: usageLog.createdAt,
          completedAt: usageLog.completedAt,
        });
      }

      // 4. pending/running：查询 Coze 状态
      // 若 taskId 缺失，无法查询
      if (!usageLog.taskId) {
        return NextResponse.json({
          status: usageLog.status,
          outputUrl: usageLog.outputUrl,
          errorMessage: usageLog.errorMessage,
          tokensUsed: usageLog.tokensUsed,
          createdAt: usageLog.createdAt,
          completedAt: usageLog.completedAt,
        });
      }

      let cozeResult: CozeTaskResult;
      try {
        cozeResult = await getTaskStatus(
          usageLog.taskId,
          usageLog.workflow.cozeWorkflowId,
        );
      } catch (error) {
        // Coze 查询失败：保持原状态，返回错误信息但不修改数据库
        console.error("查询 Coze 任务状态失败:", error);
        return NextResponse.json(
          {
            message:
              error instanceof Error
                ? error.message
                : "查询任务状态失败",
          },
          { status: 500 },
        );
      }

      // 5. 根据 Coze 返回更新 UsageLog
      if (cozeResult.status === "completed") {
        await prisma.usageLog.update({
          where: { id: usageLog.id },
          data: {
            status: "completed",
            outputUrl: cozeResult.output ?? null,
            tokensUsed: cozeResult.tokensUsed ?? 0,
            completedAt: new Date(),
          },
        });

        return NextResponse.json({
          status: "completed",
          outputUrl: cozeResult.output ?? null,
          errorMessage: null,
          tokensUsed: cozeResult.tokensUsed ?? 0,
          createdAt: usageLog.createdAt,
          completedAt: new Date(),
        });
      }

      if (cozeResult.status === "failed") {
        await prisma.usageLog.update({
          where: { id: usageLog.id },
          data: {
            status: "failed",
            errorMessage: cozeResult.errorMessage ?? "任务执行失败",
            completedAt: new Date(),
          },
        });

        return NextResponse.json({
          status: "failed",
          outputUrl: null,
          errorMessage: cozeResult.errorMessage ?? "任务执行失败",
          tokensUsed: 0,
          createdAt: usageLog.createdAt,
          completedAt: new Date(),
        });
      }

      // running / pending：保持原状态
      return NextResponse.json({
        status: cozeResult.status,
        outputUrl: null,
        errorMessage: null,
        tokensUsed: 0,
        createdAt: usageLog.createdAt,
        completedAt: null,
      });
    } catch (error) {
      console.error("查询任务状态失败:", error);
      return NextResponse.json(
        { message: "服务器内部错误" },
        { status: 500 },
      );
    }
  },
);

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { submitWorkflowTask } from "@/lib/coze";

// 试用期使用次数上限
const TRIAL_LIMIT = 10;

// 请求体结构
interface RunWorkflowBody {
  imageUrl?: string;
}

/**
 * 提交工作流运行任务（需鉴权）
 *
 * 路由：POST /api/workflow/[id]/run
 * - 路径参数 id：工作流 ID（数据库 Workflow.id）
 * - 请求体：{ imageUrl } 用户上传的图片 URL
 *
 * 流程：
 * 1. 校验工作流存在
 * 2. 试用次数校验：未订阅用户试用期使用次数 >= 10 时拒绝
 * 3. 创建 UsageLog 记录（status=pending）
 * 4. 调用 Coze 异步接口提交任务
 * 5. 更新 UsageLog（taskId、status=running）
 * 6. 返回 usageLog.id 供前端轮询
 *
 * 错误响应：401 / 403 / 404 / 500
 */
export const POST = requireAuth(
  async (
    request: Request,
    { userId }: { userId: string },
  ) => {
    try {
      // Next.js 16 中需通过 URL 解析路径参数
      const { pathname } = new URL(request.url);
      const segments = pathname.split("/").filter(Boolean);
      // 期望路径：/api/workflow/[id]/run
      const workflowId = segments[segments.length - 2];

      if (!workflowId) {
        return NextResponse.json(
          { message: "缺少工作流 ID" },
          { status: 400 },
        );
      }

      // 解析请求体
      let body: RunWorkflowBody = {};
      try {
        body = (await request.json()) as RunWorkflowBody;
      } catch {
        return NextResponse.json(
          { message: "请求体格式错误，需为 JSON" },
          { status: 400 },
        );
      }

      const { imageUrl } = body;
      if (!imageUrl || typeof imageUrl !== "string") {
        return NextResponse.json(
          { message: "缺少 imageUrl 参数" },
          { status: 400 },
        );
      }

      // 1. 查询工作流
      const workflow = await prisma.workflow.findUnique({
        where: { id: workflowId },
        select: {
          id: true,
          name: true,
          cozeWorkflowId: true,
          status: true,
        },
      });

      if (!workflow) {
        return NextResponse.json(
          { message: "工作流不存在" },
          { status: 404 },
        );
      }

      // 2. 试用次数校验
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          trialExpiresAt: true,
          isSubscribed: true,
        },
      });

      if (!user) {
        return NextResponse.json(
          { message: "用户不存在" },
          { status: 404 },
        );
      }

      // 未订阅用户需校验试用状态：试用过期或次数用完均拒绝
      if (!user.isSubscribed) {
        // 试用已过期
        if (user.trialExpiresAt.getTime() < Date.now()) {
          return NextResponse.json(
            {
              message: "试用已过期，请升级套餐",
              trialLimit: TRIAL_LIMIT,
            },
            { status: 403 },
          );
        }

        const trialUsageCount = await prisma.usageLog.count({
          where: {
            userId,
            createdAt: { lte: user.trialExpiresAt },
          },
        });

        if (trialUsageCount >= TRIAL_LIMIT) {
          return NextResponse.json(
            {
              message: "试用次数已用完，请升级套餐",
              trialLimit: TRIAL_LIMIT,
            },
            { status: 403 },
          );
        }
      }

      // 3. 创建 UsageLog 记录（pending）
      const usageLog = await prisma.usageLog.create({
        data: {
          userId,
          workflowId: workflow.id,
          status: "pending",
          inputUrl: imageUrl,
        },
      });

      // 4. 调用 Coze 异步接口提交任务
      try {
        const { taskId: cozeTaskId } = await submitWorkflowTask(
          workflow.cozeWorkflowId,
          { input: imageUrl },
        );

        // 5. 更新 UsageLog：taskId、status=running
        await prisma.usageLog.update({
          where: { id: usageLog.id },
          data: {
            taskId: cozeTaskId,
            status: "running",
          },
        });

        // 6. 返回 usageLog.id 供前端轮询
        return NextResponse.json({
          taskId: usageLog.id,
          cozeTaskId,
          status: "running",
        });
      } catch (error) {
        // Coze 调用失败：更新 UsageLog 状态为 failed
        const errorMessage =
          error instanceof Error ? error.message : "Coze 任务提交失败";

        await prisma.usageLog.update({
          where: { id: usageLog.id },
          data: {
            status: "failed",
            errorMessage,
          },
        });

        console.error("提交 Coze 任务失败:", error);
        return NextResponse.json(
          { message: `提交任务失败：${errorMessage}` },
          { status: 500 },
        );
      }
    } catch (error) {
      console.error("运行工作流失败:", error);
      return NextResponse.json(
        { message: "服务器内部错误" },
        { status: 500 },
      );
    }
  },
);

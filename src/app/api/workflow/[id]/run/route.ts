import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { submitWorkflowTask } from "@/lib/coze";
import { submitVideoTask } from "@/lib/volcengine";
import { TRIAL_LIMIT } from "@/lib/trial";
import { parseInputSchema, type SchemaField } from "@/lib/schema";

/**
 * 提交工作流运行任务（需鉴权）
 *
 * 路由：POST /api/workflow/[id]/run
 * - 路径参数 id：工作流 ID（数据库 Workflow.id）
 * - 请求体：动态参数对象，键名对应 inputSchema.fields[].name
 *
 * Phase 2.4 改造点：
 * - 不再硬编码 { imageUrl }，而是按工作流的 inputSchema 校验并构造参数
 * - 兼容旧工作流（无 inputSchema）：保留 { yuansitu: body.imageUrl } 兼容路径
 *
 * 流程：
 * 1. 校验工作流存在
 * 2. 试用次数校验
 * 3. 按 inputSchema 校验请求体参数，构造 Coze parameters
 * 4. 创建 UsageLog 记录（status=pending）
 * 5. 调用 Coze 异步接口提交任务
 * 6. 更新 UsageLog（taskId、status=running）
 * 7. 返回 usageLog.id 供前端轮询
 */
export const POST = requireAuth(
  async (
    request: Request,
    { userId, params }: { userId: string; params?: Promise<Record<string, string>> },
  ) => {
    try {
      // Next.js 16：动态路由 params 为 Promise，需 await
      const { id: workflowId } = await params!;

      if (!workflowId) {
        return NextResponse.json(
          { message: "缺少工作流 ID" },
          { status: 400 },
        );
      }

      // 解析请求体（任意 JSON 对象）
      let body: Record<string, unknown> = {};
      try {
        body = (await request.json()) as Record<string, unknown>;
      } catch {
        return NextResponse.json(
          { message: "请求体格式错误，需为 JSON" },
          { status: 400 },
        );
      }

      // 1. 并行查询工作流和用户（减少 1 个串行 RTT）
      const [workflow, user] = await Promise.all([
        prisma.workflow.findUnique({
          where: { id: workflowId },
          select: {
            id: true,
            name: true,
            cozeWorkflowId: true,
            status: true,
            inputSchema: true,
            source: true,
            volcModel: true,
          },
        }),
        prisma.user.findUnique({
          where: { id: userId },
          select: {
            trialExpiresAt: true,
            isSubscribed: true,
          },
        }),
      ]);

      if (!workflow) {
        return NextResponse.json(
          { message: "工作流不存在" },
          { status: 404 },
        );
      }

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

      // 2. 按 inputSchema 校验并构造 Coze 参数
      const inputSchema = parseInputSchema(workflow.inputSchema);
      let parameters: Record<string, unknown>;
      let inputUrlForLog: string | null = null;

      if (inputSchema) {
        // 按字段定义校验请求体
        const validationError = validateAndBuildParameters(
          body,
          inputSchema.fields,
        );
        if (validationError.error) {
          return NextResponse.json(
            { message: validationError.error },
            { status: 400 },
          );
        }
        parameters = validationError.parameters!;

        // 从 image 类型字段中提取首个 URL，用于 UsageLog.inputUrl 记录
        for (const field of inputSchema.fields) {
          if (field.type === "image") {
            const v = parameters[field.name];
            if (typeof v === "string" && v) {
              inputUrlForLog = v;
              break;
            }
          }
        }
      } else {
        // 兼容旧工作流（无 inputSchema）：保留 imageUrl 入口
        const imageUrl = body.imageUrl;
        if (typeof imageUrl !== "string" || !imageUrl) {
          return NextResponse.json(
            { message: "缺少 imageUrl 参数" },
            { status: 400 },
          );
        }
        parameters = { yuansitu: imageUrl };
        inputUrlForLog = imageUrl;
      }

      // 3. 创建 UsageLog 记录（pending）
      const usageLog = await prisma.usageLog.create({
        data: {
          userId,
          workflowId: workflow.id,
          status: "pending",
          inputUrl: inputUrlForLog,
        },
      });

      // 4. 按工作流来源派发任务（Coze / Volcengine Seedance）
      try {
        let externalTaskId: string;

        if (workflow.source === "volcengine") {
          // Volcengine Seedance 视频生成
          // 从校验后的参数中提取首帧图片 URL（按 inputSchema 字段 type=image 提取）
          let firstFrameUrl: string | undefined;
          let promptText: string | undefined;
          if (inputSchema) {
            for (const field of inputSchema.fields) {
              if (field.type === "image" && !firstFrameUrl) {
                const v = parameters[field.name];
                if (typeof v === "string" && v) firstFrameUrl = v;
              }
              if (
                (field.type === "text" || field.type === "textarea") &&
                !promptText
              ) {
                const v = parameters[field.name];
                if (typeof v === "string" && v) promptText = v;
              }
            }
          }

          const { taskId: volcTaskId } = await submitVideoTask({
            model: workflow.volcModel ?? undefined,
            prompt: promptText,
            firstFrameUrl,
          });
          externalTaskId = volcTaskId;
        } else {
          // 默认走 Coze 工作流
          const { executeId: cozeExecuteId } = await submitWorkflowTask(
            workflow.cozeWorkflowId,
            parameters,
          );
          externalTaskId = cozeExecuteId;
        }

        // 5. 更新 UsageLog：taskId、status=running
        await prisma.usageLog.update({
          where: { id: usageLog.id },
          data: {
            taskId: externalTaskId,
            status: "running",
          },
        });

        // 6. 返回 usageLog.id 供前端轮询
        return NextResponse.json({
          taskId: usageLog.id,
          externalTaskId,
          status: "running",
        });
      } catch (error) {
        // 任务提交失败：更新 UsageLog 状态为 failed
        const errorMessage =
          error instanceof Error ? error.message : "任务提交失败";

        await prisma.usageLog.update({
          where: { id: usageLog.id },
          data: {
            status: "failed",
            errorMessage,
          },
        });

        console.error("提交工作流任务失败:", error);
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

/**
 * 按 inputSchema 字段定义校验请求体，并构造 Coze parameters 对象
 *
 * 校验规则：
 * - required 字段必须存在且非空
 * - text/textarea：必须为字符串
 * - number：必须为数字或可转换为数字的字符串
 * - image：必须为字符串（URL）
 * - select：必须在 options 列表中（如果定义了 options）
 *
 * @returns { error: string } 校验失败
 * @returns { parameters: Record<string, unknown> } 校验成功
 */
function validateAndBuildParameters(
  body: Record<string, unknown>,
  fields: SchemaField[],
):
  | { error: string; parameters?: undefined }
  | { error?: undefined; parameters: Record<string, unknown> } {
  const parameters: Record<string, unknown> = {};

  for (const field of fields) {
    const raw = body[field.name];

    // 必填校验
    const isEmpty =
      raw === undefined ||
      raw === null ||
      raw === "" ||
      (typeof raw === "string" && raw.trim() === "");

    if (isEmpty) {
      // 未提供时，若有默认值则使用默认值
      if (field.defaultValue !== undefined && field.defaultValue !== null) {
        parameters[field.name] = field.defaultValue;
        continue;
      }
      // 必填字段缺失
      if (field.required) {
        return { error: `请填写「${field.label}」` };
      }
      // 非必填字段缺失：跳过
      continue;
    }

    // 按类型校验
    switch (field.type) {
      case "text":
      case "textarea":
      case "image": {
        if (typeof raw !== "string") {
          return { error: `「${field.label}」格式不正确` };
        }
        // image 类型简单校验是否为 URL
        if (field.type === "image" && !/^https?:\/\//i.test(raw)) {
          return { error: `「${field.label}」必须是有效的图片 URL` };
        }
        parameters[field.name] = raw;
        break;
      }
      case "number": {
        const num =
          typeof raw === "number"
            ? raw
            : Number(raw);
        if (Number.isNaN(num)) {
          return { error: `「${field.label}」必须是数字` };
        }
        parameters[field.name] = num;
        break;
      }
      case "select": {
        if (typeof raw !== "string") {
          return { error: `「${field.label}」格式不正确` };
        }
        // 校验选项是否在 options 列表中
        if (field.options && field.options.length > 0) {
          if (!field.options.includes(raw)) {
            return { error: `「${field.label}」的选项不合法` };
          }
        }
        parameters[field.name] = raw;
        break;
      }
      default:
        // 未知类型，原样保留
        parameters[field.name] = raw;
        break;
    }
  }

  return { parameters };
}

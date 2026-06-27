import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  requireApiKey,
  preDeductUserCredits,
  refundUserCredits,
  confirmKeyUsage,
  logApiCall,
  getClientIp,
} from "@/lib/apiKey";
import { chatCompletion } from "@/lib/volcengine";

// 单次文案生成消耗点数
const COPY_CREDITS_COST = 1;
// prompt 长度上限
const MAX_PROMPT_LENGTH = 2000;
// 生成文案的最大 token 数
const COPY_MAX_TOKENS = 1024;

// 请求体
interface CopyRequestBody {
  prompt?: string;
  style?: string;
}

/**
 * POST /api/external/generate/copy - AI 文案生成
 *
 * 鉴权：X-API-Key 请求头
 * 请求体：{ prompt: string, style?: string }
 * 流程：验证 Key → 校验账号 → 预扣费 → 调用豆包 → 成功确认/失败退还 → 记日志
 *
 * 用于 Coze 插件调用火山方舟豆包模型生成文案
 */
export const POST = requireApiKey(
  async (request, { apiKeyId, userId }) => {
    const startTime = Date.now();

    // 解析请求体
    let body: CopyRequestBody;
    try {
      body = (await request.json()) as CopyRequestBody;
    } catch {
      return NextResponse.json(
        { message: "请求体格式错误，需为 JSON" },
        { status: 400 },
      );
    }

    const prompt = body.prompt?.trim();
    const style = body.style?.trim();

    // 校验 prompt
    if (!prompt) {
      return NextResponse.json(
        { message: "缺少 prompt 参数" },
        { status: 400 },
      );
    }
    if (prompt.length > MAX_PROMPT_LENGTH) {
      return NextResponse.json(
        { message: `prompt 长度不能超过 ${MAX_PROMPT_LENGTH} 字` },
        { status: 400 },
      );
    }

    // 1. 校验账号状态
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { credits: true, status: true },
    });
    if (!user || user.status === "blocked") {
      return NextResponse.json(
        { message: "账号不可用" },
        { status: 403 },
      );
    }

    // 2. 预扣费（原子操作，防并发超扣）
    const preDeducted = await preDeductUserCredits(userId, COPY_CREDITS_COST);
    if (!preDeducted) {
      return NextResponse.json(
        {
          message: "点数不足，请充值",
          creditsCost: COPY_CREDITS_COST,
          balance: user.credits,
        },
        { status: 402 },
      );
    }

    // 3. 调用豆包生成文案
    const systemContent = `你是一个专业的文案专家，请根据用户的要求生成高质量文案。${style ? `写作风格要求：${style}。` : ""}请直接输出文案内容，不要附加多余的解释。`;

    let content: string;
    let tokensUsed: number;
    try {
      const result = await chatCompletion({
        messages: [
          { role: "system", content: systemContent },
          { role: "user", content: prompt },
        ],
        maxTokens: COPY_MAX_TOKENS,
        temperature: 0.7,
      });
      content = result.content;
      tokensUsed = result.tokensUsed;
    } catch (error) {
      // 调用失败：退还预扣积分 + 记录失败日志
      await refundUserCredits(userId, COPY_CREDITS_COST).catch(() => {});
      const errorMessage =
        error instanceof Error ? error.message : "豆包文案生成失败";
      await logApiCall({
        apiKeyId,
        userId,
        endpoint: "/api/external/generate/copy",
        method: "POST",
        creditsCost: 0,
        status: "failed",
        errorMessage,
        responseTime: Date.now() - startTime,
        clientIp: getClientIp(request),
      }).catch(() => {});

      return NextResponse.json(
        { message: `文案生成失败：${errorMessage}` },
        { status: 502 },
      );
    }

    // 4. 成功：确认 Key 用量 + 累加 totalUsed + 记日志
    await prisma.user.update({
      where: { id: userId },
      data: { totalUsed: { increment: 1 } },
    });
    await confirmKeyUsage(apiKeyId, COPY_CREDITS_COST);
    await logApiCall({
      apiKeyId,
      userId,
      endpoint: "/api/external/generate/copy",
      method: "POST",
      creditsCost: COPY_CREDITS_COST,
      status: "success",
      responseTime: Date.now() - startTime,
      clientIp: getClientIp(request),
    });

    return NextResponse.json({
      content,
      tokensUsed,
      creditsCost: COPY_CREDITS_COST,
    });
  },
);

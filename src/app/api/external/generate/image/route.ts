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
import { generateImage } from "@/lib/volcengine";

// 单张图片消耗点数（Seedream 文生图约 0.1 元/张）
const IMAGE_CREDITS_PER_PIECE = 5;
// prompt 长度上限
const MAX_PROMPT_LENGTH = 1000;
// 单次最多生成图片数量
const MAX_IMAGE_COUNT = 4;
// 允许的图片尺寸
const ALLOWED_SIZES = new Set([
  "1024x1024",
  "768x1024",
  "1024x768",
]);

// 请求体
interface ImageRequestBody {
  prompt?: string;
  size?: string;
  n?: number;
}

/**
 * POST /api/external/generate/image - AI 生图（Seedream）
 *
 * 鉴权：X-API-Key 请求头
 * 请求体：{ prompt: string, size?: string, n?: number }
 * 流程：验证 Key → 校验账号 → 预扣费 → 调用 Seedream → 成功确认/失败退还 → 记日志
 *
 * 用于 Coze 插件调用火山方舟 Seedream 模型生成图片
 */
export const POST = requireApiKey(
  async (request, { apiKeyId, userId }) => {
    const startTime = Date.now();

    // 解析请求体
    let body: ImageRequestBody;
    try {
      body = (await request.json()) as ImageRequestBody;
    } catch {
      return NextResponse.json(
        { message: "请求体格式错误，需为 JSON" },
        { status: 400 },
      );
    }

    const prompt = body.prompt?.trim();
    const size = body.size?.trim();
    const n = body.n ?? 1;

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

    // 校验数量
    if (!Number.isInteger(n) || n < 1 || n > MAX_IMAGE_COUNT) {
      return NextResponse.json(
        { message: `n 必须为 1-${MAX_IMAGE_COUNT} 的整数` },
        { status: 400 },
      );
    }

    // 校验尺寸
    const imageSize = size && ALLOWED_SIZES.has(size) ? size : "1024x1024";

    // 总消耗点数 = 单张 × 数量
    const creditsCost = IMAGE_CREDITS_PER_PIECE * n;

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
    const preDeducted = await preDeductUserCredits(userId, creditsCost);
    if (!preDeducted) {
      return NextResponse.json(
        {
          message: "点数不足，请充值",
          creditsCost,
          balance: user.credits,
        },
        { status: 402 },
      );
    }

    // 3. 调用 Seedream 生图
    let urls: string[];
    let apiCost: number;
    try {
      const result = await generateImage({
        prompt,
        size: imageSize,
        n,
      });
      urls = result.urls;
      apiCost = result.cost;
    } catch (error) {
      // 调用失败：退还预扣积分 + 记录失败日志
      await refundUserCredits(userId, creditsCost).catch(() => {});
      const errorMessage =
        error instanceof Error ? error.message : "Seedream 生图失败";
      await logApiCall({
        apiKeyId,
        userId,
        endpoint: "/api/external/generate/image",
        method: "POST",
        creditsCost: 0,
        status: "failed",
        errorMessage,
        responseTime: Date.now() - startTime,
        clientIp: getClientIp(request),
      }).catch(() => {});

      return NextResponse.json(
        { message: `生图失败：${errorMessage}` },
        { status: 502 },
      );
    }

    if (urls.length === 0) {
      // 模型返回成功但未包含图片 URL → 退还预扣积分
      await refundUserCredits(userId, creditsCost).catch(() => {});
      await logApiCall({
        apiKeyId,
        userId,
        endpoint: "/api/external/generate/image",
        method: "POST",
        creditsCost: 0,
        status: "failed",
        errorMessage: "生图响应未包含图片 URL",
        responseTime: Date.now() - startTime,
        clientIp: getClientIp(request),
      }).catch(() => {});

      return NextResponse.json(
        { message: "生图失败：未返回图片" },
        { status: 502 },
      );
    }

    // 4. 成功：确认 Key 用量 + 累加 totalUsed + 记日志
    await prisma.user.update({
      where: { id: userId },
      data: { totalUsed: { increment: 1 } },
    });
    await confirmKeyUsage(apiKeyId, creditsCost);
    await logApiCall({
      apiKeyId,
      userId,
      endpoint: "/api/external/generate/image",
      method: "POST",
      creditsCost,
      status: "success",
      responseTime: Date.now() - startTime,
      clientIp: getClientIp(request),
      apiCost,
    });

    return NextResponse.json({
      urls,
      count: urls.length,
      creditsCost,
    });
  },
);

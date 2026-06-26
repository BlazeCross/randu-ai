import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  requireApiKey,
  logApiCall,
  getClientIp,
} from "@/lib/apiKey";
import { submitVideoTask } from "@/lib/volcengine";

// 视频生成消耗点数（Seedance 约 1-2 元/次，按 30 秒视频约 30 秒计费）
const VIDEO_CREDITS_COST = 30;
// prompt 长度上限（中文 ≤500 字，留余量）
const MAX_PROMPT_LENGTH = 1000;
// 允许的分辨率
const ALLOWED_RESOLUTIONS = new Set(["480p", "720p", "1080p", "4k"]);
// 允许的宽高比
const ALLOWED_RATIOS = new Set([
  "16:9",
  "4:3",
  "1:1",
  "3:4",
  "9:16",
  "21:9",
  "adaptive",
]);
// 视频时长上限（秒）
const MAX_DURATION = 15;

// 请求体
interface VideoRequestBody {
  prompt?: string;
  firstFrameUrl?: string;
  lastFrameUrl?: string;
  resolution?: string;
  ratio?: string;
  duration?: number;
  seed?: number;
  cameraFixed?: boolean;
  watermark?: boolean;
  generateAudio?: boolean;
  returnLastFrame?: boolean;
}

/**
 * POST /api/external/generate/video - 提交 Seedance 视频生成任务
 *
 * 鉴权：X-API-Key 请求头
 * 请求体：{ prompt?: string, firstFrameUrl?: string, ... }
 * 流程：验证 Key → 校验余额 → 提交 Seedance 任务 → 返回 taskId
 *
 * 注：本接口为异步接口，仅提交任务并返回 taskId。
 *     客户端需轮询 GET /api/external/generate/video/status?taskId=xxx 查询结果。
 *     点数在任务成功时扣除（在 status 接口中处理），失败不扣点。
 *
 * 支持场景：
 * - 文生视频：仅传 prompt
 * - 图生视频-首帧：传 prompt + firstFrameUrl
 * - 图生视频-首尾帧：传 prompt + firstFrameUrl + lastFrameUrl
 */
export const POST = requireApiKey(
  async (request, { apiKeyId, userId }) => {
    const startTime = Date.now();

    // 解析请求体
    let body: VideoRequestBody;
    try {
      body = (await request.json()) as VideoRequestBody;
    } catch {
      return NextResponse.json(
        { message: "请求体格式错误，需为 JSON" },
        { status: 400 },
      );
    }

    const prompt = body.prompt?.trim();
    const firstFrameUrl = body.firstFrameUrl?.trim();
    const lastFrameUrl = body.lastFrameUrl?.trim();
    const resolution = body.resolution?.trim();
    const ratio = body.ratio?.trim();
    const duration = body.duration;
    const seed = body.seed;
    const cameraFixed = body.cameraFixed;
    const watermark = body.watermark;
    const generateAudio = body.generateAudio;
    const returnLastFrame = body.returnLastFrame;

    // 至少需要 prompt 或 firstFrameUrl 中的一个
    if (!prompt && !firstFrameUrl) {
      return NextResponse.json(
        {
          message:
            "至少需要 prompt（文生视频）或 firstFrameUrl（图生视频）中的一个",
        },
        { status: 400 },
      );
    }

    // 校验 prompt 长度
    if (prompt && prompt.length > MAX_PROMPT_LENGTH) {
      return NextResponse.json(
        { message: `prompt 长度不能超过 ${MAX_PROMPT_LENGTH} 字` },
        { status: 400 },
      );
    }

    // 校验 firstFrameUrl 格式
    if (firstFrameUrl && !/^https?:\/\//i.test(firstFrameUrl)) {
      return NextResponse.json(
        { message: "firstFrameUrl 必须是有效的图片 URL" },
        { status: 400 },
      );
    }

    // 校验 lastFrameUrl 格式（必须同时提供 firstFrameUrl）
    if (lastFrameUrl && !firstFrameUrl) {
      return NextResponse.json(
        { message: "使用 lastFrameUrl 时必须同时提供 firstFrameUrl" },
        { status: 400 },
      );
    }
    if (lastFrameUrl && !/^https?:\/\//i.test(lastFrameUrl)) {
      return NextResponse.json(
        { message: "lastFrameUrl 必须是有效的图片 URL" },
        { status: 400 },
      );
    }

    // 校验 resolution
    if (resolution && !ALLOWED_RESOLUTIONS.has(resolution)) {
      return NextResponse.json(
        {
          message: `resolution 不合法，允许值：${[...ALLOWED_RESOLUTIONS].join("/")}`,
        },
        { status: 400 },
      );
    }

    // 校验 ratio
    if (ratio && !ALLOWED_RATIOS.has(ratio)) {
      return NextResponse.json(
        {
          message: `ratio 不合法，允许值：${[...ALLOWED_RATIOS].join("/")}`,
        },
        { status: 400 },
      );
    }

    // 校验 duration
    if (duration !== undefined) {
      if (
        !Number.isFinite(duration) ||
        duration < 1 ||
        duration > MAX_DURATION
      ) {
        return NextResponse.json(
          { message: `duration 必须为 1-${MAX_DURATION} 的数字` },
          { status: 400 },
        );
      }
    }

    // 校验 seed
    if (seed !== undefined && (!Number.isInteger(seed) || seed < 0)) {
      return NextResponse.json(
        { message: "seed 必须为非负整数" },
        { status: 400 },
      );
    }

    // 1. 校验余额（不扣点，仅校验）
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
    if (user.credits < VIDEO_CREDITS_COST) {
      return NextResponse.json(
        {
          message: "点数不足，请充值",
          creditsCost: VIDEO_CREDITS_COST,
          balance: user.credits,
        },
        { status: 402 },
      );
    }

    // 2. 提交 Seedance 任务
    let externalTaskId: string;
    try {
      const result = await submitVideoTask({
        prompt: prompt || undefined,
        firstFrameUrl: firstFrameUrl || undefined,
        lastFrameUrl: lastFrameUrl || undefined,
        resolution: resolution as
          | "480p"
          | "720p"
          | "1080p"
          | "4k"
          | undefined,
        ratio: ratio as
          | "16:9"
          | "4:3"
          | "1:1"
          | "3:4"
          | "9:16"
          | "21:9"
          | "adaptive"
          | undefined,
        duration: typeof duration === "number" ? duration : undefined,
        seed: typeof seed === "number" ? seed : undefined,
        cameraFixed: typeof cameraFixed === "boolean" ? cameraFixed : undefined,
        watermark: typeof watermark === "boolean" ? watermark : undefined,
        generateAudio:
          typeof generateAudio === "boolean" ? generateAudio : undefined,
        returnLastFrame:
          typeof returnLastFrame === "boolean" ? returnLastFrame : undefined,
      });
      externalTaskId = result.taskId;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Seedance 任务提交失败";
      await logApiCall({
        apiKeyId,
        userId,
        endpoint: "/api/external/generate/video",
        method: "POST",
        creditsCost: 0,
        status: "failed",
        errorMessage,
        responseTime: Date.now() - startTime,
        clientIp: getClientIp(request),
      }).catch(() => {});

      return NextResponse.json(
        { message: `视频任务提交失败：${errorMessage}` },
        { status: 502 },
      );
    }

    // 3. 返回 taskId，客户端轮询 status 接口
    return NextResponse.json({
      taskId: externalTaskId,
      status: "pending",
      creditsCost: VIDEO_CREDITS_COST,
      pollUrl: `/api/external/generate/video/status?taskId=${encodeURIComponent(externalTaskId)}`,
      message:
        "任务已提交，请轮询 pollUrl 查询状态。任务成功时扣点，失败不扣点。",
    });
  },
);

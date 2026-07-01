import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { preDeductUserCredits, refundUserCredits, getClientIp } from "@/lib/apiKey";
import {
  chatCompletion,
  generateImage,
  type ChatMessage,
} from "@/lib/volcengine";
import { moderateText } from "@/lib/moderation";
import { checkText, maskBlockedWords } from "@/lib/content-check";
import { checkAntiAbuse, refundAntiAbuseCredits } from "@/lib/userAntiAbuse";

// 对话积分消耗
const TEXT_CHAT_CREDITS = 1;
const IMAGE_GEN_CREDITS = 5;

// 图片生成关键词检测
const IMAGE_KEYWORDS = [
  "画",
  "生成图",
  "生成图片",
  "画一张",
  "画一个",
  "画个",
  "帮我画",
  "AI生图",
  "文生图",
  "画图",
  "生成一张图",
  "画幅",
  "绘制",
];

// 系统提示词
const SYSTEM_PROMPT =
  "你是燃渡AI助手，一个友好、专业的智能助手。你可以帮助用户回答问题、撰写文案、提供建议。请用简洁清晰的中文回答用户的问题。如果用户想要生成图片，请提示他们在对话中直接说「画一张...」来触发图片生成。";

interface ChatRequestBody {
  messages?: unknown;
  userInput?: unknown;
}

/**
 * POST /api/chat - 智能体对话（智能路由）
 *
 * 请求体：
 * - messages: 历史消息数组（ChatMessage[]，可选，用于上下文记忆）
 * - userInput: 当前用户输入（字符串）
 *
 * 智能路由：
 * - 检测到图片生成关键词 → 调用 Seedream 文生图（消耗 5 积分）
 * - 其他 → 调用豆包文本对话（消耗 1 积分）
 *
 * 积分校验：调用前检查余额，不足返回 403。
 * 调用成功后扣减积分并累加 totalUsed。
 *
 * 响应：
 * - { role: "assistant", content: string, type: "text", tokensUsed, creditsCost }
 * - { role: "assistant", content: string, type: "image", imageUrl: string, creditsCost }
 */
export const POST = requireAuth(async (request, { userId }) => {
  // 解析请求体
  let body: ChatRequestBody;
  try {
    body = (await request.json()) as ChatRequestBody;
  } catch {
    return NextResponse.json(
      { message: "请求体格式错误，需为 JSON" },
      { status: 400 },
    );
  }

  const userInput = typeof body.userInput === "string" ? body.userInput.trim() : "";
  if (!userInput) {
    return NextResponse.json(
      { message: "请输入对话内容" },
      { status: 400 },
    );
  }

  // 限制单次输入长度，避免过大请求
  if (userInput.length > 4000) {
    return NextResponse.json(
      { message: "输入内容过长，请限制在 4000 字以内" },
      { status: 400 },
    );
  }

  // 内容审核（输入）
  const inputModeration = moderateText(userInput);
  if (!inputModeration.passed) {
    return NextResponse.json(
      { message: `输入内容包含违规信息（${inputModeration.category}），请修改后重试` },
      { status: 400 },
    );
  }

  // 查询用户（获取积分余额与订阅状态）
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      credits: true,
      isSubscribed: true,
      status: true,
    },
  });

  if (!user) {
    return NextResponse.json({ message: "用户不存在" }, { status: 404 });
  }

  if (user.status === "blocked") {
    return NextResponse.json(
      { message: "账号已被封禁" },
      { status: 403 },
    );
  }

  // 智能路由：检测是否为图片生成请求
  const isImageRequest = IMAGE_KEYWORDS.some((kw) =>
    userInput.toLowerCase().includes(kw.toLowerCase()),
  );

  const creditsCost = isImageRequest ? IMAGE_GEN_CREDITS : TEXT_CHAT_CREDITS;

  // 单用户防刷检查（每分钟 10 次 + 每日积分上限 + IP 多账号检测）
  const clientIp = getClientIp(request);
  const antiAbuse = checkAntiAbuse(userId, creditsCost, clientIp);
  if (!antiAbuse.allowed) {
    if (antiAbuse.reason === "user_rate") {
      return NextResponse.json(
        {
          message: `请求过于频繁，请稍后再试（每分钟限制 10 次调用）`,
          retryAfterMs: antiAbuse.retryAfterMs,
        },
        { status: 429 },
      );
    }
    if (antiAbuse.reason === "daily_credits") {
      return NextResponse.json(
        {
          message: `今日积分消耗已达上限（5000 积分），请明日再试`,
          resetAt: antiAbuse.resetAt,
        },
        { status: 429 },
      );
    }
  }

  // 预扣费（原子操作，防并发超扣）
  const preDeducted = await preDeductUserCredits(userId, creditsCost);
  if (!preDeducted) {
    return NextResponse.json(
      {
        message: `积分余额不足，本次操作需要 ${creditsCost} 积分，当前余额 ${user.credits} 积分，请充值`,
        creditsRequired: creditsCost,
        creditsBalance: user.credits,
      },
      { status: 403 },
    );
  }

  // 解析历史消息（用于上下文记忆）
  const historyMessages = parseHistoryMessages(body.messages);

  try {
    if (isImageRequest) {
      // ===== 图片生成路径 =====
      const result = await generateImage({ prompt: userInput });
      if (result.urls.length === 0) {
        // 退还预扣积分
        await refundUserCredits(userId, creditsCost).catch(() => {});
        return NextResponse.json(
          { message: "图片生成失败，未返回图片" },
          { status: 500 },
        );
      }
      const imageUrl = result.urls[0];

      // 确认扣费：累加使用次数（积分已在预扣时扣减）
      await prisma.user.update({
        where: { id: userId },
        data: { totalUsed: { increment: 1 } },
      });

      return NextResponse.json({
        role: "assistant" as const,
        content: `已为您生成图片：`,
        type: "image" as const,
        imageUrl,
        creditsCost,
      });
    } else {
      // ===== 文本对话路径 =====
      // 构建消息数组：system + 历史(最多 10 条) + 当前输入
      const messages: ChatMessage[] = [
        { role: "system", content: SYSTEM_PROMPT },
        ...historyMessages.slice(-10),
        { role: "user", content: userInput },
      ];

      const result = await chatCompletion({ messages });

      // 内容审核（输出）- 第一层：本地敏感词库
      const outputModeration = moderateText(result.content || "");
      if (!outputModeration.passed) {
        // 命中敏感词，不展示，退还积分 + 回滚防刷积分计数
        await refundUserCredits(userId, creditsCost).catch(() => {});
        refundAntiAbuseCredits(userId, creditsCost);
        return NextResponse.json(
          { message: "AI 回复内容审核未通过，已退还积分，请重新提问" },
          { status: 451 },
        );
      }

      // 内容审核（输出）- 第二层：阿里云绿网云端审核
      const cloudCheck = await checkText(result.content || "");
      if (!cloudCheck.safe) {
        // 云端审核未通过，记录过滤日志
        console.log(`[chat] 云端内容审核未通过 userId=${userId}, reason=${cloudCheck.reason}, blockedWords=${JSON.stringify(cloudCheck.blockedWords || [])}, originalContent=${result.content?.slice(0, 100)}`);

        // 尝试脱敏处理：用 *** 替换敏感词后返回
        if (cloudCheck.blockedWords && cloudCheck.blockedWords.length > 0) {
          const maskedContent = maskBlockedWords(result.content || "", cloudCheck.blockedWords);
          // 确认扣费：累加使用次数
          await prisma.user.update({
            where: { id: userId },
            data: { totalUsed: { increment: 1 } },
          });
          return NextResponse.json({
            role: "assistant" as const,
            content: maskedContent,
            type: "text" as const,
            tokensUsed: result.tokensUsed,
            creditsCost,
            moderationWarning: "部分内容已脱敏展示",
          });
        }

        // 无可脱敏内容时返回提示
        return NextResponse.json(
          { message: "该内容暂不可展示" },
          { status: 451 },
        );
      }

      // 确认扣费：累加使用次数（积分已在预扣时扣减）
      await prisma.user.update({
        where: { id: userId },
        data: { totalUsed: { increment: 1 } },
      });

      return NextResponse.json({
        role: "assistant" as const,
        content: result.content || "（无回复内容）",
        type: "text" as const,
        tokensUsed: result.tokensUsed,
        creditsCost,
      });
    }
  } catch (error) {
    // 调用失败：退还预扣积分 + 回滚防刷积分计数
    await refundUserCredits(userId, creditsCost).catch(() => {});
    refundAntiAbuseCredits(userId, creditsCost);
    console.error("[POST /api/chat] 失败:", error);
    const msg = error instanceof Error ? error.message : "智能体调用失败";
    return NextResponse.json(
      { message: msg },
      { status: 500 },
    );
  }
});

/**
 * 安全解析历史消息数组
 * 仅保留 role 为 system/user/assistant 且 content 为字符串的消息
 */
function parseHistoryMessages(raw: unknown): ChatMessage[] {
  if (!Array.isArray(raw)) return [];
  const result: ChatMessage[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const obj = item as Record<string, unknown>;
    const role = obj.role;
    const content = obj.content;
    if (
      (role === "system" || role === "user" || role === "assistant") &&
      typeof content === "string" &&
      content.length > 0
    ) {
      result.push({ role, content });
    }
  }
  return result;
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { generateApiKey } from "@/lib/apiKey";
import { generateWebhookSecret } from "@/lib/webhook";

// 频率限制范围（与 POST /api/keys 保持一致）
const MIN_QPS_LIMIT = 0;
const MAX_QPS_LIMIT = 100;
const MIN_DAILY_LIMIT = 0;
const MAX_DAILY_LIMIT = 100_000;
// Webhook URL 长度上限
const MAX_WEBHOOK_URL_LENGTH = 500;

/**
 * DELETE /api/keys/[id] - 吊销 API Key（软删除：将状态改为 revoked）
 *
 * 安全检查：Key 必须属于当前用户
 */
export const DELETE = requireAuth(async (_request, { userId, params }) => {
  try {
    const { id } = await params!;

    // 查找 Key 并验证所有权
    const apiKey = await prisma.apiKey.findUnique({
      where: { id },
      select: { userId: true, status: true },
    });

    if (!apiKey || apiKey.userId !== userId) {
      return NextResponse.json(
        { message: "Key 不存在或无权操作" },
        { status: 404 },
      );
    }

    if (apiKey.status === "revoked") {
      return NextResponse.json(
        { message: "该 Key 已被吊销" },
        { status: 400 },
      );
    }

    // 吊销 Key
    await prisma.apiKey.update({
      where: { id },
      data: { status: "revoked" },
    });

    return NextResponse.json({ message: "Key 已吊销" });
  } catch (error) {
    console.error("吊销 API Key 失败:", error);
    return NextResponse.json(
      { message: "服务器内部错误" },
      { status: 500 },
    );
  }
});

/**
 * PATCH /api/keys/[id] - 重置 API Key（生成新的明文和哈希）
 *
 * 安全检查：Key 必须属于当前用户
 * 返回新的明文 Key（仅返回一次）
 */
export const PATCH = requireAuth(async (_request, { userId, params }) => {
  try {
    const { id } = await params!;

    // 查找 Key 并验证所有权
    const apiKey = await prisma.apiKey.findUnique({
      where: { id },
      select: { userId: true, status: true },
    });

    if (!apiKey || apiKey.userId !== userId) {
      return NextResponse.json(
        { message: "Key 不存在或无权操作" },
        { status: 404 },
      );
    }

    if (apiKey.status === "revoked") {
      return NextResponse.json(
        { message: "已吊销的 Key 无法重置，请生成新 Key" },
        { status: 400 },
      );
    }

    // 生成新 Key
    const { plaintext, keyPrefix, keyHash } = generateApiKey();

    // 更新数据库
    await prisma.apiKey.update({
      where: { id },
      data: { keyPrefix, keyHash, status: "active" },
    });

    // 明文 Key 仅返回一次
    return NextResponse.json({
      id,
      keyPrefix,
      key: plaintext,
    });
  } catch (error) {
    console.error("重置 API Key 失败:", error);
    return NextResponse.json(
      { message: "服务器内部错误" },
      { status: 500 },
    );
  }
});

/**
 * PUT /api/keys/[id] - 更新 Key 配置（频率限制 + Webhook）
 *
 * 请求体：{
 *   qpsLimit?: number,      // 每秒最大请求数，0 表示不限制，范围 0-100
 *   dailyLimit?: number,    // 每日最大调用次数，0 表示不限制，范围 0-100000
 *   webhookUrl?: string|null,  // 长任务完成通知 URL；传 null 清空；首次设置时自动生成 webhookSecret
 * }
 *
 * 安全检查：Key 必须属于当前用户
 */
export const PUT = requireAuth(async (request, { userId, params }) => {
  try {
    const { id } = await params!;

    // 查找 Key 并验证所有权
    const apiKey = await prisma.apiKey.findUnique({
      where: { id },
      select: { userId: true, status: true, webhookSecret: true },
    });

    if (!apiKey || apiKey.userId !== userId) {
      return NextResponse.json(
        { message: "Key 不存在或无权操作" },
        { status: 404 },
      );
    }

    if (apiKey.status === "revoked") {
      return NextResponse.json(
        { message: "已吊销的 Key 无法修改配置" },
        { status: 400 },
      );
    }

    // 解析请求体
    const body = (await request.json().catch(() => ({}))) as {
      qpsLimit?: number;
      dailyLimit?: number;
      webhookUrl?: string | null;
    };

    // 构建更新数据（仅包含传入的字段）
    const data: {
      qpsLimit?: number;
      dailyLimit?: number;
      webhookUrl?: string | null;
      webhookSecret?: string | null;
    } = {};

    if (body.qpsLimit !== undefined) {
      const qpsLimit = Number(body.qpsLimit);
      if (
        !Number.isInteger(qpsLimit) ||
        qpsLimit < MIN_QPS_LIMIT ||
        qpsLimit > MAX_QPS_LIMIT
      ) {
        return NextResponse.json(
          {
            message: `qpsLimit 必须是 ${MIN_QPS_LIMIT}-${MAX_QPS_LIMIT} 的整数`,
          },
          { status: 400 },
        );
      }
      data.qpsLimit = qpsLimit;
    }

    if (body.dailyLimit !== undefined) {
      const dailyLimit = Number(body.dailyLimit);
      if (
        !Number.isInteger(dailyLimit) ||
        dailyLimit < MIN_DAILY_LIMIT ||
        dailyLimit > MAX_DAILY_LIMIT
      ) {
        return NextResponse.json(
          {
            message: `dailyLimit 必须是 ${MIN_DAILY_LIMIT}-${MAX_DAILY_LIMIT} 的整数`,
          },
          { status: 400 },
        );
      }
      data.dailyLimit = dailyLimit;
    }

    // webhookUrl：支持设置、清空（null）、保持不变（undefined）
    if (body.webhookUrl !== undefined) {
      const webhookUrl = body.webhookUrl;
      if (webhookUrl === null || webhookUrl === "") {
        // 清空：同时清空 webhookSecret
        data.webhookUrl = null;
        data.webhookSecret = null;
      } else {
        // 设置：校验 URL 格式
        const trimmed = String(webhookUrl).trim();
        if (!/^https?:\/\//i.test(trimmed)) {
          return NextResponse.json(
            { message: "webhookUrl 必须是有效的 http(s) URL" },
            { status: 400 },
          );
        }
        if (trimmed.length > MAX_WEBHOOK_URL_LENGTH) {
          return NextResponse.json(
            { message: `webhookUrl 长度不能超过 ${MAX_WEBHOOK_URL_LENGTH} 字符` },
            { status: 400 },
          );
        }
        data.webhookUrl = trimmed;
        // 若 Key 之前未配置 webhookSecret，自动生成一个
        if (!apiKey.webhookSecret) {
          data.webhookSecret = generateWebhookSecret();
        }
      }
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        {
          message:
            "请至少提供 qpsLimit、dailyLimit 或 webhookUrl 中的一个字段",
        },
        { status: 400 },
      );
    }

    // 更新数据库
    const updated = await prisma.apiKey.update({
      where: { id },
      data,
      select: {
        id: true,
        qpsLimit: true,
        dailyLimit: true,
        webhookUrl: true,
        webhookSecret: true,
      },
    });

    // 返回时仅在 webhookSecret 首次生成时明文返回（用户需保存用于校验）
    // 判断：data.webhookSecret 已生成，且 body.webhookUrl 非 null
    const isFirstSecretSet =
      data.webhookSecret !== undefined && body.webhookUrl !== null;

    return NextResponse.json({
      id: updated.id,
      qpsLimit: updated.qpsLimit,
      dailyLimit: updated.dailyLimit,
      webhookUrl: updated.webhookUrl,
      // 仅首次生成时明文返回，便于用户保存；后续更新不再返回
      webhookSecret: isFirstSecretSet ? updated.webhookSecret : undefined,
      webhookSecretMasked: updated.webhookSecret
        ? `${updated.webhookSecret.slice(0, 8)}••••`
        : null,
    });
  } catch (error) {
    console.error("更新 API Key 配置失败:", error);
    return NextResponse.json(
      { message: "服务器内部错误" },
      { status: 500 },
    );
  }
});

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { generateApiKey } from "@/lib/apiKey";

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

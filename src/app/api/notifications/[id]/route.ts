import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

/**
 * PATCH /api/notifications/[id] - 标记单条通知为已读
 *
 * 仅能标记自己的通知（通过 userId 校验归属）。
 * 通知不存在或不属于当前用户时返回 404。
 */
export const PATCH = requireAuth(
  async (
    _request: Request,
    { userId, params }: { userId: string; params?: Promise<Record<string, string>> },
  ) => {
    const { id } = await params!;

    // 仅更新属于当前用户的未读通知，避免越权
    const result = await prisma.notification.updateMany({
      where: { id, userId, isRead: false },
      data: { isRead: true },
    });

    if (result.count === 0) {
      return NextResponse.json(
        { message: "通知不存在或已读" },
        { status: 404 },
      );
    }

    return NextResponse.json({ updated: result.count });
  },
);

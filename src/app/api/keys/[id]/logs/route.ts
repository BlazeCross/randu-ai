import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

// 默认每页数量
const DEFAULT_PAGE_SIZE = 20;
// 最大每页数量
const MAX_PAGE_SIZE = 50;

/**
 * GET /api/keys/[id]/logs - 获取指定 API Key 的调用日志
 *
 * 查询参数：
 * - page: 页码（默认1）
 * - pageSize: 每页数量（默认20，最大50）
 *
 * 安全检查：Key 必须属于当前用户
 */
export const GET = requireAuth(async (request, { userId, params }) => {
  try {
    const { id } = await params!;

    // 验证 Key 所有权
    const apiKey = await prisma.apiKey.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!apiKey || apiKey.userId !== userId) {
      return NextResponse.json(
        { message: "Key 不存在或无权操作" },
        { status: 404 },
      );
    }

    // 解析分页参数
    const url = new URL(request.url);
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
    const pageSize = Math.min(
      MAX_PAGE_SIZE,
      Math.max(1, parseInt(url.searchParams.get("pageSize") || String(DEFAULT_PAGE_SIZE), 10)),
    );

    // 并行查询日志列表和总数
    const [logs, total] = await Promise.all([
      prisma.callLog.findMany({
        where: { apiKeyId: id },
        select: {
          id: true,
          endpoint: true,
          method: true,
          creditsCost: true,
          status: true,
          errorMessage: true,
          responseTime: true,
          clientIp: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.callLog.count({ where: { apiKeyId: id } }),
    ]);

    return NextResponse.json({
      logs,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error("获取 Key 调用日志失败:", error);
    return NextResponse.json(
      { message: "服务器内部错误" },
      { status: 500 },
    );
  }
});

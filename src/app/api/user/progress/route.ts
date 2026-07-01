import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

// 获取用户学习进度
export const GET = requireAuth(async (request, { userId }) => {
  try {
    const url = new URL(request.url);
    const pathId = url.searchParams.get("pathId");

    if (!pathId) {
      return NextResponse.json(
        { message: "缺少 pathId 参数" },
        { status: 400 }
      );
    }

    // 查询该用户在该路径下的所有进度
    const progresses = await prisma.userProgress.findMany({
      where: {
        userId,
        pathId,
      },
      select: {
        stepId: true,
        completed: true,
      },
    });

    return NextResponse.json({
      steps: progresses.map((p) => ({
        stepId: p.stepId,
        completed: p.completed,
      })),
    });
  } catch (error) {
    console.error("获取学习进度失败:", error);
    return NextResponse.json(
      { message: "服务器内部错误" },
      { status: 500 }
    );
  }
});

// 保存学习进度
export const POST = requireAuth(async (request, { userId }) => {
  try {
    const body = (await request.json()) as {
      pathId?: string;
      stepId?: string;
      completed?: boolean;
    };

    const { pathId, stepId, completed = true } = body;

    if (!pathId || !stepId) {
      return NextResponse.json(
        { message: "缺少必要参数：pathId 和 stepId" },
        { status: 400 }
      );
    }

    // 创建或更新进度记录
    const progress = await prisma.userProgress.upsert({
      where: {
        userId_pathId_stepId: {
          userId,
          pathId,
          stepId,
        },
      },
      update: {
        completed,
      },
      create: {
        userId,
        pathId,
        stepId,
        completed,
      },
    });

    return NextResponse.json({
      stepId: progress.stepId,
      completed: progress.completed,
    });
  } catch (error) {
    console.error("保存学习进度失败:", error);
    return NextResponse.json(
      { message: "服务器内部错误" },
      { status: 500 }
    );
  }
});

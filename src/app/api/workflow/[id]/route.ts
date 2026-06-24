import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 工作流详情返回结构
interface WorkflowDetail {
  id: string;
  name: string;
  description: string | null;
  category: string;
  cozeWorkflowId: string;
  icon: string | null;
  status: string;
  feishuDocUrl: string | null;
  createdAt: Date;
}

/**
 * 获取工作流详情（公开接口）
 * 路由参数：params.id 为工作流 ID
 * 不存在返回 404
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // Next.js 16 中 params 为 Promise，需 await
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { message: "缺少工作流 ID" },
        { status: 400 },
      );
    }

    const workflow = await prisma.workflow.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        description: true,
        category: true,
        cozeWorkflowId: true,
        icon: true,
        status: true,
        feishuDocUrl: true,
        createdAt: true,
      },
    });

    if (!workflow) {
      return NextResponse.json(
        { message: "工作流不存在" },
        { status: 404 },
      );
    }

    const result: WorkflowDetail = {
      id: workflow.id,
      name: workflow.name,
      description: workflow.description,
      category: workflow.category,
      cozeWorkflowId: workflow.cozeWorkflowId,
      icon: workflow.icon,
      status: workflow.status,
      feishuDocUrl: workflow.feishuDocUrl,
      createdAt: workflow.createdAt,
    };

    return NextResponse.json({ workflow: result });
  } catch (error) {
    console.error("获取工作流详情失败:", error);
    return NextResponse.json(
      { message: "服务器内部错误" },
      { status: 500 },
    );
  }
}

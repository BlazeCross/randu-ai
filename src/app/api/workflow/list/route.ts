import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 工作流列表项（精简字段）
interface WorkflowListItem {
  id: string;
  name: string;
  description: string | null;
  category: string;
  icon: string | null;
  status: string;
}

/**
 * 获取工作流列表（公开接口）
 * 支持通过 category 进行分类筛选、search 进行名称搜索（不区分大小写）
 * 仅返回 status = "active" 的工作流，按 sortOrder 升序排序
 */
export async function GET(request: Request) {
  try {
    // 解析查询参数
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category")?.trim() || undefined;
    const search = searchParams.get("search")?.trim() || undefined;

    // 构建 where 条件
    const where: Record<string, unknown> = { status: "active" };
    if (category) {
      where.category = category;
    }
    if (search) {
      // Prisma 默认 contains 在 PostgreSQL 中区分大小写，需指定 mode: insensitive
      where.name = { contains: search, mode: "insensitive" };
    }

    // 查询工作流列表
    const workflows = await prisma.workflow.findMany({
      where,
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        name: true,
        description: true,
        category: true,
        icon: true,
        status: true,
      },
    });

    const result: WorkflowListItem[] = workflows.map((w) => ({
      id: w.id,
      name: w.name,
      description: w.description,
      category: w.category,
      icon: w.icon,
      status: w.status,
    }));

    return NextResponse.json({ workflows: result });
  } catch (error) {
    console.error("获取工作流列表失败:", error);
    return NextResponse.json(
      { message: "服务器内部错误" },
      { status: 500 },
    );
  }
}

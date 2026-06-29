import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/carousel - 公开轮播图列表
 *
 * 返回已发布的轮播（published=true），按 sortOrder 升序排序。
 * 无需鉴权。
 */
export async function GET() {
  const slides = await prisma.carouselSlide.findMany({
    where: { published: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    select: {
      id: true,
      title: true,
      description: true,
      image: true,
      link: true,
      badge: true,
      sortOrder: true,
    },
  });

  return NextResponse.json({ slides });
}

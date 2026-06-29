import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { uploadStreamToOss } from "@/lib/oss";

// 允许上传的图片 MIME 类型
const ALLOWED_CONTENT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

// 封面文件大小上限：5MB（封面图无需太大）
const MAX_FILE_SIZE = 5 * 1024 * 1024;

/**
 * POST /api/admin/workflows/[id]/cover - 上传工作流封面图
 *
 * - admin 及以上权限
 * - 接收 multipart/form-data，字段名 file
 * - 校验：工作流存在、文件类型为图片、大小 ≤ 5MB
 * - 上传到 OSS 后更新 workflow.coverImage 字段
 * - 返回 { url, workflowId }
 *
 * 注意：旧封面图不从 OSS 删除（OSS 不维护引用计数，简化实现）。
 *
 * 后续迁移提示（Phase 15 STS 直传）：
 * 本接口仍走服务端中转上传，因封面上传涉及工作流 ID 校验等业务逻辑，
 * 短期内不改造为前端 STS 直传。
 * 通用图片上传组件 ImageUploader 已支持 STS 直传（详见 src/components/upload/ImageUploader.tsx），
 * 配置 ALIYUN_STS_* 环境变量后即可启用，未配置时自动回退到 /api/upload 服务端中转。
 */
export const POST = requireAdmin(async (request, { params }) => {
  const { id } = await params!;

  if (!id) {
    return NextResponse.json({ message: "缺少工作流 ID" }, { status: 400 });
  }

  // 校验工作流存在
  const existing = await prisma.workflow.findUnique({
    where: { id },
    select: { isDeleted: true },
  });

  if (!existing || existing.isDeleted) {
    return NextResponse.json(
      { message: "工作流不存在或已删除" },
      { status: 404 },
    );
  }

  // 解析 multipart/form-data
  const formData = await request.formData();
  const file = formData.get("file");

  if (!file) {
    return NextResponse.json(
      { message: "请选择要上传的封面图" },
      { status: 400 },
    );
  }

  if (!(file instanceof File)) {
    return NextResponse.json(
      { message: "上传的字段不是文件" },
      { status: 400 },
    );
  }

  // 校验文件类型
  if (!ALLOWED_CONTENT_TYPES.includes(file.type)) {
    return NextResponse.json(
      {
        message: `不支持的文件类型：${file.type || "未知"}，仅支持 JPG/PNG/WebP/GIF`,
      },
      { status: 400 },
    );
  }

  // 校验文件大小
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      {
        message: `文件大小超过限制（${(file.size / 1024 / 1024).toFixed(2)}MB），最大支持 5MB`,
      },
      { status: 400 },
    );
  }

  try {
    // 流式上传到 OSS
    const cdnUrl = await uploadStreamToOss(
      file.stream(),
      file.name,
      file.type,
      file.size,
    );

    // 更新工作流封面字段
    await prisma.workflow.update({
      where: { id },
      data: { coverImage: cdnUrl },
    });

    return NextResponse.json({
      url: cdnUrl,
      workflowId: id,
    });
  } catch (error) {
    console.error("封面上传失败:", error);
    return NextResponse.json(
      { message: "封面上传失败，请稍后重试" },
      { status: 500 },
    );
  }
});

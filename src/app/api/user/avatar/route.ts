import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { uploadStreamToOss } from "@/lib/oss";

// 允许上传的图片 MIME 类型
const ALLOWED_CONTENT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

// 头像文件大小上限：2MB（头像不需要太大）
const MAX_FILE_SIZE = 2 * 1024 * 1024;

/**
 * 头像上传接口
 *
 * - 需鉴权（Authorization: Bearer <token>）
 * - 接收 multipart/form-data，字段名 file
 * - 校验：文件存在、类型为图片、大小 ≤ 2MB
 * - 流式上传到 OSS，更新 user.avatar 字段
 * - 成功返回 { avatar: url }
 */
export const POST = requireAuth(async (request, { userId }) => {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file) {
      return NextResponse.json(
        { message: "请选择要上传的头像" },
        { status: 400 },
      );
    }

    if (!(file instanceof File)) {
      return NextResponse.json(
        { message: "上传的字段不是文件" },
        { status: 400 },
      );
    }

    if (!ALLOWED_CONTENT_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          message: `不支持的文件类型：${file.type || "未知"}，仅支持 JPG/PNG/WebP/GIF`,
        },
        { status: 400 },
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          message: `文件大小超过限制（${(file.size / 1024 / 1024).toFixed(2)}MB），头像最大支持 2MB`,
        },
        { status: 400 },
      );
    }

    // 流式上传到 OSS
    const avatarUrl = await uploadStreamToOss(
      file.stream(),
      file.name,
      file.type,
      file.size,
    );

    // 更新用户头像
    await prisma.user.update({
      where: { id: userId },
      data: { avatar: avatarUrl },
    });

    return NextResponse.json({ avatar: avatarUrl });
  } catch (error) {
    console.error("头像上传失败:", error);
    return NextResponse.json(
      { message: "头像上传失败，请稍后重试" },
      { status: 500 },
    );
  }
});

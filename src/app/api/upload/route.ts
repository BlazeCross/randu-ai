import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { uploadStreamToOss } from "@/lib/oss";

// 允许上传的图片 MIME 类型
const ALLOWED_CONTENT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

// 文件大小上限：10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * 图片上传接口
 *
 * - 需鉴权（Authorization: Bearer <token>）
 * - 接收 multipart/form-data，字段名 file
 * - 校验：文件存在、类型为图片、大小 ≤ 10MB
 * - 成功返回 { url, fileName, size }
 * - 错误返回 400 / 401 / 500
 */
export const POST = requireAuth(async (request) => {
  try {
    // 解析 multipart/form-data
    const formData = await request.formData();
    const file = formData.get("file");

    // 校验：文件存在
    if (!file) {
      return NextResponse.json(
        { message: "请选择要上传的文件" },
        { status: 400 },
      );
    }

    // 校验：必须是 File 对象（FormData.get 返回值可能是 string 或 File）
    if (!(file instanceof File)) {
      return NextResponse.json(
        { message: "上传的字段不是文件" },
        { status: 400 },
      );
    }

    // 校验：文件类型
    if (!ALLOWED_CONTENT_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          message: `不支持的文件类型：${file.type || "未知"}，仅支持 JPG/PNG/WebP/GIF`,
        },
        { status: 400 },
      );
    }

    // 校验：文件大小
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          message: `文件大小超过限制（${(file.size / 1024 / 1024).toFixed(2)}MB），最大支持 10MB`,
        },
        { status: 400 },
      );
    }

    // 流式上传：直接使用文件流，避免将整个文件读入内存（降低内存占用）
    const cdnUrl = await uploadStreamToOss(
      file.stream(),
      file.name,
      file.type,
      file.size,
    );

    return NextResponse.json({
      url: cdnUrl,
      fileName: file.name,
      size: file.size,
    });
  } catch (error) {
    console.error("文件上传失败:", error);
    return NextResponse.json(
      { message: "文件上传失败，请稍后重试" },
      { status: 500 },
    );
  }
});

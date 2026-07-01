/**
 * 内容审核 API 路由
 *
 * POST /api/content-check
 * 接收文本，返回审核结果
 *
 * 请求体：{ text: string }
 * 响应：{ safe: boolean, reason?: string }
 */

import { NextRequest, NextResponse } from "next/server";
import { checkText } from "@/lib/content-check";

interface RequestBody {
  text?: unknown;
}

/**
 * POST /api/content-check
 *
 * 调用阿里云绿网文本审核 API
 *
 * @param request 请求体 { text: string }
 * @returns { safe: boolean, reason?: string }
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  // 解析请求体
  let body: RequestBody;
  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return NextResponse.json(
      { message: "请求体格式错误，需为 JSON" },
      { status: 400 },
    );
  }

  const text = typeof body.text === "string" ? body.text.trim() : "";
  if (!text) {
    return NextResponse.json(
      { message: "请提供 text 字段" },
      { status: 400 },
    );
  }

  // 限制单次审核文本长度
  if (text.length > 10000) {
    return NextResponse.json(
      { message: "文本内容过长，请限制在 10000 字以内" },
      { status: 400 },
    );
  }

  try {
    const result = await checkText(text);

    if (!result.safe) {
      return NextResponse.json({
        safe: false,
        reason: result.reason || "内容包含违规信息",
        blockedWords: result.blockedWords,
      });
    }

    return NextResponse.json({
      safe: true,
    });
  } catch (error) {
    console.error("[POST /api/content-check] 审核失败:", error);
    return NextResponse.json(
      {
        message: "内容审核服务异常",
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

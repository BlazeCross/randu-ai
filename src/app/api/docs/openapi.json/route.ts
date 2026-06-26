import { NextResponse } from "next/server";
import { OPENAPI_SPEC } from "@/lib/openapi";

/**
 * GET /api/docs/openapi.json - 返回 OpenAPI 3.0 规范
 *
 * 供第三方工具（Swagger UI、Postman、OpenAPI Generator）导入。
 * Cache-Control: public, max-age=3600 - 一小时缓存（spec 静态）
 */
export const GET = async () => {
  return NextResponse.json(OPENAPI_SPEC, {
    headers: {
      "Cache-Control": "public, max-age=3600",
      "Access-Control-Allow-Origin": "*",
    },
  });
};

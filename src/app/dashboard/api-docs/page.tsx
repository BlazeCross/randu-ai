import type { Metadata } from "next";
import ApiDocsClient from "./ApiDocsClient";

export const metadata: Metadata = {
  title: "API 文档 - 燃渡AI 开放 API",
  description:
    "燃渡AI 开放 API 文档，提供 AI 视频生成、文生图、文案生成等接口说明。所有接口均使用 X-API-Key 鉴权。",
};

/**
 * API 文档页面（Swagger UI 风格）
 *
 * 通过 /api/docs/openapi.json 加载 OpenAPI 3.0 规范并渲染为交互式文档。
 * - 公开访问，无需登录
 * - 内嵌 Swagger UI（避免引入额外的 npm 依赖）
 */
export default function ApiDocsPage() {
  return <ApiDocsClient />;
}

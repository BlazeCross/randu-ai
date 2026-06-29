/**
 * 统一 API 错误响应工具函数
 *
 * 用于 src/app/api/ 下的 route.ts 文件，保证错误响应格式一致：
 *   { "error": "<message>", "code": "<code>" }
 *
 * 供后续 API 逐步采用，本次不强制改造所有 API。
 *
 * @example
 *   import { apiError } from "@/lib/api-error";
 *   if (!user) return apiError("未登录", "UNAUTHORIZED", 401);
 */
export function apiError(message: string, code?: string, status = 400) {
  return Response.json({ error: message, code }, { status });
}

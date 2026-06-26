import { NextResponse } from "next/server";
import jwt, { type JwtPayload } from "jsonwebtoken";

// JWT 载荷中包含的用户标识
interface AuthPayload extends JwtPayload {
  userId: string;
}

/**
 * 从请求头中提取 Bearer token
 * @param request Next.js Request 对象
 * @returns token 字符串，若不存在或格式错误则返回 null
 */
function getTokenFromRequest(request: Request): string | null {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) return null;

  // 期望格式：Bearer <token>
  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0].toLowerCase() !== "bearer") {
    return null;
  }
  const token = parts[1].trim();
  return token || null;
}

/**
 * 校验请求中的 JWT，返回解析后的载荷
 * @param request Next.js Request 对象
 * @returns 包含 userId 的载荷对象；校验失败返回 null
 */
function verifyToken(request: Request): AuthPayload | null {
  const token = getTokenFromRequest(request);
  if (!token) return null;

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    // 未配置 JWT 密钥，无法校验
    return null;
  }

  try {
    const decoded = jwt.verify(token, secret);
    if (typeof decoded === "string") return null;
    if (!decoded || typeof decoded.userId !== "string") return null;
    return decoded as AuthPayload;
  } catch {
    // token 无效或已过期
    return null;
  }
}

/**
 * 签发 JWT
 * @param userId 用户 ID
 * @returns 签名后的 JWT 字符串
 */
export function signToken(userId: string): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET 未配置");
  }
  // 过期时间 7 天
  return jwt.sign({ userId }, secret, { expiresIn: "7d" });
}

/**
 * 鉴权失败的统一响应
 */
function unauthorizedResponse(message = "未授权，请先登录") {
  return NextResponse.json({ message }, { status: 401 });
}

/**
 * 高阶函数：包装需要鉴权的 Route Handler
 * 未通过鉴权时直接返回 401；通过鉴权时将 userId 注入到 handler 参数
 *
 * @example
 * export const GET = requireAuth(async (request, { userId }) => { ... });
 */
export function requireAuth(
  handler: (
    request: Request,
    ctx: { userId: string },
  ) => Promise<Response> | Response,
): (request: Request) => Promise<Response> {
  return async (request: Request): Promise<Response> => {
    const payload = verifyToken(request);
    if (!payload) {
      return unauthorizedResponse();
    }
    return handler(request, { userId: payload.userId });
  };
}

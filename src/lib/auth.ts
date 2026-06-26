import { NextResponse } from "next/server";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

// 用户角色类型（与数据库 User.role 字段一致）
export type UserRole = "user" | "admin" | "super_admin";

// 角色权限层级：数值越大权限越高
const ROLE_LEVEL: Record<UserRole, number> = {
  user: 0,
  admin: 1,
  super_admin: 2,
};

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
 * 鉴权失败的统一响应（401）
 */
function unauthorizedResponse(message = "未授权，请先登录") {
  return NextResponse.json({ message }, { status: 401 });
}

/**
 * 权限不足的统一响应（403）
 */
function forbiddenResponse(message = "权限不足，禁止访问") {
  return NextResponse.json({ message }, { status: 403 });
}

// Next.js Route Handler 的第二参数上下文类型（params 为 Promise，Next.js 16 异步参数）
interface RouteContext {
  params?: Promise<Record<string, string>>;
}

/**
 * 高阶函数：包装需要鉴权的 Route Handler
 * 未通过鉴权时直接返回 401；通过鉴权时将 userId 注入到 handler 参数
 * 同时透传 Next.js 的路由上下文（params），支持动态路由
 *
 * @example
 * export const GET = requireAuth(async (request, { userId }) => { ... });
 * export const DELETE = requireAuth(async (request, { userId, params }) => {
 *   const { id } = await params;  // 动态路由参数
 * });
 */
export function requireAuth(
  handler: (
    request: Request,
    ctx: { userId: string; params?: Promise<Record<string, string>> },
  ) => Promise<Response> | Response,
): (request: Request, context?: RouteContext) => Promise<Response> {
  return async (request: Request, context?: RouteContext): Promise<Response> => {
    const payload = verifyToken(request);
    if (!payload) {
      return unauthorizedResponse();
    }
    return handler(request, { userId: payload.userId, params: context?.params });
  };
}

/**
 * 内部辅助：校验 JWT 并查询用户角色，返回 userId + role 或错误响应
 *
 * @param request 请求对象
 * @param requiredRole 最低要求的角色
 * @returns 成功返回 { userId, role }，失败返回 NextResponse
 */
async function verifyRole(
  request: Request,
  requiredRole: UserRole,
): Promise<{ userId: string; role: UserRole } | NextResponse> {
  const payload = verifyToken(request);
  if (!payload) {
    return unauthorizedResponse();
  }

  // 查询用户角色与状态
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { role: true, status: true },
  });

  // 用户不存在
  if (!user) {
    return unauthorizedResponse("用户不存在");
  }

  // 账号已被封禁
  if (user.status === "blocked") {
    return forbiddenResponse("账号已被封禁，请联系管理员");
  }

  const userRole = user.role as UserRole;

  // 角色权限不足
  if (ROLE_LEVEL[userRole] < ROLE_LEVEL[requiredRole]) {
    return forbiddenResponse();
  }

  return { userId: payload.userId, role: userRole };
}

/**
 * 高阶函数：包装需要 admin 及以上权限的 Route Handler
 * 校验 JWT → 查询用户角色 → 确认 role >= admin
 * 通过后将 userId + role 注入到 handler 参数，同时透传路由上下文
 *
 * @example
 * export const GET = requireAdmin(async (request, { userId, role }) => { ... });
 */
export function requireAdmin(
  handler: (
    request: Request,
    ctx: { userId: string; role: UserRole; params?: Promise<Record<string, string>> },
  ) => Promise<Response> | Response,
): (request: Request, context?: RouteContext) => Promise<Response> {
  return async (request: Request, context?: RouteContext): Promise<Response> => {
    const result = await verifyRole(request, "admin");
    if (result instanceof NextResponse) {
      return result;
    }
    return handler(request, { ...result, params: context?.params });
  };
}

/**
 * 高阶函数：包装需要 super_admin 权限的 Route Handler
 * 校验 JWT → 查询用户角色 → 确认 role === super_admin
 * 通过后将 userId + role 注入到 handler 参数，同时透传路由上下文
 *
 * @example
 * export const PATCH = requireSuperAdmin(async (request, { userId, role, params }) => {
 *   const { id } = await params;
 * });
 */
export function requireSuperAdmin(
  handler: (
    request: Request,
    ctx: { userId: string; role: UserRole; params?: Promise<Record<string, string>> },
  ) => Promise<Response> | Response,
): (request: Request, context?: RouteContext) => Promise<Response> {
  return async (request: Request, context?: RouteContext): Promise<Response> => {
    const result = await verifyRole(request, "super_admin");
    if (result instanceof NextResponse) {
      return result;
    }
    return handler(request, { ...result, params: context?.params });
  };
}

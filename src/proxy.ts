import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

/**
 * Next.js Proxy（原 middleware，Next.js 16 已重命名）
 *
 * 职责：对需要登录的路由统一检查 cookie 中的 JWT（cookie 名：token）。
 * - 若 token 验签通过，直接放行（正常请求页面）
 * - 若无 token，重定向到 /login?redirect=<原路径>
 * - admin 路由的 role 检查仍由页面层处理（避免在 proxy 中解析 JWT）
 * - /api 路由不在此拦截（API 有自己的鉴权）
 * - /workflow/[id] 详情/执行路由不在此拦截（由页面层处理）
 *
 * 注意：使用 jose 库而非 jsonwebtoken，因为 proxy 运行在 Edge Runtime，
 * jsonwebtoken 依赖 Node.js 原生 crypto 模块，在 Edge Runtime 中不可用。
 */

// 受保护的路由前缀（命中其一即需要登录）
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/admin",
  "/chat",
  "/workspace",
];

// JWT 密钥的 Uint8Array 缓存（jose 需要 Uint8Array 格式）
let _secretKey: Uint8Array | null = null;

function getSecretKey(): Uint8Array | null {
  const secret = process.env.JWT_SECRET;
  if (!secret) return null;
  if (!_secretKey) {
    _secretKey = new TextEncoder().encode(secret);
  }
  return _secretKey;
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // 仅对受保护路由前缀生效（matcher 已限定，这里再保险一次）
  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
  if (!isProtected) {
    return NextResponse.next();
  }

  // 从 cookie 读取 JWT 并验签
  const token = request.cookies.get("token")?.value;
  const secretKey = getSecretKey();
  if (token && secretKey) {
    try {
      // 使用 jose 验证 JWT（兼容 Edge Runtime）
      // 仅验签和检查过期，不查库（性能优先，库查询由 API 层处理）
      await jwtVerify(token, secretKey, {
        algorithms: ["HS256"],
        issuer: "randu-ai",
        audience: "randu-ai-users",
      });
      return NextResponse.next();
    } catch {
      // token 无效或过期，继续重定向到登录页
    }
  }

  // 无 token，重定向到登录页并带上原路径（含 query string）
  // 前端登录页会读取 redirect 参数，登录成功后跳回
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("redirect", pathname + search);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    "/dashboard",
    "/dashboard/:path*",
    "/admin",
    "/admin/:path*",
    "/chat",
    "/chat/:path*",
    "/workspace",
    "/workspace/:path*",
  ],
};

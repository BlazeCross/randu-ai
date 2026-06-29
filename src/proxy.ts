import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Next.js Proxy（原 middleware，Next.js 16 已重命名）
 *
 * 职责：对需要登录的路由统一检查 cookie 中的 JWT（cookie 名：token）。
 * - 若有 token，直接放行（正常请求页面）
 * - 若无 token，重定向到 /login?redirect=<原路径>
 * - admin 路由的 role 检查仍由页面层处理（避免在 proxy 中解析 JWT）
 * - /api 路由不在此拦截（API 有自己的鉴权）
 * - /workflow/[id] 详情/执行路由不在此拦截（由页面层处理）
 *
 * 注意：前端登录时会同步设置 cookie（见 auth-context.tsx 的 login 函数），
 * 因此已登录用户的 cookie 中会有 token，proxy 会放行。
 */

// 受保护的路由前缀（命中其一即需要登录）
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/admin",
  "/chat",
  "/workspace",
];

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // 仅对受保护路由前缀生效（matcher 已限定，这里再保险一次）
  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
  if (!isProtected) {
    return NextResponse.next();
  }

  // 从 cookie 读取 JWT（cookie 名：token）
  // 前端登录时通过 document.cookie 设置，proxy 在服务端可读取
  const token = request.cookies.get("token")?.value;
  if (token) {
    // 已登录，放行
    return NextResponse.next();
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

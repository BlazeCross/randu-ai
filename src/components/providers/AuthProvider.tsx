"use client";

import { AuthProvider as AuthProviderInner } from "@/lib/auth-context";

/**
 * 客户端 Provider 包装组件
 * 用于在服务端组件 layout.tsx 中包裹 children，提供登录状态上下文
 */
export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthProviderInner>{children}</AuthProviderInner>;
}

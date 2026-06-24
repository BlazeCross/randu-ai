"use client";

import { useContext } from "react";
import { AuthContext } from "@/lib/auth-context";

/**
 * useAuth：获取登录状态上下文
 * 必须在 AuthProvider 内部使用，否则抛出错误
 */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth 必须在 AuthProvider 内部使用");
  }
  return ctx;
}

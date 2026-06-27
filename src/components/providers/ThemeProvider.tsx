"use client";

import { useCallback, useEffect, useState } from "react";

export type Theme = "light" | "dark";

const STORAGE_KEY = "randu-theme";

/**
 * 主题 Hook
 *
 * - 读取 localStorage(randu-theme)，默认 light
 * - 直接操作 document.documentElement.classList 切换 dark 类
 * - mount 时同步 <html> 的 dark 类与 localStorage
 *
 * 防闪烁由 layout.tsx 中的 inline script 在 hydrate 前处理，
 * 此 hook 在 hydrate 后接管状态管理。
 */
export function useTheme() {
  const [theme, setThemeState] = useState<Theme | null>(null);

  // mount 时同步 localStorage -> html.dark
  useEffect(() => {
    let initial: Theme = "light";
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "dark" || saved === "light") {
        initial = saved;
      }
    } catch {
      // localStorage 不可用时使用默认值
    }
    setThemeState(initial);
    document.documentElement.classList.toggle("dark", initial === "dark");
  }, []);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    try {
      localStorage.setItem(STORAGE_KEY, t);
    } catch {
      // localStorage 写入失败时忽略
    }
    document.documentElement.classList.toggle("dark", t === "dark");
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const next: Theme = prev === "dark" ? "light" : "dark";
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        // localStorage 写入失败时忽略
      }
      document.documentElement.classList.toggle("dark", next === "dark");
      return next;
    });
  }, []);

  return { theme, setTheme, toggleTheme };
}

/**
 * ThemeProvider
 *
 * 实际不需要全局 context（直接操作 document），
 * 此处仅作为可选包裹组件，保持与其它 Provider 一致的结构。
 */
export default function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

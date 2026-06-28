"use client";

import { useTheme } from "@/components/providers/ThemeProvider";

/**
 * 主题切换按钮
 *
 * - 暗色时显示太阳图标（点击切到白天）
 * - 白天时显示月亮图标（点击切到暗色）
 * - theme 为 null（加载中）时显示月亮图标作为占位
 */
export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "切换到白天模式" : "切换到暗色模式"}
      className="grid h-9 w-9 place-items-center rounded-full text-muted-foreground transition-all duration-200 hover:bg-muted hover:text-foreground hover:rotate-12"
    >
      {isDark ? (
        // 太阳图标
        <svg
          className="h-5 w-5 transition-transform duration-300"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.7}
          viewBox="0 0 24 24"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <circle cx="12" cy="12" r="5" />
          <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
        </svg>
      ) : (
        // 月亮图标（含加载中占位）
        <svg
          className="h-5 w-5 transition-transform duration-300"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.7}
          viewBox="0 0 24 24"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
    </button>
  );
}

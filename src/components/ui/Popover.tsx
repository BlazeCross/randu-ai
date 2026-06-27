"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

// 简单的 className 拼接工具（过滤 falsy 值）
function cx(...args: Array<string | false | null | undefined>): string {
  return args.filter(Boolean).join(" ");
}

export interface PopoverProps {
  /** 触发器内容 */
  trigger: ReactNode;
  /** 悬浮面板内容 */
  content: ReactNode;
  /** 面板对齐方式：start 左对齐 / center 居中 / end 右对齐 */
  align?: "start" | "center" | "end";
  /** 自定义 className，合并到面板容器 */
  className?: string;
}

// 各对齐方式对应的定位样式
const ALIGN_STYLES: Record<NonNullable<PopoverProps["align"]>, string> = {
  start: "left-0",
  center: "left-1/2 -translate-x-1/2",
  end: "right-0",
};

/**
 * Popover 弹出面板
 *
 * 基于 Doubao 设计系统的弹出层，纯原生实现（不依赖第三方库）。
 * - 点击 trigger 切换显隐
 * - 点击面板外部或按 Escape 关闭
 * - 面板默认定位在 trigger 下方（bottom-start）
 */
export default function Popover({
  trigger,
  content,
  align = "start",
  className,
}: PopoverProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // 监听外部点击与 Escape 键
  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative inline-block">
      {/* 触发器 */}
      <div
        onClick={() => setOpen((v) => !v)}
        className="inline-block cursor-pointer"
      >
        {trigger}
      </div>

      {/* 悬浮面板 */}
      {open && (
        <div
          className={cx(
            "absolute top-full mt-1.5",
            ALIGN_STYLES[align],
          )}
        >
          <div
            className={cx(
              "z-50 min-w-[200px] animate-scale-in rounded-[var(--radius-sm)] border border-border bg-popover p-1.5 shadow-lg",
              className,
            )}
          >
            {content}
          </div>
        </div>
      )}
    </div>
  );
}

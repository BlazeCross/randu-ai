"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { cx } from "@/lib/cn";

interface RelatedWorkflow {
  id: string;
  name: string;
  description: string | null;
  category: string;
  icon: string | null;
  status: string;
}

interface WorkflowDetailActionsProps {
  workflowId: string;
  workflowName: string;
  related: RelatedWorkflow[];
}

const AMBER_COLOR = "#E67E22";

// 模拟使用次数
function getMockUsageCount(id: string): string {
  const count = Math.floor(Math.random() * 2000) + 100;
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k`;
  }
  return count.toString();
}

export default function WorkflowDetailActions({
  workflowId,
  workflowName,
  related,
}: WorkflowDetailActionsProps) {
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [isFavorited, setIsFavorited] = useState(false);

  // 从 localStorage 加载收藏状态
  useEffect(() => {
    try {
      const stored = localStorage.getItem("workflow-favorites");
      if (stored) {
        const parsed = new Set(JSON.parse(stored) as string[]);
        setFavorites(parsed);
        setIsFavorited(parsed.has(workflowId));
      }
    } catch {
      // ignore
    }
  }, [workflowId]);

  // 切换收藏状态
  const toggleFavorite = useCallback(() => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(workflowId)) {
        next.delete(workflowId);
        setIsFavorited(false);
      } else {
        next.add(workflowId);
        setIsFavorited(true);
      }
      try {
        localStorage.setItem("workflow-favorites", JSON.stringify([...next]));
      } catch {
        // ignore
      }
      return next;
    });
  }, [workflowId]);

  return (
    <>
      {/* 收藏按钮 */}
      <button
        type="button"
        onClick={toggleFavorite}
        className={cx(
          "inline-flex w-full items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition-all duration-200",
          isFavorited
            ? "bg-red-500 text-white hover:bg-red-600"
            : "border border-border bg-card text-foreground hover:bg-muted",
        )}
      >
        <svg
          className={cx("h-4 w-4", isFavorited ? "fill-current" : "fill-transparent")}
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
          />
        </svg>
        {isFavorited ? "已收藏" : "收藏"}
      </button>

      {/* 相关推荐 - 卡片形式 */}
      {related.length > 0 && (
        <div className="border-t border-border px-2 pt-4">
          <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            相关推荐
          </div>
          <div className="flex flex-col gap-2">
            {related.slice(0, 3).map((item) => (
              <Link
                key={item.id}
                href={`/workflow/${item.id}`}
                className="group flex items-center gap-3 rounded-[var(--radius-sm)] border border-border bg-card p-3 transition-all duration-200 hover:border-amber-300 hover:bg-accent/5"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius)] bg-gradient-to-br from-accent/20 to-primary/10 text-xl transition-transform duration-200 group-hover:scale-110">
                  {item.icon || "🤖"}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-foreground group-hover:text-amber-600">
                    {item.name}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-muted-foreground">{item.category}</span>
                    <span className="text-xs text-muted-foreground">
                      · {getMockUsageCount(item.id)} 次使用
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

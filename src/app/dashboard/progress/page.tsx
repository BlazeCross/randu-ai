"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

/* ============================================================
 * 学习路径元数据（与 paths/page.tsx 保持同步）
 * ============================================================ */
interface PathMeta {
  id: string;
  title: string;
  tutorialCount: number;
}

const PATH_META: PathMeta[] = [
  { id: "ecommerce-ai-7days", title: "电商 AI 7 天入门", tutorialCount: 12 },
  { id: "new-media-content", title: "新媒体内容创作之路", tutorialCount: 20 },
  { id: "agent-development", title: "智能体开发入门", tutorialCount: 15 },
  { id: "ai-side-income", title: "AI 副业变现指南", tutorialCount: 30 },
];

// 单个路径进度
interface PathProgress {
  pathId: string;
  completedSteps: number;
  totalSteps: number;
  percent: number;
}

export default function ProgressPage() {
  const { user, token } = useAuth();
  const [pathProgressList, setPathProgressList] = useState<PathProgress[]>([]);
  const [loading, setLoading] = useState(true);

  // 获取所有路径的进度
  const fetchAllProgress = useCallback(async () => {
    if (!token) return;
    try {
      const progressList: PathProgress[] = [];
      for (const path of PATH_META) {
        const res = await fetch(`/api/user/progress?pathId=${path.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          const completedSteps = data.steps.filter((s: { completed: boolean }) => s.completed).length;
          progressList.push({
            pathId: path.id,
            completedSteps,
            totalSteps: path.tutorialCount,
            percent: path.tutorialCount > 0 ? Math.round((completedSteps / path.tutorialCount) * 100) : 0,
          });
        }
      }
      setPathProgressList(progressList);
    } catch (error) {
      console.error("获取学习进度失败:", error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchAllProgress();
    } else {
      setLoading(false);
    }
  }, [token, fetchAllProgress]);

  // 统计
  const totalPaths = PATH_META.length;
  const completedPaths = pathProgressList.filter((p) => p.percent === 100).length;
  const totalTutorials = PATH_META.reduce((sum, p) => sum + p.tutorialCount, 0);
  const completedTutorials = pathProgressList.reduce((sum, p) => sum + p.completedSteps, 0);

  // 加载中
  if (loading) {
    return (
      <main className="flex flex-1 items-center justify-center bg-background">
        <svg
          className="h-10 w-10 animate-spin text-primary"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      </main>
    );
  }

  // 未登录
  if (!user) {
    return (
      <main className="flex flex-1 items-center justify-center bg-background px-4">
        <div className="text-center">
          <h2 className="mb-2 text-xl font-semibold text-foreground">
            请先登录
          </h2>
          <p className="mb-6 text-sm text-muted-foreground">
            登录后即可查看学习进度
          </p>
          <Link
            href="/login"
            className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary-hover"
          >
            前往登录
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 bg-background">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* 面包屑 + 标题 */}
        <div className="mb-6">
          <nav className="mb-2 text-xs text-muted-foreground">
            <Link href="/dashboard" className="hover:text-primary">
              个人中心
            </Link>
            <span className="mx-1">/</span>
            <span className="text-muted-foreground">学习进度</span>
          </nav>
          <h1 className="text-2xl font-bold text-foreground">学习进度</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            追踪你在燃渡学院的学习旅程
          </p>
        </div>

        {/* 概览卡片 */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-[var(--radius-md)] border border-border bg-card p-6">
            <div className="text-3xl font-bold text-accent">{completedPaths}</div>
            <div className="mt-1 text-sm text-muted-foreground">已完成路径</div>
            <div className="mt-2 text-xs text-muted-foreground">
              共 {totalPaths} 条路径
            </div>
          </div>
          <div className="rounded-[var(--radius-md)] border border-border bg-card p-6">
            <div className="text-3xl font-bold text-accent">{completedTutorials}</div>
            <div className="mt-1 text-sm text-muted-foreground">已完成教程</div>
            <div className="mt-2 text-xs text-muted-foreground">
              共 {totalTutorials} 个教程
            </div>
          </div>
          <div className="rounded-[var(--radius-md)] border border-border bg-card p-6">
            <div className="text-3xl font-bold text-accent">
              {totalTutorials > 0 ? Math.round((completedTutorials / totalTutorials) * 100) : 0}%
            </div>
            <div className="mt-1 text-sm text-muted-foreground">总进度</div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-accent transition-all duration-500"
                style={{ width: `${totalTutorials > 0 ? (completedTutorials / totalTutorials) * 100 : 0}%` }}
              />
            </div>
          </div>
        </div>

        {/* 路径进度列表 */}
        <div className="rounded-[var(--radius-md)] border border-border bg-card">
          <div className="border-b border-border p-6">
            <h2 className="text-base font-semibold text-foreground">学习路径进度</h2>
          </div>
          <div className="divide-y divide-border">
            {PATH_META.map((path) => {
              const progress = pathProgressList.find((p) => p.pathId === path.id);
              const completed = progress?.completedSteps ?? 0;
              const total = path.tutorialCount;
              const percent = progress?.percent ?? 0;
              return (
                <div key={path.id} className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-foreground">
                        {path.title}
                      </h3>
                      <p className="mt-1 text-xs text-muted-foreground">
                        已完成 {completed}/{total} 个教程
                      </p>
                    </div>
                    <div className="ml-4 flex items-center gap-3">
                      <span className="text-sm font-medium text-accent">
                        {percent}%
                      </span>
                      <Link
                        href={`/academy/paths/${path.id}`}
                        className="rounded-full bg-accent/10 px-4 py-1.5 text-xs font-medium text-accent transition-colors hover:bg-accent/20"
                      >
                        {percent === 100 ? "复习" : percent > 0 ? "继续" : "开始"}
                      </Link>
                    </div>
                  </div>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-accent transition-all duration-500"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 提示 */}
        <div className="mt-6 rounded-[var(--radius-md)] border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">
            💡 提示：在学习路径详情页点击教程项即可标记为已完成，进度会自动保存
          </p>
        </div>
      </div>
    </main>
  );
}

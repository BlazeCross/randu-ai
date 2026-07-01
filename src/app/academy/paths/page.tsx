import type { Metadata } from "next";
import Link from "next/link";
import PathCard from "@/components/academy/PathCard";
import type { LearningPath } from "@/components/academy/PathCard";

export const metadata: Metadata = {
  title: "AI 学习路径 - 燃渡学院",
  description: "按职业场景设计的系统化学习路线，从零基础到实战项目",
};

/* ============================================================
 * 预设学习路径数据
 * ============================================================ */
const learningPaths: LearningPath[] = [
  {
    id: "ecommerce-ai-7days",
    title: "电商 AI 7 天入门",
    goal: "零基础电商人 7 天掌握 AI 作图、写文案、运营技巧",
    duration: 7,
    tutorialCount: 12,
    tags: ["电商", "零基础"],
  },
  {
    id: "new-media-content",
    title: "新媒体内容创作之路",
    goal: "从小红书到抖音，AI 助力内容批量生产",
    duration: 14,
    tutorialCount: 20,
    tags: ["新媒体", "内容创作"],
  },
  {
    id: "agent-development",
    title: "智能体开发入门",
    goal: "用扣子/Coze 零代码搭建 AI 应用",
    duration: 10,
    tutorialCount: 15,
    tags: ["开发", "智能体"],
  },
  {
    id: "ai-side-income",
    title: "AI 副业变现指南",
    goal: "从 0 到 1 用 AI 技能赚取第一桶金",
    duration: 21,
    tutorialCount: 30,
    tags: ["副业", "变现"],
  },
];

/**
 * 学习路径列表页
 *
 * 展示所有预设学习路径卡片，桌面端 2 列，移动端 1 列。
 */
export default function AcademyPathsPage() {
  return (
    <main className="flex-1 bg-background">
      <div className="mx-auto max-w-[1400px] px-6 py-14 sm:px-8 lg:px-12 lg:py-20">
        {/* 页面标题区 */}
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="inline-flex items-center rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
              系统化学习
            </span>
            <span className="inline-flex items-center rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
              按职业场景设计
            </span>
          </div>
          <h1 className="mt-5 text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            AI 学习路径
          </h1>
          <p className="mt-5 text-base leading-7 text-muted-foreground sm:text-lg">
            按职业场景设计的系统化学习路线，配套真实可运行工作流，零基础也能高效学习。
          </p>
        </div>

        {/* 学习路径卡片网格 */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {learningPaths.map((path) => (
            <PathCard key={path.id} path={path} />
          ))}
        </div>

        {/* 底部说明 */}
        <div className="mt-12 rounded-[var(--radius-md)] border border-border bg-card p-6 text-center">
          <p className="text-sm text-muted-foreground">
            学习路径配套燃渡平台真实可运行工作流，点击卡片即可开始学习。
          </p>
          <Link
            href="/academy"
            className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-accent transition-colors hover:text-accent-hover"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2}
              aria-hidden
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 19l-7-7 7-7"
              />
            </svg>
            返回学院首页
          </Link>
        </div>
      </div>
    </main>
  );
}

import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "燃渡学院 - 系统学习 AI 工作流",
  description:
    "从提示词工程到工作流开发，从入门到精通。结合平台真实工作流，提供图文教程、视频教程与实战项目。",
};

// 课程方向预告
const upcomingTracks = [
  {
    icon: "🎬",
    title: "AI 视频创作入门",
    desc: "从 0 到 1 掌握 AI 视频生成工作流，包含提示词编写、首尾帧设计、视频拼接等实战技巧。",
    tag: "即将上线",
  },
  {
    icon: "🎨",
    title: "提示词工程实战",
    desc: "系统学习提示词结构与模板，针对不同模型（豆包/Seedream/Seedance）优化生成效果。",
    tag: "即将上线",
  },
  {
    icon: "🤖",
    title: "Coze 工作流开发",
    desc: "从节点编排到 API 调用，深度拆解 Coze 工作流的设计模式与最佳实践。",
    tag: "即将上线",
  },
  {
    icon: "💡",
    title: "智能体应用实战",
    desc: "多模态对话、工具调用、RAG 检索增强，构建可落地的智能体应用。",
    tag: "即将上线",
  },
];

// 教程入口
const tutorialEntries = [
  {
    href: "/academy/articles",
    icon: "📚",
    title: "图文教程",
    desc: "结构化图文教程，按分类浏览每个工作流的详细使用说明",
    cta: "浏览图文教程",
  },
  {
    href: "/academy/videos",
    icon: "🎥",
    title: "视频教程",
    desc: "视频演示教程，跟随实操快速掌握 AI 工作流应用方法",
    cta: "观看视频教程",
  },
];

// 配套资源
const resources = [
  {
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
      />
    ),
    title: "实战项目驱动",
    desc: "每个章节配套可运行的真实工作流",
  },
  {
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M13 10V3L4 14h7v7l9-11h-7z"
      />
    ),
    title: "渐进式难度",
    desc: "从入门到进阶，按需学习",
  },
  {
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
      />
    ),
    title: "工作流教程中心",
    desc: "查看每个工作流的飞书文档教程",
  },
];

/**
 * 燃渡学院首页
 *
 * 学院入口页（模式 A 布局，使用全局 Navbar）：
 * - 头部介绍 + CTA
 * - 教程入口（图文/视频）
 * - 课程方向预告
 * - 配套资源
 */
export default function AcademyPage() {
  return (
    <main className="flex-1 bg-background">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* 头部介绍 */}
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
            即将上线
          </span>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            系统化 AI 实战课程
          </h1>
          <p className="mt-4 text-base text-muted-foreground">
            从提示词工程到工作流开发，从入门到精通。我们结合平台真实工作流，提供配套的实战项目与练习。
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/register"
              className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-[color-mix(in_srgb,var(--primary)_90%,#000)]"
            >
              免费注册抢先体验
            </Link>
            <Link
              href="/workspace"
              className="rounded-full border border-border bg-card px-6 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              先去工作台看看
            </Link>
          </div>
        </div>

        {/* 教程入口（图文 / 视频） */}
        <div className="mt-16">
          <h2 className="mb-6 text-xl font-semibold text-foreground">
            立即可用教程
          </h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {tutorialEntries.map((entry) => (
              <Link
                key={entry.href}
                href={entry.href}
                className="group flex flex-col rounded-[var(--radius)] border border-border bg-card p-6 transition-all hover:border-primary hover:bg-accent/10"
              >
                <div className="mb-4 flex items-center justify-between">
                  <span className="flex h-12 w-12 items-center justify-center rounded-[var(--radius-lg)] bg-accent text-2xl">
                    {entry.icon}
                  </span>
                  <svg
                    className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                </div>
                <h3 className="mb-2 text-lg font-semibold text-foreground">
                  {entry.title}
                </h3>
                <p className="mb-4 flex-1 text-sm leading-6 text-muted-foreground">
                  {entry.desc}
                </p>
                <span className="inline-flex items-center text-sm font-medium text-primary">
                  {entry.cta}
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* 课程方向预告 */}
        <div className="mt-16">
          <h2 className="mb-6 text-xl font-semibold text-foreground">
            课程方向预告
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {upcomingTracks.map((track) => (
              <div
                key={track.title}
                className="group rounded-[var(--radius)] border border-border bg-card p-6 transition-all hover:border-primary hover:bg-accent/10"
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-3xl">{track.icon}</span>
                  <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                    {track.tag}
                  </span>
                </div>
                <h3 className="mb-2 text-lg font-semibold text-foreground">
                  {track.title}
                </h3>
                <p className="text-sm leading-6 text-muted-foreground">
                  {track.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* 配套资源 */}
        <div className="mt-16 rounded-[var(--radius)] border border-primary/30 bg-gradient-to-br from-accent/60 to-background p-8">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {resources.map((r) => (
              <div key={r.title} className="text-center">
                <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-[var(--radius-lg)] bg-accent">
                  <svg
                    className="h-6 w-6 text-accent-foreground"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={1.8}
                  >
                    {r.icon}
                  </svg>
                </div>
                <h3 className="text-sm font-semibold text-foreground">
                  {r.title}
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">{r.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 text-center">
            <Link
              href="/tutorial"
              className="inline-flex items-center gap-1 text-sm font-medium text-primary transition-colors hover:text-primary-hover"
            >
              前往工作流教程中心
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

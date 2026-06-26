import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "课程中心 - 燃渡AI",
  description: "系统化的 AI 工作流与提示词工程实战课程，从入门到精通",
};

/**
 * 课程入口（Phase 3.5）
 *
 * 占位页面，未来接入真实课程内容。
 * 当前展示课程方向预告 + 引导用户注册/登录。
 */
export default function CoursesPage() {
  // 课程方向预告（占位）
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

  return (
    <main className="flex-1 bg-neutral-50">
      {/* 面包屑 */}
      <div className="border-b border-neutral-200 bg-white">
        <nav
          aria-label="面包屑"
          className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8"
        >
          <ol className="flex flex-wrap items-center gap-2 text-sm text-neutral-500">
            <li>
              <Link href="/" className="hover:text-primary">
                首页
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li className="font-medium text-neutral-900" aria-current="page">
              课程
            </li>
          </ol>
        </nav>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* 头部介绍 */}
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center rounded-full bg-primary-50 px-3 py-1 text-xs font-medium text-primary-700">
            即将上线
          </span>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
            系统化 AI 实战课程
          </h1>
          <p className="mt-4 text-base text-neutral-600">
            从提示词工程到工作流开发，从入门到精通。我们将结合平台真实工作流，提供配套的实战项目与练习。
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/register"
              className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-primary-600/25 transition-all hover:bg-primary-hover"
            >
              免费注册抢先体验
            </Link>
            <Link
              href="/workspace"
              className="rounded-xl border border-neutral-300 bg-white px-6 py-3 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
            >
              先去工作台看看
            </Link>
          </div>
        </div>

        {/* 课程方向预告 */}
        <div className="mt-16">
          <h2 className="mb-6 text-xl font-semibold text-neutral-900">
            课程方向预告
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {upcomingTracks.map((track) => (
              <div
                key={track.title}
                className="group relative overflow-hidden rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm transition-all hover:border-primary hover:shadow-md"
              >
                {/* 标签 */}
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-3xl">{track.icon}</span>
                  <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-500">
                    {track.tag}
                  </span>
                </div>
                <h3 className="mb-2 text-lg font-semibold text-neutral-900">
                  {track.title}
                </h3>
                <p className="text-sm text-neutral-600">{track.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 配套资源 */}
        <div className="mt-16 rounded-2xl border border-primary-200 bg-gradient-to-br from-primary-50 to-white p-8">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-100">
                <svg
                  className="h-6 w-6 text-primary-700"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={1.8}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                  />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-neutral-900">
                实战项目驱动
              </h3>
              <p className="mt-1 text-xs text-neutral-500">
                每个章节配套可运行的真实工作流
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-100">
                <svg
                  className="h-6 w-6 text-primary-700"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={1.8}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-neutral-900">
                渐进式难度
              </h3>
              <p className="mt-1 text-xs text-neutral-500">
                从入门到进阶，按需学习
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-100">
                <svg
                  className="h-6 w-6 text-primary-700"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={1.8}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-neutral-900">
                教程文档中心
              </h3>
              <p className="mt-1 text-xs text-neutral-500">
                查看每个工作流的飞书文档教程
              </p>
            </div>
          </div>
          <div className="mt-6 text-center">
            <Link
              href="/docs"
              className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary-hover"
            >
              前往教程文档中心
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

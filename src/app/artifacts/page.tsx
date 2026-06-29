"use client";

import Link from "next/link";
import GlowCard from "@/components/ui/GlowCard";
import GradientText from "@/components/ui/GradientText";
import ScrollReveal from "@/components/ui/ScrollReveal";
import { cx } from "@/lib/cn";

// 示例作品类型
interface SampleArtifact {
  title: string;
  type: string;
  icon: string;
  desc: string;
  gradient: string;
}

// 示例卡片数据（展示概念，灰色/半透明风格表示未激活）
const SAMPLE_ARTIFACTS: SampleArtifact[] = [
  {
    title: "夏日海岸线",
    type: "图片作品",
    icon: "🖼️",
    desc: "由 Seedream 文生图生成的高清海岸风景",
    gradient: "from-chart-1/30 to-chart-2/20",
  },
  {
    title: "城市夜景延时",
    type: "视频作品",
    icon: "🎬",
    desc: "由 Seedance 生成的 5 秒城市夜景视频",
    gradient: "from-primary/25 to-chart-3/20",
  },
  {
    title: "新品发布文案",
    type: "文案作品",
    icon: "📝",
    desc: "由豆包生成的营销推广文案",
    gradient: "from-success/25 to-chart-1/20",
  },
  {
    title: "数据看板组件",
    type: "代码片段",
    icon: "💻",
    desc: "由 AI 生成的 React 数据可视化组件",
    gradient: "from-warning/25 to-chart-2/20",
  },
  {
    title: "LOGO 设计稿",
    type: "图片作品",
    icon: "🎨",
    desc: "由 Seedream 生成的品牌 LOGO 设计方案",
    gradient: "from-chart-3/30 to-primary/20",
  },
  {
    title: "产品介绍视频",
    type: "视频作品",
    icon: "🎥",
    desc: "由 Seedance 生成的产品宣传短片",
    gradient: "from-chart-1/25 to-success/20",
  },
];

// 功能预告
const FEATURES = [
  {
    title: "保存创作",
    desc: "一键保存你的 AI 创作成果，永久保留所有生成内容，随时回顾灵感来源。",
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
        <polyline points="17 21 17 13 7 13 7 21" />
        <polyline points="7 3 7 8 15 8" />
      </svg>
    ),
  },
  {
    title: "分享展示",
    desc: "生成专属分享链接，向朋友或客户展示你的 AI 作品集，支持精美卡片预览。",
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <circle cx="18" cy="5" r="3" />
        <circle cx="6" cy="12" r="3" />
        <circle cx="18" cy="19" r="3" />
        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
      </svg>
    ),
  },
  {
    title: "版本管理",
    desc: "记录每次创作的参数与版本，对比不同效果，找到最满意的那一版。",
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M3 3v5h5" />
        <path d="M3.05 13A9 9 0 1 0 6 5.3L3 8" />
        <path d="M12 7v5l4 2" />
      </svg>
    ),
  },
];

export default function ArtifactsPage() {
  return (
    <main className="flex-1 bg-background">
      {/* ===== Hero 区域 ===== */}
      <section className="relative overflow-hidden border-b border-border">
        {/* 背景装饰 */}
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-primary/6 blur-3xl" />
          <div className="absolute -left-20 bottom-0 h-72 w-72 rounded-full bg-chart-1/4 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-5xl px-4 py-16 text-center sm:px-6 sm:py-20 lg:px-8">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-xs font-semibold uppercase tracking-wider text-accent-foreground">
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
            </svg>
            作品空间
          </span>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-5xl">
            <GradientText>作品空间</GradientText>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
            管理你的AI创作成果
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        {/* ===== 即将上线横幅 ===== */}
        <ScrollReveal>
          <div
            className="relative overflow-hidden rounded-[var(--radius)] px-6 py-8 text-center shadow-[var(--shadow-md)] sm:px-12 sm:py-10"
            style={{
              background:
                "linear-gradient(135deg, var(--primary), var(--color-primary-400, var(--primary)))",
            }}
          >
            {/* 装饰光斑 */}
            <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" aria-hidden />
            <div className="pointer-events-none absolute -left-10 -bottom-10 h-40 w-40 rounded-full bg-white/5 blur-2xl" aria-hidden />

            <div className="relative flex flex-col items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                <svg className="h-7 w-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-white sm:text-2xl">
                功能即将上线，敬请期待
              </h2>
              <p className="max-w-xl text-sm text-white/80 sm:text-base">
                我们正在打磨作品空间功能，让你能更好地保存、管理与展示 AI 创作成果。上线后将第一时间通知你。
              </p>
            </div>
          </div>
        </ScrollReveal>

        {/* ===== 示例卡片网格（未激活） ===== */}
        <section className="mt-16">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              未来你将在这里看到
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              以下是作品空间支持的内容类型预览
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-4 opacity-60 grayscale sm:grid-cols-2 lg:grid-cols-3">
            {SAMPLE_ARTIFACTS.map((artifact, idx) => (
              <ScrollReveal key={artifact.title} className={`stagger-${Math.min(idx + 1, 8)}`}>
                <div className="flex h-full flex-col overflow-hidden rounded-[var(--radius)] border border-border bg-card">
                  {/* 缩略图占位 */}
                  <div className={cx("flex h-32 items-center justify-center bg-gradient-to-br", artifact.gradient)}>
                    <span className="text-5xl">{artifact.icon}</span>
                  </div>
                  {/* 内容 */}
                  <div className="flex flex-1 flex-col p-5">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                        {artifact.type}
                      </span>
                      <span className="inline-flex items-center rounded-full border border-dashed border-border px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                        即将上线
                      </span>
                    </div>
                    <h3 className="mb-1 text-base font-semibold text-foreground">
                      {artifact.title}
                    </h3>
                    <p className="text-sm leading-6 text-muted-foreground">
                      {artifact.desc}
                    </p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </section>

        {/* ===== 功能预告 ===== */}
        <section className="mt-16">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              核心功能预告
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              三大能力让你的创作管理更高效
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {FEATURES.map((feature, idx) => (
              <ScrollReveal key={feature.title} className={`stagger-${idx + 1}`}>
                <GlowCard glow className="h-full p-6">
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-[var(--radius-lg)] bg-gradient-to-br from-accent to-primary/10 text-primary">
                    {feature.icon}
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-foreground">
                    {feature.title}
                  </h3>
                  <p className="text-sm leading-6 text-muted-foreground">
                    {feature.desc}
                  </p>
                </GlowCard>
              </ScrollReveal>
            ))}
          </div>
        </section>

        {/* ===== 底部 CTA ===== */}
        <section className="mt-16">
          <div className="rounded-[var(--radius)] border border-border bg-card p-8 text-center sm:p-12">
            <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              等不及想试试？
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground sm:text-base">
              先去工作台体验 AI 工作流，作品上线后你的创作将自动归集到这里。
            </p>
            <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/workspace"
                className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-primary to-primary-500 px-6 py-3 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-sm)] transition-all duration-200 hover:shadow-[var(--shadow-md)] hover:brightness-110"
              >
                前往工作台
              </Link>
              <Link
                href="/marketplace"
                className="inline-flex items-center justify-center rounded-full border border-border bg-card px-6 py-3 text-sm font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-accent/30"
              >
                浏览工作流市场
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

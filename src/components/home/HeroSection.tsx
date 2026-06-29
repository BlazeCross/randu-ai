"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import NewBadge from "@/components/ui/NewBadge";

// NEW 轮播条：最新上线的能力 / 工作流
const newUpdates = [
  "Seedance 2.0 视频生成已上线",
  "智能体对话支持多轮上下文",
  "图文教程新增 10 篇实战案例",
];

const NEW_INTERVAL = 3000;

// 冷启动引导气泡
interface Suggestion {
  label: string;
  href: string;
}

const suggestions: Suggestion[] = [
  { label: "用AI生成产品宣传视频", href: "/workspace" },
  { label: "一键撰写小红书种草文案", href: "/chat" },
  { label: "智能体帮你写周报", href: "/chat" },
  { label: "生成AI艺术海报", href: "/workspace" },
  { label: "自动翻译多语言文档", href: "/workspace" },
  { label: "创建自定义工作流", href: "/workspace" },
];

export default function HeroSection() {
  const [activeIndex, setActiveIndex] = useState(0);

  // NEW 轮播自动切换
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % newUpdates.length);
    }, NEW_INTERVAL);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 via-background to-background">
      {/* 装饰性背景元素 */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -right-40 -top-40 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -left-20 top-20 h-72 w-72 rounded-full bg-success/10 blur-3xl" />
        <div className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-3xl" />
        {/* 网格纹理 */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 py-16 sm:py-24 lg:px-8 lg:py-32">
        <div className="mx-auto max-w-3xl text-center">
          {/* NEW 标签轮播条 */}
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-4 py-1.5 text-sm backdrop-blur">
            <NewBadge size="sm" />
            <span className="relative h-5 min-w-[200px] overflow-hidden text-left text-muted-foreground sm:min-w-[260px]">
              <span
                key={activeIndex}
                className="block animate-carousel-fade font-medium text-foreground/90"
              >
                {newUpdates[activeIndex]}
              </span>
            </span>
          </div>

          {/* 主标题 */}
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl lg:text-7xl animate-fade-up stagger-2">
            让 AI 工作流
            <br />
            <span className="bg-gradient-to-r from-primary-600 to-success-500 bg-clip-text text-transparent">
              为你的业务提效
            </span>
          </h1>

          {/* 价值主张 */}
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-muted-foreground sm:text-xl animate-fade-up stagger-3">
            百款AI工作流，即开即用，覆盖视频生成、内容创作、数据处理等全场景，
            让AI真正为你的业务创造价值
          </p>

          {/* 行动按钮 */}
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row animate-fade-up stagger-4">
            <Link
              href="/chat"
              className="group inline-flex items-center justify-center rounded-full bg-primary px-8 py-3.5 text-base font-semibold text-primary-foreground transition-all hover:bg-primary-hover animate-pulse-glow"
            >
              立即体验
              <svg
                className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1"
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
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center rounded-full border border-border bg-card px-8 py-3.5 text-base font-semibold text-foreground transition-all hover:border-primary/40 hover:text-primary hover:shadow-[var(--glow-primary-strong)]"
            >
              查看定价
            </Link>
          </div>

          {/* 冷启动引导气泡 */}
          <div className="mx-auto mt-12 max-w-3xl">
            <p className="mb-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              试试这些
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2.5">
              {suggestions.map((s, i) => (
                <Link
                  key={s.label}
                  href={s.href}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/80 px-4 py-2 text-sm text-muted-foreground backdrop-blur transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:bg-accent/40 hover:text-primary hover:shadow-[var(--shadow-sm)] animate-fade-up"
                  style={{ animationDelay: `${250 + i * 50}ms` }}
                >
                  <span className="text-primary" aria-hidden>
                    ✦
                  </span>
                  {s.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

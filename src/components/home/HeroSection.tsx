"use client";

import Link from "next/link";

// 冷启动引导气泡
interface Suggestion {
  label: string;
  href: string;
}

const suggestions: Suggestion[] = [
  { label: "如何用 AI 写爆款文案", href: "/chat" },
  { label: "电商主图一键生成", href: "/workspace" },
  { label: "小红书笔记批量创作", href: "/workspace" },
  { label: "短视频脚本自动化", href: "/workspace" },
  { label: "私域运营日报生成", href: "/chat" },
  { label: "AI 学习路径怎么选", href: "/learn" },
];

export default function HeroSection() {
  const scrollToFeatures = (e: React.MouseEvent) => {
    e.preventDefault();
    const featuresSection = document.getElementById("features");
    if (featuresSection) {
      featuresSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="relative overflow-hidden bg-[var(--color-bg)]">
      {/* 装饰性几何图形 */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* 左上角圆形装饰 */}
        <div className="absolute -left-32 -top-32 h-80 w-80 rounded-full bg-[var(--color-accent)]/5 blur-3xl" />
        {/* 右下角圆形装饰 */}
        <div className="absolute -bottom-40 -right-20 h-96 w-96 rounded-full bg-[var(--color-accent)]/8 blur-3xl" />
        {/* 中央上方椭圆 */}
        <div className="absolute left-1/2 top-0 h-[400px] w-[600px] -translate-x-1/2 rounded-full bg-[var(--color-surface-alt)]/50 blur-3xl" />
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
          {/* 主标题 */}
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl animate-on-scroll">
            AI 学习 + 工作流
            <br />
            <span className="text-[var(--color-accent)]">一站式平台</span>
          </h1>

          {/* 副标题 */}
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-[var(--color-text-muted)] sm:text-xl animate-on-scroll stagger-2">
            零门槛学 AI，用现成工作流提效
          </p>

          {/* 行动按钮 */}
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row animate-on-scroll stagger-3">
            <Link
              href="/login"
              className="group inline-flex items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-accent)] px-8 py-3.5 text-base font-semibold text-white transition-all hover:bg-[var(--color-accent-hover)] hover:shadow-[var(--shadow-md)] w-full sm:w-auto"
            >
              立即开始
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
            <a
              href="#features"
              onClick={scrollToFeatures}
              className="inline-flex items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-8 py-3.5 text-base font-semibold text-[var(--color-text)] transition-all hover:border-[var(--color-accent)]/40 hover:text-[var(--color-accent)] hover:shadow-[var(--shadow-sm)] w-full sm:w-auto"
            >
              了解更多
            </a>
          </div>

          {/* 冷启动引导气泡 */}
          <div className="mx-auto mt-16 max-w-3xl animate-on-scroll stagger-4">
            <p className="mb-4 text-xs font-medium uppercase tracking-wider text-[var(--color-text-light)]">
              试试这些
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2.5">
              {suggestions.map((s, i) => (
                <Link
                  key={s.label}
                  href={s.href}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-sm text-[var(--color-text-muted)] backdrop-blur transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--color-accent)]/40 hover:bg-[var(--color-surface-alt)] hover:text-[var(--color-accent)] hover:shadow-[var(--shadow-sm)]"
                  style={{ transitionDelay: `${i * 50}ms` }}
                >
                  <span className="text-[var(--color-accent)]" aria-hidden>
                    ✦
                  </span>
                  {s.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 底部渐变分隔 */}
      <div className="pointer-events-none h-px bg-gradient-to-r from-transparent via-[var(--color-border)] to-transparent" />
    </section>
  );
}

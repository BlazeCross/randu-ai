"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

// 简单的 className 拼接工具
function cx(...args: Array<string | false | null | undefined>): string {
  return args.filter(Boolean).join(" ");
}

interface Slide {
  id: string;
  badge?: string;
  badgeVariant?: "primary" | "accent" | "success";
  title: string;
  highlight?: string;
  description: string;
  cta: string;
  href: string;
  gradient: string;
}

// 轮播图数据：主推功能 / 新版本 / 新教学 / 重大更新
const slides: Slide[] = [
  {
    id: "platform",
    badge: "AI 工作流服务平台",
    title: "让 AI 工作流",
    highlight: "为你的业务提效",
    description: "百款 AI 工作流，即开即用，覆盖视频生成、内容创作、数据处理等全场景",
    cta: "浏览工作流",
    href: "/workspace",
    gradient: "linear-gradient(135deg, #0065fd 0%, #4d8bff 50%, #e5e9ff 100%)",
  },
  {
    id: "video",
    badge: "新功能",
    badgeVariant: "success",
    title: "Seedance",
    highlight: "AI 视频生成",
    description: "输入文字描述，一键生成高质量视频，支持服装换装、场景变换等多种创意玩法",
    cta: "立即体验",
    href: "/workspace",
    gradient: "linear-gradient(135deg, #0e1115 0%, #1a3a5f 50%, #0065fd 100%)",
  },
  {
    id: "academy",
    badge: "新教学信息",
    badgeVariant: "accent",
    title: "燃渡学院",
    highlight: "系统学习 AI 工作流",
    description: "图文教程 + 视频教程，从入门到精通，掌握每一个 AI 工作流的使用技巧",
    cta: "进入学院",
    href: "/academy",
    gradient: "linear-gradient(135deg, #e5e9ff 0%, #c7d2fe 50%, #0065fd 100%)",
  },
  {
    id: "api",
    badge: "重大更新",
    badgeVariant: "primary",
    title: "API 开放平台",
    highlight: "支持第三方集成",
    description: "提供 RESTful API 与 SDK，Python / Node.js 一行代码调用，轻松接入你的系统",
    cta: "查看文档",
    href: "/dashboard",
    gradient: "linear-gradient(135deg, #00266b 0%, #0065fd 50%, #4d8bff 100%)",
  },
];

const AUTO_PLAY_INTERVAL = 5000;

const BADGE_STYLES: Record<string, string> = {
  primary: "bg-primary text-primary-foreground",
  accent: "bg-accent-foreground text-accent",
  success: "bg-success text-white",
};

/**
 * HeroCarousel 首页轮播图
 *
 * 首页第一个板块，展示主推功能、新版本、新教学信息、重大更新等。
 * - 自动播放（5秒切换），鼠标悬浮暂停
 * - 左右箭头 + 底部圆点导航
 * - 渐变背景 + 内容覆盖层
 * - 点击幻灯片跳转至对应功能页面
 */
export default function HeroCarousel() {
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % slides.length);
  }, []);

  const prev = useCallback(() => {
    setCurrent((prev) => (prev - 1 + slides.length) % slides.length);
  }, []);

  // 自动播放
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(next, AUTO_PLAY_INTERVAL);
    return () => clearInterval(timer);
  }, [isPaused, next]);

  // 键盘导航
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") prev();
    if (e.key === "ArrowRight") next();
  };

  return (
    <section
      className="relative w-full"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      aria-roledescription="carousel"
      aria-label="平台功能轮播"
    >
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative h-[280px] overflow-hidden rounded-[var(--radius-lg)] border border-border sm:h-[360px] lg:h-[440px]">
          {slides.map((slide, index) => (
            <Link
              key={slide.id}
              href={slide.href}
              className={cx(
                "absolute inset-0 block transition-opacity duration-700 ease-in-out",
                index === current
                  ? "z-10 opacity-100"
                  : "z-0 pointer-events-none opacity-0"
              )}
              aria-hidden={index !== current}
              aria-label={`${slide.title} ${slide.highlight ?? ""}`}
            >
              {/* 渐变背景 */}
              <div
                className="absolute inset-0"
                style={{ background: slide.gradient }}
              />
              {/* 装饰性网格纹理 */}
              <div
                className="absolute inset-0 opacity-[0.06]"
                style={{
                  backgroundImage:
                    "linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)",
                  backgroundSize: "48px 48px",
                }}
              />
              {/* 内容 */}
              <div className="relative flex h-full flex-col justify-center px-8 sm:px-12 lg:px-16">
                <div className="max-w-xl">
                  {/* 标签 */}
                  {slide.badge && (
                    <span
                      className={cx(
                        "mb-4 inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold backdrop-blur-sm",
                        BADGE_STYLES[slide.badgeVariant ?? "primary"]
                      )}
                    >
                      {slide.badge}
                    </span>
                  )}
                  {/* 标题 */}
                  <h2 className="text-2xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
                    {slide.title}
                    {slide.highlight && (
                      <>
                        <br />
                        <span className="bg-white/20 px-2 py-0.5 backdrop-blur-sm">
                          {slide.highlight}
                        </span>
                      </>
                    )}
                  </h2>
                  {/* 描述 */}
                  <p className="mt-4 max-w-lg text-sm text-white/80 sm:text-base lg:text-lg">
                    {slide.description}
                  </p>
                  {/* CTA 按钮 */}
                  <span className="mt-6 inline-flex items-center gap-2 rounded-full bg-white/95 px-5 py-2.5 text-sm font-medium text-foreground shadow-lg transition-transform hover:scale-105 sm:text-base">
                    {slide.cta}
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </span>
                </div>
              </div>
            </Link>
          ))}

          {/* 左箭头 */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              prev();
            }}
            className="absolute left-3 top-1/2 z-20 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-white/20 text-white backdrop-blur-sm transition-all hover:bg-white/30"
            aria-label="上一张"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>

          {/* 右箭头 */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              next();
            }}
            className="absolute right-3 top-1/2 z-20 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-white/20 text-white backdrop-blur-sm transition-all hover:bg-white/30"
            aria-label="下一张"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>

          {/* 底部圆点导航 */}
          <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 gap-2">
            {slides.map((slide, index) => (
              <button
                key={slide.id}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setCurrent(index);
                }}
                className={cx(
                  "h-2 rounded-full transition-all duration-300",
                  index === current
                    ? "w-6 bg-white"
                    : "w-2 bg-white/40 hover:bg-white/70"
                )}
                aria-label={`第 ${index + 1} 张`}
                aria-current={index === current}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

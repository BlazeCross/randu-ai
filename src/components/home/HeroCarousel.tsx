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
  cta?: string;
  href: string;
  gradient: string;
  image?: string | null;
}

// /api/carousel 返回的轮播项
interface CarouselSlideApi {
  id: string;
  title: string;
  description: string | null;
  image: string;
  link: string | null;
  badge: string | null;
  sortOrder: number;
}

interface CarouselResponse {
  slides: CarouselSlideApi[];
}

// 默认轮播图数据（API 失败或返回空时回退使用）
const DEFAULT_SLIDES: Slide[] = [
  {
    id: "platform",
    badge: "AI 工作流服务平台",
    title: "让 AI 工作流",
    highlight: "为你的业务提效",
    description: "百款 AI 工作流，即开即用，覆盖视频生成、内容创作、数据处理等全场景",
    cta: "浏览工作流",
    href: "/workspace",
    gradient: "radial-gradient(ellipse at 30% 50%, #0065fd 0%, #00266b 60%, #0e1115 100%)",
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
    gradient: "radial-gradient(ellipse at 30% 50%, #0065fd 0%, #00266b 60%, #0e1115 100%)",
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
    gradient: "radial-gradient(ellipse at 30% 50%, #0065fd 0%, #00266b 60%, #0e1115 100%)",
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
    gradient: "radial-gradient(ellipse at 30% 50%, #0065fd 0%, #00266b 60%, #0e1115 100%)",
  },
];

// 默认渐变（API 数据未提供 image 时使用）
const DEFAULT_GRADIENT =
  "radial-gradient(ellipse at 30% 50%, #0065fd 0%, #00266b 60%, #0e1115 100%)";

const AUTO_PLAY_INTERVAL = 5000;

const BADGE_STYLES: Record<string, string> = {
  primary: "bg-primary text-primary-foreground",
  accent: "bg-accent-foreground text-accent",
  success: "bg-success text-white",
};

/**
 * 将 API 返回的轮播项映射为内部 Slide 结构
 */
function mapApiSlide(s: CarouselSlideApi): Slide {
  return {
    id: s.id,
    title: s.title,
    description: s.description ?? "",
    href: s.link || "#",
    badge: s.badge ?? undefined,
    gradient: DEFAULT_GRADIENT,
    image: s.image || null,
    cta: "了解更多",
  };
}

/**
 * HeroCarousel 首页轮播图
 *
 * 数据来源：GET /api/carousel（公开接口）
 * - 接口返回空数组或 fetch 失败时，回退到 DEFAULT_SLIDES
 * - API 返回数据时，用 image 字段作为背景（无 image 则用默认渐变）
 * - 自动播放（5秒切换），鼠标悬浮暂停
 * - 左右箭头 + 底部圆点导航
 */
export default function HeroCarousel() {
  // 初始使用默认数据，避免首屏空白；fetch 完成后替换为 API 数据
  const [slides, setSlides] = useState<Slide[]>(DEFAULT_SLIDES);
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // 数据拉取：仅在挂载时请求一次
  useEffect(() => {
    let cancelled = false;
    fetch("/api/carousel", { cache: "no-store" })
      .then((res) => {
        if (!res.ok) throw new Error("获取轮播图失败");
        return res.json();
      })
      .then((data: CarouselResponse) => {
        if (cancelled) return;
        const apiSlides = data.slides || [];
        // 仅在 API 返回非空数据时替换；否则保留默认数据
        if (apiSlides.length > 0) {
          setSlides(apiSlides.map(mapApiSlide));
          setCurrent(0);
        }
      })
      .catch(() => {
        // fetch 失败：静默回退到默认数据（已是初始值，无需操作）
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  const prev = useCallback(() => {
    setCurrent((prev) => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

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
      <div className="relative w-full">
        <div className="relative h-[320px] overflow-hidden border-b border-border shadow-[var(--shadow-lg)] sm:h-[420px] lg:h-[500px]">
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
              {/* 背景：优先使用 API 返回的 image，否则使用渐变 */}
              {slide.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={slide.image}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover"
                />
              ) : (
                <div
                  className="absolute inset-0"
                  style={{ background: slide.gradient }}
                />
              )}
              {/* 暗色遮罩（保证文字可读性，无论背景是图片还是渐变） */}
              <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-black/20" />
              {/* 装饰性网格纹理 */}
              <div
                className="absolute inset-0 opacity-[0.06]"
                style={{
                  backgroundImage:
                    "linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)",
                  backgroundSize: "48px 48px",
                }}
              />
              {/* 粒子装饰 */}
              <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute right-[15%] top-[20%] h-1.5 w-1.5 rounded-full bg-white/30 animate-pulse" />
                <div className="absolute right-[35%] top-[60%] h-1 w-1 rounded-full bg-white/20 animate-pulse [animation-delay:500ms]" />
                <div className="absolute right-[55%] top-[30%] h-2 w-2 rounded-full bg-white/15 animate-pulse [animation-delay:1000ms]" />
                <div className="absolute right-[75%] top-[70%] h-1 w-1 rounded-full bg-white/25 animate-pulse [animation-delay:1500ms]" />
                <div className="absolute right-[25%] top-[45%] h-1.5 w-1.5 rounded-full bg-white/10 animate-pulse [animation-delay:2000ms]" />
              </div>
              {/* 内容 */}
              <div className="relative flex h-full flex-col justify-center">
                <div className="mx-auto w-full max-w-[1600px] px-6 sm:px-12 lg:px-16">
                  <div className="max-w-xl">
                  {/* 标签 */}
                  {slide.badge && (
                    <span
                      className={cx(
                        "mb-4 inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold backdrop-blur-sm animate-fade-up stagger-1",
                        BADGE_STYLES[slide.badgeVariant ?? "primary"]
                      )}
                    >
                      {slide.badge}
                    </span>
                  )}
                  {/* 标题 */}
                  <h2 className="text-2xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl animate-fade-up stagger-2">
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
                  {slide.description && (
                    <p className="mt-4 max-w-lg text-sm text-white/80 sm:text-base lg:text-lg animate-fade-up stagger-3">
                      {slide.description}
                    </p>
                  )}
                  {/* CTA 按钮 */}
                  {slide.cta && (
                    <span className="mt-6 inline-flex items-center gap-2 rounded-full bg-white/95 backdrop-blur-sm shadow-[var(--shadow-md)] px-5 py-2.5 text-sm font-medium text-foreground transition-all duration-200 hover:scale-105 hover:shadow-[var(--shadow-lg)] sm:text-base animate-fade-up stagger-4">
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
                  )}
                </div>
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
            className="absolute left-3 top-1/2 z-20 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-white/20 bg-white/20 text-white backdrop-blur-sm transition-all hover:bg-white/25 hover:border-white/30 hover:scale-110"
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
            className="absolute right-3 top-1/2 z-20 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-white/20 bg-white/20 text-white backdrop-blur-sm transition-all hover:bg-white/25 hover:border-white/30 hover:scale-110"
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
                    ? "w-6 bg-white shadow-[0_0_8px_rgba(255,255,255,0.5)]"
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

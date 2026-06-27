"use client";

import { useState, useEffect, useCallback } from "react";

const slides = [
  {
    title: "新用户7天免费试用",
    description: "注册即享全部工作流7天免费体验，无门槛开启AI提效之旅",
    badge: "限时活动",
    gradient: "from-primary-600 to-primary-800",
    badgeBg: "bg-success-400",
    badgeText: "text-primary-900",
  },
  {
    title: "百款工作流持续更新",
    description: "每周新增精选工作流，紧跟AI前沿，让你的能力持续进化",
    badge: "持续更新",
    gradient: "from-success-500 to-success-700",
    badgeBg: "bg-card",
    badgeText: "text-success-700",
  },
  {
    title: "B端专属解决方案",
    description: "企业级定制服务，专属工作流、私有化部署、一对一技术支持",
    badge: "企业服务",
    gradient: "from-neutral-800 to-neutral-900",
    badgeBg: "bg-primary-500",
    badgeText: "text-white",
  },
];

export default function AdBanner() {
  const [current, setCurrent] = useState(0);

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % slides.length);
  }, []);

  const prev = useCallback(() => {
    setCurrent((prev) => (prev - 1 + slides.length) % slides.length);
  }, []);

  const goTo = useCallback((index: number) => {
    setCurrent(index);
  }, []);

  useEffect(() => {
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [next]);

  return (
    <section className="bg-background py-10 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl shadow-xl shadow-neutral-900/5">
          {/* 轮播容器 */}
          <div className="relative h-64 sm:h-72 lg:h-80">
            {slides.map((slide, index) => (
              <div
                key={index}
                className={`absolute inset-0 bg-gradient-to-br ${slide.gradient} transition-opacity duration-700 ${
                  index === current ? "opacity-100" : "pointer-events-none opacity-0"
                }`}
              >
                {/* 装饰元素 */}
                <div className="pointer-events-none absolute inset-0 overflow-hidden">
                  <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-card/10 blur-2xl" />
                  <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-card/10 blur-2xl" />
                  <div className="absolute right-1/4 top-1/2 h-32 w-32 rounded-full bg-card/5 blur-xl" />
                </div>

                {/* 内容 */}
                <div className="relative flex h-full flex-col items-center justify-center px-6 text-center sm:px-8">
                  <span
                    className={`mb-3 inline-flex items-center rounded-full ${slide.badgeBg} px-4 py-1.5 text-xs font-semibold sm:text-sm ${slide.badgeText} backdrop-blur`}
                  >
                    {slide.badge}
                  </span>
                  <h3 className="mb-2 text-xl font-bold text-white sm:mb-3 sm:text-2xl lg:text-3xl">
                    {slide.title}
                  </h3>
                  <p className="max-w-xl text-sm text-white/80 sm:text-base lg:text-lg">
                    {slide.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* 左箭头 */}
          <button
            type="button"
            onClick={prev}
            className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-card/20 p-2.5 text-white backdrop-blur transition-colors hover:bg-card/40 sm:left-4"
            aria-label="上一个"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>

          {/* 右箭头 */}
          <button
            type="button"
            onClick={next}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-card/20 p-2.5 text-white backdrop-blur transition-colors hover:bg-card/40 sm:right-4"
            aria-label="下一个"
          >
            <svg
              className="h-5 w-5"
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
          </button>

          {/* 指示点 */}
          <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
            {slides.map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => goTo(index)}
                className={`h-2 rounded-full transition-all ${
                  index === current ? "w-8 bg-card" : "w-2 bg-card/50"
                }`}
                aria-label={`切换到第 ${index + 1} 个广告`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

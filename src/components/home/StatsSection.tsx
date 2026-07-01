"use client";

import { useEffect, useState } from "react";
import { useScrollReveal } from "@/hooks/useScrollReveal";

interface Stat {
  value: number;
  suffix: string;
  label: string;
}

const stats: Stat[] = [
  { value: 10000, suffix: "+", label: "服务学员" },
  { value: 500, suffix: "+", label: "精选工作流" },
  { value: 98, suffix: "%", label: "满意度" },
  { value: 50000, suffix: "+", label: "累计生成" },
];

const DURATION = 1600;

/**
 * 单个数字增长组件
 * 当 active 为 true 时，从 0 增长到 target，使用 ease-out 缓动
 */
function CountUp({
  target,
  suffix,
  active,
}: {
  target: number;
  suffix: string;
  active: boolean;
}) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!active) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - start) / DURATION, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.floor(eased * target));
      if (progress < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        setValue(target);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, target]);

  return (
    <>
      {value.toLocaleString()}
      {suffix}
    </>
  );
}

/**
 * 数据大字号展示区
 * 4 个核心指标，滚动进入视口时数字增长动画
 */
export default function StatsSection() {
  const { ref, isVisible } = useScrollReveal({ threshold: 0.2 });

  return (
    <section className="relative overflow-hidden border-y border-border bg-background py-16 sm:py-24">
      {/* 装饰性背景光晕 - 琥珀色 */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-0 h-72 w-[640px] -translate-x-1/2 rounded-full bg-accent/5 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-[1600px] px-6 lg:px-8">
        {/* 标题区 */}
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold uppercase tracking-wider text-primary">
            数据见证
          </span>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-4xl">
            被众多创作者信赖
          </h2>
          <span
            className="mt-2 block h-1 w-16 rounded-full bg-accent mx-auto"
            aria-hidden
          />
        </div>

        {/* 数据网格 */}
        <div
          ref={ref}
          className="mx-auto mt-12 grid max-w-5xl grid-cols-2 gap-8 sm:mt-16 lg:grid-cols-4"
        >
          {stats.map((stat, index) => (
            <div
              key={stat.label}
              className={`text-center ${
                isVisible
                  ? `animate-count-up stagger-${index + 1}`
                  : "opacity-0"
              }`}
            >
              <div className="text-5xl font-bold tracking-tight text-accent sm:text-6xl">
                <CountUp
                  target={stat.value}
                  suffix={stat.suffix}
                  active={isVisible}
                />
              </div>
              <div className="mt-3 text-sm font-medium text-muted-foreground sm:text-base">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

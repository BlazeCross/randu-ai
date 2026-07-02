"use client";

import { useEffect, useRef, useState } from "react";

const stats = [
  { value: 12847, suffix: "+", label: "已服务学员" },
  { value: 600, suffix: "+", label: "精选工作流" },
  { value: 98, suffix: "%", label: "满意度" },
  { value: 50000, suffix: "+", label: "累计生成" },
];

function useCountUp(target: number, duration: number = 2000) {
  const [count, setCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasStarted) {
          setHasStarted(true);
        }
      },
      { threshold: 0.5 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [hasStarted]);

  useEffect(() => {
    if (!hasStarted) return;

    const step = target / (duration / 16);
    let current = 0;
    const timer = setInterval(() => {
      current += step;
      if (current >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [hasStarted, target, duration]);

  return { count, ref };
}

function StatItem({ value, suffix, label }: typeof stats[0]) {
  const { count, ref } = useCountUp(value);

  return (
    <div ref={ref} className="text-center">
      <div className="text-5xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500">
        {count.toLocaleString()}{suffix}
      </div>
      <div className="mt-2 text-gray-500 text-lg">{label}</div>
    </div>
  );
}

function StatsSection() {
  return (
    <section className="py-24 bg-white relative overflow-hidden">
      {/* 几何装饰 */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-indigo-100 rounded-full opacity-50 blur-3xl" />
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-purple-100 rounded-full opacity-50 blur-3xl" />
      
      <div className="relative max-w-5xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat) => (
            <StatItem key={stat.label} {...stat} />
          ))}
        </div>
      </div>
    </section>
  );
}

export default StatsSection;

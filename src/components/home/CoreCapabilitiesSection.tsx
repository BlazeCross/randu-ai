"use client";

import { useEffect, useRef, useState } from "react";

const capabilities = [
  {
    icon: "💬",
    title: "AI对话",
    description: "智能问答，多轮对话，理解上下文",
    gradient: "from-blue-400 to-indigo-500",
    href: "/workspace",
  },
  {
    icon: "🎬",
    title: "视频生成",
    description: "文生视频，创意无限，分钟级产出",
    gradient: "from-purple-400 to-pink-500",
    href: "/workspace",
  },
  {
    icon: "🖼️",
    title: "图片生成",
    description: "文生图，图生图，创意可视化",
    gradient: "from-amber-400 to-orange-500",
    href: "/workspace",
  },
  {
    icon: "⚡",
    title: "工作流",
    description: "自动化效率提升，一键搞定复杂任务",
    gradient: "from-emerald-400 to-teal-500",
    href: "/marketplace",
  },
];

function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return { ref, visible };
}

function CapabilityCard({ capability, index }: { capability: typeof capabilities[0]; index: number }) {
  const { ref, visible } = useScrollReveal();

  return (
    <div
      ref={ref}
      className={`group relative p-8 bg-white rounded-2xl border border-gray-100 hover:border-indigo-200 hover:-translate-y-1 hover:shadow-xl transition-all duration-300 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      <a href={capability.href} className="block">
        {/* 图标背景 */}
        <div className={`w-16 h-16 bg-gradient-to-br ${capability.gradient} rounded-2xl flex items-center justify-center text-3xl mb-6 shadow-lg`}>
          {capability.icon}
        </div>
        
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          {capability.title}
        </h3>
        
        <p className="text-gray-500">
          {capability.description}
        </p>
        
        <div className="mt-4 text-indigo-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
          立即体验 →
        </div>
      </a>
    </div>
  );
}

export function CoreCapabilitiesSection() {
  return (
    <section className="py-24 bg-gray-50" id="features">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
            核心能力
          </h2>
          <p className="mt-4 text-lg text-gray-500">
            四大能力，满足你的所有AI需求
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {capabilities.map((capability, index) => (
            <CapabilityCard 
              key={capability.title} 
              capability={capability} 
              index={index}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

"use client";

import { useScrollReveal } from "@/hooks/useScrollReveal";

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  animation?: "fade" | "slide" | "zoom";
  delay?: number;
}

// 动画变体类名映射
const ANIMATION_VARIANTS = {
  fade: "animate-fade-in",
  slide: "animate-fade-up",
  zoom: "animate-zoom-in",
};

export default function ScrollReveal({
  children,
  className = "",
  animation = "fade",
  delay = 0,
}: ScrollRevealProps) {
  const { ref, isVisible } = useScrollReveal();
  const animationClass = isVisible ? ANIMATION_VARIANTS[animation] : "opacity-0";
  const delayStyle = delay > 0 ? { animationDelay: `${delay}ms` } : {};

  return (
    <div
      ref={ref}
      className={`${className} ${animationClass}`}
      style={delayStyle}
    >
      {children}
    </div>
  );
}

"use client";

import { useScrollReveal } from "@/hooks/useScrollReveal";

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  animation?: string;
}

export default function ScrollReveal({
  children,
  className = "",
  animation = "animate-fade-up",
}: ScrollRevealProps) {
  const { ref, isVisible } = useScrollReveal();
  return (
    <div
      ref={ref}
      className={`${className} ${isVisible ? animation : "opacity-0"}`}
    >
      {children}
    </div>
  );
}

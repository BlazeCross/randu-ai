"use client";

import { useState } from "react";

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQAccordionProps {
  items: FAQItem[];
}

/**
 * FAQ 可折叠手风琴（客户端组件）
 * - 默认展开第一项
 * - 单项可独立切换
 * - 键盘可达：button 元素 + aria-expanded
 */
export default function FAQAccordion({ items }: FAQAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="divide-y divide-border overflow-hidden rounded-[var(--radius)] border border-border bg-card">
      {items.map((item, index) => {
        const isOpen = openIndex === index;
        return (
          <div key={item.question}>
            <button
              type="button"
              onClick={() => setOpenIndex(isOpen ? null : index)}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-muted/50 sm:px-6 sm:py-5"
            >
              <span className="text-sm font-semibold text-foreground sm:text-base">
                {item.question}
              </span>
              <svg
                className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200 ${
                  isOpen ? "rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
            {isOpen && (
              <div className="animate-fade-in px-5 pb-5 text-sm leading-7 text-muted-foreground sm:px-6 sm:pb-6 sm:text-[15px]">
                {item.answer}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

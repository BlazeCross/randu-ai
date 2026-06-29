"use client";

import { useState } from "react";
import Link from "next/link";
import GlowCard from "@/components/ui/GlowCard";
import { cx } from "@/lib/cn";

// 单价常量
const PRICE_PER_CHAT = 0.004; // 豆包Pro-32K 估算
const PRICE_PER_IMAGE = 0.04; // Seedream 估算
const PRICE_PER_VIDEO = 1.0; // Seedance 估算

// 滑块配置
interface SliderConfig {
  key: "chat" | "image" | "video";
  label: string;
  min: number;
  max: number;
  step: number;
  unit: string;
  unitPrice: number;
  hint: string;
}

const SLIDERS: SliderConfig[] = [
  {
    key: "chat",
    label: "每月对话次数",
    min: 0,
    max: 1000,
    step: 10,
    unit: "次",
    unitPrice: PRICE_PER_CHAT,
    hint: "豆包 Pro-32K 估算",
  },
  {
    key: "image",
    label: "每月生图次数",
    min: 0,
    max: 500,
    step: 5,
    unit: "次",
    unitPrice: PRICE_PER_IMAGE,
    hint: "Seedream 估算",
  },
  {
    key: "video",
    label: "每月视频生成次数",
    min: 0,
    max: 100,
    step: 1,
    unit: "次",
    unitPrice: PRICE_PER_VIDEO,
    hint: "Seedance 估算",
  },
];

// 根据月费推荐套餐
function getRecommendedPlan(monthlyCost: number): {
  name: string;
  desc: string;
} {
  if (monthlyCost < 30) {
    return {
      name: "基础版",
      desc: "适合轻度使用的个人用户",
    };
  }
  if (monthlyCost <= 100) {
    return {
      name: "专业版",
      desc: "适合有一定创作需求的专业用户",
    };
  }
  return {
    name: "旗舰版",
    desc: "适合高频使用的重度创作者与团队",
  };
}

// 格式化金额（保留 2 位小数，去除多余的 .00）
function formatYuan(value: number): string {
  return value.toFixed(2).replace(/\.00$/, "");
}

interface PriceCalculatorProps {
  /** 推荐套餐订阅按钮的锚点（默认 "#plans"） */
  plansAnchor?: string;
}

/**
 * 价格计算器组件
 *
 * 根据用户预估的每月对话、生图、视频生成次数，
 * 实时计算预估月费并推荐合适的订阅套餐。
 */
export default function PriceCalculator({
  plansAnchor = "#plans",
}: PriceCalculatorProps) {
  const [chat, setChat] = useState(100);
  const [image, setImage] = useState(20);
  const [video, setVideo] = useState(5);

  const values = { chat, image, video };

  // 各项成本
  const chatCost = chat * PRICE_PER_CHAT;
  const imageCost = image * PRICE_PER_IMAGE;
  const videoCost = video * PRICE_PER_VIDEO;
  const totalCost = chatCost + imageCost + videoCost;

  const recommended = getRecommendedPlan(totalCost);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8">
      {/* 左侧：滑块输入区 */}
      <div className="space-y-7">
        {SLIDERS.map((slider) => {
          const value = values[slider.key];
          const cost = value * slider.unitPrice;
          return (
            <div key={slider.key}>
              <div className="mb-2 flex items-baseline justify-between gap-2">
                <label
                  htmlFor={`slider-${slider.key}`}
                  className="text-sm font-medium text-foreground"
                >
                  {slider.label}
                </label>
                <span className="text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">
                    {value}
                  </span>
                  {slider.unit}
                  <span className="ml-1.5 text-xs">
                    ≈ ¥{formatYuan(cost)}
                  </span>
                </span>
              </div>
              <input
                id={`slider-${slider.key}`}
                type="range"
                min={slider.min}
                max={slider.max}
                step={slider.step}
                value={value}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  if (slider.key === "chat") setChat(v);
                  else if (slider.key === "image") setImage(v);
                  else setVideo(v);
                }}
                className="h-2 w-full cursor-pointer appearance-none rounded-full bg-muted"
                style={{ accentColor: "var(--primary)" }}
              />
              <div className="mt-1.5 flex items-center justify-between text-xs text-muted-foreground/70">
                <span>{slider.min}{slider.unit}</span>
                <span>{slider.hint}</span>
                <span>{slider.max}{slider.unit}</span>
              </div>
            </div>
          );
        })}

        {/* 成本明细 */}
        <div className="rounded-[var(--radius-sm)] border border-border bg-muted/40 p-4">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            成本明细
          </div>
          <dl className="space-y-1.5 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">对话成本</dt>
              <dd className="font-medium text-foreground">¥{formatYuan(chatCost)}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">生图成本</dt>
              <dd className="font-medium text-foreground">¥{formatYuan(imageCost)}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">视频成本</dt>
              <dd className="font-medium text-foreground">¥{formatYuan(videoCost)}</dd>
            </div>
          </dl>
        </div>
      </div>

      {/* 右侧：结果展示（GlowCard 包裹） */}
      <GlowCard glow className="flex flex-col justify-center p-8">
        <div className="text-center">
          <span className="inline-flex items-center rounded-full bg-accent px-3 py-1 text-xs font-semibold uppercase tracking-wider text-accent-foreground">
            预估月费
          </span>
          <div className="mt-4 flex items-baseline justify-center gap-1">
            <span className="text-2xl font-bold text-muted-foreground">¥</span>
            <span
              className="text-3xl font-bold sm:text-4xl"
              style={{ color: "var(--primary)" }}
            >
              {formatYuan(totalCost)}
            </span>
            <span className="text-sm text-muted-foreground">/月</span>
          </div>

          {/* 推荐套餐 */}
          <div className="mt-6 rounded-[var(--radius-sm)] border border-primary/20 bg-primary/5 p-4">
            <p className="text-xs text-muted-foreground">推荐套餐</p>
            <p className="mt-1 text-xl font-bold text-foreground">
              {recommended.name}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {recommended.desc}
            </p>
          </div>

          {/* 跳转订阅按钮 */}
          <Link
            href={plansAnchor}
            className={cx(
              "mt-6 inline-flex w-full items-center justify-center rounded-full",
              "bg-gradient-to-r from-primary to-primary-500 px-6 py-3",
              "text-sm font-semibold text-primary-foreground shadow-[var(--shadow-sm)]",
              "transition-all duration-200 hover:shadow-[var(--shadow-md)] hover:brightness-110",
            )}
          >
            查看订阅方案
          </Link>
          <p className="mt-3 text-xs text-muted-foreground">
            实际费用以订阅套餐为准，计算结果仅供参考
          </p>
        </div>
      </GlowCard>
    </div>
  );
}

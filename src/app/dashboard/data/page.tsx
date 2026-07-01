"use client";

import { useState } from "react";
import { useTrackPageView } from "@/hooks/useTrack";

// TODO: 后续接入真实使用数据
const weeklyUsageData = [120, 200, 150, 300, 250, 180, 220]; // 周一~周日使用次数
const featureRanking = [
  { name: "AI 对话", count: 320 },
  { name: "图片生成", count: 156 },
  { name: "视频生成", count: 89 },
  { name: "文案创作", count: 67 },
  { name: "语音合成", count: 45 },
];
const timeSlotDistribution = [
  { slot: "上午 (6-12点)", percent: 35 },
  { slot: "下午 (12-18点)", percent: 40 },
  { slot: "晚上 (18-24点)", percent: 25 },
];

const days = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];

// Tab 类型
type TabType = "overview" | "conversations" | "workflows";

export default function DataCenterPage() {
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  useTrackPageView("dashboard-data");

  const maxUsage = Math.max(...weeklyUsageData);

  return (
    <main className="flex-1 bg-[#FAF7F2]">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {/* 页面标题 */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">使用数据中心</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            查看你的使用统计数据和分析
          </p>
        </div>

        {/* Tab 导航 */}
        <div className="mb-6 flex gap-1 rounded-lg bg-[#f0ebe3] p-1">
          {[
            { id: "overview", label: "概览" },
            { id: "conversations", label: "对话记录" },
            { id: "workflows", label: "工作流使用" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex-1 rounded-md px-4 py-2.5 text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-white text-[#E67E22] shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab 内容 */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* 本周使用趋势柱状图 */}
            <div className="rounded-xl border border-border bg-white p-6">
              <h2 className="mb-4 text-base font-semibold text-foreground">
                本周使用趋势
              </h2>
              <div className="flex items-end justify-between gap-2 h-48">
                {weeklyUsageData.map((value, index) => {
                  const heightPercent = (value / maxUsage) * 100;
                  return (
                    <div key={index} className="flex flex-1 flex-col items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {value}
                      </span>
                      <div
                        className="w-full max-w-12 rounded-t-md bg-[#E67E22] transition-all hover:bg-[#d4721e]"
                        style={{ height: `${heightPercent}%` }}
                      />
                      <span className="text-xs text-muted-foreground">
                        {days[index]}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 功能热度排行 TOP 5 */}
            <div className="rounded-xl border border-border bg-white p-6">
              <h2 className="mb-4 text-base font-semibold text-foreground">
                功能热度排行 TOP 5
              </h2>
              <div className="space-y-3">
                {featureRanking.map((item, index) => (
                  <div key={item.name} className="flex items-center gap-3">
                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                        index < 3
                          ? "bg-[#E67E22] text-white"
                          : "bg-[#f0ebe3] text-muted-foreground"
                      }`}
                    >
                      {index + 1}
                    </span>
                    <span className="flex-1 text-sm text-foreground">
                      {item.name}
                    </span>
                    <span className="text-sm font-medium text-[#E67E22]">
                      {item.count} 次
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* 使用时段分布 */}
            <div className="rounded-xl border border-border bg-white p-6">
              <h2 className="mb-4 text-base font-semibold text-foreground">
                使用时段分布
              </h2>
              <div className="space-y-4">
                {timeSlotDistribution.map((item) => (
                  <div key={item.slot} className="space-y-1.5">
                    <div className="flex justify-between text-sm">
                      <span className="text-foreground">{item.slot}</span>
                      <span className="text-muted-foreground">
                        {item.percent}%
                      </span>
                    </div>
                    <div className="h-2.5 w-full rounded-full bg-[#f0ebe3]">
                      <div
                        className="h-full rounded-full bg-[#E67E22] transition-all"
                        style={{ width: `${item.percent}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "conversations" && (
          <div className="rounded-xl border border-border bg-white p-12 text-center">
            <div className="mb-4 flex justify-center">
              <svg
                className="h-12 w-12 text-muted-foreground"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            </div>
            <p className="text-muted-foreground">对话记录统计开发中...</p>
            <p className="mt-1 text-xs text-muted-foreground">
              // TODO: 后续接入真实对话数据
            </p>
          </div>
        )}

        {activeTab === "workflows" && (
          <div className="rounded-xl border border-border bg-white p-12 text-center">
            <div className="mb-4 flex justify-center">
              <svg
                className="h-12 w-12 text-muted-foreground"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"
                />
              </svg>
            </div>
            <p className="text-muted-foreground">工作流使用统计开发中...</p>
            <p className="mt-1 text-xs text-muted-foreground">
              // TODO: 后续接入真实工作流数据
            </p>
          </div>
        )}
      </div>
    </main>
  );
}

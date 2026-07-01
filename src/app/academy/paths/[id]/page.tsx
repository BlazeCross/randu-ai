"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

/* ============================================================
 * 预设学习路径数据（与 paths/page.tsx 保持同步）
 * ============================================================ */
interface TutorialItem {
  id: string;
  title: string;
  duration: string;
  status: "not_started" | "completed";
}

interface LearningPathData {
  id: string;
  title: string;
  goal: string;
  duration: number;
  tutorialCount: number;
  tags: string[];
  tutorials: TutorialItem[];
}

const learningPathsData: Record<string, LearningPathData> = {
  "ecommerce-ai-7days": {
    id: "ecommerce-ai-7days",
    title: "电商 AI 7 天入门",
    goal: "零基础电商人 7 天掌握 AI 作图、写文案、运营技巧",
    duration: 7,
    tutorialCount: 12,
    tags: ["电商", "零基础"],
    tutorials: [
      { id: "t1", title: "AI 作图基础：Seedream 文生图入门", duration: "20 分钟", status: "not_started" },
      { id: "t2", title: "电商主图设计：5 分钟生成一张", duration: "25 分钟", status: "not_started" },
      { id: "t3", title: "批量出图工作流：一次生成 10 张主图", duration: "30 分钟", status: "not_started" },
      { id: "t4", title: "AI 文案入门：豆包帮你写商品描述", duration: "20 分钟", status: "not_started" },
      { id: "t5", title: "小红书种草文案：批量生产技巧", duration: "25 分钟", status: "not_started" },
      { id: "t6", title: "抖音短视频脚本：AI 帮你写", duration: "20 分钟", status: "not_started" },
      { id: "t7", title: "首尾帧设计：让视频更专业", duration: "30 分钟", status: "not_started" },
      { id: "t8", title: "Seedance 视频生成实战", duration: "35 分钟", status: "not_started" },
      { id: "t9", title: "电商自动化运营工作流搭建", duration: "40 分钟", status: "not_started" },
      { id: "t10", title: "AI 客服回复：提升响应效率", duration: "25 分钟", status: "not_started" },
      { id: "t11", title: "数据分析：AI 帮你看生意参谋", duration: "30 分钟", status: "not_started" },
      { id: "t12", title: "实战项目：完成你的第一套 AI 电商物料", duration: "60 分钟", status: "not_started" },
    ],
  },
  "new-media-content": {
    id: "new-media-content",
    title: "新媒体内容创作之路",
    goal: "从小红书到抖音，AI 助力内容批量生产",
    duration: 14,
    tutorialCount: 20,
    tags: ["新媒体", "内容创作"],
    tutorials: [
      { id: "t1", title: "内容创作效率革命：AI 能帮你做什么", duration: "15 分钟", status: "not_started" },
      { id: "t2", title: "豆包文案入门：提示词基础", duration: "20 分钟", status: "not_started" },
      { id: "t3", title: "小红书爆款标题：AI 生成技巧", duration: "25 分钟", status: "not_started" },
      { id: "t4", title: "小红书正文：种草文案这样写", duration: "30 分钟", status: "not_started" },
      { id: "t5", title: "公众号文章：AI 辅助写作工作流", duration: "25 分钟", status: "not_started" },
      { id: "t6", title: "抖音脚本：开头 3 秒抓眼球", duration: "30 分钟", status: "not_started" },
      { id: "t7", title: "短视频口播稿：AI 帮你改写", duration: "20 分钟", status: "not_started" },
      { id: "t8", title: "Seedream 配图：让你的内容更吸睛", duration: "25 分钟", status: "not_started" },
      { id: "t9", title: "批量图片素材：一次生成一周量", duration: "30 分钟", status: "not_started" },
      { id: "t10", title: "首尾帧设计：提升视频专业感", duration: "25 分钟", status: "not_started" },
      { id: "t11", title: "Seedance 视频生成：文案转视频", duration: "35 分钟", status: "not_started" },
      { id: "t12", title: "多平台内容分发：一次创作多次发布", duration: "30 分钟", status: "not_started" },
      { id: "t13", title: "内容排期规划：AI 帮你做日程", duration: "20 分钟", status: "not_started" },
      { id: "t14", title: "粉丝互动回复：AI 提升效率", duration: "25 分钟", status: "not_started" },
      { id: "t15", title: "数据复盘：AI 分析内容表现", duration: "30 分钟", status: "not_started" },
      { id: "t16", title: "建立内容素材库：AI 帮你整理", duration: "25 分钟", status: "not_started" },
      { id: "t17", title: "打造人设 IP：AI 辅助定位", duration: "30 分钟", status: "not_started" },
      { id: "t18", title: "变现路径设计：AI 帮你规划", duration: "25 分钟", status: "not_started" },
      { id: "t19", title: "团队协作：内容生产流水线", duration: "35 分钟", status: "not_started" },
      { id: "t20", title: "实战项目：完成你的月度内容计划", duration: "60 分钟", status: "not_started" },
    ],
  },
  "agent-development": {
    id: "agent-development",
    title: "智能体开发入门",
    goal: "用扣子/Coze 零代码搭建 AI 应用",
    duration: 10,
    tutorialCount: 15,
    tags: ["开发", "智能体"],
    tutorials: [
      { id: "t1", title: "Coze 平台入门：了解扣子工作流", duration: "20 分钟", status: "not_started" },
      { id: "t2", title: "第一个工作流：Hello World", duration: "25 分钟", status: "not_started" },
      { id: "t3", title: "大模型节点：让 AI 做决策", duration: "30 分钟", status: "not_started" },
      { id: "t4", title: "插件调用：扩展工作流能力", duration: "35 分钟", status: "not_started" },
      { id: "t5", title: "知识库入门：让 AI 学会新知识", duration: "30 分钟", status: "not_started" },
      { id: "t6", title: "RAG 检索增强：精准回答问题", duration: "35 分钟", status: "not_started" },
      { id: "t7", title: "多轮对话：记住上下文", duration: "30 分钟", status: "not_started" },
      { id: "t8", title: "定时触发：让工作流自动运行", duration: "25 分钟", status: "not_started" },
      { id: "t9", title: "数据处理：JSON 和变量操作", duration: "30 分钟", status: "not_started" },
      { id: "t10", title: "条件分支：让工作流做判断", duration: "25 分钟", status: "not_started" },
      { id: "t11", title: "循环节点：批量处理任务", duration: "30 分钟", status: "not_started" },
      { id: "t12", title: "网页发布：让更多人用到你的 Bot", duration: "20 分钟", status: "not_started" },
      { id: "t13", title: "调试技巧：快速定位问题", duration: "30 分钟", status: "not_started" },
      { id: "t14", title: "版本管理：安全更新工作流", duration: "25 分钟", status: "not_started" },
      { id: "t15", title: "实战项目：搭建一个 AI 助手 Bot", duration: "60 分钟", status: "not_started" },
    ],
  },
  "ai-side-income": {
    id: "ai-side-income",
    title: "AI 副业变现指南",
    goal: "从 0 到 1 用 AI 技能赚取第一桶金",
    duration: 21,
    tutorialCount: 30,
    tags: ["副业", "变现"],
    tutorials: [
      { id: "t1", title: "AI 副业现状：哪些路径真实可行", duration: "20 分钟", status: "not_started" },
      { id: "t2", title: "技能盘点：你已有的 AI 能力", duration: "15 分钟", status: "not_started" },
      { id: "t3", title: "市场需求分析：谁愿意为 AI 买单", duration: "25 分钟", status: "not_started" },
      { id: "t4", title: "电商物料服务：中小商家需求大", duration: "30 分钟", status: "not_started" },
      { id: "t5", title: "Seedream 商拍工作流：主图+详情页", duration: "35 分钟", status: "not_started" },
      { id: "t6", title: "小红书代运营：内容+投放", duration: "30 分钟", status: "not_started" },
      { id: "t7", title: "抖音脚本服务：按条收费", duration: "25 分钟", status: "not_started" },
      { id: "t8", title: "企业宣传片：AI 视频降低门槛", duration: "40 分钟", status: "not_started" },
      { id: "t9", title: "知识付费：把你的 AI 经验变现", duration: "30 分钟", status: "not_started" },
      { id: "t10", title: "Coze Bot 开发：帮人搭建工作流", duration: "35 分钟", status: "not_started" },
      { id: "t11", title: "定价策略：AI 服务怎么报价", duration: "20 分钟", status: "not_started" },
      { id: "t12", title: "客户沟通：需求挖掘与方案呈现", duration: "25 分钟", status: "not_started" },
      { id: "t13", title: "合同与交付：保护自己也保障客户", duration: "25 分钟", status: "not_started" },
      { id: "t14", title: "案例积累：从小单开始建立口碑", duration: "20 分钟", status: "not_started" },
      { id: "t15", title: "复盘优化：持续提升服务能力", duration: "25 分钟", status: "not_started" },
      { id: "t16", title: "规模化：把 AI 服务产品化", duration: "35 分钟", status: "not_started" },
      { id: "t17", title: "被动收入：数字产品与模板销售", duration: "30 分钟", status: "not_started" },
      { id: "t18", title: "案例拆解：月入过万的 AI 副业者", duration: "30 分钟", status: "not_started" },
      { id: "t19", title: "时间管理：主业+副业如何平衡", duration: "20 分钟", status: "not_started" },
      { id: "t20", title: "法律风险：AI 服务合规要点", duration: "25 分钟", status: "not_started" },
      { id: "t21", title: "进阶路径：从副业到创业", duration: "30 分钟", status: "not_started" },
      { id: "t22", title: "个人品牌：让客户主动找上门", duration: "30 分钟", status: "not_started" },
      { id: "t23", title: "平台选择：在哪里接单更高效", duration: "20 分钟", status: "not_started" },
      { id: "t24", title: "作品集打造：让案例替你说话", duration: "25 分钟", status: "not_started" },
      { id: "t25", title: "团队搭建：从一个人到一群人", duration: "35 分钟", status: "not_started" },
      { id: "t26", title: "定价进阶：高端客户与溢价服务", duration: "25 分钟", status: "not_started" },
      { id: "t27", title: "渠道拓展：线下资源整合", duration: "30 分钟", status: "not_started" },
      { id: "t28", title: "财务管理：副业收入税务规划", duration: "25 分钟", status: "not_started" },
      { id: "t29", title: "心态建设：持续行动的方法论", duration: "20 分钟", status: "not_started" },
      { id: "t30", title: "实战项目：制定你的第一个月变现计划", duration: "60 分钟", status: "not_started" },
    ],
  },
};

// 进度状态映射
interface ProgressState {
  [stepId: string]: boolean;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function AcademyPathDetailPage({ params }: PageProps) {
  const { user, token } = useAuth();
  const [pathId, setPathId] = useState<string | null>(null);
  const [progressMap, setProgressMap] = useState<ProgressState>({});
  const [tutorials, setTutorials] = useState<TutorialItem[]>([]);
  const [loading, setLoading] = useState(true);

  // 获取学习进度
  const fetchProgress = useCallback(async (pathIdValue: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/user/progress?pathId=${pathIdValue}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const map: ProgressState = {};
        for (const step of data.steps) {
          map[step.stepId] = step.completed;
        }
        setProgressMap(map);
      }
    } catch (error) {
      console.error("获取学习进度失败:", error);
    }
  }, [token]);

  // 保存学习进度
  const saveProgress = useCallback(async (pathIdValue: string, stepId: string, completed: boolean) => {
    if (!token) return;
    try {
      await fetch("/api/user/progress", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ pathId: pathIdValue, stepId, completed }),
      });
    } catch (error) {
      console.error("保存学习进度失败:", error);
    }
  }, [token]);

  // 初始化路径 ID
  useEffect(() => {
    params.then(({ id }) => {
      setPathId(id);
      if (learningPathsData[id]) {
        setTutorials(learningPathsData[id].tutorials);
      }
    });
  }, [params]);

  // 获取进度
  useEffect(() => {
    if (pathId && token) {
      setLoading(true);
      fetchProgress(pathId).finally(() => setLoading(false));
    }
  }, [pathId, token, fetchProgress]);

  // 计算进度
  const completedCount = tutorials.filter((t) => progressMap[t.id]).length;
  const progressPercent = tutorials.length > 0 ? Math.round((completedCount / tutorials.length) * 100) : 0;
  const nextTutorial = tutorials.find((t) => !progressMap[t.id]);

  const pathData = pathId ? learningPathsData[pathId] : null;

  if (!pathData) {
    return (
      <main className="flex flex-1 items-center justify-center bg-background">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground">学习路径未找到</h2>
          <Link href="/academy/paths" className="mt-4 text-primary hover:underline">
            返回学习路径
          </Link>
        </div>
      </main>
    );
  }

  // 点击教程项，标记为已完成
  const handleTutorialClick = (stepId: string) => {
    if (!pathId || progressMap[stepId]) return;
    // 更新本地状态
    setProgressMap((prev) => ({ ...prev, [stepId]: true }));
    // 保存到服务器
    saveProgress(pathId, stepId, true);
  };

  return (
    <main className="flex-1 bg-background">
      <div className="mx-auto max-w-[1400px] px-6 py-14 sm:px-8 lg:px-12 lg:py-20">
        {/* 返回链接 */}
        <Link
          href="/academy/paths"
          className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2}
            aria-hidden
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 19l-7-7 7-7"
            />
          </svg>
          返回学习路径
        </Link>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_300px]">
          {/* 主内容区 */}
          <div className="flex flex-col gap-8">
            {/* 路径标题区 */}
            <div className="rounded-[var(--radius-md)] border border-border bg-card p-6">
              <div className="mb-4 flex flex-wrap items-center gap-2">
                {pathData.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-medium text-accent"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                {pathData.title}
              </h1>
              <p className="mt-3 text-base leading-7 text-muted-foreground">
                {pathData.goal}
              </p>

              {/* 进度条 */}
              <div className="mt-6">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">学习进度</span>
                  <span className="font-medium text-accent">{progressPercent}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-accent transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            </div>

            {/* 教程序列 */}
            <div className="flex flex-col gap-4">
              <h2 className="text-lg font-semibold text-foreground">
                教程列表
              </h2>
              <div className="flex flex-col gap-3">
                {tutorials.map((tutorial, index) => {
                  const isCompleted = progressMap[tutorial.id];
                  return (
                    <div
                      key={tutorial.id}
                      onClick={() => handleTutorialClick(tutorial.id)}
                      className="group flex cursor-pointer items-center gap-4 rounded-[var(--radius-md)] border border-border bg-card p-4 transition-all hover:border-accent/40 hover:bg-accent/5"
                    >
                      {/* 序号 */}
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-medium transition-colors ${
                          isCompleted
                            ? "bg-success/15 text-success"
                            : "bg-muted text-muted-foreground group-hover:bg-accent/10 group-hover:text-accent"
                        }`}
                      >
                        {isCompleted ? (
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            strokeWidth={2.5}
                            aria-hidden
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        ) : (
                          index + 1
                        )}
                      </div>

                      {/* 标题 */}
                      <div className="flex-1 min-w-0">
                        <h3
                          className={`text-sm font-medium transition-colors ${
                            isCompleted
                              ? "text-muted-foreground line-through"
                              : "text-foreground group-hover:text-accent"
                          }`}
                        >
                          {tutorial.title}
                        </h3>
                      </div>

                      {/* 时长 */}
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {tutorial.duration}
                      </span>

                      {/* 状态标签 */}
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                          isCompleted
                            ? "bg-success/15 text-success"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {isCompleted ? "已完成" : "未开始"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 右侧边栏 */}
          <aside className="flex flex-col gap-6">
            {/* 路径总览 */}
            <div className="sticky top-6 rounded-[var(--radius-md)] border border-border bg-card p-6">
              <h3 className="mb-4 text-base font-semibold text-foreground">
                路径总览
              </h3>

              <div className="flex flex-col gap-4">
                {/* 预计完成时间 */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">预计完成时间</span>
                  <span className="font-medium text-foreground">
                    {pathData.duration} 天
                  </span>
                </div>

                {/* 总教程数 */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">总教程数</span>
                  <span className="font-medium text-foreground">
                    {pathData.tutorialCount} 集
                  </span>
                </div>

                {/* 已完成 */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">已完成</span>
                  <span className="font-medium text-success">
                    {completedCount} 集
                  </span>
                </div>

                {/* 进度条（边栏内） */}
                <div className="pt-2">
                  <div className="mb-1.5 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">进度</span>
                    <span className="font-medium text-accent">
                      {progressPercent}%
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-accent transition-all duration-500"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                {/* 标签 */}
                <div className="border-t border-border pt-4">
                  <div className="mb-2 text-xs text-muted-foreground">标签</div>
                  <div className="flex flex-wrap gap-1.5">
                    {pathData.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* 开始学习按钮 */}
              {nextTutorial && (
                <Link
                  href={`/tutorial?tutorialId=${nextTutorial.id}`}
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-[var(--radius-md)] bg-accent px-4 py-3 text-sm font-medium text-white transition-all hover:bg-accent-hover"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    aria-hidden
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  开始学习
                </Link>
              )}

              {completedCount === tutorials.length && tutorials.length > 0 && (
                <div className="mt-6 flex w-full items-center justify-center gap-2 rounded-[var(--radius-md)] bg-success/15 px-4 py-3 text-sm font-medium text-success">
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    aria-hidden
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  路径已完成
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

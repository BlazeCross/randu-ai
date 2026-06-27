import type { Metadata } from "next";
import AppShell from "@/components/layout/AppShell";

export const metadata: Metadata = {
  title: "视频教程 - 燃渡学院",
};

interface VideoPreview {
  title: string;
  description: string;
  category: string;
}

// 视频教程预告数据（即将上线）
const VIDEO_PREVIEWS: VideoPreview[] = [
  {
    title: "AI 视频生成入门",
    description: "介绍 Seedance 视频生成工作流的基本使用",
    category: "视频生成",
  },
  {
    title: "提示词编写技巧",
    description: "如何编写有效的视频生成提示词",
    category: "视频生成",
  },
  {
    title: "首尾帧设计实战",
    description: "利用首尾帧控制视频内容与镜头",
    category: "视频生成",
  },
  {
    title: "图像生成工作流",
    description: "Seedream 文生图与图像编辑",
    category: "图像设计",
  },
  {
    title: "智能体对话配置",
    description: "多模态智能体的搭建与调试",
    category: "智能对话",
  },
  {
    title: "API 集成与调用",
    description: "第三方系统接入开放 API",
    category: "开发集成",
  },
];

// 视频教程分类预告（即将上线，仅展示）
const VIDEO_CATEGORIES = [
  "视频生成",
  "图像设计",
  "智能对话",
  "开发集成",
];

export default function VideosPage() {
  return (
    <AppShell
      title="视频教程"
      subtitle="跟随视频实操，快速掌握 AI 工作流"
      tutorialHref="/tutorial"
      sidebar={
        <div className="flex flex-col gap-1 p-2">
          <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            视频分类
          </div>
          {VIDEO_CATEGORIES.map((cat) => (
            <div
              key={cat}
              className="flex items-center justify-between rounded-[var(--radius-sm)] px-3 py-2 text-sm text-muted-foreground"
            >
              <span>{cat}</span>
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                即将上线
              </span>
            </div>
          ))}
        </div>
      }
    >
      <div className="p-6 lg:p-8">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {VIDEO_PREVIEWS.map((video) => (
            <article
              key={video.title}
              className="group flex flex-col overflow-hidden rounded-[var(--radius)] border border-border bg-card transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg"
            >
              {/* 缩略图占位（16:9）+ 播放图标 */}
              <div className="relative flex aspect-video items-center justify-center bg-muted">
                <svg
                  className="h-12 w-12 text-muted-foreground"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
                <span className="absolute left-3 top-3 rounded-full bg-background/80 px-2 py-0.5 text-xs font-medium text-foreground backdrop-blur">
                  即将上线
                </span>
              </div>
              <div className="flex flex-1 flex-col p-5">
                <span className="mb-2 inline-flex w-fit items-center rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-primary">
                  {video.category}
                </span>
                <h3 className="mb-2 text-base font-semibold text-foreground">
                  {video.title}
                </h3>
                <p className="line-clamp-2 flex-1 text-sm leading-6 text-muted-foreground">
                  {video.description}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </AppShell>
  );
}

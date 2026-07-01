import Link from "next/link";
import { cx } from "@/lib/cn";

export interface LearningPath {
  id: string;
  title: string;
  goal: string;
  duration: number;
  tutorialCount: number;
  tags: string[];
  coverImage?: string;
}

interface PathCardProps {
  path: LearningPath;
  className?: string;
}

/**
 * 学习路径卡片组件
 *
 * 展示单个学习路径的封面、标题、目标、时长、教程数、标签。
 * 卡片整体可点击跳转至详情页，hover 时轻微上浮 + 阴影加深。
 */
export default function PathCard({ path, className }: PathCardProps) {
  return (
    <Link
      href={`/academy/paths/${path.id}`}
      className={cx(
        "group flex flex-col overflow-hidden rounded-[var(--radius-md)] border border-border bg-card transition-all duration-[var(--transition-base)]",
        "hover:border-[color-mix(in_srgb,var(--accent)_40%,var(--border))]",
        "hover:-translate-y-1 hover:shadow-[var(--shadow-hover)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
    >
      {/* 封面图 / 占位图 */}
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-accent/10">
        {path.coverImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={path.coverImage}
            alt={path.title}
            className="h-full w-full object-cover transition-transform duration-[var(--transition-slow)] group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <svg
              className="h-16 w-16 text-accent/40"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={1.2}
              aria-hidden
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
          </div>
        )}
      </div>

      {/* 内容区 */}
      <div className="flex flex-1 flex-col p-5">
        {/* 标题 */}
        <h3 className="mb-2 text-lg font-semibold text-foreground transition-colors group-hover:text-accent">
          {path.title}
        </h3>

        {/* 目标描述 */}
        <p className="mb-4 flex-1 text-sm leading-6 text-muted-foreground">
          {path.goal}
        </p>

        {/* 标签 */}
        <div className="mb-4 flex flex-wrap gap-1.5">
          {path.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-medium text-accent"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* 统计信息：时长 + 教程数 */}
        <div className="flex items-center gap-4 border-t border-border pt-4 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <svg
              className="h-3.5 w-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={1.8}
              aria-hidden
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            {path.duration} 天
          </span>
          <span aria-hidden>·</span>
          <span className="inline-flex items-center gap-1.5">
            <svg
              className="h-3.5 w-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={1.8}
              aria-hidden
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
            {path.tutorialCount} 集
          </span>
        </div>
      </div>
    </Link>
  );
}

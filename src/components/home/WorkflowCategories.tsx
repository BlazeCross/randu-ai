import Link from "next/link";
import ScrollReveal from "@/components/ui/ScrollReveal";

interface Category {
  icon: string;
  name: string;
  description: string;
  count: number;
}

const categories: Category[] = [
  {
    icon: "🎬",
    name: "视频生成",
    description: "一键生成高质量视频内容，支持文本转视频、图片转视频等多种创作模式",
    count: 12,
  },
  {
    icon: "✍️",
    name: "内容创作",
    description: "智能文案、文章、社交媒体内容生成，让创意源源不断",
    count: 28,
  },
  {
    icon: "📊",
    name: "数据处理",
    description: "自动化数据清洗、分析、可视化，释放数据背后的商业价值",
    count: 9,
  },
  {
    icon: "🤖",
    name: "自动化运营",
    description: "智能客服、营销自动化、流程编排，全方位提升运营效率",
    count: 15,
  },
  {
    icon: "🎨",
    name: "图像设计",
    description: "AI绘画、海报设计、Logo生成，专业级视觉创作触手可及",
    count: 22,
  },
  {
    icon: "💬",
    name: "智能对话",
    description: "定制化AI助手、知识库问答、多轮对话场景应用",
    count: 18,
  },
];

export default function WorkflowCategories() {
  return (
    <section className="bg-card py-16 sm:py-24">
      <div className="mx-auto max-w-[1600px] px-6 lg:px-8">
        {/* 标题区 */}
        <ScrollReveal className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold uppercase tracking-wider text-primary">
            探索
          </span>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-4xl">
            覆盖全场景的 AI 工作流
          </h2>
          <span
            className="mt-2 block h-1 w-16 rounded-full bg-gradient-to-r from-primary to-primary-400 mx-auto"
            aria-hidden
          />
          <p className="mt-4 text-base text-muted-foreground sm:text-lg">
            从内容创作到数据处理，百款精选工作流满足不同业务需求
          </p>
        </ScrollReveal>

        {/* 卡片墙网格 */}
        <div className="mt-10 grid grid-cols-1 gap-6 sm:mt-16 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category, index) => (
            <ScrollReveal
              key={category.name}
              animation="animate-fade-up"
              className={`stagger-${index + 1}`}
            >
              <Link
                href="/workspace"
                className="group relative flex h-full flex-col overflow-hidden rounded-[var(--radius)] border border-border bg-card p-6 transition-all duration-300 hover:-translate-y-1.5 hover:border-primary/40 hover:bg-[color-mix(in_srgb,var(--accent)_22%,var(--card))] hover:shadow-[var(--shadow-lg)] sm:p-8"
              >
                {/* 悬停光晕叠加层 */}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                {/* 顶部内容 */}
                <div className="relative flex items-start justify-between">
                  {/* 图标 */}
                  <div className="inline-flex h-14 w-14 items-center justify-center rounded-[var(--radius-sm)] bg-gradient-to-br from-accent to-primary/10 text-3xl transition-all duration-300 group-hover:scale-110 group-hover:shadow-[var(--shadow-sm)]">
                    {category.icon}
                  </div>
                  {/* 工作流数量 */}
                  <span className="inline-flex items-center rounded-full border border-border bg-muted/60 px-2.5 py-1 text-xs font-medium text-muted-foreground">
                    {category.count} 个工作流
                  </span>
                </div>

                {/* 名称 */}
                <h3 className="relative mt-5 mb-2 text-xl font-semibold text-foreground">
                  {category.name}
                </h3>

                {/* 简介 */}
                <p className="relative flex-1 text-sm leading-6 text-muted-foreground">
                  {category.description}
                </p>

                {/* 查看按钮 */}
                <div className="relative mt-5 inline-flex items-center text-sm font-medium text-primary opacity-0 transition-all group-hover:opacity-100">
                  查看
                  <svg
                    className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </Link>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

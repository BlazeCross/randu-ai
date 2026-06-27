import Link from "next/link";

const categories = [
  {
    icon: "🎬",
    name: "视频生成",
    description: "一键生成高质量视频内容，支持文本转视频、图片转视频等多种创作模式",
  },
  {
    icon: "✍️",
    name: "内容创作",
    description: "智能文案、文章、社交媒体内容生成，让创意源源不断",
  },
  {
    icon: "📊",
    name: "数据处理",
    description: "自动化数据清洗、分析、可视化，释放数据背后的商业价值",
  },
  {
    icon: "🤖",
    name: "自动化运营",
    description: "智能客服、营销自动化、流程编排，全方位提升运营效率",
  },
  {
    icon: "🎨",
    name: "图像设计",
    description: "AI绘画、海报设计、Logo生成，专业级视觉创作触手可及",
  },
  {
    icon: "💬",
    name: "智能对话",
    description: "定制化AI助手、知识库问答、多轮对话场景应用",
  },
];

export default function WorkflowCategories() {
  return (
    <section className="bg-card py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* 标题区 */}
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold uppercase tracking-wider text-primary">
            工作流分类
          </span>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-4xl">
            覆盖全场景的 AI 工作流
          </h2>
          <p className="mt-4 text-base text-muted-foreground sm:text-lg">
            从内容创作到数据处理，百款精选工作流满足不同业务需求
          </p>
        </div>

        {/* 卡片网格 */}
        <div className="mt-10 grid grid-cols-1 gap-6 sm:mt-16 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <Link
              key={category.name}
              href="/workspace"
              className="group relative rounded-[var(--radius)] border border-border bg-card p-6 transition-all hover:border-[color-mix(in_srgb,var(--primary)_40%,var(--border))] hover:bg-[color-mix(in_srgb,var(--accent)_22%,var(--card))] sm:p-8"
            >
              {/* 图标 */}
              <div className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-[var(--radius-sm)] bg-accent text-3xl transition-colors group-hover:bg-accent">
                {category.icon}
              </div>

              {/* 名称 */}
              <h3 className="mb-2 text-xl font-semibold text-foreground">
                {category.name}
              </h3>

              {/* 简介 */}
              <p className="text-sm leading-6 text-muted-foreground">
                {category.description}
              </p>

              {/* 查看更多 */}
              <div className="mt-5 inline-flex items-center text-sm font-medium text-primary opacity-0 transition-all group-hover:opacity-100">
                了解更多
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
          ))}
        </div>
      </div>
    </section>
  );
}

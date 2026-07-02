import Link from "next/link";
import ScrollReveal from "@/components/ui/ScrollReveal";

interface Category {
  icon: string;
  name: string;
  description: string;
  workflowCount: string;
}

const categories: Category[] = [
  {
    icon: "🎬",
    name: "探索 AI",
    description: "发现 AI 工作流的无限可能，从视频生成到智能对话，开启创作新体验",
    workflowCount: "100+ 工作流",
  },
  {
    icon: "✍️",
    name: "创作内容",
    description: "一键生成高质量文案、海报、视频，让创意快速转化为成果",
    workflowCount: "50+ 工作流",
  },
  {
    icon: "⚡",
    name: "自动化工作",
    description: "智能客服、营销自动化、流程编排，全方位提升团队运营效率",
    workflowCount: "80+ 工作流",
  },
  {
    icon: "📊",
    name: "数据分析",
    description: "自动化数据清洗、分析、可视化，释放数据背后的商业价值",
    workflowCount: "30+ 工作流",
  },
];

export default function WorkflowCategories() {
  return (
    <section className="bg-card py-16 sm:py-24">
      <div className="mx-auto max-w-[1600px] px-6 lg:px-8">
        {/* 标题区 */}
        <ScrollReveal className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold uppercase tracking-wider text-primary">
            工作流
          </span>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-4xl">
            发现适合你的 AI 工作流
          </h2>
          <p className="mt-4 text-base text-muted-foreground sm:text-lg">
            从内容创作到数据分析，百款精选工作流满足不同业务需求
          </p>
        </ScrollReveal>

        {/* 大卡片布局 */}
        <div className="mt-10 grid grid-cols-1 gap-8 sm:mt-16 lg:grid-cols-2 xl:grid-cols-4">
          {categories.map((category, index) => (
            <ScrollReveal
              key={category.name}
              animation="slide"
              className={`stagger-${index + 1}`}
            >
              <Link
                href="/workspace"
                className="group flex h-full flex-col rounded-[var(--radius)] border border-border bg-card p-8 transition-all duration-300 hover:-translate-y-2 hover:border-accent/40 hover:bg-[color-mix(in_srgb,var(--accent)_8%,var(--card))] hover:shadow-[var(--shadow-lg)]"
              >
                {/* 悬停光晕叠加层 */}
                <div className="pointer-events-none absolute inset-0 rounded-[var(--radius)] bg-gradient-to-br from-accent/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                
                {/* 图标区域 */}
                <div className="relative flex h-16 w-16 items-center justify-center rounded-[var(--radius-md)] bg-accent/10 text-4xl transition-all duration-300 group-hover:scale-110 group-hover:bg-accent/20">
                  {category.icon}
                </div>

                {/* 标题 */}
                <h3 className="relative mt-6 text-2xl font-bold text-foreground">
                  {category.name}
                </h3>

                {/* 描述 */}
                <p className="relative mt-3 flex-1 text-base leading-relaxed text-muted-foreground">
                  {category.description}
                </p>

                {/* 工作流数量 */}
                <div className="relative mt-6 flex items-center justify-between">
                  <span className="inline-flex items-center rounded-full bg-accent/10 px-3 py-1.5 text-sm font-medium text-accent">
                    {category.workflowCount}
                  </span>
                  <span className="inline-flex items-center text-sm font-medium text-accent opacity-0 transition-all group-hover:opacity-100">
                    查看详情
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
                  </span>
                </div>
              </Link>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

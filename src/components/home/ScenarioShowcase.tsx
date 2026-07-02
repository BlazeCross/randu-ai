import Link from "next/link";
import ScrollReveal from "@/components/ui/ScrollReveal";

interface Scenario {
  icon: string;
  title: string;
  description: string;
  href: string;
  gradient: string;
}

const scenarios: Scenario[] = [
  {
    icon: "✍️",
    title: "内容创作",
    description: "一键生成种草文案、营销话术、社交媒体内容，让创意源源不断。",
    href: "/chat",
    gradient: "from-primary/20 to-primary-400/5",
  },
  {
    icon: "🎬",
    title: "视频生成",
    description: "输入文字描述，快速生成产品宣传视频，支持场景变换多种玩法。",
    href: "/workspace",
    gradient: "from-success/20 to-success-400/5",
  },
  {
    icon: "💬",
    title: "智能对话",
    description: "多轮上下文对话，定制化 AI 助手帮你写周报、答疑问、做总结。",
    href: "/chat",
    gradient: "from-chart-1/20 to-primary-400/5",
  },
  {
    icon: "⚡",
    title: "效率工具",
    description: "自动化工作流编排，多语言文档翻译、数据处理，全流程提效。",
    href: "/workspace",
    gradient: "from-primary/20 to-chart-3/5",
  },
];

/**
 * 多场景演示 section
 * 展示 4 个 AI 应用场景，每个含图标 + 标题 + 描述 + 了解更多
 */
export default function ScenarioShowcase() {
  return (
    <section className="bg-background py-16 sm:py-24">
      <div className="mx-auto max-w-[1600px] px-6 lg:px-8">
        {/* 标题区 */}
        <ScrollReveal className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold uppercase tracking-wider text-primary">
            体验
          </span>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-4xl">
            多场景 AI 应用演示
          </h2>
          <span
            className="mt-2 block h-1 w-16 rounded-full bg-gradient-to-r from-primary to-primary-400 mx-auto"
            aria-hidden
          />
          <p className="mt-4 text-base text-muted-foreground sm:text-lg">
            覆盖内容创作、视频生成、智能对话、效率工具等高频场景
          </p>
        </ScrollReveal>

        {/* 场景卡片网格 */}
        <div className="mt-10 grid grid-cols-1 gap-6 sm:mt-16 sm:grid-cols-2 lg:grid-cols-4">
          {scenarios.map((scenario, index) => (
            <ScrollReveal
              key={scenario.title}
              animation="slide"
              className={`stagger-${index + 1}`}
            >
              <Link
                href={scenario.href}
                className="group relative block h-full overflow-hidden rounded-[var(--radius)] border border-border bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-[var(--shadow-md)] sm:p-8"
              >
                {/* 悬停光晕 */}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                {/* 场景图占位（渐变色块 + 图标） */}
                <div
                  className={`mb-5 inline-flex h-16 w-16 items-center justify-center rounded-[var(--radius-sm)] bg-gradient-to-br ${scenario.gradient} text-3xl transition-all duration-300 group-hover:scale-110`}
                >
                  {scenario.icon}
                </div>

                {/* 标题 */}
                <h3 className="mb-2 text-lg font-semibold text-foreground">
                  {scenario.title}
                </h3>

                {/* 描述 */}
                <p className="text-sm leading-6 text-muted-foreground">
                  {scenario.description}
                </p>

                {/* 了解更多 */}
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
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

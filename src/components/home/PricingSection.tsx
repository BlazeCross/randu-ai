import Link from "next/link";
import ScrollReveal from "@/components/ui/ScrollReveal";

const plans = [
  {
    name: "免费体验",
    price: "0",
    description: "适合个人用户初次体验",
    features: [
      "每日 10 次工作流调用",
      "基础工作流库访问",
      "社区支持",
    ],
    cta: "开始试用",
    href: "/register",
    highlighted: false,
  },
  {
    name: "Pro 会员",
    price: "99",
    description: "适合专业创作者和小团队",
    features: [
      "每日 100 次工作流调用",
      "全部工作流库访问",
      "优先技术支持",
      "自定义工作流配置",
    ],
    cta: "立即开通",
    href: "/register",
    highlighted: true,
  },
  {
    name: "企业定制",
    price: "联系客服",
    description: "适合大型企业和定制需求",
    features: [
      "无限工作流调用",
      "专属工作流定制",
      "私有化部署支持",
      "专属客户经理",
    ],
    cta: "联系我们",
    href: "/contact",
    highlighted: false,
  },
];

export default function PricingSection() {
  return (
    <section className="bg-background py-16 sm:py-24">
      <div className="mx-auto max-w-[1600px] px-6 lg:px-8">
        {/* 标题区 */}
        <ScrollReveal className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold uppercase tracking-wider text-primary">
            定价
          </span>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-4xl">
            选择适合你的套餐
          </h2>
          <span
            className="mt-2 block h-1 w-16 rounded-full bg-accent mx-auto"
            aria-hidden
          />
          <p className="mt-4 text-base text-muted-foreground sm:text-lg">
            灵活的定价方案，满足不同规模的使用需求
          </p>
        </ScrollReveal>

        {/* 套餐卡片 */}
        <div className="mx-auto mt-10 grid max-w-5xl grid-cols-1 gap-8 sm:mt-16 lg:grid-cols-3">
          {plans.map((plan, index) => (
            <ScrollReveal
              key={plan.name}
              animation="animate-fade-up"
              className={`stagger-${index + 1}`}
            >
            <div
              className={`relative flex flex-col rounded-[var(--radius)] border bg-card p-6 transition-all sm:p-8 ${
                plan.highlighted
                  ? "border-accent shadow-[var(--shadow-md)] hover:-translate-y-1 hover:shadow-[var(--shadow-lg)]"
                  : "border-border hover:border-accent/30"
              }`}
            >
              {/* 推荐标签 */}
              {plan.highlighted && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="inline-flex rounded-full bg-accent px-4 py-1 text-xs font-semibold text-white shadow-[var(--shadow-sm)]">
                    最受欢迎
                  </span>
                </div>
              )}

              {/* 套餐名称 */}
              <h3 className="text-lg font-semibold text-foreground">
                {plan.name}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">{plan.description}</p>

              {/* 价格 */}
              <div className="mt-6 flex items-baseline">
                {plan.price === "联系客服" ? (
                  <span className="text-3xl font-bold tracking-tight text-foreground">
                    {plan.price}
                  </span>
                ) : (
                  <>
                    <span className="text-4xl font-bold tracking-tight text-foreground">
                      ¥{plan.price}
                    </span>
                    <span className="ml-1 text-sm text-muted-foreground">/月</span>
                  </>
                )}
              </div>

              {/* CTA 按钮 */}
              <Link
                href={plan.href}
                className={`mt-8 block rounded-full px-4 py-3 text-center text-sm font-semibold transition-colors ${
                  plan.highlighted
                    ? "bg-accent text-white hover:bg-accent-hover shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] transition-all duration-200"
                    : "border border-border bg-background text-foreground hover:border-accent/40 hover:bg-accent/5 transition-all duration-200"
                }`}
              >
                {plan.cta}
              </Link>

              {/* 功能列表 */}
              <ul className="mt-8 space-y-3">
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-3 text-sm text-muted-foreground"
                  >
                    <svg
                      className="mt-0.5 h-5 w-5 flex-shrink-0 text-accent"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

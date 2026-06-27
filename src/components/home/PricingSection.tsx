import Link from "next/link";

const plans = [
  {
    name: "基础版",
    price: "99",
    description: "适合个人用户和小团队起步",
    features: [
      "每月 100 次工作流调用",
      "基础工作流库访问",
      "社区技术支持",
      "标准响应速度",
    ],
    cta: "开始使用",
    href: "/register",
    highlighted: false,
  },
  {
    name: "专业版",
    price: "299",
    description: "适合专业团队和成长型企业",
    features: [
      "每月 1000 次工作流调用",
      "全部工作流库访问",
      "优先技术支持",
      "加速响应速度",
      "自定义工作流配置",
      "团队协作功能",
    ],
    cta: "立即升级",
    href: "/register",
    highlighted: true,
  },
  {
    name: "企业版",
    price: "999",
    description: "适合大型企业和定制化需求",
    features: [
      "无限工作流调用",
      "专属工作流定制",
      "专属客户经理",
      "私有化部署支持",
      "SLA 服务保障",
      "API 接口开放",
    ],
    cta: "联系我们",
    href: "/dashboard",
    highlighted: false,
  },
];

export default function PricingSection() {
  return (
    <section className="bg-background py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* 标题区 */}
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold uppercase tracking-wider text-primary">
            定价方案
          </span>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-4xl">
            选择适合你的套餐
          </h2>
          <p className="mt-4 text-base text-muted-foreground sm:text-lg">
            灵活的定价方案，满足不同规模的使用需求
          </p>
        </div>

        {/* 套餐卡片 */}
        <div className="mx-auto mt-10 grid max-w-5xl grid-cols-1 gap-8 sm:mt-16 lg:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-[var(--radius)] border bg-card p-6 transition-all sm:p-8 ${
                plan.highlighted
                  ? "border-primary hover:border-primary/30"
                  : "border-border hover:border-primary/30"
              }`}
            >
              {/* 推荐标签 */}
              {plan.highlighted && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="inline-flex rounded-full bg-primary px-4 py-1 text-xs font-semibold text-white">
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
                <span className="text-4xl font-bold tracking-tight text-foreground">
                  ¥{plan.price}
                </span>
                <span className="ml-1 text-sm text-muted-foreground">/月</span>
              </div>

              {/* CTA 按钮 */}
              <Link
                href={plan.href}
                className={`mt-8 block rounded-full px-4 py-3 text-center text-sm font-semibold transition-colors ${
                  plan.highlighted
                    ? "bg-primary text-white hover:bg-primary-hover"
                    : "border border-border bg-background text-foreground hover:bg-muted"
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
                      className="mt-0.5 h-5 w-5 flex-shrink-0 text-success-500"
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
          ))}
        </div>
      </div>
    </section>
  );
}

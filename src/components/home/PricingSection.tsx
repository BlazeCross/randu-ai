"use client";

const plans = [
  {
    name: "免费体验",
    price: "¥0",
    period: "/月",
    description: "适合初次体验",
    features: ["每日 10 次 AI 对话", "3 个基础工作流", "学习路径观看", "社区支持"],
    cta: "立即开始",
    href: "/register",
    variant: "outline" as const,
  },
  {
    name: "Pro 会员",
    price: "¥99",
    period: "/月",
    description: "适合深度用户",
    features: [
      "无限次 AI 对话",
      "全部工作流使用",
      "优先生成速度",
      "专属客服支持",
      "学习路径完整版",
    ],
    cta: "立即开通",
    href: "/register?plan=pro",
    variant: "primary" as const,
    popular: true,
  },
  {
    name: "企业定制",
    price: "定制",
    period: "",
    description: "适合团队使用",
    features: [
      "私有化部署",
      "自定义工作流",
      "API 接口调用",
      "专属客户成功经理",
      "SLA 服务保障",
    ],
    cta: "获取方案",
    href: "/contact",
    variant: "outline" as const,
  },
];

export function PricingSection() {
  return (
    <section className="py-24 bg-white" id="pricing">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
            灵活的定价，满足不同需求
          </h2>
          <p className="mt-4 text-lg text-gray-500">
            选择适合你的方案，开始 AI 之旅
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative p-8 rounded-2xl border-2 transition-all duration-300 ${
                plan.popular
                  ? "border-indigo-500 shadow-xl scale-105 bg-white"
                  : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-lg"
              }`}
            >
              {/* 最受欢迎标签 */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="px-4 py-1 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-sm font-medium rounded-full">
                    最受欢迎
                  </span>
                </div>
              )}

              {/* 套餐名称 */}
              <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
              <p className="mt-2 text-sm text-gray-500">{plan.description}</p>

              {/* 价格 */}
              <div className="mt-6 flex items-baseline">
                <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                {plan.period && <span className="ml-1 text-gray-500">{plan.period}</span>}
              </div>

              {/* 功能列表 */}
              <ul className="mt-6 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3 text-gray-600">
                    <svg className="w-5 h-5 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>

              {/* CTA 按钮 */}
              <a
                href={plan.href}
                className={`mt-8 block w-full py-3 px-6 text-center font-semibold rounded-xl transition-all duration-200 ${
                  plan.popular
                    ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:from-indigo-600 hover:to-purple-600 hover:-translate-y-0.5 hover:shadow-lg"
                    : "bg-gray-100 text-gray-900 hover:bg-gray-200"
                }`}
              >
                {plan.cta}
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

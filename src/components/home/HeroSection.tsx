import Link from "next/link";

const stats = [
  { label: "精选工作流", value: "100+" },
  { label: "服务用户", value: "10,000+" },
  { label: "服务可用性", value: "99.9%" },
];

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-primary-50 via-white to-white">
      {/* 装饰性背景元素 */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -right-40 -top-40 h-96 w-96 rounded-full bg-primary-200/40 blur-3xl" />
        <div className="absolute -left-20 top-20 h-72 w-72 rounded-full bg-success-200/30 blur-3xl" />
        <div className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary-100/20 blur-3xl" />
        {/* 网格纹理 */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 py-16 sm:py-24 lg:px-8 lg:py-32">
        <div className="mx-auto max-w-3xl text-center">
          {/* 顶部标签 */}
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-primary-200 bg-white/80 px-4 py-1.5 text-sm font-medium text-primary-700 shadow-sm backdrop-blur">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-success-500" />
            </span>
            AI 工作流服务平台
          </div>

          {/* 主标题 */}
          <h1 className="text-4xl font-bold tracking-tight text-neutral-900 sm:text-6xl lg:text-7xl">
            让 AI 工作流
            <br />
            <span className="bg-gradient-to-r from-primary-600 to-success-500 bg-clip-text text-transparent">
              为你的业务提效
            </span>
          </h1>

          {/* 价值主张 */}
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-neutral-600 sm:text-xl">
            百款AI工作流，即开即用，覆盖视频生成、内容创作、数据处理等全场景，
            让AI真正为你的业务创造价值
          </p>

          {/* 行动按钮 */}
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/register"
              className="group inline-flex items-center justify-center rounded-xl bg-primary px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-primary-600/25 transition-all hover:bg-primary-hover hover:shadow-xl hover:shadow-primary-600/30 active:scale-[0.98]"
            >
              立即体验
              <svg
                className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </Link>
            <Link
              href="/workspace"
              className="inline-flex items-center justify-center rounded-xl border border-neutral-300 bg-white px-8 py-3.5 text-base font-semibold text-neutral-700 transition-all hover:border-primary hover:text-primary"
            >
              浏览工作流
            </Link>
          </div>

          {/* 数据统计 */}
          <dl className="mx-auto mt-12 grid max-w-2xl grid-cols-3 gap-4 border-t border-neutral-200 pt-8 sm:mt-20 sm:gap-8 sm:pt-10">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <dt className="text-xs font-medium text-neutral-500 sm:text-sm">
                  {stat.label}
                </dt>
                <dd className="mt-2 text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">
                  {stat.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}

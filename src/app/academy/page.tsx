import Link from "next/link";
import type { Metadata } from "next";
import FAQAccordion from "./FAQAccordion";

export const metadata: Metadata = {
  title: "燃渡学院 - 系统学习 AI 工作流",
  description:
    "从提示词工程到工作流开发，从入门到精通。结合平台真实工作流，提供图文教程、视频教程与实战项目。",
};

/* ============================================================
 * 数据层：内容均取自 docs/academy-content-plan.md
 * ============================================================ */

// Hero 关键卖点
const heroSellingPoints = [
  "18+ 个平台真实工作流可随教程直接调用",
  "图文 + 视频双轨教程，零基础也能跟上",
  "按方向分类的学习路径，按需学习不迷路",
];

// Hero 下方精简学习数据（3 项核心数字）
const quickStats = [
  { value: "18+", label: "平台可调用工作流" },
  { value: "120+", label: "累计图文教程" },
  { value: "3.6 万+", label: "累计学习人次" },
];

// 学习路径（6 条）
const learningPaths = [
  {
    icon: "🎬",
    title: "AI 视频创作实战路径",
    audience: "短视频创作者、自媒体运营、电商带货、影视剪辑师",
    stages: 5,
    hours: "12 小时",
    skills: ["Seedance", "首尾帧设计", "提示词编写", "视频拼接"],
    outcome: "能独立用燃渡平台工作流产出一条可发布的 AI 短视频。",
  },
  {
    icon: "🎨",
    title: "AI 图像设计路径",
    audience: "设计师、电商运营、新媒体编辑、品牌策划",
    stages: 4,
    hours: "8 小时",
    skills: ["Seedream 文生图", "风格控制", "批量出图", "商业海报"],
    outcome: "能用 Seedream 工作流稳定产出商用级图像。",
  },
  {
    icon: "✍️",
    title: "AI 内容创作路径",
    audience: "新媒体编辑、文案、内容运营、电商文案",
    stages: 4,
    hours: "6 小时",
    skills: ["豆包文案生成", "提示词模板", "多平台改写"],
    outcome: "能搭建自己的内容生产工作流，把日常文案效率提升 5 倍以上。",
  },
  {
    icon: "🤖",
    title: "Coze 工作流开发路径",
    audience: "产品经理、运营、独立开发者、AI 实践者",
    stages: 6,
    hours: "15 小时",
    skills: ["Coze 节点编排", "大模型节点", "插件调用", "工作流调试"],
    outcome: "能独立设计、搭建、调试、上线一个 Coze 工作流。",
  },
  {
    icon: "⚙️",
    title: "AI 自动化运营路径",
    audience: "私域运营、社群运营、电商店长、SaaS 运营",
    stages: 5,
    hours: "10 小时",
    skills: ["自动化运营工作流", "多步骤编排", "定时触发", "数据回流"],
    outcome: "能把自己工作中至少 1 项重复任务彻底自动化。",
  },
  {
    icon: "💬",
    title: "AI 智能对话应用路径",
    audience: "客服负责人、产品经理、知识库管理员",
    stages: 4,
    hours: "8 小时",
    skills: ["智能对话", "RAG 检索增强", "知识库", "多轮对话"],
    outcome: "能搭出一个「问不倒」的智能对话应用。",
  },
];

// 推荐课程（8 张）
const featuredCourses = [
  {
    icon: "🎬",
    title: "Seedance 视频生成 15 分钟入门",
    desc: "用一句话生成 5 秒高质量视频，理解提示词、分辨率、运镜三个核心参数。",
    difficulty: "入门" as const,
    duration: "15 分钟",
    skills: ["Seedance", "视频生成"],
    entry: "图文教程 + 视频教程",
  },
  {
    icon: "🎨",
    title: "Seedream 文生图提示词实战手册",
    desc: "50+ 真实案例拆解提示词结构，覆盖电商、社媒、品牌海报三大场景。",
    difficulty: "进阶" as const,
    duration: "40 分钟",
    skills: ["Seedream", "图像设计"],
    entry: "图文教程",
  },
  {
    icon: "✍️",
    title: "豆包文案提示词模板库",
    desc: "12 套开箱即用的提示词模板，覆盖小红书、公众号、电商详情页、短视频脚本。",
    difficulty: "入门" as const,
    duration: "25 分钟",
    skills: ["豆包", "内容创作"],
    entry: "图文教程 + 视频教程",
  },
  {
    icon: "🤖",
    title: "Coze 工作流：从节点到上线全流程",
    desc: "手把手搭建一个「输入链接 → 自动生成摘要 + 配图 + 标题」的工作流并发布到燃渡平台。",
    difficulty: "实战" as const,
    duration: "60 分钟",
    skills: ["Coze", "自动化运营"],
    entry: "视频教程 + 图文教程",
  },
  {
    icon: "🎞️",
    title: "首尾帧控制：让 AI 视频更连贯",
    desc: "用 Seedream 出首帧与尾帧，喂给 Seedance 生成连贯多镜头，告别「一个镜头到底」。",
    difficulty: "进阶" as const,
    duration: "30 分钟",
    skills: ["Seedance", "Seedream"],
    entry: "视频教程",
  },
  {
    icon: "💬",
    title: "智能客服工作流搭建实战",
    desc: "从知识库导入到 RAG 调优，搭一个能扛 80% 高频问题的智能客服 Bot。",
    difficulty: "实战" as const,
    duration: "50 分钟",
    skills: ["Coze", "智能对话", "RAG"],
    entry: "图文教程",
  },
  {
    icon: "📊",
    title: "自动化日报生成工作流",
    desc: "连接数据源 → 豆包分析 → 生成结构化日报，10 分钟出一份带图表的运营周报。",
    difficulty: "进阶" as const,
    duration: "35 分钟",
    skills: ["豆包", "自动化运营", "数据处理"],
    entry: "视频教程",
  },
  {
    icon: "🖼️",
    title: "批量出图工作流（电商主图场景）",
    desc: "商品图 + 风格描述 → Seedream 批量生成 10 张主图，统一画风、可筛选可微调。",
    difficulty: "实战" as const,
    duration: "45 分钟",
    skills: ["Seedream", "Coze", "图像设计"],
    entry: "图文教程 + 视频教程",
  },
];

// 讲师（6 位）
const instructors = [
  {
    name: "林深",
    title: "燃渡AI 视频工作流负责人",
    focus: "Seedance 视频生成 · 多镜头叙事",
    bio: "主导平台 6 个 Seedance 工作流的设计与调优，累计生成视频超 2 万条。",
    courses: ["Seedance 视频生成入门", "首尾帧控制实战"],
  },
  {
    name: "苏野",
    title: "图像工作流架构师",
    focus: "Seedream 文生图 · 风格一致性",
    bio: "负责平台图像类工作流，沉淀 50+ 商业场景提示词模板。",
    courses: ["Seedream 提示词实战手册", "批量出图工作流"],
  },
  {
    name: "周衡",
    title: "Coze 工作流技术专家",
    focus: "Coze 节点编排 · 工作流工程化",
    bio: "搭建并维护平台 10+ 个 Coze 工作流，负责工作流稳定性与版本管理规范。",
    courses: ["Coze 工作流全流程", "调试与版本管理"],
  },
  {
    name: "陈砚",
    title: "内容自动化架构师",
    focus: "豆包文案 · 内容生产流水线",
    bio: "把内容生产从「手敲」变成「工作流跑」，服务过 3 个百万级粉丝账号。",
    courses: ["豆包文案模板库", "自动化日报生成"],
  },
  {
    name: "高远",
    title: "智能对话应用工程师",
    focus: "RAG · 知识库 · 多轮对话",
    bio: "主导平台智能客服工作流，把首响应解决率从 42% 提到 78%。",
    courses: ["智能客服工作流搭建实战"],
  },
  {
    name: "阮夏",
    title: "自动化运营工作流架构师",
    focus: "运营自动化 · 数据回流",
    bio: "把「日报、周报、客户打分、定时触达」四类重复工作流化，平均节省运营 60% 时间。",
    courses: ["自动化运营路径全阶"],
  },
];

// 完整学习数据统计（6 项）
const fullStats = [
  {
    metric: "平台可调用工作流",
    value: "18+",
    desc: "涵盖视频、图像、内容、对话、运营、数据六大方向",
  },
  {
    metric: "累计图文教程",
    value: "120+ 篇",
    desc: "全部来自飞书文档中心，与工作流同步更新",
  },
  {
    metric: "视频教程总时长",
    value: "800+ 分钟",
    desc: "跟随实操，平均单条 25 分钟",
  },
  {
    metric: "累计学习人次",
    value: "3.6 万+",
    desc: "注册学员实际调用工作流进行学习的人次",
  },
  {
    metric: "学员完成实战项目数",
    value: "4,200+",
    desc: "在平台工作流基础上独立产出的可交付作品",
  },
  {
    metric: "学员满意度",
    value: "96%",
    desc: "基于课程结束后调研问卷回收统计",
  },
];

// 学员评价（6 条）
const testimonials = [
  {
    name: "阿木",
    role: "电商小店主",
    quote:
      "之前自己摸 Seedance 出片要试十几次才出一张能用的，跟着「AI 视频创作实战路径」走完，现在 3 次以内就能出可发布的带货短视频，店里 3 个 SKU 的主图视频全是我自己用工作流跑出来的。",
    target: "AI 视频创作实战路径",
  },
  {
    name: "栗子酱",
    role: "新媒体编辑",
    quote:
      "豆包文案模板库那篇我反复看了 4 遍，12 套模板直接套进我的日常工作，公众号选题到成稿从 3 小时压到 40 分钟，主管以为我请了助理。",
    target: "豆包文案提示词模板库",
  },
  {
    name: "Kevin",
    role: "独立开发者",
    quote:
      "之前自己瞎搭 Coze 工作流，跑通一次崩三次。周衡老师的「Coze 工作流全流程」把调试和版本管理讲透了，现在我能稳定维护 5 个对外发布的工作流，不用再担心改一处崩全线。",
    target: "Coze 工作流开发路径",
  },
  {
    name: "Mei",
    role: "私域运营",
    quote:
      "跟着「自动化运营路径」搭了一条客户答疑 + 日报的工作流，每天省出来 2 小时，足够我多接 1 个客户。最实在的是教程里的工作流真的能在燃渡平台直接跑，不是空讲理论。",
    target: "AI 自动化运营路径",
  },
  {
    name: "林一",
    role: "品牌设计师",
    quote:
      "Seedream 提示词手册里的风格控制部分救了我，做品牌视觉物料时画风终于能统一了，不用再一张张修。批量出图工作流一次出 10 张主图，客户选 3 张，效率拉满。",
    target: "AI 图像设计路径",
  },
  {
    name: "大熊",
    role: "客服负责人",
    quote:
      "智能客服那条路径我带着团队三个人一起学完，搭出来的 Bot 把首响应解决率从 40% 出头拉到接近 80%，人工坐席压力直接下来一半。",
    target: "AI 智能对话应用路径",
  },
];

// FAQ（8 个）
const faqs = [
  {
    question: "我没有编程基础，能学会吗？",
    answer:
      "完全可以。燃渡学院所有路径都从「零基础入门」阶段开始，前两个阶段不写任何代码，全程通过燃渡平台可视化界面 + Coze 拖拽编排完成。Coze 工作流开发路径的后半段会涉及少量参数与逻辑，但不要求编程经验，跟着视频操作即可。",
  },
  {
    question: "教程里的工作流真的能直接跑吗？要不要额外付费？",
    answer:
      "所有图文 / 视频教程配套的工作流均上架在燃渡平台，注册账号后即可在工作台直接调用。基础调用免费，超出免费额度后按平台套餐计费，套餐详情见 /dashboard/orders。教程本身不收费。",
  },
  {
    question: "学完一条路径大概要多久？",
    answer:
      "每条路径的预计学时已标注在路径卡片上，范围在 6–15 小时之间。建议按阶段分散学习，每个阶段配套一个小练习，平均 1 周可完成一条路径。视频教程支持倍速与回看，节奏可自行控制。",
  },
  {
    question: "学完能达到什么水平？能直接用来赚钱吗？",
    answer:
      "每条路径末尾都设有「实战项目」阶段，完成项目即意味着你能独立产出一份可交付的作品（一条短视频、一套图像物料、一个可上线的工作流等）。是否能变现取决于你自己的应用场景与运营能力，平台提供能力，不承诺收益。",
  },
  {
    question: "教程内容会更新吗？模型升级了怎么办？",
    answer:
      "会持续更新。燃渡平台工作流与底层模型（Seedance / Seedream / 豆包）同步迭代，每次模型升级后我们会同步更新对应图文与视频教程，老学员可免费查看更新内容。学习数据统计板块每月 1 日更新一次。",
  },
  {
    question: "支持团队 / 企业一起学吗？",
    answer:
      "当前首页面向个人学员。团队学习、私有工作流部署、定制培训等需求请通过工作台「联系我们」入口沟通，我们会提供企业版方案。",
  },
  {
    question: "我已经会用一些 AI 工具了，能跳过入门直接学进阶吗？",
    answer:
      "可以。每条路径的阶段均支持单独学习，你可根据自评跳过入门阶段，直接从进阶或实战阶段开始。但建议至少浏览入门阶段的「能力地图」，确认没有知识盲区。",
  },
  {
    question: "学完后能拿到证书吗？",
    answer:
      "暂不提供结业证书。我们更看重「能否产出可交付作品」而非证书，每条路径的实战项目即为你能力的最好证明，作品可直接展示在你的作品集或社交平台。",
  },
];

// 配套资源（沿用现有，措辞微调）
const resources = [
  {
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
      />
    ),
    title: "实战项目驱动",
    desc: "每个章节配套可运行的真实工作流，学完即跑，不止「看懂」。",
  },
  {
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M13 10V3L4 14h7v7l9-11h-7z"
      />
    ),
    title: "渐进式难度",
    desc: "从入门到进阶，按方向分类、按需学习，不强制顺序。",
  },
  {
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
      />
    ),
    title: "工作流教程中心",
    desc: "查看每个工作流的飞书文档教程，与平台工作流 1:1 对应。",
  },
];

// 教程入口（沿用现有）
const tutorialEntries = [
  {
    href: "/academy/articles",
    icon: "📚",
    title: "图文教程",
    desc: "结构化图文教程，按分类浏览每个工作流的详细使用说明",
    cta: "浏览图文教程",
  },
  {
    href: "/academy/videos",
    icon: "🎥",
    title: "视频教程",
    desc: "视频演示教程，跟随实操快速掌握 AI 工作流应用方法",
    cta: "观看视频教程",
  },
];

// 难度标签样式（颜色点 + 文字，主题适配）
function difficultyClasses(difficulty: "入门" | "进阶" | "实战") {
  switch (difficulty) {
    case "入门":
      return { dot: "bg-success", text: "text-success" };
    case "进阶":
      return { dot: "bg-primary", text: "text-primary" };
    case "实战":
      return { dot: "bg-warning", text: "text-warning" };
  }
}

/* ============================================================
 * 燃渡学院首页
 * ============================================================ */
export default function AcademyPage() {
  return (
    <main className="flex-1 bg-background">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* 1. Hero 区域 */}
        <section className="mx-auto max-w-3xl text-center">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="inline-flex items-center rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
              即将上线
            </span>
            <span className="inline-flex items-center rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
              基于真实工作流 · 学完即跑
            </span>
          </div>
          <h1 className="mt-5 text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            系统学 AI 工作流，从会用到会搭
          </h1>
          <p className="mt-5 text-base leading-7 text-muted-foreground sm:text-lg">
            燃渡学院围绕平台真实工作流，提供从提示词工程到 Coze 编排、从 Seedance
            视频到 Seedream 出图、从豆包文案到自动化运营的全链路实战课程。每个章节配套可运行的工作流，学完即用。
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/register"
              className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-[color-mix(in_srgb,var(--primary)_90%,#000)]"
            >
              免费注册抢先体验
            </Link>
            <Link
              href="/workspace"
              className="rounded-full border border-border bg-card px-6 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              先去工作台看看
            </Link>
            <Link
              href="/academy/articles"
              className="text-sm font-medium text-primary transition-colors hover:text-primary-hover"
            >
              浏览图文教程 →
            </Link>
          </div>
          {/* Hero 卖点 */}
          <ul className="mt-8 flex flex-col items-center gap-2 text-sm text-muted-foreground sm:flex-row sm:flex-wrap sm:justify-center sm:gap-x-6 sm:gap-y-2">
            {heroSellingPoints.map((point) => (
              <li key={point} className="inline-flex items-center gap-1.5">
                <svg
                  className="h-4 w-4 shrink-0 text-success"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={2.5}
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                {point}
              </li>
            ))}
          </ul>
        </section>

        {/* 2. 精简学习数据统计（Hero 下方，3 项） */}
        <section className="mt-12">
          <div className="grid grid-cols-1 gap-4 rounded-[var(--radius)] border border-border bg-card p-6 sm:grid-cols-3 sm:gap-6 sm:p-8">
            {quickStats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-bold tracking-tight text-primary sm:text-4xl">
                  {stat.value}
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 3. 学习路径板块（6 条） */}
        <section className="mt-16 sm:mt-20">
          <div className="mb-8 max-w-2xl">
            <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              按方向选择你的学习路径
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
              6 条路径覆盖燃渡AI 平台全部能力，从入门到能独立搭建工作流，每条路径 4–6 个阶段，配套真实工作流练习。
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {learningPaths.map((path) => (
              <div
                key={path.title}
                className="group flex flex-col rounded-[var(--radius)] border border-border bg-card p-6 transition-all hover:border-primary hover:bg-accent/10"
              >
                <div className="mb-4 flex items-center justify-between">
                  <span className="flex h-12 w-12 items-center justify-center rounded-[var(--radius-lg)] bg-accent text-2xl">
                    {path.icon}
                  </span>
                  <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                    即将上线
                  </span>
                </div>
                <h3 className="mb-2 text-lg font-semibold text-foreground">
                  {path.title}
                </h3>
                <p className="mb-4 text-sm leading-6 text-muted-foreground">
                  适用人群：{path.audience}
                </p>
                <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span>
                    <span className="font-semibold text-foreground">
                      {path.stages}
                    </span>{" "}
                    阶段
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>
                    预计学时{" "}
                    <span className="font-semibold text-foreground">
                      {path.hours}
                    </span>
                  </span>
                </div>
                <div className="mb-4 flex flex-wrap gap-1.5">
                  {path.skills.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
                <div className="mt-auto rounded-[var(--radius-sm)] bg-muted/60 p-3 text-xs leading-5 text-muted-foreground">
                  <span className="font-semibold text-foreground">结束能力：</span>
                  {path.outcome}
                </div>
                <Link
                  href="/register"
                  className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary transition-colors hover:text-primary-hover"
                >
                  查看路径详情
                  <svg
                    className="h-4 w-4 transition-transform group-hover:translate-x-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* 4. 推荐课程板块（8 张） */}
        <section className="mt-16 sm:mt-20">
          <div className="mb-8 max-w-2xl">
            <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              精选教程，立即可学
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
              以下教程均配套燃渡平台真实可运行工作流，点击即学、学完即跑。所有图文教程来自飞书文档中心，视频教程跟随实操。
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {featuredCourses.map((course) => {
              const dc = difficultyClasses(course.difficulty);
              return (
                <div
                  key={course.title}
                  className="group flex flex-col rounded-[var(--radius)] border border-border bg-card p-5 transition-all hover:border-primary hover:bg-accent/10"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-lg)] bg-accent text-2xl">
                      {course.icon}
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${dc.dot}`}
                        aria-hidden="true"
                      />
                      <span className={dc.text}>{course.difficulty}</span>
                    </span>
                  </div>
                  <h3 className="mb-2 text-base font-semibold leading-6 text-foreground">
                    {course.title}
                  </h3>
                  <p className="mb-4 flex-1 text-sm leading-6 text-muted-foreground">
                    {course.desc}
                  </p>
                  <div className="mb-3 flex flex-wrap gap-1.5">
                    {course.skills.map((skill) => (
                      <span
                        key={skill}
                        className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                  <div className="mb-4 flex items-center justify-between text-xs text-muted-foreground">
                    <span>⏱ {course.duration}</span>
                    <span>{course.entry}</span>
                  </div>
                  <Link
                    href="/academy/articles"
                    className="inline-flex items-center gap-1 text-sm font-medium text-primary transition-colors hover:text-primary-hover"
                  >
                    立即学习
                    <svg
                      className="h-4 w-4 transition-transform group-hover:translate-x-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M13 7l5 5m0 0l-5 5m5-5H6"
                      />
                    </svg>
                  </Link>
                </div>
              );
            })}
          </div>
          {/* 板块底部入口 */}
          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
            <Link
              href="/academy/articles"
              className="font-medium text-primary transition-colors hover:text-primary-hover"
            >
              浏览全部图文教程 →
            </Link>
            <Link
              href="/academy/videos"
              className="font-medium text-primary transition-colors hover:text-primary-hover"
            >
              观看全部视频教程 →
            </Link>
            <Link
              href="/tutorial"
              className="font-medium text-primary transition-colors hover:text-primary-hover"
            >
              查看工作流教程中心 →
            </Link>
          </div>
        </section>

        {/* 5. 讲师介绍板块（6 位） */}
        <section className="mt-16 sm:mt-20">
          <div className="mb-8 max-w-2xl">
            <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              由一线 AI 实践者带学
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
              讲师均为燃渡AI 平台工作流的实际设计与维护者，教程内容来自真实生产经验，不是「纸上谈兵」。
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {instructors.map((instructor) => (
              <div
                key={instructor.name}
                className="flex flex-col rounded-[var(--radius)] border border-border bg-card p-6 transition-all hover:border-primary hover:bg-accent/10"
              >
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent text-base font-semibold text-accent-foreground">
                    {instructor.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <div className="text-base font-semibold text-foreground">
                      {instructor.name}
                    </div>
                    <div className="truncate text-xs text-muted-foreground">
                      {instructor.title}
                    </div>
                  </div>
                </div>
                <p className="mb-3 text-xs font-medium text-primary">
                  {instructor.focus}
                </p>
                <p className="mb-4 flex-1 text-sm leading-6 text-muted-foreground">
                  {instructor.bio}
                </p>
                <div className="border-t border-border pt-3">
                  <div className="mb-2 text-xs font-medium text-muted-foreground">
                    代表课程
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {instructor.courses.map((course) => (
                      <span
                        key={course}
                        className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                      >
                        {course}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 6. 完整学习数据统计（6 项） */}
        <section className="mt-16 sm:mt-20">
          <div className="mb-8 max-w-2xl">
            <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              用数据说话
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
              以下数据基于燃渡AI 平台真实运行统计，持续更新。
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {fullStats.map((stat) => (
              <div
                key={stat.metric}
                className="rounded-[var(--radius)] border border-border bg-card p-6"
              >
                <div className="text-3xl font-bold tracking-tight text-primary">
                  {stat.value}
                </div>
                <div className="mt-2 text-sm font-semibold text-foreground">
                  {stat.metric}
                </div>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  {stat.desc}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-5 text-xs text-muted-foreground">
            数据更新时间：2026 年 6 月 ｜ 下次更新：每月 1 日
          </p>
        </section>

        {/* 7. 学员评价板块（6 条） */}
        <section className="mt-16 sm:mt-20">
          <div className="mb-8 max-w-2xl">
            <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              学员真实反馈
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
              以下评价来自燃渡AI 平台注册学员，已征得本人同意公开展示。
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((t) => (
              <div
                key={t.name}
                className="flex flex-col rounded-[var(--radius)] border border-border bg-card p-6"
              >
                <div className="mb-3 flex items-center gap-1 text-warning">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i} aria-hidden="true">
                      ★
                    </span>
                  ))}
                  <span className="sr-only">5 星好评</span>
                </div>
                <p className="mb-4 flex-1 text-sm leading-7 text-foreground">
                  「{t.quote}」
                </p>
                <div className="flex items-center gap-3 border-t border-border pt-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-foreground">
                    {t.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-foreground">
                      {t.name}
                    </div>
                    <div className="truncate text-xs text-muted-foreground">
                      {t.role} · {t.target}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 8. FAQ 板块（8 个，可折叠） */}
        <section className="mt-16 sm:mt-20">
          <div className="mb-8 max-w-2xl">
            <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              常见问题
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
              还没决定？这些问题的答案或许能帮你。
            </p>
          </div>
          <FAQAccordion items={faqs} />
        </section>

        {/* 9. 配套资源板块（沿用现有，微调） */}
        <section className="mt-16 sm:mt-20">
          <div className="mb-8 max-w-2xl">
            <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              为什么选择燃渡学院
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
              三大支撑让学习不悬空。
            </p>
          </div>
          <div className="rounded-[var(--radius)] border border-primary/30 bg-gradient-to-br from-accent/60 to-background p-8">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {resources.map((r) => (
                <div key={r.title} className="text-center">
                  <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-[var(--radius-lg)] bg-accent">
                    <svg
                      className="h-6 w-6 text-accent-foreground"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      strokeWidth={1.8}
                    >
                      {r.icon}
                    </svg>
                  </div>
                  <h3 className="text-sm font-semibold text-foreground">
                    {r.title}
                  </h3>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    {r.desc}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-6 text-center">
              <Link
                href="/tutorial"
                className="inline-flex items-center gap-1 text-sm font-medium text-primary transition-colors hover:text-primary-hover"
              >
                前往工作流教程中心
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Link>
            </div>
          </div>
        </section>

        {/* 10. 教程入口（图文 / 视频，沿用现有，下移） */}
        <section className="mt-16 sm:mt-20">
          <h2 className="mb-6 text-xl font-semibold text-foreground">
            立即可用教程
          </h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {tutorialEntries.map((entry) => (
              <Link
                key={entry.href}
                href={entry.href}
                className="group flex flex-col rounded-[var(--radius)] border border-border bg-card p-6 transition-all hover:border-primary hover:bg-accent/10"
              >
                <div className="mb-4 flex items-center justify-between">
                  <span className="flex h-12 w-12 items-center justify-center rounded-[var(--radius-lg)] bg-accent text-2xl">
                    {entry.icon}
                  </span>
                  <svg
                    className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                </div>
                <h3 className="mb-2 text-lg font-semibold text-foreground">
                  {entry.title}
                </h3>
                <p className="mb-4 flex-1 text-sm leading-6 text-muted-foreground">
                  {entry.desc}
                </p>
                <span className="inline-flex items-center text-sm font-medium text-primary">
                  {entry.cta}
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* 底部 CTA（转化兜底） */}
        <section className="mt-16 sm:mt-20">
          <div className="rounded-[var(--radius)] border border-border bg-gradient-to-br from-accent/60 to-background p-8 text-center sm:p-12">
            <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              准备好开始你的 AI 工作流学习了吗？
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
              注册即可调用 18+ 个平台真实工作流，跟着图文与视频教程，从入门到能独立搭建工作流。
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/register"
                className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-[color-mix(in_srgb,var(--primary)_90%,#000)]"
              >
                免费注册抢先体验
              </Link>
              <Link
                href="/workspace"
                className="rounded-full border border-border bg-card px-6 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                先去工作台看看
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

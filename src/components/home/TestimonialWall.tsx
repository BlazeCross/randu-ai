import ScrollReveal from "@/components/ui/ScrollReveal";

interface Testimonial {
  nickname: string;
  role: string;
  content: string;
  avatarGradient: string;
}

const testimonials: Testimonial[] = [
  {
    nickname: "林小棠",
    role: "自媒体运营",
    content:
      "用燃渡AI写小红书种草文案，效率提升了至少 5 倍，发布内容质量也稳定了很多，现在每天能多产出 3 篇优质笔记。",
    avatarGradient: "from-primary to-primary-400",
  },
  {
    nickname: "陈宇航",
    role: "短视频创作者",
    content:
      "Seedance 视频生成太香了，输入一段描述就能出宣传视频，省去了大量拍摄和剪辑成本，效果还很专业。",
    avatarGradient: "from-success to-success-400",
  },
  {
    nickname: "王明哲",
    role: "创业团队负责人",
    content:
      "工作流平台帮我们把重复的运营流程自动化了，多语言文档翻译、周报生成都不再占用团队精力，专注做核心业务。",
    avatarGradient: "from-chart-1 to-primary-400",
  },
  {
    nickname: "赵思琪",
    role: "设计师",
    content:
      "AI 艺术海报和图像设计功能很实用，灵感枯竭时拿来发散思维，配合自己的创意能快速产出方案，客户满意度很高。",
    avatarGradient: "from-primary-400 to-chart-3",
  },
];

/**
 * 用户评价墙 section
 * 网格布局展示用户评价，参考 Dify 推文墙风格
 */
export default function TestimonialWall() {
  return (
    <section className="bg-card py-16 sm:py-24">
      <div className="mx-auto max-w-[1600px] px-6 lg:px-8">
        {/* 标题区 */}
        <ScrollReveal className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold uppercase tracking-wider text-primary">
            用户口碑
          </span>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-4xl">
            听听他们怎么说
          </h2>
          <span
            className="mt-2 block h-1 w-16 rounded-full bg-gradient-to-r from-primary to-primary-400 mx-auto"
            aria-hidden
          />
          <p className="mt-4 text-base text-muted-foreground sm:text-lg">
            来自不同行业的真实用户反馈
          </p>
        </ScrollReveal>

        {/* 评价卡片网格 */}
        <div className="mt-10 grid grid-cols-1 gap-6 sm:mt-16 md:grid-cols-2 lg:grid-cols-4">
          {testimonials.map((item, index) => (
            <ScrollReveal
              key={item.nickname}
              animation="animate-fade-up"
              className={`stagger-${index + 1}`}
            >
              <figure className="flex h-full flex-col rounded-[var(--radius)] border border-border bg-background p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-[var(--shadow-md)]">
                {/* 引用装饰 */}
                <svg
                  className="mb-3 h-8 w-8 text-primary/30"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden
                >
                  <path d="M9.983 3v7.391c0 5.704-3.731 9.57-8.983 10.609l-.995-2.151c2.432-.917 3.995-2.838 3.995-5.149h-4v-10.7h9.983zm14.017 0v7.391c0 5.704-3.748 9.571-9 10.609l-.996-2.151c2.433-.917 3.996-2.838 3.996-5.149h-3.983v-10.7h8.983z" />
                </svg>

                {/* 评价内容 */}
                <blockquote className="flex-1 text-sm leading-6 text-muted-foreground">
                  {item.content}
                </blockquote>

                {/* 用户信息 */}
                <figcaption className="mt-6 flex items-center gap-3 border-t border-border pt-4">
                  {/* 头像占位（渐变圆形色块） */}
                  <span
                    className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${item.avatarGradient} text-sm font-semibold text-white`}
                    aria-hidden
                  >
                    {item.nickname.slice(0, 1)}
                  </span>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-foreground">
                      {item.nickname}
                    </div>
                    <div className="truncate text-xs text-muted-foreground">
                      {item.role}
                    </div>
                  </div>
                </figcaption>
              </figure>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

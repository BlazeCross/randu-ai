import ScrollReveal from "@/components/ui/ScrollReveal";

interface Testimonial {
  name: string;
  role: string;
  avatar: string;
  content: string;
}

const testimonials: Testimonial[] = [
  {
    name: "林小棠",
    role: "自媒体运营",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Lin",
    content:
      "用燃渡AI写小红书种草文案，效率提升了至少 5 倍，发布内容质量也稳定了很多，现在每天能多产出 3 篇优质笔记。",
  },
  {
    name: "陈宇航",
    role: "短视频创作者",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Chen",
    content:
      "Seedance 视频生成太香了，输入一段描述就能出宣传视频，省去了大量拍摄和剪辑成本，效果还很专业。",
  },
  {
    name: "王明哲",
    role: "创业团队负责人",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Wang",
    content:
      "工作流平台帮我们把重复的运营流程自动化了，多语言文档翻译、周报生成都不再占用团队精力，专注做核心业务。",
  },
];

/**
 * 学员评价墙 section
 * 2-3 张真实感卡片设计，展示用户评价
 */
export default function TestimonialsSection() {
  return (
    <section className="bg-card py-16 sm:py-24">
      <div className="mx-auto max-w-[1600px] px-6 lg:px-8">
        {/* 标题区 */}
        <ScrollReveal className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold uppercase tracking-wider text-primary">
            学员口碑
          </span>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-4xl">
            听听他们怎么说
          </h2>
          <span
            className="mt-2 block h-1 w-16 rounded-full bg-accent mx-auto"
            aria-hidden
          />
          <p className="mt-4 text-base text-muted-foreground sm:text-lg">
            来自不同行业的真实用户反馈
          </p>
        </ScrollReveal>

        {/* 评价卡片网格 */}
        <div className="mx-auto mt-10 grid max-w-5xl grid-cols-1 gap-8 sm:mt-16 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((item, index) => (
            <ScrollReveal
              key={item.name}
              animation="animate-fade-up"
              className={`stagger-${index + 1}`}
            >
              <figure className="flex h-full flex-col rounded-[var(--radius)] border border-border bg-background p-8 shadow-[var(--shadow-sm)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-md)] hover:border-accent/30">
                {/* 引用装饰 */}
                <svg
                  className="mb-4 h-8 w-8 text-accent/40"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden
                >
                  <path d="M9.983 3v7.391c0 5.704-3.731 9.57-8.983 10.609l-.995-2.151c2.432-.917 3.995-2.838 3.995-5.149h-4v-10.7h9.983zm14.017 0v7.391c0 5.704-3.748 9.571-9 10.609l-.996-2.151c2.433-.917 3.996-2.838 3.996-5.149h-3.983v-10.7h8.983z" />
                </svg>

                {/* 评价内容 */}
                <blockquote className="flex-1 text-base leading-relaxed text-muted-foreground">
                  {item.content}
                </blockquote>

                {/* 用户信息 */}
                <figcaption className="mt-6 flex items-center gap-4 border-t border-border pt-5">
                  {/* 头像占位 */}
                  <img
                    src={item.avatar}
                    alt={item.name}
                    className="h-12 w-12 flex-shrink-0 rounded-full bg-muted object-cover"
                    onError={(e) => {
                      // Fallback to initials if avatar fails to load
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                  <span className="hidden h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-accent/20 text-sm font-semibold text-accent">
                    {item.name.slice(0, 1)}
                  </span>
                  <div className="min-w-0">
                    <div className="truncate text-base font-semibold text-foreground">
                      {item.name}
                    </div>
                    <div className="truncate text-sm text-muted-foreground">
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

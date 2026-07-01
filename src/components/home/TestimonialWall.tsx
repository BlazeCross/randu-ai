"use client";

const testimonials = [
  {
    name: "林小棠",
    role: "电商运营主管",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=林小棠",
    rating: 5,
    content: "用了燃渡AI之后，我们团队的内容产出效率提升了3倍！尤其是小红书文案生成功能，简直是运营神器。",
  },
  {
    name: "张明",
    role: "新媒体创业者",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=张明",
    rating: 5,
    content: "作为一个AI小白，通过燃渡学院的学习路径，7天就入门了。现在能独立完成短视频脚本和文案创作。",
  },
  {
    name: "王芳",
    role: "企业培训经理",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=王芳",
    rating: 5,
    content: "企业定制版非常好用，为我们公司定制的工作流让内部审批效率提升显著。客服响应也很及时。",
  },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[...Array(5)].map((_, i) => (
        <svg
          key={i}
          className={`w-4 h-4 ${i < rating ? "text-amber-400" : "text-gray-300"}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

export function TestimonialsSection() {
  return (
    <section className="py-24 bg-gray-50">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
            看看他们怎么说
          </h2>
          <p className="mt-4 text-lg text-gray-500">
            来自真实用户的好评
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((item, index) => (
            <div
              key={item.name}
              className="relative p-8 bg-white rounded-2xl border border-gray-100 hover:border-indigo-100 hover:-translate-y-1 hover:shadow-xl transition-all duration-300"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* 引用装饰 */}
              <div className="absolute top-6 right-6 text-6xl text-indigo-100 font-serif leading-none">
                "
              </div>

              {/* 头像和评分 */}
              <div className="flex items-center gap-4 mb-4">
                <img
                  src={item.avatar}
                  alt={item.name}
                  className="w-16 h-16 rounded-full bg-gray-100"
                />
                <div>
                  <div className="font-semibold text-gray-900">{item.name}</div>
                  <div className="text-sm text-gray-500">{item.role}</div>
                </div>
              </div>

              {/* 评分星星 */}
              <StarRating rating={item.rating} />

              {/* 评价内容 */}
              <p className="mt-4 text-gray-600 leading-relaxed">
                {item.content}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

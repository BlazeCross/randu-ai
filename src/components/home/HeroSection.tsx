"use client";

export function HeroSection() {
  const bubbles = [
    "如何用AI写爆款文案",
    "电商主图一键生成",
    "短视频脚本自动化",
    "小红书笔记批量创作",
    "日报周报生成",
    "AI学习路径怎么选",
  ];

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      {/* 渐变背景 */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-purple-50" />
      
      {/* 几何装饰 */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" />
      <div className="absolute bottom-20 right-10 w-72 h-72 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" />
      
      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
        {/* 主标题 */}
        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight">
          用AI赋能创意<br className="hidden md:block" />让工作更高效
        </h1>
        
        {/* 副标题 */}
        <p className="mt-6 text-xl text-gray-500 max-w-2xl mx-auto">
          零门槛学AI，用现成工作流提效。会员免费体验，满意再订阅。
        </p>
        
        {/* CTA 按钮 */}
        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          <a 
            href="/register"
            className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold rounded-full hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200"
          >
            免费开始探索
            <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </a>
          <a 
            href="#features"
            className="inline-flex items-center justify-center px-8 py-4 bg-white text-gray-700 font-semibold rounded-full border border-gray-200 hover:border-indigo-300 hover:text-indigo-600 transition-all duration-200"
          >
            观看演示视频
          </a>
        </div>
        
        {/* 冷启动气泡 */}
        <div className="mt-12 flex flex-wrap justify-center gap-3">
          {bubbles.map((text) => (
            <a
              key={text}
              href="/workspace"
              className="px-4 py-2 bg-white/50 backdrop-blur-sm text-gray-600 text-sm rounded-full border border-transparent hover:border-indigo-200 hover:text-indigo-600 transition-all duration-200 cursor-pointer"
            >
              {text}
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

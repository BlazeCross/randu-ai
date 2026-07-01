"use client";

export function FinalCTASection() {
  return (
    <section className="py-24 bg-gradient-to-br from-indigo-50 via-white to-purple-50 relative overflow-hidden">
      {/* 背景装饰 */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-200 rounded-full opacity-20 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-purple-200 rounded-full opacity-20 blur-3xl" />
      </div>
      
      <div className="relative max-w-3xl mx-auto px-6 text-center">
        <h2 className="text-4xl md:text-5xl font-bold text-gray-900">
          准备好开始了吗？
        </h2>
        <p className="mt-6 text-xl text-gray-600">
          加入 12,000+ 用户的行列，开启你的 AI 提效之旅
        </p>
        
        <div className="mt-10">
          <a
            href="/register"
            className="inline-flex items-center justify-center px-10 py-4 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-bold text-lg rounded-full hover:from-indigo-600 hover:to-purple-600 hover:-translate-y-1 hover:shadow-xl transition-all duration-300"
          >
            立即注册，体验全部功能
            <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </a>
        </div>
        
        <p className="mt-6 text-sm text-gray-500">
          无需信用卡 · 1 分钟快速注册 · 立即开始体验
        </p>
      </div>
    </section>
  );
}
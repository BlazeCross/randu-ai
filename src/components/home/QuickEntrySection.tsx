"use client";

export function QuickEntrySection() {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-5xl mx-auto px-6">
        <h2 className="text-center text-sm font-medium text-gray-500 uppercase tracking-wider mb-12">
          快速入口
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 我想学AI */}
          <a
            href="/academy/paths"
            className="group relative p-8 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100 hover:border-indigo-300 hover:-translate-y-1 hover:shadow-xl transition-all duration-200"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-indigo-500 rounded-2xl flex items-center justify-center text-2xl">
                📚
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">我想学AI</h3>
                <p className="text-gray-500 mt-1">零基础入门，系统化学习路径</p>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-white/80 text-sm text-gray-600 rounded-full">电商AI 7天入门</span>
              <span className="px-3 py-1 bg-white/80 text-sm text-gray-600 rounded-full">新媒体创作</span>
              <span className="px-3 py-1 bg-white/80 text-sm text-gray-600 rounded-full">AI副业变现</span>
            </div>
            <div className="mt-4 text-indigo-600 font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
              探索学习路径
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </a>

          {/* 我要用工具 */}
          <a
            href="/workspace"
            className="group relative p-8 bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl border border-orange-100 hover:border-orange-300 hover:-translate-y-1 hover:shadow-xl transition-all duration-200"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-orange-500 rounded-2xl flex items-center justify-center text-2xl">
                ⚡
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">我要用工具</h3>
                <p className="text-gray-500 mt-1">直接使用现成工作流提效</p>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-white/80 text-sm text-gray-600 rounded-full">爆款文案生成</span>
              <span className="px-3 py-1 bg-white/80 text-sm text-gray-600 rounded-full">电商主图</span>
              <span className="px-3 py-1 bg-white/80 text-sm text-gray-600 rounded-full">短视频脚本</span>
            </div>
            <div className="mt-4 text-orange-600 font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
              进入工作台
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </a>
        </div>
      </div>
    </section>
  );
}

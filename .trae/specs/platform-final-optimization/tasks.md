# Tasks

## 阶段一：框架级体验优化（P0）

- [x] Task 1: 创建公共工具 cx() 和路由保护中间件
  - [x] SubTask 1.1: 创建 `src/lib/cn.ts`，导出 `cx(...inputs: (string | false | null | undefined)[])` 函数，替换各组件内重复定义的 cx 函数
  - [x] SubTask 1.2: 创建 `src/middleware.ts`，对 /dashboard、/admin、/chat、/workspace 等路由在边缘层统一检查 JWT cookie，未登录重定向到 /login
  - [x] SubTask 1.3: 搜索全项目 cx() 定义，统一替换为 `import { cx } from '@/lib/cn'`

- [x] Task 2: 全站 loading.tsx 骨架屏体系
  - [x] SubTask 2.1: 创建 `src/app/dashboard/loading.tsx`（侧栏+资料卡骨架）
  - [x] SubTask 2.2: 创建 `src/app/admin/loading.tsx`（admin侧栏+内容区骨架）
  - [x] SubTask 2.3: 创建 `src/app/chat/loading.tsx`（对话区+侧栏骨架）
  - [x] SubTask 2.4: 创建 `src/app/workspace/loading.tsx`（工作台骨架）
  - [x] SubTask 2.5: 创建 `src/app/academy/loading.tsx`（学院首页骨架）
  - [x] SubTask 2.6: 创建 `src/app/pricing/loading.tsx`（定价页骨架）
  - [x] SubTask 2.7: 创建根 `src/app/loading.tsx`（通用全屏骨架）

- [x] Task 3: 路由级 error.tsx 错误边界
  - [x] SubTask 3.1: 创建 `src/app/dashboard/error.tsx`（含重试按钮+返回首页）
  - [x] SubTask 3.2: 创建 `src/app/admin/error.tsx`（admin专用错误页）
  - [x] SubTask 3.3: 创建 `src/app/chat/error.tsx`（对话错误页）
  - [x] SubTask 3.4: 创建 `src/app/workspace/error.tsx`（工作台错误页）
  - [x] SubTask 3.5: 优化全局 `src/app/error.tsx`（统一错误展示组件）

- [x] Task 4: 字体迁移 + View Transitions 页面过渡
  - [x] SubTask 4.1: 在 `src/app/layout.tsx` 用 `next/font/google` 的 `Inter` 替代 Google Fonts `<link>`，配置子集化和 display: swap
  - [x] SubTask 4.2: 在 `src/app/globals.css` 添加 `@view-transition { navigation: auto; }` 和 `::view-transition-old/new` 过渡样式
  - [x] SubTask 4.3: 在 `next.config.ts` 添加 `images` 配置（remotePatterns 含 OSS 域名 + 火山方舟 CDN 域名）

- [x] Task 5: next/image 统一图片优化
  - [x] SubTask 5.1: 搜索全项目 `eslint-disable @next/next/no-img-element`，逐个替换为 next/image 组件
  - [x] SubTask 5.2: Navbar Logo、HeroCarousel、WorkflowCategories、Footer 等首页组件的 <img> 替换
  - [x] SubTask 5.3: dashboard/admin 页面的用户头像、封面图替换

## 阶段二：首页骨架升级

- [x] Task 6: 首页 Hero 区重构
  - [x] SubTask 6.1: HeroSection 增加 NEW 标签轮播（参考火山方舟，展示最新工作流/新能力）
  - [x] SubTask 6.2: Hero 区增加冷启动引导气泡（参考 ChatGPT 50+ 建议气泡，展示 6-8 个常用场景提示）
  - [x] SubTask 6.3: Hero 区 CTA 按钮优化（主CTA"立即体验"+次CTA"查看定价"）

- [x] Task 7: 数据大字号展示区
  - [x] SubTask 7.1: 创建 `src/components/home/StatsSection.tsx`，大字号展示用户数/工作流数/生成次数（参考 Dify/火山引擎）
  - [x] SubTask 7.2: 数据从 /api/admin/stats/overview 获取（或静态占位数据）
  - [x] SubTask 7.3: 数字 count-up 动画（复用已有 animate-count-up）

- [x] Task 8: 首页板块重组与动词化命名
  - [x] SubTask 8.1: 首页 section 命名动词化（参考 Dify：探索/创建/体验/成长）
  - [x] SubTask 8.2: 新增"多场景演示"section（参考扣子多Agent协作演示，占位卡片）
  - [x] SubTask 8.3: 新增"用户评价墙"section（参考 Dify 推文墙，占位评价卡片，轮播展示）
  - [x] SubTask 8.4: 优化"工作流分类"section 为卡片墙布局（参考扣子 Agent 阵容展示）
  - [x] SubTask 8.5: 滚动揭示动画优化（所有 section 加 ScrollReveal + stagger 交错入场）

- [x] Task 9: NEW 标签组件
  - [x] SubTask 9.1: 创建 `src/components/ui/NewBadge.tsx`，橙色小标签组件（参考火山方舟 NEW 标签）
  - [x] SubTask 9.2: 工作流列表中 isNew=true 的工作流显示 NEW 标签

## 阶段三：交互体验优化

- [x] Task 10: 统一加载与错误处理
  - [x] SubTask 10.1: 创建 `src/components/ui/EmptyState.tsx`，空状态组件（图标+提示+CTA按钮）
  - [x] SubTask 10.2: dashboard/history、dashboard/keys、admin 列表页空数据时显示 EmptyState
  - [x] SubTask 10.3: API 错误响应格式统一为 `{ error: string, code?: string }`，前端统一 Toast 处理

- [x] Task 11: 移动端优化
  - [x] SubTask 11.1: AppShell 侧栏宽度响应式（移动端全宽抽屉，桌面端固定 248px）
  - [x] SubTask 11.2: admin 表格横向滚动优化（min-w + overflow-x-auto + sticky 首列）
  - [x] SubTask 11.3: Navbar 移动端菜单高度自适应（去掉固定 max-height: 500px）

## 阶段四：新增功能页（占位符）

- [x] Task 12: 工作流市场页面 /marketplace
  - [x] SubTask 12.1: 创建 `src/app/marketplace/page.tsx`，含分类导航侧栏 + 搜索栏 + 工作流卡片网格
  - [x] SubTask 12.2: 数据从 /api/workflow/list 获取（复用现有API）
  - [x] SubTask 12.3: 卡片设计参考 GPT Store（封面+标题+作者+评分+使用次数，评分和使用次数为占位）
  - [x] SubTask 12.4: Navbar 增加"市场"导航链接

- [x] Task 13: Artifacts 工作空间页面 /artifacts
  - [x] SubTask 13.1: 创建 `src/app/artifacts/page.tsx`，占位页面
  - [x] SubTask 13.2: 展示示例 Artifacts 卡片网格（图片/视频/文案占位卡片）
  - [x] SubTask 13.3: "功能即将上线"提示横幅
  - [x] SubTask 13.4: AppShell 侧栏增加"作品空间"入口链接到 /artifacts

- [x] Task 14: 定价页价格计算器
  - [x] SubTask 14.1: 在 /pricing 页面新增"价格计算器"板块（参考火山方舟）
  - [x] SubTask 14.2: 输入框：预计每月对话次数/生图次数/视频次数
  - [x] SubTask 14.3: 实时计算预估月费 + 推荐套餐
  - [x] SubTask 14.4: 计算结果展示"预计月费 XX 元，推荐 XX 套餐" + 跳转订阅按钮

## 阶段五：性能优化（P0/P1）

- [x] Task 15: OSS STS 临时凭证直传
  - [x] SubTask 15.1: 在 `src/lib/oss.ts` 新增 `getSTSCredentials()` 函数，调用阿里云 STS AssumeRole
  - [x] SubTask 15.2: 新增 `/api/oss/sts` API 路由，返回临时凭证（有效期 3600s）
  - [x] SubTask 15.3: 修改 `src/components/upload/ImageUploader.tsx` 为前端直传 OSS
  - [x] SubTask 15.4: 修改 `/api/user/avatar` 和 `/api/admin/workflows/[id]/cover` 为返回 STS 凭证而非中转文件
  - [x] SubTask 15.5: OSS Bucket 配置 CORS（AllowedOrigin/Method/Header）

- [x] Task 16: 火山方舟错误码退避重试
  - [x] SubTask 16.1: 在 `src/lib/volcengine.ts` 新增 `retryWithBackoff(fn, maxRetries=3, initialDelay=1000)` 函数
  - [x] SubTask 16.2: 对 429（限流）和 5xx（服务器错误）自动指数退避重试
  - [x] SubTask 16.3: 重试日志记录（console.warn）
  - [x] SubTask 16.4: 超出重试次数后返回友好错误 `{ error: "AI服务繁忙，请稍后重试", code: "RATE_LIMITED" }`

- [x] Task 17: Server Components 迁移（部分）
  - [x] SubTask 17.1: /dashboard 页面首屏数据改为 Server Component 直出（用户资料+使用记录）
  - [x] SubTask 17.2: /admin 列表页首屏数据改为 Server Component 直出（用户列表+工作流列表）
  - [x] SubTask 17.3: 保留客户端交互部分为独立 "use client" 子组件

## 阶段六：SEO增强

- [x] Task 18: 动态路由 generateMetadata
  - [x] SubTask 18.1: `/workflow/[id]/page.tsx` 添加 generateMetadata（标题=工作流名-燃渡AI）
  - [x] SubTask 18.2: `/academy/articles/[id]` 添加 generateMetadata（标题=教程标题-燃渡学院）
  - [x] SubTask 18.3: `/pricing`、`/credits`、`/marketplace` 添加静态 metadata

- [x] SubTask 18.4: 教程详情页添加 Article JSON-LD 结构化数据
- [x] SubTask 18.5: sitemap.ts 纳入 /pricing、/credits、/marketplace、/academy/articles、/academy/videos
- [x] SubTask 18.6: layout.tsx 的 OpenGraph 增加 images 字段（品牌Logo或首页截图）

## 阶段七：构建验证

- [x] Task 19: 构建验证
  - [x] SubTask 19.1: `npx next build` 确认无类型错误、无构建失败
  - [x] SubTask 19.2: 确认所有新增页面（/marketplace、/artifacts）在路由表中出现
  - [x] SubTask 19.3: 确认 loading.tsx 和 error.tsx 正确注册
  - [x] SubTask 19.4: 确认 middleware.ts 不阻断公开路由（/、/login、/pricing等）

# Task Dependencies
- Task 2 (loading.tsx) 依赖 Task 1.1 (cx 工具)
- Task 3 (error.tsx) 依赖 Task 1.1 (cx 工具)
- Task 5 (next/image) 依赖 Task 4.3 (next.config.ts images 配置)
- Task 6-9 (首页) 依赖 Task 1.1 (cx 工具)
- Task 12 (marketplace) 依赖 Task 8 (首页板块重组完成后再加导航入口)
- Task 15 (STS直传) 依赖 OSS Bucket CORS 配置（用户手动）
- Task 17 (Server Components) 可与 Task 2-3 并行

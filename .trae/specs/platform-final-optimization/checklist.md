# Checklist

## 阶段一：框架级体验优化

- [x] `src/lib/cn.ts` 公共 cx() 工具函数已创建，全项目无重复定义的 cx 函数
- [x] `src/middleware.ts` 已创建，对 /dashboard、/admin、/chat、/workspace 路由统一检查 JWT
- [x] middleware 不阻断公开路由（/、/login、/register、/pricing、/credits、/academy、/marketplace）
- [ ] 根 `src/app/loading.tsx` 通用骨架屏已创建
- [ ] `src/app/dashboard/loading.tsx` 骨架屏已创建
- [ ] `src/app/admin/loading.tsx` 骨架屏已创建
- [ ] `src/app/chat/loading.tsx` 骨架屏已创建
- [ ] `src/app/workspace/loading.tsx` 骨架屏已创建
- [ ] `src/app/academy/loading.tsx` 骨架屏已创建
- [ ] `src/app/pricing/loading.tsx` 骨架屏已创建
- [ ] `src/app/dashboard/error.tsx` 错误边界已创建（含重试按钮）
- [ ] `src/app/admin/error.tsx` 错误边界已创建
- [ ] `src/app/chat/error.tsx` 错误边界已创建
- [ ] `src/app/workspace/error.tsx` 错误边界已创建
- [x] `src/app/layout.tsx` 已用 next/font/google Inter 替代 Google Fonts CDN link
- [x] Google Fonts `<link>` 已移除，字体通过 next/font 自托管
- [x] `src/app/globals.css` 已添加 View Transitions API 过渡样式
- [x] `next.config.ts` 已配置 images.remotePatterns（OSS域名+火山方舟CDN域名）
- [ ] 全项目 `eslint-disable @next/next/no-img-element` 注释已消除（替换为 next/image）

## 阶段二：首页骨架升级

- [ ] HeroSection 已增加 NEW 标签轮播组件
- [ ] 首页已增加冷启动引导气泡（6-8个场景提示）
- [ ] `src/components/home/StatsSection.tsx` 数据大字号展示区已创建
- [ ] StatsSection 数字有 count-up 动画
- [ ] 首页 section 命名已动词化（探索/创建/体验/成长等）
- [ ] 首页已增加"多场景演示"section（占位卡片）
- [ ] 首页已增加"用户评价墙"section（占位评价，轮播展示）
- [ ] 工作流分类已改为卡片墙布局
- [ ] 所有首页 section 有 ScrollReveal 滚动揭示 + stagger 交错入场
- [ ] `src/components/ui/NewBadge.tsx` NEW 标签组件已创建

## 阶段三：交互体验优化

- [ ] `src/components/ui/EmptyState.tsx` 空状态组件已创建
- [ ] dashboard/history 空数据时显示 EmptyState
- [ ] dashboard/keys 空数据时显示 EmptyState
- [ ] admin 列表页空数据时显示 EmptyState
- [ ] API 错误响应格式统一为 `{ error: string, code?: string }`
- [ ] AppShell 侧栏移动端响应式宽度已优化
- [ ] admin 表格横向滚动已优化（sticky 首列）
- [ ] Navbar 移动端菜单高度自适应（无固定 max-height 截断）

## 阶段四：新增功能页

- [ ] `/marketplace` 工作流市场页面已创建
- [ ] marketplace 页面含分类导航 + 搜索栏 + 工作流卡片网格
- [ ] marketplace 卡片含封面/标题/作者/评分（占位）/使用次数（占位）
- [ ] Navbar 已增加"市场"导航链接
- [ ] `/artifacts` Artifacts 工作空间页面已创建
- [ ] artifacts 页面展示示例卡片 + "功能即将上线"提示
- [ ] AppShell 侧栏已增加"作品空间"入口
- [ ] /pricing 页面已增加价格计算器板块
- [ ] 价格计算器支持输入对话/生图/视频次数并实时计算
- [ ] 价格计算器展示推荐套餐 + 订阅跳转按钮

## 阶段五：性能优化

- [ ] `src/lib/oss.ts` 已新增 getSTSCredentials() 函数
- [ ] `/api/oss/sts` API 路由已创建
- [ ] ImageUploader 组件已改为前端直传 OSS
- [ ] /api/user/avatar 和 /api/admin/workflows/[id]/cover 已改为 STS 方式
- [ ] 火山方舟 volcengine.ts 已实现 retryWithBackoff 指数退避重试
- [ ] 429 限流自动重试（最多3次，初始1s延迟）
- [ ] 5xx 错误自动重试（最多3次）
- [ ] 超出重试次数返回友好错误提示
- [ ] /dashboard 首屏数据已改为 Server Component 直出
- [ ] /admin 列表页首屏数据已改为 Server Component 直出

## 阶段六：SEO增强

- [ ] /workflow/[id] 已添加 generateMetadata
- [ ] /academy/articles/[id] 已添加 generateMetadata（如有此路由）
- [ ] /pricing、/credits、/marketplace 已添加静态 metadata
- [ ] 教程详情页已添加 Article JSON-LD 结构化数据
- [ ] sitemap.ts 已纳入 /pricing、/credits、/marketplace 等新页面
- [ ] layout.tsx OpenGraph 已增加 images 字段

## 阶段七：构建验证

- [x] `npx next build` 无类型错误
- [x] `npx next build` 无构建失败
- [x] 新增页面 /marketplace、/artifacts 在路由表中出现
- [ ] 所有 loading.tsx 正确注册（不报错）
- [ ] 所有 error.tsx 正确注册（不报错）
- [x] middleware.ts 不阻断公开路由
- [x] 主题切换功能不受影响（html.dark + localStorage randu-theme）
- [x] 智能体多会话结构不受影响（conversations/currentId 结构）
- [x] 支付宝支付功能不受影响
- [x] 现有所有页面功能不受影响（仅框架和UI升级，不改功能逻辑）

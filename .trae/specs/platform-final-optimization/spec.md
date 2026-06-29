# 平台最终优化升级 Spec

## Why

基于对豆包、扣子、火山方舟、火山引擎、通义千问、智谱清言、Kimi、Dify、ChatGPT、Claude 共 10 个 AI 大厂网站的深度调研，以及对火山方舟/阿里云ECS/OSS/扣子/微信AI 开发文档的研读，识别出燃渡AI在框架体验、首页骨架、交互设计、性能优化、SEO 等方面存在系统性差距。本次优化目标是在**不改变现有功能逻辑、不增加硬件成本**的前提下，完成质量级框架升级。

## 调研基础

### 竞品研究结论（详见 docs/research-ai-competitors.md）
- **首页三范式**：首页即对话（豆包/Kimi）/ Marketing+演示（扣子/Claude）/ 企业级SaaS（火山引擎）
- **差异化策略**：避开蓝紫同质化，Claude 米色+衬线字体、Kimi 极简黑白可参考
- **11个功能模块参考**：多Agent协作演示、模型定价表、智能体市场、Artifacts工作空间等
- **5个交互亮点**：冷启动引导、滚动揭示、NEW标签策略、数据大字号、动词化section命名
- **5个反模式**：营销堆砌、抽象卡片墙、同质化蓝紫、过度marketing化、定价信息隐藏

### 开发文档研究结论（详见 docs/research-dev-docs.md）
- 当前 2核4G 完全可支撑 DAU<500，瓶颈在并发非算力
- P0优先：OSS STS直传、火山方舟错误码退避、安全组收敛
- P1优先：火山方舟Webhook回调、OSS图片处理+生命周期、云监控告警
- P2优先：扣子工作流API集成、工作流市场、知识库RAG

### 平台现状分析（详见 docs/platform-current-state.md）
- 技术栈：Next.js 16 + React 19 + Prisma 6 + PostgreSQL 16 + Tailwind v4
- 30+路由、50+API、12个数据模型、v2.0设计系统
- **7类核心问题**：无loading.tsx、无页面过渡、无路由级错误边界、Server Components利用不足、Google Fonts渲染阻塞、图片未用next/image、cx()重复定义

## What Changes

### 阶段一：框架级体验优化（P0）
- 全站路由级 `loading.tsx` 骨架屏体系
- 路由级 `error.tsx` 错误边界（dashboard/admin/功能页 分别独立）
- View Transitions API 页面过渡动画
- `next/font` 自托管字体替代 Google Fonts CDN
- `next/image` 统一图片优化
- `cx()` className 工具抽取为公共 lib
- middleware.ts 统一路由保护

### 阶段二：首页骨架升级（参考竞品）
- Hero区重构：参考扣子多Agent协作演示 + Claude三场景预设
- NEW标签策略：参考火山方舟，新能力/新工作流标记橙色小标签
- 数据大字号展示：参考Dify/火山引擎，用户数/工作流数/生成次数大字号
- 动词化section命名：参考Dify BUILD/CONNECT/STARTUP模式
- 冷启动引导气泡：参考ChatGPT/豆包，首页增加建议提示
- 滚动揭示动画优化：stagger交错入场 + 视口触发

### 阶段三：交互体验优化
- 统一加载状态：Skeleton骨架屏全局统一规范
- 统一错误处理：API错误格式统一 `{ error: string, code?: string }` + 前端统一Toast
- 移动端优化：AppShell侧栏响应式宽度、表格横向滚动优化
- 触摸反馈优化：全局tap-feedback（已定义，检查覆盖率）
- 空状态设计：列表空数据时的引导性空状态

### 阶段四：新增功能页（占位符）
- **工作流市场** `/marketplace`：参考GPT Store/Coze探索商店，分类导航+卡片墙+搜索+评分（前端占位，后端API已具备Workflow模型）
- **价格计算器** `/pricing`增强：参考火山方舟，输入token量实时估算费用
- **Artifacts工作空间** `/artifacts`：参考Claude，生成内容沉淀为可分享可浏览的工作空间（占位页面）
- **社区/用户评价** 首页增加：参考Dify真实推文墙，用户评价轮播（占位内容）

### 阶段五：性能优化（P0/P1）
- **OSS STS临时凭证直传**：替换服务端中转上传，释放ECS带宽
- **火山方舟错误码退避重试**：429/5xx自动指数退避重试
- **Server Components迁移**：dashboard/admin列表页改为Server Component直出
- **Prisma连接池优化**：connection_limit调优 + 查询超时

### 阶段六：SEO增强
- 动态路由 `generateMetadata`：/workflow/[id]、/academy/articles/[id]等
- JSON-LD结构化数据：教程页Article schema
- OpenGraph images：社交分享预览图
- sitemap优化：教程/定价/积分页纳入

## Impact
- Affected specs: 整站框架、首页、所有功能页、后台管理、API错误处理
- Affected code:
  - `src/app/**/loading.tsx`（新增15+文件）
  - `src/app/**/error.tsx`（新增5+文件）
  - `src/app/layout.tsx`（字体迁移、过渡动画）
  - `src/app/globals.css`（过渡动画样式）
  - `src/components/layout/`（Navbar/AppShell交互优化）
  - `src/components/home/`（首页骨架重构）
  - `src/lib/cn.ts`（新增公共工具）
  - `src/middleware.ts`（新增路由保护）
  - `src/app/marketplace/page.tsx`（新增占位页）
  - `src/app/artifacts/page.tsx`（新增占位页）
  - `next.config.ts`（next/image配置）
  - `prisma/schema.prisma`（如需新增字段）

## ADDED Requirements

### Requirement: 路由级加载骨架屏
系统 SHALL 在所有主要路由段提供 `loading.tsx` 文件，在路由切换时立即显示骨架屏而非白屏或旧内容。

#### Scenario: 路由切换显示骨架屏
- **WHEN** 用户从 /dashboard 导航到 /admin
- **THEN** 立即显示 admin 路由段的骨架屏（侧栏+内容区骨架），数据加载完成后流式替换为实际内容

### Requirement: 页面过渡动画
系统 SHALL 使用 View Transitions API 实现页面切换的平滑过渡，在支持的浏览器中自动启用，不支持的浏览器降级为无动画。

#### Scenario: 页面过渡
- **WHEN** 用户点击导航链接
- **THEN** 当前页面淡出、新页面淡入，过渡持续时间 ≤ 200ms，不阻塞导航

### Requirement: 路由级错误边界
系统 SHALL 在 /dashboard、/admin、功能页（/chat、/workspace）分别提供 `error.tsx`，单个页面出错不影响其他路由段。

#### Scenario: 页面错误隔离
- **WHEN** /admin/users 页面因API错误崩溃
- **THEN** 显示admin路由级错误页面（含重试按钮），/dashboard、/chat等路由不受影响

### Requirement: 首页骨架升级
系统 SHALL 重构首页为以下板块结构（参考竞品最佳实践）：
1. Hero区（大标题+副标题+CTA+NEW标签轮播）
2. 数据大字号展示区（用户数/工作流数/生成次数）
3. 工作流分类（动词化命名+卡片墙）
4. 多场景演示（参考扣子多Agent协作演示，占位）
5. 定价预览+价格计算器入口
6. 用户评价墙（参考Dify推文墙，占位）
7. CTA区+Footer

#### Scenario: 首页滚动叙事
- **WHEN** 用户滚动首页
- **THEN** 每个section进入视口时触发stagger交错淡入动画，形成从产品到数据到场景到定价到社区的叙事流

### Requirement: 工作流市场（占位）
系统 SHALL 提供 /marketplace 路由，展示工作流市场页面，含分类导航、搜索栏、工作流卡片网格（含封面/标题/作者/评分/使用次数）。数据从 /api/workflow/list 获取。

#### Scenario: 浏览工作流市场
- **WHEN** 用户访问 /marketplace
- **THEN** 显示工作流卡片网格，支持按分类筛选和搜索

### Requirement: Artifacts工作空间（占位）
系统 SHALL 提供 /artifacts 路由，展示用户生成内容的Artifacts工作空间（占位页面，展示示例卡片+"即将上线"提示）。

#### Scenario: 访问Artifacts
- **WHEN** 用户访问 /artifacts
- **THEN** 显示占位页面，含示例Artifacts卡片和"功能即将上线"提示

### Requirement: OSS STS直传
系统 SHALL 使用STS临时凭证实现前端直传OSS，不再经服务端中转文件上传。

#### Scenario: 用户上传头像
- **WHEN** 用户上传头像
- **THEN** 前端先请求 /api/oss/sts 获取临时凭证，然后直接上传到OSS，服务端不中转文件数据

### Requirement: 火山方舟错误码退避重试
系统 SHALL 对火山方舟API调用实现429/5xx错误的自动指数退避重试（最多3次，初始延迟1s）。

#### Scenario: API限流自动重试
- **WHEN** 火山方舟返回429限流
- **THEN** 自动等待1s后重试，最多重试3次，超出后返回友好错误提示

## MODIFIED Requirements

### Requirement: 字体加载
系统使用 `next/font/google` 自托管 Inter 字体（含子集化），替代当前的 Google Fonts CDN `<link>` 同步加载，消除渲染阻塞。

### Requirement: 图片优化
系统统一使用 `next/image` 组件替代原生 `<img>`，自动生成WebP/AVIF格式和响应式尺寸。

### Requirement: 路由保护
系统通过 `middleware.ts` 统一在边缘层进行路由保护，对 /dashboard、/admin、/chat、/workspace 等需登录路由统一检查JWT，替代各页面/API各自的 `requireAuth`。

### Requirement: className工具
系统提供 `src/lib/cn.ts` 公共工具函数 `cx(...inputs)` 用于className条件拼接，各组件统一引用，消除重复定义。

## 硬件约束
- 当前：阿里云 ECS 2核4G，50G ESSD，成都地域
- 本次优化**不增加硬件成本**，所有改动在现有2核4G上完成
- OSS STS直传改造会**降低**ECS带宽和内存压力
- Server Components迁移会**降低**客户端JS体积
- 升级触发条件：DAU>500 → 4核8G（+400元/年）

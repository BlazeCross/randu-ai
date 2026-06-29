# 燃渡AI 网站平台架构分析报告

> 分析日期：2026-06-29
> 项目路径：`c:\Users\Vik\Desktop\燃渡AI网站`
> 项目名称：`randu-ai-workflow`（v0.1.0）

---

## 一、技术栈分析

### 1.1 核心框架与运行时

| 技术 | 版本 | 说明 |
|------|------|------|
| Next.js | 16.2.9 | App Router 架构，使用 Turbopack；存在破坏性 API 变更（见 AGENTS.md 约束） |
| React | 19.2.4 | 配合 Next.js 16 使用 |
| TypeScript | ^5 | 全量类型覆盖 |
| Tailwind CSS | ^4 | 通过 `@tailwindcss/postcss` 集成；使用 `@theme inline` 映射设计 token |
| Node.js | 20（Alpine） | Docker 运行时基镜像 |

### 1.2 数据与存储

| 技术 | 版本 | 说明 |
|------|------|------|
| Prisma | ^6.19.3 | ORM，`prisma-client-js` 生成器 |
| PostgreSQL | 16-alpine | 主数据库，Docker 容器化部署 |
| 阿里云 OSS | ali-oss ^6.23.0 | 图片/文件存储（封面、头像、轮播图等） |

### 1.3 第三方服务集成

| 依赖 | 版本 | 用途 |
|------|------|------|
| alipay-sdk | ^4.14.0 | 支付宝支付（订单、订阅、积分购买） |
| jsonwebtoken | ^9.0.3 | JWT 认证签发与校验 |
| bcryptjs | ^3.0.3 | 用户密码哈希 |
| effect | ^3.21.0 | 函数式编程库（@prisma/config 依赖） |
| Coze API | — | Coze 工作流执行引擎（`COZE_*` 环境变量） |
| 火山方舟（Volcengine） | — | 豆包文案生成 / Seedream 文生图 / Seedance 视频生成（`VOLC_ARK_API_KEY` 等） |

### 1.4 部署方式

采用 **Docker Compose + Volume Mount** 双服务编排：

- **db 服务**：`postgres:16-alpine`，数据持久化到 `postgres_data` 命名卷；仅 `127.0.0.1:5432` 本机暴露；`mem_limit: 1g`。
- **app 服务**：`node:20-alpine` 镜像 + 主机代码 volume mount（`./:/app`），避免国内服务器 `npm ci` 卡死；启动时执行 `npm install → prisma generate → build → start`；`mem_limit: 2g`。
- 另有 `Dockerfile` 实现 3 阶段多阶段构建（deps → builder → runner，standalone 模式），使用非 root 用户运行，但生产实际走 compose volume 方案。
- 配套脚本：`scripts/backup-db.sh`（数据库备份）、`scripts/expire-credits.sh`（积分过期定时任务）、`scripts/monitor.sh`（监控）。
- `next.config.ts` 关键配置：`serverExternalPackages: ["ali-oss"]`、`reactStrictMode`、`poweredByHeader: false`、`compress: true`。

### 1.5 SDK 生态

项目对外提供多语言 SDK，位于 `sdks/` 目录：

- `sdks/nodejs/randu-ai.js` — Node.js SDK
- `sdks/python/randu_ai/` — Python SDK（`client.py`）
- 对应 OpenAPI 规范：`docs/coze-plugin-openapi.yaml` 与 `/api/docs/openapi.json` 动态接口

---

## 二、页面结构分析

基于 `src/app/` 目录的 App Router 约定路由。页面分为两类布局模式：
- **展示页**（模式 A）：使用全局 `Navbar`，首页/登录/注册/定价等
- **功能页**（模式 B）：使用 `AppShell`（左侧栏 + 低调顶栏），智能体/工作流/学院子页等

### 2.1 公开页面（无需登录）

| 路由 | 文件 | 说明 |
|------|------|------|
| `/` | `src/app/page.tsx` | 首页：轮播图 + 工作流分类 + 广告 + 定价 + 页脚 |
| `/login` | `src/app/login/page.tsx` | 登录页 |
| `/register` | `src/app/register/page.tsx` | 注册页 |
| `/pricing` | `src/app/pricing/page.tsx` | 定价页 |
| `/credits` | `src/app/credits/page.tsx` | 积分购买页 |
| `/academy` | `src/app/academy/page.tsx` | 燃渡学院首页（展示页，含 FAQAccordion） |
| `/academy/articles` | `src/app/academy/articles/page.tsx` | 图文教程列表（功能页布局） |
| `/academy/videos` | `src/app/academy/videos/page.tsx` | 视频教程列表（功能页布局） |
| `/courses` | `src/app/courses/page.tsx` | 课程页 |
| `/tutorial` | `src/app/tutorial/page.tsx` | 教程页（功能页布局） |
| `/docs` | `src/app/docs/page.tsx` | 文档中心（含独立 layout） |
| `/api-docs` | `src/app/api-docs/page.tsx` | API 文档公开页 |
| `/welcome` | `src/app/welcome/page.tsx` | 注册后欢迎页 |

### 2.2 功能页面（需登录）

| 路由 | 文件 | 说明 |
|------|------|------|
| `/chat` | `src/app/chat/page.tsx` | 智能体对话页（AppShell 布局） |
| `/workspace` | `src/app/workspace/page.tsx` | 工作台：工作流浏览（AppShell 布局） |
| `/workspace/[id]/use` | `src/app/workspace/[id]/use/page.tsx` | 工作流使用页 |
| `/workflow/[id]` | `src/app/workflow/[id]/page.tsx` | 工作流详情/执行页 |

### 2.3 用户中心（`/dashboard/*` 系列）

| 路由 | 文件 | 说明 |
|------|------|------|
| `/dashboard` | `src/app/dashboard/page.tsx` | 个人中心首页：资料卡 + 订阅状态 + 使用记录 |
| `/dashboard/profile` | `src/app/dashboard/profile/page.tsx` | 编辑个人资料 |
| `/dashboard/history` | `src/app/dashboard/history/page.tsx` | 任务历史 |
| `/dashboard/orders` | `src/app/dashboard/orders/page.tsx` | 订单管理 |
| `/dashboard/keys` | `src/app/dashboard/keys/page.tsx` | API Key 管理 |
| `/dashboard/api-docs` | `src/app/dashboard/api-docs/page.tsx` | API 文档（含 ApiDocsClient 组件） |
| `/dashboard/invite` | `src/app/dashboard/invite/page.tsx` | 邀请奖励 |
| `/dashboard/notifications` | `src/app/dashboard/notifications/page.tsx` | 通知中心 |

### 2.4 管理后台（`/admin/*` 系列，需 admin+ 权限）

| 路由 | 文件 | 说明 |
|------|------|------|
| `/admin` | `src/app/admin/page.tsx` | 数据概览 |
| `/admin/workflows` | `src/app/admin/workflows/page.tsx` | 工作流列表管理 |
| `/admin/workflows/new` | `src/app/admin/workflows/new/page.tsx` | 新建工作流 |
| `/admin/workflows/[id]/edit` | `src/app/admin/workflows/[id]/edit/page.tsx` | 编辑工作流 |
| `/admin/carousel` | `src/app/admin/carousel/page.tsx` | 轮播图管理 |
| `/admin/tutorials/articles` | `src/app/admin/tutorials/articles/page.tsx` | 图文教程管理 |
| `/admin/tutorials/videos` | `src/app/admin/tutorials/videos/page.tsx` | 视频教程管理 |
| `/admin/users` | `src/app/admin/users/page.tsx` | 用户列表 |
| `/admin/users/[id]` | `src/app/admin/users/[id]/page.tsx` | 用户详情 |
| `/admin/orders` | `src/app/admin/orders/page.tsx` | 订单管理 |
| `/admin/keys` | `src/app/admin/keys/page.tsx` | Key 总览 |
| `/admin/cost` | `src/app/admin/cost/page.tsx` | 成本核算 |
| `/admin/retention` | `src/app/admin/retention/page.tsx` | 留存分析 |
| `/admin/notifications` | `src/app/admin/notifications/page.tsx` | 公告管理 |
| `/admin/action-logs` | `src/app/admin/action-logs/page.tsx` | 操作日志 |
| `/admin/export` | `src/app/admin/export/page.tsx` | 数据导出 |

### 2.5 全局特殊文件

| 文件 | 作用 |
|------|------|
| `src/app/layout.tsx` | 根布局：Provider 注入、主题脚本、SEO metadata |
| `src/app/globals.css` | 全局样式与设计系统 |
| `src/app/error.tsx` | 全局运行时错误边界（500） |
| `src/app/not-found.tsx` | 全局 404 页面 |
| `src/app/robots.ts` | 自动生成 `/robots.txt` |
| `src/app/sitemap.ts` | 动态生成 `/sitemap.xml`（含工作流详情页） |

---

## 三、组件架构分析

组件按职能分目录组织，位于 `src/components/`。

### 3.1 布局组件（`layout/`）

| 组件 | 说明 |
|------|------|
| `Navbar.tsx` | 全局导航栏（展示页使用）：Logo + 导航 + 在线人数 + 通知 + 用户菜单；功能页路由自动隐藏并降为 48px 占位 |
| `AppShell.tsx` | 功能页布局（模式 B）：左侧栏（248px 可收起）+ 低调顶栏（48px）+ 主内容区 |
| `NotificationBell.tsx` | 通知铃铛（未读计数 + 下拉列表） |
| `OnlineCount.tsx` | 实时在线人数显示 |

### 3.2 首页组件（`home/`）

| 组件 | 说明 |
|------|------|
| `HeroCarousel.tsx` | 首页主轮播图（数据来自 CarouselSlide 模型） |
| `HeroSection.tsx` | 首页主视觉区块 |
| `WorkflowCategories.tsx` | 工作流分类展示 |
| `PricingSection.tsx` | 定价套餐区块 |
| `AdBanner.tsx` | 广告横幅 |
| `AnnouncementBanner.tsx` | 公告横幅 |
| `Footer.tsx` | 页脚 |

### 3.3 UI 基础组件（`ui/`）

| 组件 | 说明 |
|------|------|
| `Button.tsx` / `Badge.tsx` / `Card.tsx` | 基础原子组件 |
| `Avatar.tsx` | 头像（含首字母兜底） |
| `Skeleton.tsx` | 骨架屏（含 SkeletonText、SkeletonListItem、SkeletonCard） |
| `Toast.tsx` | 全局通知（ToastProvider） |
| `Popover.tsx` | 气泡弹出层 |
| `ThemeToggle.tsx` | 暗色/亮色切换 |
| `UserQuickMenu.tsx` | 用户快捷菜单（头像+套餐+积分，悬浮展开功能面板） |
| `ErrorMessage.tsx` | 错误提示组件 |
| `GlowCard.tsx` | 品牌光晕卡片 |
| `GradientText.tsx` | 渐变文字 |
| `ScrollReveal.tsx` | 滚动入场动画 |
| `SectionHeader.tsx` | 区块标题 |

### 3.4 管理后台组件（`admin/`）

| 组件 | 说明 |
|------|------|
| `AdminSidebar.tsx` | 后台侧边栏导航（桌面固定 + 移动抽屉） |
| `WorkflowForm.tsx` | 工作流表单（新建/编辑） |
| `SchemaBuilder.tsx` | 工作流输入参数 Schema 构建器 |
| `TutorialManager.tsx` | 教程内容管理器 |

### 3.5 其他组件

| 目录/组件 | 说明 |
|------|------|
| `providers/AuthProvider.tsx` | 客户端 Auth Provider 包装（包裹 `lib/auth-context`） |
| `providers/ThemeProvider.tsx` | 主题 Provider |
| `common/CustomerServiceButton.tsx` | 客服悬浮按钮 |
| `common/UserOnboarding.tsx` | 用户引导 |
| `dashboard/SubscriptionCard.tsx` | 订阅状态卡片 |
| `upgrade/UpgradePrompt.tsx` | 升级套餐弹窗 |
| `upload/ImageUploader.tsx` | 图片上传组件 |
| `workflow/DynamicForm.tsx` | 工作流动态表单（基于 inputSchema 渲染） |
| `PageViewTracker.tsx` | 页面浏览埋点 |

---

## 四、数据库模型分析

基于 `prisma/schema.prisma`，数据库为 PostgreSQL，共 12 个模型。

### 4.1 核心模型字段表

#### User（用户表，`users`）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | String (uuid) | 主键 |
| email / phone | String? | 登录凭证（二选一，均唯一） |
| passwordHash | String | 密码哈希 |
| role | String | `user` / `admin` / `super_admin` |
| nickname / avatar | String? | 昵称、头像 |
| status | String | `active` / `blocked` |
| trialExpiresAt | DateTime | 试用到期时间 |
| isSubscribed / subscriptionPlan | Boolean / String? | 订阅状态与套餐 |
| credits | Int | 积分余额 |
| creditsExpiresAt / creditsExpired | DateTime? / Boolean | 积分过期机制 |
| totalUsed | Int | 累计使用量 |
| inviteCode / inviterId / inviteCount / inviteReward | — | 邀请裂变体系 |
| createdAt / updatedAt | DateTime | 时间戳 |

关系：自引用 `UserInvite`（邀请人/被邀请人）、关联 ApiKey、Order、UsageLog、CallLog、Notification、ActionLog、EventLog。

#### Workflow（工作流表，`workflows`）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | String (uuid) | 主键 |
| name / description / category | String / String? | 名称、描述、分类 |
| cozeWorkflowId | String | Coze 工作流 ID |
| coverImage | String? | 封面图 |
| inputSchema | Json? | 输入参数 Schema（驱动动态表单） |
| outputType | String | 输出类型（默认 text） |
| creditsRequired | Int | 单次消耗积分 |
| source | String | `coze` / `volcengine` |
| volcModel | String? | 火山模型标识 |
| icon | String? | 图标 |
| status | String | `active` 等 |
| isDeleted | Boolean | 软删除 |
| feishuDocUrl | String? | 飞书文档链接 |
| sortOrder | Int | 排序权重 |

#### Order（订单表，`orders`）

| 字段 | 类型 | 说明 |
|------|------|------|
| id / orderNo | String | 主键 / 唯一订单号 |
| userId | String | 关联用户 |
| type | String | `subscription` / `credits` |
| planId | String? | 关联套餐 |
| credits | Int | 积分数 |
| amount | Decimal(10,2) | 金额 |
| status | String | `pending` / `paid` / `failed` / `refunded` |
| paymentMethod / paymentId | String? | 支付方式与流水号 |
| paidAt | DateTime? | 支付时间 |
| refundStatus / refundReason / refundedAt / refundAmount | — | 退费体系 |

#### ApiKey（API Key 表，`api_keys`）

| 字段 | 类型 | 说明 |
|------|------|------|
| id / userId | String | 主键 / 关联用户 |
| keyPrefix / keyHash | String | 前缀（展示用）/ 哈希（存储用） |
| name / status | String | 名称 / `active`/`inactive`/`revoked` |
| creditsUsed / totalCalls | Int | 已用积分 / 总调用数 |
| lastUsedAt / expiresAt | DateTime? | 最后使用 / 过期时间 |
| qpsLimit / dailyLimit / dailyUsed / dailyResetAt | — | 频率限制（QPS + 每日限额） |
| webhookUrl / webhookSecret | String? | Webhook 回调配置 |

#### Notification（通知表，`notifications`）

| 字段 | 类型 | 说明 |
|------|------|------|
| id / userId | String | 主键 / 关联用户 |
| type | String | `task_complete` / `system` / `announcement` |
| title / content / link | — | 标题、内容、跳转链接 |
| isRead | Boolean | 已读状态 |
| createdAt | DateTime | 创建时间 |

### 4.2 内容运营模型

| 模型 | 表名 | 说明 |
|------|------|------|
| `CarouselSlide` | `carousel_slides` | 首页轮播图（title/image/link/badge/sortOrder/published） |
| `Tutorial` | `tutorials` | 图文+视频教程（type=article/video、cover、content、videoUrl、accessLevel=free/vip、studyCount/viewCount） |
| `Plan` | `plans` | 套餐计划（dailyLimit、monthlyPrice、features JSON） |

### 4.3 日志与审计模型

| 模型 | 表名 | 说明 |
|------|------|------|
| `UsageLog` | `usage_logs` | 工作流使用记录（状态、token、输入/输出URL、积分消耗、source=direct/api、缩略图） |
| `CallLog` | `call_logs` | API 调用日志（endpoint、method、creditsCost、apiCost 成本核算、responseTime、clientIp） |
| `ActionLog` | `action_logs` | 管理操作审计（operator/target、action=block/update_credits 等、ipAddress） |
| `EventLog` | `event_logs` | 用户行为埋点（event=page_view/button_click/workflow_run 等、properties JSON） |

### 4.4 索引设计

各模型均配置了合理的复合索引，例如：
- `User`：`@@index([inviterId])`
- `CallLog`：`@@index([apiKeyId, createdAt])`、`@@index([userId, createdAt])`
- `Order`：`@@index([userId, createdAt])`、`@@index([status])`、`@@index([planId])`
- `UsageLog`：`@@index([userId, createdAt])`、`@@index([userId, status])`、`@@index([workflowId])`
- `Notification`：`@@index([userId, isRead, createdAt])`
- `EventLog`：`@@index([userId, createdAt])`、`@@index([event, createdAt])`

---

## 五、API 接口分析

接口位于 `src/app/api/`，采用 Next.js Route Handler（`route.ts`）。鉴权通过 `Authorization: Bearer <token>` 头，由 `src/lib/auth.ts` 解析 JWT。

### 5.1 认证接口（`/api/auth/*`）

| 路由 | 方法 | 说明 |
|------|------|------|
| `/api/auth/login` | POST | 登录（邮箱/手机+密码） |
| `/api/auth/register` | POST | 注册 |

### 5.2 工作流接口（`/api/workflow/*`、`/api/workflow/list`）

| 路由 | 方法 | 说明 |
|------|------|------|
| `/api/workflow/list` | GET | 公开工作流列表（支持 category/search/分页，CDN 缓存 60s） |
| `/api/workflow/[id]` | GET | 工作流详情 |
| `/api/workflow/[id]/run` | POST | 执行工作流（需登录） |

### 5.3 用户接口（`/api/user/*`）

| 路由 | 方法 | 说明 |
|------|------|------|
| `/api/user/profile` | GET/PUT | 获取/更新个人资料 |
| `/api/user/avatar` | POST | 上传头像 |
| `/api/user/usage` | GET | 使用记录与试用状态 |
| `/api/user/invite` | GET | 邀请信息与奖励 |

### 5.4 API Key 接口（`/api/keys/*`）

| 路由 | 方法 | 说明 |
|------|------|------|
| `/api/keys` | GET/POST | 列表 / 创建 Key |
| `/api/keys/[id]` | GET/PATCH/DELETE | 详情 / 更新 / 删除 |
| `/api/keys/[id]/logs` | GET | Key 调用日志 |

### 5.5 支付与订单接口（`/api/payment/*`、`/api/orders`）

| 路由 | 方法 | 说明 |
|------|------|------|
| `/api/payment/packages` | GET | 可购套餐/积分包 |
| `/api/payment/create` | POST | 创建支付订单（支付宝） |
| `/api/payment/callback` | POST | 支付宝异步回调 |
| `/api/orders` | GET | 我的订单列表 |

### 5.6 外部 API 接口（`/api/external/*`，供第三方 SDK 调用）

| 路由 | 方法 | 说明 |
|------|------|------|
| `/api/external/key/verify` | POST | 校验 API Key |
| `/api/external/user/usage` | GET | 查询额度 |
| `/api/external/generate/image` | POST | 文生图 |
| `/api/external/generate/video` | POST | 视频生成（异步） |
| `/api/external/generate/video/status` | GET | 视频任务状态 |
| `/api/external/generate/copy` | POST | 文案生成 |
| `/api/external/webhook/volcengine` | POST | 火山方舟 Webhook 回调 |

### 5.7 管理后台接口（`/api/admin/*`，需 admin 权限）

| 路由 | 说明 |
|------|------|
| `/api/admin/workflows` / `[id]` / `[id]/cover` | 工作流 CRUD + 封面上传 |
| `/api/admin/users` / `[id]` | 用户管理 |
| `/api/admin/orders` / `[id]/refund` | 订单 + 退费 |
| `/api/admin/keys` | Key 总览 |
| `/api/admin/carousel` / `[id]` | 轮播图管理 |
| `/api/admin/tutorials` / `[id]` | 教程管理 |
| `/api/admin/notifications` | 公告管理 |
| `/api/admin/action-logs` | 操作日志 |
| `/api/admin/export` | 数据导出 |
| `/api/admin/stats/overview` | 概览统计 |
| `/api/admin/stats/cost` | 成本统计 |
| `/api/admin/stats/online` | 在线统计 |
| `/api/admin/stats/retention` | 留存统计 |

### 5.8 其他公共接口

| 路由 | 说明 |
|------|------|
| `/api/chat` | 智能体对话（SSE 流式） |
| `/api/history` | 对话历史 |
| `/api/notifications` / `[id]` / `announcement` | 通知 |
| `/api/task/[id]/status` | 异步任务状态轮询 |
| `/api/upload` | 通用文件上传 |
| `/api/track` | 行为埋点上报 |
| `/api/heartbeat` | 在线心跳上报（30s） |
| `/api/invite/verify` | 邀请码校验 |
| `/api/health` | 健康检查 |
| `/api/carousel` | 公开轮播图列表 |
| `/api/tutorials` / `[id]` | 公开教程列表/详情 |
| `/api/docs/openapi.json` | 动态 OpenAPI 规范 |

---

## 六、样式系统分析

### 6.1 设计系统概况

采用自研设计系统 **v2.0**（基于 Doubao Design Library 风格），核心理念：**极简、冷调、技术感、平静**。设计原则为"边框优先于阴影、紧凑仪表盘密度、单一圆角 token"。

### 6.2 CSS 设计 Token（`:root`）

通过 `@theme inline` 将 CSS 变量映射为 Tailwind v4 工具类：

| 类别 | 主要 Token |
|------|-----------|
| 核心表面 | `--background`、`--foreground`、`--card`、`--popover` |
| 语义品牌 | `--primary`(#0065fd)、`--secondary`、`--muted`、`--accent`、`--destructive` |
| 数据可视化 | `--chart-1` ~ `--chart-5`（蓝色梯度） |
| 侧栏 | `--sidebar`、`--sidebar-primary`、`--sidebar-accent`、`--sidebar-border` |
| 字体 | `--font-sans`(Inter)、`--font-serif`、`--font-mono`(JetBrains Mono) |
| 圆角 | `--radius`(1.2rem)、`--radius-sm`(10px)、`--radius-lg`(14px)、`--radius-full`(999px) |
| 阴影系统 | `--shadow-xs` ~ `--shadow-xl`（5 级） |
| 品牌光晕 | `--glow-primary`、`--glow-primary-strong` |
| 玻璃拟态 | `--glass-bg`、`--glass-border`、`--glass-blur`(20px) |
| 过渡系统 | `--duration-instant`(90ms) ~ `--duration-slower`(800ms) |
| 缓动曲线 | `--ease-default`、`--ease-spring`(带回弹) 等 5 种 |
| 中性灰梯度 | `--color-neutral-50` ~ `--color-neutral-900` |

### 6.3 暗色模式实现

- 触发方式：手动控制，由 `html.dark` 类触发（`ThemeProvider` + 内联 `themeScript` 读取 `localStorage` 避免闪烁）。
- 暗色下覆盖 `bg-white`、`bg-white/80` 等大量现有组件使用的工具类（`!important` 强制）。
- 暗色专属 token：4 级表面层级（`--card` #12161c）、提亮的 primary（#60a5fa）、增强阴影、降低玻璃透明度。
- `themeColor` viewport 同时配置亮/暗两套颜色。

### 6.4 动画与过渡

已定义丰富的关键帧动画，均尊重 `prefers-reduced-motion`：

| 动画类 | 用途 |
|--------|------|
| `animate-fade-in` / `animate-fade-up` / `animate-fade-scale` | 元素入场 |
| `animate-scale-in` | 弹窗入场 |
| `animate-slide-in-left` / `slide-in-right` | 侧栏滑入 |
| `animate-expand` | 下拉/手风琴展开 |
| `animate-pulse-glow` | CTA 按钮 focus 光晕 |
| `animate-shimmer` | 骨架屏流光 |
| `animate-toast-in` / `toast-out` | Toast 进出 |
| `animate-message-in` | 对话消息气泡 |
| `animate-carousel-fade` | 轮播图淡入 |
| `animate-workflow-progress` | 任务进度条 |
| `animate-count-up` | 数字计数 |
| `stagger-1` ~ `stagger-10` | 交错入场延迟 |
| `tap-feedback` | 触摸反馈（scale 0.97） |

---

## 七、当前问题识别

通过代码阅读，识别以下潜在问题与优化点：

### 7.1 页面跳转体验

- **无页面过渡动画**：未启用 Next.js View Transitions API，也未引入路由级过渡包装。页面切换为硬切，缺乏平滑感。
- **无路由级加载状态（`loading.tsx`）**：全站 `src/app/` 下**未发现任何 `loading.tsx` 文件**。路由切换时旧页面会停留直至新页面客户端逻辑完成，可能产生白屏或卡顿感。
- 功能页（AppShell）与展示页（Navbar）布局切换时，因 `Navbar` 通过 `pathname` 判断是否渲染功能页顶栏，存在高度从 `h-16` 到 `h-12` 的跳变，无过渡。

### 7.2 加载状态处理

- **加载态实现不统一**：
  - 部分页面用 `animate-spin` 全屏 spinner（如 `dashboard/page.tsx`、`admin/layout.tsx`）。
  - 部分列表用 `Skeleton` 骨架屏（如 dashboard 使用记录、`SkeletonListItem`）。
  - 缺乏统一的 Suspense 约定，未利用 Next.js `loading.tsx` 流式渲染能力。
- **客户端鉴权守卫存在闪烁**：`admin/layout.tsx` 在 `loading` 时显示 spinner，权限不足时 `return null`，但仍依赖 `useEffect` 触发 `router.replace`，首帧可能短暂渲染空内容。

### 7.3 错误状态处理

- **仅有全局 `error.tsx`**：`src/app/error.tsx` 捕获整个子树错误，但**无按路由段的细分 `error.tsx`**（如 `dashboard/error.tsx`、`admin/error.tsx`），单个页面出错会波及整个布局。
- 错误仅 `console.error`，**未接入远程错误上报**（Sentry 等）。
- API 接口错误返回格式不统一，部分返回 `{ message }`，部分返回 `{ error }`，前端需分别处理。

### 7.4 移动端适配

- Navbar 移动端汉堡菜单已实现，但展开使用 `animate-expand`（固定 `max-height: 500px`），内容过多时可能被裁切。
- AppShell 移动端侧栏遮罩已实现，但侧栏宽度固定 248px 在小屏可能偏窄。
- 部分表格类页面（admin 列表）在移动端横向滚动体验待验证。

### 7.5 SEO 优化

**已具备良好基础**：
- `layout.tsx` 配置完整 `metadata`（title template、description、keywords、OpenGraph、Twitter Card、robots）。
- `robots.ts` 正确禁止收录需登录路径。
- `sitemap.ts` 动态包含工作流详情页。
- 首页有 JSON-LD 结构化数据（WebSite + SearchAction）。

**待改进**：
- 工作流详情页 `/workflow/[id]` 等动态页缺少独立的 `generateMetadata`（仅依赖根 layout 默认值）。
- 教程详情页等内容型页面缺少结构化数据（Article JSON-LD）。
- OpenGraph 缺少 `images` 字段，社交分享无预览图。

### 7.6 性能优化点

- **Google Fonts 渲染阻塞**：`layout.tsx` 通过 `<link>` 同步加载 Inter 字体（含 7 个字重 400-900），未使用 `font-display: swap` 之外的高级优化（如 `next/font` 自托管）。`preconnect` 已配置但字体请求仍较大。
- **微噪点纹理 `body::before`**：固定定位 SVG 全屏覆盖，`z-index: 9999`，虽 `pointer-events: none` 但始终参与合成层，移动端可能有额外合成开销。
- **客户端数据获取为主**：大量页面为 `"use client"` + `useEffect` + `fetch` 模式（如 `dashboard/page.tsx`），未充分利用 Server Components 与 Server Actions 直出数据，首屏需额外往返请求。
- **图片未统一优化**：Navbar Logo、各处封面图使用原生 `<img>`（见 `eslint-disable @next/next/no-img-element` 注释），未使用 `next/image` 自动优化与懒加载。
- **Prisma 连接**：`DATABASE_URL` 设置 `connection_limit=5`，适合小规模，并发增长时需关注。
- **无 loading.tsx 导致无法利用流式 SSR**：数据密集页面无法在服务端等待时先吐出骨架。

### 7.7 架构与代码组织

- `cx()` className 拼接工具在多个组件内重复定义（`Navbar.tsx`、`AppShell.tsx` 等），未抽取为公共工具。
- 鉴权为纯客户端 JWT（`lib/auth.ts` 解析 Bearer token），无 Next.js 中间件（middleware.ts）层级的统一路由保护，每个受保护页面/API 需各自调用 `requireAuth`/`requireAdmin`。

---

## 八、总结

燃渡AI 是一个功能完整的 **AI 工作流 SaaS 平台**，技术栈现代化（Next.js 16 + React 19 + Prisma 6 + PostgreSQL 16 + Tailwind v4），已具备：

- 完整的用户体系（注册/登录/JWT/试用/订阅/积分/邀请裂变）
- 丰富的 AI 能力集成（Coze 工作流、火山方舟文生图/视频/文案、智能体对话）
- 开放 API 与多语言 SDK（Node.js / Python）
- 完善的管理后台（用户/订单/工作流/内容/成本/留存/日志/导出）
- 运营内容管理（轮播图、图文/视频教程）
- 支付闭环（支付宝当面付 + 退费）+ 成本核算

设计系统成熟（v2.0 设计 token、暗色模式、丰富动画），SEO 基础扎实。主要改进空间集中在**路由级加载与过渡体验**（缺失 `loading.tsx` 体系与 View Transitions）、**错误边界细化**、**Server Components 利用不足**、**字体与图片性能优化**等方面。

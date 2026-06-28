# 燃渡AI 平台 · 大版本 UI 升级 · Design 模式开发规则

> **本文档供 TRAE Design 模式执行大版本 UI 升级使用。请在开始任何修改前完整、逐字阅读本文档，并严格遵守所有红线规则。**
>
> 本次升级属于**质量级版本升级**：仅修改 UI 设计、组件效果、页面布局、点击动效、视觉动效、切换动效等"纯视觉层"。**任何功能、数据、行为、路由、API、业务逻辑都不允许改变。**

---

## 一、绝对红线（ABSOLUTE RULES · 不可触碰）

以下规则没有任何例外。违反任意一条即视为本次升级失败，必须回滚。

### 1.1 禁止修改的目录与文件（功能性代码）

下表中的文件**功能性代码**（指 hooks、state、effect、事件处理器、API 调用、条件渲染、逻辑分支、类型定义、配置项）严禁改动。仅允许调整其中的 `className` 字符串与纯视觉的 JSX 结构。

| 类别 | 路径 | 说明 |
|---|---|---|
| API 路由 | `src/app/api/**` | 所有后端接口（鉴权、工作流、支付、上传、后台管理、外部集成、webhook 等） |
| 数据库层 | `prisma/schema.prisma`、`src/lib/prisma.ts` | 数据模型与 Prisma 客户端单例 |
| 鉴权 | `src/lib/auth.ts`、`src/lib/auth-context.tsx`、`src/hooks/useAuth.ts`、`src/components/providers/AuthProvider.tsx` | 登录态、JWT、会话 |
| 第三方集成 | `src/lib/coze.ts`、`src/lib/volcengine.ts`、`src/lib/alipay.ts`、`src/lib/oss.ts`、`src/lib/webhook.ts` | Coze、火山方舟、支付宝、OSS、webhook |
| 业务规则 | `src/lib/invite.ts`、`src/lib/creditsExpiry.ts`、`src/lib/notification.ts`、`src/lib/online.ts`、`src/lib/analytics.ts`、`src/lib/moderation.ts`、`src/lib/userAntiAbuse.ts`、`src/lib/rateLimit.ts`、`src/lib/ipRateLimit.ts` | 邀请、积分、通知、在线、埋点、内容审核、防刷、限流 |
| Schema 与规则 | `src/lib/schema.ts`、`src/lib/plans.ts`、`src/lib/trial.ts`、`src/lib/openapi.ts`、`src/lib/apiKey.ts`、`src/lib/csv.ts`、`src/lib/imageValidation.ts` | 输入校验、套餐规则、试用、OpenAPI、API Key、CSV、图片校验 |
| 客户端埋点 | `src/lib/analytics-client.ts` | 客户端埋点函数（必须保留与 `analytics.ts` 的分离状态，**不得反向引入服务端模块**） |
| 路由结构 | `src/app/` 下目录结构 | 不得新增/删除/移动/重命名任何路由目录；已有的重定向页（`/courses`、`/docs`、`/api-docs`）必须保留 |
| 配置 | `next.config.ts`、`tailwind.config.ts`、`postcss.config.mjs`、`tsconfig.json`、`package.json`、`docker-compose.yml`、`.env*` | 构建与部署配置 |
| 公共资源 | `public/logo.png`、`public/favicon.png`、`public/icons/*.svg` | LOGO、favicon、图标资源**不得替换或删除**（允许新增资源） |

### 1.2 禁止修改的功能行为（即使在允许改 className 的文件中）

下述行为属于"功能"，**绝对不能改变**：

- **鉴权守卫**：所有需要登录的页面（`/dashboard/**`、`/chat`、`/workspace/[id]/use`、`/admin/**`、`/dashboard/api-docs`）必须保留未登录跳转 `/login` 的逻辑
- **角色守卫**：`/admin/**` 必须保留仅 `admin`/`super_admin` 可访问的判断
- **API 调用**：每个页面的 fetch 调用、请求参数（含 header、body、Authorization）、响应处理逻辑不得改变
- **状态管理**：所有 `useState`、`useEffect`、`useCallback`、`useRef`、`useMemo` 的依赖数组、触发条件、副作用不得改变
- **事件处理器**：`onClick`、`onChange`、`onSubmit`、`onKeyDown` 等处理函数的语义不得改变
- **条件渲染**：`loading`、`error`、`empty`、未登录、未授权、试用过期、积分不足等状态的渲染分支不得删除或合并
- **表单字段**：所有 `input` 的 `name`、`type`、`required`、`pattern`、`minLength`、`maxLength`、验证规则不得改变
- **路由跳转**：所有 `router.push`、`router.replace`、`<Link href>` 的目标路径不得改变
- **localStorage 键名**：以下键名**不得改变**，键名一改历史数据丢失：
  - `randu-chat-history`（智能体多会话存储）
  - `randu-theme`（主题持久化，值为 `'light'` | `'dark'`）
  - `randu-announcement-dismissed`（公告已关闭）
  - `randu-onboarding-completed`（新手引导已完成）
- **轮询逻辑**：`src/hooks/useTaskPolling.ts` 的轮询间隔、状态机、终止条件不得改变
- **心跳上报**：`src/hooks/useHeartbeat.ts` 的 30 秒间隔不得改变
- **环境变量读取**：所有 `process.env.*` 的读取不得新增、删除或改变读取时机

### 1.3 主题切换机制（不可破坏）

本次升级**必须保留**已上线的手动主题切换机制：

- **触发方式**：`<html>` 元素的 `class="dark"`，由 `src/components/providers/ThemeProvider.tsx` 管理
- **持久化**：localStorage key `randu-theme`，值为 `'light'` 或 `'dark'`，默认 `'light'`（白天）
- **防闪烁脚本**：`src/app/layout.tsx` 的 `<head>` 中已注入 inline script，在 React hydrate 前读取 localStorage 并给 `<html>` 加 `dark` 类——**此 inline script 必须原样保留**
- **CSS 触发**：`src/app/globals.css` 中暗色 token 由 `html.dark { ... }` 选择器触发（**不是** `@media (prefers-color-scheme: dark)`）
- **切换按钮**：`src/components/ui/ThemeToggle.tsx` 必须保留在全局 Navbar 右侧，可改图标/动画/位置，但功能不得改变

**你可以做的**：
- 优化暗色 token 的色值（在 `html.dark { ... }` 块内）
- 美化 ThemeToggle 按钮的视觉与切换动效
- 新增 token 变量（需在 `:root` 和 `html.dark` 两处同步定义）

**你不能做的**：
- 把 `html.dark` 改回 `@media (prefers-color-scheme: dark)`
- 移除或修改 inline 防闪烁脚本
- 修改 `randu-theme` 这个 localStorage 键名
- 默认改为暗色（默认必须是白天）

### 1.4 智能体页面 localStorage 多会话结构（不可破坏）

`src/app/chat/page.tsx` 的 localStorage 结构（key=`randu-chat-history`）：

```ts
interface Conversation {
  id: string;
  title: string;        // 首条用户消息前 20 字
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}
interface ConversationsStore {
  conversations: Conversation[];   // 最多 20 个，超出淘汰最旧
  currentId: string | null;
}
```

**不可改变**：
- 数据结构形状（`conversations` + `currentId`）
- 最多保留 20 个会话的淘汰规则
- 旧版单对话结构（`{messages, updatedAt}`）的自动迁移逻辑
- 会话标题生成规则（首条用户消息前 20 字）

**可以改变**：
- 侧栏中历史对话列表的视觉样式
- 用户信息块的视觉样式
- 消息气泡的视觉样式

### 1.5 全局布局约束（不可破坏）

以下布局行为是上一版本用户明确要求的，**不得回退**：

- **首页导航栏铺满宽度**：`Navbar` 容器不得恢复 `max-w-7xl`，必须保持 `w-full px-4 lg:px-8`
- **Logo 旁保留"燃渡Ai"文字**：可改字号/字重/颜色，但文字内容不得删除
- **功能页保留顶部导航栏**：`/chat`、`/workspace`、`/workflow`、`/academy/articles`、`/academy/videos`、`/tutorial` 这些路由下，全局 Navbar **必须渲染**（窄化为 `h-12`），不得返回 `null`
- **AppShell 顶栏不重复渲染全局元素**：AppShell 顶栏只保留"侧栏切换 + 标题 + 教程按钮"，不得重新加回 Logo / OnlineCount / NotificationBell / UserQuickMenu（这些由全局 Navbar 提供）
- **首页各 section 全屏优先**：`max-w-[1600px]`，不得改回 `max-w-7xl`
- **个人中心主视觉**：顶部必须是个人资料卡片（头像/昵称/套餐/积分/邮箱/注册时间/编辑资料按钮），使用记录等降级为次要区块
- **智能体页面标题**：`title="燃渡Ai助手"`，副标题不得恢复计费文案
- **智能体侧栏底部**：必须显示用户头像/昵称/套餐/积分

---

## 二、允许修改的范围（YES — 你可以做这些）

### 2.1 允许修改的内容

| 类别 | 允许的操作 |
|---|---|
| 样式类名 | 任意调整 `className` 字符串中的 Tailwind 工具类 |
| 设计 token | 调整 `globals.css` 中 `:root` 与 `html.dark` 的 token 值（色值、圆角、间距、字体），但**不得删除**已有 token，可新增 |
| 视觉结构 | 调整 JSX 标签嵌套、布局容器、装饰性元素，但不得改变事件绑定与数据流 |
| 动效 | 新增/修改过渡、动画、微交互（hover、focus、active、loading、切换动效） |
| 图标 | 替换/新增内联 SVG 图标，新增图标资源到 `public/icons/` |
| 文案 | 纯展示性静态文案（标题、描述、占位符）可优化 |
| 新建组件 | 在 `src/components/` 下新建独立样式组件 |
| 字体 | 引入新字体，但中文 fallback 链必须保留 `"PingFang SC", "Microsoft YaHei"` |
| 暗色模式 | 优化暗色 token 色值，但触发机制（`html.dark`）不得改变 |

### 2.2 鼓励的升级方向

- 引入更现代的设计语言（如玻璃拟态、渐变光晕、微噪点纹理）
- 添加流畅的页面切换动效（页面进入/退出、元素入场顺序）
- 优化加载态骨架屏的视觉
- 增强微交互（按钮按压、卡片悬浮、输入框聚焦光晕）
- 优化暗色模式的对比度与层次
- 优化移动端响应式细节
- 新增装饰性插画/图案（不替换 LOGO）

---

## 三、技术栈与约束

### 3.1 技术栈

- **Next.js 16.2.9**（使用 Turbopack 构建器，App Router）
- **React 19**
- **TypeScript 5.x**（strict 模式）
- **Tailwind CSS v4**（注意：v4 与 v3 API 有差异，使用 `@theme inline` 映射 token）
- **Prisma 6.19**（仅服务端）
- **PostgreSQL 16**

### 3.2 客户端/服务端代码分离（关键约束）

**绝对不能**：
- 在客户端组件（`"use client"`）中 `import` 任何服务端模块（`@/lib/prisma`、`@/lib/analytics`、`@/lib/auth` 等含数据库访问的模块）
- 在客户端组件中直接读取 `process.env.DATABASE_URL` 等服务端环境变量

**历史教训**：上一版本曾因 `src/lib/analytics.ts` 同时导出服务端函数（用 Prisma）和客户端函数（`trackEventClient`），导致 Prisma 被打包进客户端 JS bundle，首页 500 错误（`DATABASE_URL environment variable is not set`）。修复方案是拆分出 `src/lib/analytics-client.ts`。**此分离必须保留**。

### 3.3 客户端组件规范

- 客户端组件必须以 `"use client";` 开头（文件第一行）
- 使用 `use client` 的文件中**不得** import 服务端模块
- 服务端组件（无 `"use client"`）不得使用 `useState`、`useEffect`、`useRef` 等 hooks
- 浏览器 API（`window`、`document`、`localStorage`）必须在 `useEffect` 内访问，或加 `typeof window !== 'undefined'` 守卫

### 3.4 Tailwind v4 注意事项

- Tailwind v4 通过 `@theme inline` 在 CSS 中映射 token，而非 v3 的 `tailwind.config.ts`
- 新增 token 时需在 `globals.css` 中定义，并在 `@theme inline` 块中映射为 Tailwind 工具类
- arbitrary value 语法（如 `max-w-[1600px]`、`bg-[var(--chart-1)]`）正确可用
- `dark:` 前缀在当前项目中**不会生效**（因为暗色模式由 `html.dark` 类触发，Tailwind v4 的 `dark:` 默认走 `prefers-color-scheme`）。如需暗色变体，使用 `html.dark .xxx` 选择器或 CSS 变量切换

### 3.5 已知部署约束（不可违背，否则服务器构建失败）

- 服务器路径：`/opt/randu-ai`（不是 `/root/randu-ai`），需要 `sudo` 访问
- Docker Compose 部署：`docker compose --env-file .env.production up -d`
- 部署前必须 `docker compose down` + `rm -rf .next`（清缓存）+ `up -d`
- `npm install` 在国内服务器可能卡死，使用 `--ignore-scripts` + npmmirror 镜像
- `prisma generate` 可能因网络问题失败，package.json build 脚本中已保留 `prisma generate && next build`

---

## 四、平台概述与设计系统

### 4.1 平台信息

- **名称**：燃渡AI（Randu AI）
- **定位**：AI 工作流服务平台，让用户无需写代码即可使用 Coze 工作流、火山方舟大模型等 AI 能力，同时开放 API 供第三方集成
- **服务人群**：个人创作者、开发者/团队、AI 学习者、平台管理员

### 4.2 当前设计系统（Doubao Design Library）

**风格关键词**：极简 · 冷调 · 技术感 · 平静

- 边框优先于阴影（`border border-border` 而非 `shadow`）
- 大量留白，紧凑但不拥挤
- 圆角柔和（卡片 1.2rem，控件 10px，胶囊 999px）
- 中性灰梯度 + 蓝色品牌色

**核心 token**（见 `globals.css`）：

| Token | 白天值 | 暗色值 | 用途 |
|---|---|---|---|
| `--background` | `#ffffff` | `#0e1115` | 页面背景 |
| `--foreground` | `#0e1115` | `#eff1f4` | 主文字 |
| `--primary` | `#0065fd` | `#0065fd` | 品牌蓝 |
| `--card` | `#ffffff` | `#0e1115` | 卡片背景 |
| `--muted` | `#eff1f4` | `#161a20` | 次要背景 |
| `--border` | `#e7eaef` | `#333942` | 边框 |
| `--sidebar` | `#eff1f4` | `#171717` | 侧栏背景 |
| `--radius` | `1.2rem` | 同 | 卡片圆角 |
| `--radius-sm` | `10px` | 同 | 控件圆角 |
| `--radius-full` | `999px` | 同 | 胶囊 |

**本次升级允许调整 token 值**，但不得删除已有 token。如新增 token，必须在 `:root` 和 `html.dark` 两处同步定义。

### 4.3 字体

```css
--font-sans: "Stack Sans Text", "PingFang SC", "Microsoft YaHei", ui-sans-serif, sans-serif, system-ui;
--font-serif: "Source Serif 4", serif;
--font-mono: "JetBrains Mono", "Courier New", monospace;
```

允许引入新字体，但中文 fallback 链 `"PingFang SC", "Microsoft YaHei"` 必须保留。

---

## 五、页面清单与功能约束

### 5.1 展示页（使用全局 Navbar，h-16）

| 路由 | 文件 | 功能约束 |
|---|---|---|
| `/` | `src/app/page.tsx` + `src/components/home/*` | 首页，含 HeroCarousel、WorkflowCategories、AdBanner、PricingSection、Footer、AnnouncementBanner。可自由重构视觉与动效 |
| `/login` | `src/app/login/page.tsx` | 登录页。表单字段（email/password）不得改变 |
| `/register` | `src/app/register/page.tsx` | 注册页。表单字段（email/password/nickname/inviteCode）不得改变 |
| `/academy` | `src/app/academy/page.tsx` | 学院首页。可自由重构视觉 |
| `/welcome` | `src/app/welcome/page.tsx` | 新手引导。localStorage `randu-onboarding-completed` 不得改变 |

### 5.2 功能页（使用全局 Navbar h-12 + AppShell 侧栏）

| 路由 | 文件 | 侧栏内容（不可删除的功能） |
|---|---|---|
| `/chat` | `src/app/chat/page.tsx` | 新对话按钮 + 历史对话列表 + 底部用户信息块。标题"燃渡Ai助手" |
| `/workspace` | `src/app/workspace/page.tsx` | 工作流分类列表 |
| `/workspace/[id]/use` | `src/app/workspace/[id]/use/page.tsx` | 工作流参数表单。表单字段由 DynamicForm 渲染，不得改变 |
| `/workflow/[id]` | `src/app/workflow/[id]/page.tsx` | 工作流详情 |
| `/academy/articles` | `src/app/academy/articles/page.tsx` | 图文教程列表 |
| `/academy/videos` | `src/app/academy/videos/page.tsx` | 视频教程列表 |
| `/tutorial` | `src/app/tutorial/page.tsx` | 教程中心 |

### 5.3 个人中心页（使用全局 Navbar）

| 路由 | 文件 | 功能约束 |
|---|---|---|
| `/dashboard` | `src/app/dashboard/page.tsx` | 主视觉为个人资料卡片，使用记录降级为次要区块 |
| `/dashboard/profile` | `src/app/dashboard/profile/page.tsx` | 资料编辑表单 |
| `/dashboard/keys` | `src/app/dashboard/keys/page.tsx` | API Key 管理 |
| `/dashboard/history` | `src/app/dashboard/history/page.tsx` | 工作流历史 |
| `/dashboard/orders` | `src/app/dashboard/orders/page.tsx` | 订单管理 |
| `/dashboard/invite` | `src/app/dashboard/invite/page.tsx` | 邀请奖励 |
| `/dashboard/notifications` | `src/app/dashboard/notifications/page.tsx` | 站内通知 |
| `/dashboard/api-docs` | `src/app/dashboard/api-docs/` | API 文档 |

### 5.4 管理后台（使用全局 Navbar + AdminSidebar）

| 路由 | 文件 | 功能约束 |
|---|---|---|
| `/admin` | `src/app/admin/page.tsx` | 数据概览 |
| `/admin/users`、`/admin/users/[id]` | | 用户管理 |
| `/admin/workflows`、`/admin/workflows/new`、`/admin/workflows/[id]/edit` | | 工作流管理 |
| `/admin/orders`、`/admin/keys`、`/admin/notifications`、`/admin/action-logs`、`/admin/cost`、`/admin/retention`、`/admin/export` | | 其他管理页 |

### 5.5 重定向页（必须保留）

- `/courses` → 重定向到 `/academy`
- `/docs` → 重定向到 `/dashboard/api-docs`
- `/api-docs` → 重定向到 `/dashboard/api-docs`

---

## 六、关键组件清单

### 6.1 布局组件

| 组件 | 路径 | 职责 | 修改约束 |
|---|---|---|---|
| `Navbar` | `src/components/layout/Navbar.tsx` | 全局导航栏，所有路由渲染。功能页窄化 h-12 | 可改视觉，保留 Logo+文字+导航+用户区+ThemeToggle |
| `AppShell` | `src/components/layout/AppShell.tsx` | 功能页布局（侧栏+主区+顶栏） | 顶栏只保留侧栏切换+标题+教程按钮 |
| `OnlineCount` | `src/components/layout/OnlineCount.tsx` | 在线人数 | 可改视觉，不得改轮询逻辑 |
| `NotificationBell` | `src/components/layout/NotificationBell.tsx` | 通知铃铛 | 可改视觉，不得改轮询逻辑 |
| `AdminSidebar` | `src/components/admin/AdminSidebar.tsx` | 后台侧栏 | 可改视觉 |

### 6.2 UI 基础组件

| 组件 | 路径 | 修改约束 |
|---|---|---|
| `Button` | `src/components/ui/Button.tsx` | 可改视觉与动效 |
| `Card` | `src/components/ui/Card.tsx` | 可改视觉 |
| `Badge` | `src/components/ui/Badge.tsx` | 可改视觉 |
| `Avatar` | `src/components/ui/Avatar.tsx` | 可改视觉，保留 size/gradient/src/name props |
| `Popover` | `src/components/ui/Popover.tsx` | 可改视觉与切换动效，不得改定位算法 |
| `Toast` | `src/components/ui/Toast.tsx` | 可改视觉与出现/消失动效 |
| `Skeleton` | `src/components/ui/Skeleton.tsx` | 可改视觉 |
| `ThemeToggle` | `src/components/ui/ThemeToggle.tsx` | 可改视觉与切换动效，不得改 useTheme 调用 |
| `UserQuickMenu` | `src/components/ui/UserQuickMenu.tsx` | 可改视觉，保留 navbar/sidebar/compact 三种变体 |
| `ErrorMessage` | `src/components/ui/ErrorMessage.tsx` | 可改视觉 |

### 6.3 业务组件

| 组件 | 路径 | 修改约束 |
|---|---|---|
| `HeroCarousel` | `src/components/home/HeroCarousel.tsx` | 可自由重构视觉与切换动效 |
| `HeroSection` | `src/components/home/HeroSection.tsx` | 可自由重构 |
| `WorkflowCategories` | `src/components/home/WorkflowCategories.tsx` | 可自由重构 |
| `AdBanner` | `src/components/home/AdBanner.tsx` | 可自由重构 |
| `PricingSection` | `src/components/home/PricingSection.tsx` | 可自由重构，套餐数据不得改变 |
| `Footer` | `src/components/home/Footer.tsx` | 可自由重构 |
| `AnnouncementBanner` | `src/components/home/AnnouncementBanner.tsx` | 可改视觉，localStorage 键不得改变 |
| `DynamicForm` | `src/components/workflow/DynamicForm.tsx` | 可改视觉，表单字段渲染逻辑不得改变 |
| `ImageUploader` | `src/components/upload/ImageUploader.tsx` | 可改视觉，上传逻辑不得改变 |
| `UpgradePrompt` | `src/components/upgrade/UpgradePrompt.tsx` | 可改视觉，弹窗触发逻辑不得改变 |
| `SubscriptionCard` | `src/components/dashboard/SubscriptionCard.tsx` | 可改视觉 |
| `WorkflowForm` | `src/components/admin/WorkflowForm.tsx` | 可改视觉，表单字段不得改变 |
| `SchemaBuilder` | `src/components/admin/SchemaBuilder.tsx` | 可改视觉，schema 生成逻辑不得改变 |

### 6.4 Provider 与 Hook（功能层，不改）

| 组件 | 路径 | 修改约束 |
|---|---|---|
| `AuthProvider` | `src/components/providers/AuthProvider.tsx` | **不得修改** |
| `ThemeProvider` | `src/components/providers/ThemeProvider.tsx` | **不得修改**（可改 useTheme 返回值的消费方式） |
| `useAuth` | `src/hooks/useAuth.ts` | **不得修改** |
| `useTrack` | `src/hooks/useTrack.ts` | **不得修改** |
| `useHeartbeat` | `src/hooks/useHeartbeat.ts` | **不得修改** |
| `useTaskPolling` | `src/hooks/useTaskPolling.ts` | **不得修改** |

---

## 七、验证清单（Design 模式自检）

完成升级后，请逐项自检：

### 7.1 功能回归
- [ ] 首页可正常访问，无 500 错误
- [ ] 登录/注册流程正常
- [ ] 智能体对话可发送/接收消息，历史会话可切换/删除
- [ ] 工作流可执行，任务轮询正常
- [ ] 个人中心资料卡片显示正确
- [ ] 后台管理页面可访问（需 admin 角色）
- [ ] API 文档页面可访问
- [ ] 重定向页（/courses、/docs、/api-docs）正常跳转

### 7.2 主题切换
- [ ] 默认白天主题
- [ ] 点击 ThemeToggle 切换到暗色，localStorage `randu-theme` 更新
- [ ] 刷新页面无白底闪烁（防闪烁脚本生效）
- [ ] 所有页面在暗色模式下可读、对比度足够

### 7.3 布局
- [ ] 全局 Navbar 所有路由渲染，功能页窄化 h-12
- [ ] Logo 旁保留"燃渡Ai"文字
- [ ] 首页各 section 全屏优先（max-w-[1600px]）
- [ ] AppShell 顶栏不重复渲染全局元素
- [ ] 智能体侧栏：新对话 + 历史列表 + 底部用户信息块
- [ ] 个人中心主视觉为资料卡片

### 7.4 构建
- [ ] `npm run build` 通过，无 TypeScript 错误
- [ ] 无客户端 import 服务端模块的错误（重点检查 `analytics-client.ts` 与 `analytics.ts` 的分离）
- [ ] 77 个页面全部生成

### 7.5 客户端/服务端分离
- [ ] 客户端组件（`"use client"`）未 import 任何 `@/lib/*` 中含数据库访问的模块
- [ ] 浏览器 Console 无 `DATABASE_URL environment variable is not set` 错误
- [ ] 客户端 bundle 中不含 Prisma 代码

---

## 八、交付要求

1. **提交前自检**：完成上述第七节验证清单
2. **构建验证**：本地运行 `npm run build` 必须通过
3. **变更说明**：提交时附变更摘要，列出修改的文件与改动方向
4. **不破坏既有功能**：本次升级**不得**修复任何 bug（即使发现），仅做视觉/动效/布局升级。如发现 bug，请在变更说明中单独列出，由工程层处理

---

## 九、参考资源

- 当前设计系统：`src/app/globals.css`
- 当前布局组件：`src/components/layout/`、`src/app/layout.tsx`
- 当前 UI 组件：`src/components/ui/`
- 现有 spec 文档：`.trae/specs/`
- 上一版本升级记录：`docs/DESIGN_GUIDE.md`（本文档是它的升级版）

如有疑问，优先保守处理——只改视觉，不动逻辑。

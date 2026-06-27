# 燃渡AI 平台设计规范与禁改清单（Design 模式专用）

> 本文档供 TRAE Design 模式使用。请在开始任何 UI/交互优化前**完整阅读本文档**，严格遵守"绝对不能修改"的红线规则。
>
> 本文档分两部分：
> 1. **禁改红线**：什么绝对不能动
> 2. **平台需求与设计规范**：平台是什么、服务谁、各页面布局与交互逻辑

---

## 第一部分：禁改红线（ABSOLUTE RULES — 不可触碰）

### 1. 禁止修改的目录与文件

以下目录/文件的**功能性代码**（非样式类名）严禁修改。仅允许调整 `className` 字符串中的样式工具类，且必须遵循第二部分的设计 token。

| 类别 | 路径 | 说明 |
|---|---|---|
| API 路由 | `src/app/api/**` | 所有后端接口，包括鉴权、工作流调用、支付、上传、后台管理 API |
| 数据库层 | `prisma/schema.prisma`、`src/lib/prisma.ts` | 数据模型与 Prisma 客户端 |
| 鉴权逻辑 | `src/lib/auth.ts`、`src/lib/auth-context.tsx`、`src/hooks/useAuth.ts`、`src/components/providers/AuthProvider.tsx` | 登录态、JWT、会话 |
| 业务逻辑库 | `src/lib/coze.ts`、`src/lib/volcengine.ts`、`src/lib/alipay.ts`、`src/lib/oss.ts`、`src/lib/webhook.ts`、`src/lib/invite.ts`、`src/lib/creditsExpiry.ts`、`src/lib/notification.ts`、`src/lib/online.ts`、`src/lib/analytics.ts`、`src/lib/moderation.ts`、`src/lib/userAntiAbuse.ts`、`src/lib/rateLimit.ts`、`src/lib/ipRateLimit.ts` | 所有第三方集成与业务规则 |
| 校验 schema | `src/lib/schema.ts`、`src/lib/plans.ts`、`src/lib/trial.ts`、`src/lib/openapi.ts`、`src/lib/apiKey.ts`、`src/lib/csv.ts`、`src/lib/imageValidation.ts` | 输入校验、套餐规则、OpenAPI 生成 |
| 页面功能代码 | `src/app/**/page.tsx`、`src/app/**/layout.tsx` 中的所有 hooks、state、effects、事件处理器、API 调用、条件渲染、权限守卫 | 只允许改 `className`、JSX 结构与样式相关的部分 |
| 配置文件 | `next.config.ts`、`tailwind.config.ts`、`postcss.config.mjs`、`tsconfig.json`、`package.json`、`docker-compose.yml`、`.env*` | 构建与部署配置 |
| 路由结构 | `src/app/` 下的目录结构 | 不得新增/删除/移动任何页面路由；已有的重定向页（`/courses`、`/docs`、`/api-docs`）必须保留 |
| 公共资源 | `public/logo.png`、`public/favicon.png`、`public/icons/*.svg` | LOGO 与图标资源不得替换或删除 |

### 2. 禁止修改的功能行为

即使在允许修改 className 的文件中，以下行为**绝对不能改变**：

- **鉴权守卫**：所有需要登录的页面（`/dashboard/**`、`/chat`、`/workspace/[id]/use`、`/admin/**`、`/dashboard/api-docs`）必须保留未登录跳转 `/login` 的逻辑
- **角色守卫**：`/admin/**` 必须保留仅 `admin`/`super_admin` 可访问的判断
- **API 调用**：每个页面的 fetch 调用、请求参数、响应处理逻辑不得改变
- **状态管理**：所有 useState/useEffect/useCallback/useRef 的依赖、触发条件、副作用不得改变
- **事件处理器**：onClick、onChange、onSubmit 等处理函数的语义不得改变
- **条件渲染**：loading/error/empty/未登录 等状态的渲染分支不得删除或合并
- **表单字段**：所有 input 的 name、type、required、验证规则不得改变
- **路由跳转**：所有 `router.push`、`<Link href>` 的目标路径不得改变
- **localStorage 键**：`randu-chat-history`、`randu-announcement-dismissed`、`randu-onboarding-completed` 等键名不得改变
- **轮询逻辑**：`src/hooks/useTaskPolling.ts` 的轮询间隔、状态机不得改变
- **心跳上报**：`src/hooks/useHeartbeat.ts` 的 30 秒间隔不得改变

### 3. 允许修改的范围

**仅允许**修改以下内容：

- `className` 字符串中的样式工具类（必须使用第二部分定义的 Doubao token）
- JSX 的视觉结构（标签嵌套、布局容器），但不得改变事件绑定和数据流
- 纯展示性的静态文案（标题、描述、占位符文本）
- 新增装饰性元素（图标、分隔线、渐变背景）
- 新建独立的样式组件文件（放在 `src/components/` 下对应子目录）

---

## 第二部分：平台需求与设计规范

### 一、平台概述

**平台名称**：燃渡AI（Randu AI）

**平台定位**：AI 工作流服务平台，让用户无需写代码即可使用 Coze 工作流、火山方舟大模型等 AI 能力，同时开放 API 供第三方集成。

**核心价值**：
1. **即开即用**：百款 AI 工作流，覆盖视频生成、内容创作、图像设计、数据处理等场景
2. **开放集成**：提供 RESTful API 与 SDK，支持第三方系统快速接入
3. **系统学习**：燃渡学院提供图文/视频教程，从入门到精通

**服务人群**：

| 用户类型 | 画像 | 核心诉求 |
|---|---|---|
| 普通用户（个人创作者） | 想用 AI 提效但不擅长写代码 | 找到合适的工作流，一键使用，看到结果 |
| 专业用户（开发者/团队） | 有技术能力，想集成 AI 能力到自己的系统 | 获取 API Key，调用开放接口，监控用量 |
| 学习者（AI 爱好者） | 想系统学习 AI 工作流开发 | 图文教程、视频教程、实战项目 |
| 平台管理员 | 运营燃渡AI 平台 | 用户管理、工作流管理、订单管理、数据分析 |

**核心能力矩阵**：

| 能力 | 说明 | 对应功能 |
|---|---|---|
| Coze 工作流执行 | 调用 Coze 平台的工作流，处理用户输入返回结果 | `/workspace`、`/workspace/[id]/use` |
| 火山方舟大模型 | 豆包（对话）、Seedream（文生图）、Seedance（视频生成） | `/chat`、工作流 |
| 智能体对话 | 多轮对话、语音输入、文件上传 | `/chat` |
| 开放 API | RESTful 接口 + API Key 管理 + 用量统计 | `/dashboard/keys`、`/dashboard/api-docs` |
| 学院教程 | 图文教程（飞书文档）+ 视频教程 | `/academy`、`/academy/articles`、`/academy/videos` |
| 邀请裂变 | 邀请码注册奖励积分 | `/dashboard/invite` |
| 会员订阅 | 基础版/专业版/企业版套餐 | `/dashboard`（订阅卡片） |

---

### 二、设计系统（Doubao Design Token）

#### 设计风格关键词
**极简 · 冷调 · 技术感 · 平静**

- 边框优先于阴影（用 `border border-border` 做视觉分隔，而非 `shadow`）
- 大量留白，紧凑但不拥挤
- 圆角柔和（卡片 1.2rem，控件 10px，胶囊 999px）
- 主色 `#0065fd` 仅用于关键操作与强调，不可滥用

#### 2.1 颜色 Token（已定义在 `src/app/globals.css` 的 `:root`）

**核心表面**：
| Token | 值 | 用途 |
|---|---|---|
| `--background` | `#ffffff` | 页面背景 |
| `--foreground` | `#0e1115` | 主文字 |
| `--card` | `#ffffff` | 卡片背景 |
| `--card-foreground` | `#0e1115` | 卡片文字 |
| `--popover` | `#f9f9fa` | 浮层/下拉背景 |
| `--popover-foreground` | `#0e1115` | 浮层文字 |

**语义色**：
| Token | 值 | 用途 |
|---|---|---|
| `--primary` | `#0065fd` | 主色：按钮、链接激活、关键强调 |
| `--primary-foreground` | `#ffffff` | 主色上的文字 |
| `--primary-hover` | `#0057da` | 主色 hover 态 |
| `--secondary` | `#eff1f4` | 次级背景 |
| `--muted` | `#eff1f4` | 静音背景（占位、禁用） |
| `--muted-foreground` | `#7f8d9f` | 次要文字、占位符 |
| `--accent` | `#e5e9ff` | 强调背景（激活态、高亮） |
| `--accent-foreground` | `#00266b` | 强调背景上的文字 |
| `--destructive` | `#ef4444` | 危险操作（删除、退出） |
| `--destructive-foreground` | `#ffffff` | 危险色上的文字 |
| `--border` | `#e7eaef` | 所有边框 |
| `--input` | `#e7eaef` | 输入框边框 |
| `--ring` | `#557fff` | focus 环 |

**侧栏专用**：
| Token | 值 | 用途 |
|---|---|---|
| `--sidebar` | `#eff1f4` | 侧栏背景 |
| `--sidebar-foreground` | `#0e1115` | 侧栏文字 |
| `--sidebar-primary` | `#0065fd` | 侧栏激活项主色 |
| `--sidebar-accent` | `#d4daff` | 侧栏激活项背景 |
| `--sidebar-border` | `#e7eaef` | 侧栏边框 |

**圆角**：
| Token | 值 | 用途 |
|---|---|---|
| `--radius` | `1.2rem` | 卡片、面板 |
| `--radius-sm` | `10px` | 输入框、按钮容器 |
| `--radius-lg` | `14px` | 侧栏、大面板 |
| `--radius-full` | `999px` | 胶囊：按钮、标签、头像 |

**间距**：
| Token | 值 | 用途 |
|---|---|---|
| `--spacing` | `0.24rem` | 紧凑仪表盘基础间距单位 |

**字体**：
| Token | 字体栈 |
|---|---|
| `--font-sans` | `"Stack Sans Text", "PingFang SC", "Microsoft YaHei", ui-sans-serif, sans-serif, system-ui` |
| `--font-mono` | `"JetBrains Mono", "Courier New", monospace` |

#### 2.2 暗色模式规则

- 暗色模式通过 `@media (prefers-color-scheme: dark)` 自动切换，所有 token 在 `globals.css` 第 158 行起已完整映射
- **禁止**使用 Tailwind 的 `dark:` 前缀做颜色覆盖（除 LOGO 反色外）
- **LOGO 反色规则**：`<img src="/logo.png" className="invert dark:invert-0" />` —— 亮色模式反色为黑色，暗色模式保持白色

#### 2.3 样式工具类使用规则

- **必须使用** Doubao token 工具类：`bg-background`、`text-foreground`、`bg-card`、`border-border`、`text-muted-foreground`、`bg-primary`、`text-primary-foreground`、`bg-accent`、`text-accent-foreground`、`bg-muted`、`bg-sidebar`、`border-sidebar-border`
- **禁止使用** Tailwind 原生 `neutral-*`、`gray-*`、`slate-*`、`zinc-*` 色系
- **禁止使用** `bg-white` 工具类做大面积背景（暗色模式会失效）
- 圆角统一使用 `rounded-[var(--radius)]`、`rounded-[var(--radius-sm)]`、`rounded-[var(--radius-lg)]`、`rounded-full`
- 阴影仅用于浮层（`shadow-lg`），卡片分隔用边框

---

### 三、布局系统（两种模式）

#### 模式 A：展示页布局（全局 Navbar）

**适用页面**：首页 `/`、登录 `/login`、注册 `/register`、欢迎 `/welcome`、学院首页 `/academy`、`/courses`（重定向）、`/docs`（重定向）、`/api-docs`（重定向）

**结构**：
```
┌─────────────────────────────────────┐
│  Navbar（64px，sticky，全局共享）       │ ← logo + 导航 + 用户区
├─────────────────────────────────────┤
│                                     │
│  页面主内容（max-w-7xl 居中）          │
│                                     │
└─────────────────────────────────────┘
```

**Navbar 组件**：`src/components/layout/Navbar.tsx`
- 已实现路由感知：功能页路由自动 `return null`
- 导航项：首页、工作台、智能体、燃渡学院（hover 出子菜单：图文教程/视频教程）、个人中心（已登录）、后台管理（admin）
- 右侧：在线人数 + 通知铃铛 + UserQuickMenu（已登录）或 登录/注册按钮（未登录）
- UserQuickMenu：显示头像+名字+套餐+积分，hover 展开常用功能浮层

#### 模式 B：功能页布局（AppShell）

**适用页面**：`/chat`、`/workspace`、`/workspace/[id]/use`、`/workflow/[id]`、`/academy/articles`、`/academy/videos`、`/tutorial`

**结构**：
```
┌──────────┬──────────────────────────┐
│          │ 低调顶栏（48px）           │ ← 切换+logo+标题+教程+在线+通知+用户
│  侧栏     ├──────────────────────────┤
│  248px   │                          │
│  可收起   │  主内容区（可滚动）        │
│          │                          │
└──────────┴──────────────────────────┘
```

**AppShell 组件**：`src/components/layout/AppShell.tsx`
- Props：`children`、`sidebar`、`title?`、`subtitle?`、`showTutorial?`、`tutorialHref?`、`defaultSidebarOpen?`、`sidebarHeader?`
- 侧栏宽度：展开 248px，收起 0px，CSS transition 动画
- 顶栏 48px 高，无边框，非视觉核心
- 主内容区 `flex-1 overflow-y-auto` 可滚动

**各功能页侧栏内容建议**：

| 页面 | 侧栏内容 |
|---|---|
| `/chat` 智能体 | 新对话按钮 + 快捷提问 + 历史对话列表 + 积分余额 |
| `/workspace` 工作台 | 搜索框（sidebarHeader）+ 功能分类筛选 |
| `/workflow/[id]` 详情 | 工作流图标+名称+分类标签 + 快速操作（立即使用/查看教程）+ 附加信息（分类/状态/上线时间）+ 相关推荐 |
| `/workspace/[id]/use` 使用 | 工作流信息 + 输入参数说明 + 历史记录 |
| `/academy/articles` 图文教程 | 搜索框 + 教程分类筛选 |
| `/academy/videos` 视频教程 | 视频分类筛选 |
| `/tutorial` 教程中心 | 快速入口 + 搜索 + 分类筛选 |

---

### 四、各页面详细需求

#### 4.1 首页 `/`

**布局**：模式 A（Navbar）

**板块顺序**（严格保持）：
1. `AnnouncementBanner` — 公告横幅（顶部，可关闭）
2. `HeroCarousel` — **轮播图**（第一个核心板块）
   - 4 张幻灯片：平台主推 / 新功能 / 新教学 / 重大更新
   - 自动播放 5 秒，鼠标悬浮暂停
   - 左右箭头 + 底部圆点导航
   - 每张可点击跳转至对应功能页
3. `WorkflowCategories` — 工作流分类展示（6 个分类卡片）
4. `AdBanner` — 广告位
5. `PricingSection` — 套餐定价（基础版 99 / 专业版 299 / 企业版 999）
6. `Footer` — 页脚

**轮播图幻灯片配置**（不可删除）：
| ID | 标签 | 标题 | 跳转 |
|---|---|---|---|
| platform | AI 工作流服务平台 | 让 AI 工作流为你的业务提效 | `/workspace` |
| video | 新功能 | Seedance AI 视频生成 | `/workspace` |
| academy | 新教学信息 | 燃渡学院 系统学习 | `/academy` |
| api | 重大更新 | API 开放平台 支持第三方集成 | `/dashboard` |

#### 4.2 工作台 `/workspace`

**布局**：模式 B（AppShell）
- `sidebarHeader`：搜索框（防抖 300ms）
- `sidebar`：功能分类（全部/视频生成/内容创作/数据处理/自动化运营/图像设计/智能对话）
- 主内容：工作流卡片网格（3 列），含骨架屏/错误/空状态

**工作流卡片**：图标 + 名称 + 描述（2 行截断）+ 分类标签 + 使用/详情按钮

#### 4.3 工作流详情 `/workflow/[id]`

**布局**：模式 B（AppShell）
- **服务端组件**（async + Prisma 查询），通过 RSC 协议将 JSX 作为 props 传给 AppShell
- 侧栏：工作流图标+名称+分类+状态 + 立即使用按钮 + 查看教程链接 + 附加信息 + 相关推荐
- 主内容：工作流介绍 + 使用说明（4 步）

#### 4.4 工作流使用 `/workspace/[id]/use`

**布局**：模式 B（AppShell）
- 动态表单（`DynamicForm` 组件，根据 workflow.inputSchema 渲染输入控件）
- 提交后调用 `/api/workflow/[id]/run`，轮询任务状态
- 结果展示区（图片/视频/文本）

#### 4.5 智能体对话 `/chat`

**布局**：模式 B（AppShell）
- 侧栏：新对话按钮 + 快捷提问 + 历史对话（localStorage 存储，最多 50 条）
- 主内容：消息列表 + 输入框（支持文本/语音/文件上传）
- 未登录跳转 `/login`

#### 4.6 燃渡学院 `/academy`

**布局**：模式 A（Navbar，展示页）
- 头部介绍区
- 图文教程入口 + 视频教程入口（两个大卡片）
- 课程方向预告（4 个：AI 视频创作 / 提示词工程 / Coze 工作流开发 / 智能体应用实战）
- 配套资源区（实战项目驱动 / 渐进式难度 / 教程文档中心）

#### 4.7 图文教程 `/academy/articles`

**布局**：模式 B（AppShell）
- fetch `/api/workflow/list` 获取有飞书文档的工作流，按分类分组
- 卡片点击在新标签页打开飞书文档
- 侧栏：搜索框 + 分类筛选

#### 4.8 视频教程 `/academy/videos`

**布局**：模式 B（AppShell）
- 当前为预告页（6 个即将上线的视频卡片）
- 侧栏：视频分类筛选

#### 4.9 独立教程中心 `/tutorial`

**布局**：模式 B（AppShell，`showTutorial={false}`）
- 从功能页侧栏的"教程"按钮跳转过来
- 内容同 `/academy/articles`，但作为独立入口
- 侧栏：快速入口（返回工作台/图文教程/视频教程）+ 搜索 + 分类筛选

#### 4.10 个人中心 `/dashboard`

**布局**：模式 A（Navbar）
- 顶部：欢迎语 + 订阅状态卡片（`SubscriptionCard` 组件）+ API 文档入口按钮
- 中部：快捷功能网格（历史记录 / API Keys / 邀请奖励 / 订单管理 / 通知中心 / 个人资料）
- 底部：用量统计

**子页面**（均为模式 A）：
| 路径 | 功能 |
|---|---|
| `/dashboard/profile` | 个人资料编辑（头像、昵称、邮箱） |
| `/dashboard/history` | 使用历史记录 |
| `/dashboard/keys` | API Key 管理（创建/查看/删除/查看日志） |
| `/dashboard/invite` | 邀请奖励（邀请码、邀请记录） |
| `/dashboard/orders` | 订单管理 |
| `/dashboard/notifications` | 通知中心 |
| `/dashboard/api-docs` | API 文档（Swagger UI，从 `/api-docs` 迁入） |

#### 4.11 登录 `/login` & 注册 `/register`

**布局**：模式 A（Navbar）
- 居中卡片表单
- 注册页需要邀请码（query param `ref` 自动填充）
- 注册成功后新用户自动获得**随机头像**（DiceBear 生成）

#### 4.12 后台管理 `/admin/**`

**布局**：独立 AdminSidebar + 主内容区
- `/admin` — 总览（用户数、订单数、在线数、收入统计）
- `/admin/users` — 用户列表
- `/admin/users/[id]` — 用户详情（编辑角色/套餐/积分/封禁）
- `/admin/workflows` — 工作流列表
- `/admin/workflows/new` — 新建工作流
- `/admin/workflows/[id]/edit` — 编辑工作流（含 SchemaBuilder 动态表单 schema 编辑器）
- `/admin/orders` — 订单管理（含退款）
- `/admin/keys` — API Key 管理
- `/admin/notifications` — 通知管理
- `/admin/cost` — 成本分析
- `/admin/retention` — 留存分析
- `/admin/action-logs` — 操作日志
- `/admin/export` — 数据导出

---

### 五、交互逻辑规范

#### 5.1 用户信息展示（所有页面）

- **展示页（模式 A）**：Navbar 右侧显示 UserQuickMenu（头像+名字+套餐+积分），hover 展开常用功能浮层
- **功能页（模式 B）**：AppShell 顶栏右侧显示 UserQuickMenu
- **未登录**：显示"登录"+"免费注册"按钮

**UserQuickMenu 组件**：`src/components/ui/UserQuickMenu.tsx`
- Props：`variant?: "navbar" | "compact"`
- 显示：头像 + 名字 + 套餐等级徽章 + 积分余额
- hover 浮层：个人中心 / 邀请奖励 / API Keys / 通知中心 / 退出登录

#### 5.2 教程入口

- **不在导航栏显示**
- 在功能页（AppShell）顶栏显示"教程"按钮，点击跳转 `/tutorial`
- 各工作流详情页侧栏有"查看教程"按钮（如有飞书文档链接）

#### 5.3 燃渡学院导航

- Navbar 中"燃渡学院"链接到 `/academy`
- hover 出现子菜单：图文教程（`/academy/articles`）、视频教程（`/academy/videos`）

#### 5.4 通知

- Navbar/AppShell 顶栏显示 `NotificationBell` 组件
- 未读通知红点提示，点击展开通知列表
- 通知类型：task_complete（任务完成）/ system（系统）/ announcement（公告）

#### 5.5 在线人数

- `OnlineCount` 组件显示当前在线人数
- 通过 `/api/heartbeat` 每 30 秒上报

#### 5.6 响应式断点

- 移动端（<768px）：Navbar 折叠为汉堡菜单；AppShell 侧栏默认收起
- 平板（768-1024px）：工作流卡片 2 列
- 桌面（>1024px）：工作流卡片 3 列

#### 5.7 加载状态

- 列表页：骨架屏（`Skeleton` 组件）
- 按钮提交：按钮 disabled + spinner
- 页面级：居中 spinner

#### 5.8 空状态

- 列表无数据：居中图标 + 提示文案 + 操作引导
- 错误状态：`ErrorMessage` 组件 + 重试按钮

---

### 六、组件清单与职责

#### 6.1 布局组件

| 组件 | 路径 | 职责 |
|---|---|---|
| `Navbar` | `src/components/layout/Navbar.tsx` | 展示页顶部导航，路由感知 |
| `AppShell` | `src/components/layout/AppShell.tsx` | 功能页布局（侧栏+顶栏+主区） |
| `OnlineCount` | `src/components/layout/OnlineCount.tsx` | 在线人数显示 |
| `NotificationBell` | `src/components/layout/NotificationBell.tsx` | 通知铃铛 |

#### 6.2 UI 原子组件（`src/components/ui/`）

| 组件 | 职责 |
|---|---|
| `Button` | 按钮变体（primary/secondary/outline/ghost/destructive） |
| `Card` | 卡片容器 |
| `Badge` | 徽章标签（default/primary/success/accent/destructive） |
| `Avatar` | 头像（支持图片+渐变 fallback） |
| `Popover` | 浮层 |
| `UserQuickMenu` | 用户快捷菜单（头像+信息+悬浮功能） |
| `ErrorMessage` | 错误状态 + 重试 |
| `Skeleton` | 骨架屏 |
| `Toast` | 全局提示 |

#### 6.3 业务组件

| 组件 | 路径 | 职责 |
|---|---|---|
| `HeroCarousel` | `src/components/home/HeroCarousel.tsx` | 首页轮播图 |
| `WorkflowCategories` | `src/components/home/WorkflowCategories.tsx` | 工作流分类展示 |
| `PricingSection` | `src/components/home/PricingSection.tsx` | 套餐定价 |
| `AdBanner` | `src/components/home/AdBanner.tsx` | 广告位 |
| `AnnouncementBanner` | `src/components/home/AnnouncementBanner.tsx` | 公告横幅 |
| `Footer` | `src/components/home/Footer.tsx` | 页脚 |
| `SubscriptionCard` | `src/components/dashboard/SubscriptionCard.tsx` | 订阅状态卡片 |
| `DynamicForm` | `src/components/workflow/DynamicForm.tsx` | 工作流动态表单 |
| `ImageUploader` | `src/components/upload/ImageUploader.tsx` | 图片上传 |
| `AdminSidebar` | `src/components/admin/AdminSidebar.tsx` | 后台侧栏 |
| `WorkflowForm` | `src/components/admin/WorkflowForm.tsx` | 工作流编辑表单 |
| `SchemaBuilder` | `src/components/admin/SchemaBuilder.tsx` | 动态 schema 编辑器 |

---

### 七、数据模型概览（供 Design 理解数据结构）

| Model | 说明 | 关键字段 |
|---|---|---|
| `User` | 用户 | email, role(user/admin/super_admin), credits, subscriptionPlan, inviteCode |
| `Workflow` | 工作流 | name, category, cozeWorkflowId, inputSchema(Json), creditsRequired, icon, status, feishuDocUrl |
| `Order` | 订单 | orderNo, type(subscription/credits), amount, status(pending/paid/refunded) |
| `ApiKey` | API Key | keyPrefix, name, status, creditsUsed, totalCalls, qpsLimit, dailyLimit |
| `UsageLog` | 使用记录 | userId, workflowId, status, outputUrl, creditsCost, source(direct/api) |
| `CallLog` | API 调用日志 | apiKeyId, endpoint, creditsCost, status, apiCost |
| `Notification` | 通知 | type(task_complete/system/announcement), title, isRead |
| `Plan` | 套餐 | name, dailyLimit, monthlyPrice, features(Json) |
| `ActionLog` | 后台操作日志 | operatorId, action(block/update_credits/set_role) |
| `EventLog` | 事件追踪 | event(page_view/button_click/workflow_run) |

---

### 八、Design 模式工作流程建议

1. **先阅读理解**：阅读本文档 + `src/app/globals.css`（token 定义）+ `Doubao Copy/`（设计模板）
2. **再熟悉代码**：每个要修改的页面，先完整阅读现有代码，理解数据流和事件绑定
3. **逐页优化**：一次只改一个页面，改完用 `node node_modules/next/dist/bin/next build` 验证
4. **样式迁移规则**：`neutral-*` → Doubao token；`bg-white` → `bg-card`/`bg-background`
5. **不要批量重构**：禁止一次性重写多个文件，每个文件改完单独验证

---

### 九、验收标准

- 所有页面在亮色/暗色模式下都正常显示
- 所有功能（登录/注册/对话/工作流/支付/API）不受影响
- 移动端响应式正常
- `node node_modules/next/dist/bin/next build` 零错误
- 77 个页面全部正常生成
- 已有的路由重定向（`/courses` → `/academy`、`/docs` → `/tutorial`、`/api-docs` → `/dashboard/api-docs`）正常工作

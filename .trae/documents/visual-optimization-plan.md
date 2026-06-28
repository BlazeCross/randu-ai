# 燃渡AI 全站 UI/UX 专业升级方案

## 概要

基于 `docs/DESIGN_GUIDE.md` 设计规范、`Doubao Copy/` 设计模板，以及字节系产品（豆包、Coze、火山引擎）的设计模式研究，对燃渡AI 全站进行全面 UI/UX 升级。

**核心设计语言**：极简 · 冷调 · 技术感 · 平静

**升级范围**：全站 30+ 页面/组件，覆盖面向用户的所有页面和后台管理的 className 层修复。

**设计原则**（参考字节 Arco Design + Doubao）：
1. 边框优先于阴影 — 卡片/面板只用 `border`，仅浮层（Popover/Modal）保留 `shadow-lg`
2. 颜色全部 token 化 — 禁止硬编码 `neutral-*`/`red-*`/`amber-*`，统一使用 Doubao CSS 变量
3. hover 克制 — 移除所有 `hover:-translate-y-*` 浮起效果，改用边框高亮 + 背景晕染
4. 胶囊按钮统一 — 所有 CTA 按钮和标签使用 `rounded-full`
5. 间距以 8px 原子单位 — 水槽 24px (`gap-6`)，卡片内边距 20px (`p-5`)
6. 暗色模式全自动 — 通过 CSS 变量 + `prefers-color-scheme: dark`，禁止 `dark:` 前缀
7. 动画克制 — 入场 0.3s、弹窗 0.2s、侧栏 0.3s，尊重 `prefers-reduced-motion`

---

## 当前问题全景诊断

| 问题类型 | 涉及文件 | 严重度 |
|---------|---------|--------|
| `neutral-*` 硬编码，暗色模式失效 | Footer, AdBanner, AdminSidebar, ApiDocsClient | 高 |
| 卡片混用阴影+边框，违反"边框优先" | Workspace, WorkflowCategories, PricingSection, SubscriptionCard, Welcome, ImageUploader | 高 |
| hover `-translate-y-1` 浮夸动画 | WorkflowCategories, Workspace, Welcome 引导卡片, Academy 教程卡片 | 中 |
| 登录/注册/Error/404 背景渐变暗色失效 | login, register, welcome, error, not-found (via-white to-white) | 高 |
| ErrorMessage 硬编码 `red-50/red-600` | ErrorMessage 组件（全局复用） | 高 |
| 状态标签硬编码 `red-100/amber-100/purple-100` | Dashboard, History, Orders, Keys, Notifications 页 | 中 |
| SubscriptionCard 渐变背景暗色失效 | SubscriptionCard (from-success-50, from-red-50, from-primary-50) | 高 |
| Chat 输入区与 Doubao Composer 模板差距大 | Chat 页 | 中 |
| CTA 按钮圆角不统一（`rounded-[var(--radius-sm)]` vs `rounded-full`） | UpgradePrompt, SubscriptionCard, Chat, 工作流详情页 | 低 |
| HTTP 方法标签硬编码 `bg-blue-50/bg-green-50` | ApiDocsClient | 低 |

---

## 执行批次

按依赖关系分 9 批，每批改完 `node node_modules/next/dist/bin/next build` 验证。

---

### 批次 1：全局基础组件（影响范围最大，优先修复）

#### 1.1 ErrorMessage 组件 (`src/components/ui/ErrorMessage.tsx`)

**为什么先改**：此组件被全站 20+ 个页面复用（工作流使用页、图片上传、历史记录等），修复一次全局生效。

**改动清单**：

```tsx
// error 类型
container: "border-red-200 bg-red-50" → "border-destructive/30 bg-destructive/10"
icon: "text-red-600" → "text-destructive"
text: "text-red-700" → "text-destructive"
retry: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-200"
  → "bg-destructive text-destructive-foreground hover:bg-[color-mix(in_srgb,var(--destructive)_90%,#000)]"

// warning 类型
container: "border-amber-200 bg-amber-50" → "border-accent bg-accent"
icon: "text-amber-600" → "text-accent-foreground"
text: "text-amber-700" → "text-accent-foreground"
retry: "bg-amber-600 text-white hover:bg-amber-700 focus:ring-amber-200"
  → "bg-foreground text-background hover:bg-[color-mix(in_srgb,var(--foreground)_90%,#000)]"

// info 类型（已较好，微调）
container: "border-primary-200 bg-primary-50" → "border-primary/30 bg-primary/10"
text: "text-primary-700" → "text-primary"
```

#### 1.2 SubscriptionCard (`src/components/dashboard/SubscriptionCard.tsx`)

**改动清单**：

```
// 已订阅状态
"border-success-200 bg-gradient-to-br from-success-50 to-card"
  → "border-success/30 bg-success/10"（移除渐变）
"bg-success-100 text-success-700" → "bg-success/15 text-success"（标签）
"text-primary-700" → "text-primary"（每日限额数字）
"rounded-[var(--radius-sm)] border border-primary-200 bg-card text-primary-700 hover:bg-primary-50"
  → "rounded-full border border-border bg-card text-foreground hover:bg-muted"（续费按钮）
"rounded-[var(--radius-sm)] bg-primary shadow-lg shadow-primary-600/25"
  → "rounded-full bg-primary"（升级按钮，移除阴影）

// 试用过期状态
"border-red-200 bg-gradient-to-br from-red-50 to-card"
  → "border-destructive/30 bg-destructive/10"（移除渐变）
"bg-red-100 text-red-600" → "bg-destructive/15 text-destructive"（标签）
"bg-red-50/60" → "bg-destructive/10"（状态说明区）
"text-red-600" → "text-destructive"（图标+文字）
"text-red-900" → "text-destructive"（标题）
"text-red-700" → "text-destructive"（副标题）
"rounded-[var(--radius-sm)] bg-primary shadow-lg shadow-primary-600/25"
  → "rounded-full bg-primary"（升级按钮）

// 试用中状态
"border-primary-200 bg-gradient-to-br from-primary-50 to-card"
  → "border-primary/30 bg-primary/10"（移除渐变）
"bg-primary-100 text-primary-700" → "bg-accent text-accent-foreground"（标签）
"text-success-600" → "text-success"（剩余天数-正）
"text-red-600" → "text-destructive"（剩余天数-负）
"bg-red-500" → "bg-destructive"（进度条满）
"bg-amber-500" → "bg-accent"（进度条接近满，改用 accent 更统一）
"rounded-[var(--radius-sm)] bg-primary shadow-lg shadow-primary-600/25"
  → "rounded-full bg-primary"（升级按钮）
```

#### 1.3 ImageUploader (`src/components/upload/ImageUploader.tsx`)

**改动清单**：

```
// 上传区 hover/dragover
"hover:shadow-md" → 移除
"shadow-primary-600/10" → 移除
"border-primary border-solid bg-primary-50"（dragover）
  → "border-primary bg-primary/10"（token化）

// 删除按钮 hover
"hover:bg-red-50 hover:text-red-600" → "hover:bg-destructive/10 hover:text-destructive"

// 图标容器
"bg-primary-100" → "bg-accent"（dragover/正常态均改为 token）

// 上传区默认边框保持 "border-border"
```

---

### 批次 2：全局布局组件（Navbar + Footer + AnnouncementBanner）

#### 2.1 Footer (`src/components/home/Footer.tsx`)

```
"bg-neutral-900" → "bg-foreground"
"border-neutral-700" → "border-border"
"bg-neutral-800" → "bg-muted"
"border-neutral-800" → "border-border"
"text-white" → "text-foreground"
```

#### 2.2 AnnouncementBanner (`src/components/home/AnnouncementBanner.tsx`)

```
"bg-gradient-to-r from-primary-50 to-success-50" → "bg-accent"
"text-primary-800" → "text-foreground"
"text-primary-300" → "text-muted-foreground"
"text-primary-700" → "text-accent-foreground"
"bg-primary-100" → "bg-muted"
"text-primary-500" → "text-primary"
"hover:bg-primary-100" → "hover:bg-muted"
```

---

### 批次 3：首页展示组件（HeroCarousel + WorkflowCategories + PricingSection + AdBanner）

#### 3.1 HeroCarousel (`src/components/home/HeroCarousel.tsx`)

仅微调：
- CTA `font-semibold` → `font-medium`（更克制）
- 箭头 `hover:bg-white/40` → `hover:bg-white/30`
- 其他保持不变（实现已较好）

#### 3.2 WorkflowCategories (`src/components/home/WorkflowCategories.tsx`)

```
// 卡片 hover
移除 "hover:-translate-y-1 hover:shadow-xl hover:shadow-primary-600/5"
新增 "hover:border-[color-mix(in_srgb,var(--primary)_40%,var(--border))] hover:bg-[color-mix(in_srgb,var(--accent)_22%,var(--card))]"

// 图标容器
"bg-primary-50" → "bg-accent"
"hover:bg-primary-100" → "hover:bg-accent"

// 文字色
"text-primary-600" → "text-primary"（多处分类标签）
```

#### 3.3 PricingSection (`src/components/home/PricingSection.tsx`)

```
// 高亮套餐
移除 "shadow-2xl shadow-primary-600/10"
移除 "lg:-translate-y-4"
保留 "border-primary"（用边框强调）

// 普通套餐 hover
移除 "hover:shadow-md"
新增 "hover:border-primary/30"

// CTA 按钮统一胶囊
"rounded-[var(--radius-sm)]" → "rounded-full"（所有 CTA）
非高亮 CTA: "bg-muted text-foreground hover:bg-muted"
  → "border border-border bg-background text-foreground hover:bg-muted"（outline 风格，更明确）

// 文字色
"text-primary-600" → "text-primary"
```

#### 3.4 AdBanner (`src/components/home/AdBanner.tsx`)

```
"from-neutral-800 to-neutral-900" → "from-foreground to-secondary-foreground"（token 兼容）
"shadow-xl shadow-neutral-900/5" → 移除（边框优先）
新增 "border border-border"（如已有 border 则保持）
"rounded-3xl" → "rounded-[var(--radius-lg)]"（统一 token）
```

---

### 批次 4：认证页面（Login + Register + Welcome + Error + NotFound）

#### 4.1 通用改动（5 个页面共享）

所有使用 `bg-gradient-to-b from-primary-50 via-white to-white` 的页面统一改为：

```
"bg-gradient-to-b from-primary-50 via-white to-white"
  → "bg-background"（纯 token，亮暗自适应）
```

按钮阴影统一移除：
```
"shadow-primary-600/25" → 移除
"hover:shadow-xl" → 移除
"active:scale-[0.98]" → 移除（保持按压缩小即可）
```

CTA 按钮 `rounded-[var(--radius-sm)]` → `rounded-full`

#### 4.2 登录页 (`src/app/login/page.tsx`)

额外改动：
- 品牌标题渐变文字 `from-primary-600 to-success-500` → 纯 `text-foreground font-bold`
- 卡片 `shadow-xl shadow-primary-600/5` → 移除（仅保留 border）
- 错误提示 `bg-red-50 text-red-600` → 依赖 ErrorMessage 组件（批次 1 已修复）
- 输入框 focus: 保持现有实现，已经较好

#### 4.3 注册页 (`src/app/register/page.tsx`)

额外改动：
- 试用期说明 `border-success-200 bg-success-50 text-success-700` → `border-success/30 bg-success/10 text-success`
- 邀请码有效 `border-success-400 focus:border-success focus:ring-success/20` → `border-success focus:ring-[var(--ring)]`
- 邀请码无效 `border-red-300 focus:border-red-500 focus:ring-red/20` → `border-destructive focus:ring-[var(--ring)]`
- 无效态文字 `text-red-500` → `text-destructive`

#### 4.4 Welcome 页 (`src/app/welcome/page.tsx`)

额外改动：
- 欢迎横幅图标容器渐变 `bg-gradient-to-br from-primary-500 to-primary-700 shadow-primary-600/25` → `bg-primary`
- 试用期信息 `border-success-200 bg-success-50 text-success-700` → `border-success/30 bg-success/10 text-success`
- `text-success-200` → `text-success/30`（分隔线）
- 昵称表单卡片 `border-primary-200 bg-primary-50/50` → `border-primary/30 bg-primary/5`
- 引导卡片 hover: 移除 `hover:shadow-md`，改为 `hover:border-primary hover:bg-accent/10`
- CTA 箭头 `text-primary transition-transform group-hover:translate-x-0.5` 保持（好的微交互）
- 图标渐变保留（4 种渐变色标识不同功能，属于有意的视觉区分）

#### 4.5 Error + NotFound 页

与登录页共享的通用改动（背景、按钮）。

Error 页额外：
- `text-primary-200`（500 大字）保持（已经是 200 opacity，暗色模式视觉正确）

---

### 批次 5：功能核心页（Workspace + Chat + 工作流使用页）

#### 5.1 工作台 (`src/app/workspace/page.tsx`)

```
// 卡片 hover
移除 "hover:-translate-y-1 hover:shadow-lg"
改为 "hover:border-[color-mix(in_srgb,var(--primary)_40%,var(--border))] hover:bg-[color-mix(in_srgb,var(--accent)_22%,var(--card))]"
```

#### 5.2 对话页 (`src/app/chat/page.tsx`)

**输入区重构为 Doubao Composer 风格**（仅改 className 和 DOM 结构，不改事件绑定）：

```tsx
// 输入区外层容器
当前: "flex-none border-t border-border bg-background"
改为: "flex-none border-t border-border bg-background"
  内部容器:
  "border border-border rounded-[22px] bg-card p-3.5 pb-2.5 transition-all
   focus-within:border-[var(--ring)]
   focus-within:ring-[3px]
   focus-within:ring-[color-mix(in_srgb,var(--ring)_18%,transparent)]"

// textarea
移除独立的 border/ring/focus 样式（由外层容器提供）
"border border-border rounded-[var(--radius-sm)] focus:ring-2 focus:ring-primary/20"
  → "bg-transparent rounded-none border-none outline-none"

// 发送按钮
"rounded-[var(--radius-sm)] h-10" → "rounded-full w-9 h-9"
```

**消息气泡**：
```
AI 消息: "bg-card shadow-sm ring-1 ring-border" → "bg-card border border-border"
用户消息: 保持 "bg-primary text-primary-foreground"
头像: "h-8 w-8" → "h-7 w-7"（更紧凑）
```

#### 5.3 工作流详情页 (`src/app/workflow/[id]/page.tsx`)

当前实现已经使用 token，仅需微调：
- "立即使用"按钮 `rounded-[var(--radius-sm)]` → `rounded-full`
- "查看教程"按钮 `rounded-[var(--radius-sm)]` → `rounded-full`

#### 5.4 工作流使用页 (`src/app/workspace/[id]/use/page.tsx`)

```
// 试用过期横幅
"border-red-200 bg-red-50" → "border-destructive/30 bg-destructive/10"
"text-red-600" → "text-destructive"（图标）
"text-red-900" → "text-foreground"（标题，保持可读性）
"text-red-700" → "text-destructive"（副标题）
"bg-red-600 hover:bg-red-700" → "bg-destructive hover:bg-[color-mix(in_srgb,var(--destructive)_90%,#000)]"（升级按钮）

// 试用中横幅
"border-primary-200 bg-primary-50/50" → "border-primary/30 bg-primary/10"
"border-amber-200 bg-amber-50"（次数用完）→ "border-accent bg-accent"
"text-amber-600" → "text-accent-foreground"（图标+文字）
"text-amber-900" → "text-foreground"（标题）
"text-amber-700" → "text-accent-foreground"（副标题）
"bg-amber-500" → "bg-accent"（进度条）
"bg-primary-100 text-primary-700" → "bg-accent text-accent-foreground"（状态标签）
"bg-primary-600 hover:bg-primary-hover" → "rounded-full bg-primary"（升级按钮）

// 进度展示区
"border-primary-200 bg-primary-50/50" → "border-primary/30 bg-primary/10"
"bg-primary-100 text-primary-700" → "bg-accent text-accent-foreground"

// 结果展示区
"border-success-200 bg-success-50/50" → "border-success/30 bg-success/10"
"text-success-600" → "text-success"

// 失败提示
"border-red-200 bg-red-50" → "border-destructive/30 bg-destructive/10"
"text-red-600" → "text-destructive"

// 超时提示
"border-amber-200 bg-amber-50" → "border-accent bg-accent"
"text-amber-600" → "text-accent-foreground"

// "返回工作台"/"前往登录"/生成视频等按钮
"rounded-[var(--radius-sm)]" → "rounded-full"
"shadow-primary-600/25"/"shadow-primary-600/20" → 移除
"hover:shadow-xl"/"hover:shadow-lg" → 移除
"active:scale-[0.98]" → 移除

// 错误提示 "text-red-600"/"text-red-700"
  → "text-destructive"（依赖批次 1 的 ErrorMessage 修复）

// 未登录状态提示
"bg-primary shadow-primary-600/25" → "bg-primary"
"rounded-[var(--radius-sm)]" → "rounded-full"
```

---

### 批次 6：Dashboard 子页面（History + Orders + Keys + Profile + Invite + Notifications）

#### 6.1 状态标签 token 化（6 个页面共享模式）

所有页面的 `statusConfig` / `keyStatusConfig` / `typeConfig` / `typeIconConfig` 中的硬编码色值统一改为 token：

```
// 成功/已完成
"bg-success-100 text-success-700" → "bg-success/15 text-success"
"bg-success-100 text-success-600" → "bg-success/15 text-success"

// 失败/危险
"bg-red-100 text-red-600" → "bg-destructive/15 text-destructive"
"bg-red-100 text-red-700" → "bg-destructive/15 text-destructive"

// 进行中/运行中
"bg-primary-100 text-primary-700" → "bg-accent text-accent-foreground"

// 等待中/停用
"bg-muted text-muted-foreground" → 保持（已用 token）

// 待支付/警告
"bg-amber-100 text-amber-700" → "bg-accent text-accent-foreground"

// 已退款
"bg-muted text-muted-foreground" → 保持

// 类型标签
"bg-purple-100 text-purple-700" → "bg-accent text-accent-foreground"（积分充值）
"bg-primary-100 text-primary-700" → "bg-accent text-accent-foreground"（套餐订阅）

// 通知图标
"bg-success-100 text-success-600" → "bg-success/15 text-success"
"bg-red-100 text-red-600" → "bg-destructive/15 text-destructive"
"bg-primary-100 text-primary-600" → "bg-accent text-accent-foreground"
"bg-amber-100 text-amber-600" → "bg-accent text-accent-foreground"
```

#### 6.2 Dashboard 主页 (`src/app/dashboard/page.tsx`)

```
// 顶部快捷按钮统一
"rounded-[var(--radius-sm)]" → "rounded-full"（所有按钮）
"border-border bg-card" → 保持
"border-success-300 bg-success-50"（邀请奖励）→ "bg-accent text-accent-foreground"

// 横幅
"bg-red-50" → "bg-destructive/10 border-destructive/30"
"bg-amber-50" → "bg-accent border-accent"
"border-red-200" → "border-destructive/30"
"border-amber-200" → "border-accent"
"text-red-600"/"text-red-700" → "text-destructive"
"text-amber-600"/"text-amber-700" → "text-accent-foreground"

// 状态标签同 6.1 统一
"bg-primary-100 text-primary-700" → "bg-accent text-accent-foreground"
"bg-success-100 text-success-700" → "bg-success/15 text-success"
"bg-red-100 text-red-600" → "bg-destructive/15 text-destructive"

// API 来源标签
"bg-purple-50 text-purple-700" → "bg-accent text-accent-foreground"
```

#### 6.3 具体页面改动范围

**History (`src/app/dashboard/history/page.tsx`)**：
- statusConfig 按 6.1 统一
- 弹窗详情中的状态色值同步修改

**Orders (`src/app/dashboard/orders/page.tsx`)**：
- statusConfig + typeConfig 按 6.1 统一
- 套餐卡片按钮 `rounded-[var(--radius-sm)]` → `rounded-full`
- 套餐卡高亮 `border-primary-600 bg-primary-50/40 shadow-primary-600/10` → `border-primary bg-primary/5`（移除阴影）

**Keys (`src/app/dashboard/keys/page.tsx`)**：
- keyStatusConfig 按 6.1 统一
- 创建表单/编辑弹窗按钮 `rounded-lg` → `rounded-full`

**Profile (`src/app/dashboard/profile/page.tsx`)**：
- 成功/错误提示 token 化（`text-red-600` → `text-destructive`，`text-green-600` → `text-success`）

**Invite (`src/app/dashboard/invite/page.tsx`)**：
- 奖励说明卡片 `border-success-200 bg-success-50` → `border-success/30 bg-success/10`

**Notifications (`src/app/dashboard/notifications/page.tsx`)**：
- typeIconConfig 按 6.1 统一
- 未读标记 `bg-primary` 保持

---

### 批次 7：Academy + Workflow Detail 页

#### 7.1 Academy (`src/app/academy/page.tsx`)

```
// 教程入口卡片 hover
"hover:shadow-md" → 移除
改为 "hover:border-primary hover:bg-accent/10"

// 课程预告卡片 hover 同理
```

#### 7.2 Workflow Detail (`src/app/workflow/[id]/page.tsx`)

CTA 按钮 `rounded-[var(--radius-sm)]` → `rounded-full`（已在批次 5.3 说明）

---

### 批次 8：UpgradePrompt 弹窗

#### 8.1 (`src/components/upgrade/UpgradePrompt.tsx`)

```
// 遮罩层
"bg-black/40" → "bg-foreground/40"（token 兼容暗色）

// 弹窗
"shadow-2xl" → 保留（Modal 属于浮层，可以用阴影）
新增 "border border-border"（边框+阴影双保险）

// 关闭按钮 hover
"hover:bg-muted hover:text-foreground" → 保持（已用 token）

// 图标容器
"bg-primary-100" → "bg-accent"

// 套餐高亮
"border-primary-600 bg-primary-50/40 shadow-primary-600/10"
  → "border-primary bg-primary/5"（移除阴影）

// 非高亮 hover
无 hover 态 → 新增 "hover:border-primary/30"

// CTA 按钮
"rounded-[var(--radius-sm)]" → "rounded-full"
非高亮: "bg-muted text-foreground hover:bg-muted" → "border border-border bg-background text-foreground hover:bg-muted"
```

---

### 批次 9：暗色模式收尾 + ApiDocs + Admin 遮罩

#### 9.1 ApiDocs (`src/app/dashboard/api-docs/ApiDocsClient.tsx`)

```
// HTTP 方法标签
"bg-blue-50 text-blue-700 border-blue-200" → "bg-accent text-accent-foreground border-accent"
"bg-green-50 text-green-700 border-green-200" → "bg-success/15 text-success border-success/30"
"bg-amber-50 text-amber-700 border-amber-200" → "bg-accent text-accent-foreground border-accent"
"bg-red-50 text-red-700 border-red-200" → "bg-destructive/15 text-destructive border-destructive/30"
"bg-purple-50 text-purple-700 border-purple-200" → "bg-accent text-accent-foreground border-accent"

// 代码块
"bg-neutral-900 text-neutral-100" → "bg-foreground text-background"

// 必填标记
"text-red-500" → "text-destructive"
```

#### 9.2 Admin 遮罩层

```
// AdminSidebar.tsx
"bg-neutral-900/40" → "bg-foreground/40"

// admin/users/[id]/page.tsx
"bg-neutral-900/40" → "bg-foreground/40"
```

#### 9.3 全局验证

- `node node_modules/next/dist/bin/next build` 零错误
- 全部 77 个页面正常生成
- 亮色/暗色模式逐页检查
- 移动端响应式检查（768px / 1024px 断点）

---

## 不在本次范围的文件

| 文件 | 原因 |
|------|------|
| `src/app/admin/**` (非遮罩部分) | 后台管理页面功能密集，`bg-red-*`/`bg-amber-*`/`bg-purple-*` 做状态颜色属于语义色，改动风险高 |
| `src/components/admin/**` (非遮罩部分) | 同上 |
| `src/components/workflow/DynamicForm.tsx` | `text-red-500` 为表单必填标记，且表单控件样式已较规范 |
| `src/app/globals.css` | CSS Token 定义层，DESIGN_GUIDE 标记为禁改 |
| `src/app/layout.tsx` | 根布局，修改会影响全站 |
| `src/components/layout/AppShell.tsx` | 已实现良好，侧栏 token 使用正确 |
| `src/components/layout/Navbar.tsx` | 已实现良好，dropdown/focus 样式规范 |

> Admin 页面的 `neutral-900/40` 遮罩层在批次 9 修复。Admin 内部的状态色值（如 `bg-red-100`/`bg-amber-50` 等）暂保留，这些属于后台管理的语义色，改动对功能性影响较大，建议后续单独处理。

---

## Assumptions & Decisions

1. **面向用户页面优先**：首页/登录/注册/工作台/对话/Dashboard 优先于 Admin 后台
2. **全局组件先修**：ErrorMessage/SubscriptionCard/ImageUploader 被复用最多，先改收益最大
3. **仅改 className 和视觉结构**：不修改任何数据流、事件绑定、API 调用、路由逻辑
4. **颜色 token 优先**：所有硬编码色值 → Doubao CSS 变量对应的 Tailwind 类
5. **边框优先于阴影**：卡片/面板只用 `border border-border`，仅 Modal/Popover 保留 `shadow-lg`
6. **hover 平静化**：移除 `hover:-translate-y-*`，改用 Doubao 风格的边框高亮 + 背景晕染
7. **胶囊按钮统一**：所有 CTA 和标签 `rounded-full`
8. **暗色模式全自动**：所有修改使用 token 类名，确保 `prefers-color-scheme: dark` 切换
9. **保留有意的渐变**：Welcome 引导卡片 4 种图标渐变是有意的功能区分，保留

## Verification Steps

1. 每批次改完 `node node_modules/next/dist/bin/next build` 零错误
2. 亮色/暗色模式下逐页视觉检查
3. 移动端响应式（768px / 1024px 断点）
4. 所有功能不受影响：登录/注册/对话/工作流/支付/API
5. 路由重定向正常：`/courses` → `/academy`、`/docs` → `/tutorial`、`/api-docs` → `/dashboard/api-docs`
6. ErrorMessage 组件在各页面的 error/warning/info 三种状态正常显示
7. SubscriptionCard 三种状态（已订阅/试用中/过期）正常切换

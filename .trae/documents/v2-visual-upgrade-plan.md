# 燃渡AI V2.0 视觉质量级大版本升级方案

> 基于 DESIGN_RULES_V2.md 红线约束，融合豆包/扣子/火山方舟/火山引擎/OpenAI 五大参考网站研究成果

---

## 一、设计系统升级

### 1.1 Token 扩展 (`globals.css`)

**新增阴影系统**（参考 Semi Design 5 级阴影）：
- `--shadow-xs` ~ `--shadow-xl`：5 级分层阴影，亮/暗模式各有独立值

**新增品牌光晕**（参考豆包输入框 focus 光晕）：
- `--glow-primary`：标准光晕 `0 0 0 3px rgba(0,101,253,0.15)`
- `--glow-primary-strong`：强调光晕，附加扩散效果

**新增玻璃拟态**（参考豆包/火山方舟 glassmorphism 导航）：
- `--glass-bg`：`rgba(255,255,255,0.72)` / 暗色 `rgba(14,17,21,0.75)`
- `--glass-border`：`rgba(255,255,255,0.3)` / 暗色 `rgba(255,255,255,0.06)`
- `--glass-blur`：`20px`

**新增过渡系统**（参考扣子 90ms-1800ms 分级）：
- `--duration-instant/fast/normal/slow/slower`

**新增缓动曲线**（参考 OpenAI 自定义 ease-curve）：
- `--ease-default/in/out/in-out/spring`

**新增语义色**：
- `--warning` / `--warning-foreground`

**新增表面层叠**：
- `--surface-elevated` / `--surface-overlay`

所有新增 token 在 `:root` 和 `html.dark` 两处同步定义，通过 `@theme inline` 映射 Tailwind 工具类。

### 1.2 暗色模式对比度优化

**核心问题**：当前 `--card` 与 `--background` 同为 `#0e1115`，卡片无法与背景区分。

**优化方案**：建立 4 级表面层级
- `--background`: `#0a0d11`（深化一级背景）
- `--card`: `#12161c`（比背景亮一级）
- `--popover`: `#1a1f27`（弹出层更亮）
- `--sidebar`: `#0f1318`（介于背景和卡片之间）
- `--border`: `#2a303c`（提亮暗色边框）
- `--muted-foreground`: `#9ba8b8`（提亮次要文字）

### 1.3 字体升级

引入 Inter 作为英文显示字体（参考 OpenAI 排版策略），保留中文 fallback 链不变：
```
--font-sans: "Inter", "Stack Sans Text", "PingFang SC", "Microsoft YaHei", ...
```
在 `layout.tsx` 的 `<head>` 中追加 Google Fonts 链接。

### 1.4 全局基础样式

- 微噪点纹理叠加（`body::before`，opacity 0.018，营造纸质感）
- 全局选中色使用品牌蓝半透明（`::selection`）
- 自定义滚动条保持 Doubao 风格

---

## 二、动效系统建设

### 2.1 新增关键帧动画（`globals.css`）

| 动画名 | 用途 | 时长 |
|---|---|---|
| `fade-up` | 元素入场默认 | 300ms ease-out |
| `fade-scale` | 卡片入场 | 300ms ease-out |
| `slide-in-left/right` | 侧栏元素 | 300ms ease-out |
| `expand` | 下拉菜单/手风琴 | 500ms ease-out |
| `pulse-glow` | CTA focus | 2s infinite |
| `shimmer` | 骨架屏 | 1.5s infinite |
| `toast-in/out` | Toast 通知 | 300ms spring |
| `message-in` | 对话气泡 | 150ms ease-out |

### 2.2 交错入场工具类

`.stagger-1` ~ `.stagger-10`（延迟 50ms~500ms），配合入场动画使用。

### 2.3 ScrollReveal Hook

新建 `src/hooks/useScrollReveal.ts`（纯客户端 hook，无业务逻辑），基于 IntersectionObserver，支持 `once` 模式。

---

## 三、全局组件升级

### 3.1 Navbar（`src/components/layout/Navbar.tsx`）

- **容器**：引入 glassmorphism（`bg-[var(--glass-bg)] backdrop-blur-[var(--glass-blur)]`）
- **Logo 文字**：品牌渐变色（`燃渡` 为 primary 渐变，`Ai` 为 foreground）
- **导航链接激活态**：增加 `shadow-xs` 微阴影
- **"免费注册"按钮**：渐变背景 + 阴影 + hover scale/sadow 增强
- **悬浮子菜单**：增加 scale 入场动效（`scale-95 → scale-100 origin-top-left`）
- **移动端菜单**：增加 `animate-expand` 入场

### 3.2 AppShell（`src/components/layout/AppShell.tsx`）

- **侧栏**：增加装饰性品牌色光晕圆（纯视觉 `pointer-events-none`）
- **侧栏分类项激活态**：左侧品牌色边条 + accent 背景
- **新增移动端遮罩层**：侧栏展开时显示半透明遮罩 + backdrop-blur

### 3.3 Button（`src/components/ui/Button.tsx`）

- **primary**：渐变背景 + `shadow-sm` + hover brightness/shadow 增强
- **ghost**：增加 hover 背景过渡
- **outline**：hover 时边框变 primary/40
- **全局**：focus-visible 使用 `glow-primary`，active 增加 `scale-[0.97]` 弹性

### 3.4 Card（`src/components/ui/Card.tsx`）

- hover 增加 `shadow-md` + `-translate-y-0.5` 浮起效果
- CardHeader 边框降低不透明度（`border-border/60`）

### 3.5 Badge（`src/components/ui/Badge.tsx`）

- 新增 `gradient` 变体（`from-primary to-primary-400`，用于 NEW/热门标签）
- 所有变体增加 `shadow-xs`

### 3.6 Toast（`src/components/ui/Toast.tsx`）

- 入场：`toast-in`（从右侧滑入 + 缩放）
- 退出：`toast-out`（滑出 + 缩放，替代当前 opacity-0）
- 容器：增加 glassmorphism（`backdrop-blur-lg`）

### 3.7 Skeleton（`src/components/ui/Skeleton.tsx`）

- shimmer 替代 pulse（从左到右的渐变扫光效果）
- SkeletonCard 增加 `shadow-xs` 和半透明边框

### 3.8 ThemeToggle（`src/components/ui/ThemeToggle.tsx`）

- hover 增加旋转动效（`rotate-12`）
- 图标切换增加 `transition-transform duration-300`

---

## 四、首页全面重构

### 4.1 HeroCarousel（`HeroCarousel.tsx`）

- **容器**：增大高度（320→420→500px），增加 `shadow-lg`
- **幻灯片背景**：径向渐变（`radial-gradient`，参考火山方舟）
- **粒子装饰**：纯 CSS 圆点 + `animate-pulse`，营造科技感
- **内容入场**：标签/标题/描述/CTA 使用 `stagger-1~4` 交错动画
- **CTA 按钮**：玻璃拟态（`bg-white/95 backdrop-blur-sm`）+ hover scale
- **箭头按钮**：增大尺寸、增加 border、hover scale
- **圆点导航**：选中态增加 `shadow` 光晕

### 4.2 WorkflowCategories（`WorkflowCategories.tsx`）

- **标题区**：增加品牌色装饰下划线
- **卡片**：hover 时显示品牌色光晕背景（`from-primary/5 to-transparent`）
- **图标容器**：渐变背景 + hover scale + shadow
- **卡片入场**：使用 `useScrollReveal` + stagger

### 4.3 AdBanner（`AdBanner.tsx`）

- 外层增加 `shadow-md`，圆角升级为 `2xl`
- 动态浮动光斑装饰（`animate-bounce` 6s/8s）
- badge 使用渐变色

### 4.4 PricingSection（`PricingSection.tsx`）

- **推荐卡片**：品牌色边框 + 光晕 + `scale-[1.01]`
- **推荐标签**：渐变背景 + `shadow-sm`
- **CTA 按钮**：高亮套餐使用渐变，非高亮使用 outline 风格
- **check 图标**：统一使用 `text-primary` 替代 success-500

### 4.5 Footer（`Footer.tsx`）

- 深色渐变背景（`from-foreground to-[#080a0e]`）
- 公司名称品牌色渐变
- 链接 hover 增加下划线动效（`after:w-0 → after:w-full`）
- 底部版权分隔线使用渐变

### 4.6 AnnouncementBanner（`AnnouncementBanner.tsx`）

- 背景渐变 + marquee 滚动效果
- 关闭按钮增加 hover scale

---

## 五、功能页升级

### 5.1 智能体对话页（`/chat`）

- **消息气泡**：用户消息使用品牌色渐变 + shadow；AI 消息边框半透明
- **消息入场**：`animate-message-in`（scale + translateY）
- **输入框**：focus 品牌色光晕（`glow-primary`）
- **发送按钮**：hover scale + shadow
- **侧栏"新对话"按钮**：渐变 + shadow
- **历史对话激活态**：左侧品牌色边条（`border-l-2 border-primary`）
- **空状态**：品牌图标动画 + 渐变背景

### 5.2 工作台（`/workspace`）

- 骨架屏 shimmer 替代 pulse
- 卡片 hover 增加 shadow + `-translate-y-1`
- 图标容器渐变背景 + hover scale
- "使用"按钮渐变 + shadow
- 搜索框 focus 光晕

### 5.3 工作流执行页（`/workspace/[id]/use`）

- 输入框统一 focus 光晕
- 进度条使用品牌色渐变（`linear-gradient(90deg, primary, primary-400)`）
- 结果展示增加 `animate-fade-scale` 入场

### 5.4 教程页（`/academy/articles`, `/academy/videos`, `/tutorial`）

- 卡片统一使用 WorkflowCategories 相同的 hover 效果模式
- 视频卡片增加播放按钮装饰（glassmorphism 圆形播放图标）

---

## 六、个人中心升级

### 6.1 资料卡片（`/dashboard`）

- 顶部增加品牌色渐变装饰条（1px 高度）
- "编辑资料"按钮增加 hover 光晕
- 使用记录行 hover 增强（`bg-muted/80`）
- 试用过期横幅增加左侧渐变竖条
- 次级导航增加 hover 下划线动效

### 6.2 子页面

- API Key：表格行 hover + `font-mono` Key 前缀
- 订单：语义化状态 Badge + `font-mono tabular-nums` 金额
- 邀请奖励：`font-mono` 邀请码 + 复制动效

---

## 七、登录注册升级

### 7.1 登录页（`/login`）

- 品牌色渐变装饰圆（参考 HeroSection 背景）
- 微妙网格纹理
- 登录卡片增加 `shadow-md`
- 输入框 focus 光晕
- 登录按钮渐变 + shadow + active scale

### 7.2 注册页（`/register`）

- 同登录页背景装饰方案
- 邀请码验证成功 `animate-fade-scale` 反馈

---

## 八、管理后台升级

### 8.1 AdminSidebar

- 深色渐变背景（`from-card to-surface-elevated`）
- 品牌区增加品牌色光晕装饰
- 导航项激活态：左侧品牌色边条 + `bg-primary/10`
- 导航项 hover 增加过渡动效

### 8.2 后台子页面通用升级

- 表头：`bg-muted/50` + uppercase + tracking-wider
- 表格行：hover `bg-muted/30`
- 统计卡片：图标渐变背景 + tabular-nums 数字
- 表单控件：统一 focus 光晕

---

## 九、新增组件

| 组件 | 路径 | 用途 |
|---|---|---|
| `GradientText` | `src/components/ui/GradientText.tsx` | 品牌色渐变文字 |
| `GlowCard` | `src/components/ui/GlowCard.tsx` | 带品牌色光晕的卡片 |
| `SectionHeader` | `src/components/ui/SectionHeader.tsx` | 首页 section 统一标题 |
| `ScrollReveal` | `src/components/ui/ScrollReveal.tsx` | 滚动触发入场包装 |
| `useScrollReveal` | `src/hooks/useScrollReveal.ts` | 滚动触发 hook |

---

## 十、执行阶段（8 个阶段，约 50+ 文件）

**阶段一**：设计系统基础（`globals.css` + `layout.tsx` + `useScrollReveal.ts`）

**阶段二**：UI 原子组件（Button/Card/Badge/Skeleton/Toast/ThemeToggle/Popover/Avatar/UserQuickMenu + 4 个新建组件）

**阶段三**：布局组件（Navbar/AppShell/OnlineCount/NotificationBell/AdminSidebar）

**阶段四**：首页组件（AnnouncementBanner/HeroCarousel/WorkflowCategories/AdBanner/PricingSection/Footer）

**阶段五**：功能页（chat/workspace/workspace/[id]/use/workflow/[id]/academy/* /tutorial）

**阶段六**：展示页与个人中心（login/register/dashboard/* /welcome）

**阶段七**：管理后台（admin/* 全部子页面）

**阶段八**：验证（`npm run build` + 77 页面检查 + 亮/暗模式 + 移动端）

---

## 十一、红线自检

- [x] 不修改任何 API 路由（`src/app/api/**`）
- [x] 不修改 hooks/state/API 调用/路由/鉴权/业务逻辑
- [x] 不改变路由结构、localStorage 键名
- [x] 不改变 html.dark 主题切换机制、防闪烁脚本
- [x] 不删除/移动任何路由目录
- [x] 不修改客户端/服务端分离规则
- [x] 所有新增 token 在 `:root` 和 `html.dark` 同步定义
- [x] 未删除任何已有 token
- [x] 字体 fallback 链保留 PingFang SC / Microsoft YaHei
- [x] 默认白天主题不变

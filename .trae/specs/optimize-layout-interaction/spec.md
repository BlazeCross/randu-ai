# 布局与交互优化 Spec

## Why
当前平台 UI 升级后功能正常，但布局与交互位置存在多处不满意：
- 首页及导航栏未做"全屏优先 + 窗口化自适应"的现代化适配，且导航栏 Logo 旁缺少"燃渡Ai"品牌文字；
- 功能页（工作台、智能体、图文教程、视频教程）进入后顶部导航栏被 AppShell 顶栏"替代"且偏窄，用户失去全局导航上下文；
- 智能体页面侧栏缺少用户身份信息与历史会话列表，且包含不必要的"快捷提问"与"对话计费"信息，标题"智能体对话"也不符合品牌命名；
- 个人中心页面以使用记录为主，未突出个人资料；
- 暗色模式当前自动跟随系统（`prefers-color-scheme`），用户无法手动切换，且无默认白天主题。

本次改造目标：统一全屏自适应布局、保留功能页顶部导航、重构智能体侧栏为"历史对话 + 用户信息"模式、个人中心聚焦资料展示、新增手动主题切换。

## What Changes

### 1. 全局响应式与默认全屏
- **首页内容容器**由 `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8` 改为支持全屏宽度优先（保留安全边距），窗口缩小时自适应。
- **首页各 section**（HeroCarousel、WorkflowCategories、AdBanner、PricingSection、Footer）适配全屏宽度比例。
- 全局保留 Tailwind 响应式断点机制，窗口化后内容自适应收窄。

### 2. 首页顶部导航栏（Navbar）调整
- Logo 旁新增"燃渡Ai"品牌文字（粗体、深色）。
- 导航链接（首页、工作台、智能体、燃渡学院、个人中心、后台管理）居左。
- 用户头像、套餐、积分、通知铃铛、主题切换按钮居右。
- 导航栏容器去掉 `max-w-7xl` 限制，改为 `w-full px-4 lg:px-8`，铺满浏览器宽度。

### 3. 功能页保留顶部导航栏
- **移除** `Navbar` 组件中针对 `/chat`、`/workspace`、`/workflow`、`/academy/articles`、`/academy/videos`、`/tutorial` 返回 `null` 的逻辑，改为在所有路由均渲染。
- **AppShell 调整**：保留侧栏布局，但顶栏（48px）改为"承载全局 Navbar"的形式——即功能页由「全局 Navbar（窄化版，h-12）+ AppShell 侧栏 + 主区」组成，避免两套顶栏并存。
  - 方案：AppShell 不再渲染自己的顶栏 Logo / 用户菜单 / 通知，仅保留侧栏切换按钮；全局 Navbar 在功能页路由下使用窄化样式（h-12、容器铺满），承担 Logo + 文字 + 导航 + 用户区 + 主题切换。
  - 全局 Navbar 在功能页路由下：导航链接可隐藏或保留为简洁形式（建议保留，便于跨页跳转）。

### 4. 智能体页面侧栏重构
- **标题**：AppShell `title` 由"智能体对话"改为"燃渡Ai助手"。
- **副标题**：移除"文本对话 1 积分/次 · AI 生图 5 积分/次"计费提示。
- **侧栏内容**（自上而下）：
  1. 新对话按钮（保留）
  2. **历史对话栏**：列出最近 N 个对话会话（标题取首条用户消息前 20 字 + 更新时间），点击切换查看，hover 显示删除按钮
  3. ~快捷提问~（**移除**）
  4. **底部用户信息块**：头像 + 昵称 + 套餐等级 Badge + 积分余额
- **对话下方计费**：移除 AI 消息下方的"消耗 X 积分"提示（如有）。
- **自动保存历史会话**：
  - localStorage 结构由单对话（`{messages, updatedAt}`）升级为对话列表（`{conversations: Conversation[], currentId: string}`）。
  - 每个会话：`{id, title, messages, createdAt, updatedAt}`。
  - 用户首次发送消息时创建新会话；每条消息（用户/AI）追加后自动保存到当前会话。
  - 切换会话时加载对应消息；删除会话时从列表移除。
  - 保留最近 20 个会话，超出自动淘汰最旧。

### 5. 个人中心页面重构
- 主视觉改为"个人资料卡片"：大头像 + 昵称（可编辑）+ 邮箱/手机 + 套餐等级 Badge + 积分余额 + 注册时间 + 「编辑资料」按钮。
- 现有「账号信息卡片」「订阅状态卡片」「使用记录列表」降级为次要区块（折叠或下移）。
- 顶部导航按钮组（任务历史/订单管理/邀请奖励/API Key/API 文档/退出登录）保留，但样式弱化为次级导航。

### 6. 主题切换功能
- 默认主题：**白天**（light）。
- 实现：将 `globals.css` 中 `@media (prefers-color-scheme: dark)` 的暗色 token 块改为由 `html.dark` 类选择器触发（移除自动跟随系统）。
- 在 `layout.tsx` 的 `<html>` 上通过 `ThemeProvider` 注入 `class="dark"` 或不注入；默认不加 `dark` 类（即白天）。
- 持久化：localStorage key `randu-theme`，值 `light` | `dark`，默认 `light`。
- 切换按钮：放在顶部状态栏（全局 Navbar 右侧、用户菜单左侧），太阳/月亮图标，点击切换。
- 新建 `src/components/ui/ThemeToggle.tsx` 客户端组件 + `src/components/providers/ThemeProvider.tsx`。
- 防闪烁脚本：在 `<head>` 中注入 inline script，在 HTML 解析前读取 localStorage 并给 `<html>` 加 `dark` 类。

## Impact

- **Affected specs**: 无既有 spec 受影响（`build-ai-workflow-platform` 已全部完成）。
- **Affected code**:
  - `src/components/layout/Navbar.tsx`：Logo 旁加文字、布局改为左导航右用户、功能页不再返回 null、新增主题切换按钮
  - `src/components/layout/AppShell.tsx`：顶栏简化为仅侧栏切换 + 标题区，不再重复渲染 Logo/用户菜单/通知
  - `src/app/layout.tsx`：注入 ThemeProvider、防闪烁脚本
  - `src/app/globals.css`：暗色 token 由 `@media` 改为 `.dark` 选择器
  - `src/app/chat/page.tsx`：标题改名、移除计费副标题、侧栏重构（历史会话 + 用户信息）、移除快捷提问、移除对话下方计费、localStorage 结构升级
  - `src/app/dashboard/page.tsx`：主视觉改为个人资料卡片
  - `src/components/home/HeroCarousel.tsx`、`WorkflowCategories.tsx`、`AdBanner.tsx`、`PricingSection.tsx`、`Footer.tsx`：响应式全屏适配
  - 新增：`src/components/ui/ThemeToggle.tsx`、`src/components/providers/ThemeProvider.tsx`

## ADDED Requirements

### Requirement: 主题切换
The system SHALL provide a manual light/dark theme toggle in the top navigation bar, defaulting to light theme, persisted via localStorage `randu-theme`, and applied via a `dark` class on the `<html>` element (not via `prefers-color-scheme`).

#### Scenario: 首次访问
- **WHEN** 用户首次访问任意页面
- **THEN** 页面以白天主题渲染（无 `dark` 类），localStorage `randu-theme` 不存在或为 `light`

#### Scenario: 切换到暗色
- **WHEN** 用户点击主题切换按钮
- **THEN** `<html>` 添加 `dark` 类，localStorage `randu-theme` 写入 `dark`，按钮图标变为太阳
- **AND** 切换不触发页面刷新

#### Scenario: 刷新页面无闪烁
- **WHEN** 用户刷新页面
- **THEN** 在 HTML 解析前通过 inline script 读取 localStorage 并设置 `dark` 类，避免暗色页面闪烁白底

### Requirement: 历史对话会话列表
The system SHALL persist chat conversations as a list of sessions in localStorage, display them in the agent sidebar, and auto-save each message to the current session.

#### Scenario: 首次发送消息创建会话
- **WHEN** 用户在空对话中发送第一条消息
- **THEN** 系统创建新会话（id、title 取首条用户消息前 20 字、messages、createdAt），设为 `currentId`，写入 localStorage

#### Scenario: 切换历史会话
- **WHEN** 用户点击侧栏历史对话列表中的某条会话
- **THEN** 主区加载该会话的消息，`currentId` 更新为该会话 id

#### Scenario: 删除历史会话
- **WHEN** 用户 hover 历史会话项并点击删除
- **THEN** 该会话从列表移除，若删除的是当前会话则切换到列表第一个会话或清空

#### Scenario: 自动淘汰
- **WHEN** 历史会话数量超过 20
- **THEN** 最旧的会话被自动移除

## MODIFIED Requirements

### Requirement: 全局导航栏
全局导航栏在所有路由（含功能页路由）下均渲染，功能页路由下采用窄化样式（h-12），承担 Logo + "燃渡Ai" 文字 + 导航链接（居左）+ 用户区 + 主题切换（居右）。功能页不再由 AppShell 顶栏重复渲染 Logo/用户菜单/通知。

### Requirement: AppShell 顶栏
AppShell 顶栏简化为：侧栏切换按钮 + 页面标题/副标题 + 弹性间隔 + 教程按钮（可选）。不再渲染 Logo、OnlineCount、NotificationBell、UserQuickMenu（这些由全局 Navbar 提供）。

### Requirement: 智能体页面
- 标题改为"燃渡Ai助手"，移除计费副标题
- 侧栏：新对话 + 历史对话列表 + 底部用户信息块（头像/昵称/套餐/积分）
- 移除快捷提问
- 移除对话下方的积分计费显示
- localStorage 结构升级为多会话列表

### Requirement: 个人中心页面
主视觉改为个人资料卡片（头像、昵称、邮箱/手机、套餐、积分、注册时间、编辑资料按钮），现有使用记录等降级为次要区块。

## REMOVED Requirements

### Requirement: 自动跟随系统主题
**Reason**: 用户需要手动控制主题并默认白天，自动跟随系统不符合预期。
**Migration**: 将 `@media (prefers-color-scheme: dark)` 的暗色 token 块迁移到 `html.dark` 选择器；新增 ThemeProvider + 切换按钮 + 防闪烁脚本。

### Requirement: 智能体侧栏快捷提问
**Reason**: 用户明确要求移除。
**Migration**: 直接删除侧栏与欢迎页中的快捷提问区块。

### Requirement: 智能体对话计费显示
**Reason**: 用户不希望在对话下方看到积分计费。
**Migration**: 移除 AppShell `subtitle` 中的计费文案；如对话气泡下方有"消耗 X 积分"提示也一并移除。

### Requirement: 功能页跳过全局 Navbar
**Reason**: 用户要求功能页保留顶部导航栏。
**Migration**: 移除 Navbar 中 `isAppShellRoute` 返回 null 的逻辑。

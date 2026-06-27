# Tasks

## 阶段一：主题切换基础设施（无依赖，最先完成）

- [x] Task 1: 改造 globals.css 暗色模式触发方式
  - [x] 1.1: 将 `@media (prefers-color-scheme: dark) { :root { ... } }` 改为 `html.dark { ... }`（保留所有暗色 token 不变）
  - [x] 1.2: 将 `.bg-white` 等暗色覆盖规则也迁移到 `html.dark` 作用域下
  - [x] 1.3: 验证：默认页面（无 dark 类）为白天主题

- [x] Task 2: 创建 ThemeProvider 与防闪烁脚本
  - [x] 2.1: 新建 `src/components/providers/ThemeProvider.tsx`，提供 `useTheme()` hook（读取/设置 `randu-theme` localStorage，操作 `<html>` 的 `dark` 类）
  - [x] 2.2: 在 `src/app/layout.tsx` 的 `<head>` 注入 inline script（在 React hydrate 前读取 localStorage 并给 `<html>` 加 `dark` 类）
  - [x] 2.3: 在 `layout.tsx` 的 body 中用 `ThemeProvider` 包裹 children

- [x] Task 3: 创建 ThemeToggle 组件并接入 Navbar
  - [x] 3.1: 新建 `src/components/ui/ThemeToggle.tsx`，太阳/月亮 SVG 图标按钮，点击切换主题
  - [x] 3.2: 在 `Navbar.tsx` 右侧用户区前插入 `<ThemeToggle />`

## 阶段二：全局 Navbar 与 AppShell 改造

- [x] Task 4: Navbar 添加品牌文字 + 左右布局调整
  - [x] 4.1: 在 Logo `<img>` 后追加 `<span class="font-bold text-foreground">燃渡Ai</span>`，移动端隐藏文字
  - [x] 4.2: 将容器 `mx-auto max-w-7xl px-4 sm:px-6 lg:px-8` 改为 `w-full px-4 lg:px-8`，让导航栏铺满宽度
  - [x] 4.3: 确认导航链接居左、用户区居右的布局正确

- [x] Task 5: Navbar 功能页不再返回 null + 窄化样式
  - [x] 5.1: 移除 `Navbar.tsx` 中 `isAppShellRoute` 判断与 `if (isAppShellRoute) return null;`
  - [x] 5.2: 新增 `compact` prop（boolean），功能页路由下传入，使顶栏高度从 h-16 变为 h-12
  - [x] 5.3: 在 `layout.tsx` 中无法根据路由传 prop（Navbar 是客户端组件），改为 Navbar 内部用 `usePathname()` 判断功能页路由并自动应用 compact 样式
  - [x] 5.4: 功能页路由下导航链接保留显示（便于跨页跳转）

- [x] Task 6: AppShell 顶栏简化
  - [x] 6.1: 移除 AppShell 顶栏中的 Logo `<Link>` + `<img>`
  - [x] 6.2: 移除顶栏中的 `<OnlineCount />`、`<NotificationBell />`、`<UserQuickMenu />`（由全局 Navbar 提供）
  - [x] 6.3: 保留：侧栏切换按钮 + 标题/副标题 + 弹性间隔 + 教程按钮
  - [x] 6.4: 验证：功能页顶部出现全局 Navbar（含 Logo+文字+导航+用户区+主题切换），AppShell 顶栏只显示侧栏切换+标题+教程

## 阶段三：首页全屏适配

- [x] Task 7: 首页各 section 全屏宽度适配
  - [x] 7.1: 检查 `HeroCarousel.tsx`、`WorkflowCategories.tsx`、`AdBanner.tsx`、`PricingSection.tsx`、`Footer.tsx`、`AnnouncementBanner.tsx` 的根容器
  - [x] 7.2: 将 `max-w-7xl mx-auto` 改为 `w-full max-w-[1600px] mx-auto` 或 `w-full px-4 lg:px-8`（保留安全边距，支持全屏优先）
  - [x] 7.3: 验证窗口缩小后内容自适应收窄，无横向滚动

## 阶段四：智能体页面重构

- [x] Task 8: 升级 chat 页面 localStorage 多会话结构
  - [x] 8.1: 修改 `StoredConversation` → 新增 `Conversation` 类型（id、title、messages、createdAt、updatedAt）
  - [x] 8.2: 修改存储结构为 `{conversations: Conversation[], currentId: string}`
  - [x] 8.3: 改造 `loadHistory()` → `loadConversations()`：返回 `{conversations, currentId}`
  - [x] 8.4: 改造 `saveHistory()` → `saveConversations()`：保存整个列表
  - [x] 8.5: 新增 `createConversation()`、`switchConversation(id)`、`deleteConversation(id)` 函数
  - [x] 8.6: 保留向后兼容：检测到旧 `randu-chat-history` 结构时迁移为单会话列表
  - [x] 8.7: 限制最多 20 个会话，超出自动淘汰最旧

- [x] Task 9: chat 页面状态与消息流改造
  - [x] 9.1: 新增 `conversations`、`currentId` state，替换原 `messages` state
  - [x] 9.2: `messages` 改为派生值：`conversations.find(c => c.id === currentId)?.messages ?? []`
  - [x] 9.3: `sendMessage` 中：若 `currentId` 为空则先创建新会话；用户消息和 AI 消息都追加到当前会话的 messages
  - [x] 9.4: `handleClear` 改为：清空当前会话（或新建会话），不再清空整个列表
  - [x] 9.5: 自动保存：每次 messages 变化时调用 `saveConversations`

- [x] Task 10: chat 页面侧栏 UI 重构
  - [x] 10.1: AppShell `title="燃渡Ai助手"`，移除 `subtitle` 计费文案（可保留简短副标题或留空）
  - [x] 10.2: 侧栏顶部：保留"新对话"按钮，点击创建新会话
  - [x] 10.3: 侧栏中部：历史对话列表，每项显示标题（首条用户消息前 20 字）+ 相对时间，hover 显示删除按钮，点击切换会话，高亮当前会话
  - [x] 10.4: 侧栏底部：用户信息块（头像 + 昵称 + 套餐 Badge + 积分余额），可复用 `UserQuickMenu variant="sidebar"` 或自行渲染
  - [x] 10.5: 移除侧栏中的"快捷提问"区块
  - [x] 10.6: 移除欢迎页中的"快捷提问"区块（messages.length ===0 时的卡片）

- [x] Task 11: 移除对话下方计费显示
  - [x] 11.1: 检查 chat 页面 AI 消息气泡下方是否有"消耗 X 积分"提示，若有则移除
  - [x] 11.2: 保留 `creditsCost` 在 API 响应中的处理（用于更新积分余额），仅移除 UI 显示
  - [x] 11.3: 验证积分余额仍在侧栏底部正确更新

## 阶段五：个人中心页面重构

- [x] Task 12: dashboard 页面主视觉改为个人资料卡片
  - [x] 12.1: 新增"个人资料卡片"区块作为页面顶部主视觉：大头像（size=xl/lg）+ 昵称 + 套餐 Badge + 积分余额 + 邮箱/手机 + 注册时间 + 「编辑资料」按钮
  - [x] 12.2: 「编辑资料」按钮跳转到 `/dashboard/profile`（已存在）
  - [x] 12.3: 现有「账号信息卡片」改为折叠或下移至资料卡片下方
  - [x] 12.4: 现有「订阅状态卡片」保留但样式弱化
  - [x] 12.5: 现有「使用记录列表」下移，默认折叠或显示前 5 条
  - [x] 12.6: 顶部导航按钮组（任务历史/订单管理等）保留功能，样式弱化为次级导航（小号文字链接）

## 阶段六：验证

- [x] Task 13: 构建验证
  - [x] 13.1: 运行 `npm run build`，确保无类型错误、无构建失败
  - [x] 13.2: 运行 `npm run lint`（若存在），修复新增代码的 lint 警告

- [x] Task 14: 手动验证清单（在 checklist.md 中逐项核对）

# Task Dependencies
- Task 1 → Task 2（ThemeProvider 依赖 globals.css 已切换为 .dark 触发）
- Task 2 → Task 3（ThemeToggle 依赖 ThemeProvider 的 useTheme）
- Task 5、Task 6 可并行（Navbar 改造与 AppShell 简化相互独立）
- Task 8 → Task 9 → Task 10（chat 页面：存储结构 → 状态改造 → UI）
- Task 11 可与 Task 10 并行
- Task 12 独立
- Task 13、Task 14 依赖前面所有任务完成

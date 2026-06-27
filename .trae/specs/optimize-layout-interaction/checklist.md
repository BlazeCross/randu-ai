# Checklist

## 主题切换
- [x] `globals.css` 中 `@media (prefers-color-scheme: dark)` 已改为 `html.dark` 选择器触发
- [x] `.bg-white` 等暗色覆盖规则已迁移到 `html.dark` 作用域
- [x] 默认（无 dark 类）页面渲染为白天主题
- [x] `ThemeProvider` 已创建并提供 `useTheme()` hook
- [x] `layout.tsx` `<head>` 中已注入防闪烁 inline script
- [x] `layout.tsx` body 中已用 `ThemeProvider` 包裹 children
- [x] `ThemeToggle` 组件已创建（太阳/月亮图标）
- [x] `ThemeToggle` 已插入 Navbar 右侧用户区前
- [x] 点击切换按钮：`<html>` 添加/移除 `dark` 类，localStorage `randu-theme` 更新
- [x] 刷新页面无白底闪烁
- [x] localStorage 不存在时默认白天主题

## 全局 Navbar
- [x] Logo 旁已添加"燃渡Ai"品牌文字（粗体）
- [x] 导航栏容器已去掉 `max-w-7xl`，改为 `w-full px-4 lg:px-8` 铺满宽度
- [x] 导航链接（首页/工作台/智能体/燃渡学院/个人中心/后台管理）居左
- [x] 用户头像、套餐、积分、通知、主题切换按钮居右
- [x] 移除 `isAppShellRoute` 返回 null 的逻辑，所有路由均渲染 Navbar
- [x] 功能页路由下 Navbar 使用窄化样式（h-12）
- [x] 功能页路由下导航链接正常显示

## AppShell 顶栏
- [x] 已移除顶栏中的 Logo `<img>`
- [x] 已移除顶栏中的 `OnlineCount`、`NotificationBell`、`UserQuickMenu`
- [x] 保留侧栏切换按钮
- [x] 保留标题/副标题
- [x] 保留教程按钮（可选）
- [x] 功能页顶部同时显示全局 Navbar + AppShell 顶栏，无重复元素

## 首页全屏适配
- [x] HeroCarousel 容器适配全屏宽度（无 max-w-7xl 限制）
- [x] WorkflowCategories 容器适配全屏宽度
- [x] AdBanner 容器适配全屏宽度
- [x] PricingSection 容器适配全屏宽度
- [x] Footer 容器适配全屏宽度
- [x] AnnouncementBanner 容器适配全屏宽度
- [x] 窗口缩小后内容自适应收窄，无横向滚动条
- [x] 全屏下视觉比例美观

## 智能体页面
- [x] AppShell `title="燃渡Ai助手"`
- [x] 已移除 `subtitle` 中的"文本对话 1 积分/次 · AI 生图 5 积分/次"计费文案
- [x] 侧栏顶部保留"新对话"按钮
- [x] 侧栏中部显示历史对话列表
- [x] 历史对话项显示：标题（首条用户消息前 20 字）+ 相对时间
- [x] 历史对话项 hover 显示删除按钮
- [x] 点击历史对话项可切换查看该会话消息
- [x] 当前会话在列表中高亮
- [x] 侧栏底部显示用户信息块（头像 + 昵称 + 套餐 Badge + 积分余额）
- [x] 已移除侧栏中的"快捷提问"区块
- [x] 已移除欢迎页中的"快捷提问"区块
- [x] 已移除 AI 消息下方的积分计费提示（如有）
- [x] localStorage 结构升级为 `{conversations, currentId}`
- [x] 每个 Conversation 含 id、title、messages、createdAt、updatedAt
- [x] 首次发送消息时创建新会话
- [x] 每条消息追加后自动保存到当前会话
- [x] 最多保留 20 个会话，超出自动淘汰最旧
- [x] 旧版 `randu-chat-history` 单对话结构能自动迁移为新结构
- [x] 积分余额仍能在侧栏底部正确更新（基于 API 返回的 creditsCost）

## 个人中心页面
- [x] 顶部主视觉为"个人资料卡片"：大头像 + 昵称 + 套餐 Badge + 积分余额 + 邮箱/手机 + 注册时间
- [x] 「编辑资料」按钮跳转 `/dashboard/profile`
- [x] 原「账号信息卡片」已折叠或下移
- [x] 原「订阅状态卡片」保留但样式弱化
- [x] 原「使用记录列表」下移，默认折叠或显示前 5 条
- [x] 顶部导航按钮组功能保留，样式弱化为次级导航

## 构建与回归
- [x] `npm run build` 通过，无类型错误
- [x] 无构建失败
- [x] 无新增 lint 警告（或已修复）
- [x] 客户端无 Prisma/服务端模块误打包错误（沿用 analytics-client.ts 分离方案）

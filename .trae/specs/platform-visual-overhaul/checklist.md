# 燃渡AI平台视觉与交互全面重构验证清单

## 阶段一：设计系统 4.0

- [ ] `src/app/globals.css` :root 变量已更新（配色/字体/间距/圆角/阴影/动效）
- [ ] `@theme inline` Tailwind v4 映射已更新
- [ ] `html.dark` 深色模式变量已定义
- [ ] 所有 CSS 变量正确解析（无 undefined）

## 阶段二：基础组件

### Button 组件
- [ ] `src/components/ui/Button.tsx` 存在
- [ ] 5种变体：primary渐变/secondary实色/ghost透明/outline边框/danger红色
- [ ] 3种尺寸：lg/md/sm
- [ ] hover态：上浮2px + 阴影
- [ ] active态：下沉1px
- [ ] disabled态：opacity 0.5
- [ ] loading态：显示spinner

### Card 组件
- [ ] `src/components/ui/Card.tsx` 存在
- [ ] 4种变体：default/elevated/glass/outline
- [ ] hoverable悬浮效果：translateY(-4px) + shadow-lg
- [ ] glass态：backdrop-filter blur(12px)

### Input 组件
- [ ] `src/components/ui/Input.tsx` 存在
- [ ] 5种状态：default/focus/error/success/disabled
- [ ] focus态：2px边框 + 3px光晕
- [ ] 支持 label 和 helperText

### Modal 组件
- [ ] `src/components/ui/Modal.tsx` 存在
- [ ] 3种尺寸：sm(480px)/md(640px)/lg(800px)
- [ ] backdrop blur效果
- [ ] scale+fade动画（进入300ms spring）
- [ ] ESC键和点击外部关闭

### Badge 组件
- [ ] `src/components/ui/Badge.tsx` 存在
- [ ] 3种变体：solid/subtle/outline
- [ ] 7种类型：default/success/warning/error/info/new/hot
- [ ] NEW/HOT使用渐变背景

## 阶段三：首页叙事

### Hero 区
- [ ] `src/components/home/HeroSection.tsx` 已重构
- [ ] 超大标题（64px font-display）
- [ ] 副标题（24px）
- [ ] 渐变或几何图形动态背景
- [ ] 双CTA按钮（主色渐变 + 次色）
- [ ] 6个冷启动气泡（半透明背景+hover边框）
- [ ] 移动端全宽适配
- [ ] ScrollReveal动画

### 快速入口区
- [ ] `src/components/home/QuickEntrySection.tsx` 已创建
- [ ] 「我想学AI」大按钮
- [ ] 「我要用工具」大按钮
- [ ] hover上浮效果

### 核心能力区
- [ ] `src/components/home/CoreCapabilitiesSection.tsx` 已创建
- [ ] 2x2网格布局
- [ ] 4大能力：AI对话/视频生成/图片生成/工作流
- [ ] 大图标(64px+) + 渐变背景
- [ ] 卡片hover上浮
- [ ] stagger动画

### 数据背书区
- [ ] `src/components/home/StatsSection.tsx` 已优化
- [ ] 超大字号数字（48-64px）
- [ ] 主色强调
- [ ] 计数动画
- [ ] 几何装饰替代旧版渐变

### 用户评价区
- [ ] `src/components/home/TestimonialsSection.tsx` 已优化
- [ ] 更大头像（64px圆形）
- [ ] 评分星星
- [ ] 引用装饰
- [ ] 卡片悬浮效果

### 定价预览区
- [ ] `src/components/home/PricingSection.tsx` 已优化
- [ ] 3套餐：免费/Pro/企业
- [ ] Pro套餐突出（边框+阴影+「最受欢迎」标签）

### 最终CTA区
- [ ] `src/components/home/FinalCTASection.tsx` 已创建
- [ ] 大标题
- [ ] 主CTA按钮
- [ ] 渐变背景装饰

## 阶段四：核心页面

### 登录页
- [ ] `src/app/login/page.tsx` 已升级
- [ ] 左右50:50分栏（桌面端）
- [ ] 左侧品牌区：渐变背景 + 几何装饰 + Logo + slogan
- [ ] 微信登录主按钮突出
- [ ] 移动端：品牌折叠，微信登录置顶

### 注册页
- [ ] `src/app/register/page.tsx` 已升级
- [ ] 与登录页风格统一
- [ ] 表单字段分组
- [ ] 协议复选框优化

### 工作台页面
- [ ] `src/app/workspace/page.tsx` 已优化
- [ ] 左侧边栏固定(240px)
- [ ] Bot切换 + 功能列表 + 历史对话
- [ ] 右侧主区域布局
- [ ] 输入框固定底部，大尺寸

### 工作流市场
- [ ] `src/app/marketplace/page.tsx` 已优化
- [ ] 顶部筛选栏（行业 + 场景）
- [ ] 网格卡片布局
- [ ] 卡片hover上浮
- [ ] 搜索框样式

## 阶段五：动效与微交互

- [ ] 页面过渡动画（fade + slide-up）
- [ ] ScrollReveal stagger-1~10 时序正确
- [ ] fade/slide/zoom 三种动画变体
- [ ] Skeleton骨架屏（rectangular/circular/text + shimmer）
- [ ] 按钮点击反馈
- [ ] 卡片悬浮态

## 阶段六：微信小程序互通

- [ ] `docs/miniprogram-integration-architecture.md` 已生成
- [ ] UnionID统一用户体系方案
- [ ] 小程序与网站API对应关系
- [ ] `docs/miniprogram-pages.md` 已生成
- [ ] 小程序核心页面规划
- [ ] 小程序到网站跳转逻辑

## 阶段七：构建与部署

- [ ] `npx next build` 无错误
- [ ] 所有页面无 console error
- [ ] 响应式布局各断点正常
- [ ] 动画流畅度 60fps
- [ ] Git commit 并 push
- [ ] 服务器部署成功
- [ ] 首页正常访问
- [ ] 登录页正常访问
- [ ] 工作台正常访问
- [ ] 工作流市场正常访问
- [ ] 移动端体验流畅
- [ ] 深色模式切换正常

# 燃渡AI平台视觉与交互全面重构任务清单

## 阶段一：设计系统 4.0（基础建设）

### Task 1: 设计系统 4.0 规划与落地

- [ ] SubTask 1.1: 创建 `src/app/globals.css` 新版 `:root` 变量（配色/字体/间距/圆角/阴影/动效）
- [ ] SubTask 1.2: 更新 `@theme inline` Tailwind v4 映射
- [ ] SubTask 1.3: 添加深色模式变量 `html.dark`
- [ ] SubTask 1.4: 验证 CSS 变量正确解析

### Task 2: 全局基础样式

- [ ] SubTask 2.1: 添加通用动画类（fade-in/slide-up/scale-in）
- [ ] SubTask 2.2: 添加骨架屏样式（Skeleton）
- [ ] SubTask 2.3: 添加页面过渡动画样式
- [ ] SubTask 2.4: 添加深色模式适配样式

## 阶段二：基础组件升级

### Task 3: Button 组件升级

- [ ] SubTask 3.1: 分析千问AI按钮设计，确定5种变体（primary渐变/secondary实色/ghost透明/outline边框/danger红色）
- [ ] SubTask 3.2: 确定3种尺寸（lg: 12px24px / md: 10px20px / sm: 8px16px）
- [ ] SubTask 3.3: 编写 `src/components/ui/Button.tsx`，包含5变体×3尺寸的所有组合
- [ ] SubTask 3.4: 实现 hover（上浮2px+阴影）、active（下沉1px）、disabled（opacity0.5）、loading（spinner）状态
- [ ] SubTask 3.5: 单元测试验证

### Task 4: Card 组件升级

- [ ] SubTask 4.1: 确定4种变体（default白色边框/elevated凸起/glass毛玻璃/outline线条）
- [ ] SubTask 4.2: 编写 `src/components/ui/Card.tsx`
- [ ] SubTask 4.3: 实现 hoverable 悬浮上浮效果（translateY(-4px) + shadow-lg）
- [ ] SubTask 4.4: 玻璃态实现 backdrop-filter: blur(12px)

### Task 5: Input 输入框组件升级

- [ ] SubTask 5.1: 确定5种状态（default/focus蓝色边框/error红色边框/success绿色边框/disabled灰色）
- [ ] SubTask 5.2: 编写 `src/components/ui/Input.tsx`，支持 label 和 helperText
- [ ] SubTask 5.3: 实现 focus 聚焦态（2px边框 + 3px光晕）
- [ ] SubTask 5.4: 单元测试验证

### Task 6: Modal 模态框组件升级

- [ ] SubTask 6.1: 确定3种尺寸（sm:480px / md:640px / lg:800px）
- [ ] SubTask 6.2: 编写 `src/components/ui/Modal.tsx`
- [ ] SubTask 6.3: 实现 backdrop blur 效果（backdrop-filter: blur(4px)）
- [ ] SubTask 6.4: 实现 scale+fade 动画（进入300ms spring / 退出200ms）
- [ ] SubTask 6.5: ESC键和点击外部关闭功能

### Task 7: Badge 徽章组件升级

- [ ] SubTask 7.1: 确定3种变体（solid实色/subtle浅色/outline线条）
- [ ] SubTask 7.2: 确定类型（default/success/warning/error/info/new/hot）
- [ ] SubTask 7.3: 编写 `src/components/ui/Badge.tsx`
- [ ] SubTask 7.4: NEW/HOT 使用主色渐变背景+白色文字

## 阶段三：首页全新叙事

### Task 8: Hero 区重构

- [ ] SubTask 8.1: 重写 `src/components/home/HeroSection.tsx`
- [ ] SubTask 8.2: 实现超大标题（64px font-display）+ 副标题（24px）
- [ ] SubTask 8.3: 添加渐变或几何图形动态背景（不能用纯色）
- [ ] SubTask 8.4: 实现双CTA按钮（主色渐变"免费开始" + 次色"观看演示"）
- [ ] SubTask 8.5: 保留6个冷启动气泡，改为半透明背景+hover边框
- [ ] SubTask 8.6: 移动端布局适配（按钮全宽）
- [ ] SubTask 8.7: ScrollReveal 动画应用

### Task 9: 快速入口区（新增）

- [ ] SubTask 9.1: 创建 `src/components/home/QuickEntrySection.tsx`
- [ ] SubTask 9.2: 两个大按钮：「我想学AI」和「我要用工具」
- [ ] SubTask 9.3: 点击「学AI」跳转 /academy/paths，点击「用工具」跳转 /workspace
- [ ] SubTask 9.4: 按钮hover上浮+阴影效果

### Task 10: 核心能力区重构

- [ ] SubTask 10.1: 创建 `src/components/home/CoreCapabilitiesSection.tsx`
- [ ] SubTask 10.2: 2x2网格展示4大能力（AI对话/视频生成/图片生成/工作流）
- [ ] SubTask 10.3: 大图标(64px+) + 圆形渐变背景
- [ ] SubTask 10.4: 卡片hover上浮效果
- [ ] SubTask 10.5: ScrollReveal stagger 动画

### Task 11: 数据背书区优化

- [ ] SubTask 11.1: 修改 `src/components/home/StatsSection.tsx`
- [ ] SubTask 11.2: 超大字号数字（48-64px），主色强调
- [ ] SubTask 11.3: 数字计数动画（进入视口时触发）
- [ ] SubTask 11.4: 移除旧版渐变，改用几何装饰

### Task 12: 用户评价区优化

- [ ] SubTask 12.1: 修改 `src/components/home/TestimonialsSection.tsx`
- [ ] SubTask 12.2: 更大头像（64px圆形）+ 评分星星
- [ ] SubTask 12.3: 引用装饰（"符号）+ 评价内容
- [ ] SubTask 12.4: 卡片悬浮效果

### Task 13: 定价预览区优化

- [ ] SubTask 13.1: 修改 `src/components/home/PricingSection.tsx`
- [ ] SubTask 13.2: 3套餐简化展示（免费/Pro/企业）
- [ ] SubTask 13.3: Pro套餐突出（边框+阴影+「最受欢迎」标签）
- [ ] SubTask 13.4: 按钮hover效果

### Task 14: 最终CTA区（新增）

- [ ] SubTask 14.1: 创建 `src/components/home/FinalCTASection.tsx`
- [ ] SubTask 14.2: 大标题 + 主CTA按钮
- [ ] SubTask 14.3: 渐变背景装饰

## 阶段四：核心页面重构

### Task 15: 登录页升级

- [ ] SubTask 15.1: 修改 `src/app/login/page.tsx`
- [ ] SubTask 15.2: 左右50:50分栏（桌面端）
- [ ] SubTask 15.3: 左侧品牌区：渐变背景 + 几何装饰 + Logo + slogan + 微信二维码占位
- [ ] SubTask 15.4: 右侧表单区：微信登录主按钮 + 分隔线 + 邮箱登录表单
- [ ] SubTask 15.5: 移动端：品牌折叠，微信登录置顶

### Task 16: 注册页升级

- [ ] SubTask 16.1: 修改 `src/app/register/page.tsx`
- [ ] SubTask 16.2: 与登录页风格统一（左右分栏）
- [ ] SubTask 16.3: 表单字段分组（基本信息/账号信息/协议同意）
- [ ] SubTask 16.4: 协议复选框优化

### Task 17: 工作台页面优化

- [ ] SubTask 17.1: 分析千问AI对话界面，确定布局
- [ ] SubTask 17.2: 修改 `src/app/workspace/page.tsx`
- [ ] SubTask 17.3: 左侧边栏固定(240px)：Bot切换 + 功能列表 + 历史对话
- [ ] SubTask 17.4: 右侧主区域：欢迎语 + 快捷工具栏 + 消息列表
- [ ] SubTask 17.5: 输入框固定底部，大尺寸

### Task 18: 工作流市场优化

- [ ] SubTask 18.1: 修改 `src/app/marketplace/page.tsx`
- [ ] SubTask 18.2: 顶部筛选栏（行业 + 场景，胶囊按钮样式）
- [ ] SubTask 18.3: 网格卡片布局，卡片hover上浮
- [ ] SubTask 18.4: 搜索框样式优化

## 阶段五：动效与微交互

### Task 19: 页面过渡动画

- [ ] SubTask 19.1: 在 `src/app/layout.tsx` 添加 page transition
- [ ] SubTask 19.2: 实现 fade + slide-up 组合动画

### Task 20: ScrollReveal 优化

- [ ] SubTask 20.1: 检查现有 `src/components/ui/ScrollReveal.tsx`
- [ ] SubTask 20.2: 确保 stagger-1~10 时序正确
- [ ] SubTask 20.3: 添加 fade/slide/zoom 三种动画变体

### Task 21: 骨架屏加载态

- [ ] SubTask 21.1: 检查 `src/components/ui/Skeleton.tsx`
- [ ] SubTask 21.2: 确保有 rectangular/circular/text 三种变体
- [ ] SubTask 21.3: 添加 shimmer 动画效果

## 阶段六：微信小程序互通架构

### Task 22: 数据互通架构设计

- [ ] SubTask 22.1: 设计 UnionID 统一用户体系方案
- [ ] SubTask 22.2: 输出 `docs/miniprogram-integration-architecture.md`
- [ ] SubTask 22.3: 定义小程序与网站 API 对应关系

### Task 23: 小程序入口规划

- [ ] SubTask 23.1: 规划小程序核心页面（首页/对话/工作流/学习/我的）
- [ ] SubTask 23.2: 输出 `docs/miniprogram-pages.md`
- [ ] SubTask 23.3: 设计小程序到网站的跳转逻辑

## 阶段七：构建验证与部署

### Task 24: 本地构建验证

- [ ] SubTask 24.1: 执行 `npx next build` 确认无类型错误
- [ ] SubTask 24.2: 验证所有新增组件可正常渲染
- [ ] SubTask 24.3: 检查控制台无 error

### Task 25: 部署与测试

- [ ] SubTask 25.1: Git commit 所有更改并 push
- [ ] SubTask 25.2: 服务器部署验证
- [ ] SubTask 25.3: 视觉回归测试（截图对比）
- [ ] SubTask 25.4: 移动端兼容性测试
- [ ] SubTask 25.5: 深色模式测试

---

# Task Dependencies

```
Task 1-2 → Task 3-7（并行）
Task 3-7（并行）→ Task 8-14（并行）
Task 8-14（并行）→ Task 15-18（并行）
Task 19-21（并行）→ Task 15-18（并行）
Task 1-21（并行）→ Task 22-23（并行）
Task 1-23 → Task 24-25
```

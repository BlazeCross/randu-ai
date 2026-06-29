# 显示修复 + 定价页 + 后台管理与支付宝订阅 Spec

## Why

V2.0 视觉升级部署后，多个页面存在布局/显示问题（首页底部背景割裂、轮播图未拉通、工作台/智能体/教程页侧栏随内容滚动、智能体顶部重叠且输入框未固定）。同时平台缺少核心商业化能力（定价页、支付宝订阅付费、教程与轮播图的后台管理、套餐/积分快捷入口）。需要一次性修复显示问题并补齐商业化基础设施。

## 分工判断

**全部由当前 Agent（非 Design 模式）完成。** 理由：

1. 大部分需求是功能开发（后台管理系统、支付宝集成、数据库 schema 变更、按钮跳转），Design 模式按规则不能碰功能逻辑/状态/API/数据库
2. 视觉修复（背景色、轮播拉通、侧栏固定）涉及滚动逻辑与布局结构，必须改代码而非仅 className
3. 燃渡学院内容丰富需全网搜索研究 + 内容结构设计，属于内容创作
4. 定价页需集成订阅套餐数据与支付宝按钮，功能部分必须由当前 Agent 完成

完成后若用户对某些页面视觉呈现不满意，可再让 Design 模式做纯 className 精修。

## What Changes

### A. 显示问题修复
- 首页底部背景颜色与其他区域割裂 → 统一过渡
- 首页第一页轮播图（HeroCarousel）左右拉通全屏宽度
- 工作台页面：左侧功能栏固定不滚动，保留手动切换打开/收起按钮，修改按钮图标（当前图标为汉堡菜单三横线，与"展开/收起侧栏"语义不符，改为面板图标）
- 智能体页面：容器高度调整修复顶部与全局导航栏重叠；底部输入框区域固定在底部不随消息滚动；左侧功能栏固定不滚动
- 图文教程、视频教程页面：左侧功能栏固定不滚动

### B. 公司名规范
- 全站将"燃渡AI"品牌名保留为产品名，但在涉及公司主体说明的区域（Footer、定价页、关于、注册协议等）显示全称"四川燃渡文化传媒有限公司"
- 日常导航/品牌处显示简称"燃渡文化传媒"

### C. 燃渡学院内容丰富
- 全网搜索参考主流 AI 教育平台，增加：学习路径、推荐课程、讲师介绍、学习数据统计、学员评价、FAQ 等板块
- 内容由 Agent 研究后填充

### D. 教程后台管理系统（图文 + 视频）
- 后台新增"图文教程管理"与"视频教程管理"两个模块
- 每个教程支持：标题、分类、封面、正文/视频地址、排序、上下架
- 新增字段：学习人数（可在后台修改设置）、浏览次数（可在后台修改设置）、学习权限（免费 / VIP）
- 前台教程列表按权限过滤（VIP 教程仅订阅用户可学）
- **BREAKING**：数据库新增 Tutorial 模型（或扩展现有表），需运行迁移

### E. 首页轮播图后台管理系统
- 后台新增"首页轮播管理"模块
- 支持：上传图片、设置标题/描述/跳转链接/排序/上下架
- 前台 HeroCarousel 改为从 API 读取轮播数据（无数据时回退默认）
- **BREAKING**：数据库新增 CarouselSlide 模型

### F. 定价页面
- 顶部导航栏新增"定价"链接 → `/pricing`
- 页面布局参考用户提供的图片：套餐对比卡片 + 功能对比表 + FAQ
- 套餐数据从 `/api/payment/packages` 读取
- 点击订阅按钮跳转支付宝支付

### G. 支付宝订阅付费完善
- 完善 `/api/payment/create`：对接支付宝电脑网站支付（alipay.trade.page.pay）
- 完善 `/api/payment/callback`：同步返回 + 异步通知验签
- 订阅成功后更新用户套餐等级与积分
- 订阅状态管理（到期时间、自动续费可选）
- 所需材料清单见 tasks.md

### H. 积分余额页面
- 新增 `/credits` 页面：显示积分余额、积分明细、积分套餐购买入口
- 顶部导航栏右上角积分余额改为按钮 → 跳转 `/credits`

### I. 套餐等级按钮化
- 顶部导航栏右上角套餐等级 Badge 改为可点击按钮 → 跳转 `/pricing`

## Impact

- Affected specs: build-ai-workflow-platform, optimize-layout-interaction
- Affected code:
  - 数据库：prisma/schema.prisma 新增 CarouselSlide、Tutorial 模型
  - 后台：src/app/admin/ 新增 carousel、tutorials/articles、tutorials/videos 模块
  - API：新增 /api/admin/carousel、/api/admin/tutorials 等
  - 前台：HeroCarousel、Navbar、UserQuickMenu、Footer、academy、chat、workspace、articles、videos 页面
  - 新页面：/pricing、/credits
  - 支付：src/lib/alipay.ts、/api/payment/*

## ADDED Requirements

### Requirement: 首页轮播图全屏宽度
The system SHALL render HeroCarousel at full viewport width (左右拉通), breaking out of the page's max-width container.

#### Scenario: 首页轮播显示
- **WHEN** user visits homepage
- **THEN** 轮播图横向铺满浏览器窗口宽度
- **AND** 内容仍居中可读

### Requirement: 功能页侧栏固定
The system SHALL keep the left sidebar fixed (not scrolling with main content) on workspace, chat, academy/articles, academy/videos pages, while preserving the manual toggle open/collapse button with a semantically correct panel icon.

#### Scenario: 滚动主内容
- **WHEN** user scrolls the main content area
- **THEN** 左侧功能栏保持固定不动
- **AND** 切换按钮仍可点击展开/收起侧栏

### Requirement: 智能体页面输入框固定
The system SHALL fix the chat input area at the bottom of the chat page, so it does not scroll with messages.

#### Scenario: 对话滚动
- **WHEN** user scrolls through conversation messages
- **THEN** 底部输入框区域固定在视口底部
- **AND** 顶部不与全局导航栏重叠

### Requirement: 教程后台管理系统
The system SHALL provide admin modules to manage articles and video tutorials, including fields: title, category, cover, content/video URL, sort order, publish status, study count (editable), view count (editable), access level (free/VIP).

#### Scenario: 管理员上传教程
- **WHEN** admin creates a tutorial with access level VIP
- **THEN** 免费用户在教程列表看不到该教程或看到锁定标识

### Requirement: 轮播图后台管理系统
The system SHALL provide an admin module to manage homepage carousel slides: upload image, set title/description/link/sort/publish status.

#### Scenario: 管理员添加轮播
- **WHEN** admin adds a published carousel slide
- **THEN** 首页轮播自动展示该幻灯片

### Requirement: 定价页面
The system SHALL provide a /pricing page showing subscription plan comparison cards (referencing user-provided image layout), with subscribe buttons that trigger Alipay payment.

#### Scenario: 用户查看定价
- **WHEN** user visits /pricing
- **THEN** 看到套餐对比卡片 + 功能对比表 + FAQ
- **AND** 点击订阅可发起支付宝支付

### Requirement: 积分余额页面
The system SHALL provide a /credits page showing balance, transaction history, and package purchase entry.

#### Scenario: 查看积分
- **WHEN** user clicks the credits button in navbar
- **THEN** 跳转到 /credits 页面显示积分明细

### Requirement: 支付宝订阅付费
The system SHALL complete Alipay integration for subscription payment: create order → redirect to Alipay → sync return + async callback → verify signature → update user plan & credits.

#### Scenario: 订阅成功
- **WHEN** user pays via Alipay and callback verifies successfully
- **THEN** 用户套餐等级更新
- **AND** 积分按套餐发放

## MODIFIED Requirements

### Requirement: 顶部导航栏右上角
套餐等级 Badge 改为可点击按钮跳转 /pricing；积分余额数字改为可点击按钮跳转 /credits。

### Requirement: 公司名显示
全站涉及公司主体说明的区域显示全称"四川燃渡文化传媒有限公司"，品牌/导航处保留"燃渡AI"或简称"燃渡文化传媒"。

### Requirement: 燃渡学院首页
内容从单一入口卡片扩展为：Hero + 学习路径 + 推荐课程 + 讲师 + 学习数据 + 学员评价 + FAQ。

## REMOVED Requirements
无（所有变更为新增或修改）。

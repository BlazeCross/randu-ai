# AI工作流服务平台 Spec

## Why
陆知远（四川燃渡传媒创始人）在扣子（Coze）平台拥有上百个AI工作流，覆盖内容创作、数据处理、自动化运营等场景。现需搭建自有网站，将这些工作流包装成可对外服务的标准化产品，让C端学习用户和B端商家客户直接在网站上使用，无需跳转扣子平台。本规格聚焦 Phase 1 MVP，首批工作流为「服装换装视频生成」。

## What Changes
- 新建 Next.js（App Router + TypeScript）项目，搭建前端页面路由结构
- 配置 Tailwind CSS（主色 #2563EB 科技蓝 + 辅助色 #10B981 成功绿 + 中性灰），参考 Stripe/Linear 简约高级风格
- 集成 PostgreSQL（Prisma ORM），创建 users / usage_logs / plans / workflows 数据表
- 实现用户系统：注册（邮箱/手机号）/ 登录 / JWT 鉴权 / 个人中心
- 实现首页（C端宣传：Hero + 工作流分类 + 广告位 + 定价入口）
- 实现 B 端工作台（工作流列表 + 搜索筛选）
- 实现工作流详情页（介绍 + 使用说明 + 飞书文档跳转）
- 实现工作流使用页（图片上传 + 进度展示 + 视频结果 + 下载）
- 对接阿里云 OSS（图片/视频存储 + CDN）
- 对接 Coze API 异步接口（POST /v3/workflow/async_run + GET /task/{id} 轮询）
- 实现 7 天试用次数限制（未付费用户 7 天内最多 10 次）
- 初始化套餐数据（基础版/专业版/企业版），预留支付宝支付接口（Phase 2 完整实现）
- 响应式适配（移动端正常访问）+ 错误友好提示 + 流畅动画
- 部署到 Vercel（前端）+ 阿里云轻量服务器（后端，如需分离）

## Impact
- Affected specs: 无（全新项目）
- Affected code: 全新项目，无现有代码库
- 外部依赖：Coze 平台 API、阿里云 OSS、飞书文档、支付宝（Phase 2）

## ADDED Requirements

### Requirement: 项目基础设施
系统 SHALL 使用 Next.js（App Router + TypeScript）初始化项目，配置 Tailwind CSS（主色 #2563EB、辅助色 #10B981），搭建路由结构（/, /workspace, /workflow/[id], /workspace/[id]/use, /login, /register, /dashboard），配置环境变量（Coze API Token、OSS、数据库、JWT 密钥）。

#### Scenario: 项目初始化
- **WHEN** 开发者初始化项目
- **THEN** Next.js + TypeScript + Tailwind CSS 就绪，路由结构与环境变量配置完成

### Requirement: 数据库设计
系统 SHALL 使用 PostgreSQL（Prisma ORM），包含以下核心表：
- users（id, email, phone, password_hash, created_at, trial_expires_at, is_subscribed, subscription_plan）
- usage_logs（id, user_id, workflow_id, task_id, status, tokens_used, created_at, completed_at）
- plans（id, name, daily_limit, monthly_price, features）
- workflows（id, name, description, category, coze_workflow_id, icon, status）

#### Scenario: 数据库就绪
- **WHEN** 执行数据库迁移
- **THEN** 四张核心表创建成功，plans 表初始化基础版/专业版/企业版数据

### Requirement: 用户注册与登录
系统 SHALL 提供用户注册（邮箱/手机号 + 密码）和登录功能，使用 JWT 鉴权。注册时自动设置 trial_expires_at 为 7 天后。

#### Scenario: 新用户注册
- **WHEN** 用户填写注册信息并提交至 /api/auth/register
- **THEN** 创建用户账户，trial_expires_at 设为 7 天后，签发 JWT，自动登录

#### Scenario: 用户登录
- **WHEN** 用户输入账号密码提交至 /api/auth/login
- **THEN** 验证成功后签发 JWT Token，跳转工作台

#### Scenario: 鉴权失败
- **WHEN** 未登录用户访问受保护接口
- **THEN** 返回 401，前端跳转登录页

### Requirement: 首页（C端宣传页）
系统 SHALL 提供首页 /，包含 Hero 区（大标题 + 一句话价值主张 + "立即体验"按钮）、工作流分类展示区（卡片式布局：图标+名称+简介）、C 端广告位（Banner 轮播）、底部（定价入口 + 联系方式）。

#### Scenario: 用户访问首页
- **WHEN** 用户访问 /
- **THEN** 显示品牌介绍、工作流分类卡片、广告轮播和定价入口

### Requirement: B端工作台
系统 SHALL 提供工作台 /workspace，展示工作流列表，支持搜索筛选，提供在线使用入口。

#### Scenario: 用户浏览工作台
- **WHEN** 用户访问 /workspace
- **THEN** 显示工作流卡片列表，可按分类搜索筛选，点击进入详情或使用页

### Requirement: 工作流详情页
系统 SHALL 提供工作流详情页 /workflow/[id]，展示工作流介绍、使用说明，提供跳转飞书长文档/教程的链接。

#### Scenario: 用户查看工作流详情
- **WHEN** 用户访问 /workflow/[id]
- **THEN** 显示工作流介绍、使用说明、飞书文档跳转链接和使用入口

### Requirement: 工作流使用页面
系统 SHALL 提供工作流使用页 /workspace/[id]/use，支持图片上传（拖拽 + 点击，单张 ≤10MB，支持预览）、使用说明、飞书文档跳转、提交后进度展示、完成后视频预览与下载。

#### Scenario: 用户上传图片
- **WHEN** 用户拖拽或点击上传图片
- **THEN** 校验大小 ≤10MB，显示预览

#### Scenario: 用户提交任务
- **WHEN** 用户点击提交
- **THEN** 3 秒内返回 task_id，显示进度条动画和等待文案"AI正在努力生成中，请稍候..."

#### Scenario: 任务完成
- **WHEN** 任务状态变为 completed
- **THEN** 展示视频预览和下载按钮

#### Scenario: 任务超时
- **WHEN** 任务超过 5 分钟未完成
- **THEN** 提示超时，允许重试

### Requirement: 阿里云 OSS 文件存储
系统 SHALL 使用阿里云 OSS 存储用户上传图片和生成的视频，支持 CDN 加速访问。

#### Scenario: 图片上传至 OSS
- **WHEN** 前端上传图片至 /api/upload
- **THEN** 后端将图片存入 OSS，返回 CDN URL

### Requirement: Coze API 异步对接
系统 SHALL 通过 Coze API 异步接口提交任务并轮询状态：
- 提交：POST /api.coze.cn/v3/workflow/async_run，返回 task_id
- 轮询：GET /task/{id}，前端每 5 秒轮询一次

#### Scenario: 提交异步任务
- **WHEN** 后端接收 /api/workflow/[id]/run 请求
- **THEN** 调用 Coze async_run 接口，保存 task_id 到 usage_logs，返回 task_id

#### Scenario: 轮询任务状态
- **WHEN** 前端每 5 秒调用 /api/task/[id]/status
- **THEN** 返回任务状态（pending/running/completed/failed），completed 后解析视频 URL 返回

### Requirement: 试用次数限制
系统 SHALL 对新用户提供 7 天全功能试用，未付费用户 7 天内最多使用 10 次。达到限制后提示升级套餐。

#### Scenario: 试用用户正常使用
- **WHEN** 试用期内用户使用次数 < 10
- **THEN** 允许提交任务

#### Scenario: 试用用户达到限制
- **WHEN** 试用用户 7 天内使用次数达到 10
- **THEN** 阻止提交，提示升级套餐

### Requirement: 个人中心
系统 SHALL 提供个人中心 /dashboard，展示套餐状态、使用记录、订阅管理入口。

#### Scenario: 用户查看个人中心
- **WHEN** 用户访问 /dashboard
- **THEN** 显示当前套餐/试用状态、使用记录列表、订阅管理入口

### Requirement: 套餐配置
系统 SHALL 初始化 plans 表数据（基础版/专业版/企业版），包含每日调用次数限制、月费、功能列表。预留支付宝支付接口（Phase 2 完整实现）。

#### Scenario: 套餐数据初始化
- **WHEN** 系统初始化
- **THEN** plans 表包含基础版、专业版、企业版三条记录

### Requirement: 响应式与性能
系统 SHALL 支持响应式适配（移动端正常访问），首屏加载 ≤2 秒，支持 100 人并发，视频生成允许 5 分钟超时提示。

#### Scenario: 移动端访问
- **WHEN** 用户从移动端访问任意页面
- **THEN** 页面正常显示，交互正常

#### Scenario: 错误场景
- **WHEN** 上传失败/任务失败/网络错误
- **THEN** 显示友好提示，提供重试入口

### Requirement: 部署上线
系统 SHALL 部署到 Vercel（前端）+ 阿里云轻量服务器（后端，如需分离），配置生产环境变量、域名绑定与 HTTPS。

#### Scenario: 生产部署
- **WHEN** 完成联调测试
- **THEN** 前端部署至 Vercel，后端按需部署至阿里云，域名 HTTPS 就绪

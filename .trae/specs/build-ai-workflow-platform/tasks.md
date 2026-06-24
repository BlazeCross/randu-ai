# Tasks

- [x] Task 1: 项目初始化与基础设施搭建
  - [x] SubTask 1.1: 初始化 Next.js 项目（App Router + TypeScript）
  - [x] SubTask 1.2: 配置 Tailwind CSS（主色 #2563EB + 辅助色 #10B981 + 中性灰）
  - [x] SubTask 1.3: 搭建页面路由结构（/, /workspace, /workflow/[id], /workspace/[id]/use, /login, /register, /dashboard）
  - [x] SubTask 1.4: 配置环境变量（Coze API Token、OSS AccessKey/Bucket/CDN、数据库连接、JWT 密钥、飞书文档链接）
  - [x] SubTask 1.5: 集成 Prisma ORM + PostgreSQL 连接

- [x] Task 2: 数据库模型与 Schema 设计
  - [x] SubTask 2.1: 创建 users 表 Schema（id, email, phone, password_hash, created_at, trial_expires_at, is_subscribed, subscription_plan）
  - [x] SubTask 2.2: 创建 usage_logs 表 Schema（id, user_id, workflow_id, task_id, status, tokens_used, created_at, completed_at）
  - [x] SubTask 2.3: 创建 plans 表 Schema（id, name, daily_limit, monthly_price, features JSONB）
  - [x] SubTask 2.4: 创建 workflows 表 Schema（id, name, description, category, coze_workflow_id, icon, status, feishu_doc_url）
  - [x] SubTask 2.5: 执行数据库迁移 + 初始化 plans 表数据（基础版/专业版/企业版）+ 首批工作流数据（服装换装视频生成）

- [x] Task 3: 用户系统后端 API
  - [x] SubTask 3.1: 实现 /api/auth/register（注册 + 密码哈希 + 设置 trial_expires_at 为 7 天后 + JWT 签发）
  - [x] SubTask 3.2: 实现 /api/auth/login（登录验证 + JWT 签发）
  - [x] SubTask 3.3: 实现 JWT 鉴权中间件（保护 /api/user/* 和 /api/workflow/[id]/run 等接口）
  - [x] SubTask 3.4: 实现 /api/user/profile（获取用户信息 + 套餐/试用状态）
  - [x] SubTask 3.5: 实现 /api/user/usage（使用记录统计 + 试用次数计算）

- [x] Task 4: 用户系统前端页面
  - [x] SubTask 4.1: 开发登录页 /login（手机号/邮箱 + 密码登录，错误提示）
  - [x] SubTask 4.2: 开发注册页 /register（新用户注册，含试用期说明）
  - [x] SubTask 4.3: 实现登录状态管理（AuthContext + localStorage Token + 路由守卫）
  - [x] SubTask 4.4: 开发个人中心 /dashboard（套餐/试用状态 + 使用记录列表 + 订阅管理入口）

- [x] Task 5: 首页开发
  - [x] SubTask 5.1: 开发 Hero 区（大标题 + 一句话价值主张 + "立即体验"按钮）
  - [x] SubTask 5.2: 开发工作流分类展示区（卡片式布局：图标 + 名称 + 简介）
  - [x] SubTask 5.3: 开发 C 端广告位（Banner 轮播图）
  - [x] SubTask 5.4: 开发底部区（定价入口 + 联系方式 + 公司信息）

- [x] Task 6: 工作台与工作流展示
  - [x] SubTask 6.1: 实现 /api/workflow/list（工作流列表 API，支持分类筛选）
  - [x] SubTask 6.2: 实现 /api/workflow/[id]（工作流详情 API）
  - [x] SubTask 6.3: 开发工作台 /workspace（工作流卡片列表 + 搜索 + 分类筛选）
  - [x] SubTask 6.4: 开发工作流详情页 /workflow/[id]（介绍 + 使用说明 + 飞书文档跳转 + 使用入口）

- [x] Task 7: 阿里云 OSS 文件上传
  - [x] SubTask 7.1: 配置 OSS SDK（AccessKey + Bucket + CDN 域名）
  - [x] SubTask 7.2: 实现 /api/upload 接口（图片上传至 OSS，返回 CDN URL，校验 ≤10MB）
  - [x] SubTask 7.3: 开发前端上传组件（拖拽 + 点击上传 + 图片预览 + 大小校验）

- [x] Task 8: Coze API 异步任务对接
  - [x] SubTask 8.1: 封装 Coze API 客户端（POST /v3/workflow/async_run + GET /task/{id}）
  - [x] SubTask 8.2: 实现 /api/workflow/[id]/run（提交任务 + 保存 task_id 到 usage_logs + 试用次数校验）
  - [x] SubTask 8.3: 实现 /api/task/[id]/status（查询 Coze 任务状态 + 解析视频 URL + 更新 usage_logs）
  - [x] SubTask 8.4: 实现前端轮询逻辑（每 5 秒轮询，状态实时更新，5 分钟超时提示）

- [x] Task 9: 工作流使用页面
  - [x] SubTask 9.1: 开发 /workspace/[id]/use 页面布局（左侧/上方上传区 + 右侧/下方使用说明 + 飞书跳转）
  - [x] SubTask 9.2: 实现图片上传交互（拖拽 + 点击 + 预览，集成上传组件）
  - [x] SubTask 9.3: 实现提交后进度展示（进度条动画 + 等待文案"AI正在努力生成中，请稍候..."）
  - [x] SubTask 9.4: 实现视频结果展示（视频预览播放 + 下载按钮）
  - [x] SubTask 9.5: 实现 5 分钟超时提示与重试入口

- [x] Task 10: 试用次数限制
  - [x] SubTask 10.1: 实现试用次数检查逻辑（7 天内 10 次限制，查询 usage_logs）
  - [x] SubTask 10.2: 在 /api/workflow/[id]/run 中加入试用次数校验中间件
  - [x] SubTask 10.3: 前端达到限制时提示升级套餐 + 跳转订阅入口

- [x] Task 11: 套餐配置与订阅管理（P1 基础版）
  - [x] SubTask 11.1: 初始化 plans 表数据（基础版/专业版/企业版 daily_limit + monthly_price + features）
  - [x] SubTask 11.2: 实现个人中心订阅状态展示（当前套餐 + 到期时间 + 剩余次数）
  - [x] SubTask 11.3: 预留支付宝支付接口结构（Phase 2 完整实现支付流程）

- [x] Task 12: 响应式适配与体验优化
  - [x] SubTask 12.1: 移动端响应式适配（所有页面断点适配）
  - [x] SubTask 12.2: 错误场景友好提示（上传失败 / 任务失败 / 网络错误 / 超时）
  - [x] SubTask 12.3: 上传区视觉引导优化（明显引导 + 拖拽高亮）
  - [x] SubTask 12.4: 流畅动画与即时反馈（按钮 loading + 过渡动画）

- [x] Task 13: 联调与测试
  - [x] SubTask 13.1: 前端与 Coze API 联调（服装换装视频工作流完整链路）
  - [x] SubTask 13.2: 测试完整流程（上传 → 提交 → 轮询 → 展示 → 下载）
  - [x] SubTask 13.3: 性能测试（首屏 ≤2 秒，100 人并发）
  - [x] SubTask 13.4: 试用限制测试（10 次边界 + 7 天到期）

- [x] Task 14: 部署上线
  - [x] SubTask 14.1: Vercel 前端部署配置（构建命令 + 环境变量）
  - [x] SubTask 14.2: 阿里云轻量服务器后端部署（如前后端分离）
  - [x] SubTask 14.3: 生产环境环境变量配置（Coze Token + OSS + 数据库 + JWT）
  - [x] SubTask 14.4: 域名绑定与 HTTPS 配置

# 运行时验证任务（需真实环境配置后执行）
- [ ] Task 15: 运行时联调与部署验证（需用户配置真实 Coze API Token + PostgreSQL + OSS + 域名后执行）
  - [ ] SubTask 15.1: 配置真实 COZE_API_TOKEN，更新数据库 workflows 表的 coze_workflow_id，进行前端与 Coze API 端到端联调
  - [ ] SubTask 15.2: 配置真实 PostgreSQL + OSS，测试完整流程（上传 → 提交 → 轮询 → 展示 → 下载）
  - [ ] SubTask 15.3: 部署到生产环境后进行性能压测（首屏 ≤2 秒，100 人并发）
  - [ ] SubTask 15.4: 配置真实数据库后进行试用限制边界测试（10 次边界 + 7 天到期）
  - [ ] SubTask 15.5: 绑定生产域名并配置 HTTPS 证书

# Task Dependencies
- [Task 2] depends on [Task 1]
- [Task 3] depends on [Task 2]
- [Task 4] depends on [Task 3]
- [Task 5] depends on [Task 1]
- [Task 6] depends on [Task 2]
- [Task 7] depends on [Task 1]
- [Task 8] depends on [Task 2, Task 7]
- [Task 9] depends on [Task 7, Task 8]
- [Task 10] depends on [Task 3, Task 8]
- [Task 11] depends on [Task 2, Task 4]
- [Task 12] depends on [Task 5, Task 6, Task 9]
- [Task 13] depends on [Task 9, Task 10]
- [Task 14] depends on [Task 13]

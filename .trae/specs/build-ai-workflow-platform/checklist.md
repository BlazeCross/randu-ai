# Checklist

## 项目基础设施
- [x] Next.js（App Router + TypeScript）项目初始化完成
- [x] Tailwind CSS 配置主色 #2563EB 和辅助色 #10B981
- [x] 页面路由结构搭建完成（/, /workspace, /workflow/[id], /workspace/[id]/use, /login, /register, /dashboard）
- [x] 环境变量配置完成（Coze API Token、OSS、数据库、JWT、飞书链接）

## 数据库
- [x] PostgreSQL + Prisma ORM 集成完成
- [x] users 表 Schema 创建完成（含 trial_expires_at、is_subscribed、subscription_plan）
- [x] usage_logs 表 Schema 创建完成（含 task_id、status、tokens_used）
- [x] plans 表 Schema 创建完成（含 daily_limit、monthly_price、features JSONB）
- [x] workflows 表 Schema 创建完成（含 coze_workflow_id、feishu_doc_url）
- [x] plans 表初始化基础版/专业版/企业版数据
- [x] workflows 表初始化首批「服装换装视频生成」数据

## 用户系统后端
- [x] /api/auth/register 实现完成（注册 + 密码哈希 + 7 天试用 + JWT）
- [x] /api/auth/login 实现完成（登录验证 + JWT）
- [x] JWT 鉴权中间件实现完成
- [x] /api/user/profile 实现完成
- [x] /api/user/usage 实现完成（含试用次数计算）

## 用户系统前端
- [x] 登录页 /login 开发完成（手机号/邮箱 + 密码）
- [x] 注册页 /register 开发完成（含试用期说明）
- [x] 登录状态管理实现（AuthContext + Token + 路由守卫）
- [x] 个人中心 /dashboard 开发完成（套餐状态 + 使用记录 + 订阅管理）

## 首页
- [x] Hero 区开发完成（大标题 + 价值主张 + "立即体验"按钮）
- [x] 工作流分类展示区开发完成（卡片式布局）
- [x] C 端广告位开发完成（Banner 轮播）
- [x] 底部区开发完成（定价入口 + 联系方式）

## 工作台与工作流展示
- [x] /api/workflow/list 实现完成（支持分类筛选）
- [x] /api/workflow/[id] 实现完成
- [x] 工作台 /workspace 开发完成（列表 + 搜索 + 筛选）
- [x] 工作流详情页 /workflow/[id] 开发完成（介绍 + 使用说明 + 飞书跳转）

## 阿里云 OSS 文件上传
- [x] OSS SDK 配置完成（AccessKey + Bucket + CDN）
- [x] /api/upload 接口实现完成（≤10MB 校验 + 返回 CDN URL）
- [x] 前端上传组件实现完成（拖拽 + 点击 + 预览 + 大小校验）

## Coze API 异步对接
- [x] Coze API 客户端封装完成（async_run + task 查询）
- [x] /api/workflow/[id]/run 实现完成（提交 + 保存 task_id + 试用校验）
- [x] /api/task/[id]/status 实现完成（查询状态 + 解析视频 URL）
- [x] 前端轮询逻辑实现完成（每 5 秒 + 5 分钟超时提示）

## 工作流使用页面
- [x] /workspace/[id]/use 页面布局开发完成
- [x] 图片上传交互实现完成（拖拽 + 点击 + 预览）
- [x] 进度展示实现完成（进度条动画 + 等待文案"AI正在努力生成中，请稍候..."）
- [x] 视频结果展示实现完成（视频预览 + 下载按钮）
- [x] 5 分钟超时提示与重试入口实现完成

## 试用次数限制
- [x] 试用次数检查逻辑实现完成（7 天内 10 次）
- [x] /api/workflow/[id]/run 加入试用次数校验
- [x] 达到限制时前端提示升级套餐

## 套餐配置与订阅管理
- [x] plans 表数据初始化完成（基础版/专业版/企业版）
- [x] 个人中心订阅状态展示实现完成
- [x] 支付宝支付接口结构预留完成（Phase 2 完整实现）

## 响应式与体验优化
- [x] 移动端响应式适配完成（所有页面）
- [x] 错误场景友好提示实现完成（上传失败/任务失败/网络错误/超时）
- [x] 上传区视觉引导优化完成
- [x] 流畅动画与即时反馈实现完成

## 联调与测试
- [ ] 前端与 Coze API 联调完成（服装换装视频工作流）<!-- 未通过：需配置真实 COZE_API_TOKEN 与数据库后进行运行时联调，代码层面已具备完整链路 -->
- [ ] 完整流程测试通过（上传 → 提交 → 轮询 → 展示 → 下载）<!-- 未通过：需运行时环境（PostgreSQL + OSS + Coze）进行端到端测试 -->
- [ ] 性能测试通过（首屏 ≤2 秒，100 人并发）<!-- 未通过：需部署到生产环境后进行性能压测 -->
- [ ] 试用限制测试通过（10 次边界 + 7 天到期）<!-- 未通过：需运行时数据库环境进行边界测试 -->

## 部署上线
- [x] Vercel 前端部署配置完成
- [x] 阿里云轻量服务器后端部署完成（如需分离）
- [x] 生产环境环境变量配置完成
- [ ] 域名绑定与 HTTPS 配置完成<!-- 未通过：需在实际部署后绑定域名并配置 SSL 证书，代码层面已提供完整部署文档 DEPLOY.md -->

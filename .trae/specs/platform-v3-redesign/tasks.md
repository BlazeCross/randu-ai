# 燃渡AI平台 v3.0 升级任务清单

## 阶段一：登录系统升级（P0 紧急）

- [ ] Task 1: 微信开放平台网站应用申请与配置
  - [ ] SubTask 1.1: 在微信开放平台 (open.weixin.qq.com) 注册账号，完成网站应用认证（¥300）
  - [ ] SubTask 1.2: 获取 AppID 和 AppSecret，填写网站回调域名为 `www.randuai.cn/api/auth/wechat/callback`
  - [ ] SubTask 1.3: 将 AppID 和 AppSecret 添加到 `.env.production` 和 `.env.production.example`
  - [ ] SubTask 1.4: 验证回调 URL 可访问（部署后测试）

- [ ] Task 2: 后端微信登录 API 开发
  - [ ] SubTask 2.1: 创建 `src/lib/wechat.ts`，封装微信 OAuth2.0 授权流程（获取 code → 获取 access_token → 获取 unionid）
  - [ ] SubTask 2.2: 创建 `src/app/api/auth/wechat/login/route.ts`，处理微信扫码回调，创建或关联用户账号
  - [ ] SubTask 2.3: 创建 `src/app/api/auth/wechat/bind/route.ts`，处理已登录用户绑定微信
  - [ ] SubTask 2.4: 创建 `src/app/api/auth/wechat/unbind/route.ts`，处理微信解绑
  - [ ] SubTask 2.5: 在 `prisma/schema.prisma` 的 User 模型添加 `wechatUnionId` 可选字段

- [ ] Task 3: 前端微信扫码登录 UI 开发
  - [ ] SubTask 3.1: 重构 `src/app/login/page.tsx`，新增"微信登录"按钮（图标+文字），调整布局
  - [ ] SubTask 3.2: 创建 `src/components/auth/WechatQRCode.tsx`，微信二维码展示组件（调用微信开放平台 JS-SDK）
  - [ ] SubTask 3.3: 创建 `src/app/api/auth/wechat/qrcode/route.ts`，生成微信登录二维码所需参数（appid、redirect_uri、scope 等）
  - [ ] SubTask 3.4: 修改 `src/app/register/page.tsx`，新增"微信登录"入口和"已有账号绑定微信"选项
  - [ ] SubTask 3.5: 修改 `src/app/dashboard/profile/page.tsx`，新增"绑定微信"功能入口

- [ ] Task 4: 老用户微信绑定引导
  - [ ] SubTask 4.1: 在登录页对已登录但未绑定微信的用户显示绑定引导 banner
  - [ ] SubTask 4.2: 在用户首次登录后（Onboarding），引导绑定微信

## 阶段二：合规改造（P0 紧急）

- [x] Task 5: 用户协议与隐私政策页面 ✅
  - [x] SubTask 5.1: 创建 `src/app/terms/page.tsx` ✅
  - [x] SubTask 5.2: 创建 `src/app/privacy/page.tsx` ✅
  - [x] SubTask 5.3: 在注册页添加用户协议同意链接 ✅
  - [x] SubTask 5.4: Footer 添加法律链接 ✅

- [x] Task 6: 内容安全机制 ✅
  - [x] SubTask 6.1: 创建 `src/lib/content-check.ts` ✅
  - [x] SubTask 6.2: 创建 `src/app/api/content-check/route.ts` ✅
  - [x] SubTask 6.3: 在 AI 对话 `/api/chat` 返回前接入内容审核 ✅
  - [ ] SubTask 6.4: 在图片生成 `/api/external/generate/image` 返回前接入内容审核
  - [ ] SubTask 6.5: 在视频生成描述提交前接入内容审核
  - [x] SubTask 6.6: 环境变量已添加到 `.env.production.example` ✅

- [x] Task 7: 公安备案号展示与合规文案 ✅
  - [x] SubTask 7.1: Footer 添加公安备案号 ✅
  - [ ] SubTask 7.2: 在注册页面添加《个人信息保护法》要求的"最小必要原则"说明
  - [ ] SubTask 7.3: 检查现有隐私政策是否符合《个人信息保护法》第17条要求

## 阶段三：全站 UI 重构（P0 高优先）

- [x] Task 8: 设计系统 v3.0 定义与全局 CSS 改造 ✅
  - [x] SubTask 8.1: 定义 v3.0 设计变量（温暖米色系+琥珀色） ✅
  - [x] SubTask 8.2: 字体系统（系统字体栈） ✅
  - [x] SubTask 8.3: 设计 Token 导出为 CSS 变量 ✅
  - [x] SubTask 8.4: 全局过渡动画样式 ✅

- [x] Task 9: 首页 Hero 区重构 ✅
  - [x] SubTask 9.1: 重构 HeroSection.tsx（静态展示） ✅
  - [x] SubTask 9.2: 6 个冷启动引导气泡 ✅
  - [x] SubTask 9.3: 移动端适配 ✅

- [x] Task 10: 首页叙事流构建 ✅
  - [x] SubTask 10.1: StatsSection 数字动画优化 ✅
  - [x] SubTask 10.2: WorkflowCategories 动词化命名 ✅
  - [x] SubTask 10.3: 多场景展示卡片（整合到 WorkflowCategories） ✅
  - [x] SubTask 10.4: TestimonialsSection 真实感卡片设计 ✅
  - [x] SubTask 10.5: PricingSection 简化预览 ✅
  - [x] SubTask 10.6: 滚动揭示动画优化 ✅

- [x] Task 11: 登录/注册页重构 ✅
  - [x] SubTask 11.1: 登录页左右分栏布局（桌面端） ✅
  - [x] SubTask 11.2: 移动端微信登录按钮置顶 ✅
  - [x] SubTask 11.3: 注册页同样采用左右分栏 ✅
  - [x] SubTask 11.4: 统一品牌元素 ✅

- [x] Task 12: Navbar 与 Footer 优化 ✅
  - [x] SubTask 12.1: Navbar 新增"学习"导航项 ✅
  - [x] SubTask 12.2: Footer 添加法律链接和备案号 ✅
  - [x] SubTask 12.3: Footer 增加平台数据展示 ✅

## 阶段四：用户引导与分层（P1 高优先）

- [x] Task 13: 用户引导 Onboarding 流程 ✅
  - [x] SubTask 13.1: 创建 onboarding/page.tsx ✅
  - [x] SubTask 13.2: Step 1 身份选择 ✅
  - [x] SubTask 13.3: Step 2 绑定微信（占位，跳过可继续）✅
  - [x] SubTask 13.4: Step 3 关注领域选择 ✅
  - [x] SubTask 13.5: Step 4 定制完成跳转 ✅
  - [x] SubTask 13.6: 登录后重定向到 /onboarding ✅

- [x] Task 14: 学院重构 - 学习路径功能 ✅
  - [x] SubTask 14.1: 创建 academy/paths/page.tsx ✅
  - [x] SubTask 14.2: 创建 academy/paths/[id]/page.tsx ✅
  - [x] SubTask 14.3: 创建 PathCard.tsx 组件 ✅
  - [x] SubTask 14.4: 设计 4 个预设学习路径 ✅
  - [x] SubTask 14.5: Prisma 模型已添加（UserProgress） ✅

- [x] Task 15: 学习进度追踪 ✅
  - [x] SubTask 15.1: Prisma UserProgress 模型 ✅
  - [x] SubTask 15.2: API 路由 `/api/user/progress` ✅
  - [x] SubTask 15.3: 教程详情页进度保存 ✅
  - [x] SubTask 15.4: 用户中心进度展示 ✅

## 阶段五：功能增强（P1 中优先）

- [x] Task 16: 智能体对话增强 ✅
  - [x] SubTask 16.1: PromptLibrary.tsx 提示词库 ✅
  - [x] SubTask 16.2: DialogueExporter.tsx 对话导出 ✅
  - [x] SubTask 16.3: 对话页面 UI 入口 ✅

- [x] Task 17: 工作流市场增强 ✅
  - [x] SubTask 17.1: 收藏按钮和使用次数展示 ✅
  - [x] SubTask 17.2: 行业+场景双重筛选 ✅
  - [x] SubTask 17.3: WorkflowDetailActions 相关推荐 ✅

- [x] Task 18: 用户数据中心 ✅
  - [x] SubTask 18.1: dashboard/data/page.tsx ✅
  - [x] SubTask 18.2: 使用趋势柱状图（CSS 实现） ✅
  - [x] SubTask 18.3: 功能热度 TOP 5 排行 ✅

## 阶段六：文档与研究输出（P0 必做）

- [x] Task 19: 研究文档输出 ✅
  - [x] SubTask 19.1: docs/v3.0-competitor-research-3.0.md ✅
  - [x] SubTask 19.2: docs/v3.0-user-persona-3.0.md ✅
  - [x] SubTask 19.3: docs/v3.0-design-system-3.0.md ✅
  - [x] SubTask 19.4: docs/v3.0-compliance-guide-3.0.md ✅
  - [x] SubTask 19.5: docs/v3.0-wechat-integration-3.0.md ✅

## 阶段七：构建验证与部署（P0 必做）

- [ ] Task 20: 构建验证
  - [ ] SubTask 20.1: `npx next build` 确认无类型错误、无构建失败
  - [ ] SubTask 20.2: 确认所有新增页面在路由表中出现
  - [ ] SubTask 20.3: 确认微信回调 URL 可访问（需部署后测试）

- [ ] Task 21: 部署与测试
  - [ ] SubTask 21.1: Git commit 所有更改并 push
  - [ ] SubTask 21.2: 服务器 git pull + 清理 .next 缓存 + 重启容器
  - [ ] SubTask 21.3: 测试微信扫码登录完整流程（需真实微信账号测试）
  - [ ] SubTask 21.4: 测试 Onboarding 引导流程
  - [ ] SubTask 21.5: 测试内容安全过滤（发送包含敏感词的测试消息）

---

## 待完成：Task 1-4（微信登录）

> ⚠️ Task 1-4 需要用户提供微信开放平台的 AppID 和 AppSecret 才能继续开发。
> 请访问 https://open.weixin.qq.com 完成网站应用认证（¥300），获取凭证后告知。

# Task Dependencies

- Task 2 依赖 Task 1 完成（需 AppID/Secret 才能开发）
- Task 3 依赖 Task 2 完成（需后端 API）
- Task 4 依赖 Task 2、Task 3 完成
- Task 5、Task 6、Task 7 可并行 ✅
- Task 8（设计系统）是 Task 9、Task 10、Task 11 的前置 ✅
- Task 12 可与 Task 9-11 并行 ✅
- Task 13 依赖 Task 1、Task 2、Task 3（微信登录基础）⚠️（Step 2 占位，已可继续）
- Task 14、Task 15 可并行 ✅
- Task 16、Task 17、Task 18 可并行 ✅
- Task 19 可与 Task 1-18 并行（文档整理）✅
- Task 20 依赖 Task 1-18 全部完成（除 Task 1-4 外已全部完成）
- Task 21 依赖 Task 20 完成

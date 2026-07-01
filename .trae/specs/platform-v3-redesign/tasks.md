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

- [ ] Task 5: 用户协议与隐私政策页面
  - [ ] SubTask 5.1: 创建 `src/app/terms/page.tsx`，《用户协议》页面（覆盖服务内容、用户行为规范、知识产权、免责声明）
  - [ ] SubTask 5.2: 创建 `src/app/privacy/page.tsx`，《隐私政策》页面（覆盖信息收集、使用目的、共享范围、用户权利、未成年人保护）
  - [ ] SubTask 5.3: 在 `src/app/register/page.tsx` 的注册表单下方添加"注册即表示同意《用户协议》和《隐私政策》"链接
  - [ ] SubTask 5.4: 在 Footer 组件中添加"用户协议"和"隐私政策"链接

- [ ] Task 6: 内容安全机制
  - [ ] SubTask 6.1: 创建 `src/lib/content-check.ts`，封装阿里云绿网内容安全 API（文本审核）
  - [ ] SubTask 6.2: 创建 `src/app/api/content-check/route.ts`，内容审核 API 路由
  - [ ] SubTask 6.3: 在 AI 对话 `/api/chat` 返回前接入内容审核，过滤敏感词
  - [ ] SubTask 6.4: 在图片生成 `/api/external/generate/image` 返回前接入内容审核
  - [ ] SubTask 6.5: 在视频生成描述提交前接入内容审核
  - [ ] SubTask 6.6: 将阿里云绿网 AK/SK 添加到环境变量

- [ ] Task 7: 公安备案号展示与合规文案
  - [ ] SubTask 7.1: 在 Footer 底部添加公安备案号展示（格式：蜀ICP备XXXXXXXX号-1）
  - [ ] SubTask 7.2: 在注册页面添加《个人信息保护法》要求的"最小必要原则"说明
  - [ ] SubTask 7.3: 检查现有隐私政策是否符合《个人信息保护法》第17条要求

## 阶段三：全站 UI 重构（P0 高优先）

- [ ] Task 8: 设计系统 v3.0 定义与全局 CSS 改造
  - [ ] SubTask 8.1: 定义 v3.0 设计变量（`src/app/globals.css`）：主色调改为温暖米色系、强调色调整为橙色/琥珀色、圆角统一为 12px、阴影系统重构
  - [ ] SubTask 8.2: 字体系统：使用系统字体栈（已有），确保中文显示优雅
  - [ ] SubTask 8.3: 设计 Token 导出为 CSS 变量（`--color-primary`、`--color-surface`、`--radius`、`--shadow` 等）
  - [ ] SubTask 8.4: 全局过渡动画样式（`--transition-fast: 150ms`、`--transition-base: 200ms`、`--transition-slow: 400ms`）

- [ ] Task 9: 首页 Hero 区重构
  - [ ] SubTask 9.1: 重构 `src/components/home/HeroSection.tsx`：静态 Hero（非轮播），大标题+副标题+CTA+冷启动引导气泡
  - [ ] SubTask 9.2: Hero 区底部新增"冷启动气泡"（6-8 个建议问题，点击可直接发起对话）
  - [ ] SubTask 9.3: 调整 Hero 高度和间距，确保移动端良好展示

- [ ] Task 10: 首页叙事流构建
  - [ ] SubTask 10.1: 保留 `src/components/home/StatsSection.tsx`（数据大字号展示区），优化数字动画
  - [ ] SubTask 10.2: 保留 `src/components/home/WorkflowCategories.tsx`，调整为动词化命名（探索/创作/自动化）
  - [ ] SubTask 10.3: 新增"多场景展示"section：展示 3-4 个典型使用场景的视觉卡片
  - [ ] SubTask 10.4: 保留"用户评价墙"（占位内容），优化为真实感更强的卡片设计
  - [ ] SubTask 10.5: 保留 `src/components/home/PricingSection.tsx`，简化定价预览
  - [ ] SubTask 10.6: 优化全站滚动揭示动画（ScrollReveal + stagger + Intersection Observer）

- [ ] Task 11: 登录/注册页重构
  - [ ] SubTask 11.1: 重构登录页布局：微信扫码登录占据左半屏（桌面端），表单在右半屏
  - [ ] SubTask 11.2: 移动端：微信登录按钮置顶，表单在下
  - [ ] SubTask 11.3: 重构注册页：同样采用左右分栏布局（桌面端）
  - [ ] SubTask 11.4: 统一登录注册页品牌元素（Logo、背景、品牌色）

- [ ] Task 12: Navbar 与 Footer 优化
  - [ ] SubTask 12.1: Navbar 新增"学习"导航项（指向学院），区分"工具"（工作台）和"学习"（学院）
  - [ ] SubTask 12.2: Footer 添加用户协议、隐私政策链接，以及公安备案号
  - [ ] SubTask 12.3: Footer 增加平台数据（"已服务 XX 位学员"等）

## 阶段四：用户引导与分层（P1 高优先）

- [ ] Task 13: 用户引导 Onboarding 流程
  - [ ] SubTask 13.1: 创建 `src/app/onboarding/page.tsx`，新用户引导页（步骤条引导）
  - [ ] SubTask 13.2: Step 1：选择身份（"AI 学员" vs "效率用户"），配图和说明
  - [ ] SubTask 13.3: Step 2：绑定微信（可选跳过的引导步骤）
  - [ ] SubTask 13.4: Step 3：选择感兴趣的领域（电商/新媒体/教育/企业/其他）
  - [ ] SubTask 13.5: Step 4：定制完成，展示推荐内容（跳转首页/学院/工作台）
  - [ ] SubTask 13.6: 修改 `src/lib/auth-context.tsx`，首次登录后重定向到 `/onboarding`

- [ ] Task 14: 学院重构 - 学习路径功能
  - [ ] SubTask 14.1: 创建 `src/app/academy/paths/page.tsx`，学习路径列表页
  - [ ] SubTask 14.2: 创建 `src/app/academy/paths/[id]/page.tsx`，学习路径详情页（含教程序列）
  - [ ] SubTask 14.3: 创建 `src/components/academy/PathCard.tsx`，学习路径卡片组件
  - [ ] SubTask 14.4: 设计预设学习路径数据（如"电商 AI 7 天入门"、"新媒体内容创作之路"）
  - [ ] SubTask 14.5: 在数据库添加 LearningPath 和 PathStep 模型（如需）

- [ ] Task 15: 学习进度追踪
  - [ ] SubTask 15.1: 在 `prisma/schema.prisma` 添加 UserProgress 模型（记录教程完成状态）
  - [ ] SubTask 15.2: 创建 `src/app/api/user/progress/route.ts`，保存/获取学习进度
  - [ ] SubTask 15.3: 教程详情页显示"完成"按钮，点击标记为已完成
  - [ ] SubTask 15.4: 用户中心显示学习进度概览

## 阶段五：功能增强（P1 中优先）

- [ ] Task 16: 智能体对话增强
  - [ ] SubTask 16.1: 工作台页面新增"收藏提示词"功能（保存常用的提示词模板）
  - [ ] SubTask 16.2: 对话历史新增"导出"功能（导出为 Markdown/TXT）
  - [ ] SubTask 16.3: 创建 `src/components/chat/PromptLibrary.tsx`，提示词库组件

- [ ] Task 17: 工作流市场增强
  - [ ] SubTask 17.1: 工作流卡片新增"收藏"按钮和"使用次数"统计
  - [ ] SubTask 17.2: 工作流列表支持按行业和场景双重筛选
  - [ ] SubTask 17.3: 工作流详情页新增"相关推荐"（同类型工作流）

- [ ] Task 18: 用户数据中心
  - [ ] SubTask 18.1: 用户中心新增"使用数据中心" tab，展示使用统计图表
  - [ ] SubTask 18.2: 使用 Chart.js 或 Recharts 展示"本周使用趋势"柱状图
  - [ ] SubTask 18.3: 展示"功能热度排行"（使用最多的功能 TOP 5）

## 阶段六：文档与研究输出（P0 必做）

- [ ] Task 19: 研究文档输出
  - [ ] SubTask 19.1: 生成 `docs/v3.0-competitor-research-3.0.md`（竞品研究分析报告）
  - [ ] SubTask 19.2: 生成 `docs/v3.0-user-persona-3.0.md`（用户画像深度分析报告）
  - [ ] SubTask 19.3: 生成 `docs/v3.0-design-system-3.0.md`（设计系统 v3.0 规范文档）
  - [ ] SubTask 19.4: 生成 `docs/v3.0-compliance-guide-3.0.md`（合规改造清单与实施指南）
  - [ ] SubTask 19.5: 生成 `docs/v3.0-wechat-integration-3.0.md`（微信登录集成技术文档）

## 阶段七：构建验证与部署（P0 必做）

- [ ] Task 20: 构建验证
  - [ ] SubTask 20.1: `npx next build` 确认无类型错误、无构建失败
  - [ ] SubTask 20.2: 确认所有新增页面（/onboarding、/privacy、/terms、/wechat/callback）在路由表中出现
  - [ ] SubTask 20.3: 确认微信回调 URL 可访问（需部署后测试）

- [ ] Task 21: 部署与测试
  - [ ] SubTask 21.1: Git commit 所有更改并 push
  - [ ] SubTask 21.2: 服务器 git pull + 清理 .next 缓存 + 重启容器
  - [ ] SubTask 21.3: 测试微信扫码登录完整流程（需真实微信账号测试）
  - [ ] SubTask 21.4: 测试 Onboarding 引导流程
  - [ ] SubTask 21.5: 测试内容安全过滤（发送包含敏感词的测试消息）

# Task Dependencies

- Task 2 依赖 Task 1 完成（需 AppID/Secret 才能开发）
- Task 3 依赖 Task 2 完成（需后端 API）
- Task 4 依赖 Task 2、Task 3 完成
- Task 5、Task 6、Task 7 可并行
- Task 8（设计系统）是 Task 9、Task 10、Task 11 的前置
- Task 12 可与 Task 9-11 并行
- Task 13 依赖 Task 1、Task 2、Task 3（微信登录基础）
- Task 14、Task 15 可并行
- Task 16、Task 17、Task 18 可并行
- Task 19 可与 Task 1-18 并行（文档整理）
- Task 20 依赖 Task 1-18 全部完成
- Task 21 依赖 Task 20 完成

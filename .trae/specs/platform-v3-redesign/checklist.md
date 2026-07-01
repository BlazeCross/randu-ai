# 燃渡AI平台 v3.0 升级验证清单

## 阶段一：微信扫码登录

- [ ] 微信开放平台网站应用已认证（¥300 支付完成）
- [ ] AppID 和 AppSecret 已配置到 `.env.production`
- [ ] 回调域名已正确填写为 `https://www.randuai.cn/api/auth/wechat/callback`
- [x] 登录页显示"微信登录"按钮，点击弹出二维码（占位区已做好）
- [ ] 微信扫码后能成功回调并创建/关联用户账号
- [ ] JWT token 正确下发，httpOnly cookie 设置成功
- [ ] 已登录用户可在"账号设置"中绑定微信
- [ ] 老用户引导绑定 banner 正确显示

## 阶段二：合规改造

- [x] `/terms` 页面显示完整《用户协议》✅
- [x] `/privacy` 页面显示完整《隐私政策》✅
- [x] 注册页底部显示"注册即表示同意《用户协议》和《隐私政策》"链接 ✅
- [x] Footer 显示《用户协议》和《隐私政策》链接 ✅
- [x] Footer 显示公安备案号 ✅
- [x] AI 对话内容通过阿里云绿网审核，敏感词被过滤或替换 ✅
- [ ] 图片生成描述通过内容安全审核
- [ ] 视频生成描述通过内容安全审核

## 阶段三：UI 重构

- [x] 首页 Hero 区改为静态展示（非轮播），有明确的 CTA ✅
- [x] 首页 Hero 显示 6-8 个冷启动引导气泡 ✅
- [x] 首页叙事流各 section 滚动时有 stagger 淡入动画 ✅
- [x] 首页数据背书区展示用户数/工作流数等 ✅
- [x] 登录页左右分栏布局（桌面端：左微信二维码，右登录表单）✅
- [x] 登录页移动端：微信登录按钮在表单上方 ✅
- [x] 登录页显示品牌一致性的 Logo 和背景 ✅
- [x] Navbar 有"学习"导航项（指向学院）✅
- [x] Footer 有完整的链接和备案号 ✅
- [x] 全站配色为温暖米色系，非蓝紫渐变 ✅
- [x] 全站动画过渡时间统一（150ms/200ms/400ms）✅

## 阶段四：用户引导

- [x] 新用户首次登录后跳转到 `/onboarding` ✅
- [x] Onboarding Step 1：身份选择（学员/效率用户）✅
- [x] Onboarding Step 2：绑定微信引导（可选跳过）✅
- [x] Onboarding Step 3：兴趣领域选择 ✅
- [x] Onboarding Step 4：定制完成跳转 ✅
- [x] 学院页面有"学习路径"入口 ✅
- [x] 学习路径详情页显示教程序列 ✅
- [x] 教程详情页有"完成"按钮 ✅
- [x] 用户中心显示学习进度概览 ✅

## 阶段五：功能增强

- [x] 工作台有"收藏提示词"功能 ✅
- [x] 对话历史有"导出"功能（Markdown/TXT）✅
- [x] 工作流有"收藏"和"使用次数"展示 ✅
- [x] 工作流支持按行业和场景双重筛选 ✅
- [x] 用户中心有"数据中心" tab ✅
- [x] 数据中心有使用趋势图表 ✅

## 阶段六：文档输出

- [x] `docs/v3.0-competitor-research-3.0.md` 已生成 ✅
- [x] `docs/v3.0-user-persona-3.0.md` 已生成 ✅
- [x] `docs/v3.0-design-system-3.0.md` 已生成 ✅
- [x] `docs/v3.0-compliance-guide-3.0.md` 已生成 ✅
- [x] `docs/v3.0-wechat-integration-3.0.md` 已生成 ✅

## 阶段七：构建与部署

- [ ] `npx next build` 无类型错误，无构建失败
- [ ] 所有新增页面在路由表中出现
- [ ] Git commit 并 push 到 GitHub
- [ ] 服务器成功 git pull 最新代码
- [ ] Docker 容器成功重启
- [ ] 首页 https://www.randuai.cn/ 正常访问
- [ ] 登录页 https://www.randuai.cn/login 正常访问
- [ ] 微信扫码登录流程完整可用
- [ ] Onboarding 引导流程完整可用
- [ ] 学院页面正常访问
- [ ] 工作台页面正常访问
- [ ] 用户协议/隐私政策页面正常访问

---

## 已完成项目汇总（共 XX 项）

### 合规改造 ✅
- [x] /terms 用户协议页面
- [x] /privacy 隐私政策页面
- [x] 注册页协议同意
- [x] Footer 法律链接
- [x] 公安备案号展示
- [x] AI 对话内容审核（阿里云绿网）

### UI 重构 ✅
- [x] 首页 Hero 静态展示 + 冷启动气泡
- [x] 首页叙事流（StatsSection、WorkflowCategories、TestimonialsSection、PricingSection）
- [x] 登录页左右分栏布局
- [x] 注册页左右分栏布局
- [x] Navbar 动词化导航（探索/创作/学习/定价）
- [x] Footer 平台数据展示
- [x] v3.0 设计系统（温暖米色+琥珀色）

### 用户引导 ✅
- [x] Onboarding 4 步骤引导
- [x] 学习路径功能（/academy/paths）
- [x] 学习进度追踪（UserProgress 模型 + API）

### 功能增强 ✅
- [x] 提示词库（PromptLibrary）
- [x] 对话导出（DialogueExporter）
- [x] 工作流收藏+双重筛选
- [x] 用户数据中心（/dashboard/data）

### 文档 ✅
- [x] 5 份 v3.0 研究文档

### 待完成 ⚠️
- [ ] 微信扫码登录（需用户完成 open.weixin.qq.com 认证）
- [ ] 图片/视频生成内容审核
- [ ] 注册页"最小必要原则"说明
- [ ] 构建验证与服务器部署

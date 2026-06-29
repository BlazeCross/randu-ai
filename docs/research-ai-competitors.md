# 国内 AI 大厂产品官网与平台设计研究

> 研究时间：2026-06-29
> 研究方法：WebFetch 实际访问 + WebSearch 补充调研
> 研究目标：为燃渡AI网站的视觉升级与功能模块设计提供参考

---

## 总览：行业共性设计语言

通过横向对比豆包、扣子、火山方舟、火山引擎、通义千问、智谱清言、Kimi、Dify、ChatGPT、Claude 等 10 个网站，归纳出当前 AI 产品官网/平台的共性设计语言：

| 维度 | 共性特征 |
|---|---|
| **首屏内容** | 大字标题 + 单行副标题 + 主/次双 CTA 按钮 + 产品演示截图/视频 |
| **主品牌色** | 国内多采用「蓝色系 / 紫色渐变 / 黑色科技感」，海外多用「中性灰 + 单一品牌强调色」 |
| **核心模块顺序** | Hero → 最新模型 / 能力卡片 → 多场景应用 → 定价 → 客户案例 / Logo 墙 → CTA → Footer |
| **导航** | 顶部水平导航 + 多级 mega menu 下拉 + 右侧"控制台/登录"主按钮 |
| **响应式策略** | PC 为主设计端，移动端通过抽屉式导航 + 单列堆叠适配 |
| **暗色模式** | 多数支持「自动跟随系统 + 手动切换」，Cookie/localStorage 持久化 |
| **定价表** | 表格化（模型 / 输入 / 输出 / 缓存）+ 价格计算器入口 |

---

## 1. 豆包（doubao.com）

### 1.1 网站骨架
- **主域名**：`https://www.doubao.com/`
- **核心子路由**：
  - `/chat/` —— AI 在线交互专属直达页面，无需跳转进入实时对话
  - 首页即对话入口，没有传统 marketing landing 页结构
- **页面数量**：极简，主域名为对话页本身，外围有少量功能介绍子页

### 1.2 UI 设计语言
- **色彩方案**：以豆包品牌蓝为主色（亮蓝 #1677FF 系），白底为主，浅灰边框分隔
- **字体**：系统默认无衬线字体，中文 PingFang / 苹方优先
- **间距**：对话气泡间约 16-24px，输入框区域留白充足
- **圆角**：消息气泡圆角约 12-16px，输入框圆角较大（接近 24px）
- **阴影**：极弱阴影，几乎扁平化设计

### 1.3 页面布局
**首页即对话界面**：
- **顶部**：极简顶栏（Logo + 主菜单图标 + 用户头像）
- **中央内容区**：
  - 大号欢迎语 "有什么我能帮你的吗？"
  - 资讯/热点卡片（世界杯赛程、电影票房等实时热点）
  - 功能建议气泡（"一吨100元和100吨1元哪个更值钱？"、"用 Python 实现办公流程自动化"、"如何用 Zotero 辅助论文写作" 等）
- **底部输入区**：单行输入框 + 附件上传 + 发送按钮

### 1.4 交互逻辑
- **冷启动引导**：通过预生成的问题气泡，引导用户点击即发起对话
- **实时热点注入**：将当日热点资讯以卡片形式嵌入欢迎页
- **自适应布局**：自动适配设备类型与最优布局
- **响应式**：PC 大屏单列居中、移动端全宽输入框置底

### 1.5 功能模块
- 单一对话模块为主，外围能力（编程、搜索、写作、阅读、生成图像）通过对话内指令调用
- 没有传统功能卡片墙

### 1.6 值得借鉴的亮点
- **首页即对话** —— 去掉 marketing landing 页，直接进入产品，转化路径极短
- **资讯热点卡片** —— 用真实热点话题降低冷启动门槛，比通用"试试这些"模板更接地气
- **零干扰设计** —— 没有定价、没有功能对比、没有客户 Logo 墙，专注对话体验

---

## 2. 扣子（coze.cn）

### 2.1 网站骨架
- **主域名**：`https://www.coze.cn`
- **核心定位**：新一代 AI 团队协作平台，主打"多 Agent 协作"
- **页面层级**：
  - 首页（marketing landing）
  - 工作空间 / 个人空间
  - Bot 创建 / 工作流编辑器
  - 模板市场 / 插件市场
  - 文档中心
  - 定价页
- **路由模式**：`/home`（首页）、`/space/{spaceId}`（工作空间）、`/workflow/{id}`（工作流）

### 2.2 UI 设计语言
- **色彩方案**：以"扣子蓝"为主色 + 深色科技感背景，强调"团队感"
- **字体**：现代无衬线字体，标题字号大、字重粗（接近 700-800）
- **间距**：模块间留白大，每个 section 内部 padding 充足（约 80-120px 垂直 padding）
- **圆角**：卡片圆角约 12-16px，按钮圆角约 8-12px
- **阴影**：卡片有轻微投影，营造层次感
- **图标**：彩色 emoji + 圆形头像（每个 Agent 有专属头像）

### 2.3 页面布局
**首页布局结构**：
1. **Hero 区**：
   - 主标题："新一代 AI 团队，从扣子开始"（大字+换行排版）
   - 副标题：解释"创建项目，召集 Agent，开启协作"
   - 双 CTA：「免费使用」+「桌面端下载」+「移动端下载」
2. **多 Agent 协作演示区**：
   - 模拟一个完整的团队聊天界面（林 Mia 与 扣子 Agent / 创作 Agent / 法务 Agent / 视频 Agent / 编程 Agent 多轮对话）
   - 每条消息有头像、姓名、时间戳
   - 展示一个真实任务从构思到交付的全流程
3. **协作模式介绍**：
   - "人和 Agent，共同协作"
   - 多种协作模式卡片
   - 多项目创建管理卡片
   - 项目资产沉淀卡片
4. **Agent 阵容展示**：
   - "你的 Agent，你来定义"
   - 集成第三方 CLI（Claude Code / Codex / Openclaw）卡片墙
   - 每个卡片显示图标 + 名称 + 标签（local / self-hosted）
5. **专业伙伴介绍**：
   - 扣子 Agent 模型自由切换（Doubao-Seed / Kimi / GLM / Minimax）
   - 完整 Harness 能力（技能调用、长期记忆、工作台）
6. **扣子编程专区**：
   - "一站式从开发到上线"
   - 云端沙箱环境介绍
   - 集成资源一应俱全

### 2.4 交互逻辑
- **演示动画**：多 Agent 协作演示区域有自动滚动 / 打字效果
- **滚动揭示**：每个 section 进入视口时触发淡入动画
- **响应式**：桌面端三栏卡片网格，移动端单列堆叠

### 2.5 功能模块组织
- **左侧边栏（工作空间内）**：功能分区清晰
  - 项目 / Bot / 工作流 / 插件 / 知识库 / 资源
- **工作流编辑器**：
  - 可视化拖拽节点（LLM、代码块、插件等）
  - DAG 图谱展示
  - 节点配置右侧抽屉
- **Bot 创建流程**：分步向导（基本信息 → 人设 → 技能 → 知识库 → 发布）

### 2.6 值得借鉴的亮点
- **多 Agent 协作演示** —— 用真实任务流程（"产品发布筹备"）而非抽象功能卡片，极具说服力
- **集成本地 CLI 工具** —— Claude Code / Codex / Openclaw 一键接入，扩展开发者用户群
- **模型自由切换** —— 同一 Agent 可切换 Doubao / Kimi / GLM / Minimax，体现平台中立性
- **工作空间组织** —— 个人空间 vs 团队空间分离，符合团队协作 SaaS 模式

---

## 3. 火山方舟（volcengine.com/product/ark）

### 3.1 网站骨架
- **主域名**：`https://www.volcengine.com/product/ark`
- **控制台域名**：`https://console.volcengine.com/ark/`
- **方舟控制台路由**：`/region:ark+cn-beijing/...`
- **核心子页面**：
  - `/product/ark` —— 产品介绍页
  - `/experience/ark` —— 在线体验中心
  - `/docs/82379/...` —— API 文档
  - `/pricing?product=ark_bd` —— 定价页（带价格计算器 tab=2）
  - 控制台：`/model`（模型列表）、`/apiKey`（密钥管理）、`/openManagement`（开通管理）

### 3.2 UI 设计语言
- **色彩方案**：火山引擎品牌色（深蓝 + 渐变青绿），强调"科技 + 可信"
- **字体**：企业级无衬线字体，字号偏小信息密度高
- **间距**：模块间 64-96px，表格行高紧凑（约 48-56px）
- **圆角**：卡片圆角 8-12px，按钮圆角 4-8px（偏方正，体现企业感）
- **阴影**：弱阴影，主要靠边框和背景色区分层次
- **NEW 标签**：橙色 / 红色小标签贴在新增能力旁

### 3.3 页面布局
**产品首页结构**：
1. **顶部 NEW 通知区**：
   - 轮播展示最新上线能力（Doubao-Seed-2.1 / Doubao-Seedance-2.0 / Doubao-Seedream-5.0 / 方舟 Coding Plan）
2. **Hero 区**：
   - 主标题"火山方舟 - 一站式大模型服务平台"
   - 副标题："模型能力拓展 ｜ 专业算法服务 ｜ 安全可信会话无痕 ｜ 高并发算力保障"
   - 多个 CTA：最新活动 / 模型定价 / 体验中心 / 接入 API
3. **最新动态区**（轮播 4 次）：
   - 最新能力、最佳实践、最新活动、开发者专享、最新福利
4. **灵活定价方案**：
   - 4 张特性卡片：按量付费 / 生产级保障 / 免费额度 / 应用实验室
   - 多个定价表格（文本生成 / 视频生成 / 图像生成 / 语音模型 / 向量模型 / 深度思考）
   - 每行：模型名 | 在线推理价格 | 上下文缓存价格

### 3.4 交互逻辑
- **价格计算器**：独立 tab 入口，输入 token 量实时估算费用
- **模型切换**：模型详情页支持切换不同版本
- **在线调试**：体验中心支持 chat / vision / GenVideo 多模式切换
- **NEW 标签**：橙色高亮新增项，引导用户关注新能力

### 3.5 功能模块组织
- **定价表格设计**：
  - 列：模型名 | 在线推理 | 在线推理-上下文缓存
  - 行：按"文本生成 / 视频生成 / 图像生成 / 语音模型 / 向量模型"分类
  - 价格单位明确："元/百万输入 tokens"
- **模型卡片**：模型图 + 名称 + 标签（旗舰模型/指令精准）+ 一句话描述 + 起步价格

### 3.6 值得借鉴的亮点
- **NEW 标签策略** —— 用小色块标记新能力，既不打断主视觉又能引导注意力
- **多维度定价表** —— 按"模态分类 × 推理类型"二维组织，专业用户一目了然
- **价格计算器独立 tab** —— 降低用户估算成本的心理门槛
- **CLI 工具生态** —— 方舟 CLI 支持 Claude Code / Cursor / TRAE，融入开发者工作流
- **协作奖励计划** —— "免费每日领取单模型最高500万 Tokens"，激励开发者使用

---

## 4. 火山引擎（volcengine.com）

### 4.1 网站骨架
- **主域名**：`https://www.volcengine.com`
- **企业级 SaaS 风格**，产品矩阵庞大
- **核心子页面**：
  - `/product/{产品名}` —— 各产品介绍页（ark、agentkit、coze-pro、hiagent、trae、arkclaw 等）
  - `/activity/{活动名}` —— 活动专题页
  - `/docs/{docId}/...` —— 文档中心
  - `/pricing?product={id}` —— 产品定价页
  - `/product/list` —— 全部产品列表
- **页面数量**：上百个产品页 + 解决方案页 + 文档页

### 4.2 UI 设计语言
- **色彩方案**：火山红 + 深蓝主色，企业级沉稳风格
- **字体**：思源黑体 / 苹方，标题字号偏大
- **间距**：模块间 96-128px，section 内 padding 充足
- **圆角**：偏方正（4-8px），强调企业级严谨感
- **阴影**：弱阴影，靠边框 + 灰色背景分层
- **数据可视化**：份额数据用大数字 + 百分比强调（"49.5%"）

### 4.3 页面布局
**首页结构**：
1. **顶部 Mega 导航**：
   - 多级下拉菜单（产品分类 → 具体产品）
   - 右侧"控制台 / 登录"按钮
2. **Hero 轮播 Banner**（10+ 张）：
   - 方舟 CodingPlan 首月9.9元起
   - ArkClaw 千万 Tokens 大放送
   - 企业级 AI Agent 平台
   - 开发者激励计划
   - AI 生态伙伴招募
   - Force 原动力大会
   - Seed Evolving 模型上线
   - Seedance X 周星驰 IP
   - Seedance 2.0 全面开放 API
3. **方舟入口区**：
   - CLI 安装命令展示 `npm i @volcengine/ark-cli@latest -g`
   - 双 CTA：获取 API KEY / 进入火山方舟
4. **最新模型区**（4 张卡片网格）：
   - 豆包大模型 2.1 Pro（旗舰）
   - 豆包视频生成模型 2.0
   - 豆包图像创作模型 5.0
   - 豆包语音识别模型 2.0
5. **AI 云产品矩阵**（10+ 卡片）：
   - 豆包大模型 / ArkClaw / TRAE CN / 火山方舟 / AgentKit / 扣子 / HiAgent / 安全运营智能体 / 机器学习平台 / 云服务器 / 对象存储 / 云数据库
   - 每张卡片：图标 + 名称 + HOT 标签 + 一句话描述 + 跳转链接
6. **三层防护体系**：
   - 模型可信 / 智能体可控 / 运营安全 三栏
   - 每栏列出对应产品子项
7. **多场景 AI Agent 应用**（轮播 + 网格）：
   - TRAE Vibe Coding
   - ArkClaw AI 员工助手
   - 扣子 AI 工作流
   - 联网问答 chatbot
   - HiAgent 智能体
   - KickArt 创意广告
   - 数据智能体
   - 剧创 Agent AI 短剧
8. **客户价值区**：
   - 大数据："占中国大模型公有云市场调用量份额 49.5%"
   - 4 大卖点：客户价值为先 / 全方位安全保障 / 极速服务应答 / 全天候售后服务
9. **Footer**：
   - 业务咨询邮箱 / 市场合作邮箱 / 电话 / 地址
   - 微信公众号、抖音号、视频号二维码

### 4.4 交互逻辑
- **多级 Mega Menu**：鼠标悬停展开二级、三级菜单
- **Hero 轮播**：自动播放 + 手动切换 dots
- **场景卡片轮播**：横向滚动展示多场景应用
- **滚动揭示**：section 进入视口时上滑淡入

### 4.5 功能模块组织
- **产品矩阵分类**：按"AI 模型 / AI 应用 / 云底座"三大类组织
- **解决方案页**：按行业（金融、零售、制造、政企等）+ 场景（智能客服、内容创作、研发提效等）双维度组织
- **文档中心**：产品文档 + 最佳实践 + API 参考 + 快速入门四类

### 4.6 值得借鉴的亮点
- **企业级 SaaS 模板典范** —— 完整覆盖 Hero / 产品矩阵 / 解决方案 / 安全 / 客户案例 / 联系方式
- **份额数据强调** —— 用"49.5%"等具体数字建立行业领导力认知
- **三层防护体系** —— 把抽象的"安全"拆解为可理解的三层结构
- **多场景应用展示** —— 8 个具体应用案例，比抽象功能介绍更有说服力
- **CLI 命令展示** —— 在首页直接展示安装命令，吸引开发者

---

## 5. 通义千问（tongyi.aliyun.com）

### 5.1 网站骨架
- **主域名**：`https://tongyi.aliyun.com`
- **核心定位**：阿里通义实验室官网，主打"千问 + 万相"双品牌
- **核心子页面**：
  - `/landing?family=qwen` —— 千问大模型详情
  - `/landing?family=wan` —— 万相视觉模型详情
  - `/news?id=...` —— 新闻动态
  - 阿里云百炼控制台（独立子产品）

### 5.2 UI 设计语言
- **色彩方案**：阿里橙 + 深紫渐变背景，体现"实验室"科技感
- **字体**：阿里普惠体，标题字重偏粗
- **间距**：模块间距大，section 内 padding 充足
- **圆角**：卡片圆角 12-16px，柔和现代
- **背景**：深色科技感背景 + 光效装饰
- **数据强调**：用大字号数字突出客户数

### 5.3 页面布局
**首页结构**：
1. **顶部品牌区**："通义实验室 - 千问 · 万相 - 全球领先的AI大模型"
2. **双模型家族并列展示**：
   - **千问大语言模型**：超万亿参数规模预训练，具备自然语言理解、文本生成、视觉理解、音频理解、工具使用、角色扮演、AI Agent 互动等能力
     - 模型列表：Qwen3-Max / Qwen-Plus / Qwen-Flash / Qwen3-Coder-Plus / Qwen3-VL-Plus / Qwen3-Omni-Flash / Qwen-Image
     - 每个模型后跟简短标签："全能、至强" / "旗舰、均衡" / "轻量、极速" 等
   - **万相视觉生成大模型**：原生多模态统一框架，画面质量、语义理解、运动幅度、物理规律遵循、艺术质感领先
     - 模型列表：Wan2.6-R2V / Wan2.6-I2V / Wan2.6-T2V / Wan2.6-T2I / Wan2.6-Image / Wan2.2-Animate
3. **客户规模强调区**：
   - "数万个客户选择了千问大模型，适用于千行百业"
   - 大字数据展示
4. **行业应用场景区**（按模型能力分组）：
   - **Qwen-Omni / Qwen3 / Qwen-TTS / CosyVoice / Fun-ASR** 组：
     - 消费电子终端、陪伴与社交、智能座舱
   - **Qwen-Doc / Qwen-Long / 数据挖掘** 组：
     - 实体识别和电商信息提取、长文档归纳总结、文本分析打标
   - **Tongyi-intent-detect / Qwen-Vl-CIP / Tongyi-fraud-detection** 组：
     - 内容安全审核、设备风控、互联网反欺诈
5. **客户 Logo 墙**：30+ 家企业 Logo 网格展示
6. **信赖背书区**：
   - "千问已服务全球超过 30 万家企业级客户，涵盖互联网、消费电子等行业"

### 5.4 交互逻辑
- **模型标签切换**：每个模型卡片可点击进入详情
- **场景分组导航**：左侧能力分类 + 右侧场景案例
- **Logo 墙网格**：响应式自适应列数

### 5.5 功能模块组织
- **双品牌并列** —— 千问（语言）+ 万相（视觉）平级展示
- **能力 → 场景映射** —— 每个模型能力下方挂载对应的行业应用案例
- **标签化模型描述** —— "全能、至强"、"轻量、极速" 两个词概括定位

### 5.6 值得借鉴的亮点
- **双品牌并列布局** —— 将语言模型与视觉模型作为两大品牌平级展示，结构清晰
- **能力 → 场景映射** —— 不只列模型，还展示"这个能力用在什么场景"，业务价值清晰
- **双词标签定位** —— 用两个词概括模型定位（"全能、至强"），用户秒懂
- **大字数据强调** —— "30 万家企业"、"数万个客户" 等数字用大字号视觉强化

---

## 6. 智谱清言（chatglm.cn + bigmodel.cn）

### 6.1 网站骨架
- **C 端对话域名**：`https://chatglm.cn` —— 智谱清言对话助手
- **开放平台域名**：`https://bigmodel.cn` —— 智谱 AI 开放平台（B 端 / 开发者）
- **国际版**：`https://z.ai` —— 海外用户访问入口
- **核心子页面**（bigmodel.cn）：
  - `/console/marketplace/index/agent` —— 智能体市场
  - `/console/...` —— 控制台各功能
  - 模型详情页、API 文档、定价页

### 6.2 UI 设计语言
- **色彩方案**：
  - C 端 chatglm：以 GLM 蓝（深蓝 #1E40AF 系）为主，简洁明亮
  - B 端 bigmodel：国际化英文版风格，深色背景 + 渐变科技感
- **字体**：现代无衬线，国际版用英文为主
- **间距**：模块化卡片布局，间距适中
- **圆角**：卡片圆角 8-12px
- **国际化**：英文版用大字号粗体标题（"Build"、"Experience Now"）

### 6.3 页面布局
**bigmodel.cn 首页结构**：
1. **Hero 标题区**："不止模型，构建可信智能"
2. **核心模型展示**（3 张大卡片）：
   - **GLM-5.1**：旗舰模型，长任务能力增强，匹配 Claude Opus 4.6 性能
   - **GLM-5V-Turbo**：多模态 Agent 模型，视觉与语言原生集成
   - **GLM Coding Plan**：面向高频编码场景的订阅制 AI 编程包
3. **旗舰模型家族**：
   - GLM-5（开源 SOTA 编码能力，擅长小时级长任务）
   - GLM-4.6V（多模态编码模型，原生处理图像/视频/文本）
4. **从模型到产品一站式**（6 大能力模块）：
   - 智能体（Agent）+ 联网搜索 + MCP + 知识库 + 模型微调
   - 每个能力有图标 + 标题 + 简介
5. **智能体市场**：
   - "精选智能体，直击千行百业真需求"
   - "API 直连生产环境，无缝融入业务全流程"
6. **客户 Logo 墙**：18+ 家国际企业 Logo
7. **底部 CTA**："让机器像人一样思考" + 售前咨询 + Github 链接

### 6.4 交互逻辑
- **国际版风格**：英文 + 大字号粗体标题，对标国际大厂
- **模型对比**：直接 benchmark 对标 Claude Opus 4.6
- **能力模块图标化**：6 大能力用图标卡片展示

### 6.5 功能模块组织
- **能力分类**：Agent / 联网搜索 / MCP / 知识库 / 模型微调（5 大类）
- **智能体市场**：精选 + 一键 API 接入
- **Coding Plan**：独立订阅产品线

### 6.6 值得借鉴的亮点
- **国际版对标** —— 直接在文案中 benchmark 对标 Claude Opus 4.6，建立技术认知
- **6 大能力图标墙** —— 把平台能力抽象为 5-6 个图标卡片，简洁有力
- **双站点策略** —— C 端 chatglm.cn + B 端 bigmodel.cn 分离，受众清晰
- **"不止模型" 定位** —— 强调"构建可信智能"，从模型层升级到应用层

---

## 7. Kimi（kimi.moonshot.cn）

### 7.1 网站骨架
- **主域名**：`https://kimi.moonshot.cn`
- **极简设计**：类似浏览器界面，无传统 marketing landing
- **核心定位**：长文本理解专家，支持 200 万字超长上下文
- **页面数量**：极少，主要为对话页

### 7.2 UI 设计语言
- **色彩方案**：极简黑白灰，主色为深灰 / 黑色文字 + 白色背景
- **字体**：系统默认字体，字号偏小，信息密度低
- **间距**：大量留白，极简风格
- **圆角**：输入框圆角较大
- **阴影**：几乎无阴影，扁平化
- **Logo**：极简的"Kimi"字样

### 7.3 页面布局
**首页结构**：
1. **顶部极简导航**：Logo + 设置图标
2. **中央欢迎区**：
   - 大号文字 "尽管问..."（占位符式欢迎语）
3. **输入区**：
   - 单一对话框
   - 附件上传按钮（支持 PDF / Word / Excel / TXT / Markdown / 图片）
   - 对话条件 / 系统设置 / 会话模式 等次级选项
4. **无其他营销内容**

### 7.4 交互逻辑
- **极简冷启动**：只用"尽管问..."一句话引导用户
- **文档处理**：支持拖拽上传多种格式文件
- **会话模式切换**：可切换不同的对话模式
- **设置抽屉**：右侧抽屉式展开设置

### 7.5 功能模块组织
- **极简单一对话模块** —— 没有功能卡片、没有模型对比、没有客户 Logo
- **长文本能力** —— 通过实际支持的文件格式隐式传达能力（200 万字上下文）

### 7.6 值得借鉴的亮点
- **极简哲学** —— 一句话"尽管问..."胜过千言万语营销文案
- **去 marketing 化** —— 完全没有定价、客户案例、功能对比，纯产品体验
- **文件格式支持** —— 通过支持多种格式隐式展示长文本能力
- **品牌人格化** —— "Kimi"拟人化命名，比"XX 大模型"更亲和

---

## 8. Dify（dify.ai）

### 8.1 网站骨架
- **主域名**：`https://dify.ai`
- **云服务**：`https://cloud.dify.ai/signin`
- **开源仓库**：`https://github.com/langgenius/dify`（146.7k stars）
- **社区**：Discord、Forum（forum.dify.ai）
- **核心子页面**：首页 + 文档 + 定价 + 社区

### 8.2 UI 设计语言
- **色彩方案**：现代深色 + 渐变（紫蓝渐变为主），国际化设计风格
- **字体**：英文为主（Inter / SF Pro 类），中文为辅
- **间距**：模块间距大，section 内 padding 充足
- **圆角**：卡片圆角 12-16px，按钮圆角适中
- **阴影**：渐变光效替代阴影，营造科技感
- **大字号数字**：GitHub Stars、下载量、贡献者数用超大字号展示

### 8.3 页面布局
**首页结构**（4 大主 section）：
1. **BUILD 区**：
   - Hero："Build Production-Ready AI Agent"
   - 146.7k stars on GitHub 数据展示
   - 4 个能力卡片：
     - Amplify with Any Global LLMs（接入全球 LLM）
     - Build Upon Others' Creation（基于他人创作）
     - Launch Right Away（灵活发布选项）
     - Sophisticated Workflow in Minutes（拖拽式工作流）
2. **CONNECT 区**：
   - "Supercharge AI applications with global LLMs, RAG pipelines, tools, agent strategies"
   - 4 个能力卡片：
     - Add Wings with Tools（插件扩展）
     - Native MCP Integration（MCP 协议集成）
     - Get Your Data LLM Ready with RAG（RAG 数据预处理）
     - Publish as Universal MCP Server（发布为 MCP 服务）
3. **Production Ready 区**：
   - 3 大保障：Scalable / Stable / Secure
   - 每项编号 + 标题 + 描述
4. **STARTUP 区**：
   - "Unlock Your Potential with AI"
   - 3 步走：Go to Market at Velocity / Pivot with Agility / Data-Driven Success
5. **COMMUNITY 区**：
   - 数据展示：5M+ Downloads / 146.7k Stars / 800+ Contributors
   - Twitter 推文墙：4-5 条开发者真实评价
   - Discord 社区入口

### 8.4 交互逻辑
- **大写英文 section 标题**：BUILD / CONNECT / STARTUP / COMMUNITY，每个 section 一个动词
- **数据计数器动画**：数字滚动到目标值
- **推文轮播**：社区评价横向滚动

### 8.5 功能模块组织
- **以动词命名 section** —— BUILD / CONNECT / PRODUCTION / STARTUP / COMMUNITY，叙事性强
- **能力卡片统一格式**：图标 + 标题 + 描述 + 截图
- **MCP 双向支持** —— 既能消费 MCP 服务，也能发布为 MCP 服务

### 8.6 值得借鉴的亮点
- **动词化 section 命名** —— 用 BUILD / CONNECT 等动词而非名词，叙事感强
- **数据用大字号** —— GitHub Stars、下载量用超大字号，建立开源社区信任
- **真实推文墙** —— 用 Twitter 真实用户评价替代客户案例，更可信
- **MCP 双向能力** —— 既消费 MCP 也发布 MCP，体现平台中立性
- **开源 + 云服务双轨** —— 开源版吸引开发者，云服务版变现

---

## 9. ChatGPT（chat.openai.com / openai.com）

### 9.1 网站骨架
- **主域名**：`https://openai.com`
- **对话域名**：`https://chatgpt.com`（原 chat.openai.com）
- **API 平台**：`https://openai.com/api/`
- **企业版**：`https://openai.com/business/`
- **核心子页面**：
  - 首页（含输入框 + 50+ 建议气泡）
  - `/chatgpt/download/` —— 下载页
  - `/research/` —— 研究博客
  - `/news/` —— 新闻
  - `/stories/` —— 客户故事
  - `/business/customer-stories/` —— 企业案例

### 9.2 UI 设计语言
- **色彩方案**：极简黑白灰 + 单一强调色（绿色 OpenAI 绿）
- **字体**：Söhne / Inter 类无衬线字体，字号偏小
- **间距**：内容居中，最大宽度约 1200-1400px
- **圆角**：卡片圆角 8-12px
- **阴影**：极弱阴影
- **多语言建议气泡**：50+ 建议气泡覆盖英语、日语、中文、葡萄牙语、法语、德语

### 9.3 页面布局
**openai.com 首页结构**：
1. **顶部导航**：ChatGPT / Research / API Platform / More
2. **Hero 区**：
   - "What can I help with?" + 输入框
   - 50+ 建议气泡（覆盖写作、学习、编码、旅行、生活等多场景，多语言）：
     - "Quiz me on vocabulary"
     - "Plan a surf trip to Costa Rica in August"
     - "India stock market today"
     - "ハーフマラソンのトレーニングを手伝ってください"
     - "Rédigez une note de remerciement"
     - "楽しいディナーパーティーの計画を手伝ってください"
   - 顶部 CTA："Learn about ChatGPT Business" / "Talk with ChatGPT"
3. **特色文章区**：
   - "Codex for every role, tool, and workflow"
   - "Daybreak: Tools for securing every organization"
   - "Improving health intelligence in ChatGPT"
4. **最新研究区**："Better memory for a more helpful ChatGPT"（Dreaming 项目）
5. **Recent news 区**：
   - Confidential submission of draft S-1 to the SEC（IPO 进展）
   - Built to benefit everyone: our plan
   - Advancing content provenance
   - A new personal finance experience in ChatGPT
6. **Stories 区**（3 个客户故事卡片）：
   - Training to cycle across Antarctica with ChatGPT
   - Creating new simulations of black holes with Codex
   - Chip Ganassi Racing × OpenAI
7. **Latest research 区**：
   - An OpenAI model has disproved a central conjecture in discrete geometry
   - Introducing GPT-Rosalind for life sciences research
   - How we monitor internal coding agents for misalignment
8. **OpenAI for business 区**：
   - Choco automates food distribution with AI agents
   - CyberAgent moves faster with ChatGPT Enterprise and Codex
   - Gradient Labs gives every bank customer an AI account manager
9. **底部 CTA**："Get started with ChatGPT" + "Download"

### 9.4 交互逻辑
- **多语言建议气泡**：根据用户地区动态展示对应语言的建议
- **滚动叙事**：每个 section 一个主题（产品 / 研究 / 新闻 / 故事 / 商业）
- **下载入口**：底部强引导下载 App

### 9.5 功能模块组织
- **GPT 商店（GPT Store）**：
  - 类似 App Store 的分类导航
  - 类目：Featured（本周精选）/ Trending（社区最受欢迎）/ By ChatGPT（官方）
  - 每个 GPT 卡片：图标 + 名称 + 描述 + 作者 + 使用量
- **设置页面**：
  - 个人信息 / 订阅 / 数据控制 / 共享链接 / 删除账号 等分组
- **侧边栏**：
  - New chat / Search / GPTs / Explore GPTs
  - 历史对话列表（按时间分组：今天 / 昨天 / 本周 / 上月）
  - 用户设置 + 帮助 + 退出

### 9.6 值得借鉴的亮点
- **多语言建议气泡墙** —— 50+ 多语言建议，覆盖全球用户，体现产品国际化
- **App Store 模式 GPT Store** —— 类目化 + 卡片化，降低 GPT 发现门槛
- **滚动叙事首页** —— 从产品到研究到新闻到故事到商业，一气呵成
- **企业版案例独立 section** —— OpenAI for business 单独成区，B 端用户清晰
- **Dreaming 记忆项目** —— 把"模型记忆"包装为产品特性，体现技术差异化

---

## 10. Claude（claude.ai）

### 10.1 网站骨架
- **主域名**：`https://claude.ai`
- **公司官网**：`https://www.anthropic.com`
- **支持国家查询**：`https://www.anthropic.com/supported-countries`
- **核心功能子页**：
  - 对话主页
  - Projects（项目空间）
  - Artifacts（实时工作空间）
  - Settings（设置）

### 10.2 UI 设计语言
- **色彩方案**：温暖米色（#F0EEE5 系）+ 深棕色文字 + 橙色 CTA，独特"Anthropic 米色"
- **字体**：Tiempos / Copernicus 类衬线字体，区别于其他 AI 产品的无衬线
- **间距**：宽松留白，阅读体验优先
- **圆角**：圆角较大（16-24px），柔和
- **阴影**：极弱阴影，扁平化
- **品牌人格**：温暖、克制、有书卷气，区别于其他科技感冷色调

### 10.3 页面布局
**Claude.ai 首页结构**：
1. **顶部导航**：极简
2. **Hero 区**：
   - 三个主功能切换：Write / Learn / Code
   - 每个功能下 3 个子建议：
     - **Write**：Help me develop a unique voice / Improve my writing style / Brainstorm creative ideas
     - **Learn**：Explain a complex topic simply / Help me make sense of these ideas / Prepare for an exam or interview
     - **Code**：Explain a programming concept / Look over my code and give me tips / Vibe code with me
   - More 选项扩展：Write case studies / Write grant proposals / Write video scripts
3. **输入框**：居中底部
4. **底部提示**："App unavailable" 区域提示可用性限制 + "View supported countries" 链接

### 10.4 交互逻辑
- **三大场景切换**：Write / Learn / Code 切换展示不同建议
- **Artifacts 工作区**：
  - 实时专用工作空间，与 Claude 协作创意
  - 可在 Claude 应用侧边栏直接访问
  - 支持展示其他人制作的精选项目作为灵感来源
  - 可生成可交互的网页 / 图表 / 代码 / 文档
- **Projects 项目空间**：
  - 项目级上下文管理
  - 独立知识库
  - 多对话归属同一项目

### 10.5 功能模块组织
- **三大场景预设**：Write / Learn / Code，每场景预设 3 个建议
- **Artifacts 侧边栏入口** —— 从侧边栏直接访问所有 Artifacts
- **Projects 项目空间** —— 把对话组织为项目，每个项目独立上下文
- **订阅分级**：
  - Claude Pro（$20/月）：5 倍免费额度 + 优先访问 Claude 4.5 Opus + 解锁 Projects + 深度研究工具
  - Claude Max（$100-$200/月）：2026 新增顶级套餐

### 10.6 值得借鉴的亮点
- **独特米色品牌色** —— 在所有 AI 产品都用蓝紫色的同质化中，米色 + 衬线字体极具辨识度
- **三大场景预设** —— Write / Learn / Code 三场景，每场景 3 个建议，比通用建议气泡更聚焦
- **Artifacts 独立空间** —— 把生成的内容沉淀为可分享可浏览的工作空间，从对话升级为创作
- **侧边栏 Artifacts 入口** —— Artifacts 不再是对话副产物，而是一级公民
- **Projects 项目化** —— 对话以项目组织，每个项目独立上下文 + 知识库，符合工作流
- **衬线字体选择** —— 在 AI 产品中独树一帜，传达"思考、深度、人文"品牌调性

---

## 总结：对燃渡AI 的设计启示

### 一、首页结构选择（三种范式）

| 范式 | 代表网站 | 适用场景 |
|---|---|---|
| **首页即对话** | 豆包、Kimi | C 端用户为主，转化路径最短 |
| **Marketing Landing + 多 Agent 演示** | 扣子、Claude | 多 Agent / 多场景平台 |
| **企业级 SaaS + 产品矩阵** | 火山引擎、火山方舟 | B 端企业用户 + 多产品线 |

### 二、设计差异化策略

1. **品牌色差异化** —— 避开蓝紫同质化，可参考 Claude 的米色、Kimi 的极简黑白
2. **字体差异化** —— 衬线字体（Claude）或现代等宽字体可建立独特品牌识别
3. **section 命名动词化** —— 参考 Dify 的 BUILD / CONNECT / STARTUP / COMMUNITY
4. **数据大字号展示** —— 客户数、Stars、下载量用超大字号（Dify、火山引擎）

### 三、关键功能模块设计参考

| 功能模块 | 最佳参考 | 设计要点 |
|---|---|---|
| 多 Agent 协作演示 | 扣子 | 用真实任务流程演示，比功能卡片更有说服力 |
| 模型定价表 | 火山方舟 | 按"模态 × 推理类型"二维组织 + 价格计算器 |
| 智能体市场 | ChatGPT GPT Store / bigmodel | 类 App Store 类目化 + 卡片化 |
| 工作流编辑器 | 扣子 / Dify | 可视化拖拽 DAG + 节点配置抽屉 |
| Artifacts 工作空间 | Claude | 侧边栏一级入口 + 可分享可浏览 |
| Projects 项目化 | Claude | 对话以项目组织 + 独立知识库 |
| 多语言建议气泡 | ChatGPT | 50+ 多语言建议覆盖全球用户 |
| 三大场景预设 | Claude | Write / Learn / Code 三场景各 3 建议 |
| NEW 标签策略 | 火山方舟 | 小色块标记新能力，不打断主视觉 |
| 双品牌并列 | 通义千问 | 千问（语言）+ 万相（视觉）平级展示 |
| 真实推文墙 | Dify | Twitter 真实评价替代客户案例 |

### 四、交互设计要点

1. **冷启动引导** —— 用真实热点话题（豆包）或场景预设（Claude）降低首次使用门槛
2. **滚动揭示动画** —— section 进入视口时淡入上滑，参考扣子、火山引擎
3. **MCP 双向支持** —— 既能消费 MCP 服务也能发布为 MCP 服务（Dify）
4. **CLI 工具生态** —— 提供 CLI 接入主流开发工具（火山方舟 CLI 支持 Claude Code / Cursor / TRAE）
5. **协作奖励计划** —— "免费每日领取 N 万 Tokens"激励开发者（火山方舟）

### 五、值得避开的反模式

1. **过多营销内容堆砌** —— 火山引擎首页 10+ 轮播 Banner，信息过载
2. **抽象功能卡片墙** —— 没有真实案例支撑的功能介绍缺乏说服力
3. **同质化蓝紫渐变** —— 国内 AI 产品几乎全部用蓝紫渐变，缺乏辨识度
4. **过度 marketing 化** —— Kimi 的极简反而更受欢迎
5. **定价信息隐藏** —— 火山方舟把定价前置展示，比"联系我们"更友好

---

## 附：各网站核心数据对比

| 网站 | 核心定位 | 主品牌色 | 设计风格 | 首页结构 | 亮点功能 |
|---|---|---|---|---|---|
| 豆包 | C 端 AI 助手 | 蓝色 | 极简扁平 | 首页即对话 | 资讯热点卡片 |
| 扣子 | 多 Agent 协作平台 | 扣子蓝 + 深色 | 现代科技感 | Marketing + 演示 | 多 Agent 协作演示 |
| 火山方舟 | 一站式大模型服务 | 深蓝 + 青绿 | 企业级 | 产品 + 定价表 | NEW 标签 + 价格计算器 |
| 火山引擎 | 企业级 AI 云 | 火山红 + 深蓝 | 企业级 SaaS | Mega Menu + 产品矩阵 | 三层防护体系 |
| 通义千问 | 双品牌大模型 | 阿里橙 + 深紫 | 实验室科技感 | 双品牌并列 | 能力→场景映射 |
| 智谱清言 | 可信智能平台 | GLM 蓝 | 国际化 | 模型 + 能力图标墙 | 国际版对标 Claude |
| Kimi | 长文本专家 | 黑白灰 | 极简 | 首页即对话 | "尽管问..." |
| Dify | 开源 AI 应用平台 | 紫蓝渐变 | 国际化 | 动词化 section | MCP 双向 + 推文墙 |
| ChatGPT | AI 助手 + 商店 | 黑白 + OpenAI 绿 | 极简 | 输入 + 多语言气泡 | GPT Store |
| Claude | AI 创作伙伴 | 米色 + 橙 | 温暖书卷气 | 三场景预设 | Artifacts + Projects |

---

*本报告基于 2026-06-29 实际访问各网站获取的真实信息整理，可作为燃渡AI网站视觉升级与功能模块设计的参考依据。*

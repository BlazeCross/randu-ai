# 燃渡AI平台 开发文档研究报告

> 研究时间：2026年6月29日
> 研究目的：深入研究火山方舟、阿里云ECS/OSS、扣子Coze、微信AI等开发文档，分析对燃渡AI平台的开发参考价值，并给出硬件升级与功能优先级建议。
> 关联文档：`docs/TECHNICAL_PLAN.md`（项目定位与技术栈）、`docs/COZE_PLUGIN_GUIDE.md`（扣子插件接入）
> 当前硬件：阿里云 ECS 2核4G，50G ESSD，成都地域；OSS 免费版 randu-ai Bucket

---

## 摘要

本研究通过 WebSearch + WebFetch 调研了火山方舟 Ark API、阿里云 ECS、阿里云 OSS、扣子 Coze 工作流、微信 AI 开放能力共 5 个开发文档体系，并对 Coze 海外/国内版、Dify 开源/商业版、Bot Store 工作流市场设计进行了竞品对标。

核心结论：
1. **燃渡AI 当前已接入火山方舟（豆包 + Seedream + Seedance）和 OSS**，方向正确，火山方舟的 OpenAI 兼容协议 + 异步任务机制 + Bearer 鉴权可作为平台对外 API 的范式。
2. **2核4G 可承载当前所有功能**（Next.js API Routes + PostgreSQL + 调用转发），瓶颈在并发而非算力；视频生成等重计算全部卸载到火山方舟，ECS 仅做转发，硬件压力低。
3. **建议升级方向**：当 DAU 突破 500 或并发视频任务 > 10 时升级到 **4核8G（通用算力型 u1，约 600元/年）**；引入扣子工作流市场 / 知识库 RAG 后再考虑 8核16G。
4. **最高优先级新增功能**：① 扣子工作流 API 集成（已具备插件基础）② OSS STS 临时凭证直传（降本+提速）③ 火山方舟 Webhook 回调（替代轮询）。

---

## 一、火山方舟大模型开发文档

### 1.1 核心能力概述

火山方舟（Volcengine Ark）是字节跳动旗下大模型推理与服务平台，对外提供 OpenAI 兼容协议。燃渡AI 已通过 `src/lib/volcengine.ts` 接入以下三类能力：

| 能力 | 模型 | 接口 | 协议 |
|------|------|------|------|
| 文本对话 | 豆包 Doubao（Pro-32K / Pro-128K / 2.1 Pro） | `/chat/completions` | OpenAI 兼容，同步 |
| 文生图 | Seedream 4.0 / 4.5 | `/images/generations` | OpenAI 兼容，同步 |
| 视频生成 | Seedance 1.0 pro / 2.0 mini | `/contents/generations/tasks` | 异步任务（提交→轮询→获取） |

此外方舟还提供 **知识库（RAG）API**（create/update/info/list/delete/search/service_chat/search_knowledge/chat_completions）、**文档/切片管理**、**Rerank 重排**、**实验版本**、**MCP Server** 等能力，当前燃渡AI 尚未使用。

### 1.2 API/接口要点

- **Base URL**：`https://ark.cn-beijing.volces.com/api/v3`
- **鉴权方式**：HTTP Header `Authorization: Bearer {API_KEY}`，API Key 在火山引擎控制台「推理接入点」创建。燃渡AI 现用环境变量 `VOLC_ARK_API_KEY`。
- **模型引用**：通过 Endpoint ID（如 `ep-xxxxxxxx`）或模型版本号（如 `doubao-seedance-1-0-pro-250528`）调用。
- **异步任务机制（视频生成）**：
  - 创建任务返回 `task_id`；
  - 通过 `GET /contents/generations/tasks/{task_id}` 轮询任务状态（`queued` / `running` / `succeeded` / `failed`）；
  - 燃渡AI 现状：`useTaskPolling.ts` + `/api/task/[id]/status` 轮询，未启用 Webhook。
- **限流策略**（以 Seedance 1.0 pro 为例）：
  - **RPM 限流 600**：每分钟每账号每模型创建任务上限；
  - **并发数限制 10**：同时处理中的任务上限，超出进入队列；
  - 豆包对话按 TPM（每分钟 token）限流，超额返回 HTTP 429。
- **错误码体系**：分「方舟错误码」和「公共错误码」两类，含 HTTP 状态码、错误类型 Type、错误码 Code、错误信息 Message。燃渡AI 应在 `volcengine.ts` 补充 429/5xx 的自动退避重试。
- **SDK 支持**：
  - 官方 Python SDK：`volcengine-python-sdk`（Python 2.7+）；
  - 官方 Node.js SDK：`@volcengine/openapi`；
  - **注意**：SDK V1/V2 已于 2024-11-30 下线，新接入点必须用 V3 / OpenAI 兼容 HTTP 协议（燃渡AI 现用 fetch 直调 V3，符合最新规范）。

### 1.3 对燃渡AI的参考价值

| 能力 | 价值 | 落地建议 |
|------|------|---------|
| OpenAI 兼容协议 | ⭐⭐⭐⭐⭐ | 燃渡AI 对外 API（`/api/external/generate/*`）应继续沿用此协议，降低学员迁移成本 |
| 异步任务 + task_id | ⭐⭐⭐⭐⭐ | 工作流执行、批量生图可复用此模式（已用于视频） |
| 限流 RPM/并发双维度 | ⭐⭐⭐⭐ | 燃渡AI `src/lib/rateLimit.ts` + `ipRateLimit.ts` 应参考，按用户/按 Key 双维度限流 |
| 知识库 RAG API | ⭐⭐⭐⭐ | 可作为「燃渡学院」文档问答的后端，无需自建向量库 |
| MCP Server | ⭐⭐⭐ | 未来 Claude/Trae 等 MCP 客户端可直接调用燃渡AI |
| 错误码分级 | ⭐⭐⭐ | `volcengine.ts` 目前只做基础 throw，应补 429 退避、5xx 兜底 |

### 1.4 硬件要求

- **运行该能力本身**：无需本地 GPU/CPU 算力，所有推理在火山方舟侧完成。
- **ECS 侧最低配置**：1核1G 即可（仅做 HTTP 转发）。
- **燃渡AI 现状（2核4G）**：完全够用，瓶颈在网络 IO 和数据库连接，不在算力。
- **并发视频任务轮询**：每个轮询请求约占用 1 个连接 30s，建议把超时从 30s 降到 10s 并启用 `useTaskPolling` 指数退避。

### 1.5 成本分析（按量付费，元/百万 token）

| 模型 | 输入 | 输出 | 备注 |
|------|------|------|------|
| Doubao-Pro-32K | 0.8 | 2 | 主力对话模型 |
| Doubao-Pro-128K | 5 | 9 | 长上下文 |
| Doubao-2.1 Pro | — | ~30 | 新一代 |
| Seedream 4.0/4.5 | 按张计费 | — | 文生图 |
| Seedance 1.0 pro | — | 15 | 视频输出，1080P 2~12s |
| Seedance 2.0 mini | — | ~0.023/千token | 高性价比，成本降约50% |

**单用户成本估算**：一次对话约消耗 2K token ≈ 0.004 元；一次视频生成（10s 1080P）≈ 0.5~2 元。燃渡AI 当前 credits 体系（`src/lib/plans.ts`）已具备按点数计费基础，建议把 1 credit ≈ 0.01 元成本 + 3 倍毛利定价。

---

## 二、阿里云 ECS 开发文档

### 2.1 核心能力概述

阿里云 ECS（Elastic Compute Service）提供弹性云服务器，是燃渡AI 的运行底座。相关配套能力：安全组、云监控 CMS、弹性伸缩 ESS、负载均衡 SLB/ALB。

### 2.2 实例规格与配置建议

| 规格族 | 配置 | 包年价（活动） | 适用场景 |
|--------|------|---------------|---------|
| 经济型 e | 2核2G + 3M + 40G ESSD Entry | 99元/年 | 个人博客、测试环境 |
| 通用算力型 u1 | 2核4G | ~199元/年 | 企业官网、轻量 API（**燃渡AI 当前**） |
| 通用算力型 u1 | 2核8G | ~300元/年 | 中小型应用 + 数据库 |
| 计算型 c9i | 4核8G | 3123元/年 | 高并发 API |
| 计算型 c9i | 2核4G | 1561元/年 | 性能稳定但贵 |

**给燃渡AI 的建议**：
- 当前 2核4G 按活动价约 199~600元/年，性价比高；
- 升级首选 **通用算力型 u1 4核8G**（约 600~1300元/年），不建议直接上计算型 c9i（贵 5 倍）；
- 经济型 e 禁止用于生产（CPU 受限，突发性能会触发降频）。

### 2.3 API/接口要点

- **安全组**：相当于云端防火墙，按方向（入/出）+ 协议 + 端口范围 + 授权对象配置。燃渡AI 应仅放行 22(SSH)/80/443，3000 端口（Next.js）仅限内网或加白名单。
- **Docker 部署最佳实践**：在 ECS 安装 Docker + docker-compose，配合 `Dockerfile` + `docker-compose.yml`（项目已具备）。建议挂载 `/etc/logrotate.d` 控制 docker logs 体积（`scripts/setup-docker-logrotate.sh` 已实现）。
- **云监控 CMS**：对 CPU/内存/磁盘/网络指标实时采集，可设阈值告警（如 CPU>80% 持续 5 分钟触发短信）。燃渡AI `scripts/monitor.sh` 已有雏形，建议接入 CMS 告警。
- **弹性伸缩 ESS**：根据 CMS 指标自动增减 ECS 实例，需配合 SLB。**2核4G 单机阶段无需启用**。
- **负载均衡 SLB/ALB**：多台 ECS 时分发流量，支持轮询/权重。燃渡AI 当前单机，备案后可先不接 SLB。

### 2.4 对燃渡AI的参考价值

| 能力 | 价值 | 落地建议 |
|------|------|---------|
| 安全组端口最小化 | ⭐⭐⭐⭐⭐ | 立即收敛 3000 端口暴露面，备案后只放 80/443 |
| Docker + docker-compose | ⭐⭐⭐⭐⭐ | 项目已具备，建议加 healthcheck + restart:unless-stopped |
| 云监控告警 | ⭐⭐⭐⭐ | CPU/内存/磁盘告警，配合 `monitor.sh` |
| 弹性伸缩 ESS | ⭐⭐ | 单机阶段不启用，DAU>1000 再考虑 |
| 负载均衡 SLB | ⭐⭐ | 同上，多实例后再上 |

### 2.5 硬件要求

- 运行燃渡AI（Next.js standalone + PostgreSQL + 偶发图片处理）：**最低 2核4G**，当前已满足。
- 若 PostgreSQL 与 Next.js 同机：建议 **4核8G** 起步（数据库内存敏感）。
- 视频转码/本地推理：ECS 不适合，必须走火山方舟。

### 2.6 成本分析

- 当前 2核4G：约 200~600 元/年（活动价）或 185 元/月（c9i 按量）。
- 升级 4核8G u1：约 600~1300 元/年。
- 升级 8核16G：约 2000~3000 元/年。
- **建议**：先用活动价续费 2核4G 一年，待 DAU>500 或并发任务激增再升级，避免提前过度投入。

---

## 三、阿里云 OSS 对象存储

### 3.1 核心能力概述

燃渡AI 已配置 `randu-ai` Bucket（免费版）。OSS 提供对象存储、图片处理、STS 临时授权、生命周期管理、CDN 加速等能力。

### 3.2 API/接口要点

- **上传方式三选一**：
  1. **直传（前端表单 POST）**：最小延迟，但需 CORS + 签名；
  2. **服务端中转**：燃渡AI 现状（`/api/upload` + `/api/user/avatar`），简单但占带宽和内存；
  3. **STS 临时凭证**：后端调 `AssumeRole` 返回临时 AccessKeyId/Secret/SecurityToken，前端直传。**最小有效期 900s，最大 43200s，默认 3600s**。
- **图片处理**：URL 参数 `?x-oss-process=image/resize,w_200/format,webp`，支持缩略图、水印、格式转换、旋转、裁剪。可定义样式（style）复用：`?x-oss-process=style/w10`。
- **跨域 CORS**：Bucket → 权限管理 → 跨域设置，配置 AllowedOrigin/Method/Header。直传必须配置。
- **生命周期**：自动转存储类型（标准→低频→归档）或删除过期对象，降低成本。
- **STS SDK**：官方支持 Java/Python/Node.js/Go/PHP/Ruby，Node.js 用 `ali-oss` 的 `STS` 类。

### 3.3 对燃渡AI的参考价值

| 能力 | 价值 | 落地建议 |
|------|------|---------|
| STS 临时凭证直传 | ⭐⭐⭐⭐⭐ | **高优先级**。当前服务端中转浪费 2核4G 带宽，改 STS 后 ECS 仅发凭证，上传流量不经服务器 |
| 图片处理 `x-oss-process` | ⭐⭐⭐⭐⭐ | 用户头像、工作流封面直接生成缩略图，零代码 |
| 生命周期管理 | ⭐⭐⭐⭐ | 视频生成结果 30 天后自动转低频存储，降本 |
| CDN 加速 | ⭐⭐⭐⭐ | 备案后绑定 randuai.cn，图片/视频走 CDN 回源 OSS |
| 跨域 CORS | ⭐⭐⭐⭐ | 改 STS 直传前必须先配好 |
| 访问权限 RAM | ⭐⭐⭐ | 生产环境禁止用主账号 AccessKey，建 RAM 子账号 |

### 3.4 硬件要求

- OSS 本身是云服务，**不占 ECS 资源**。
- 服务端中转上传会占用 ECS 带宽和内存（每张图约 1~5MB），改 STS 直传后 ECS 零负担。

### 3.5 成本分析

| 计费项 | 按量价 | 资源包 |
|--------|--------|--------|
| 标准存储 | 0.09元/GB/月 | 40GB 9元/年，100GB 33元，500GB 118.99元/年 |
| 下行流量（国内） | 忙时 0.5元/GB，闲时 0.25元/GB | 100G 49元/月 |
| 请求次数 | 极低（元/万次） | — |
| 图片处理 | 按次计费，极低 | — |

**给燃渡AI的建议**：
- 当前免费版额度基本够用，月成本 < 5 元；
- 视频生成结果 OSS 存储 + CDN 下行是主要成本，建议买 100GB 流量包 + 生命周期自动转低频；
- STS 直传改造零成本，立即可做。

---

## 四、扣子 Coze 工作流开发文档

### 4.1 核心能力概述

扣子（Coze，coze.cn）是字节跳动旗下 AI 智能体开发平台，提供低代码工作流编排、插件市场、Bot Store。燃渡AI 已在 `docs/COZE_PLUGIN_GUIDE.md` 和 `src/lib/coze.ts` 完成插件侧接入，本期重点研究其工作流能力以对接「模式B：API Key 平台模式」。

### 4.2 节点类型与编排方式

扣子低代码工作流节点极其丰富，按类别梳理：

| 类别 | 节点 |
|------|------|
| 基础节点 | 开始/结束、大模型、插件、工作流（嵌套） |
| 业务逻辑 | 代码、选择器、意图识别、循环、批处理、变量聚合、异步任务 |
| 输入输出 | 输入、输出 |
| 数据库 | SQL 自定义、新增/查询/更新/删除数据 |
| 知识数据 | 变量赋值、知识库写入/检索/删除、长期记忆、变量 |
| 图像 | 图像生成、画板 |
| 音视频 | 视频生成、视频提取音频、视频抽帧 |
| 组件 | HTTP 请求、问答、文本处理、JSON 序列化/反序列化 |
| 触发器 | 定时触发器（设置/查询/删除） |
| 会话管理 | 创建/修改/删除会话、查询会话列表 |
| 会话历史 | 查询/清空会话历史 |
| 消息 | 创建/修改/删除/查询消息 |

**关键点**：扣子内置「火山方舟模型调用」「对象存储」「数据库」「向量检索」等集成节点，可零代码编排；HTTP 请求节点可调用燃渡AI 的 OpenAPI（即扣子工作流 → 燃渡插件 → 火山方舟链路已通）。

### 4.3 变量系统与数据传递

- 工作流有全局变量、节点输入输出变量；
- 变量类型支持 String/Number/Boolean/Object/Array/File；
- 节点间通过变量引用传递数据；
- 「变量聚合」「变量赋值」节点用于复杂数据流。

### 4.4 API 调用方式与鉴权

| 鉴权方式 | 安全性 | 适用场景 |
|---------|--------|---------|
| **PAT（Personal Access Token）** | 中（长期有效，等同 API 密码） | 个人工具、内部脚本、Agent 集成 |
| **OAuth 2.0** | 高 | 生产环境、第三方应用 |
| JWT / Device / PKCE OAuth | 高 | 特殊场景 |

- **工作流 API 端点**：`POST /v1/workflow/run`，支持同步 + 流式（SSE）+ 异步三种执行模式；
- PAT 通过 Header `Authorization: Bearer {PAT}` 传递；
- 官方 Node.js SDK（`@coze/api`）完整支持所有 API，含流式响应优化；
- OAuth 应用仅管理员/超级管理员可创建。

### 4.5 定时触发与事件驱动

- 定时触发器节点支持「每天几点执行」「cron 表达式」；
- 事件驱动通过 Webhook 节点 + HTTP 请求节点组合实现；
- 支持飞书消息、邮件、企业微信机器人、微信公众号等外部集成。

### 4.6 调试、日志与版本管理

- 预览调试模式：单步执行 + 节点级输出查看；
- Trace 日志：部署后可查看运行日志和 Trace；
- 版本管理：工作流支持版本归档、回滚、历史对比；
- 批量执行 + 异步执行用于大规模数据处理。

### 4.7 对燃渡AI的参考价值

| 能力 | 价值 | 落地建议 |
|------|------|---------|
| 工作流 API（PAT/OAuth） | ⭐⭐⭐⭐⭐ | 燃渡AI 可反向调用扣子工作流，把用户自建工作流纳入平台 |
| 节点编排范式 | ⭐⭐⭐⭐⭐ | 燃渡AI 自己的工作流引擎（`/api/workflow/[id]/run`）可参考其节点分类 |
| 定时触发器 | ⭐⭐⭐⭐ | 燃渡AI 可加定时任务（如每天生成日报） |
| 版本管理 + Trace | ⭐⭐⭐⭐ | 燃渡AI 工作流应加版本号和执行日志 |
| 批量/异步执行 | ⭐⭐⭐ | 批量生图场景可复用 |
| Bot Store / 模板商店 | ⭐⭐⭐⭐⭐ | 燃渡AI「工作流市场」可对标（见第六节） |

### 4.8 硬件要求

- 扣子工作流执行在扣子侧完成，**不占燃渡AI ECS 资源**；
- 燃渡AI 仅做 API 转发和 PAT 管理，2核4G 完全够用。

### 4.9 成本分析

- 扣子个人版：免费（积分制）；
- 扣子专业版：按积分计费，2026 年初调整过定价；
- 火山方舟模型在扣子内调用：走用户自己的方舟 API Key；
- 燃渡AI 接入扣子 API 本身零成本，成本仍在火山方舟模型调用侧。

---

## 五、微信 AI 开发文档

### 5.1 核心能力概述

微信 AI 能力分散在多个平台，需分别接入：

| 平台 | 能力 | 主体要求 |
|------|------|---------|
| 微信对话开放平台（chatbot.weixin.qq.com） | 对话机器人、智能客服 | 个人/企业均可 |
| 微信小程序 AI 能力 | 小程序内 AI 调用 | 企业/个体工商户（支付+客服消息接口） |
| 微信 Skill（2026 新发布） | AI 大模型操控小程序底层链路 | 需小程序已上线 |
| 微信支付 AI 能力 | AI 版支付（2026年6月内测「阿宝」） | 企业主体 |
| 公众号 AI 接入 | 公众号自动回复、客服消息 | 个人订阅号/企业服务号 |

### 5.2 API/接口要点

- **微信对话开放平台**：
  - 域名：`chatbot.weixin.qq.com`；
  - 发消息接口：`https://chatbot.weixin.qq.com/openapi/sendmsg/{TOKEN}`；
  - 流程：创建会话机器人 → 获取 TOKEN 和配置信息 → 小程序客服组件扫码绑定 → 开启智能对话；
  - 两种接入：① 小程序客服组件绑定 ② 小程序插件接入。
- **微信 Skill（重要新能力）**：2026 年微信正式发布 Skill 官方开发文档，打通 AI 大模型与全量小程序底层链路，国内数百万小程序可被 AI 自主操控串联。这是燃渡AI 未来接入微信生态的关键入口。
- **微信「小微」AI 助手**：微信团队内测的原生 AI 助手，支持文字/语音操控微信原生功能（未正式上线）。
- **主体资质限制**：个人主体可注册但微信支付、客服消息接口需企业/个体工商户资质。**燃渡AI 若要全量接入微信生态，建议办理个体工商户营业执照。**

### 5.3 对燃渡AI的参考价值

| 能力 | 价值 | 落地建议 |
|------|------|---------|
| 微信对话开放平台 | ⭐⭐⭐ | 可做燃渡AI 公众号智能客服，但能力弱于自建豆包 |
| 小程序 Skill | ⭐⭐⭐⭐⭐ | 战略级入口，燃渡AI 可作为 Skill 提供方被微信 AI 调用 |
| 公众号接入 | ⭐⭐⭐⭐ | 配合内容营销（燃渡学院文章自动推送） |
| 小程序客服 | ⭐⭐⭐ | 售后咨询入口 |
| 微信支付 AI | ⭐⭐ | 远期，等「阿宝」成熟 |
| 企业微信机器人 | ⭐⭐⭐ | B 端学员群运营 |

### 5.4 硬件要求

- 微信 AI 接入仅需 HTTPS 回调接口，**2核4G 完全够用**；
- 公众号/小程序回调需备案域名（燃渡AI 域名 randuai.cn 备案中）。

### 5.5 成本分析

- 微信对话开放平台：免费；
- 小程序注册：个人免费，企业 300 元/年认证费；
- 公众号认证：300 元/年；
- Skill 接入：暂无收费信息；
- 个体工商户营业执照办理：约 0~500 元（代办）。

---

## 六、竞品功能对标

### 6.1 Coze 海外版 vs 国内版

| 维度 | 国内版 coze.cn（扣子） | 海外版 coze.com |
|------|----------------------|----------------|
| 母公司 | 字节跳动 | 字节跳动 |
| 模型 | 豆包、智谱等国内模型 | GPT-4、GPT-3.5、Claude |
| 计费 | 个人版免费（积分制），专业版按积分 | 免费（烧钱获客阶段） |
| 合规 | 符合国内监管 | 不对国内开放 |
| 工作流 | 低代码工作流 + AI 编程 | 同 |
| Bot Store | 探索商店 + 模板商店 + 插件商店 + 作品社区 | 商店更活跃 |
| API | PAT / OAuth | 同 |

**对燃渡AI 的启示**：
1. 国内合规模型（豆包）路线正确，无需追求 GPT-4；
2. Coze 海外版免费策略不可持续，燃渡AI 应走「火山方舟低价 API + 增值工作流」差异化路线；
3. 国内版「探索商店」设计成熟，燃渡AI「工作流市场」可对标其分类、评分、收藏机制。

### 6.2 Dify 开源版 vs 商业版

| 维度 | 开源版（自部署） | 商业版（Cloud/Sandbox） |
|------|----------------|----------------------|
| 价格 | 免费（Apache 2.0） | 按席位/用量付费 |
| 自定义 Python 插件 | ✅ 完全支持 | ❌ 云版受限 |
| 工作流 | ✅ 完整 | ✅（部分高级节点付费） |
| Agent | ✅ | ✅ |
| 插件市场 Marketplace | ✅（社区生态） | ✅ |
| 部署 | 自带 Docker，需自备服务器 | 一键开通 |
| 企业级功能（SSO/审计） | ❌ | ✅ |

**对燃渡AI 的启示**：
1. Dify 开源模式证明「自部署 + 模型 API 转售」可行，燃渡AI 与 Dify 是竞品关系（同样卖 API + 工作流）；
2. Dify 的差异化在「开源可自部署」，燃渡AI 的差异化应在「面向小白 + 扣子生态 + 微信入口」；
3. Dify Marketplace 设计可参考：插件/工作流/Skill 三层市场。

### 6.3 Bot Store / 工作流市场设计对标

| 平台 | 市场名称 | 内容 | 变现 |
|------|---------|------|------|
| Coze 国内版 | 探索商店 + 模板商店 + 插件商店 + 作品社区 | Bot/工作流/插件/模板 | 创作者激励 |
| Dify | Marketplace | 插件/工具/Skill | 免费 + 付费 |
| GPTs（OpenAI） | GPT Store | GPT 应用 | 分成 |
| 燃渡AI（规划） | 工作流市场 | 工作流（学员/开发者上传） | 待定 |

**燃渡AI 工作流市场建议设计**：
1. 三层结构：① 官方工作流（燃渡出品）② 学员工作流（API Key 用户上传）③ 插件（火山方舟能力封装）；
2. 元数据：标题、描述、分类、封面图、输入 schema、价格（点数）、作者、评分、使用次数；
3. 收入分成：作者 70% / 平台 30%（参考 App Store）；
4. 数据库已具备：`prisma/schema.prisma` 的 Workflow 表 + admin/workflows 管理后台已就绪。

---

## 七、综合建议

### 7.1 当前硬件（2核4G 阿里云 ECS）能支持的功能

✅ **完全可支持**：
- Next.js 全栈应用（前端 + API Routes）；
- PostgreSQL 数据库（中小规模，DAU < 500）；
- 火山方舟 API 转发（对话/生图/视频）；
- 扣子插件对接 + 工作流 API 调用；
- 用户系统 + API Key 管理 + 支付宝支付；
- 文件上传（服务端中转，小流量场景）；
- Admin 后台 + 数据统计。

⚠️ **可支持但需优化**：
- 视频生成任务轮询（需控制并发 < 10，启用指数退避）；
- 高并发对话（需加 Redis 缓存或限流，否则数据库连接耗尽）；
- 大文件上传（建议改 STS 直传）。

❌ **不支持**：
- 本地运行大模型（无 GPU）；
- 高并发视频转码（无算力）；
- 同时承载 PostgreSQL + Redis + ES（内存不足）。

### 7.2 需要升级硬件的功能及建议配置

| 触发条件 | 建议配置 | 增量成本 | 升级理由 |
|---------|---------|---------|---------|
| DAU > 500 或并发对话 > 50 | 4核8G（u1） | +400元/年 | PostgreSQL 内存需求 + API 并发 |
| 同时在线视频任务 > 10 | 4核8G + 火山方舟提升并发配额 | +400元/年 | 轮询连接数 |
| 接入扣子工作流市场 + RAG 知识库 | 8核16G | +1500元/年 | 知识库索引 + 工作流编排 |
| DAU > 5000 或多机部署 | 4核8G × N + SLB + ESS | +3000元/年 | 水平扩展 |
| 本地推理（不推荐） | GPU 实例（A10 起步） | +5000元/月 | 用云 GPU 不如调 API |

**结论**：当前 2核4G 至少可支撑到 DAU 500，**不必急于升级**。优先做架构优化（STS 直传、Webhook 回调、Redis 缓存），再考虑升配。

### 7.3 新增功能优先级排序

按「价值 / 成本比」排序，建议燃渡AI 按以下顺序推进：

#### P0（立即做，1~2 周，零硬件投入）
1. **OSS STS 临时凭证直传**：替换服务端中转上传，释放 ECS 带宽和内存。落地：`src/lib/oss.ts` 增加 `assumeRole` 接口，前端 `ImageUploader.tsx` 改直传。
2. **火山方舟错误码 + 退避重试**：`src/lib/volcengine.ts` 补 429/5xx 自动重试，避免单次失败影响用户体验。
3. **安全组端口收敛**：3000 端口仅限内网，备案后只放 80/443。

#### P1（1 个月内，低成本）
4. **火山方舟 Webhook 回调**：替代视频任务轮询，`/api/external/webhook/volcengine` 路由已存在，补全签名校验逻辑。
5. **OSS 图片处理 + 生命周期**：用户头像/工作流封面用 `x-oss-process` 生成缩略图；视频结果 30 天后转低频存储。
6. **云监控告警**：CPU>80% / 磁盘>90% / 内存>85% 触发短信，配合 `scripts/monitor.sh`。
7. **工作流版本管理 + 执行日志**：对标扣子，`prisma/schema.prisma` 已有基础，补版本号字段。

#### P2（1~3 个月，中等投入）
8. **扣子工作流 API 集成**：燃渡AI 反向调用用户扣子工作流，PAT 管理 + OAuth 授权。
9. **燃渡AI 工作流市场**：三层结构（官方/学员/插件），收入分成，对标 Coze 探索商店。
10. **火山方舟知识库 RAG**：燃渡学院文档问答，无需自建向量库。
11. **OSS CDN 加速**：备案完成后绑定 randuai.cn，图片/视频走 CDN。

#### P3（3~6 个月，战略级）
12. **微信 Skill 接入**：燃渡AI 作为 Skill 提供方被微信 AI 调用（需等 Skill 文档成熟）。
13. **公众号 + 小程序客服**：办理个体工商户资质，接入微信对话开放平台。
14. **MCP Server**：燃渡AI 暴露 MCP 接口，被 Claude/Trae 等客户端调用。
15. **弹性伸缩 ESS + SLB**：DAU>1000 后多机部署。

#### P4（远期，DAU>5000）
16. 升级 8核16G + Redis 缓存 + 独立 PostgreSQL 实例（RDS）。
17. 工作流引擎自研（摆脱对扣子的依赖）。

---

## 参考文档链接

### 火山方舟
- API 列表（知识库）：https://www.volcengine.com/docs/82379/1511946
- Python SDK：https://www.volcengine.com/docs/82379/1273552
- 错误码：https://www.volcengine.com/docs/82379/1299023
- 创建视频生成任务：https://www.volcengine.com/docs/82379/1520757
- Seedance 1.0 pro 定价：https://www.volcengine.com/docs/82379/1587798
- SDK V1/V2 下线公告：https://www.volcengine.com/docs/82379/1355331

### 阿里云 ECS
- ECS 实例规格选型：https://developer.aliyun.com/article/1743650
- 全生命周期运维（安全组/监控/ESS）：https://developer.aliyun.com/article/1744004
- 2核4G 升级 4核8G 实操：https://developer.aliyun.com/article/1743601
- 阈值告警运维任务：https://help.aliyun.com/zh/oos/getting-started/create-an-alert-o-and-m-task

### 阿里云 OSS
- STS 临时凭证访问 OSS：https://help.aliyun.com/zh/oss/developer-reference/use-temporary-access-credentials-provided-by-sts-to-access-oss
- OSS 收费标准：https://developer.aliyun.com/article/1688156
- 2025 OSS 收费标准：https://www.axiaoyun.com/oss/aliyunoss2025.html

### 扣子 Coze
- 文档中心：https://www.coze.cn/open/docs/guides
- 工作流概述：https://www.coze.cn/open/docs/guides/workflow
- 节点类型目录：https://www.coze.cn/open/docs/guides/workflow_node_types
- 插件开发示例：https://www.coze.cn/open/docs/guides/plugin_example
- Node.js SDK 概述：https://loop.coze.cn/open/docs/developer_guides/nodejs_overview

### 微信 AI
- 微信对话开放平台：https://chatbot.weixin.qq.com
- 微信开放平台：https://open.weixin.qq.com
- Skill 官方文档（2026 发布）

### 竞品对标
- Coze 国内版：https://www.coze.cn
- Coze 海外版：https://www.coze.com
- Dify 开源版：https://github.com/langgenius/dify
- Dify vs Coze 对比：https://blog.csdn.net/jennycisp/article/details/150020358

---

## 附录：燃渡AI 现状与文档对照

| 文档研究项 | 燃渡AI 现状 | 差距 | 行动 |
|-----------|-----------|------|------|
| 火山方舟 API Key Bearer | ✅ 已用 `VOLC_ARK_API_KEY` | 无 | — |
| 火山方舟 OpenAI 兼容协议 | ✅ 已用 V3 | 无 | — |
| 火山方舟异步任务 | ✅ 已用于视频 | 未用 Webhook | P1 补 Webhook |
| 火山方舟错误码退避 | ❌ 仅基础 throw | 缺重试 | P0 补 |
| 火山方舟知识库 RAG | ❌ 未接入 | 全新 | P2 接入 |
| ECS 安全组 | ⚠️ 3000 暴露 | 需收敛 | P0 |
| ECS 云监控告警 | ⚠️ 有 monitor.sh | 未接 CMS | P1 |
| OSS STS 直传 | ❌ 服务端中转 | 全改 | P0 |
| OSS 图片处理 | ❌ 未用 x-oss-process | 全新 | P1 |
| OSS 生命周期 | ❌ 未配置 | 全新 | P1 |
| 扣子工作流 API | ✅ 插件侧已通 | 工作流侧未反调 | P2 |
| 扣子节点范式 | ⚠️ 自有工作流 | 可对标节点分类 | P1 |
| 微信对话开放平台 | ❌ 未接入 | 备案后 | P3 |
| 微信 Skill | ❌ 未接入 | 等 Skill 成熟 | P3 |
| 工作流市场 | ⚠️ DB 已就绪 | 缺前端 + 分成 | P2 |

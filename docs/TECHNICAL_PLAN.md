# 燃渡AI 平台技术方案 v1.0

> 最后更新：2026年6月26日
> 状态：待确认后开始执行
> 负责人：陆总（业务决策）+ 舟（技术实现）

---

## 一、项目定位（双轨制）

```
模式A：直接使用模式（保留现有）
  普通用户 → 你的网站 → 直接调用工具（上传图片→生成视频/文案）
  适合：不会搭Coze的小白用户

模式B：API Key 平台模式（新增）
  学员/开发者 → 你的网站买Key → 去Coze搭工作流 → 工作流调你的插件 → 你的插件调火山方舟
  适合：会搭Coze的学员、B端商家
```

## 二、技术栈（延续现有）

| 层级 | 技术选型 | 说明 |
|------|---------|------|
| 前端 | Next.js 16 + TypeScript + Tailwind CSS v4 | 已有基础 |
| 后端 API | Next.js API Routes（复用） | 不引入新语言 |
| 数据库 | PostgreSQL + Prisma 6 | 已部署 |
| 部署 | Docker + 阿里云服务器（2核4G，成都） | 已就绪 |
| AI 算力 | 火山方舟 API | 豆包+Seedream+Seedance |
| 文件存储 | 阿里云 OSS | 已配置 |
| 支付 | 支付宝 | Phase 2 接入 |
| 鉴权 | JWT + 角色控制 | 复用现有 |

## 三、硬件条件

- 阿里云服务器：2核4G，50G ESSD，成都地域
- OSS 对象存储：免费版，randu-ai Bucket
- 域名：randuai.cn（火山引擎注册，备案中）
- 目前通过 IP:3000 访问，备案后绑定域名

---

## 四、数据库设计（核心）

### 4.1 User 表（扩展现有）

```
User
├── id              String   @id @default(uuid())
├── email           String?  @unique
├── phone           String?  @unique               ← 注册时校验11位手机号
├── passwordHash    String
├── role            String   @default("user")    ← 三级：user | admin | super_admin
├── nickname        String?            ← 新增：昵称（用户自定义）
├── avatar          String?            ← 新增：头像URL（存OSS）
├── status          String   @default("active")  ← 新增：active | blocked（拉黑状态）
├── trialExpiresAt  DateTime
├── isSubscribed    Boolean  @default(false)
├── subscriptionPlan String?
├── credits         Int      @default(0)         ← 新增：剩余点数
├── totalUsed       Int      @default(0)         ← 新增：累计使用次数
├── createdAt       DateTime @default(now())
├── updatedAt       DateTime @updatedAt         ← 新增
├── usageLogs       UsageLog[]
├── apiKeys         ApiKey[]                    ← 新增关联
└── orders          Order[]                      ← 新增关联
```

**权限分级（三级角色）：**

| 角色 | 前台访问 | 后台查看 | 内容管理 | 敏感操作（改余额/套餐/拉黑） |
|------|---------|---------|---------|------------------------|
| user | ✓ | ✗ | ✗ | ✗ |
| admin | ✓ | ✓ | ✓（工作流CRUD） | ✗ |
| super_admin | ✓ | ✓ | ✓ | ✓（仅1个账号，你的账号） |

**手机号校验规则：**
- 必须为11位数字
- 以1开头，第二位为3-9（符合国内手机号规范）
- 正则：`/^1[3-9]\d{9}$/`

### 4.2 ApiKey 表（新增 - Key 管理）

```
ApiKey
├── id              String   @id @default(uuid())
├── userId          String                        ← 所属用户
├── keyPrefix       String                         ← Key前缀（blaze_xxxx 的前8位，用于显示）
├── keyHash         String   @unique               ← Key的哈希值（不存明文）
├── name            String                         ← Key名称（用户自定义，如"测试Key"）
├── status          String   @default("active")    ← active | inactive | revoked
├── creditsUsed     Int      @default(0)           ← 该Key累计消耗点数
├── totalCalls      Int      @default(0)           ← 该Key累计调用次数
├── lastUsedAt      DateTime?                      ← 最后使用时间
├── expiresAt       DateTime?                      ← 过期时间（null=永不过期）
├── createdAt       DateTime @default(now())
├── user            User     @relation(...)
└── callLogs        CallLog[]
```

**Key 生成规则：** `blaze_` + 32位随机字符串（存哈希，不存明文）

### 4.3 Workflow 表（扩展 - 动态参数）

```
Workflow
├── id              String   @id @default(uuid())
├── name            String
├── description     String?
├── category        String                         ← 分类
├── cozeWorkflowId  String                         ← Coze工作流ID
├── coverImage      String?            ← 新增：封面图URL
├── inputSchema     Json               ← 新增：参数定义（JSON）
├── outputType      String   @default("text")  ← 新增：text | image | video
├── creditsRequired Int      @default(1)       ← 新增：消耗点数
├── source          String   @default("coze")  ← 新增：coze | volcengine
├── volcModel       String?               ← 新增：火山模型ID（source=volcengine时用）
├── icon            String?
├── status          String   @default("active")
├── isDeleted       Boolean  @default(false)  ← 新增：软删除
├── feishuDocUrl    String?
├── sortOrder       Int      @default(0)
├── createdAt       DateTime @default(now())
├── updatedAt       DateTime @updatedAt
└── usageLogs       UsageLog[]
```

**inputSchema 示例：**
```json
{
  "fields": [
    {
      "name": "yuansitu",
      "label": "原图",
      "type": "image",
      "required": true,
      "placeholder": "请上传服装原图",
      "defaultValue": null
    },
    {
      "name": "style",
      "label": "风格",
      "type": "select",
      "required": false,
      "options": ["商务", "休闲", "运动"],
      "defaultValue": "商务"
    }
  ]
}
```

### 4.4 CallLog 表（新增 - API调用日志）

```
CallLog
├── id              String   @id @default(uuid())
├── apiKeyId        String                         ← 调用的Key
├── userId          String                         ← 所属用户（冗余，便于查询）
├── workflowId      String?                         ← 调用的工作流（可为空）
├── endpoint        String                         ← 调用的接口路径
├── method          String                         ← HTTP方法
├── creditsCost     Int      @default(0)            ← 本次消耗点数
├── status          String   @default("success")   ← success | failed
├── errorMessage    String?                        ← 失败原因
├── responseTime    Int?                           ← 响应耗时(ms)
├── clientIp        String?                        ← 调用方IP
├── createdAt       DateTime @default(now())
├── apiKey          ApiKey   @relation(...)
```

### 4.5 Order 表（新增 - 订单/充值）

```
Order
├── id              String   @id @default(uuid())
├── orderNo         String   @unique               ← 订单号（randu_xxxxx）
├── userId          String                         ← 下单用户
├── type            String                         ← subscription | credits
│                                                   订阅套餐 | 充值点数
├── planId          String?                        ← 套餐ID（type=subscription）
├── credits         Int      @default(0)            ← 购买的点数（type=credits）
├── amount          Decimal  @db.Decimal(10,2)     ← 金额
├── status          String   @default("pending")   ← pending | paid | failed | refunded
├── paymentMethod   String?                        ← alipay | wechat
├── paymentId       String?                        ← 支付宝流水号
├── paidAt          DateTime?                      ← 支付时间
├── createdAt       DateTime @default(now())
├── user            User     @relation(...)
```

### 4.6 UsageLog 表（扩展现有）

新增字段记录点数消耗和缩略图：

```
UsageLog（扩展）
├── ...现有字段...
├── creditsCost     Int      @default(0)      ← 新增：本次消耗点数
├── source          String   @default("direct") ← 新增：direct | api
├── thumbnail       String?            ← 新增：输出缩略图URL（列表展示用）
│                                                    直接使用 | API调用
```

### 4.7 Conversation 表（新增 - 智能体对话）

```
Conversation
├── id              String   @id @default(uuid())
├── userId          String                         ← 所属用户
├── title           String                         ← 会话标题（取首条消息前20字）
├── model           String                         ← 默认使用的模型
├── lastMessageAt   DateTime?                      ← 最后消息时间
├── createdAt       DateTime @default(now())
├── updatedAt       DateTime @updatedAt
├── user            User     @relation(...)
└── messages        Message[]
```

### 4.8 Message 表（新增 - 对话消息）

```
Message
├── id              String   @id @default(uuid())
├── conversationId  String                         ← 所属会话
├── role            String                         ← user | assistant
├── content         String                         ← 文本内容
├── attachments     Json?          ← 附件URL数组（如参考图片）
├── modelUsed       String?                        ← 实际使用的模型
├── tokensUsed      Int      @default(0)           ← 消耗token
├── creditsCost     Int      @default(0)            ← 消耗点数
├── createdAt       DateTime @default(now())
├── conversation    Conversation @relation(...)
```

### 4.9 Notification 表（新增 - 站内通知）

```
Notification
├── id              String   @id @default(uuid())
├── userId          String                         ← 接收用户
├── type            String                         ← task_complete | system | announcement
├── title           String                         ← 通知标题
├── content         String?                        ← 通知内容
├── link            String?                        ← 点击跳转的URL
├── isRead          Boolean  @default(false)        ← 是否已读
├── createdAt       DateTime @default(now())
├── user            User     @relation(...)
```

### 4.10 ActionLog 表（新增 - 敏感操作日志）

```
ActionLog
├── id              String   @id @default(uuid())
├── operatorId      String                         ← 操作者ID（super_admin）
├── targetUserId    String?                        ← 被操作的用户ID
├── action          String                         ← block | unblock | update_credits | update_plan | set_role
├── detail          Json?                          ← 操作详情（改前/改后值）
├── ipAddress       String?                        ← 操作IP
├── createdAt       DateTime @default(now())
├── operator        User     @relation(...)
```

---

## 五、API 接口完整清单

### 5.1 前台 API（用户直接使用，复用现有 + 扩展）

| 方法 | 路径 | 功能 | 鉴权 |
|------|------|------|------|
| POST | /api/auth/register | 注册（手机号校验11位） | 公开 |
| POST | /api/auth/login | 登录（支持邮箱/手机号） | 公开 |
| GET | /api/user/profile | 获取个人信息 | user |
| PATCH | /api/user/profile | 修改昵称 | user |
| POST | /api/user/avatar | 上传/更新头像 | user |
| GET | /api/user/usage | 用量统计 | user |
| GET | /api/workflow/list | 工作流列表 | 公开 |
| GET | /api/workflow/[id] | 工作流详情 | 公开 |
| POST | /api/workflow/[id]/run | 运行工作流 | user |
| GET | /api/task/[id]/status | 任务状态 | user |
| POST | /api/upload | 上传文件 | user |

### 5.2 Key 管理 API（新增）

| 方法 | 路径 | 功能 | 鉴权 |
|------|------|------|------|
| GET | /api/keys | 我的Key列表 | user |
| POST | /api/keys | 生成新Key | user |
| DELETE | /api/keys/[id] | 删除/吊销Key | user |
| PATCH | /api/keys/[id] | 重置Key | user |
| GET | /api/keys/[id]/logs | Key调用日志 | user |

### 5.3 历史/通知 API（新增）

| 方法 | 路径 | 功能 | 鉴权 |
|------|------|------|------|
| GET | /api/history | 工作流使用历史（分页+筛选） | user |
| GET | /api/history/[id] | 历史详情（输入+输出） | user |
| DELETE | /api/history/[id] | 删除历史记录 | user |
| GET | /api/notifications | 站内通知列表 | user |
| PATCH | /api/notifications/[id] | 标记已读 | user |
| PATCH | /api/notifications | 全部标记已读 | user |
| GET | /api/notifications/unread-count | 未读数量（导航栏红点） | user |

### 5.4 智能体对话 API（新增 - Phase 2）

**智能路由设计：**
用户无需手动选择模型，后端自动判断意图：
- 检测到"画/图片/生成图" → 自动调用 Seedream 生图
- 检测到"视频/动起来" → 自动调用 Seedance 视频
- 其他 → 豆包文本对话

**上下文记忆：**
- 自动记录当前会话所有消息
- 超过模型上限自动截断最早的
- 用户删除对话即清空，不提供上下文设置

**计费展示策略：**
- 对话中不显示预估消耗/本次消耗/token数
- 仅在导航栏头像旁显示当前积分余额
- 余额不足时弹窗提示"积分余额不足，请充值"
- 个人中心→消耗记录可查看每项功能消耗明细

| 方法 | 路径 | 功能 | 鉴权 |
|------|------|------|------|
| GET | /api/chat/conversations | 会话列表 | user |
| POST | /api/chat/conversations | 新建会话 | user |
| DELETE | /api/chat/conversations/[id] | 删除会话 | user |
| GET | /api/chat/conversations/[id] | 会话消息历史 | user |
| POST | /api/chat/conversations/[id]/messages | 发送消息（流式响应+智能路由） | user |
| POST | /api/chat/transcribe | 语音转文字 | user |

### 5.5 对外 API（Coze 插件调用，新增）

这是 Coze 插件请求的接口，通过 API Key 鉴权（不是 JWT）。

| 方法 | 路径 | 功能 | 鉴权 |
|------|------|------|------|
| GET | /api/external/key/verify | 验证Key有效性 | apiKey |
| POST | /api/external/generate/copy | AI文案生成 | apiKey |
| POST | /api/external/generate/image | AI生图 | apiKey |
| POST | /api/external/generate/video | 视频生成 | apiKey |
| GET | /api/external/user/usage | 查询用量 | apiKey |

**对外API统一处理流程：**
```
1. 提取请求头 X-API-Key
2. 哈希后查找 ApiKey 表
3. 验证状态（active）+ 是否过期
4. 查用户余额是否充足
5. 调用火山方舟/Coze工作流
6. 成功后扣点数 + 写CallLog
7. 返回结果
```

### 5.6 后台管理 API（新增，分权限）

**普通管理（admin 及以上）：**

| 方法 | 路径 | 功能 | 鉴权 |
|------|------|------|------|
| GET | /api/admin/dashboard | 平台状态概览（用户数/使用量/在线数） | admin |
| GET | /api/admin/users | 用户列表（分页+搜索） | admin |
| GET | /api/admin/workflows | 工作流列表（含下架） | admin |
| POST | /api/admin/workflows | 创建工作流 | admin |
| PATCH | /api/admin/workflows/[id] | 修改工作流 | admin |
| DELETE | /api/admin/workflows/[id] | 删除工作流（软删除） | admin |
| POST | /api/admin/workflows/[id]/cover | 上传封面图 | admin |
| GET | /api/admin/orders | 订单列表 | admin |
| GET | /api/admin/keys | 所有Key列表 | admin |

**敏感操作（仅 super_admin）：**

| 方法 | 路径 | 功能 | 鉴权 |
|------|------|------|------|
| PATCH | /api/admin/users/[id] | 修改用户资料 | super_admin |
| PATCH | /api/admin/users/[id]/status | 拉黑/解封用户 | super_admin |
| PATCH | /api/admin/users/[id]/plan | 修改用户套餐 | super_admin |
| PATCH | /api/admin/users/[id]/credits | 修改用户余额（加减点数） | super_admin |
| PATCH | /api/admin/users/[id]/role | 设置管理员角色 | super_admin |

**敏感操作日志记录：** 所有 super_admin 的操作都会写入操作日志（ActionLog），记录操作者、被操作对象、操作内容、时间，便于追溯。

### 5.7 在线人数统计方案

**方案：心跳上报 + 内存计数（无需 Redis）**

```
前端（已登录用户）：
  每30秒调用一次 /api/heartbeat
    ↓
后端：
  维护一个内存 Map<userId, lastSeenAt>
  统计最近 2 分钟内有过心跳的用户数为"在线人数"
  每分钟清理过期记录（超过2分钟未心跳的移除）
```

| 方法 | 路径 | 功能 | 鉴权 |
|------|------|------|------|
| POST | /api/heartbeat | 心跳上报（更新在线状态） | user |
| GET | /api/admin/stats/online | 当前在线人数 | admin |

**注意：** 容器重启后在线数会清零（内存方案），可接受。规模化后可升级为 Redis。

---

## 六、前端页面清单

### 6.1 前台页面（用户看到的）

| 路径 | 功能 | 状态 |
|------|------|------|
| / | 首页（工具展示+定价） | 已有，需调整 |
| /login | 登录 | 已有 |
| /register | 注册（手机号校验） | 已有，需加强校验 |
| /workspace | 工作台 | 已有 |
| /workflow/[id] | 工作流使用页 | 已有，需动态表单 |
| /chat | 智能体对话（类豆包，多模态） | 新增（Phase 2） |
| /dashboard | 个人中心 | 已有，需扩展 |
| /dashboard/profile | 资料设置（昵称+头像） | 新增 |
| /dashboard/keys | 我的Key管理 | 新增 |
| /dashboard/history | 工作流使用历史（含下载） | 新增 |
| /dashboard/usage | 用量明细 | 新增 |
| /dashboard/orders | 订单/充值记录 | 新增 |
| /dashboard/notifications | 站内通知 | 新增 |
| /pricing | 定价页 | 已有 |
| /docs | 教程文档中心（跳转飞书） | 新增 |
| /courses | 课程入口（预留） | 新增（占位页） |

### 6.2 后台管理页面

**普通管理页面（admin 及以上可见）：**

| 路径 | 功能 |
|------|------|
| /admin | 后台首页（数据概览：用户数/使用量/在线人数） |
| /admin/workflows | 工作流管理（CRUD + 封面上传） |
| /admin/workflows/new | 新建工作流（表单+参数定义器） |
| /admin/workflows/[id]/edit | 编辑工作流 |
| /admin/orders | 订单管理 |
| /admin/keys | Key总览 |

**用户管理页面（admin 可查看，敏感操作仅 super_admin）：**

| 路径 | 功能 | 权限 |
|------|------|------|
| /admin/users | 用户列表（分页+搜索） | admin 可查看 |
| /admin/users/[id] | 用户详情（资料+用量+订单+Key） | admin 可查看 |
| /admin/users/[id]/edit | 编辑用户（拉黑/套餐/余额） | super_admin 才能改 |

**后台 UI 权限控制示例：**
```
admin 登录后台 → 看到用户列表 → 点击某用户 → 查看详情
  ├── 资料/用量/订单：可看
  ├── "拉黑"按钮：灰色禁用（仅超级管理员可操作）
  ├── "修改余额"按钮：灰色禁用
  └── "修改套餐"按钮：灰色禁用

super_admin 登录后台 → 同样页面 → 所有按钮可用
```

### 6.3 前台导航调整

```
导航栏（已有）
├── 首页
├── 工作台
├── 智能体（新增，Phase 2）
├── 定价
├── 课程入口（新增，普通用户可见）
└── 右侧用户菜单
    ├── [🔔通知] [头像] [昵称 ▼] [128 点]  ← 余额实时显示
    │                              ↑
    │                    仅显示余额，不显示消耗
    │
    ├── 个人中心
    │   ├── 资料设置
    │   ├── 我的Key（仅登录后可见）
    │   ├── 消耗记录（新增：查看每项功能消耗明细）
    │   ├── 工作流历史
    │   ├── 我的订单
    │   └── 站内通知
    └── 后台管理（新增，仅 admin 可见）
```

**余额不足时的交互：**
- 用户使用任何功能时，余额不足 → 弹窗提示"积分余额不足，请充值"
- 弹窗含"去充值"按钮 → 跳转定价页

**消耗记录页（/dashboard/usage）设计：**
```
个人中心 → 消耗记录
┌──────────────────────────────────────────┐
│ 本月消耗：320 点   |   累计消耗：1280 点 │
├──────────────────────────────────────────┤
│ 筛选：[全部 ▼] [本月 ▼]                  │
├──────────────────────────────────────────┤
│ 时间          功能           消耗         │
│ 06-26 10:30  智能体对话      -5 点        │
│ 06-26 10:25  AI生图          -15 点       │
│ 06-26 10:20  工作流-视频生成  -100 点     │
│ 06-25 15:00  充值            +500 点     │
│ 06-25 14:30  智能体对话      -3 点        │
└──────────────────────────────────────────┘
```

---

## 七、火山方舟对接方案

### 7.1 模型选择

| 能力 | 火山方舟模型 | 调用方式 | 成本预估 |
|------|-------------|----------|----------|
| 文案生成 | 豆包大模型（doubao-pro） | 文本对话API | 约0.005元/千token |
| AI生图 | Seedream（doubao-seedream） | 文生图API | 约0.1元/张 |
| 视频生成 | Seedance（doubao-seedance） | 文生视频/图生视频 | 约1-2元/次 |

### 7.2 对接架构

```
对外API（/api/external/generate/copy）
  ↓
  验证Key + 扣点数
  ↓
  调用 src/lib/volcengine.ts（新增）
  ↓
  根据 workflow.volcModel 选择模型
  ↓
  调用火山方舟 API
  ↓
  返回结果
```

### 7.3 环境变量（新增）

```
VOLC_ACCESS_KEY=火山引擎AccessKey
VOLC_SECRET_KEY=火山引擎SecretKey
VOLC_MODEL_DOUBAO=模型ID（豆包）
VOLC_MODEL_SEEDREAM=模型ID（生图）
VOLC_MODEL_SEEDANCE=模型ID（视频）
```

### 7.4 开通步骤（你需要操作）

1. 登录火山引擎控制台
2. 进入"火山方舟"（ark.volcengine.com）
3. 开通以下模型：
   - 豆包大模型（文本对话）
   - Doubao Seedream（文生图）
   - Doubao Seedance（视频生成）
4. 获取 AccessKey / SecretKey
5. 记录各模型的 Endpoint ID（后续填入环境变量）

---

## 八、Coze 插件配置说明

### 8.1 插件创建步骤（你后续在Coze平台操作）

1. 进入 Coze 平台 → 个人主页 → 插件
2. 点击"创建插件" → 选择"通过API创建"
3. 填写插件信息：
   - 名称：燃渡AI工具
   - 描述：调用燃渡AI平台的AI能力
4. 添加工具（每个工具对应一个API）：

### 8.2 工具配置示例

**工具1：AI文案生成**

```
工具名称: generate_copy
接口地址: https://randuai.cn/api/external/generate/copy
请求方式: POST

Header参数:
  X-API-Key: {{用户填入的Key}}

Body参数:
  {
    "prompt": "文本输入参数",
    "style": "风格选择"
  }

输出: 文本
```

### 8.3 OpenAPI Schema（供Coze导入）

我会生成标准的 OpenAPI 3.0 文档，你在 Coze 创建插件时直接导入，无需手动配置每个工具。

---

## 九、分阶段开发任务

### Phase 1：核心链路跑通（优先级最高）

**目标：** 用户系统完善 → 可以生成Key → 调用API → 返回结果

| 序号 | 任务 | 说明 |
|------|------|------|
| 1.1 | 数据库扩展 | 新增 ApiKey、CallLog、Order、Notification、ActionLog 表，扩展 User、Workflow、UsageLog 表 |
| 1.2 | 三级角色权限系统 | User.role 字段，requireAdmin/requireSuperAdmin 中间件 |
| 1.3 | 用户资料完善 | 昵称修改、头像上传（OSS）、手机号11位校验、登录支持邮箱/手机号 |
| 1.4 | Key 生成与验证 | 生成 blaze_xxx Key，一次性明文显示，哈希存储，验证中间件 |
| 1.5 | 对外API基础框架 | /api/external/* 路由，统一鉴权+计费+日志+错误码 |
| 1.6 | 火山方舟对接 | src/lib/volcengine.ts，豆包文本模型 |
| 1.7 | AI文案生成接口 | /api/external/generate/copy |
| 1.8 | AI生图接口 | /api/external/generate/image（Seedream） |
| 1.9 | 前端Key管理页 | /dashboard/keys 页面 |
| 1.10 | 前端资料设置页 | /dashboard/profile（昵称+头像） |
| 1.11 | 在线人数统计 | 心跳上报 + 内存计数 |
| 1.12 | 工作流后台运行 | 全局轮询 Provider，切页面不中断 |
| 1.13 | 站内通知系统 | 任务完成通知 + 导航栏红点 + 通知列表页 |
| 1.14 | 历史记录页 | /dashboard/history，列表+详情+下载+再次使用 |
| 1.15 | Coze插件配置文档 | OpenAPI Schema + 配置说明 |
| 1.16 | 数据库备份启用 | 配置 cron 定时任务 |

### Phase 2：后台管理 + 智能体 + 完善体验

| 序号 | 任务 | 说明 |
|------|------|------|
| 2.1 | 后台管理框架 | /admin 布局，权限控制（admin/super_admin 分级） |
| 2.2 | 后台数据概览 | 用户数/使用量/在线人数/收入 |
| 2.3 | 工作流管理 | 后台CRUD + 封面上传 + 参数定义器 |
| 2.4 | 前台动态表单 | 根据inputSchema自动生成表单 |
| 2.5 | 用户管理（查看） | 后台用户列表 + 详情查看 |
| 2.6 | 用户管理（敏感操作） | 拉黑/解封、改套餐、改余额、设置管理员（仅 super_admin） |
| 2.7 | 敏感操作日志 | ActionLog 记录所有 super_admin 操作 |
| 2.8 | 用量明细页 | 前台调用记录查看 |
| 2.9 | 智能体对话页面 | /chat 页面，多模态对话+语音输入+上下文记忆 |
| 2.10 | 教程文档中心 | /docs 页面，跳转飞书文档 |
| 2.11 | 公告系统 | 后台发公告，前台首页横幅 |
| 2.12 | 新用户引导 | 注册后引导流程 |
| 2.13 | 用户体验优化 | Toast通知、骨架屏、错误页面、移动端适配、暗色模式 |

### Phase 3：商业化完善

| 序号 | 任务 | 说明 |
|------|------|------|
| 3.1 | 支付宝接入 | 套餐购买 + 点数充值 |
| 3.2 | 订单管理 | 订单列表 + 状态流转 |
| 3.3 | 视频生成接口 | Seedance 对接（成本高，最后做） |
| 3.4 | 频率限制 | 单Key QPS限制 + 每日限额 |
| 3.5 | 课程入口 | 课程页面占位 + 跳转 |
| 3.6 | Webhook回调 | 长任务完成主动通知 |
| 3.7 | API文档自动生成 | Swagger页面 |
| 3.8 | 客户端SDK | Python/Node.js SDK |
| 3.9 | 数据导出 | 后台CSV导出 |
| 3.10 | SEO优化 | sitemap、robots、meta标签 |

---

## 十、风险与注意事项

| 风险 | 影响 | 应对 |
|------|------|------|
| 火山方舟成本 | 每次调用有真实成本 | 定价需覆盖成本+利润 |
| Key 泄露 | 被盗用扣费 | 支持一键吊销 + 调用频率限制 |
| 服务器并发 | 2核4G承受有限 | 初期无压力，规模化后升级 |
| Coze插件QPS限制 | 官方限50/秒 | 初期完全够用 |
| 数据安全 | 用户数据泄露 | Key哈希存储，密码加密 |

---

## 十一、智能体对话详细设计

### 11.1 设计理念

参考豆包APP体验，核心理念：**让用户像和人聊天一样使用AI**，不暴露技术细节。

```
传统做法（暴露技术）          豆包体验（隐藏技术）
─────────────────         ──────────────────
[选择模型：豆包 ▼]          无需选择，自动判断
[预估消耗：5点]             无需预估，直接使用
[上下文设置：10条]          无需设置，自动记忆
[本次消耗：3点]             无需展示，后台静默扣费
```

### 11.2 模型选择机制（三合一）

**核心原则：** 智能默认 + 手动选择 + 用户纠正，三者结合。

**输入框右侧模型选择器：**
```
[自动 ▼]
  ├── 自动（智能路由，推荐）
  ├── 豆包（文本对话）
  ├── Seedream（生图）
  └── Seedance（视频）
```

**三种场景的优先级：**

```
场景1：用户选"自动"（默认）
  → 智能路由判断意图 → 自动调用对应模型
  → 结果下方提示"使用了 XX 模型"

场景2：用户手动选了某模型
  → 尊重用户选择，强制用该模型
  → 模型不匹配时提示（如选豆包却输入"画图"→ 提示"如需生图请选自动或Seedream"）
  → 用户坚持则按选择执行

场景3：智能路由误判，用户纠正
  → 结果下方显示"这不是我想要的"按钮
  → 点击后弹出选项：
    - 我想要文本回答
    - 我想要生成图片
    - 我想要生成视频
  → 用正确意图重新生成
  → 系统记录纠正数据，优化后续判断
```

**智能路由实现（两级判断）：**
```
第一级：关键词快速筛选
  ├── "画/生成图/来一张图" → 疑似生图
  ├── "视频/动起来" → 疑似视频
  └── 其他 → 直接走文本（90%的请求）
  ↓
第二级：仅对疑似请求，用豆包确认意图
  ├── "用户是想生成图片，还是只是提到图片？"
  └── 返回确定的意图
  ↓
自动调用对应模型
  ↓
返回结果 + 后台记录"本次使用了XX模型"
```

**成本控制：** 只对疑似请求做二次确认，大部分请求直接走文本，多一次调用的成本可忽略。

**后续升级（Phase 3）：**
积累用户纠正数据，训练更精准的意图识别。

### 11.3 上下文记忆（全自动）

```
会话内所有消息自动带入下次请求
  ↓
超过模型上下文上限时
  ↓
自动截断最早的消息（保留最近N条）
  ↓
用户无感知，对话流畅如常
  ↓
用户删除对话 → 清空所有记忆
```

**不给用户任何上下文设置选项**，全自动管理。

### 11.4 计费展示策略

```
导航栏：[🔔] [头像] [128 点]
  ↓
仅显示当前余额，实时更新
  ↓
使用任何功能时：
  ✓ 不显示预估消耗
  ✓ 不显示本次消耗
  ✓ 不显示 token 数
  ✓ 不显示使用了哪个模型
  ↓
余额充足 → 正常使用，后台静默扣费
  ↓
余额不足 → 弹窗提示"积分余额不足，请充值"
         → [去充值] 按钮跳转定价页
  ↓
个人中心 → 消耗记录
  → 可查看每项功能的消耗明细
  → 可按时间/功能筛选
  → 可看本月/累计消耗统计
```

### 11.5 消息存储设计

```
Message 表扩展
├── content          文本内容
├── attachments      附件（图片/视频URL）
├── modelUsed        实际使用的模型（用户不可见，仅记录）
├── tokensUsed       消耗的token数（用户不可见，仅记录）
├── creditsCost      消耗点数（用户不可见，仅记录）
└── isHidden         是否对用户隐藏（系统消息用）

用户视角：只看到消息内容（文本/图片/视频）
管理员视角：可查看每条消息的模型、token、消耗
```

### 11.6 输入交互细节

```
输入框区域：
┌─────────────────────────────────────────────────┐
│ [📎上传] [🎤语音]   输入消息...          [发送]  │
│                                                  │
│ 快捷模板（点击直接填入输入框）：                  │
│ [写文案] [翻译] [总结] [生图] [代码]              │
└─────────────────────────────────────────────────┘

- Enter 发送，Shift+Enter 换行
- 输入"画一只猫" → 自动调用生图，无需切换
- 上传图片后输入"这是什么" → 自动用视觉理解
- 点击语音 → 实时转文字，可编辑后发送
- 草稿自动保存（切换会话不丢内容）
```

### 11.7 消息展示

```
用户消息（右对齐，浅色气泡）
  - 纯文本
  - 或文本+图片附件

助手消息（左对齐，白色气泡）
  - 文本：Markdown 渲染（代码块、表格、列表）
  - 图片：内嵌展示 + 点击放大 + 下载
  - 视频：内嵌播放器 + 下载
  - 错误：友好提示 + 重试按钮

底部操作（hover显示）：
  - 复制
  - 重新生成（会用相同输入再跑一次）
  - 删除
```

### 11.8 流式输出

```
用户发送 → 立即显示空助手气泡 + "正在输入..."
  ↓
后端流式返回（SSE）
  ↓
前端逐字追加到气泡（打字机效果）
  ↓
完成 → 存数据库 + 静默扣费
  ↓
显示"停止"按钮可中断生成
```

### 11.9 开发分阶段

| 阶段 | 功能 | 优先级 |
|------|------|--------|
| 2.9a | 基础对话（文本+流式+智能路由+静默扣费） | 核心 |
| 2.9b | 图片生成（生图意图→Seedream） | 重要 |
| 2.9c | 语音输入 + 文件上传 | 增强 |
| 2.9d | 快捷模板 + 消息操作 | 体验 |

---

## 十二、硬件适配优化（2核4G 服务器）

### 12.1 内存配额分配

```
总内存：4GB
├── 系统 + Docker 守护进程：0.5GB
├── PostgreSQL 容器：1.5GB
│   └── shared_buffers = 512MB
├── Next.js 应用容器：1.5GB
│   └── NODE_OPTIONS=--max-old-space-size=1400
└── 缓冲：0.5GB
```

**实现：** docker-compose.yml 中为 db 和 app 设置 memory_limits，防 OOM 互相影响。

### 12.2 数据库连接池

```
PostgreSQL max_connections = 100
  ↓
实际可承受并发：20-30
  ↓
Prisma 配置：
  connection_limit = 5
  pool_timeout = 10
```

**实现：** DATABASE_URL 拼接 `?connection_limit=5&pool_timeout=10`。

### 12.3 静态资源走 OSS CDN

```
- 用户上传图片 → 直传 OSS（不经服务器中转）
- 前端展示 → 用 OSS CDN 域名
- 视频生成结果 → Coze 返回的 URL 直接给前端
- 服务器只处理：API 逻辑、数据库读写、少量文本
```

### 12.4 磁盘清理策略

```
- Docker 日志轮转：每个容器最大 10MB，保留3个
- 应用日志按天切割：保留7天
- 数据库备份保留7天（已配置）
- 定时清理无用镜像：docker image prune -f（每周）
```

**实现：** /etc/docker/daemon.json 配置 log-opts；cron 每周执行清理。

---

## 十三、商业模式优化

### 13.1 试用期转化漏斗

```
未注册用户 → 首页看到工具展示 → 点击使用 → 弹窗"注册即送500点体验"
  ↓
注册用户（未充值）→ 赠送500点（约5元）→ 用完后 → "充值6元得1000点"（低门槛首充）
  ↓
首次充值用户 → 首充双倍（充1000得2000）→ 提升转化率
  ↓
复购用户 → 月卡/季卡套餐优惠
```

### 13.2 退费机制

```
退费规则：
├── 充值7天内未使用 → 全额退
├── 已使用部分 → 按已消耗点数对应金额扣除
├── 退费至原支付渠道
└── super_admin 后台可操作退费
```

### 13.3 成本核算面板（后台）

```
后台 → 财务看板
┌──────────────────────────────────┐
│ 今日收入：85元                    │
│ 今日成本：32元（火山方舟调用）     │
│ 今日利润：53元                    │
├──────────────────────────────────┤
│ 利润率：62%   |   本月利润：1280元 │
├──────────────────────────────────┤
│ 接口成本明细：                    │
│ 豆包对话：0.002元/次 → 售价0.01元 │
│ 生图：0.05元/次 → 售价0.15元      │
│ 视频：2元/次 → 售价5元            │
└──────────────────────────────────┘
```

### 13.4 邀请裂变

```
每个用户有专属邀请码/邀请链接
  ↓
新用户通过邀请码注册 → 双方各得200点
  ↓
邀请满5人 → 升级为"推广大使" → 永久9折
  ↓
后台可查看邀请关系链
```

---

## 十四、用户体验优化

### 14.1 移动端适配

```
- Tailwind 已支持响应式，需逐页检查移动端表现
- 重点优化：导航栏（汉堡菜单）、工作流使用页（表单）、个人中心
- 智能体对话页参考豆包APP布局
- 移动端充值时输入框自动唤起数字键盘
```

### 14.2 首次使用引导

```
首次登录 → 全屏引导（3步）：
  Step 1: "这里查看你的专属API Key" → 指向个人中心
  Step 2: "这里直接使用工具" → 指向工作台
  Step 3: "有问题随时联系客服" → 指向右下角
  ↓
完成后赠送100点奖励（提升引导完成率）
```

### 14.3 客服入口

```
右下角悬浮按钮，点击展开：
┌─────────────────┐
│ 需要帮助？       │
│ [FAQ文档]       │
│ [提交工单]      │
│ [加微信群]      │
└─────────────────┘
初期：跳转飞书文档或显示微信二维码
```

### 14.4 错误页面美化

```
- 404：友好的"页面走丢了"+ 返回首页按钮
- 500：友好的"服务器开小差"+ 重试按钮
- 余额不足：弹窗 + 充值按钮
```

---

## 十五、内容审核（合规刚需）

### 15.1 审核流程

```
输入审核：
  用户输入 → 关键词过滤（敏感词库）
  ├── 命中敏感词 → 拒绝 + 提示"请修改输入内容"
  └── 通过 → 继续调用模型
  ↓
输出审核：
  模型返回结果 → 敏感词检测
  ├── 命中 → 不展示 + 提示"内容审核未通过"
  └── 通过 → 展示给用户
```

### 15.2 技术选型

```
方案A（推荐，免费）：sensitive-words-fast（Node.js 本地词库）
方案B（更准，收费）：阿里云内容安全API（约0.001元/次）

初期用A，规模化后切B
```

---

## 十六、运维稳定性

### 16.1 健康检查 + 自动重启

```yaml
# docker-compose.yml
app:
  healthcheck:
    test: ["CMD", "wget", "--spider", "-q", "http://localhost:3000/api/health"]
    interval: 30s
    timeout: 10s
    retries: 3
  restart: unless-stopped

db:
  healthcheck:
    test: ["CMD-SHELL", "pg_isready -U randu"]
    interval: 10s
    retries: 5
  restart: unless-stopped
```

### 16.2 健康检查接口

```
GET /api/health
  → 检查数据库连接
  → 检查 OSS 连接
  → 检查 Coze API 连通性
  → 返回 { status: "ok", services: {...} }
```

### 16.3 监控告警（轻量方案）

```
方案：脚本定时检查 + 钉钉机器人告警
  ├── 每分钟检查 /api/health
  ├── 失败连续3次 → 发钉钉机器人告警
  ├── 磁盘使用率 > 80% → 告警
  ├── 内存使用率 > 90% → 告警
  └── 数据库连接数 > 50 → 告警
```

### 16.4 日志收集（轻量）

```
方案：日志写文件 + 按天切割
  /var/log/randu-ai/
  ├── app-2026-06-26.log
  ├── app-2026-06-25.log
  └── error.log（仅错误，快速定位）
  ↓
保留7天，自动清理
```

---

## 十七、计费优化

### 17.1 防刷机制

```
单用户限制：
  ├── 每分钟最多调用10次
  ├── 每天最多消耗5000点
  └── 同一IP多账号检测（防薅羊毛）

Key限制：
  ├── 单Key每秒最多5次调用
  ├── 单Key每天最多1000次
  └── 异常调用模式告警（如1秒内消耗100次）
```

### 17.2 套餐细化

```
┌──────────┬────────┬────────┬──────────┐
│ 套餐     │ 价格   │ 点数   │ 附加权益  │
├──────────┼────────┼────────┼──────────┤
│ 体验包   │ 6元    │ 1000点 │ 首充专享  │
│ 月卡     │ 30元   │ 5000点 │ +5%赠送  │
│ 季卡     │ 88元   │ 15000点│ +10%赠送 │
│ 年卡     │ 299元  │ 60000点│ +20%赠送 │
│ 企业版   │ 999元  │ 200000 │ 专属客服  │
└──────────┴────────┴────────┴──────────┘

点数有效期：
  ├── 体验包：30天
  ├── 月卡/季卡：套餐周期+7天
  ├── 年卡：365天
  └── 企业版：90天（续费延续）
```

### 17.3 余额过期提醒

```
点数即将过期 → 提前7天通知
  ├── 站内通知
  ├── 邮件（可选）
  └── 短信（Phase 3）
```

### 17.4 预扣费机制

```
用户发送请求
  ↓
预扣最低消耗（如5点）→ 余额冻结
  ↓
生成完成 → 计算实际消耗
  ├── 实际 < 预扣 → 退回差额
  └── 实际 > 预扣 → 补扣差额
  ↓
余额不足预扣 → 直接拒绝
```

**好处：** 不会欠费，用户体验无感知，并发安全。

---

## 十八、数据驱动

### 18.1 关键指标埋点

```
后台 → 数据看板
核心指标：
├── 注册用户数 / 日活 / 月活
├── 付费用户数 / 付费转化率
├── 次日留存 / 7日留存
├── ARPU（单用户平均收入）
├── 各工具使用次数排行
├── 用户消耗分布（谁消耗最多）
└── 流量来源（从哪来的）
```

### 18.2 留存分析

```
用户行为埋点（写入数据库 CallLog）：
  ├── 注册时间
  ├── 首次使用时间
  ├── 首次付费时间
  └── 最近活跃时间
  ↓
后台 → 用户分析：
  "注册7天未使用" → 推送召回
  "付费用户30天未续费" → 优惠券触达
```

---

## 十九、优先级总览

| 建议 | 优先级 | 阶段 | 理由 |
|------|--------|------|------|
| 内存配额 + 连接池 | 高 | Phase 1 | 防 OOM 崩溃 |
| 静态资源走 OSS CDN | 高 | Phase 1 | 减压 |
| 内容审核 | 高 | Phase 1 | 合规刚需 |
| 健康检查 + 自动重启 | 高 | Phase 1 | 稳定性 |
| 试用期转化优化 | 高 | Phase 1 | 商业化 |
| 健康检查接口 | 高 | Phase 1 | 监控基础 |
| 客服入口 | 中 | Phase 2 | 体验 |
| 首次引导 | 中 | Phase 2 | 体验 |
| 邀请裂变 | 中 | Phase 2 | 增长 |
| 成本核算面板 | 中 | Phase 2 | 运营 |
| 退费机制 | 中 | Phase 2 | 合规 |
| 数据看板 | 中 | Phase 2 | 决策 |
| 监控告警 | 中 | Phase 2 | 稳定性 |
| 防刷机制 | 中 | Phase 2 | 安全 |
| 套餐优化 | 低 | Phase 3 | 变现 |
| 留存分析 | 低 | Phase 3 | 增长 |
| 余额过期提醒 | 低 | Phase 3 | 体验 |
| 预扣费机制 | 中 | Phase 2 | 防亏损 |

---

## 二十、下一步

确认本方案后，我会按 Phase 1 任务清单依次实现：

1. 先改 Prisma schema（数据库设计）
2. 实现角色权限 + Key 管理
3. 对接火山方舟
4. 实现对外API
5. 前端Key管理页面
6. 输出Coze插件配置说明
7. 用户资料完善（昵称/头像）
8. 手机号校验
9. 工作流后台运行
10. 站内通知系统
11. 历史记录页
12. 数据库备份启用
13. 硬件优化（内存配额/连接池/OSS直传）
14. 内容审核接入
15. 健康检查接口
16. 试用期转化优化

每个模块完成后会跟你确认，再进入下一个。

---

**文档版本：** v2.0
**等待确认后开始执行**

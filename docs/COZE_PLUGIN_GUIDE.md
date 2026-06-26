# 燃渡AI Coze 插件接入指南

本指南介绍如何在 Coze 平台配置燃渡AI 插件，调用 AI 文案生成和 AI 生图能力。

## 一、前置准备

1. **注册燃渡AI 账号**：访问 https://randuai.cn/register 完成注册
2. **创建 API Key**：
   - 登录后进入「个人中心 → API Key 管理」
   - 点击「创建新 Key」，输入名称（如：Coze 插件调用）
   - 复制生成的明文 Key（格式 `blaze_xxxxxxxx`，**仅显示一次**）
3. **确认余额**：新用户注册赠送试用点数，也可在个人中心查看余额

## 二、Coze 插件配置

### 方式一：通过 OpenAPI Schema 导入

1. 在 Coze 开发平台创建插件，选择「通过 URL 导入」
2. 填入 OpenAPI Schema 文件地址：
   ```
   https://randuai.cn/docs/coze-plugin-openapi.yaml
   ```
   或上传本地文件 `docs/coze-plugin-openapi.yaml`
3. 配置鉴权方式：
   - 鉴权类型：**API Key**
   - 位置：**Header**
   - Header 名称：`X-API-Key`
   - Header 值：填入你的 `blaze_` 开头的 Key

### 方式二：手动配置

如需手动配置，按以下信息创建 4 个工具：

| 工具名 | 方法 | 路径 | 功能 |
|--------|------|------|------|
| verifyApiKey | GET | /api/external/key/verify | 验证 Key 有效性 + 查余额 |
| getUserUsage | GET | /api/external/user/usage | 查询用量统计 |
| generateCopy | POST | /api/external/generate/copy | AI 文案生成 |
| generateImage | POST | /api/external/generate/image | AI 生图 |

所有接口均需在请求头携带 `X-API-Key`。

## 三、可用接口

### 1. 验证 API Key

```
GET /api/external/key/verify
```

**用途**：插件启动时自检，确认 Key 有效并获取余额。

**响应示例**：
```json
{
  "valid": true,
  "keyName": "Coze 插件调用",
  "credits": 95
}
```

### 2. 查询用户用量

```
GET /api/external/user/usage
```

**用途**：查询余额、累计调用次数及所有 Key 的用量汇总。

### 3. AI 文案生成

```
POST /api/external/generate/copy
```

**请求体**：
```json
{
  "prompt": "帮我写一段夏季新品连衣裙的电商文案，突出清凉透气",
  "style": "活泼"
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| prompt | string | 是 | 文案需求描述，最多 2000 字 |
| style | string | 否 | 写作风格，如活泼/正式/文艺 |

**响应示例**：
```json
{
  "content": "👗 夏日清凉来袭！这款连衣裙...",
  "tokensUsed": 358,
  "creditsCost": 1
}
```

**计费**：1 点/次

### 4. AI 生图

```
POST /api/external/generate/image
```

**请求体**：
```json
{
  "prompt": "一只穿着汉服的猫，水墨画风格",
  "size": "1024x1024",
  "n": 1
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| prompt | string | 是 | 图片描述，最多 1000 字 |
| size | string | 否 | 尺寸：1024x1024 / 768x1024 / 1024x768，默认 1024x1024 |
| n | integer | 否 | 生成数量 1-4，默认 1 |

**响应示例**：
```json
{
  "urls": ["https://oss.randuai.cn/generated/xxx.png"],
  "count": 1,
  "creditsCost": 5
}
```

**计费**：5 点/张（按 n 计费）

## 四、错误码

| HTTP 状态码 | 说明 | 处理建议 |
|------------|------|---------|
| 400 | 参数错误 | 检查 prompt 是否为空或超长 |
| 401 | Key 无效/已吊销/已过期 | 重新创建 Key |
| 402 | 余额不足 | 充值点数 |
| 403 | 账号被封禁 | 联系管理员 |
| 502 | 模型调用失败 | 稍后重试 |

## 五、Bot 配置示例

在 Coze Bot 中，可按以下流程编排：

1. **用户输入** → 接收用户的文案/生图需求
2. **验证 Key** → 调用 `verifyApiKey` 确认有效
3. **判断意图**：
   - 文案需求 → 调用 `generateCopy`
   - 生图需求 → 调用 `generateImage`
4. **返回结果** → 将生成内容展示给用户
5. **余额不足** → 提示用户充值

## 六、注意事项

- API Key 是敏感信息，请勿在前端代码或日志中明文暴露
- 单 Key 建议绑定单一用途，便于用量追踪
- 如需重置 Key（旧 Key 立即失效），在 Key 管理页点击「重置」
- 完整 OpenAPI Schema 见 `docs/coze-plugin-openapi.yaml`

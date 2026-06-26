# 燃渡AI Node.js SDK

第三方开发者在 Node.js 项目中调用燃渡AI 开放 API 的轻量级客户端。

## 安装

零依赖（仅使用 Node.js 18+ 内置 `fetch`）。将 `randu-ai.js` 复制到项目中：

```bash
cp sdks/nodejs/randu-ai.js ./lib/
```

## 快速开始

### CommonJS

```javascript
const { RanduClient, RanduError } = require("./randu-ai");

const client = new RanduClient({ apiKey: "sk_xxx" });

async function main() {
  // 1. 验证 Key
  const info = await client.verifyKey();
  console.log(info.keyName, info.credits);

  // 2. 文生图
  const img = await client.generateImage("一只穿着汉服的猫，水墨画风格");
  console.log(img.urls);

  // 3. 文案生成
  const text = await client.generateCopy("帮我写一段产品介绍", "专业");
  console.log(text.content);

  // 4. 提交视频任务（异步）
  const task = await client.submitVideoTask({ prompt: "小猫打哈欠", resolution: "720p" });
  console.log(task.taskId);

  // 5. 轮询等待视频完成
  const result = await client.waitForVideo(task.taskId, { timeout: 300000 });
  console.log(result.videoUrl);
}

main().catch(console.error);
```

### ESM

```javascript
import { RanduClient } from "./randu-ai.js";

const client = new RanduClient({ apiKey: "sk_xxx" });
const info = await client.verifyKey();
```

## 错误处理

```javascript
const { RanduClient, RanduError } = require("./randu-ai");
const client = new RanduClient({ apiKey: "sk_xxx" });

try {
  const result = await client.generateImage("...");
} catch (err) {
  if (err instanceof RanduError) {
    console.error("失败：", err.message);
    console.error("HTTP 状态码：", err.statusCode);

    if (err.statusCode === 402) {
      console.error("点数不足，请到 https://randu.ai/dashboard 充值");
    } else if (err.statusCode === 429) {
      console.error("触发限流，请稍后再试");
    }
  }
}
```

## API 参考

### `new RanduClient({ apiKey, baseUrl?, timeout? })`

- `apiKey` (string) - 必填
- `baseUrl` (string) - 默认 `https://randu.ai`
- `timeout` (number) - HTTP 超时毫秒，默认 30000

### `verifyKey() -> Promise<object>`
返回 `{ valid, keyName, credits, keyStats }`。

### `getUsage() -> Promise<object>`
返回 `{ credits, totalUsed, keyCreditsUsed, keyTotalCalls }`。

### `generateCopy(prompt, style?) -> Promise<object>`
豆包文案生成，扣 1 点。

### `generateImage(prompt, { size?, n? }) -> Promise<object>`
Seedream 文生图，每张扣 5 点。

### `submitVideoTask({ prompt?, firstFrameUrl?, ... }) -> Promise<object>`
提交 Seedance 视频任务（异步），返回 `{ taskId, pollUrl }`。
任务成功时扣 30 点，失败不扣点。

### `getVideoStatus(taskId) -> Promise<object>`
查询视频任务状态，返回 `{ status, videoUrl?, errorMessage? }`。

### `waitForVideo(taskId, { timeout?, pollInterval? }) -> Promise<object>`
阻塞轮询直到任务完成或失败。超时抛 `RanduError`。

完整接口规范见 https://randu.ai/api-docs

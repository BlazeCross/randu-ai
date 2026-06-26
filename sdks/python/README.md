# 燃渡AI Python SDK

第三方开发者在 Python 项目中调用燃渡AI 开放 API 的轻量级客户端。

## 安装

零依赖（仅使用 Python 3.8+ 标准库）。将 `randu_ai` 目录放入项目，或加入 `PYTHONPATH`：

```bash
export PYTHONPATH=/path/to/sdks/python:$PYTHONPATH
```

或直接复制 `randu_ai/` 目录到你的项目中。

## 快速开始

```python
from randu_ai import RanduClient, RanduError

client = RanduClient(api_key="sk_xxx")

# 1. 验证 Key + 查询余额
info = client.verify_key()
print(info["keyName"], info["credits"])

# 2. 文生图
img = client.generate_image(prompt="一只穿着汉服的猫，水墨画风格")
print(img["urls"])

# 3. 文案生成
text = client.generate_copy(prompt="帮我写一段产品介绍", style="专业")
print(text["content"])

# 4. 提交视频任务（异步）
task = client.submit_video_task(prompt="小猫打哈欠", resolution="720p")
print(task["taskId"])

# 5. 轮询等待视频完成
result = client.wait_for_video(task["taskId"], timeout=300)
print(result["videoUrl"])
```

## 错误处理

```python
from randu_ai import RanduClient, RanduError

client = RanduClient(api_key="sk_xxx")

try:
    result = client.generate_image(prompt="...")
except RanduError as e:
    print(f"失败：{e.message}")
    print(f"HTTP 状态码：{e.status_code}")
    print(f"响应体：{e.body}")

    # 402 = 点数不足，引导用户充值
    # 429 = 触发频率限制，需等待重试
    if e.status_code == 402:
        print("点数不足，请到 https://randu.ai/dashboard 充值")
    elif e.status_code == 429:
        print("触发限流，请稍后再试")
```

## API 参考

### `RanduClient(api_key, base_url="https://randu.ai", timeout=30)`

构造客户端。

### `verify_key() -> dict`
验证 Key，返回 `{ valid, keyName, credits, keyStats }`。

### `get_usage() -> dict`
查询用量，返回 `{ credits, totalUsed, keyCreditsUsed, keyTotalCalls }`。

### `generate_copy(prompt, style=None) -> dict`
豆包文案生成，扣 1 点。

### `generate_image(prompt, size="1024x1024", n=1) -> dict`
Seedream 文生图，每张扣 5 点。

### `submit_video_task(**kwargs) -> dict`
提交 Seedance 视频任务（异步），返回 `{ taskId, pollUrl }`。
任务成功时扣 30 点，失败不扣点。

### `get_video_status(task_id) -> dict`
查询视频任务状态，返回 `{ status, videoUrl?, errorMessage? }`。

### `wait_for_video(task_id, timeout=300, poll_interval=5) -> dict`
阻塞轮询直到任务完成或失败。超时抛 `RanduError`。

完整接口规范见 https://randu.ai/api-docs

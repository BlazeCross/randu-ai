"""燃渡AI Python SDK 客户端实现"""

from __future__ import annotations

import json
import time
import urllib.error
import urllib.request
from typing import Any, Dict, Optional


__version__ = "1.0.0"

# 默认超时（秒）
DEFAULT_TIMEOUT = 30
# 默认 base URL
DEFAULT_BASE_URL = "https://randu.ai"
# 视频任务轮询间隔（秒）
DEFAULT_POLL_INTERVAL = 5


class RanduError(Exception):
    """SDK 通用异常，包含 HTTP 状态码和服务器返回的 message"""

    def __init__(self, message: str, status_code: int = 0, body: Any = None) -> None:
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.body = body


class RanduClient:
    """燃渡AI 开放 API 客户端"""

    def __init__(
        self,
        api_key: str,
        base_url: str = DEFAULT_BASE_URL,
        timeout: int = DEFAULT_TIMEOUT,
    ) -> None:
        """
        :param api_key: 在 https://randu.ai/dashboard/keys 创建的 API Key
        :param base_url: 服务地址，默认 https://randu.ai
        :param timeout: HTTP 请求超时（秒）
        """
        if not api_key:
            raise ValueError("api_key 不能为空")
        self.api_key = api_key
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout

    # ============ 内部方法 ============

    def _request(
        self,
        method: str,
        path: str,
        body: Optional[Dict[str, Any]] = None,
        params: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        url = f"{self.base_url}{path}"

        # query string
        if params:
            from urllib.parse import urlencode

            url = f"{url}?{urlencode(params)}"

        data = None
        headers = {
            "X-API-Key": self.api_key,
            "Accept": "application/json",
        }
        if body is not None:
            data = json.dumps(body).encode("utf-8")
            headers["Content-Type"] = "application/json"

        req = urllib.request.Request(url=url, data=data, headers=headers, method=method)

        try:
            with urllib.request.urlopen(req, timeout=self.timeout) as resp:
                raw = resp.read().decode("utf-8")
                return json.loads(raw) if raw else {}
        except urllib.error.HTTPError as e:
            raw = e.read().decode("utf-8", errors="replace") if hasattr(e, "read") else ""
            try:
                parsed = json.loads(raw) if raw else {}
                msg = parsed.get("message", raw or str(e))
            except json.JSONDecodeError:
                parsed = None
                msg = raw or str(e)
            raise RanduError(msg, status_code=e.code, body=parsed) from None
        except urllib.error.URLError as e:
            raise RanduError(f"网络请求失败：{e.reason}") from None

    # ============ Auth ============

    def verify_key(self) -> Dict[str, Any]:
        """验证 API Key 有效性，返回 Key 名称和余额"""
        return self._request("GET", "/api/external/key/verify")

    # ============ Usage ============

    def get_usage(self) -> Dict[str, Any]:
        """查询当前用户和 Key 的用量"""
        return self._request("GET", "/api/external/user/usage")

    # ============ Text ============

    def generate_copy(self, prompt: str, style: Optional[str] = None) -> Dict[str, Any]:
        """调用豆包模型生成文案，扣 1 点"""
        body: Dict[str, Any] = {"prompt": prompt}
        if style:
            body["style"] = style
        return self._request("POST", "/api/external/generate/copy", body=body)

    # ============ Image ============

    def generate_image(
        self,
        prompt: str,
        size: str = "1024x1024",
        n: int = 1,
    ) -> Dict[str, Any]:
        """调用 Seedream 文生图，每张扣 5 点"""
        return self._request(
            "POST",
            "/api/external/generate/image",
            body={"prompt": prompt, "size": size, "n": n},
        )

    # ============ Video ============

    def submit_video_task(self, **kwargs: Any) -> Dict[str, Any]:
        """
        提交 Seedance 视频生成任务，返回 taskId（异步接口）。

        支持参数：
        - prompt: 视频描述（文生视频必填）
        - first_frame_url: 首帧图片 URL（图生视频）
        - last_frame_url: 尾帧图片 URL（需同时提供 first_frame_url）
        - resolution: 480p / 720p / 1080p / 4k
        - ratio: 16:9 / 4:3 / 1:1 / 3:4 / 9:16 / 21:9 / adaptive
        - duration: 1-15 秒
        - seed: 随机种子
        - camera_fixed: 是否固定镜头
        - watermark: 是否生成水印
        - generate_audio: 是否生成同步音频
        - return_last_frame: 是否返回尾帧图片

        任务成功时扣 30 点，失败不扣点。
        """
        # 将 snake_case 转 camelCase
        camel_map = {
            "first_frame_url": "firstFrameUrl",
            "last_frame_url": "lastFrameUrl",
            "camera_fixed": "cameraFixed",
            "generate_audio": "generateAudio",
            "return_last_frame": "returnLastFrame",
        }
        body: Dict[str, Any] = {}
        for k, v in kwargs.items():
            if v is None:
                continue
            body[camel_map.get(k, k)] = v
        return self._request("POST", "/api/external/generate/video", body=body)

    def get_video_status(self, task_id: str) -> Dict[str, Any]:
        """查询视频任务状态（单次轮询）"""
        return self._request(
            "GET",
            "/api/external/generate/video/status",
            params={"taskId": task_id},
        )

    def wait_for_video(
        self,
        task_id: str,
        timeout: int = 300,
        poll_interval: int = DEFAULT_POLL_INTERVAL,
    ) -> Dict[str, Any]:
        """
        轮询等待视频任务完成（completed 或 failed）。

        :param timeout: 总等待时间（秒）
        :param poll_interval: 轮询间隔（秒）
        :return: 最终状态响应
        :raises RanduError: 超时或任务失败
        """
        deadline = time.time() + timeout
        while time.time() < deadline:
            result = self.get_video_status(task_id)
            status = result.get("status")
            if status == "completed":
                return result
            if status == "failed":
                raise RanduError(
                    result.get("errorMessage", "视频生成失败"),
                    status_code=200,
                    body=result,
                )
            time.sleep(poll_interval)
        raise RanduError(f"等待视频任务 {task_id} 超时（{timeout}s）")

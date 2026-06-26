"""
燃渡AI Python SDK

第三方开发者在 Python 项目中调用燃渡AI 开放 API 的轻量级客户端。

安装：直接将本目录放入项目，或加入 PYTHONPATH 后 `from randu_ai import RanduClient`。

依赖：仅依赖 Python 3.8+ 标准库 + 可选 requests（如未安装则自动使用 urllib）。

示例：
    from randu_ai import RanduClient

    client = RanduClient(api_key="sk_xxx")

    # 验证 Key
    print(client.verify_key())

    # 文生图
    result = client.generate_image(prompt="一只穿着汉服的猫")
    print(result["urls"])

    # 提交视频任务并轮询
    task = client.submit_video_task(prompt="小猫打哈欠")
    result = client.wait_for_video(task["taskId"], timeout=300)
    print(result["videoUrl"])
"""

from .client import RanduClient, RanduError, __version__

__all__ = ["RanduClient", "RanduError", "__version__"]

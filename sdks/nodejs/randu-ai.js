/**
 * 燃渡AI Node.js SDK
 *
 * 第三方开发者在 Node.js 项目中调用燃渡AI 开放 API 的轻量级客户端。
 *
 * 零依赖（仅使用 Node.js 18+ 内置 fetch）。
 *
 * 安装：将本文件复制到项目中，或：
 *   npm install randu-ai  （待发布到 npm）
 *
 * 示例（CommonJS）：
 *   const { RanduClient } = require("./randu-ai");
 *   const client = new RanduClient({ apiKey: "sk_xxx" });
 *   const info = await client.verifyKey();
 *
 * 示例（ESM）：
 *   import { RanduClient } from "./randu-ai.js";
 */

"use strict";

const DEFAULT_BASE_URL = "https://randu.ai";
const DEFAULT_TIMEOUT = 30000;
const DEFAULT_POLL_INTERVAL = 5000;

class RanduError extends Error {
  /**
   * @param {string} message
   * @param {number} statusCode
   * @param {any} [body]
   */
  constructor(message, statusCode = 0, body) {
    super(message);
    this.name = "RanduError";
    this.statusCode = statusCode;
    this.body = body;
  }
}

class RanduClient {
  /**
   * @param {Object} options
   * @param {string} options.apiKey - 在 https://randu.ai/dashboard/keys 创建的 API Key
   * @param {string} [options.baseUrl] - 服务地址，默认 https://randu.ai
   * @param {number} [options.timeout] - HTTP 请求超时（毫秒），默认 30000
   */
  constructor({ apiKey, baseUrl = DEFAULT_BASE_URL, timeout = DEFAULT_TIMEOUT }) {
    if (!apiKey) throw new Error("apiKey 不能为空");
    this.apiKey = apiKey;
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.timeout = timeout;
  }

  /**
   * @param {string} method
   * @param {string} path
   * @param {Object} [options]
   * @param {Object} [options.body]
   * @param {Object} [options.params]
   * @returns {Promise<Object>}
   */
  async _request(method, path, { body, params } = {}) {
    let url = `${this.baseUrl}${path}`;
    if (params) {
      const search = new URLSearchParams();
      for (const [k, v] of Object.entries(params)) {
        if (v !== undefined && v !== null) search.append(k, String(v));
      }
      const qs = search.toString();
      if (qs) url += `?${qs}`;
    }

    /** @type {RequestInit} */
    const init = {
      method,
      headers: {
        "X-API-Key": this.apiKey,
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(this.timeout),
    };
    if (body !== undefined) {
      init.body = JSON.stringify(body);
      // @ts-ignore - headers 是 HeadersInit
      init.headers["Content-Type"] = "application/json";
    }

    let res;
    try {
      res = await fetch(url, init);
    } catch (err) {
      throw new RanduError(`网络请求失败：${err instanceof Error ? err.message : String(err)}`);
    }

    const raw = await res.text();
    let parsed = undefined;
    if (raw) {
      try {
        parsed = JSON.parse(raw);
      } catch {
        // 非 JSON 响应
      }
    }

    if (!res.ok) {
      const msg = (parsed && parsed.message) || raw || res.statusText;
      throw new RanduError(msg, res.status, parsed);
    }
    return parsed ?? {};
  }

  // ============ Auth ============

  /** 验证 API Key 有效性，返回 Key 名称和余额 */
  verifyKey() {
    return this._request("GET", "/api/external/key/verify");
  }

  // ============ Usage ============

  /** 查询当前用户和 Key 的用量 */
  getUsage() {
    return this._request("GET", "/api/external/user/usage");
  }

  // ============ Text ============

  /**
   * 调用豆包模型生成文案，扣 1 点
   * @param {string} prompt
   * @param {string} [style]
   */
  generateCopy(prompt, style) {
    /** @type {Object} */
    const body = { prompt };
    if (style) body.style = style;
    return this._request("POST", "/api/external/generate/copy", { body });
  }

  // ============ Image ============

  /**
   * 调用 Seedream 文生图，每张扣 5 点
   * @param {string} prompt
   * @param {Object} [options]
   * @param {string} [options.size="1024x1024"]
   * @param {number} [options.n=1]
   */
  generateImage(prompt, { size = "1024x1024", n = 1 } = {}) {
    return this._request("POST", "/api/external/generate/image", {
      body: { prompt, size, n },
    });
  }

  // ============ Video ============

  /**
   * 提交 Seedance 视频生成任务（异步），返回 taskId。
   * 任务成功时扣 30 点，失败不扣点。
   *
   * @param {Object} options
   * @param {string} [options.prompt] - 视频描述（文生视频必填）
   * @param {string} [options.firstFrameUrl] - 首帧图片 URL（图生视频）
   * @param {string} [options.lastFrameUrl] - 尾帧图片 URL（需同时提供 firstFrameUrl）
   * @param {string} [options.resolution] - 480p / 720p / 1080p / 4k
   * @param {string} [options.ratio] - 16:9 / 4:3 / 1:1 / 3:4 / 9:16 / 21:9 / adaptive
   * @param {number} [options.duration] - 1-15 秒
   * @param {number} [options.seed] - 随机种子
   * @param {boolean} [options.cameraFixed] - 是否固定镜头
   * @param {boolean} [options.watermark] - 是否生成水印
   * @param {boolean} [options.generateAudio] - 是否生成同步音频
   * @param {boolean} [options.returnLastFrame] - 是否返回尾帧图片
   */
  submitVideoTask(options) {
    // 仅传显式设置的字段（避免传 undefined）
    const body = {};
    for (const [k, v] of Object.entries(options ?? {})) {
      if (v !== undefined && v !== null) body[k] = v;
    }
    return this._request("POST", "/api/external/generate/video", { body });
  }

  /** 查询视频任务状态（单次轮询） */
  getVideoStatus(taskId) {
    return this._request("GET", "/api/external/generate/video/status", {
      params: { taskId },
    });
  }

  /**
   * 轮询等待视频任务完成（completed 或 failed）
   * @param {string} taskId
   * @param {Object} [options]
   * @param {number} [options.timeout=300000] - 总等待时间（毫秒）
   * @param {number} [options.pollInterval=5000] - 轮询间隔（毫秒）
   * @returns {Promise<Object>} 最终状态响应
   * @throws {RanduError} 超时或任务失败
   */
  async waitForVideo(taskId, { timeout = 300000, pollInterval = DEFAULT_POLL_INTERVAL } = {}) {
    const deadline = Date.now() + timeout;
    while (Date.now() < deadline) {
      const result = await this.getVideoStatus(taskId);
      if (result.status === "completed") return result;
      if (result.status === "failed") {
        throw new RanduError(result.errorMessage || "视频生成失败", 200, result);
      }
      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }
    throw new RanduError(`等待视频任务 ${taskId} 超时（${timeout}ms）`);
  }
}

module.exports = { RanduClient, RanduError };
module.exports.default = { RanduClient, RanduError };
module.exports.RanduClient = RanduClient;
module.exports.RanduError = RanduError;

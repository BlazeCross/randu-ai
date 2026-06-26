/**
 * 火山方舟（Volcengine Ark）API 客户端
 *
 * 封装火山方舟的 AI 模型调用能力：
 * - 豆包大模型（文本对话，OpenAI 兼容 /chat/completions）
 * - Seedream（文生图，OpenAI 兼容 /images/generations）
 * - Seedance（视频生成，异步任务 /contents/generations/tasks）
 *
 * 环境变量：
 * - VOLC_ARK_API_KEY       火山方舟 API Key（Bearer 鉴权）
 * - VOLC_MODEL_DOUBAO     豆包模型 Endpoint ID
 * - VOLC_MODEL_SEEDREAM    Seedream 模型 Endpoint ID
 * - VOLC_MODEL_SEEDANCE    Seedance 视频模型 ID（如 doubao-seedance-1-5-pro-251215）
 *
 * 注：火山方舟 /api/v3 接口为 OpenAI 兼容协议，使用 API Key 鉴权；
 *     Seedance 视频生成为异步任务（提交 → 轮询 → 获取结果）。
 */

// 火山方舟 API 基础地址（OpenAI 兼容）
const ARK_BASE_URL = "https://ark.cn-beijing.volces.com/api/v3";

// 请求超时（毫秒）：豆包对话通常较快，生图稍慢，统一 30s
const VOLC_REQUEST_TIMEOUT_MS = 30000;

// 模块级缓存：仅在首次调用时读取环境变量并构造请求头，后续直接复用
let cachedConfig: { headers: HeadersInit } | null = null;

/**
 * 初始化并缓存火山方舟配置（请求头）
 * 首次调用时读取 VOLC_ARK_API_KEY，后续直接返回缓存
 */
function getConfig(): { headers: HeadersInit } {
  if (cachedConfig) {
    return cachedConfig;
  }

  const apiKey = process.env.VOLC_ARK_API_KEY;
  if (!apiKey) {
    throw new Error("VOLC_ARK_API_KEY 未配置");
  }

  cachedConfig = {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
  };
  return cachedConfig;
}

// ============ 豆包文本对话 ============

// 聊天消息类型（OpenAI 兼容）
export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

// 豆包对话请求参数
export interface ChatOptions {
  /** 模型 Endpoint ID，默认取 VOLC_MODEL_DOUBAO */
  model?: string;
  messages: ChatMessage[];
  /** 采样温度，越高越随机，默认 0.7 */
  temperature?: number;
  /** 最大生成 token 数 */
  maxTokens?: number;
  /** 核采样概率，默认 1 */
  topP?: number;
}

// 豆包对话响应
export interface ChatResult {
  /** 模型生成的文本 */
  content: string;
  /** 本次调用消耗的 token 总数 */
  tokensUsed: number;
  /** 实际使用的模型 ID */
  model: string;
}

/**
 * 豆包文本对话（OpenAI 兼容 /chat/completions）
 *
 * @param options 对话参数（messages + 可选采样参数）
 * @returns 生成的文本内容 + token 消耗
 *
 * @example
 * const result = await chatCompletion({
 *   messages: [
 *     { role: "system", content: "你是一个文案专家" },
 *     { role: "user", content: "帮我写一段产品介绍" },
 *   ],
 * });
 */
export async function chatCompletion(
  options: ChatOptions,
): Promise<ChatResult> {
  const { headers } = getConfig();
  const model = options.model ?? process.env.VOLC_MODEL_DOUBAO;
  if (!model) {
    throw new Error("未配置豆包模型 ID（VOLC_MODEL_DOUBAO）");
  }

  let res: Response;
  try {
    res = await fetch(`${ARK_BASE_URL}/chat/completions`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model,
        messages: options.messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens,
        top_p: options.topP,
      }),
      signal: AbortSignal.timeout(VOLC_REQUEST_TIMEOUT_MS),
    });
  } catch (error) {
    throw new Error(
      `调用火山方舟对话接口失败：${error instanceof Error ? error.message : String(error)}`,
    );
  }

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`火山方舟对话失败（${res.status}）：${errText || res.statusText}`);
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
    usage?: { total_tokens?: number };
  };

  return {
    content: data.choices?.[0]?.message?.content ?? "",
    tokensUsed: data.usage?.total_tokens ?? 0,
    model,
  };
}

// ============ Seedream 文生图 ============

// 生图请求参数
export interface ImageOptions {
  /** 模型 Endpoint ID，默认取 VOLC_MODEL_SEEDREAM */
  model?: string;
  prompt: string;
  /** 图片尺寸，如 "1024x1024"、"768x1024"，默认 "1024x1024" */
  size?: string;
  /** 生成数量，默认 1 */
  n?: number;
}

// 生图响应
export interface ImageResult {
  /** 生成图片的 URL 列表 */
  urls: string[];
  /** 实际使用的模型 ID */
  model: string;
}

/**
 * Seedream 文生图（OpenAI 兼容 /images/generations）
 *
 * @param options 生图参数（prompt + 可选尺寸/数量）
 * @returns 图片 URL 列表
 *
 * @example
 * const result = await generateImage({
 *   prompt: "一只穿着汉服的猫，水墨画风格",
 *   size: "1024x1024",
 * });
 */
export async function generateImage(
  options: ImageOptions,
): Promise<ImageResult> {
  const { headers } = getConfig();
  const model = options.model ?? process.env.VOLC_MODEL_SEEDREAM;
  if (!model) {
    throw new Error("未配置 Seedream 模型 ID（VOLC_MODEL_SEEDREAM）");
  }

  let res: Response;
  try {
    res = await fetch(`${ARK_BASE_URL}/images/generations`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model,
        prompt: options.prompt,
        size: options.size ?? "1024x1024",
        n: options.n ?? 1,
        // 返回 URL 形式（而非 base64），便于直接回传给用户
        response_format: "url",
      }),
      signal: AbortSignal.timeout(VOLC_REQUEST_TIMEOUT_MS),
    });
  } catch (error) {
    throw new Error(
      `调用火山方舟生图接口失败：${error instanceof Error ? error.message : String(error)}`,
    );
  }

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`火山方舟生图失败（${res.status}）：${errText || res.statusText}`);
  }

  const data = (await res.json()) as {
    data?: Array<{ url?: string; b64_json?: string }>;
  };

  const urls = (data.data ?? [])
    .map((item) => item.url)
    .filter((url): url is string => typeof url === "string" && url.length > 0);

  return { urls, model };
}

// ============ Seedance 视频生成 ============

// Seedance 任务状态（内部统一）
type SeedanceTaskStatus =
  | "queued"
  | "running"
  | "succeeded"
  | "failed"
  | "expired"
  | "cancelled";

// 映射为内部统一状态（与 Coze 状态保持一致：pending | running | completed | failed）
export type VideoTaskStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed";

// Seedance 提交任务响应
export interface VideoTaskSubmitResult {
  /** 火山方舟任务 ID（cgt-xxx 格式） */
  taskId: string;
}

// Seedance 查询任务响应
export interface VideoTaskResult {
  status: VideoTaskStatus;
  /** 生成视频的 URL（mp4，24 小时有效期，需及时转存） */
  videoUrl?: string;
  /** 视频尾帧图片 URL（仅创建任务时 return_last_frame=true 时返回） */
  lastFrameUrl?: string;
  /** 模型消耗 token 数 */
  tokensUsed?: number;
  /** 错误信息 */
  errorMessage?: string;
  /** 原始响应（调试用） */
  rawResponse?: unknown;
}

// 视频生成请求参数
export interface VideoGenerationOptions {
  /** 模型 ID，默认取 VOLC_MODEL_SEEDANCE */
  model?: string;
  /** 文本提示词（中文 ≤500 字，英文 ≤1000 词） */
  prompt?: string;
  /** 首帧图片 URL（图生视频-首帧） */
  firstFrameUrl?: string;
  /** 尾帧图片 URL（图生视频-首尾帧，需同时提供 firstFrameUrl） */
  lastFrameUrl?: string;
  /** 视频分辨率：480p / 720p / 1080p / 4k（默认 720p） */
  resolution?: "480p" | "720p" | "1080p" | "4k";
  /** 宽高比：16:9 / 4:3 / 1:1 / 3:4 / 9:16 / 21:9 / adaptive */
  ratio?: "16:9" | "4:3" | "1:1" | "3:4" | "9:16" | "21:9" | "adaptive";
  /** 视频时长（秒），与 frames 二选一 */
  duration?: number;
  /** 视频帧数，与 duration 二选一 */
  frames?: number;
  /** 随机种子，相同种子 + 输入可复现结果 */
  seed?: number;
  /** 是否固定镜头（true = 镜头不动） */
  cameraFixed?: boolean;
  /** 是否生成水印（true = 添加水印） */
  watermark?: boolean;
  /** 是否生成同步音频（仅 Seedance 2.0 / 1.5 Pro 支持） */
  generateAudio?: boolean;
  /** 是否返回尾帧图片（用于连续生成多段视频） */
  returnLastFrame?: boolean;
  /** 异步回调地址（任务状态变化时火山方舟会 POST 通知） */
  callbackUrl?: string;
}

/**
 * 提交 Seedance 视频生成任务
 *
 * 调用 POST /contents/generations/tasks 接口提交异步视频生成任务。
 * 任务状态：queued → running → succeeded / failed / expired / cancelled
 *
 * 用法：
 * - 文生视频：仅传 prompt
 * - 图生视频-首帧：传 prompt + firstFrameUrl
 * - 图生视频-首尾帧：传 prompt + firstFrameUrl + lastFrameUrl
 *
 * @returns 火山方舟任务 ID（cgt-xxx 格式），用于后续查询
 *
 * @example 文生视频
 * const { taskId } = await submitVideoTask({ prompt: "小猫打哈欠" });
 *
 * @example 图生视频-首帧
 * const { taskId } = await submitVideoTask({
 *   prompt: "为图片中的人物添加微笑动画",
 *   firstFrameUrl: "https://cdn.example.com/photo.jpg",
 * });
 */
export async function submitVideoTask(
  options: VideoGenerationOptions,
): Promise<VideoTaskSubmitResult> {
  const { headers } = getConfig();
  const model = options.model ?? process.env.VOLC_MODEL_SEEDANCE;
  if (!model) {
    throw new Error("未配置 Seedance 视频模型 ID（VOLC_MODEL_SEEDANCE）");
  }

  // 构建 content 数组
  const content: Array<Record<string, unknown>> = [];

  // 文本提示词（可选，但通常需要）
  if (options.prompt) {
    content.push({ type: "text", text: options.prompt });
  }

  // 首帧图片
  if (options.firstFrameUrl) {
    content.push({
      type: "image_url",
      image_url: { url: options.firstFrameUrl },
      role: "first_frame",
    });
  }

  // 尾帧图片（首尾帧场景）
  if (options.lastFrameUrl) {
    if (!options.firstFrameUrl) {
      throw new Error("使用尾帧图片时必须同时提供 firstFrameUrl（首帧图片）");
    }
    content.push({
      type: "image_url",
      image_url: { url: options.lastFrameUrl },
      role: "last_frame",
    });
  }

  // 至少需要一种输入（文本或图片）
  if (content.length === 0) {
    throw new Error("视频生成至少需要 prompt 或 firstFrameUrl 中的一个");
  }

  // 构建请求体
  const body: Record<string, unknown> = {
    model,
    content,
  };

  // 可选参数（仅当显式提供时才加入请求体）
  if (options.resolution) body.resolution = options.resolution;
  if (options.ratio) body.ratio = options.ratio;
  if (typeof options.duration === "number") body.duration = options.duration;
  if (typeof options.frames === "number") body.frames = options.frames;
  if (typeof options.seed === "number") body.seed = options.seed;
  if (typeof options.cameraFixed === "boolean")
    body.camera_fixed = options.cameraFixed;
  if (typeof options.watermark === "boolean") body.watermark = options.watermark;
  if (typeof options.generateAudio === "boolean")
    body.generate_audio = options.generateAudio;
  if (typeof options.returnLastFrame === "boolean")
    body.return_last_frame = options.returnLastFrame;
  if (options.callbackUrl) body.callback_url = options.callbackUrl;

  // 视频生成任务超时：5 分钟（提交接口本身较快，但仍需保护）
  const VIDEO_SUBMIT_TIMEOUT_MS = 30000;

  let res: Response;
  try {
    res = await fetch(`${ARK_BASE_URL}/contents/generations/tasks`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(VIDEO_SUBMIT_TIMEOUT_MS),
    });
  } catch (error) {
    throw new Error(
      `调用火山方舟视频生成接口失败：${error instanceof Error ? error.message : String(error)}`,
    );
  }

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(
      `火山方舟视频生成任务提交失败（${res.status}）：${errText || res.statusText}`,
    );
  }

  const data = (await res.json()) as { id?: string };
  if (!data.id) {
    throw new Error("火山方舟响应中未包含任务 ID");
  }

  return { taskId: data.id };
}

/**
 * 查询 Seedance 视频生成任务状态
 *
 * 调用 GET /contents/generations/tasks/{id} 接口查询任务状态。
 * 返回内部统一状态（pending | running | completed | failed），
 * 与 Coze 任务状态保持一致，便于上层路由统一处理。
 *
 * @param taskId 火山方舟任务 ID（cgt-xxx 格式）
 * @returns 任务状态、视频 URL、token 消耗、错误信息
 */
export async function getVideoTaskStatus(
  taskId: string,
): Promise<VideoTaskResult> {
  const { headers } = getConfig();

  // 查询任务超时：30 秒
  const VIDEO_QUERY_TIMEOUT_MS = 30000;

  let res: Response;
  try {
    res = await fetch(
      `${ARK_BASE_URL}/contents/generations/tasks/${encodeURIComponent(taskId)}`,
      {
        method: "GET",
        headers,
        signal: AbortSignal.timeout(VIDEO_QUERY_TIMEOUT_MS),
      },
    );
  } catch (error) {
    throw new Error(
      `查询火山方舟视频任务失败：${error instanceof Error ? error.message : String(error)}`,
    );
  }

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(
      `查询视频任务失败（${res.status}）：${errText || res.statusText}`,
    );
  }

  const data = (await res.json()) as {
    id: string;
    model?: string;
    status?: SeedanceTaskStatus | string;
    error?: { code?: string; message?: string } | null;
    content?: { video_url?: string; last_frame_url?: string };
    usage?: { completion_tokens?: number; total_tokens?: number };
  };

  // 映射为内部统一状态
  const status = mapSeedanceStatus(data.status);
  const result: VideoTaskResult = {
    status,
    rawResponse: data,
  };

  // 提取视频 URL（仅 succeeded 状态时存在）
  if (data.content?.video_url) {
    result.videoUrl = data.content.video_url;
  }
  if (data.content?.last_frame_url) {
    result.lastFrameUrl = data.content.last_frame_url;
  }

  // 提取 token 消耗
  const tokensUsed = data.usage?.completion_tokens ?? data.usage?.total_tokens;
  if (typeof tokensUsed === "number") {
    result.tokensUsed = tokensUsed;
  }

  // 提取错误信息
  if (status === "failed" && data.error) {
    result.errorMessage =
      data.error.message ||
      data.error.code ||
      "视频生成任务执行失败";
  }

  return result;
}

/**
 * 将 Seedance 原始状态映射为内部统一状态
 *
 * Seedance 状态值：queued / running / cancelled / succeeded / failed / expired
 * 内部统一状态：pending / running / completed / failed
 */
function mapSeedanceStatus(raw: string | undefined): VideoTaskStatus {
  if (!raw) return "running";
  const lower = raw.toLowerCase();
  if (lower === "succeeded") return "completed";
  if (lower === "failed" || lower === "expired" || lower === "cancelled") {
    return "failed";
  }
  if (lower === "queued") return "pending";
  // running 或其他默认视为运行中
  return "running";
}

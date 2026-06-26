/**
 * 火山方舟（Volcengine Ark）API 客户端
 *
 * 封装火山方舟的 AI 模型调用能力：
 * - 豆包大模型（文本对话，OpenAI 兼容 /chat/completions）
 * - Seedream（文生图，OpenAI 兼容 /images/generations）
 *
 * 环境变量：
 * - VOLC_ARK_API_KEY     火山方舟 API Key（Bearer 鉴权）
 * - VOLC_MODEL_DOUBAO    豆包模型 Endpoint ID
 * - VOLC_MODEL_SEEDREAM  Seedream 模型 Endpoint ID
 *
 * 注：火山方舟 /api/v3 接口为 OpenAI 兼容协议，使用 API Key 鉴权；
 *     Seedance 视频生成为异步任务，后续阶段单独实现。
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

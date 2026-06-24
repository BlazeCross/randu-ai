/**
 * Coze API 客户端
 *
 * 封装 Coze 工作流异步任务的提交与查询能力：
 * - submitWorkflowTask：提交异步任务，返回 task_id
 * - getTaskStatus：轮询任务状态，返回状态与输出
 *
 * 环境变量：
 * - COZE_API_TOKEN：Coze 平台 API Token
 * - COZE_BASE_URL：Coze API 基础地址（默认 https://api.coze.cn）
 */

// Coze 任务状态（内部统一状态）
export type CozeTaskStatus = "pending" | "running" | "completed" | "failed";

// Coze 任务查询结果
export interface CozeTaskResult {
  status: CozeTaskStatus;
  output?: string; // 视频URL
  tokensUsed?: number; // 消耗Token
  errorMessage?: string;
  rawOutput?: unknown; // 原始 output 数据（调试用）
}

// Coze API 响应通用结构
interface CozeApiResponse<T = unknown> {
  code: number;
  msg?: string;
  message?: string;
  data?: T;
  // 部分接口将 execute_id 放在顶层
  execute_id?: string;
  debug_url?: string;
  detail?: {
    reason?: string;
    logid?: string;
    [key: string]: unknown;
  };
}

// async_run 接口返回的 data 字段
interface CozeAsyncRunData {
  task_id?: string;
  execute_id?: string;
  debug_url?: string;
}

// task 查询接口返回的 data 字段
interface CozeTaskData {
  // Coze 任务状态：running / success / failed / queued 等
  status?: string;
  // 输出内容（通常是 JSON 字符串）
  output?: string;
  // 错误信息
  error?: string;
  error_message?: string;
  // Token 消耗
  token?: number;
  tokens?: number;
  // 其他字段
  [key: string]: unknown;
}

/**
 * 获取 Coze API 基础地址
 * 默认使用 https://api.coze.cn
 */
function getBaseUrl(): string {
  return process.env.COZE_BASE_URL || "https://api.coze.cn";
}

/**
 * 获取 Coze API Token
 * 未配置时抛出错误
 */
function getApiToken(): string {
  const token = process.env.COZE_API_TOKEN;
  if (!token) {
    throw new Error("COZE_API_TOKEN 未配置");
  }
  return token;
}

/**
 * 构造 Coze API 请求头
 */
function buildHeaders(): HeadersInit {
  return {
    Authorization: `Bearer ${getApiToken()}`,
    "Content-Type": "application/json",
  };
}

/**
 * 统一错误处理：从 Coze 响应中提取错误信息并抛出
 */
function throwCozeError(response: CozeApiResponse, fallback: string): never {
  const message =
    response.msg ||
    response.message ||
    response.detail?.reason ||
    fallback;
  throw new Error(message);
}

/**
 * 提交 Coze 工作流异步任务
 *
 * 使用 /v1/workflow/run 接口 + is_async=true 实现异步执行
 * 返回 execute_id 供后续查询使用
 *
 * @param workflowId Coze 工作流 ID
 * @param parameters 工作流参数（如 { input: imageUrl }）
 * @returns { executeId } Coze 执行 ID
 */
export async function submitWorkflowTask(
  workflowId: string,
  parameters: Record<string, unknown>,
): Promise<{ executeId: string }> {
  const url = `${getBaseUrl()}/v1/workflow/run`;

  let response: CozeApiResponse<CozeAsyncRunData>;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: buildHeaders(),
      body: JSON.stringify({
        workflow_id: workflowId,
        parameters,
        is_async: true,
      }),
    });
    response = (await res.json()) as CozeApiResponse<CozeAsyncRunData>;
  } catch (error) {
    throw new Error(
      `调用 Coze workflow/run 接口失败：${error instanceof Error ? error.message : String(error)}`,
    );
  }

  // Coze 约定 code === 0 表示成功
  // 注意：execute_id 可能在顶层或 data 字段中
  if (response.code !== 0) {
    console.error("[Coze] 提交任务失败，完整响应:", JSON.stringify(response, null, 2));
    const message =
      response.msg ||
      response.message ||
      response.detail?.reason ||
      JSON.stringify(response) ||
      "提交 Coze 工作流任务失败";
    throw new Error(message);
  }

  // execute_id 可能在顶层或 data 字段中
  const executeId =
    response.execute_id ||
    response.data?.execute_id ||
    response.data?.task_id;
  if (!executeId) {
    console.error("[Coze] 响应中未包含 execute_id，完整响应:", JSON.stringify(response, null, 2));
    throw new Error("Coze 响应中未包含 execute_id");
  }

  return { executeId };
}

/**
 * 从 Coze 任务输出中提取视频 URL
 *
 * Coze 的 output 字段可能是：
 * - 字符串 URL
 * - JSON 字符串（如 {"output": "url"} / {"video": "url"}）
 * - 对象（已被 JSON 解析）
 *
 * @param output Coze 返回的 output 字段
 * @returns 视频 URL 字符串，未找到返回 undefined
 */
function extractVideoUrl(output: unknown): string | undefined {
  if (!output) return undefined;

  // output 为字符串
  if (typeof output === "string") {
    const trimmed = output.trim();

    // 情况1：output 本身就是 URL
    if (/^https?:\/\//i.test(trimmed)) {
      return trimmed;
    }

    // 情况2：尝试 JSON 解析
    try {
      const parsed = JSON.parse(trimmed);
      return extractFromObject(parsed);
    } catch {
      // 解析失败，尝试从字符串中匹配任何 URL
      const match = trimmed.match(/https?:\/\/[^\s"'<>]+/i);
      if (match) return match[0];
    }
    return undefined;
  }

  // output 为对象或数组
  if (typeof output === "object") {
    return extractFromObject(output);
  }

  return undefined;
}

/**
 * 从对象中递归查找视频 URL
 */
function extractFromObject(obj: unknown): string | undefined {
  if (!obj || typeof obj !== "object") return undefined;

  const record = obj as Record<string, unknown>;

  // 常见字段名（优先级高）
  const urlKeys = [
    "video", "url", "output", "video_url", "videoUrl",
    "result", "data", "file", "file_url", "download_url",
    "video_link", "videoLink", "link", "src", "source",
    "media", "media_url", "mediaUrl",
  ];
  for (const key of urlKeys) {
    const value = record[key];
    if (typeof value === "string" && /^https?:\/\//i.test(value)) {
      return value;
    }
  }

  // 递归查找
  for (const key of Object.keys(record)) {
    const value = record[key];
    if (value && typeof value === "object") {
      const found = extractFromObject(value);
      if (found) return found;
    }
  }

  return undefined;
}

/**
 * 将 Coze 原始状态映射为内部统一状态
 *
 * Coze 状态值可能为：queued / running / success / failed 等
 */
function mapStatus(rawStatus: string | undefined): CozeTaskStatus {
  if (!rawStatus) return "running";
  const lower = rawStatus.toLowerCase();
  if (lower === "success" || lower === "completed") {
    return "completed";
  }
  if (lower === "fail" || lower === "failed" || lower === "error") {
    return "failed";
  }
  if (lower === "queued" || lower === "pending") {
    return "pending";
  }
  // 默认视为运行中
  return "running";
}

/**
 * 查询 Coze 任务状态
 *
 * 使用 /v1/workflows/:workflow_id/run_histories/:execute_id 接口
 * 查询异步工作流的执行结果
 *
 * @param executeId Coze 执行 ID（提交任务时返回的 execute_id）
 * @param workflowId Coze 工作流 ID
 * @returns 任务状态、输出（视频URL）、Token 消耗、错误信息
 */
export async function getTaskStatus(
  executeId: string,
  workflowId: string,
): Promise<CozeTaskResult> {
  const url = `${getBaseUrl()}/v1/workflows/${workflowId}/run_histories/${executeId}`;

  interface HistoryItem {
    execute_status?: string;
    output?: unknown;
    error_message?: string;
    usage?: {
      token_count?: number;
      tokens?: number;
    };
    [key: string]: unknown;
  }

  let response: CozeApiResponse<HistoryItem[]>;
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: buildHeaders(),
    });
    response = (await res.json()) as CozeApiResponse<HistoryItem[]>;
    // 打印完整响应用于调试
    console.error("[Coze] run_histories 完整响应:", JSON.stringify(response, null, 2));
  } catch (error) {
    throw new Error(
      `调用 Coze run_histories 接口失败：${error instanceof Error ? error.message : String(error)}`,
    );
  }

  // Coze 约定 code === 0 表示成功
  // 注意：data 可能在顶层或 data 字段中（与 submit 接口类似）
  if (response.code !== 0) {
    console.error("[Coze] 查询任务状态失败，完整响应:", JSON.stringify(response, null, 2));
    throwCozeError(response, "查询 Coze 任务状态失败");
  }

  // data 可能在 data 字段或顶层
  const historyData: HistoryItem[] =
    response.data ||
    (response as unknown as HistoryItem[]);

  // 如果 data 不是数组，尝试包装
  const items = Array.isArray(historyData) ? historyData : [historyData];
  const item = items[0];
  if (!item) {
    return { status: "running" };
  }

  const status = mapStatus(item.execute_status);
  const result: CozeTaskResult = { status };

  // 保存原始 output 用于调试
  result.rawOutput = item.output;

  // 提取视频 URL：优先从 output 字段提取
  let videoUrl = extractVideoUrl(item.output);

  // 如果 output 字段提取失败，尝试从整个 item 对象中查找
  if (!videoUrl) {
    videoUrl = extractFromObject(item);
  }
  if (videoUrl) {
    result.output = videoUrl;
  }

  // 提取 Token 消耗
  const tokensUsed = item.usage?.token_count ?? item.usage?.tokens;
  if (typeof tokensUsed === "number") {
    result.tokensUsed = tokensUsed;
  }

  // 提取错误信息
  if (status === "failed") {
    result.errorMessage = item.error_message || "任务执行失败";
  }

  return result;
}

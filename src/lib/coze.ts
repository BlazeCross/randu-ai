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
}

// Coze API 响应通用结构
interface CozeApiResponse<T = unknown> {
  code: number;
  msg?: string;
  message?: string;
  data?: T;
  detail?: {
    reason?: string;
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
 * @param workflowId Coze 工作流 ID
 * @param parameters 工作流参数（如 { input: imageUrl }）
 * @returns { taskId } Coze 任务 ID
 */
export async function submitWorkflowTask(
  workflowId: string,
  parameters: Record<string, unknown>,
): Promise<{ taskId: string }> {
  const url = `${getBaseUrl()}/v1/workflow/async_run`;

  let response: CozeApiResponse<CozeAsyncRunData>;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: buildHeaders(),
      body: JSON.stringify({
        workflow_id: workflowId,
        parameters,
      }),
    });
    response = (await res.json()) as CozeApiResponse<CozeAsyncRunData>;
  } catch (error) {
    // 网络或解析错误
    throw new Error(
      `调用 Coze async_run 接口失败：${error instanceof Error ? error.message : String(error)}`,
    );
  }

  // Coze 约定 code === 0 表示成功
  if (response.code !== 0 || !response.data) {
    throwCozeError(response, "提交 Coze 工作流任务失败");
  }

  const taskId = response.data.task_id || response.data.execute_id;
  if (!taskId) {
    throw new Error("Coze 响应中未包含 task_id 或 execute_id");
  }

  return { taskId };
}

/**
 * 从 Coze 任务输出中提取视频 URL
 *
 * Coze 的 output 字段通常是 JSON 字符串，可能包含：
 * - 直接的视频 URL 字符串
 * - { video: "url" } / { url: "url" } / { output: "url" } 等结构
 *
 * @param output Coze 返回的 output 字段
 * @returns 视频 URL 字符串，未找到返回 undefined
 */
function extractVideoUrl(output: string | undefined | null): string | undefined {
  if (!output) return undefined;

  // output 为字符串
  const trimmed = output.trim();

  // 情况1：output 本身就是视频 URL
  if (/^https?:\/\//i.test(trimmed) && /\.(mp4|mov|avi|mkv|webm|m4v)/i.test(trimmed)) {
    return trimmed;
  }

  // 情况2：尝试 JSON 解析
  try {
    const parsed = JSON.parse(trimmed);
    return extractFromObject(parsed);
  } catch {
    // 解析失败，尝试从字符串中匹配视频 URL
    const match = trimmed.match(/https?:\/\/[^\s"'<>]+\.(mp4|mov|avi|mkv|webm|m4v)/i);
    if (match) return match[0];
  }

  return undefined;
}

/**
 * 从对象中递归查找视频 URL
 */
function extractFromObject(obj: unknown): string | undefined {
  if (!obj || typeof obj !== "object") return undefined;

  const record = obj as Record<string, unknown>;

  // 常见字段名
  const urlKeys = ["video", "url", "output", "video_url", "videoUrl", "result", "data"];
  for (const key of urlKeys) {
    const value = record[key];
    if (typeof value === "string" && /^https?:\/\//i.test(value)) {
      return value;
    }
    if (typeof value === "string" && /\.(mp4|mov|avi|mkv|webm|m4v)/i.test(value)) {
      return value;
    }
  }

  // 递归查找一层
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
  if (lower === "failed" || lower === "error") {
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
 * @param taskId Coze 任务 ID
 * @returns 任务状态、输出（视频URL）、Token 消耗、错误信息
 */
export async function getTaskStatus(
  taskId: string,
): Promise<CozeTaskResult> {
  const url = `${getBaseUrl()}/v1/workflow/task/${taskId}`;

  let response: CozeApiResponse<CozeTaskData>;
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: buildHeaders(),
    });
    response = (await res.json()) as CozeApiResponse<CozeTaskData>;
  } catch (error) {
    throw new Error(
      `调用 Coze task 查询接口失败：${error instanceof Error ? error.message : String(error)}`,
    );
  }

  // Coze 约定 code === 0 表示成功
  if (response.code !== 0 || !response.data) {
    throwCozeError(response, "查询 Coze 任务状态失败");
  }

  const data = response.data;
  const status = mapStatus(data.status);

  const result: CozeTaskResult = { status };

  // 提取视频 URL（仅 completed 时有意义，但其他状态也尝试提取）
  const videoUrl = extractVideoUrl(data.output);
  if (videoUrl) {
    result.output = videoUrl;
  }

  // 提取 Token 消耗
  const tokensUsed = data.token ?? data.tokens;
  if (typeof tokensUsed === "number") {
    result.tokensUsed = tokensUsed;
  }

  // 提取错误信息
  if (status === "failed") {
    result.errorMessage = data.error || data.error_message || "任务执行失败";
  }

  return result;
}

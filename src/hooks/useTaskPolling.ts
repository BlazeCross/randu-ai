"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// localStorage 中存储 token 的键名（与 auth-context 保持一致）
const TOKEN_KEY = "randu_token";

// 任务状态类型
export type TaskStatus =
  | "idle"
  | "pending"
  | "running"
  | "completed"
  | "failed";

// 轮询接口返回结构
interface TaskStatusResponse {
  status: string;
  outputUrl: string | null;
  errorMessage: string | null;
  tokensUsed: number;
  createdAt: string;
  completedAt: string | null;
  _debug?: {
    rawOutput: unknown;
    message: string;
  };
}

// useTaskPolling 选项
interface UseTaskPollingOptions {
  // 轮询起始间隔（毫秒），默认 3000，后续按 backoffFactor 递增至 maxInterval
  interval?: number;
  // 轮询最大间隔（毫秒），默认 15000
  maxInterval?: number;
  // 退避因子，每次轮询后间隔乘以此值，默认 1.5
  backoffFactor?: number;
  // 超时时间（毫秒），默认 300000（5 分钟）
  timeout?: number;
}

// useTaskPolling 返回值
interface UseTaskPollingResult {
  status: TaskStatus;
  outputUrl: string | null;
  errorMessage: string | null;
  tokensUsed: number;
  isPolling: boolean;
  isTimeout: boolean;
  reset: () => void;
  debugInfo?: { rawOutput: unknown; message: string };
}

/**
 * useTaskPolling：任务状态轮询 Hook
 *
 * @param taskId UsageLog ID（创建任务时返回的 taskId），为 null 时不轮询
 * @param options.interval 轮询间隔，默认 5000ms
 * @param options.timeout 超时时间，默认 300000ms（5 分钟）
 *
 * 行为：
 * - taskId 不为 null 时，每 interval 毫秒调用 GET /api/task/{taskId}/status
 * - 请求头带 Authorization: Bearer <token>（从 localStorage 读取）
 * - 状态变为 completed/failed 时停止轮询
 * - 超时 timeout 时停止轮询，isTimeout=true
 * - reset() 重置状态，允许重新开始
 * - 组件卸载时清除定时器
 * - 网络错误时连续重试，不轻易放弃
 */
export function useTaskPolling(
  taskId: string | null,
  options: UseTaskPollingOptions = {},
): UseTaskPollingResult {
  const {
    interval = 3000,
    maxInterval = 15000,
    backoffFactor = 1.5,
    timeout = 300000,
  } = options;

  const [status, setStatus] = useState<TaskStatus>("idle");
  const [outputUrl, setOutputUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [tokensUsed, setTokensUsed] = useState<number>(0);
  const [isPolling, setIsPolling] = useState<boolean>(false);
  const [isTimeout, setIsTimeout] = useState<boolean>(false);
  const [debugInfo, setDebugInfo] = useState<
    { rawOutput: unknown; message: string } | undefined
  >(undefined);

  // 定时器与起始时间引用
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startTimeRef = useRef<number>(0);
  // 当前轮询间隔（指数退避：每次轮询后乘以 backoffFactor，上限 maxInterval）
  const currentIntervalRef = useRef<number>(interval);
  // 标记组件是否已卸载，避免卸载后 setState
  const isMountedRef = useRef<boolean>(true);
  // 持有最新的 scheduleNext 引用，用于递归调用（避免 useCallback 自引用导致的"先使用后声明"问题）
  const scheduleNextRef = useRef<(id: string) => void>(() => {});

  /**
   * 清除当前定时器
   */
  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  /**
   * 重置状态，允许重新开始
   */
  const reset = useCallback(() => {
    clearTimer();
    setStatus("idle");
    setOutputUrl(null);
    setErrorMessage(null);
    setTokensUsed(0);
    setIsPolling(false);
    setIsTimeout(false);
    setDebugInfo(undefined);
    startTimeRef.current = 0;
    // 重置轮询间隔为起始值
    currentIntervalRef.current = interval;
  }, [clearTimer, interval]);

  /**
   * 查询任务状态
   * 失败时返回 false 表示应停止轮询，true 表示可继续
   */
  const pollOnce = useCallback(
    async (id: string): Promise<boolean> => {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem(TOKEN_KEY)
          : null;

      if (!token) {
        // 无 token，停止轮询
        setErrorMessage("未登录或登录已过期");
        setStatus("failed");
        return false;
      }

      try {
        const res = await fetch(`/api/task/${id}/status`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          // HTTP 错误：401/404 等停止轮询，其他错误继续重试
          if (res.status === 401) {
            setErrorMessage("未授权，请重新登录");
            setStatus("failed");
            return false;
          }
          if (res.status === 404) {
            setErrorMessage("任务不存在");
            setStatus("failed");
            return false;
          }
          // 5xx 等错误：继续重试
          console.warn(`查询任务状态返回 ${res.status}，将重试`);
          return true;
        }

        const data = (await res.json()) as TaskStatusResponse;

        if (!isMountedRef.current) return false;

        // 更新状态
        const nextStatus = data.status as TaskStatus;
        setStatus(nextStatus);
        setOutputUrl(data.outputUrl);
        setErrorMessage(data.errorMessage);
        setTokensUsed(data.tokensUsed ?? 0);
        setDebugInfo(data._debug);

        // 终态：停止轮询
        if (nextStatus === "completed" || nextStatus === "failed") {
          return false;
        }

        // 继续轮询
        return true;
      } catch (error) {
        // 网络错误：继续重试
        console.warn("查询任务状态网络错误，将重试:", error);
        return true;
      }
    },
    [],
  );

  /**
   * 轮询调度：递归 setTimeout（指数退避）
   * 通过 scheduleNextRef 实现递归调用，避免 useCallback 自引用
   * 每次轮询后间隔按 backoffFactor 递增，上限 maxInterval，减轻长任务的服务器压力
   */
  const scheduleNext = useCallback(
    (id: string) => {
      // 检查超时
      if (
        startTimeRef.current > 0 &&
        Date.now() - startTimeRef.current >= timeout
      ) {
        if (isMountedRef.current) {
          setIsTimeout(true);
          setIsPolling(false);
        }
        return;
      }

      const delay = currentIntervalRef.current;
      timerRef.current = setTimeout(async () => {
        const shouldContinue = await pollOnce(id);
        if (!isMountedRef.current) return;
        if (shouldContinue) {
          // 指数退避：间隔递增，上限 maxInterval
          currentIntervalRef.current = Math.min(
            currentIntervalRef.current * backoffFactor,
            maxInterval,
          );
          scheduleNextRef.current(id);
        } else {
          setIsPolling(false);
        }
      }, delay);
    },
    [timeout, maxInterval, backoffFactor, pollOnce],
  );

  // 保持 scheduleNextRef 与最新的 scheduleNext 同步
  useEffect(() => {
    scheduleNextRef.current = scheduleNext;
  }, [scheduleNext]);

  // taskId 变化时启动/停止轮询
  useEffect(() => {
    isMountedRef.current = true;

    if (!taskId) {
      // 无 taskId，确保停止
      clearTimer();
      // 通过微任务延迟 setState，避免 effect 内同步 setState 触发级联渲染
      Promise.resolve().then(() => {
        if (isMountedRef.current) setIsPolling(false);
      });
      return;
    }

    // 启动轮询
    startTimeRef.current = Date.now();
    // 重置轮询间隔为起始值（指数退避起点）
    currentIntervalRef.current = interval;
    // 通过微任务延迟 setState，避免 effect 内同步 setState 触发级联渲染
    Promise.resolve().then(() => {
      if (!isMountedRef.current) return;
      setStatus("pending");
      setIsPolling(true);
      setIsTimeout(false);
      setOutputUrl(null);
      setErrorMessage(null);
      setTokensUsed(0);
    });

    // 立即执行第一次查询，然后调度后续
    (async () => {
      const shouldContinue = await pollOnce(taskId);
      if (!isMountedRef.current) return;
      if (shouldContinue) {
        scheduleNextRef.current(taskId);
      } else {
        setIsPolling(false);
      }
    })();

    // 清理函数
    return () => {
      isMountedRef.current = false;
      clearTimer();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId]);

  return {
    status,
    outputUrl,
    errorMessage,
    tokensUsed,
    isPolling,
    isTimeout,
    reset,
    debugInfo,
  };
}

"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";

// localStorage 中存储 token 的键名（与 auth-context 保持一致）
const TOKEN_KEY = "randu_token";

// 全局轮询 tick 间隔（毫秒）
const TICK_INTERVAL = 5000;
// 清理间隔（毫秒）
const CLEANUP_INTERVAL = 60000;
// 已结束且无订阅者的任务，超过此时间后清理（毫秒）
const CLEANUP_AFTER = 10 * 60 * 1000;

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

// 单个任务的内部状态
interface TaskState {
  status: TaskStatus;
  outputUrl: string | null;
  errorMessage: string | null;
  tokensUsed: number;
  isPolling: boolean;
  isTimeout: boolean;
  debugInfo?: { rawOutput: unknown; message: string };
  // 内部字段
  lastPolledAt: number;
  startedAt: number;
  currentInterval: number;
  version: number; // 递增版本号，用于 useSyncExternalStore 检测变化
  options: {
    interval: number;
    maxInterval: number;
    backoffFactor: number;
    timeout: number;
  };
  subscriberCount: number;
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

// ===== 模块级全局存储（单例，组件卸载不销毁，切页面不中断轮询）=====
const tasks = new Map<string, TaskState>();
const listeners = new Set<() => void>();
let tickHandle: ReturnType<typeof setInterval> | null = null;
let cleanupHandle: ReturnType<typeof setInterval> | null = null;

/** 通知所有订阅者状态已变化 */
function notifyListeners() {
  listeners.forEach((l) => l());
}

/** 查询单个任务状态（失败时保持原状态，等待下次轮询重试） */
async function pollTask(taskId: string) {
  const task = tasks.get(taskId);
  if (!task || !task.isPolling) return;

  const token =
    typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;

  if (!token) {
    task.status = "failed";
    task.errorMessage = "未登录或登录已过期";
    task.isPolling = false;
    task.version++;
    return;
  }

  try {
    const res = await fetch(`/api/task/${taskId}/status`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      if (res.status === 401) {
        task.status = "failed";
        task.errorMessage = "未授权，请重新登录";
        task.isPolling = false;
        task.version++;
        return;
      }
      if (res.status === 404) {
        task.status = "failed";
        task.errorMessage = "任务不存在";
        task.isPolling = false;
        task.version++;
        return;
      }
      // 5xx 等错误：继续重试，不改变状态
      return;
    }

    const data = (await res.json()) as TaskStatusResponse;
    task.status = data.status as TaskStatus;
    task.outputUrl = data.outputUrl;
    task.errorMessage = data.errorMessage;
    task.tokensUsed = data.tokensUsed ?? 0;
    task.debugInfo = data._debug;
    task.lastPolledAt = Date.now();
    task.version++;

    if (task.status === "completed" || task.status === "failed") {
      task.isPolling = false;
    } else {
      // 指数退避：间隔递增，上限 maxInterval
      task.currentInterval = Math.min(
        task.currentInterval * task.options.backoffFactor,
        task.options.maxInterval,
      );
    }
  } catch (error) {
    console.warn(`查询任务 ${taskId} 状态失败:`, error);
    // 网络错误：继续重试，不改变状态
  }
}

/** 启动全局轮询 tick（若已启动则跳过） */
function ensureGlobalTick() {
  if (tickHandle) return;

  // 轮询 tick：每 TICK_INTERVAL 毫秒检查所有 pending 任务
  tickHandle = setInterval(async () => {
    const now = Date.now();
    let changed = false;
    const tasksToPoll: string[] = [];

    for (const [taskId, task] of tasks.entries()) {
      if (!task.isPolling) continue;

      // 检查超时
      if (now - task.startedAt >= task.options.timeout) {
        task.isTimeout = true;
        task.isPolling = false;
        task.version++;
        changed = true;
        continue;
      }

      // 检查是否到了轮询时间
      if (now - task.lastPolledAt >= task.currentInterval) {
        tasksToPoll.push(taskId);
      }
    }

    // 并行轮询到期任务
    if (tasksToPoll.length > 0) {
      await Promise.all(tasksToPoll.map((id) => pollTask(id)));
      changed = true;
    }

    if (changed) {
      notifyListeners();
    }

    // 如果没有正在轮询的任务，停止 tick 节省资源
    let anyPolling = false;
    for (const task of tasks.values()) {
      if (task.isPolling) {
        anyPolling = true;
        break;
      }
    }
    if (!anyPolling && tickHandle) {
      clearInterval(tickHandle);
      tickHandle = null;
    }
  }, TICK_INTERVAL);

  // 清理 tick：定期清理已结束且无订阅者的旧任务，避免内存泄漏
  if (!cleanupHandle) {
    cleanupHandle = setInterval(() => {
      const now = Date.now();
      let changed = false;
      for (const [taskId, task] of tasks.entries()) {
        if (
          !task.isPolling &&
          task.subscriberCount === 0 &&
          now - task.lastPolledAt > CLEANUP_AFTER
        ) {
          tasks.delete(taskId);
          changed = true;
        }
      }
      if (changed) notifyListeners();
    }, CLEANUP_INTERVAL);
  }
}

/**
 * useTaskPolling：任务状态轮询 Hook（全局单例，切页面不中断）
 *
 * 架构：
 * - 模块级 Map 存储所有任务状态，组件卸载不销毁
 * - 单一全局 setInterval 批量轮询所有 pending 任务
 * - useSyncExternalStore 订阅状态变化，自动触发 re-render
 * - 组件卸载仅取消订阅（subscriberCount--），轮询继续
 * - 任务终态后 10 分钟无订阅者自动清理
 *
 * @param taskId UsageLog ID（创建任务时返回的 taskId），为 null 时不轮询
 * @param options.interval 轮询起始间隔，默认 3000ms
 * @param options.maxInterval 轮询最大间隔，默认 15000ms
 * @param options.backoffFactor 退避因子，默认 1.5
 * @param options.timeout 超时时间，默认 300000ms（5 分钟）
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

  // useSyncExternalStore：订阅外部 store 变化，自动触发 re-render
  const subscribeStore = useCallback((onStoreChange: () => void) => {
    listeners.add(onStoreChange);
    return () => {
      listeners.delete(onStoreChange);
    };
  }, []);

  // 返回当前任务的版本号，版本号变化时触发 re-render
  const getSnapshot = useCallback(() => {
    if (!taskId) return 0;
    return tasks.get(taskId)?.version ?? 0;
  }, [taskId]);

  // SSR 快照：服务端无任务状态，返回 0
  const getServerSnapshot = useCallback(() => 0, []);

  useSyncExternalStore(subscribeStore, getSnapshot, getServerSnapshot);

  // 订阅/取消订阅任务（taskId 变化时触发）
  useEffect(() => {
    if (!taskId) return;

    const existing = tasks.get(taskId);
    if (existing) {
      // 任务已存在（用户切回页面）：增加订阅计数
      existing.subscriberCount++;
    } else {
      // 新任务：创建状态并立即触发第一次轮询
      const task: TaskState = {
        status: "pending",
        outputUrl: null,
        errorMessage: null,
        tokensUsed: 0,
        isPolling: true,
        isTimeout: false,
        lastPolledAt: 0,
        startedAt: Date.now(),
        currentInterval: interval,
        version: 1,
        options: { interval, maxInterval, backoffFactor, timeout },
        subscriberCount: 1,
      };
      tasks.set(taskId, task);
      // 立即通知，让组件看到 pending 状态
      notifyListeners();
      // 立即触发第一次轮询（不等 tick）
      pollTask(taskId).then(() => notifyListeners());
    }

    // 确保全局轮询 tick 正在运行
    ensureGlobalTick();

    // 清理函数：仅取消订阅，轮询继续（切页面不中断）
    return () => {
      const task = tasks.get(taskId);
      if (task) {
        task.subscriberCount = Math.max(0, task.subscriberCount - 1);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId]);

  // 读取当前状态
  const taskState = taskId ? tasks.get(taskId) : undefined;

  // 重置：删除任务状态，允许重新开始
  const reset = useCallback(() => {
    if (!taskId) return;
    tasks.delete(taskId);
    notifyListeners();
  }, [taskId]);

  return {
    status: taskState?.status ?? "idle",
    outputUrl: taskState?.outputUrl ?? null,
    errorMessage: taskState?.errorMessage ?? null,
    tokensUsed: taskState?.tokensUsed ?? 0,
    isPolling: taskState?.isPolling ?? false,
    isTimeout: taskState?.isTimeout ?? false,
    reset,
    debugInfo: taskState?.debugInfo,
  };
}

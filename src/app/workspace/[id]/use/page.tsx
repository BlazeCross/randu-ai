"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useTaskPolling } from "@/hooks/useTaskPolling";
import ImageUploader from "@/components/upload/ImageUploader";
import UpgradePrompt from "@/components/upgrade/UpgradePrompt";
import ErrorMessage from "@/components/ui/ErrorMessage";
import {
  TRIAL_LIMIT,
  getTrialDaysRemaining,
  isTrialExpired,
} from "@/lib/trial";

// 工作流详情类型（对应 /api/workflow/[id] 返回的 workflow 字段）
interface WorkflowDetail {
  id: string;
  name: string;
  description: string | null;
  category: string;
  icon: string | null;
  status: string;
  feishuDocUrl: string | null;
}

// 使用记录接口返回结构（仅含试用状态所需字段）
interface UsageData {
  trialUsageCount: number;
  trialLimit: number;
  trialExpiresAt: string;
  isTrialExpired: boolean;
}

// 升级提示原因
type UpgradeReason = "limit_reached" | "expired";

// 使用说明步骤
const USAGE_STEPS = [
  { num: 1, text: "上传图片" },
  { num: 2, text: "点击生成" },
  { num: 3, text: "等待处理" },
  { num: 4, text: "下载视频" },
];

/**
 * 格式化已等待时间为 MM:SS 格式
 */
function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

/**
 * 加载中旋转图标
 */
function Spinner({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      className={`${className} animate-spin`}
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth={4}
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

export default function WorkflowUsePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user, token, loading: authLoading } = useAuth();

  const workflowId = params?.id;

  // 工作流详情
  const [workflow, setWorkflow] = useState<WorkflowDetail | null>(null);
  const [workflowLoading, setWorkflowLoading] = useState(true);

  // 上传的图片 URL
  const [imageUrl, setImageUrl] = useState<string>("");
  // 上传错误提示
  const [uploadError, setUploadError] = useState<string>("");

  // 提交状态
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>("");
  // 当前任务 ID（非 null 时启动轮询）
  const [taskId, setTaskId] = useState<string | null>(null);

  // 已等待时间（秒）
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const elapsedTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 试用使用状态（来自 /api/user/usage）
  const [usageData, setUsageData] = useState<UsageData | null>(null);
  // 升级提示弹窗：null 表示不显示
  const [upgradeReason, setUpgradeReason] = useState<UpgradeReason | null>(null);

  // 任务轮询：5 分钟超时
  const {
    status: taskStatus,
    outputUrl,
    errorMessage: taskError,
    tokensUsed,
    isPolling,
    isTimeout,
    reset: resetPolling,
  } = useTaskPolling(taskId, { timeout: 300000 });

  /**
   * 获取工作流详情（公开接口，无需鉴权）
   * workflowLoading 初始值为 true，无需在 effect 内同步设置
   */
  useEffect(() => {
    if (!workflowId) return;
    let cancelled = false;
    fetch(`/api/workflow/${workflowId}`, { cache: "no-store" })
      .then((res) => {
        if (!res.ok) throw new Error("获取工作流详情失败");
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;
        const wf = (data as { workflow?: WorkflowDetail }).workflow;
        if (wf) setWorkflow(wf);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("获取工作流详情失败:", err);
      })
      .finally(() => {
        if (!cancelled) setWorkflowLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [workflowId]);

  /**
   * 获取试用使用状态（需鉴权）
   * 仅在已登录（有 token）时调用，用于显示试用次数提示横幅
   */
  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    fetch("/api/user/usage", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: UsageData | null) => {
        if (cancelled || !data) return;
        setUsageData(data);
      })
      .catch(() => {
        // 获取试用状态失败，静默处理
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  /**
   * 已等待时间计时器：轮询开始时启动，结束时停止
   * elapsedSeconds 在 handleGenerate/handleReset 中重置为 0
   */
  useEffect(() => {
    if (isPolling) {
      elapsedTimerRef.current = setInterval(() => {
        setElapsedSeconds((s) => s + 1);
      }, 1000);
    } else {
      if (elapsedTimerRef.current) {
        clearInterval(elapsedTimerRef.current);
        elapsedTimerRef.current = null;
      }
    }
    return () => {
      if (elapsedTimerRef.current) {
        clearInterval(elapsedTimerRef.current);
        elapsedTimerRef.current = null;
      }
    };
  }, [isPolling]);

  // 上传成功回调
  const handleUploadSuccess = useCallback((url: string) => {
    setImageUrl(url);
    setUploadError("");
    setSubmitError("");
  }, []);

  // 上传失败回调
  const handleUploadError = useCallback((error: string) => {
    setUploadError(error);
  }, []);

  /**
   * 提交生成视频
   * 调用 POST /api/workflow/[id]/run，请求头带 Authorization
   * 若返回 403（试用次数用完），弹出升级提示并阻止后续提交
   */
  const handleGenerate = useCallback(async () => {
    if (!imageUrl || !token || !workflowId) return;
    setSubmitting(true);
    setSubmitError("");
    setElapsedSeconds(0);
    try {
      const res = await fetch(`/api/workflow/${workflowId}/run`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ imageUrl }),
      });
      const data = await res.json();
      if (!res.ok) {
        // 403：试用过期或次数用完，弹出升级提示
        if (res.status === 403) {
          const msg =
            typeof data?.message === "string"
              ? data.message
              : "试用次数已用完，请升级套餐";
          // 根据消息内容区分过期与次数用完
          setUpgradeReason(msg.includes("过期") ? "expired" : "limit_reached");
          setSubmitError(msg);
          return;
        }
        setSubmitError(
          typeof data?.message === "string" ? data.message : "提交任务失败",
        );
        return;
      }
      if (typeof data?.taskId === "string") {
        setTaskId(data.taskId);
      } else {
        setSubmitError("提交任务响应格式错误");
      }
    } catch (err) {
      console.error("提交任务失败:", err);
      setSubmitError("网络错误，提交任务失败");
    } finally {
      setSubmitting(false);
    }
  }, [imageUrl, token, workflowId]);

  /**
   * 重置状态：清除任务，允许重新上传或重新生成
   * 保留 imageUrl，用户可使用同一张图重新生成
   */
  const handleReset = useCallback(() => {
    resetPolling();
    setTaskId(null);
    setSubmitError("");
    setElapsedSeconds(0);
  }, [resetPolling]);

  // 页面状态派生
  const isCompleted = taskStatus === "completed";
  const isFailed = taskStatus === "failed";
  const showProgress = (submitting || isPolling) && !isCompleted && !isFailed && !isTimeout;
  const showGenerateButton = !isCompleted && !isFailed && !isTimeout;

  // 试用状态派生
  const isSubscribed = Boolean(user?.isSubscribed);
  const trialUsageCount = usageData?.trialUsageCount ?? 0;
  const trialLimit = usageData?.trialLimit ?? TRIAL_LIMIT;
  const trialExpiresAt = usageData?.trialExpiresAt ?? user?.trialExpiresAt ?? "";
  // 优先使用后端返回的 isTrialExpired，兜底用前端工具函数计算
  const trialExpired =
    usageData?.isTrialExpired ?? (trialExpiresAt ? isTrialExpired(trialExpiresAt) : false);
  const trialDaysRemaining = trialExpiresAt ? getTrialDaysRemaining(trialExpiresAt) : 0;
  const trialRemainingCount = Math.max(trialLimit - trialUsageCount, 0);
  // 试用次数已用完（未订阅且达到上限）
  const trialLimitReached = !isSubscribed && trialUsageCount >= trialLimit;
  // 是否允许提交：已订阅不受限；未订阅需试用未过期且次数未用完
  const canGenerate =
    Boolean(imageUrl) &&
    !submitting &&
    !isPolling &&
    (isSubscribed || (!trialExpired && !trialLimitReached));

  // 当前状态文案
  const currentStatusLabel = (() => {
    if (submitting) return "提交中";
    if (isTimeout) return "已超时";
    if (isCompleted) return "已完成";
    if (isFailed) return "失败";
    if (taskStatus === "running") return "处理中";
    if (taskStatus === "pending") return "排队中";
    return "准备中";
  })();

  return (
    <main className="flex-1 bg-neutral-50">
      {/* 面包屑 */}
      <div className="border-b border-neutral-200 bg-white">
        <nav
          aria-label="面包屑"
          className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8"
        >
          <ol className="flex flex-wrap items-center gap-2 text-sm text-neutral-500">
            <li>
              <Link href="/" className="hover:text-primary">
                首页
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li>
              <Link href="/workspace" className="hover:text-primary">
                工作台
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li>
              {workflow ? (
                <Link
                  href={`/workflow/${workflow.id}`}
                  className="hover:text-primary"
                >
                  {workflow.name}
                </Link>
              ) : (
                <span>工作流</span>
              )}
            </li>
            <li aria-hidden>/</li>
            <li className="font-medium text-neutral-900" aria-current="page">
              使用
            </li>
          </ol>
        </nav>
      </div>

      {/* 主体内容 */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        {/* 页面标题 */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">
            {workflow ? workflow.name : "工作流使用"}
          </h1>
          {workflow?.description && (
            <p className="mt-2 text-sm text-neutral-600">
              {workflow.description}
            </p>
          )}
        </div>

        {/* 加载中状态 */}
        {authLoading || workflowLoading ? (
          <div className="flex items-center justify-center py-20">
            <Spinner className="h-10 w-10 text-primary" />
          </div>
        ) : /* 工作流不存在 */ !workflow ? (
          <div className="rounded-2xl border border-neutral-200 bg-white p-12 text-center">
            <p className="text-sm text-neutral-600">
              工作流不存在或已下架
            </p>
            <Link
              href="/workspace"
              className="mt-4 inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover"
            >
              返回工作台
            </Link>
          </div>
        ) : /* 未登录提示 */ !user || !token ? (
          <div className="rounded-2xl border border-neutral-200 bg-white p-12 text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100">
              <svg
                className="h-8 w-8 text-neutral-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <h2 className="mb-2 text-xl font-semibold text-neutral-900">
              请先登录
            </h2>
            <p className="mb-6 text-sm text-neutral-500">
              登录后即可使用 AI 工作流生成视频
            </p>
            <button
              type="button"
              onClick={() => router.push("/login")}
              className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-primary-600/25 transition-all hover:bg-primary-hover"
            >
              前往登录
            </button>
          </div>
        ) : (
          <>
            {/* 试用次数提示横幅：已订阅用户不显示 */}
            {!isSubscribed && (
              <>
                {/* 试用已过期 */}
                {trialExpired ? (
                  <div className="mb-6 flex flex-col items-start justify-between gap-4 rounded-2xl border border-red-200 bg-red-50 p-5 sm:flex-row sm:items-center">
                    <div className="flex items-start gap-3">
                      <svg
                        className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <div>
                        <p className="text-sm font-semibold text-red-900">
                          试用已过期，请升级套餐继续使用
                        </p>
                        <p className="mt-0.5 text-xs text-red-700">
                          您的 7 天试用期已结束，升级后即可无限制使用
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setUpgradeReason("expired")}
                      className="inline-flex flex-shrink-0 items-center justify-center rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-red-700"
                    >
                      升级套餐
                    </button>
                  </div>
                ) : (
                  /* 试用中：显示使用次数与进度条 */
                  <div
                    className={`mb-6 rounded-2xl border p-5 ${
                      trialLimitReached
                        ? "border-amber-200 bg-amber-50"
                        : "border-primary-200 bg-primary-50/50"
                    }`}
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-3">
                        <svg
                          className={`h-5 w-5 flex-shrink-0 ${
                            trialLimitReached ? "text-amber-600" : "text-primary-600"
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <div>
                          <p
                            className={`text-sm font-semibold ${
                              trialLimitReached ? "text-amber-900" : "text-neutral-900"
                            }`}
                          >
                            {trialLimitReached
                              ? `试用次数已用完：已使用 ${trialUsageCount}/${trialLimit} 次`
                              : `试用中：已使用 ${trialUsageCount}/${trialLimit} 次，剩余 ${trialRemainingCount} 次`}
                          </p>
                          <p
                            className={`mt-0.5 text-xs ${
                              trialLimitReached ? "text-amber-700" : "text-neutral-500"
                            }`}
                          >
                            {trialLimitReached
                              ? "试用额度已用完，升级套餐即可继续使用"
                              : `试用期剩余 ${trialDaysRemaining} 天`}
                          </p>
                        </div>
                      </div>
                      {trialLimitReached && (
                        <button
                          type="button"
                          onClick={() => setUpgradeReason("limit_reached")}
                          className="inline-flex flex-shrink-0 items-center justify-center rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-hover"
                        >
                          升级套餐
                        </button>
                      )}
                    </div>
                    {/* 进度条 */}
                    <div className="mt-3">
                      <div className="h-2 w-full overflow-hidden rounded-full bg-white/60">
                        <div
                          className={`h-full rounded-full transition-all ${
                            trialLimitReached
                              ? "bg-amber-500"
                              : trialUsageCount / trialLimit >= 0.8
                                ? "bg-amber-500"
                                : "bg-primary"
                          }`}
                          style={{
                            width: `${Math.min((trialUsageCount / trialLimit) * 100, 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* 双列布局：左侧上传+生成+进度+结果，右侧使用说明+飞书文档 */}
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            {/* 左侧：操作区 */}
            <div className="space-y-6">
              {/* 图片上传区 */}
              <div className="rounded-2xl border border-neutral-200 bg-white p-6">
                <h2 className="mb-4 text-base font-semibold text-neutral-900">
                  上传图片
                </h2>
                <ImageUploader
                  onUploadSuccess={handleUploadSuccess}
                  onUploadError={handleUploadError}
                />
                {uploadError && (
                  <p className="mt-3 text-sm text-red-600">{uploadError}</p>
                )}
              </div>

              {/* 生成视频按钮 */}
              {showGenerateButton && (
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={!canGenerate}
                  className="flex w-full items-center justify-center rounded-xl bg-primary px-5 py-3.5 text-base font-semibold text-white shadow-lg shadow-primary-600/20 transition-all hover:bg-primary-hover hover:shadow-xl active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100"
                >
                  {submitting ? (
                    <>
                      <Spinner className="mr-2 h-5 w-5" />
                      提交中...
                    </>
                  ) : isPolling ? (
                    <>
                      <Spinner className="mr-2 h-5 w-5" />
                      生成中...
                    </>
                  ) : !imageUrl ? (
                    "请先上传图片"
                  ) : trialExpired ? (
                    "试用已过期，请升级套餐"
                  ) : trialLimitReached ? (
                    "试用次数已用完，请升级套餐"
                  ) : (
                    "生成视频"
                  )}
                </button>
              )}

              {/* 提交错误提示 */}
              {submitError && (
                <ErrorMessage
                  message={submitError}
                  onRetry={canGenerate ? handleGenerate : undefined}
                />
              )}

              {/* 进度展示区 */}
              {showProgress && (
                <div className="animate-fade-in rounded-2xl border border-primary-200 bg-primary-50/50 p-6">
                  {/* 状态指示 + 已等待时间 */}
                  <div className="mb-4 flex items-center justify-between">
                    <span className="inline-flex items-center rounded-full bg-primary-100 px-3 py-0.5 text-xs font-medium text-primary-700">
                      {currentStatusLabel}
                    </span>
                    {isPolling && (
                      <span className="text-sm text-neutral-500">
                        已等待 {formatElapsed(elapsedSeconds)}
                      </span>
                    )}
                  </div>

                  {/* 进度条（CSS 动画模拟） */}
                  <div className="h-3 w-full overflow-hidden rounded-full bg-neutral-200">
                    <div className="animate-workflow-progress h-full rounded-full bg-primary" />
                  </div>

                  {/* 等待文案 */}
                  <div className="mt-4 text-center">
                    <p className="text-base font-medium text-neutral-900">
                      AI正在努力生成中，请稍候...
                    </p>
                    <p className="mt-1 text-sm text-neutral-500">
                      视频生成约需5分钟，请耐心等待
                    </p>
                  </div>
                </div>
              )}

              {/* 视频结果展示 */}
              {isCompleted && (
                <div className="animate-fade-in rounded-2xl border border-success-200 bg-success-50/50 p-6">
                  <div className="mb-4 flex items-center gap-2">
                    <svg
                      className="h-5 w-5 text-success-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <h3 className="text-base font-semibold text-neutral-900">
                      视频生成完成
                    </h3>
                    {tokensUsed > 0 && (
                      <span className="ml-auto text-sm text-neutral-500">
                        消耗 {tokensUsed} tokens
                      </span>
                    )}
                  </div>

                  {outputUrl ? (
                    <>
                      {/* 视频预览 */}
                      <video
                        src={outputUrl}
                        controls
                        autoPlay
                        className="w-full rounded-xl bg-black"
                      />

                      {/* 操作按钮 */}
                      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                        {/* 下载视频 */}
                        <a
                          href={outputUrl}
                          download
                          className="inline-flex flex-1 items-center justify-center rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
                        >
                          <svg
                            className="mr-2 h-4 w-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            strokeWidth={2}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                            />
                          </svg>
                          下载视频
                        </a>
                        {/* 重新生成 */}
                        <button
                          type="button"
                          onClick={handleReset}
                          className="inline-flex flex-1 items-center justify-center rounded-xl border border-neutral-300 bg-white px-5 py-3 text-sm font-semibold text-neutral-700 transition-colors hover:border-primary hover:text-primary"
                        >
                          重新生成
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* outputUrl 为空的异常情况 */}
                      <p className="mb-4 text-sm text-red-700">
                        结果获取失败，请重试
                      </p>
                      <button
                        type="button"
                        onClick={handleReset}
                        className="inline-flex items-center justify-center rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
                      >
                        重试
                      </button>
                    </>
                  )}
                </div>
              )}

              {/* 失败提示 */}
              {isFailed && (
                <div className="animate-fade-in rounded-2xl border border-red-200 bg-red-50 p-6">
                  <div className="mb-4 flex items-center gap-2">
                    <svg
                      className="h-5 w-5 text-red-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <h3 className="text-base font-semibold text-neutral-900">
                      生成失败
                    </h3>
                  </div>
                  <ErrorMessage
                    message={taskError || "任务执行失败，请重试"}
                    onRetry={handleReset}
                  />
                </div>
              )}

              {/* 超时提示 */}
              {isTimeout && (
                <div className="animate-fade-in rounded-2xl border border-amber-200 bg-amber-50 p-6">
                  <div className="mb-4 flex items-center gap-2">
                    <svg
                      className="h-5 w-5 text-amber-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <h3 className="text-base font-semibold text-neutral-900">
                      生成超时
                    </h3>
                  </div>
                  <ErrorMessage
                    message="生成超时，请稍后重试"
                    type="warning"
                    onRetry={handleReset}
                  />
                </div>
              )}
            </div>

            {/* 右侧：使用说明 + 飞书文档 */}
            <div className="space-y-6">
              {/* 使用说明卡片 */}
              <div className="rounded-2xl border border-neutral-200 bg-white p-6">
                <h2 className="mb-4 text-base font-semibold text-neutral-900">
                  使用说明
                </h2>
                <ol className="space-y-4">
                  {USAGE_STEPS.map((step) => (
                    <li key={step.num} className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">
                        {step.num}
                      </div>
                      <span className="text-sm text-neutral-700">
                        {step.text}
                      </span>
                    </li>
                  ))}
                </ol>
              </div>

              {/* 飞书文档跳转 */}
              <div className="rounded-2xl border border-neutral-200 bg-white p-6">
                <h3 className="mb-2 text-base font-semibold text-neutral-900">
                  详细教程
                </h3>
                <p className="mb-4 text-sm text-neutral-500">
                  查看飞书文档获取更详细的使用指南
                </p>
                {workflow.feishuDocUrl ? (
                  <a
                    href={workflow.feishuDocUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center rounded-xl border border-neutral-300 bg-white px-5 py-3 text-sm font-semibold text-neutral-700 transition-colors hover:border-primary hover:text-primary"
                  >
                    查看详细教程
                    <svg
                      className="ml-2 h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                  </a>
                ) : (
                  <span className="inline-flex items-center justify-center rounded-xl border border-dashed border-neutral-300 bg-neutral-50 px-5 py-3 text-sm font-medium text-neutral-400">
                    暂无教程
                  </span>
                )}
              </div>
            </div>
          </div>
          </>
        )}
      </div>

      {/* 升级套餐提示弹窗：提交返回 403 或试用过期时显示 */}
      {upgradeReason && (
        <UpgradePrompt
          reason={upgradeReason}
          onClose={() => setUpgradeReason(null)}
        />
      )}
    </main>
  );
}

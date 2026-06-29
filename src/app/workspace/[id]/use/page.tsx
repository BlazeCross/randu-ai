"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useTaskPolling } from "@/hooks/useTaskPolling";
import ImageUploader from "@/components/upload/ImageUploader";
import DynamicForm, { type FormValues } from "@/components/workflow/DynamicForm";
import UpgradePrompt from "@/components/upgrade/UpgradePrompt";
import ErrorMessage from "@/components/ui/ErrorMessage";
import {
  TRIAL_LIMIT,
  getTrialDaysRemaining,
  isTrialExpired,
} from "@/lib/trial";
import type {
  InputSchema,
  WorkflowOutputType,
} from "@/lib/schema";

// 工作流详情类型（对应 /api/workflow/[id] 返回的 workflow 字段）
interface WorkflowDetail {
  id: string;
  name: string;
  description: string | null;
  category: string;
  icon: string | null;
  status: string;
  feishuDocUrl: string | null;
  // Phase 2.4：动态表单所需字段
  inputSchema: InputSchema | null;
  outputType: WorkflowOutputType;
  creditsRequired: number;
  source: "coze" | "volcengine";
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
  { num: 1, text: "填写输入内容" },
  { num: 2, text: "点击提交任务" },
  { num: 3, text: "等待处理" },
  { num: 4, text: "查看与下载结果" },
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

  // === 旧逻辑保留：无 inputSchema 时使用单一 imageUrl ===
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
    debugInfo,
  } = useTaskPolling(taskId, { timeout: 300000 });

  /**
   * 获取工作流详情（公开接口，无需鉴权）
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
        // 静默处理
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  /**
   * 已等待时间计时器：轮询开始时启动，结束时停止
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

  // 上传成功回调（旧逻辑保留）
  const handleUploadSuccess = useCallback((url: string) => {
    setImageUrl(url);
    setUploadError("");
    setSubmitError("");
  }, []);

  // 上传失败回调（旧逻辑保留）
  const handleUploadError = useCallback((error: string) => {
    setUploadError(error);
  }, []);

  /**
   * 提交任务（动态表单模式）
   * 由 DynamicForm 触发，values 为字段名→值的对象
   */
  const handleDynamicSubmit = useCallback(
    async (values: FormValues) => {
      if (!token || !workflowId) return;
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
          body: JSON.stringify(values),
        });
        const data = await res.json();
        if (!res.ok) {
          if (res.status === 403) {
            const msg =
              typeof data?.message === "string"
                ? data.message
                : "试用次数已用完，请升级套餐";
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
    },
    [token, workflowId],
  );

  /**
   * 提交任务（旧模式：单一 imageUrl）
   * 用于无 inputSchema 的工作流
   */
  const handleLegacyGenerate = useCallback(async () => {
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
        if (res.status === 403) {
          const msg =
            typeof data?.message === "string"
              ? data.message
              : "试用次数已用完，请升级套餐";
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
   * 重置状态：清除任务，允许重新提交
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
  const trialExpired =
    usageData?.isTrialExpired ?? (trialExpiresAt ? isTrialExpired(trialExpiresAt) : false);
  const trialDaysRemaining = trialExpiresAt ? getTrialDaysRemaining(trialExpiresAt) : 0;
  const trialRemainingCount = Math.max(trialLimit - trialUsageCount, 0);
  const trialLimitReached = !isSubscribed && trialUsageCount >= trialLimit;
  // 是否允许提交：已订阅不受限；未订阅需试用未过期且次数未用完
  const canSubmit =
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

  // 派生：是否使用动态表单
  const useDynamicForm = Boolean(workflow?.inputSchema);
  // 旧模式提交按钮可用条件
  const legacyCanGenerate =
    Boolean(imageUrl) && canSubmit;

  // 提交按钮禁用时的提示
  const submitDisabledHint = trialExpired
    ? "试用已过期，请升级套餐"
    : trialLimitReached
      ? "试用次数已用完，请升级套餐"
      : undefined;

  // 结果区域标题（按输出类型）
  const resultTitle = workflow
    ? workflow.outputType === "video"
      ? "视频生成完成"
      : workflow.outputType === "image"
        ? "图片生成完成"
        : "结果生成完成"
    : "结果生成完成";

  // 结果按钮文案
  const resultDownloadLabel = workflow
    ? workflow.outputType === "video"
      ? "下载视频"
      : workflow.outputType === "image"
        ? "下载图片"
        : "下载结果"
    : "下载结果";

  return (
    <main className="flex-1 bg-background">
      {/* 面包屑 */}
      <div className="border-b border-border bg-card">
        <nav
          aria-label="面包屑"
          className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8"
        >
          <ol className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
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
            <li className="font-medium text-foreground" aria-current="page">
              使用
            </li>
          </ol>
        </nav>
      </div>

      {/* 主体内容 */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        {/* 页面标题 */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {workflow ? workflow.name : "工作流使用"}
          </h1>
          {workflow?.description && (
            <p className="mt-2 text-sm text-muted-foreground">
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
          <div className="rounded-[var(--radius)] border border-border bg-card p-12 text-center">
            <p className="text-sm text-muted-foreground">
              工作流不存在或已下架
            </p>
            <Link
              href="/workspace"
              className="mt-4 inline-flex items-center rounded-full bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover"
            >
              返回工作台
            </Link>
          </div>
        ) : /* 未登录提示 */ !user || !token ? (
          <div className="rounded-[var(--radius)] border border-border bg-card p-12 text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <svg
                className="h-8 w-8 text-muted-foreground"
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
            <h2 className="mb-2 text-xl font-semibold text-foreground">
              请先登录
            </h2>
            <p className="mb-6 text-sm text-muted-foreground">
              登录后即可使用 AI 工作流
            </p>
            <button
              type="button"
              onClick={() => router.push("/login")}
              className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-primary-hover"
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
                  <div className="mb-6 flex flex-col items-start justify-between gap-4 rounded-[var(--radius)] border border-destructive/30 bg-destructive/10 p-5 sm:flex-row sm:items-center">
                    <div className="flex items-start gap-3">
                      <svg
                        className="mt-0.5 h-5 w-5 flex-shrink-0 text-destructive"
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
                        <p className="text-sm font-semibold text-foreground">
                          试用已过期，请升级套餐继续使用
                        </p>
                        <p className="mt-0.5 text-xs text-destructive">
                          您的 7 天试用期已结束，升级后即可无限制使用
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setUpgradeReason("expired")}
                      className="inline-flex flex-shrink-0 items-center justify-center rounded-full bg-destructive px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[color-mix(in_srgb,var(--destructive)_90%,#000)]"
                    >
                      升级套餐
                    </button>
                  </div>
                ) : (
                  /* 试用中：显示使用次数与进度条 */
                  <div
                    className={`mb-6 rounded-[var(--radius)] border p-5 ${
                      trialLimitReached
                        ? "border-accent bg-accent"
                        : "border-primary/30 bg-primary/10"
                    }`}
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-3">
                        <svg
                          className={`h-5 w-5 flex-shrink-0 ${
                            trialLimitReached ? "text-accent-foreground" : "text-primary"
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
                              trialLimitReached ? "text-foreground" : "text-foreground"
                            }`}
                          >
                            {trialLimitReached
                              ? `试用次数已用完：已使用 ${trialUsageCount}/${trialLimit} 次`
                              : `试用中：已使用 ${trialUsageCount}/${trialLimit} 次，剩余 ${trialRemainingCount} 次`}
                          </p>
                          <p
                            className={`mt-0.5 text-xs ${
                              trialLimitReached ? "text-accent-foreground" : "text-muted-foreground"
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
                          className="inline-flex flex-shrink-0 items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
                        >
                          升级套餐
                        </button>
                      )}
                    </div>
                    {/* 进度条 */}
                    <div className="mt-3">
                      <div className="h-2 w-full overflow-hidden rounded-full bg-card/60">
                        <div
                          className={`h-full rounded-full transition-all ${
                            trialLimitReached
                              ? "bg-accent"
                              : trialUsageCount / trialLimit >= 0.8
                                ? "bg-accent"
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

            {/* 双列布局：左侧表单+进度+结果，右侧使用说明+飞书文档 */}
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            {/* 左侧：操作区 */}
            <div className="space-y-6">
              {/* 动态表单区：根据 inputSchema 渲染 */}
              {useDynamicForm && workflow.inputSchema && showGenerateButton ? (
                <div className="rounded-[var(--radius)] border border-border bg-card p-6">
                  <h2 className="mb-4 text-base font-semibold text-foreground">
                    填写参数
                  </h2>
                  <DynamicForm
                    schema={workflow.inputSchema}
                    onSubmit={handleDynamicSubmit}
                    submitting={submitting || isPolling}
                    disabled={!canSubmit}
                    disabledHint={submitDisabledHint}
                  />
                </div>
              ) : /* 旧模式：单一图片上传 */ !useDynamicForm && showGenerateButton ? (
                <>
                  {/* 图片上传区 */}
                  <div className="rounded-[var(--radius)] border border-border bg-card p-6">
                    <h2 className="mb-4 text-base font-semibold text-foreground">
                      上传图片
                    </h2>
                    <ImageUploader
                      onUploadSuccess={handleUploadSuccess}
                      onUploadError={handleUploadError}
                    />
                    {uploadError && (
                      <p className="mt-3 text-sm text-destructive">{uploadError}</p>
                    )}
                  </div>

                  {/* 生成按钮 */}
                  <button
                    type="button"
                    onClick={handleLegacyGenerate}
                    disabled={!legacyCanGenerate}
                    className="flex w-full items-center justify-center rounded-full bg-primary px-5 py-3.5 text-base font-semibold text-white transition-all hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
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
                </>
              ) : null}

              {/* 提交错误提示 */}
              {submitError && (
                <ErrorMessage
                  message={submitError}
                  onRetry={
                    useDynamicForm
                      ? undefined
                      : legacyCanGenerate
                        ? handleLegacyGenerate
                        : undefined
                  }
                />
              )}

              {/* 进度展示区 */}
              {showProgress && (
                <div className="animate-fade-in rounded-[var(--radius)] border border-primary/30 bg-primary/10 p-6">
                  {/* 状态指示 + 已等待时间 */}
                  <div className="mb-4 flex items-center justify-between">
                    <span className="inline-flex items-center rounded-full bg-accent px-3 py-0.5 text-xs font-medium text-accent-foreground">
                      {currentStatusLabel}
                    </span>
                    {isPolling && (
                      <span className="text-sm text-muted-foreground">
                        已等待 {formatElapsed(elapsedSeconds)}
                      </span>
                    )}
                  </div>

                  {/* 进度条 */}
                  <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
                    <div className="animate-workflow-progress h-full rounded-full bg-primary" />
                  </div>

                  {/* 等待文案 */}
                  <div className="mt-4 text-center">
                    <p className="text-base font-medium text-foreground">
                      AI正在努力生成中，请稍候...
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      处理约需几分钟，请耐心等待
                    </p>
                  </div>
                </div>
              )}

              {/* 结果展示区 */}
              {isCompleted && (
                <div className="animate-fade-scale animate-fade-in rounded-[var(--radius)] border border-success/30 bg-success/10 p-6">
                  <div className="mb-4 flex items-center gap-2">
                    <svg
                      className="h-5 w-5 text-success"
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
                    <h3 className="text-base font-semibold text-foreground">
                      {resultTitle}
                    </h3>
                    {tokensUsed > 0 && (
                      <span className="ml-auto text-sm text-muted-foreground">
                        消耗 {tokensUsed} tokens
                      </span>
                    )}
                  </div>

                  {outputUrl ? (
                    <>
                      {/* 渲染结果预览：优先 outputType，同时自动检测 URL 类型 */}
                      {(() => {
                        // 自动检测：判断 URL 是否为视频或图片
                        const isVideoUrl =
                          workflow.outputType === "video" ||
                          /\.mp4(\?|$)/i.test(outputUrl) ||
                          /\/doubao-seedance/i.test(outputUrl);
                        const isImageUrl =
                          workflow.outputType === "image" ||
                          /\.(png|jpe?g|webp|gif|bmp|svg)(\?|$)/i.test(outputUrl);

                        if (isVideoUrl) {
                          return (
                            <video
                              src={outputUrl}
                              controls
                              autoPlay
                              className="w-full rounded-[var(--radius-sm)] bg-black"
                            />
                          );
                        }
                        if (isImageUrl) {
                          return (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={outputUrl}
                              alt="生成结果"
                              className="w-full rounded-[var(--radius-sm)] bg-muted"
                            />
                          );
                        }
                        // 文本类型：展示在 pre 块中
                        return (
                          <pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded-[var(--radius-sm)] bg-card p-4 text-sm text-foreground">
                            {outputUrl}
                          </pre>
                        );
                      })()}

                      {/* 操作按钮 */}
                      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                        {/* 下载/复制按钮：根据 URL 类型自动选择 */}
                        {(() => {
                          const isMediaUrl =
                            workflow.outputType === "video" ||
                            workflow.outputType === "image" ||
                            /\.mp4(\?|$)/i.test(outputUrl) ||
                            /\/doubao-seedance/i.test(outputUrl) ||
                            /\.(png|jpe?g|webp|gif|bmp|svg)(\?|$)/i.test(outputUrl);
                          return isMediaUrl ? (
                          /* 视频/图片结果：下载链接 */
                          <a
                            href={outputUrl}
                            download
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex flex-1 items-center justify-center rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
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
                            下载结果
                          </a>
                          ) : (
                          /* 文本结果：复制按钮 */
                          <button
                            type="button"
                            onClick={() => {
                              if (outputUrl) {
                                void navigator.clipboard.writeText(outputUrl);
                              }
                            }}
                            className="inline-flex flex-1 items-center justify-center rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
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
                                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                              />
                            </svg>
                            复制结果
                          </button>
                          );
                        })()}
                        {/* 重新生成 */}
                        <button
                          type="button"
                          onClick={handleReset}
                          className="inline-flex flex-1 items-center justify-center rounded-full border border-border bg-card px-5 py-3 text-sm font-semibold text-foreground transition-colors hover:border-primary hover:text-primary"
                        >
                          重新生成
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* outputUrl 为空的异常情况 */}
                      <p className="mb-4 text-sm text-destructive">
                        结果获取失败，请重试
                      </p>
                      {debugInfo && (
                        <details className="mb-4 rounded-[var(--radius-sm)] border border-border bg-background p-3">
                          <summary className="cursor-pointer text-xs font-medium text-muted-foreground">
                            调试信息（请截图发给开发者）
                          </summary>
                          <pre className="mt-2 max-h-60 overflow-auto text-xs text-foreground">
                            {JSON.stringify(debugInfo, null, 2)}
                          </pre>
                        </details>
                      )}
                      <button
                        type="button"
                        onClick={handleReset}
                        className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
                      >
                        重试
                      </button>
                    </>
                  )}
                </div>
              )}

              {/* 失败提示 */}
              {isFailed && (
                <div className="animate-fade-in rounded-[var(--radius)] border border-destructive/30 bg-destructive/10 p-6">
                  <div className="mb-4 flex items-center gap-2">
                    <svg
                      className="h-5 w-5 text-destructive"
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
                    <h3 className="text-base font-semibold text-foreground">
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
                <div className="animate-fade-in rounded-[var(--radius)] border border-accent bg-accent p-6">
                  <div className="mb-4 flex items-center gap-2">
                    <svg
                      className="h-5 w-5 text-accent-foreground"
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
                    <h3 className="text-base font-semibold text-foreground">
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
              <div className="rounded-[var(--radius)] border border-border bg-card p-6">
                <h2 className="mb-4 text-base font-semibold text-foreground">
                  使用说明
                </h2>
                <ol className="space-y-4">
                  {USAGE_STEPS.map((step) => (
                    <li key={step.num} className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">
                        {step.num}
                      </div>
                      <span className="text-sm text-foreground">
                        {step.text}
                      </span>
                    </li>
                  ))}
                </ol>
              </div>

              {/* 飞书文档跳转 */}
              <div className="rounded-[var(--radius)] border border-border bg-card p-6">
                <h3 className="mb-2 text-base font-semibold text-foreground">
                  详细教程
                </h3>
                <p className="mb-4 text-sm text-muted-foreground">
                  查看飞书文档获取更详细的使用指南
                </p>
                {workflow.feishuDocUrl ? (
                  <a
                    href={workflow.feishuDocUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center rounded-full border border-border bg-card px-5 py-3 text-sm font-semibold text-foreground transition-colors hover:border-primary hover:text-primary"
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
                  <span className="inline-flex items-center justify-center rounded-[var(--radius-sm)] border border-dashed border-border bg-background px-5 py-3 text-sm font-medium text-muted-foreground">
                    暂无教程
                  </span>
                )}
              </div>
            </div>
          </div>
          </>
        )}
      </div>

      {/* 升级套餐提示弹窗 */}
      {upgradeReason && (
        <UpgradePrompt
          reason={upgradeReason}
          onClose={() => setUpgradeReason(null)}
        />
      )}
    </main>
  );
}

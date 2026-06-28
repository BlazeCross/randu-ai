"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import WorkflowForm, {
  type WorkflowFormData,
  type WorkflowInitialData,
} from "@/components/admin/WorkflowForm";

/**
 * 编辑工作流页面
 *
 * - 通过 useParams 获取 id
 * - GET /api/admin/workflows/[id] 获取工作流详情
 * - 引用 WorkflowForm 组件，传入 initialData
 * - 提交时 PATCH /api/admin/workflows/[id]
 * - 成功后跳转 /admin/workflows
 */

// 后端返回的工作流详情结构（WorkflowInitialData 是组件期望的格式）
type WorkflowDetail = WorkflowInitialData;

export default function EditWorkflowPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const workflowId = params?.id;

  const [initialData, setInitialData] = useState<WorkflowDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  /**
   * 加载工作流详情
   */
  useEffect(() => {
    if (!workflowId) return;
    let cancelled = false;

    const token =
      typeof window !== "undefined"
        ? window.localStorage.getItem("randu_token")
        : null;

    if (!token) {
      setLoadError("登录已失效，请重新登录");
      setLoading(false);
      return;
    }

    fetch(`/api/admin/workflows/${workflowId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("加载工作流失败");
        return res.json();
      })
      .then((data: { workflow?: WorkflowDetail }) => {
        if (cancelled || !data.workflow) return;
        setInitialData(data.workflow);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("加载工作流失败:", err);
        setLoadError("加载工作流失败");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [workflowId]);

  /**
   * 提交更新
   */
  const handleSubmit = async (data: WorkflowFormData) => {
    if (!workflowId) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const token =
        typeof window !== "undefined"
          ? window.localStorage.getItem("randu_token")
          : null;

      if (!token) {
        setSubmitError("登录已失效，请重新登录");
        return;
      }

      const res = await fetch(`/api/admin/workflows/${workflowId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      const json = await res.json();
      if (!res.ok) {
        setSubmitError(
          typeof json?.message === "string" ? json.message : "更新工作流失败",
        );
        return;
      }

      // 更新成功，跳转列表页
      router.push("/admin/workflows");
    } catch (err) {
      console.error("更新工作流失败:", err);
      setSubmitError("网络错误，更新工作流失败");
    } finally {
      setSubmitting(false);
    }
  };

  // 加载中
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <svg
            className="h-10 w-10 animate-spin text-primary"
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
          <p className="text-sm text-muted-foreground">加载中...</p>
        </div>
      </div>
    );
  }

  // 加载失败
  if (loadError || !initialData) {
    return (
      <div className="space-y-6">
        <nav aria-label="面包屑" className="text-sm text-muted-foreground">
          <ol className="flex flex-wrap items-center gap-2">
            <li>
              <Link href="/admin" className="hover:text-primary">
                后台首页
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li>
              <Link href="/admin/workflows" className="hover:text-primary">
                工作流管理
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li className="font-medium text-foreground" aria-current="page">
              编辑工作流
            </li>
          </ol>
        </nav>
        <div className="rounded-[var(--radius-sm)] border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-sm text-red-700">
            {loadError || "工作流不存在或加载失败"}
          </p>
          <Link
            href="/admin/workflows"
            className="mt-4 inline-flex items-center rounded-[var(--radius-sm)] bg-gradient-to-r from-primary to-primary-500 px-4 py-2 text-sm font-medium text-white shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)]"
          >
            返回工作流管理
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 面包屑 */}
      <nav aria-label="面包屑" className="text-sm text-muted-foreground">
        <ol className="flex flex-wrap items-center gap-2">
          <li>
            <Link href="/admin" className="hover:text-primary">
              后台首页
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li>
            <Link href="/admin/workflows" className="hover:text-primary">
              工作流管理
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li className="font-medium text-foreground" aria-current="page">
            编辑工作流
          </li>
        </ol>
      </nav>

      {/* 页面标题 */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          编辑工作流
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {initialData.name ? `正在编辑：${initialData.name}` : "修改工作流配置"}
        </p>
      </div>

      {/* 错误提示 */}
      {submitError && (
        <div className="rounded-[var(--radius-sm)] border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700">{submitError}</p>
        </div>
      )}

      {/* 表单 */}
      <WorkflowForm
        initialData={initialData}
        onSubmit={handleSubmit}
        submitLabel="保存修改"
        submitting={submitting}
      />
    </div>
  );
}

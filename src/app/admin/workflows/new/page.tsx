"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import WorkflowForm, {
  type WorkflowFormData,
} from "@/components/admin/WorkflowForm";

/**
 * 新建工作流页面
 *
 * - 引用 WorkflowForm 组件（不传 initialData，使用默认值）
 * - 提交时 POST /api/admin/workflows
 * - 成功后跳转 /admin/workflows
 */
export default function NewWorkflowPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async (data: WorkflowFormData) => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      // 从 localStorage 读取 JWT token
      const token =
        typeof window !== "undefined"
          ? window.localStorage.getItem("randu_token")
          : null;

      if (!token) {
        setSubmitError("登录已失效，请重新登录");
        return;
      }

      const res = await fetch("/api/admin/workflows", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      const json = await res.json();
      if (!res.ok) {
        setSubmitError(
          typeof json?.message === "string" ? json.message : "创建工作流失败",
        );
        return;
      }

      // 创建成功，跳转列表页
      router.push("/admin/workflows");
    } catch (err) {
      console.error("创建工作流失败:", err);
      setSubmitError("网络错误，创建工作流失败");
    } finally {
      setSubmitting(false);
    }
  };

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
            新建工作流
          </li>
        </ol>
      </nav>

      {/* 页面标题 */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          新建工作流
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          创建一个新的工作流，配置输入参数后前台将自动生成对应表单
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
        onSubmit={handleSubmit}
        submitLabel="创建工作流"
        submitting={submitting}
      />
    </div>
  );
}

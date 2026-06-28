"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";

type ExportType = "users" | "callLogs" | "orders";

interface ExportOption {
  type: ExportType;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const EXPORT_OPTIONS: ExportOption[] = [
  {
    type: "users",
    label: "用户列表",
    description: "包含昵称、邮箱、角色、点数、订阅状态、创建时间等",
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-5.13a4 4 0 11-8 0 4 4 0 018 0zm6 0a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
  },
  {
    type: "callLogs",
    label: "API 调用日志",
    description: "包含接口、方法、状态、扣点、响应时间、客户端 IP 等",
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    type: "orders",
    label: "订单记录",
    description: "包含订单号、用户、类型、金额、支付方式、状态等",
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
  },
];

export default function ExportPage() {
  const { token } = useAuth();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [downloading, setDownloading] = useState<ExportType | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async (type: ExportType) => {
    if (!token) return;
    setDownloading(type);
    setError(null);
    try {
      const params = new URLSearchParams({ type });
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);

      const res = await fetch(`/api/admin/export?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(data.message || "导出失败");
      }

      // 触发浏览器下载
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      // 从 Content-Disposition 提取文件名
      const cd = res.headers.get("Content-Disposition") ?? "";
      const match = cd.match(/filename\*=UTF-8''([^;]+)/);
      const filename = match
        ? decodeURIComponent(match[1])
        : `${type}-${new Date().toISOString().slice(0, 10)}.csv`;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "导出失败");
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">数据导出</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          导出用户、API 调用日志、订单记录为 CSV 文件（带 UTF-8 BOM，Excel 可直接打开）。
          单次最多导出 10000 行。
        </p>
      </div>

      {/* 日期筛选 */}
      <div className="rounded-[var(--radius)] border border-border bg-card p-5 shadow-[var(--shadow-xs)]">
        <h2 className="mb-3 text-sm font-semibold text-foreground">
          时间范围（可选）
        </h2>
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="mb-1.5 block text-xs text-muted-foreground">
              起始日期
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="rounded-[var(--radius-sm)] border border-border px-3 py-2 text-sm text-foreground focus:border-primary/50 focus:shadow-[var(--glow-primary)] outline-none transition-all duration-200"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs text-muted-foreground">
              结束日期
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="rounded-[var(--radius-sm)] border border-border px-3 py-2 text-sm text-foreground focus:border-primary/50 focus:shadow-[var(--glow-primary)] outline-none transition-all duration-200"
            />
          </div>
          {(startDate || endDate) && (
            <button
              onClick={() => {
                setStartDate("");
                setEndDate("");
              }}
              className="self-end rounded-[var(--radius-sm)] border border-border bg-card px-3 py-2 text-xs text-muted-foreground hover:bg-muted"
            >
              清除
            </button>
          )}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          时区：北京时间（UTC+8）。不选日期则导出全部。
        </p>
      </div>

      {error && (
        <div className="rounded-[var(--radius-sm)] border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* 导出选项 */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {EXPORT_OPTIONS.map((opt) => (
          <div
            key={opt.type}
            className="flex flex-col rounded-[var(--radius)] border border-border bg-card p-5 shadow-[var(--shadow-xs)]"
          >
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-[var(--radius-sm)] bg-primary-50 text-primary">
              {opt.icon}
            </div>
            <h3 className="text-sm font-semibold text-foreground">
              {opt.label}
            </h3>
            <p className="mt-1 flex-1 text-xs text-muted-foreground">
              {opt.description}
            </p>
            <button
              onClick={() => handleDownload(opt.type)}
              disabled={downloading !== null}
              className="mt-4 w-full rounded-[var(--radius-sm)] bg-gradient-to-r from-primary to-primary-500 px-3 py-2 text-xs font-semibold text-white shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] transition-colors disabled:opacity-50"
            >
              {downloading === opt.type
                ? "导出中..."
                : downloading !== null
                  ? "请稍候..."
                  : `导出 ${opt.label} CSV`}
            </button>
          </div>
        ))}
      </div>

      {/* 说明 */}
      <div className="rounded-[var(--radius)] border border-border bg-background p-5 text-xs text-muted-foreground shadow-[var(--shadow-xs)]">
        <p className="font-medium text-foreground">导出说明：</p>
        <ul className="mt-2 space-y-1">
          <li>· CSV 文件含 UTF-8 BOM 头，Excel 打开时中文不会乱码</li>
          <li>· 单次最多导出 10000 行，建议按日期范围筛选</li>
          <li>· 敏感字段（密码哈希、Key 明文）不会导出</li>
          <li>· 此操作会记录到操作日志</li>
        </ul>
      </div>
    </div>
  );
}

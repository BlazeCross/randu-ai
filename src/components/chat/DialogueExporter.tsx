"use client";

import { useState } from "react";
import { cx } from "@/lib/cn";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  type?: "text" | "image";
  imageUrl?: string;
  createdAt: number;
}

export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

interface DialogueExporterProps {
  conversation: Conversation;
  trigger?: React.ReactNode;
}

export default function DialogueExporter({
  conversation,
  trigger,
}: DialogueExporterProps) {
  const [isOpen, setIsOpen] = useState(false);

  // 格式化时间为可读格式
  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // 导出为 Markdown 格式
  const exportAsMarkdown = () => {
    let content = `# ${conversation.title || "对话"}\n\n`;
    content += `> 创建时间：${formatDate(conversation.createdAt)}\n\n---\n\n`;

    conversation.messages.forEach((msg) => {
      const role = msg.role === "user" ? "用户" : "AI 助手";
      const time = formatDate(msg.createdAt);
      content += `## ${role} · ${time}\n\n`;
      content += `${msg.content}\n\n`;
      if (msg.type === "image" && msg.imageUrl) {
        content += `![AI 生成图片](${msg.imageUrl})\n\n`;
      }
      content += `---\n\n`;
    });

    downloadFile(content, "md");
    setIsOpen(false);
  };

  // 导出为 TXT 格式
  const exportAsTxt = () => {
    let content = `${conversation.title || "对话"}\n`;
    content += `${"=".repeat(40)}\n`;
    content += `创建时间：${formatDate(conversation.createdAt)}\n\n`;

    conversation.messages.forEach((msg) => {
      const role = msg.role === "user" ? "【用户】" : "【AI】";
      const time = formatDate(msg.createdAt);
      content += `${role} ${time}\n`;
      content += `${msg.content}\n\n`;
      if (msg.type === "image" && msg.imageUrl) {
        content += `[AI 生成图片]: ${msg.imageUrl}\n\n`;
      }
      content += `${"-".repeat(40)}\n\n`;
    });

    downloadFile(content, "txt");
    setIsOpen(false);
  };

  // 下载文件
  const downloadFile = (content: string, ext: "md" | "txt") => {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const filename = `${(conversation.title || "对话").slice(0, 20)}_${formatDate(conversation.updatedAt).replace(/[\/:]/g, "-")}.${ext}`;
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <>
      {/* 触发按钮 */}
      {trigger ? (
        <div onClick={() => setIsOpen(true)} className="cursor-pointer">
          {trigger}
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="导出对话"
          title="导出对话"
        >
          <svg
            className="h-3.5 w-3.5"
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
        </button>
      )}

      {/* 遮罩层 */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* 导出选项弹窗 */}
      <div
        className={cx(
          "fixed left-1/2 top-1/2 z-50 w-72 -translate-x-1/2 -translate-y-1/2 rounded-[var(--radius)] border border-border bg-popover p-4 shadow-2xl transition-all duration-200",
          isOpen ? "scale-100 opacity-100" : "scale-95 opacity-0 pointer-events-none",
        )}
      >
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">导出对话</h3>
          <button
            onClick={() => setIsOpen(false)}
            className="flex h-6 w-6 items-center justify-center rounded-[var(--radius-sm)] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="关闭"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="mb-3 line-clamp-2 text-xs text-muted-foreground">
          {conversation.title || "新对话"}
        </div>

        <div className="space-y-2">
          <button
            onClick={exportAsMarkdown}
            className="flex w-full items-center gap-2 rounded-[var(--radius-sm)] bg-primary/10 px-3 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-primary/20"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            导出为 Markdown
          </button>
          <button
            onClick={exportAsTxt}
            className="flex w-full items-center gap-2 rounded-[var(--radius-sm)] border border-border px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            导出为 TXT
          </button>
        </div>
      </div>
    </>
  );
}

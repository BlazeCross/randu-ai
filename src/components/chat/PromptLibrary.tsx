"use client";

import { useState, useEffect, useCallback } from "react";
import { cx } from "@/lib/cn";

const PROMPT_TEMPLATES = [
  {
    id: "1",
    title: "小红书标题",
    content: "帮我写一个吸引人的小红书标题，主题是：",
  },
  {
    id: "2",
    title: "电商卖点文案",
    content: "为我的电商产品写一段卖点文案，突出优势和特色：",
  },
  {
    id: "3",
    title: "周工作计划",
    content: "生成一周的工作计划，包含具体任务和时间安排",
  },
  {
    id: "4",
    title: "润色文字",
    content: "帮我润色这段文字，让表达更流畅专业：\n\n",
  },
  {
    id: "5",
    title: "短视频脚本开头",
    content: "给短视频写一个脚本开头，前3秒要抓住观众注意力：",
  },
  {
    id: "6",
    title: "SWOT分析",
    content: "帮我做一个SWOT分析，主题是：",
  },
  {
    id: "7",
    title: "产品介绍",
    content: "为产品写一段简洁有力的介绍文案：",
  },
  {
    id: "8",
    title: "朋友圈文案",
    content: "写一条吸引人的朋友圈文案，主题：",
  },
];

const CUSTOM_PROMPTS_KEY = "randu-custom-prompts";

interface CustomPrompt {
  id: string;
  title: string;
  content: string;
}

interface PromptLibraryProps {
  onSelectPrompt: (content: string) => void;
}

export default function PromptLibrary({ onSelectPrompt }: PromptLibraryProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customPrompts, setCustomPrompts] = useState<CustomPrompt[]>([]);
  const [editingPrompt, setEditingPrompt] = useState<CustomPrompt | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");

  // 加载自定义提示词
  useEffect(() => {
    try {
      const stored = localStorage.getItem(CUSTOM_PROMPTS_KEY);
      if (stored) {
        setCustomPrompts(JSON.parse(stored));
      }
    } catch {
      // ignore
    }
  }, []);

  // 保存自定义提示词
  const saveCustomPrompts = useCallback((prompts: CustomPrompt[]) => {
    try {
      localStorage.setItem(CUSTOM_PROMPTS_KEY, JSON.stringify(prompts));
    } catch {
      // ignore
    }
  }, []);

  // 使用模板
  const handleUseTemplate = (content: string) => {
    onSelectPrompt(content);
    setIsOpen(false);
  };

  // 添加自定义提示词
  const handleAddPrompt = () => {
    if (!newTitle.trim() || !newContent.trim()) return;
    const prompt: CustomPrompt = {
      id: `custom-${Date.now()}`,
      title: newTitle.trim(),
      content: newContent.trim(),
    };
    const updated = [...customPrompts, prompt];
    setCustomPrompts(updated);
    saveCustomPrompts(updated);
    setNewTitle("");
    setNewContent("");
    setEditingPrompt(null);
  };

  // 删除自定义提示词
  const handleDeletePrompt = (id: string) => {
    const updated = customPrompts.filter((p) => p.id !== id);
    setCustomPrompts(updated);
    saveCustomPrompts(updated);
  };

  // 编辑自定义提示词
  const handleEditPrompt = (prompt: CustomPrompt) => {
    setEditingPrompt(prompt);
    setNewTitle(prompt.title);
    setNewContent(prompt.content);
  };

  // 更新自定义提示词
  const handleUpdatePrompt = () => {
    if (!editingPrompt || !newTitle.trim() || !newContent.trim()) return;
    const updated = customPrompts.map((p) =>
      p.id === editingPrompt.id
        ? { ...p, title: newTitle.trim(), content: newContent.trim() }
        : p,
    );
    setCustomPrompts(updated);
    saveCustomPrompts(updated);
    setEditingPrompt(null);
    setNewTitle("");
    setNewContent("");
  };

  return (
    <>
      {/* 触发按钮 */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-[var(--radius-sm)] border border-border bg-background text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        aria-label="打开提示词库"
        title="提示词库"
      >
        <svg
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={1.7}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
          />
        </svg>
      </button>

      {/* 遮罩层 */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* 侧边面板 */}
      <div
        className={cx(
          "fixed right-0 top-0 z-50 h-full w-80 max-w-full bg-popover shadow-2xl transition-transform duration-300",
          isOpen ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="flex h-full flex-col">
          {/* 头部 */}
          <div className="flex items-center justify-between border-b border-border p-4">
            <h2 className="text-lg font-semibold text-foreground">提示词库</h2>
            <button
              onClick={() => setIsOpen(false)}
              className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="关闭"
            >
              <svg
                className="h-5 w-5"
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

          {/* 内容区域 */}
          <div className="flex-1 overflow-y-auto p-4">
            {/* 预设模板 */}
            <div className="mb-6">
              <h3 className="mb-3 text-sm font-semibold text-muted-foreground">
                常用模板
              </h3>
              <div className="space-y-2">
                {PROMPT_TEMPLATES.map((template) => (
                  <div
                    key={template.id}
                    className="group flex items-start gap-2 rounded-[var(--radius-sm)] border border-border bg-card p-3 transition-colors hover:border-primary/50"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 text-sm font-medium text-foreground">
                        {template.title}
                      </div>
                      <div className="line-clamp-2 text-xs text-muted-foreground">
                        {template.content}
                      </div>
                    </div>
                    <button
                      onClick={() => handleUseTemplate(template.content)}
                      className="flex-shrink-0 rounded-[var(--radius-sm)] bg-primary/10 px-2 py-1 text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      使用
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* 自定义提示词 */}
            <div>
              <h3 className="mb-3 text-sm font-semibold text-muted-foreground">
                我的常用提示词
              </h3>
              {customPrompts.length === 0 ? (
                <div className="rounded-[var(--radius-sm)] border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                  暂无自定义提示词
                </div>
              ) : (
                <div className="space-y-2">
                  {customPrompts.map((prompt) => (
                    <div
                      key={prompt.id}
                      className="group flex items-start gap-2 rounded-[var(--radius-sm)] border border-border bg-card p-3 transition-colors hover:border-primary/50"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 text-sm font-medium text-foreground">
                          {prompt.title}
                        </div>
                        <div className="line-clamp-2 text-xs text-muted-foreground">
                          {prompt.content}
                        </div>
                      </div>
                      <div className="flex-shrink-0 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        <button
                          onClick={() => handleUseTemplate(prompt.content)}
                          className="rounded-[var(--radius-sm)] bg-primary/10 px-2 py-1 text-xs font-medium text-primary"
                        >
                          使用
                        </button>
                        <button
                          onClick={() => handleDeletePrompt(prompt.id)}
                          className="rounded-[var(--radius-sm)] bg-destructive/10 px-2 py-1 text-xs font-medium text-destructive"
                        >
                          删除
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* 添加新提示词 */}
              <div className="mt-4 rounded-[var(--radius-sm)] border border-border bg-card p-3">
                <h4 className="mb-2 text-xs font-medium text-muted-foreground">
                  {editingPrompt ? "编辑提示词" : "添加新提示词"}
                </h4>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="标题"
                  className="mb-2 w-full rounded-[var(--radius-sm)] border border-border bg-background px-2 py-1.5 text-sm outline-none focus:border-primary/50"
                />
                <textarea
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="提示词内容..."
                  rows={3}
                  className="mb-2 w-full resize-none rounded-[var(--radius-sm)] border border-border bg-background px-2 py-1.5 text-sm outline-none focus:border-primary/50"
                />
                <div className="flex gap-2">
                  {editingPrompt ? (
                    <>
                      <button
                        onClick={handleUpdatePrompt}
                        className="flex-1 rounded-[var(--radius-sm)] bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
                      >
                        保存修改
                      </button>
                      <button
                        onClick={() => {
                          setEditingPrompt(null);
                          setNewTitle("");
                          setNewContent("");
                        }}
                        className="flex-1 rounded-[var(--radius-sm)] border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground"
                      >
                        取消
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={handleAddPrompt}
                      disabled={!newTitle.trim() || !newContent.trim()}
                      className="flex-1 rounded-[var(--radius-sm)] bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-50"
                    >
                      添加
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

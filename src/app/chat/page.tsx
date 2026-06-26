"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

// 消息类型
interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  type?: "text" | "image";
  imageUrl?: string;
  createdAt: number;
}

// localStorage 存储结构
interface StoredConversation {
  messages: ChatMessage[];
  updatedAt: number;
}

const STORAGE_KEY = "randu-chat-history";
const MAX_HISTORY_MESSAGES = 50;

/**
 * 生成唯一消息 ID
 */
function genId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * 格式化时间
 */
function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * 从 localStorage 加载对话历史
 */
function loadHistory(): ChatMessage[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw) as StoredConversation;
    if (!Array.isArray(data.messages)) return [];
    return data.messages.slice(-MAX_HISTORY_MESSAGES);
  } catch {
    return [];
  }
}

/**
 * 保存对话历史到 localStorage
 */
function saveHistory(messages: ChatMessage[]) {
  try {
    const data: StoredConversation = {
      messages: messages.slice(-MAX_HISTORY_MESSAGES),
      updatedAt: Date.now(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // localStorage 满或不可用时静默失败
  }
}

/**
 * 智能体对话页面
 *
 * 功能：
 * - 多轮对话（上下文记忆，最近 10 条发给后端）
 * - 智能路由：检测到"画/生成图"等关键词 → 自动调用 Seedream 生图
 * - 图片预览与下载
 * - 历史记录持久化到 localStorage（不跨设备）
 * - 清空对话
 * - 积分余额显示
 *
 * 后端：POST /api/chat，返回 { role, content, type, imageUrl?, creditsCost }
 */
export default function ChatPage() {
  const router = useRouter();
  const { user, token, loading: authLoading } = useAuth();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // 当前积分余额（从 API 响应中更新）
  const [creditsBalance, setCreditsBalance] = useState<number | null>(null);

  // 消息列表底部滚动容器
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 初始加载历史记录
  useEffect(() => {
    setMessages(loadHistory());
  }, []);

  // 消息变化时保存到 localStorage + 自动滚动到底部
  useEffect(() => {
    saveHistory(messages);
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 获取用户积分余额（从 user 对象）
  useEffect(() => {
    if (user) {
      setCreditsBalance(user.credits);
    }
  }, [user]);

  /**
   * 发送消息
   */
  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || sending || !token) return;

    // 创建用户消息
    const userMessage: ChatMessage = {
      id: genId(),
      role: "user",
      content: text,
      type: "text",
      createdAt: Date.now(),
    };

    // 构建发送给后端的历史消息（仅 role + content）
    const historyForApi = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setSending(true);
    setError(null);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          messages: historyForApi,
          userInput: text,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 403) {
          // 积分不足
          setError(
            typeof data?.message === "string"
              ? data.message
              : "积分余额不足，请充值",
          );
          return;
        }
        setError(
          typeof data?.message === "string" ? data.message : "对话失败",
        );
        return;
      }

      // 创建 AI 回复消息
      const assistantMessage: ChatMessage = {
        id: genId(),
        role: "assistant",
        content: data.content || "",
        type: data.type === "image" ? "image" : "text",
        imageUrl: data.imageUrl,
        createdAt: Date.now(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // 更新积分余额
      if (typeof data.creditsCost === "number" && creditsBalance !== null) {
        setCreditsBalance((prev) =>
          prev !== null ? Math.max(prev - data.creditsCost, 0) : prev,
        );
      }
    } catch (err) {
      console.error("对话失败:", err);
      setError("网络错误，对话失败");
    } finally {
      setSending(false);
    }
  }, [input, sending, token, messages, creditsBalance]);

  /**
   * 清空对话
   */
  const handleClear = () => {
    if (!window.confirm("确定清空所有对话记录？")) return;
    setMessages([]);
    setError(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // 静默
    }
  };

  /**
   * 回车发送（Shift+Enter 换行）
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // 加载中
  if (authLoading) {
    return (
      <main className="flex flex-1 items-center justify-center bg-neutral-50">
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
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      </main>
    );
  }

  // 未登录
  if (!user || !token) {
    return (
      <main className="flex flex-1 items-center justify-center bg-neutral-50 px-4">
        <div className="text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary-100">
            <svg
              className="h-8 w-8 text-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
              />
            </svg>
          </div>
          <h2 className="mb-2 text-xl font-semibold text-neutral-900">
            请先登录
          </h2>
          <p className="mb-6 text-sm text-neutral-500">
            登录后即可使用智能体对话
          </p>
          <button
            onClick={() => router.push("/login")}
            className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-primary-600/25 transition-all hover:bg-primary-hover"
          >
            前往登录
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col bg-neutral-50">
      {/* 顶部标题栏 */}
      <div className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 text-white">
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={1.8}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
            </span>
            <div>
              <h1 className="text-lg font-bold text-neutral-900">智能体对话</h1>
              <p className="text-xs text-neutral-500">
                文本对话 1 积分/次 · AI 生图 5 积分/次
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* 积分余额 */}
            {creditsBalance !== null && (
              <span className="hidden items-center gap-1 rounded-lg bg-primary-50 px-3 py-1.5 text-sm font-medium text-primary-700 sm:flex">
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
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                  />
                </svg>
                {creditsBalance} 积分
              </span>
            )}
            {messages.length > 0 && (
              <button
                onClick={handleClear}
                className="rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs font-medium text-neutral-600 transition-colors hover:bg-neutral-50"
              >
                清空对话
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
          {/* 空状态：欢迎语 */}
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-100">
                <svg
                  className="h-8 w-8 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                  />
                </svg>
              </div>
              <h2 className="mb-2 text-lg font-semibold text-neutral-900">
                你好，我是燃渡AI助手
              </h2>
              <p className="mb-6 max-w-md text-sm text-neutral-500">
                我可以帮你回答问题、撰写文案、提供建议。直接输入"画一张..."还可以生成图片哦！
              </p>
              {/* 快捷提问 */}
              <div className="flex flex-wrap justify-center gap-2">
                {[
                  "帮我写一段产品介绍",
                  "画一只穿着汉服的猫",
                  "推荐三本好看的科幻小说",
                  "如何提高编程能力？",
                ].map((q) => (
                  <button
                    key={q}
                    onClick={() => setInput(q)}
                    className="rounded-full border border-neutral-300 bg-white px-4 py-2 text-sm text-neutral-600 transition-colors hover:bg-neutral-50"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${
                    msg.role === "user" ? "flex-row-reverse" : ""
                  }`}
                >
                  {/* 头像 */}
                  <div
                    className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-sm font-medium ${
                      msg.role === "user"
                        ? "bg-primary-100 text-primary-700"
                        : "bg-gradient-to-br from-primary-500 to-primary-700 text-white"
                    }`}
                  >
                    {msg.role === "user" ? "我" : "AI"}
                  </div>
                  {/* 消息内容 */}
                  <div
                    className={`flex max-w-[80%] flex-col ${
                      msg.role === "user" ? "items-end" : "items-start"
                    }`}
                  >
                    <div
                      className={`rounded-2xl px-4 py-2.5 text-sm ${
                        msg.role === "user"
                          ? "bg-primary text-white"
                          : "bg-white text-neutral-900 shadow-sm ring-1 ring-neutral-200"
                      }`}
                    >
                      {/* 图片类型消息 */}
                      {msg.type === "image" && msg.imageUrl ? (
                        <div className="space-y-2">
                          <p className="whitespace-pre-wrap break-words">
                            {msg.content}
                          </p>
                          <div className="overflow-hidden rounded-xl">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={msg.imageUrl}
                              alt="AI 生成图片"
                              className="max-w-full rounded-xl"
                            />
                          </div>
                          <a
                            href={msg.imageUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`inline-flex items-center gap-1 text-xs font-medium ${
                              msg.role === "user"
                                ? "text-primary-100"
                                : "text-primary hover:text-primary-hover"
                            }`}
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
                            下载图片
                          </a>
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap break-words">
                          {msg.content}
                        </p>
                      )}
                    </div>
                    <span className="mt-1 text-[10px] text-neutral-400">
                      {formatTime(msg.createdAt)}
                    </span>
                  </div>
                </div>
              ))}

              {/* 发送中加载态 */}
              {sending && (
                <div className="flex gap-3">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-primary-700 text-sm font-medium text-white">
                    AI
                  </div>
                  <div className="flex items-center rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-neutral-200">
                    <div className="flex gap-1">
                      <span className="h-2 w-2 animate-bounce rounded-full bg-neutral-400 [animation-delay:-0.3s]" />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-neutral-400 [animation-delay:-0.15s]" />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-neutral-400" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="mx-auto w-full max-w-4xl px-4 sm:px-6">
          <div className="mb-2 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-3">
            <svg
              className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500"
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
            <p className="flex-1 text-sm text-red-700">{error}</p>
            <button
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-600"
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
        </div>
      )}

      {/* 输入区 */}
      <div className="border-t border-neutral-200 bg-white">
        <div className="mx-auto max-w-4xl px-4 py-4 sm:px-6">
          <div className="flex items-end gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="输入消息，Enter 发送，Shift+Enter 换行..."
              rows={1}
              maxLength={4000}
              className="flex-1 resize-none rounded-xl border border-neutral-300 px-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              style={{ maxHeight: "120px" }}
              disabled={sending}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || sending}
              className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-primary text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
              aria-label="发送"
            >
              {sending ? (
                <svg
                  className="h-5 w-5 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
              ) : (
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
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

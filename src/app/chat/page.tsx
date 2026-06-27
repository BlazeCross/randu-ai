"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useTrackPageView } from "@/hooks/useTrack";
import AppShell from "@/components/layout/AppShell";
import Avatar from "@/components/ui/Avatar";
import Badge from "@/components/ui/Badge";

// 简单的 className 拼接工具（过滤 falsy 值）
function cx(...args: Array<string | false | null | undefined>): string {
  return args.filter(Boolean).join(" ");
}

// 消息类型
interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  type?: "text" | "image";
  imageUrl?: string;
  createdAt: number;
}

// 单条会话
interface Conversation {
  id: string;
  title: string; // 首条用户消息前 20 字
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

// 多会话存储结构
interface ConversationsStore {
  conversations: Conversation[];
  currentId: string | null;
}

// 旧结构（单对话），用于迁移检测
interface LegacyStoredConversation {
  messages: ChatMessage[];
  updatedAt: number;
}

const STORAGE_KEY = "randu-chat-history";
const MAX_CONVERSATIONS = 20;

/**
 * 生成唯一 ID（用于消息和会话）
 */
function genId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * 从用户消息文本生成会话标题（前 20 字，去除换行）
 */
function genTitleFromMessage(text: string): string {
  const cleaned = text.replace(/[\r\n]+/g, " ").trim();
  return cleaned.slice(0, 20) || "新对话";
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
 * 从 localStorage 加载会话列表
 * - 兼容旧结构 {messages, updatedAt}：自动迁移为单会话列表
 * - 返回 ConversationsStore，currentId 默认指向第一个会话或 null
 */
function loadConversations(): ConversationsStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { conversations: [], currentId: null };
    const data = JSON.parse(raw);

    // 新结构：{ conversations, currentId }
    if (data && Array.isArray((data as ConversationsStore).conversations)) {
      const store = data as ConversationsStore;
      return {
        conversations: store.conversations.slice(0, MAX_CONVERSATIONS),
        currentId: store.currentId ?? null,
      };
    }

    // 旧结构：{ messages, updatedAt } → 迁移为单会话
    if (data && Array.isArray((data as LegacyStoredConversation).messages)) {
      const legacy = data as LegacyStoredConversation;
      if (legacy.messages.length === 0) {
        return { conversations: [], currentId: null };
      }
      const firstUser = legacy.messages.find((m) => m.role === "user");
      const conv: Conversation = {
        id: genId(),
        title: firstUser ? genTitleFromMessage(firstUser.content) : "新对话",
        messages: legacy.messages,
        createdAt: legacy.updatedAt || Date.now(),
        updatedAt: legacy.updatedAt || Date.now(),
      };
      return { conversations: [conv], currentId: conv.id };
    }

    return { conversations: [], currentId: null };
  } catch {
    return { conversations: [], currentId: null };
  }
}

/**
 * 保存整个会话 store 到 localStorage
 */
function saveConversations(store: ConversationsStore) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // localStorage 满或不可用时静默失败
  }
}

/**
 * 智能体对话页面
 *
 * 功能：
 * - 多会话管理（创建/切换/删除，最多 20 个）
 * - 多轮对话（上下文记忆，最近 10 条发给后端）
 * - 智能路由：检测到"画/生成图"等关键词 → 自动调用 Seedream 生图
 * - 图片预览与下载
 * - 历史记录持久化到 localStorage（不跨设备）
 * - 积分余额显示
 * - 语音输入（Web Speech API）
 * - 图片上传（/api/upload）
 * - 消息操作（复制 / 重新生成）
 *
 * 后端：POST /api/chat，返回 { role, content, type, imageUrl?, creditsCost }
 */
export default function ChatPage() {
  const router = useRouter();
  const { user, token, loading: authLoading } = useAuth();
  useTrackPageView("chat");

  // 多会话状态
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  // 派生：当前会话的消息列表（useMemo 保持引用稳定，避免不必要的 effect 触发）
  const messages = useMemo(
    () => conversations.find((c) => c.id === currentId)?.messages ?? [],
    [conversations, currentId],
  );

  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // 当前积分余额（从 API 响应中更新）
  const [creditsBalance, setCreditsBalance] = useState<number | null>(null);

  // 语音输入相关状态
  const [isRecording, setIsRecording] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const recognitionRef = useRef<any>(null);
  // 录音开始时的输入框内容（作为追加基础）
  const baseInputRef = useRef("");
  // 累计的最终识别结果
  const finalTranscriptRef = useRef("");

  // 文件上传相关状态
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 消息操作相关状态：记录当前已复制消息 ID
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // 消息列表底部滚动容器
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 初始加载会话
  useEffect(() => {
    const store = loadConversations();
    setConversations(store.conversations);
    setCurrentId(store.currentId);
  }, []);

  // conversations / currentId 变化时保存到 localStorage
  useEffect(() => {
    saveConversations({ conversations, currentId });
  }, [conversations, currentId]);

  // 当前消息列表变化时滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 获取用户积分余额（从 user 对象）
  useEffect(() => {
    if (user) {
      setCreditsBalance(user.credits);
    }
  }, [user]);

  /**
   * 初始化语音识别（Web Speech API）
   * - 兼容 window.SpeechRecognition / window.webkitSpeechRecognition
   * - 不支持的浏览器隐藏语音按钮
   */
  useEffect(() => {
    if (typeof window === "undefined") return;
    const SpeechRecognitionAPI =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      setSpeechSupported(false);
      return;
    }
    setSpeechSupported(true);

    const recognition = new SpeechRecognitionAPI();
    recognition.lang = "zh-CN";
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event: any) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscriptRef.current += transcript;
        } else {
          interim += transcript;
        }
      }
      setInput(baseInputRef.current + finalTranscriptRef.current + interim);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognition.onerror = (event: any) => {
      console.error("语音识别错误:", event?.error);
      setIsRecording(false);
    };

    recognitionRef.current = recognition;

    return () => {
      try {
        recognition.abort();
      } catch {
        // 静默
      }
      recognitionRef.current = null;
    };
  }, []);

  /**
   * 创建新会话
   * - 加入列表头部
   * - 超过 MAX_CONVERSATIONS 时淘汰最旧
   * - 设为当前会话
   * - 返回新会话 id
   */
  const createConversation = useCallback((title?: string): string => {
    const id = genId();
    const now = Date.now();
    const newConv: Conversation = {
      id,
      title: title || "新对话",
      messages: [],
      createdAt: now,
      updatedAt: now,
    };
    setConversations((prev) => {
      const next = [newConv, ...prev];
      if (next.length > MAX_CONVERSATIONS) {
        next.pop();
      }
      return next;
    });
    setCurrentId(id);
    return id;
  }, []);

  /**
   * 核心发送函数（可复用）
   * - baseMessages 可选，用于"重新生成"场景显式指定历史消息
   * - 若当前无会话，先创建新会话
   */
  const sendMessage = useCallback(
    async (text: string, baseMessages?: ChatMessage[]) => {
      const trimmed = text.trim();
      if (!trimmed || !token) return;

      // 确定目标会话；无当前会话则新建
      let activeId = currentId;
      if (!activeId) {
        activeId = createConversation(genTitleFromMessage(trimmed));
      }

      const currentConv = conversations.find((c) => c.id === activeId);
      const historySource = baseMessages ?? (currentConv?.messages ?? []);

      // 创建用户消息
      const userMessage: ChatMessage = {
        id: genId(),
        role: "user",
        content: trimmed,
        type: "text",
        createdAt: Date.now(),
      };

      // 构建发送给后端的历史消息（仅 role + content）
      const historyForApi = historySource.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeId
            ? { ...c, messages: [...c.messages, userMessage], updatedAt: Date.now() }
            : c,
        ),
      );
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
            userInput: trimmed,
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

        setConversations((prev) =>
          prev.map((c) =>
            c.id === activeId
              ? { ...c, messages: [...c.messages, assistantMessage], updatedAt: Date.now() }
              : c,
          ),
        );

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
    },
    [conversations, currentId, token, creditsBalance, createConversation],
  );

  /**
   * 发送消息（输入框触发）
   */
  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text || sending) return;
    setInput("");
    sendMessage(text);
  }, [input, sending, sendMessage]);

  /**
   * 切换语音录制：开始 / 停止
   */
  const toggleRecording = useCallback(() => {
    if (!recognitionRef.current) return;
    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      // 以当前输入框内容作为追加基础
      baseInputRef.current = input;
      finalTranscriptRef.current = "";
      try {
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (err) {
        console.error("启动语音识别失败:", err);
        setIsRecording(false);
      }
    }
  }, [isRecording, input]);

  /**
   * 文件选择 → 上传到 /api/upload
   * - 使用 FormData，file 字段
   * - 携带 Authorization: Bearer token
   * - 成功后在输入框追加 "请分析这张图片：${url}"
   */
  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      // 重置 input value 以便重复选择同一文件
      e.target.value = "";
      if (!file || !token) return;

      setUploading(true);
      setError(null);

      try {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/upload", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        const data = await res.json();

        if (!res.ok) {
          setError(
            typeof data?.message === "string" ? data.message : "图片上传失败",
          );
          return;
        }

        // 上传成功后在输入框追加图片分析请求
        setInput((prev) => {
          const base = prev ? (prev.endsWith(" ") ? prev : prev + " ") : "";
          return `${base}请分析这张图片：${data.url}`;
        });
      } catch (err) {
        console.error("上传失败:", err);
        setError("图片上传失败，请稍后重试");
      } finally {
        setUploading(false);
      }
    },
    [token],
  );

  /**
   * 复制消息内容到剪贴板
   */
  const handleCopy = useCallback(async (msg: ChatMessage) => {
    try {
      await navigator.clipboard.writeText(msg.content);
      setCopiedId(msg.id);
      setTimeout(
        () => setCopiedId((prev) => (prev === msg.id ? null : prev)),
        2000,
      );
    } catch (err) {
      console.error("复制失败:", err);
    }
  }, []);

  /**
   * 重新生成 AI 回复
   * - 找到 AI 消息的前一条用户消息
   * - 删除当前 AI 消息和前一条用户消息（sendMessage 会重新创建用户消息）
   * - 调用 sendMessage 重新发送
   */
  const handleRegenerate = useCallback(
    (aiMessageId: string) => {
      if (sending || !currentId) return;
      const currentConv = conversations.find((c) => c.id === currentId);
      if (!currentConv) return;

      const aiIndex = currentConv.messages.findIndex(
        (m) => m.id === aiMessageId,
      );
      if (aiIndex < 0) return;
      // 找到前一条用户消息
      let userIdx = aiIndex - 1;
      while (
        userIdx >= 0 &&
        currentConv.messages[userIdx].role !== "user"
      )
        userIdx--;
      if (userIdx < 0) return;

      const userText = currentConv.messages[userIdx].content;
      // 构造去除 AI 消息 + 前一条用户消息后的新历史
      const newMessages = currentConv.messages.filter(
        (_, i) => i !== aiIndex && i !== userIdx,
      );
      setConversations((prev) =>
        prev.map((c) =>
          c.id === currentId
            ? { ...c, messages: newMessages, updatedAt: Date.now() }
            : c,
        ),
      );
      sendMessage(userText, newMessages);
    },
    [conversations, currentId, sending, sendMessage],
  );

  /**
   * 新建对话：清空输入，开始新会话（不清空历史）
   */
  const handleClear = () => {
    setInput("");
    setError(null);
    setCurrentId(null);
  };

  /**
   * 切换会话
   */
  const switchConversation = useCallback((id: string) => {
    setCurrentId(id);
    setError(null);
  }, []);

  /**
   * 删除会话
   * - 从 conversations 移除该 id
   * - 如果删除的是当前会话，currentId 设为列表第一个会话的 id 或 null
   */
  const deleteConversation = useCallback(
    (id: string) => {
      const next = conversations.filter((c) => c.id !== id);
      setConversations(next);
      setCurrentId((curr) => {
        if (curr !== id) return curr;
        return next.length > 0 ? next[0].id : null;
      });
    },
    [conversations],
  );

  /**
   * 回车发送（Shift+Enter 换行）
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // 用户显示名
  const userName = user?.nickname || user?.email || "用户";

  // 加载中
  if (authLoading) {
    return (
      <AppShell
        title="燃渡Ai助手"
        subtitle="你的 AI 助手"
        sidebar={<div className="p-3" />}
      >
        <div className="flex h-full items-center justify-center bg-background">
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
        </div>
      </AppShell>
    );
  }

  // 未登录
  if (!user || !token) {
    return (
      <AppShell
        title="燃渡Ai助手"
        subtitle="你的 AI 助手"
        sidebar={<div className="p-3" />}
      >
        <div className="flex h-full items-center justify-center bg-background px-4">
          <div className="text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-accent">
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
            <h2 className="mb-2 text-xl font-semibold text-foreground">
              请先登录
            </h2>
            <p className="mb-6 text-sm text-muted-foreground">
              登录后即可使用燃渡Ai助手
            </p>
            <button
              onClick={() => router.push("/login")}
              className="rounded-[var(--radius-sm)] bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg transition-all hover:bg-primary-hover"
            >
              前往登录
            </button>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="燃渡Ai助手"
      subtitle="你的 AI 助手"
      sidebar={
        <div className="flex h-full flex-col">
          {/* 新对话按钮 */}
          <div className="p-3">
            <button
              onClick={handleClear}
              className="flex w-full items-center gap-2 rounded-[var(--radius-sm)] bg-primary px-3 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-[color-mix(in_srgb,var(--primary)_90%,#000)]"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={1.7}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
              新对话
            </button>
          </div>

          {/* 历史对话列表（可滚动） */}
          <div className="flex-1 overflow-y-auto px-2">
            <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              历史对话
            </div>
            {conversations.length === 0 ? (
              <div className="px-3 py-4 text-center text-xs text-muted-foreground">
                暂无历史对话
              </div>
            ) : (
              conversations.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => switchConversation(conv.id)}
                  className={cx(
                    "group relative flex cursor-pointer items-start gap-2 rounded-[var(--radius-sm)] px-3 py-2 transition-colors",
                    conv.id === currentId
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <svg
                    className="mt-0.5 h-3.5 w-3.5 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={1.7}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                  >
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">
                      {conv.title || "新对话"}
                    </div>
                    <div className="text-xs text-muted-foreground/70">
                      {new Date(conv.updatedAt).toLocaleDateString("zh-CN", {
                        month: "2-digit",
                        day: "2-digit",
                      })}
                    </div>
                  </div>
                  {/* 删除按钮（hover 显示） */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteConversation(conv.id);
                    }}
                    className="absolute right-1 top-1 hidden h-5 w-5 place-items-center rounded text-muted-foreground hover:bg-destructive/10 hover:text-destructive group-hover:grid"
                    aria-label="删除对话"
                  >
                    <svg
                      className="h-3 w-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                    </svg>
                  </button>
                </div>
              ))
            )}
          </div>

          {/* 底部用户信息块 */}
          {user && (
            <div className="flex-none border-t border-sidebar-border p-3">
              <div className="flex items-center gap-2">
                <Avatar
                  src={user.avatar ?? undefined}
                  name={userName}
                  size="md"
                />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-foreground">
                    {userName}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Badge variant="primary">
                      {user.subscriptionPlan || "免费版"}
                    </Badge>
                    {creditsBalance !== null && (
                      <span className="text-xs text-muted-foreground">
                        {creditsBalance} 点
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      }
    >
      <div className="flex h-full flex-col">
        {/* 消息列表 */}
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
            {/* 空状态：欢迎语 */}
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-[var(--radius)] bg-accent">
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
                <h2 className="mb-2 text-lg font-semibold text-foreground">
                  你好，我是燃渡AI助手
                </h2>
                <p className="mb-6 max-w-md text-sm text-muted-foreground">
                  我可以帮你回答问题、撰写文案、提供建议。直接输入"画一张..."还可以生成图片哦！
                </p>
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
                      className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-sm font-medium ${
                        msg.role === "user"
                          ? "bg-accent text-accent-foreground"
                          : "bg-gradient-to-br from-primary-500 to-primary-700 text-white"
                      }`}
                    >
                      {msg.role === "user" ? "我" : "AI"}
                    </div>
                    {/* 消息内容 */}
                    <div
                      className={`group flex max-w-[80%] flex-col ${
                        msg.role === "user" ? "items-end" : "items-start"
                      }`}
                    >
                      <div
                        className={`rounded-[var(--radius)] px-4 py-2.5 text-sm ${
                          msg.role === "user"
                            ? "bg-primary text-white"
                            : "bg-card text-foreground border border-border"
                        }`}
                      >
                        {/* 图片类型消息 */}
                        {msg.type === "image" && msg.imageUrl ? (
                          <div className="space-y-2">
                            <p className="whitespace-pre-wrap break-words">
                              {msg.content}
                            </p>
                            <div className="overflow-hidden rounded-[var(--radius-sm)]">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={msg.imageUrl}
                                alt="AI 生成图片"
                                className="max-w-full rounded-[var(--radius-sm)]"
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
                      {/* 时间 + 操作按钮（仅 AI 消息显示操作按钮） */}
                      <div className="mt-1 flex items-center gap-2">
                        <span className="text-[10px] text-muted-foreground">
                          {formatTime(msg.createdAt)}
                        </span>
                        {msg.role === "assistant" && (
                          <div className="flex items-center gap-1 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                            {/* 复制按钮 */}
                            <button
                              onClick={() => handleCopy(msg)}
                              className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                              aria-label="复制"
                              title="复制"
                            >
                              {copiedId === msg.id ? (
                                <svg
                                  className="h-3.5 w-3.5 text-green-500"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                  strokeWidth={2}
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                              ) : (
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
                                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                                  />
                                </svg>
                              )}
                            </button>
                            {/* 重新生成按钮 */}
                            <button
                              onClick={() => handleRegenerate(msg.id)}
                              disabled={sending}
                              className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40"
                              aria-label="重新生成"
                              title="重新生成"
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
                                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                />
                              </svg>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {/* 发送中加载态 */}
                {sending && (
                  <div className="flex gap-3">
                    <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-primary text-sm font-medium text-white">
                      AI
                    </div>
                    <div className="flex items-center rounded-[var(--radius)] bg-card border border-border px-4 py-3">
                      <div className="flex gap-1">
                        <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
                        <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
                        <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" />
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
          <div className="mx-auto w-full max-w-4xl px-4 sm:px-6 flex-none">
            <div className="mb-2 flex items-start gap-3 rounded-[var(--radius-sm)] border border-destructive/30 bg-destructive/10 p-3">
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
              <p className="flex-1 text-sm text-destructive">{error}</p>
              <button
                onClick={() => setError(null)}
                className="text-destructive/70 hover:text-destructive"
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
        <div className="flex-none border-t border-border bg-background">
          <div className="mx-auto max-w-4xl px-4 py-4 sm:px-6">
            <div className="flex items-end gap-2 border border-border rounded-[22px] bg-card p-3.5 pb-2.5 transition-all focus-within:border-[var(--ring)] focus-within:ring-[3px] focus-within:ring-[color-mix(in_srgb,var(--ring)_18%,transparent)]">
              {/* 隐藏的文件上传 input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />

              {/* 语音输入按钮（不支持时隐藏） */}
              {speechSupported && (
                <button
                  onClick={toggleRecording}
                  disabled={sending}
                  className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-[var(--radius-sm)] transition-all disabled:opacity-50 ${
                    isRecording
                      ? "bg-destructive text-white animate-pulse"
                      : "border border-border bg-background text-muted-foreground hover:bg-muted"
                  }`}
                  aria-label={isRecording ? "停止录音" : "开始语音输入"}
                  title={isRecording ? "停止录音" : "语音输入"}
                >
                  {isRecording ? (
                    // 停止 / 录音中方块图标
                    <svg
                      className="h-5 w-5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <rect x="6" y="6" width="12" height="12" rx="2" />
                    </svg>
                  ) : (
                    // 麦克风图标
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
                        d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                      />
                    </svg>
                  )}
                </button>
              )}

              {/* 文件上传按钮 */}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading || sending}
                className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-[var(--radius-sm)] border border-border bg-background text-muted-foreground transition-colors hover:bg-muted disabled:opacity-50"
                aria-label="上传图片"
                title="上传图片"
              >
                {uploading ? (
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
                  // 回形针图标
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
                      d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                    />
                  </svg>
                )}
              </button>

              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="输入消息，Enter 发送，Shift+Enter 换行..."
                rows={1}
                maxLength={4000}
                className="flex-1 resize-none bg-transparent outline-none px-1 py-1 text-sm"
                style={{ maxHeight: "120px" }}
                disabled={sending}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || sending}
                className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
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
      </div>
    </AppShell>
  );
}

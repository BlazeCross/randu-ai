"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";

// Toast 类型
export type ToastType = "success" | "error" | "info" | "warning";

interface ToastItem {
  id: number;
  type: ToastType;
  message: string;
  duration: number;
}

interface ToastContextValue {
  toast: (message: string, options?: ToastOptions) => void;
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
  warning: (message: string, duration?: number) => void;
  dismiss: (id: number) => void;
}

interface ToastOptions {
  type?: ToastType;
  duration?: number;
}

const DEFAULT_DURATION = 3000;

const ToastContext = createContext<ToastContextValue | null>(null);

let toastIdCounter = 0;

/**
 * Toast Provider：包裹在根 layout 中，向全应用提供 toast 上下文
 *
 * 使用方式：
 * - 在 layout 中：<ToastProvider>...</ToastProvider>
 * - 在任意客户端组件中：const { toast } = useToast(); toast.success("保存成功");
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, options?: ToastOptions) => {
      const id = ++toastIdCounter;
      const type = options?.type ?? "info";
      const duration = options?.duration ?? DEFAULT_DURATION;
      setToasts((prev) => [...prev, { id, type, message, duration }]);
      if (duration > 0) {
        setTimeout(() => dismiss(id), duration);
      }
    },
    [dismiss],
  );

  const success = useCallback(
    (message: string, duration?: number) =>
      toast(message, { type: "success", duration }),
    [toast],
  );

  const error = useCallback(
    (message: string, duration?: number) =>
      toast(message, { type: "error", duration: duration ?? 5000 }),
    [toast],
  );

  const info = useCallback(
    (message: string, duration?: number) =>
      toast(message, { type: "info", duration }),
    [toast],
  );

  const warning = useCallback(
    (message: string, duration?: number) =>
      toast(message, { type: "warning", duration: duration ?? 4000 }),
    [toast],
  );

  return (
    <ToastContext.Provider
      value={{ toast, success, error, info, warning, dismiss }}
    >
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

/**
 * 使用 toast 的 hook
 *
 * 必须在 ToastProvider 内部使用，否则抛出错误
 */
export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast 必须在 ToastProvider 内部使用");
  }
  return ctx;
}

// Toast 类型对应的样式与图标
const TOAST_STYLES: Record<
  ToastType,
  { wrapper: string; iconBg: string; iconColor: string }
> = {
  success: {
    wrapper: "border-success/30 bg-success/10 text-success",
    iconBg: "bg-success/15",
    iconColor: "text-success",
  },
  error: {
    wrapper: "border-destructive/30 bg-destructive/10 text-destructive",
    iconBg: "bg-destructive/15",
    iconColor: "text-destructive",
  },
  info: {
    wrapper: "border-primary/30 bg-primary/10 text-primary",
    iconBg: "bg-accent",
    iconColor: "text-primary",
  },
  warning: {
    wrapper: "border-accent bg-accent text-accent-foreground",
    iconBg: "bg-accent",
    iconColor: "text-accent-foreground",
  },
};

// Toast 图标
function ToastIcon({ type }: { type: ToastType }) {
  const commonProps = {
    className: "h-4 w-4",
    fill: "none",
    stroke: "currentColor",
    viewBox: "0 0 24 24",
    strokeWidth: 2,
  } as const;

  switch (type) {
    case "success":
      return (
        <svg {...commonProps}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5 13l4 4L19 7"
          />
        </svg>
      );
    case "error":
      return (
        <svg {...commonProps}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      );
    case "warning":
      return (
        <svg {...commonProps}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v2m0 4h.01M5.07 19h13.86c1.54 0 2.5-1.67 1.73-3L13.73 4a2 2 0 00-3.46 0L3.34 16c-.77 1.33.19 3 1.73 3z"
          />
        </svg>
      );
    case "info":
    default:
      return (
        <svg {...commonProps}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      );
  }
}

/**
 * Toast 容器：固定在右上角，堆叠显示多个 Toast
 */
function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: ToastItem[];
  onDismiss: (id: number) => void;
}) {
  if (toasts.length === 0) return null;

  return (
    <div
      className="pointer-events-none fixed right-4 top-20 z-[100] flex w-full max-w-sm flex-col gap-2"
      aria-live="polite"
      aria-atomic="true"
    >
      {toasts.map((t) => (
        <ToastItemView key={t.id} item={t} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

/**
 * 单个 Toast 条目
 */
function ToastItemView({
  item,
  onDismiss,
}: {
  item: ToastItem;
  onDismiss: (id: number) => void;
}) {
  const [exiting, setExiting] = useState(false);
  const styles = TOAST_STYLES[item.type];

  // 退出动画
  const handleDismiss = () => {
    setExiting(true);
    setTimeout(() => onDismiss(item.id), 150);
  };

  return (
    <div
      className={`animate-toast-in backdrop-blur-lg border-[var(--glass-border)] pointer-events-auto flex items-start gap-3 rounded-xl border px-4 py-3 shadow-lg ${styles.wrapper} ${
        exiting ? "animate-[toast-out_150ms_var(--ease-in)_forwards]" : ""
      }`}
      role="alert"
    >
      {/* 图标 */}
      <span
        className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full ${styles.iconBg} ${styles.iconColor}`}
      >
        <ToastIcon type={item.type} />
      </span>

      {/* 消息内容 */}
      <p className="flex-1 text-sm font-medium leading-5">{item.message}</p>

      {/* 关闭按钮 */}
      <button
        type="button"
        onClick={handleDismiss}
        className="flex-shrink-0 rounded p-0.5 opacity-60 transition-opacity hover:opacity-100"
        aria-label="关闭通知"
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
  );
}

// 兼容 SSR：在 ToastProvider 外使用时返回 noop（不会报错）
export function useToastSafe(): Partial<ToastContextValue> {
  const ctx = useContext(ToastContext);
  return ctx ?? {};
}

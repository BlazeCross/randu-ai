"use client";

import { useCallback, useRef, useState } from "react";
import ErrorMessage from "@/components/ui/ErrorMessage";

// 组件 Props
interface ImageUploaderProps {
  // 上传成功回调，返回 CDN URL
  onUploadSuccess: (url: string) => void;
  // 上传失败回调
  onUploadError?: (error: string) => void;
  // 当前已上传图片 URL（用于回显）
  currentImage?: string;
}

// 允许的图片 MIME 类型
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

// 文件大小上限：10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * 图片上传组件
 *
 * 功能：
 * - 拖拽上传 / 点击上传
 * - 图片预览
 * - 前端大小、类型校验
 * - 上传中 loading
 * - 错误提示
 * - 删除 / 重新上传
 *
 * 视觉：
 * - 上传区虚线边框（neutral），hover/dragover 时变 primary
 * - 使用 Tailwind 主题色
 */
export default function ImageUploader({
  onUploadSuccess,
  onUploadError,
  currentImage,
}: ImageUploaderProps) {
  // 上传状态
  const [uploading, setUploading] = useState(false);
  // 错误信息
  const [errorMessage, setErrorMessage] = useState<string>("");
  // 预览图 URL（优先使用 currentImage，上传成功后会更新为最新 URL）
  const [previewUrl, setPreviewUrl] = useState<string>(currentImage ?? "");
  // 是否处于拖拽悬停状态
  const [isDragOver, setIsDragOver] = useState(false);

  // 隐藏的 file input 引用
  const inputRef = useRef<HTMLInputElement>(null);

  /**
   * 执行文件上传逻辑
   * 包含前端校验 + 调用 /api/upload
   */
  const uploadFile = useCallback(
    async (file: File) => {
      // 重置错误信息
      setErrorMessage("");

      // 校验：类型
      if (!ALLOWED_TYPES.includes(file.type)) {
        const msg = `不支持的文件类型：${file.type || "未知"}，仅支持 JPG/PNG/WebP/GIF`;
        setErrorMessage(msg);
        onUploadError?.(msg);
        return;
      }

      // 校验：大小
      if (file.size > MAX_FILE_SIZE) {
        const msg = `文件大小超过限制（${(file.size / 1024 / 1024).toFixed(2)}MB），最大支持 10MB`;
        setErrorMessage(msg);
        onUploadError?.(msg);
        return;
      }

      setUploading(true);
      try {
        // 从 localStorage 读取 JWT token（键名与 auth-context 保持一致）
        const token =
          typeof window !== "undefined"
            ? window.localStorage.getItem("randu_token")
            : null;

        // 构建 FormData
        const formData = new FormData();
        formData.append("file", file);

        // 调用上传接口
        const response = await fetch("/api/upload", {
          method: "POST",
          headers: token
            ? { Authorization: `Bearer ${token}` }
            : undefined,
          body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
          const msg =
            typeof data?.message === "string" ? data.message : "上传失败";
          setErrorMessage(msg);
          onUploadError?.(msg);
          return;
        }

        // 上传成功：更新预览 + 回调通知
        if (typeof data?.url === "string") {
          setPreviewUrl(data.url);
          onUploadSuccess(data.url);
        } else {
          const msg = "上传响应格式错误";
          setErrorMessage(msg);
          onUploadError?.(msg);
        }
      } catch (error) {
        console.error("上传失败:", error);
        const msg = "网络错误，上传失败";
        setErrorMessage(msg);
        onUploadError?.(msg);
      } finally {
        setUploading(false);
      }
    },
    [onUploadError, onUploadSuccess],
  );

  /**
   * 处理 input change 事件（点击选择文件）
   */
  const handleInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        void uploadFile(file);
      }
      // 重置 input value，便于重复选择同一文件
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    },
    [uploadFile],
  );

  /**
   * 处理拖拽进入
   */
  const handleDragOver = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();
      if (!uploading) {
        setIsDragOver(true);
      }
    },
    [uploading],
  );

  /**
   * 处理拖拽离开
   */
  const handleDragLeave = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();
      setIsDragOver(false);
    },
    [],
  );

  /**
   * 处理拖拽释放（drop）
   */
  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();
      setIsDragOver(false);

      if (uploading) return;

      const file = event.dataTransfer.files?.[0];
      if (file) {
        void uploadFile(file);
      }
    },
    [uploadFile, uploading],
  );

  /**
   * 点击上传区，触发文件选择
   */
  const handleClick = useCallback(() => {
    if (uploading) return;
    inputRef.current?.click();
  }, [uploading]);

  /**
   * 删除当前预览图，回到上传初始状态
   */
  const handleDelete = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      // 阻止事件冒泡到外层 div 触发文件选择
      event.preventDefault();
      event.stopPropagation();
      setPreviewUrl("");
      setErrorMessage("");
    },
    [],
  );

  // 是否显示预览区
  const showPreview = Boolean(previewUrl);

  return (
    <div className="w-full">
      {/* 隐藏的文件输入 */}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleInputChange}
      />

      {/* 预览区：有图片时显示 */}
      {showPreview ? (
        <div className="relative overflow-hidden rounded-[var(--radius-sm)] border border-border bg-background">
          {/* 图片预览 */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt="已上传图片预览"
            className="h-48 w-full object-contain"
          />

          {/* 删除按钮 */}
          <button
            type="button"
            onClick={handleDelete}
            disabled={uploading}
            className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-card/90 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="删除图片"
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

          {/* 重新上传提示（点击预览区也可重新上传） */}
          {!uploading && (
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/50 to-transparent px-4 py-2 text-center text-xs text-white/90">
              点击图片重新上传
            </div>
          )}

          {/* 上传中遮罩 */}
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-card/70">
              <Spinner />
            </div>
          )}
        </div>
      ) : (
        /* 上传区：无图片时显示 */
        <div
          role="button"
          tabIndex={0}
          onClick={handleClick}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              handleClick();
            }
          }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={[
            "group flex cursor-pointer flex-col items-center justify-center rounded-[var(--radius)] border-2 border-dashed px-6 py-12 text-center transition-all duration-200",
            isDragOver
              ? "scale-[1.01] border-primary border-solid bg-primary/10"
              : "border-border bg-background hover:scale-[1.01] hover:border-primary hover:bg-primary/10",
            uploading ? "pointer-events-none opacity-70" : "",
          ].join(" ")}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-3">
              <Spinner />
              <p className="text-sm text-muted-foreground">上传中...</p>
            </div>
          ) : (
            <>
              {/* 上传图标（拖拽时放大并变色） */}
              <div
                className={[
                  "mb-4 flex h-16 w-16 items-center justify-center rounded-[var(--radius)] transition-all duration-200",
                  isDragOver
                    ? "scale-110 bg-accent"
                    : "bg-muted group-hover:bg-accent",
                ].join(" ")}
              >
                <svg
                  className={[
                    "h-8 w-8 transition-colors duration-200",
                    isDragOver
                      ? "text-primary"
                      : "text-muted-foreground group-hover:text-primary",
                  ].join(" ")}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={1.8}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
              </div>

              <p className="text-base font-semibold text-foreground">
                {isDragOver ? "释放即可上传" : "拖拽图片到此处或点击上传"}
              </p>
              <p className="mt-1.5 text-xs text-muted-foreground">
                支持 JPG / PNG / WebP / GIF，单个文件 ≤ 10MB
              </p>
            </>
          )}
        </div>
      )}

      {/* 错误提示：使用统一的 ErrorMessage 组件 */}
      {errorMessage && (
        <div className="mt-3">
          <ErrorMessage message={errorMessage} />
        </div>
      )}
    </div>
  );
}

/**
 * 加载中旋转图标
 */
function Spinner() {
  return (
    <svg
      className="h-8 w-8 animate-spin text-primary"
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

"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { cx } from "@/lib/cn";

// 头像尺寸
type AvatarSize = "sm" | "md" | "lg";

export interface AvatarProps
  extends React.HTMLAttributes<HTMLSpanElement> {
  /** 图片地址，加载失败自动回退到文字 */
  src?: string;
  /** 用户名，无图时取首字作为 fallback */
  name?: string;
  /** 尺寸：sm 28px / md 36px / lg 48px */
  size?: AvatarSize;
  /** 自定义渐变色，格式如 "135deg,#0065fd,#1d4ed8"，覆盖默认 chart 渐变 */
  gradient?: string;
}

// 各尺寸样式
const AVATAR_SIZES: Record<AvatarSize, string> = {
  sm: "w-7 h-7 text-xs",
  md: "w-9 h-9 text-sm",
  lg: "w-12 h-12 text-base",
};

/**
 * Avatar 头像
 *
 * 基于 Doubao 设计系统的圆形头像。
 * - 有 src 时渲染图片，加载失败回退到文字 fallback
 * - 无 src 时显示用户名首字，背景为 chart 渐变
 * - 支持 gradient prop 自定义渐变色
 */
const Avatar = React.forwardRef<HTMLSpanElement, AvatarProps>(
  (
    { src, name, size = "md", gradient, className, ...rest },
    ref,
  ) => {
    const [imgError, setImgError] = useState(false);

    // src 变化时重置图片错误状态
    useEffect(() => {
      setImgError(false);
    }, [src]);

    const showImage = Boolean(src) && !imgError;
    // 取用户名首字，无则用 ?
    const initials = name ? name.charAt(0) : "?";

    return (
      <span
        ref={ref}
        className={cx(
          "relative inline-flex flex-shrink-0 overflow-hidden rounded-full",
          AVATAR_SIZES[size],
          className,
        )}
        {...rest}
      >
        {showImage ? (
          <Image
            src={src as string}
            alt={name ?? "avatar"}
            onError={() => setImgError(true)}
            fill
            unoptimized
            sizes="48px"
            className="object-cover"
          />
        ) : (
          <span
            className="grid h-full w-full place-items-center bg-gradient-to-br from-[var(--chart-1)] to-[var(--chart-4)] font-semibold text-white"
            style={
              gradient
                ? { backgroundImage: `linear-gradient(${gradient})` }
                : undefined
            }
          >
            {initials}
          </span>
        )}
      </span>
    );
  },
);

Avatar.displayName = "Avatar";

export default Avatar;

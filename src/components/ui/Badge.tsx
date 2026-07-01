"use client";

import { type HTMLAttributes } from "react";
import { cx } from "~/lib/cn";

type BadgeVariant = "solid" | "subtle" | "outline";
type BadgeType = "default" | "success" | "warning" | "error" | "info" | "new" | "hot";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  type?: BadgeType;
}

const typeColors = {
  default: {
    solid: "bg-gray-500 text-white",
    subtle: "bg-gray-100 text-gray-700",
    outline: "border border-gray-300 text-gray-600",
  },
  success: {
    solid: "bg-emerald-500 text-white",
    subtle: "bg-emerald-50 text-emerald-700",
    outline: "border border-emerald-300 text-emerald-600",
  },
  warning: {
    solid: "bg-amber-500 text-white",
    subtle: "bg-amber-50 text-amber-700",
    outline: "border border-amber-300 text-amber-600",
  },
  error: {
    solid: "bg-red-500 text-white",
    subtle: "bg-red-50 text-red-700",
    outline: "border border-red-300 text-red-600",
  },
  info: {
    solid: "bg-sky-500 text-white",
    subtle: "bg-sky-50 text-sky-700",
    outline: "border border-sky-300 text-sky-600",
  },
  new: {
    solid: "bg-gradient-to-r from-indigo-500 to-pink-500 text-white shadow-sm",
    subtle: "bg-indigo-50 text-indigo-700",
    outline: "border border-indigo-300 text-indigo-600",
  },
  hot: {
    solid: "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-sm",
    subtle: "bg-orange-50 text-orange-700",
    outline: "border border-orange-300 text-orange-600",
  },
};

export function Badge({ 
  className = "", 
  variant = "subtle", 
  type = "default", 
  children, 
  ...props 
}: BadgeProps) {
  return (
    <span
      className={cx(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        typeColors[type][variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

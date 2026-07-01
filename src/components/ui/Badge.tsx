"use client";

import { type HTMLAttributes } from "react";
import { cx } from "@/lib/cn";

type BadgeVariant = "solid" | "subtle" | "outline" | "gradient";
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
    gradient: "bg-gradient-to-r from-gray-500 to-gray-700 text-white shadow-sm",
  },
  success: {
    solid: "bg-emerald-500 text-white",
    subtle: "bg-emerald-50 text-emerald-700",
    outline: "border border-emerald-300 text-emerald-600",
    gradient: "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-sm",
  },
  warning: {
    solid: "bg-amber-500 text-white",
    subtle: "bg-amber-50 text-amber-700",
    outline: "border border-amber-300 text-amber-600",
    gradient: "bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-sm",
  },
  error: {
    solid: "bg-red-500 text-white",
    subtle: "bg-red-50 text-red-700",
    outline: "border border-red-300 text-red-600",
    gradient: "bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-sm",
  },
  info: {
    solid: "bg-sky-500 text-white",
    subtle: "bg-sky-50 text-sky-700",
    outline: "border border-sky-300 text-sky-600",
    gradient: "bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-sm",
  },
  new: {
    solid: "bg-gradient-to-r from-indigo-500 to-pink-500 text-white shadow-sm",
    subtle: "bg-indigo-50 text-indigo-700",
    outline: "border border-indigo-300 text-indigo-600",
    gradient: "bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white shadow-sm",
  },
  hot: {
    solid: "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-sm",
    subtle: "bg-orange-50 text-orange-700",
    outline: "border border-orange-300 text-orange-600",
    gradient: "bg-gradient-to-r from-orange-500 via-red-500 to-rose-600 text-white shadow-sm",
  },
};

function Badge({ 
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

export default Badge;
export { Badge };

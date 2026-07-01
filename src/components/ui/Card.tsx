"use client";

import { type HTMLAttributes, forwardRef } from "react";
import { cx } from "@/lib/cn";

type CardVariant = "default" | "elevated" | "glass" | "outline";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  hoverable?: boolean;
}

const CARD_STYLES: Record<CardVariant, string> = {
  default: "bg-white border border-gray-200",
  elevated: "bg-white shadow-sm hover:shadow-lg hover:-translate-y-1",
  glass: "bg-white/80 backdrop-blur-md border border-white/20",
  outline: "bg-transparent border border-gray-200",
};

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className = "", variant = "default", hoverable = false, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cx(
          "rounded-xl transition-all duration-200",
          CARD_STYLES[variant],
          hoverable && "cursor-pointer hover:-translate-y-1 hover:shadow-lg hover:border-primary",
          className,
        )}
        {...props}
      >
        {children}
      </div>
    );
  },
);

Card.displayName = "Card";

const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className = "", ...props }, ref) => (
    <div
      ref={ref}
      className={cx("px-6 py-4 border-b border-gray-100", className)}
      {...props}
    />
  ),
);

CardHeader.displayName = "CardHeader";

const CardBody = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className = "", ...props }, ref) => (
    <div ref={ref} className={cx("px-6 py-4", className)} {...props} />
  ),
);

CardBody.displayName = "CardBody";

const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className = "", ...props }, ref) => (
    <div
      ref={ref}
      className={cx("px-6 py-4 border-t border-gray-100", className)}
      {...props}
    />
  ),
);

CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardBody, CardFooter };
export type { CardVariant };

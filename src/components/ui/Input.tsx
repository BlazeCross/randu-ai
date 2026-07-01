"use client";

import { type InputHTMLAttributes, forwardRef } from "react";
import { cx } from "@/lib/cn";

type InputState = "default" | "focus" | "error" | "success" | "disabled";

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  label?: string;
  helperText?: string;
  errorMessage?: string;
  inputState?: InputState;
}

const stateStyles: Record<InputState, string> = {
  default: "border-gray-200 focus:border-primary focus:shadow-[0_0_0_3px_rgba(99,102,241,0.1)]",
  error: "border-red-500 focus:border-red-500 focus:shadow-[0_0_0_3px_rgba(239,68,68,0.1)]",
  success: "border-emerald-500 focus:border-emerald-500",
  disabled: "bg-gray-100 text-gray-400 cursor-not-allowed",
  focus: "border-primary shadow-[0_0_0_3px_rgba(99,102,241,0.1)]",
};

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className = "",
      label,
      helperText,
      errorMessage,
      inputState = "default",
      disabled,
      ...props
    },
    ref,
  ) => {
    const isError = inputState === "error";
    const isSuccess = inputState === "success";
    const isDisabled = inputState === "disabled" || disabled;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="text-sm font-medium text-foreground">
            {label}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            disabled={isDisabled}
            className={cx(
              "w-full rounded-xl border bg-white px-4 py-3 text-sm text-foreground transition-all duration-200 placeholder:text-gray-400",
              "focus:outline-none focus:ring-0",
              stateStyles[inputState],
              isDisabled && "cursor-not-allowed",
              className,
            )}
            {...props}
          />
          {isSuccess && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500">
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4.5 12.75l6 6 9-13.5"
                />
              </svg>
            </span>
          )}
        </div>
        {isError && errorMessage && (
          <span className="text-xs text-red-500">{errorMessage}</span>
        )}
        {!isError && helperText && (
          <span className="text-xs text-gray-500">{helperText}</span>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";
export { Input };
export type { InputState };

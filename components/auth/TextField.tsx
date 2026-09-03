"use client";

import { useId, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  hint?: string;
};

/**
 * Labeled input, matching the styling `SignupDialog` already established
 * (`h-12`, `border-white/12`, `bg-ink-950`) rather than inventing a new look
 * for auth specifically.
 */
export function TextField({
  label,
  error,
  hint,
  id,
  className,
  ...rest
}: TextFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={inputId}
        className="font-display text-[0.72rem] font-semibold tracking-[0.08em] text-mist uppercase"
      >
        {label}
      </label>
      <input
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={cn(hintId, errorId) || undefined}
        className={cn(
          "h-12 rounded-xl border bg-ink-950 px-4 text-[0.95rem] text-white placeholder:text-muted/70 transition-colors duration-200 focus:outline-none",
          // No separate "error red" exists in this palette — one brand
          // yellow, per the colour-unification pass. Error state reads via
          // the message + a brighter border, not a different hue.
          error
            ? "border-brand focus:border-brand focus:ring-2 focus:ring-brand/25"
            : "border-white/12 focus:border-brand/50 focus:ring-2 focus:ring-brand/25",
          className,
        )}
        {...rest}
      />
      {hint && !error ? (
        <p id={hintId} className="text-[0.8rem] text-muted">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} role="alert" className="text-[0.8rem] text-brand">
          {error}
        </p>
      ) : null}
    </div>
  );
}

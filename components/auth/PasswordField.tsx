"use client";

import { Eye, EyeOff } from "lucide-react";
import { useId, useState, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type PasswordFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label: string;
  error?: string;
};

/** `TextField` plus a show/hide toggle — never a separate password-history log. */
export function PasswordField({
  label,
  error,
  id,
  className,
  ...rest
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const errorId = error ? `${inputId}-error` : undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={inputId}
        className="font-display text-[0.72rem] font-semibold tracking-[0.08em] text-mist uppercase"
      >
        {label}
      </label>
      <div className="relative">
        <input
          id={inputId}
          type={visible ? "text" : "password"}
          aria-invalid={error ? true : undefined}
          aria-describedby={errorId}
          className={cn(
            "h-12 w-full rounded-xl border bg-ink-950 pr-12 pl-4 text-[0.95rem] text-white placeholder:text-muted/70 transition-colors duration-200 focus:outline-none",
            error
              ? "border-brand focus:border-brand focus:ring-2 focus:ring-brand/25"
              : "border-white/12 focus:border-brand/50 focus:ring-2 focus:ring-brand/25",
            className,
          )}
          {...rest}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          className="absolute top-1/2 right-3 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-muted transition-colors duration-200 hover:bg-white/6 hover:text-white"
        >
          {visible ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
        </button>
      </div>
      {error ? (
        <p id={errorId} role="alert" className="text-[0.8rem] text-brand">
          {error}
        </p>
      ) : null}
    </div>
  );
}

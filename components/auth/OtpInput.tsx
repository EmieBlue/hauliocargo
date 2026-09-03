"use client";

import { useRef } from "react";
import { cn } from "@/lib/cn";

const LENGTH = 6;

/**
 * Six digit boxes acting as one value. Handles paste (a full code dropped
 * into any box fills all six) and backspace-to-previous, since a real user
 * pastes a code from their email/SMS app far more often than they type it
 * digit by digit.
 */
export function OtpInput({
  value,
  onChange,
  error,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
}) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const digits = Array.from({ length: LENGTH }, (_, i) => value[i] ?? "");

  function setDigit(index: number, digit: string) {
    const next = digits.slice();
    next[index] = digit;
    onChange(next.join(""));
  }

  function handleChange(index: number, raw: string) {
    const cleaned = raw.replace(/\D/g, "");
    if (!cleaned) {
      setDigit(index, "");
      return;
    }
    if (cleaned.length > 1) {
      // A paste landed in a single box — distribute it from here.
      const next = digits.slice();
      for (let i = 0; i < cleaned.length && index + i < LENGTH; i++) {
        next[index + i] = cleaned[i];
      }
      onChange(next.join(""));
      const lastFilled = Math.min(index + cleaned.length, LENGTH) - 1;
      refs.current[lastFilled]?.focus();
      return;
    }
    setDigit(index, cleaned);
    if (index < LENGTH - 1) refs.current[index + 1]?.focus();
  }

  function handleKeyDown(index: number, event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
    if (event.key === "ArrowLeft" && index > 0) refs.current[index - 1]?.focus();
    if (event.key === "ArrowRight" && index < LENGTH - 1) refs.current[index + 1]?.focus();
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between gap-2 sm:gap-3">
        {digits.map((digit, index) => (
          <input
            key={index}
            ref={(el) => {
              refs.current[index] = el;
            }}
            type="text"
            inputMode="numeric"
            autoComplete={index === 0 ? "one-time-code" : "off"}
            maxLength={LENGTH}
            value={digit}
            disabled={disabled}
            onChange={(event) => handleChange(index, event.target.value)}
            onKeyDown={(event) => handleKeyDown(index, event)}
            aria-label={`Digit ${index + 1} of ${LENGTH}`}
            aria-invalid={error ? true : undefined}
            className={cn(
              "h-14 w-full max-w-14 rounded-xl border bg-ink-950 text-center font-display text-xl font-bold text-white transition-colors duration-200 focus:outline-none",
              error
                ? "border-brand focus:border-brand focus:ring-2 focus:ring-brand/25"
                : "border-white/12 focus:border-brand/50 focus:ring-2 focus:ring-brand/25",
            )}
          />
        ))}
      </div>
      {error ? (
        <p role="alert" className="text-[0.8rem] text-brand">
          {error}
        </p>
      ) : null}
    </div>
  );
}

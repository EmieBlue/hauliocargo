import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type BadgeProps = {
  children: ReactNode;
  className?: string;
  /** Adds a slow pulsing dot. Used for "coming soon" states. */
  pulse?: boolean;
};

export function Badge({ children, className, pulse = false }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-brand/35 bg-brand/8 px-3.5 py-1.5",
        "font-display text-[0.62rem] font-semibold tracking-[0.2em] text-brand uppercase",
        className,
      )}
    >
      {pulse ? (
        <span className="relative flex size-1.5" aria-hidden>
          <span className="absolute inset-0 rounded-full bg-brand animate-pulse-ring" />
          <span className="relative size-1.5 rounded-full bg-brand" />
        </span>
      ) : null}
      {children}
    </span>
  );
}

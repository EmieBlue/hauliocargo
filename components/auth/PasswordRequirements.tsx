"use client";

import { Check, X } from "lucide-react";
import { cn } from "@/lib/cn";
import {
  PASSWORD_REQUIREMENTS,
  passwordStrength,
  type PasswordStrength,
} from "@/lib/validation";

const STRENGTH_COPY: Record<PasswordStrength, { label: string; className: string }> = {
  weak: { label: "Weak", className: "bg-white/25 w-1/3" },
  fair: { label: "Fair", className: "bg-brand/70 w-2/3" },
  strong: { label: "Strong", className: "bg-brand w-full" },
};

/** Live checklist + strength bar, shown while a password is being typed. */
export function PasswordRequirements({ value }: { value: string }) {
  const strength = passwordStrength(value);
  const meter = STRENGTH_COPY[strength];

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-white/8 bg-white/[0.02] p-4">
      <div className="flex flex-col gap-1.5">
        <div className="h-1.5 overflow-hidden rounded-full bg-white/8">
          <div
            className={cn("h-full rounded-full transition-all duration-300 ease-brand", meter.className)}
          />
        </div>
        <span className="font-display text-[0.65rem] font-semibold tracking-[0.1em] text-muted uppercase">
          {value ? meter.label : "Password strength"}
        </span>
      </div>

      <ul className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
        {PASSWORD_REQUIREMENTS.map((rule) => {
          const met = rule.test(value);
          return (
            <li
              key={rule.id}
              className={cn(
                "flex items-center gap-1.5 text-[0.8rem] transition-colors duration-200",
                met ? "text-white" : "text-muted",
              )}
            >
              {met ? (
                <Check className="size-3.5 shrink-0 text-brand" aria-hidden />
              ) : (
                <X className="size-3.5 shrink-0 text-muted/50" aria-hidden />
              )}
              {rule.label}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

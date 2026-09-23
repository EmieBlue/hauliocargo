"use client";

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import { Card } from "@/components/ui/Card";

export function RoleCard({
  icon: Icon,
  title,
  body,
  selected,
  onSelect,
  testId,
}: {
  icon: LucideIcon;
  title: string;
  body: string;
  selected: boolean;
  onSelect: () => void;
  /** Stable hook for tests — the DOM position of Customer vs. Driver isn't. */
  testId?: string;
}) {
  return (
    <Card
      className={cn(
        "cursor-pointer transition-[border-color,background-color] duration-300",
        selected && "border-brand bg-brand/[0.06] shadow-[0_28px_70px_-40px_rgba(255,170,0,0.55)]",
      )}
    >
      <button
        type="button"
        onClick={onSelect}
        aria-pressed={selected}
        data-testid={testId}
        className="flex w-full flex-col items-center gap-4 p-7 text-center md:p-8"
      >
        {/* Yellow chip, black icon — same rule as every other icon chip on
         * the site, regardless of `selected` (currently always `false` here,
         * both cards are plain navigation, not a real selection). */}
        <span className="grid size-14 place-items-center rounded-2xl border border-brand/40 bg-brand text-black">
          <Icon className="size-6" aria-hidden />
        </span>
        <div className="flex flex-col gap-1.5">
          <h3 className="font-display text-lg font-bold text-white">{title}</h3>
          <p className="text-[0.9rem] leading-relaxed text-muted">{body}</p>
        </div>
      </button>
    </Card>
  );
}

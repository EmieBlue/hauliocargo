import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { RevealGroup, RevealItem } from "./Reveal";

type SectionHeadingProps = {
  eyebrow?: string;
  title: ReactNode;
  sub?: ReactNode;
  align?: "left" | "center";
  className?: string;
};

export function SectionHeading({
  eyebrow,
  title,
  sub,
  align = "left",
  className,
}: SectionHeadingProps) {
  const centered = align === "center";

  return (
    <RevealGroup
      className={cn(
        "flex max-w-2xl flex-col gap-5",
        centered && "mx-auto items-center text-center",
        className,
      )}
    >
      {eyebrow ? (
        <RevealItem
          className={cn(
            "flex items-center gap-3",
            centered && "justify-center",
          )}
        >
          <span className="h-px w-8 bg-brand/70" aria-hidden />
          <span className="font-display text-[0.68rem] font-semibold tracking-[0.24em] text-brand uppercase">
            {eyebrow}
          </span>
        </RevealItem>
      ) : null}

      <RevealItem
        as="h2"
        className="text-[clamp(1.9rem,4.4vw,3rem)] leading-[1.08] text-white text-balance"
      >
        {title}
      </RevealItem>

      {sub ? (
        <RevealItem
          as="p"
          className="max-w-xl text-[clamp(0.95rem,1.6vw,1.06rem)] leading-relaxed text-muted text-pretty"
        >
          {sub}
        </RevealItem>
      ) : null}
    </RevealGroup>
  );
}

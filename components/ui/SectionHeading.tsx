import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { RevealGroup, RevealItem } from "./Reveal";

type SectionHeadingProps = {
  eyebrow?: string;
  title: ReactNode;
  sub?: ReactNode;
  align?: "left" | "center";
  className?: string;
  /**
   * "dark" (default) is white/muted text for the site's usual dark-video
   * backdrop. "light" is for a section that sits on a solid brand-yellow
   * panel instead (e.g. `CargoScene`) — dark text, same idea as the navbar
   * swapping to black text once its own background turns yellow.
   */
  tone?: "dark" | "light";
};

export function SectionHeading({
  eyebrow,
  title,
  sub,
  align = "left",
  className,
  tone = "dark",
}: SectionHeadingProps) {
  const centered = align === "center";
  const light = tone === "light";

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
          <span className={cn("h-px w-8", light ? "bg-black/40" : "bg-brand/70")} aria-hidden />
          <span
            className={cn(
              "font-display text-[0.68rem] font-semibold tracking-[0.24em] uppercase",
              light ? "text-black/70" : "text-brand",
            )}
          >
            {eyebrow}
          </span>
        </RevealItem>
      ) : null}

      <RevealItem
        as="h2"
        className={cn(
          "text-[clamp(1.9rem,4.4vw,3rem)] leading-[1.08] text-balance",
          light ? "text-black" : "text-fg",
        )}
      >
        {title}
      </RevealItem>

      {sub ? (
        <RevealItem
          as="p"
          className={cn(
            "max-w-xl text-[clamp(0.95rem,1.6vw,1.06rem)] leading-relaxed text-pretty",
            light ? "text-black/65" : "text-muted",
          )}
        >
          {sub}
        </RevealItem>
      ) : null}
    </RevealGroup>
  );
}

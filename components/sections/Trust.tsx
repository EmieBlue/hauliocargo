"use client";

import { BadgeCheck, MapPin, Receipt, ShieldCheck } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { BRAND, SECTION_IDS, TRUST_POINTS } from "@/lib/site";
import { Card } from "@/components/ui/Card";
import { RevealGroup, RevealItem } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { useTheme } from "@/lib/useTheme";
import { cn } from "@/lib/cn";

const TRUST_ICONS: LucideIcon[] = [BadgeCheck, Receipt, MapPin, ShieldCheck];

/**
 * Reliability, and the page's "About Us" anchor.
 *
 * No statistics appear here on purpose — HaulioCargo has not launched, so there
 * are no driver counts or delivery totals to quote.
 */
export function Trust() {
  const [theme] = useTheme();

  return (
    <section
      id={SECTION_IDS.about}
      className="relative scroll-mt-24 overflow-hidden border-t border-edge/6 py-20 md:py-28"
    >
      <div aria-hidden data-theme="dark" className="absolute inset-0 bg-ink-950/60" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          background:
            "radial-gradient(760px 420px at 50% 0%, rgba(255,170,0,0.07), transparent 70%)",
        }}
      />

      <div className="container-page relative">
        <SectionHeading
          align="center"
          eyebrow="About us"
          title={
            <>
              Built to be the part you{" "}
              <span className="text-brand-gradient">don&rsquo;t have to worry about</span>
            </>
          }
          sub={BRAND.about}
        />

        <RevealGroup
          className="mt-14 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4"
          stagger={0.1}
        >
          {TRUST_POINTS.map((point, index) => {
            const Icon = TRUST_ICONS[index];
            return (
              <RevealItem key={point.title}>
                <Card className="h-full">
                  <div className="flex h-full flex-col items-center gap-3.5 p-6 text-center">
                    <span
                      className={cn(
                        "grid size-14 place-items-center rounded-2xl bg-brand transition-[filter] duration-500 group-hover/card:brightness-110",
                        theme === "light" ? "text-white" : "text-black",
                      )}
                    >
                      <Icon className="size-6" aria-hidden />
                    </span>
                    <h3 className="font-display text-base font-bold text-fg">
                      {point.title}
                    </h3>
                    <p className="max-w-xs text-[0.88rem] leading-relaxed text-muted text-pretty">
                      {point.body}
                    </p>
                  </div>
                </Card>
              </RevealItem>
            );
          })}
        </RevealGroup>
      </div>
    </section>
  );
}

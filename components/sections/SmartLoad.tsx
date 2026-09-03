"use client";

import { motion } from "framer-motion";
import { Camera, ChevronRight, Cpu, Truck } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { EASE, VIEWPORT } from "@/lib/motion";
import { SECTION_IDS } from "@/lib/site";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { RevealGroup, RevealItem } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";

type Node = {
  icon: LucideIcon;
  step: string;
  title: string;
  body: string;
};

const NODES: Node[] = [
  {
    icon: Camera,
    step: "Input",
    title: "Upload Cargo Photos",
    body: "Snap what you're moving — a room, a pile of boxes, a single sofa.",
  },
  {
    icon: Cpu,
    step: "Analysis",
    title: "SmartLoad Analysis",
    body: "The photos and your answers are read together to size up the load.",
  },
  {
    icon: Truck,
    step: "Result",
    title: "Recommended Vehicle",
    body: "You get a suggested truck size — and you can always change it.",
  },
];

/**
 * Concept preview only. There is no upload control here and no model behind it:
 * SmartLoad is labelled COMING SOON precisely because it has not been built.
 */
export function SmartLoad() {
  return (
    <section
      id={SECTION_IDS.smartload}
      className="relative scroll-mt-24 overflow-hidden border-t border-white/6 py-20 md:py-28"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-brand/30 to-transparent"
      />

      <div className="container-page">
        <div className="flex flex-col items-center gap-6 text-center">
          <Badge pulse>Coming Soon</Badge>
          <SectionHeading
            align="center"
            eyebrow="Haulio SmartLoad&trade;"
            title={
              <>
                Not sure which truck{" "}
                <span className="text-brand-gradient">you need?</span>
              </>
            }
            sub="Load smarter. Haulio SmartLoad™ recommends the right vehicle for your cargo."
          />
        </div>

        {/* Flow: horizontal on desktop, stacked on mobile */}
        <div className="relative mt-14">
          <RevealGroup className="grid gap-5 md:grid-cols-3" stagger={0.16}>
            {NODES.map(({ icon: Icon, step, title, body }, index) => (
              <RevealItem key={title}>
                <Card className="h-full">
                  <div className="flex h-full flex-col items-center gap-4 p-7 text-center md:p-8">
                    <span className="relative grid size-16 place-items-center overflow-hidden rounded-2xl border border-brand/25 bg-ink-950 text-brand">
                      <Icon className="size-6" aria-hidden />
                      {/* Scan sweep on the analysis node only */}
                      {index === 1 ? (
                        <span
                          aria-hidden
                          className="pointer-events-none absolute inset-x-2 top-0 h-8 animate-scan bg-linear-to-b from-transparent via-brand/45 to-transparent"
                        />
                      ) : null}
                    </span>

                    <span className="font-display text-[0.6rem] font-semibold tracking-[0.22em] text-muted uppercase">
                      {step}
                    </span>
                    <h3 className="font-display text-lg font-bold text-white">{title}</h3>
                    <p className="text-[0.9rem] leading-relaxed text-muted text-pretty">
                      {body}
                    </p>
                  </div>
                </Card>
              </RevealItem>
            ))}
          </RevealGroup>

          {/*
           * Flow connectors sit in the grid gaps rather than as one long rule:
           * a full-width line reads as a stray stroke crossing the cards.
           */}
          {[1, 2].map((index) => (
            <motion.span
              key={index}
              aria-hidden
              initial={{ opacity: 0, scale: 0.7 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={VIEWPORT}
              transition={{ duration: 0.5, ease: EASE, delay: 0.3 + index * 0.16 }}
              style={{ left: `${(index * 100) / 3}%` }}
              className="pointer-events-none absolute top-16 hidden -translate-x-1/2 -translate-y-1/2 place-items-center md:grid"
            >
              <span className="grid size-8 place-items-center rounded-full border border-brand/30 bg-ink-950 text-brand">
                <ChevronRight className="size-4" aria-hidden />
              </span>
            </motion.span>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={VIEWPORT}
          transition={{ duration: 0.8, ease: EASE, delay: 0.3 }}
          className="mx-auto mt-10 max-w-xl text-center text-[0.82rem] leading-relaxed text-muted/70"
        >
          SmartLoad™ is in development. Vehicle recommendations are intended as
          assistance — you stay in control of the truck you book.
        </motion.p>
      </div>
    </section>
  );
}

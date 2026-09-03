import { Camera, ClipboardCheck, Truck } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { HOW_IT_WORKS_STEPS, SECTION_IDS } from "@/lib/site";
import { Card } from "@/components/ui/Card";
import { RevealGroup, RevealItem } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";

const STEP_ICONS: LucideIcon[] = [Camera, ClipboardCheck, Truck];

export function HowItWorks() {
  return (
    <section
      id={SECTION_IDS.howItWorks}
      className="relative scroll-mt-24 border-t border-white/6 py-20 md:py-28"
    >
      <div className="container-page">
        <SectionHeading
          eyebrow="How it works"
          title={
            <>
              Three steps from{" "}
              <span className="text-brand-gradient">packed to delivered</span>
            </>
          }
          sub="No guesswork about vehicle size, no surprises when the driver arrives."
        />

        <RevealGroup className="mt-14 grid gap-5 md:grid-cols-3" stagger={0.14}>
          {HOW_IT_WORKS_STEPS.map((step, index) => {
            const Icon = STEP_ICONS[index];
            return (
              <RevealItem key={step.number}>
                <Card className="h-full">
                  <div className="relative flex h-full flex-col gap-5 p-7 md:p-8">
                    {/* Oversized ghost numeral */}
                    <span
                      aria-hidden
                      className="pointer-events-none absolute -top-2 right-4 font-display text-[5.5rem] leading-none font-extrabold text-brand/8 transition-colors duration-500 group-hover/card:text-brand/14"
                    >
                      {step.number}
                    </span>

                    <span className="relative grid size-12 place-items-center rounded-xl border border-brand/25 bg-brand/10 text-brand">
                      <Icon className="size-5" aria-hidden />
                    </span>

                    <div className="relative flex flex-col gap-2.5">
                      <span className="font-display text-[0.62rem] font-semibold tracking-[0.22em] text-brand uppercase">
                        Step {step.number}
                      </span>
                      <h3 className="font-display text-xl font-bold text-white">
                        {step.title}
                      </h3>
                      <p className="text-[0.94rem] leading-relaxed text-muted text-pretty">
                        {step.body}
                      </p>
                    </div>
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

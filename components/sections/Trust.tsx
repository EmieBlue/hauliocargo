import { BadgeCheck, MapPin, Receipt, ShieldCheck } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { BRAND, SECTION_IDS, TRUST_POINTS } from "@/lib/site";
import { RevealGroup, RevealItem } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";

const TRUST_ICONS: LucideIcon[] = [BadgeCheck, Receipt, MapPin, ShieldCheck];

/**
 * Reliability, and the page's "About Us" anchor.
 *
 * No statistics appear here on purpose — HaulioCargo has not launched, so there
 * are no driver counts or delivery totals to quote.
 */
export function Trust() {
  return (
    <section
      id={SECTION_IDS.about}
      className="relative scroll-mt-24 overflow-hidden border-t border-white/6 py-20 md:py-28"
    >
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
              <RevealItem key={point.title} className="flex flex-col items-center text-center">
                <span className="grid size-14 place-items-center rounded-2xl border border-white/10 bg-ink-850 text-brand transition-[border-color,box-shadow] duration-500 hover:border-brand/40 hover:shadow-[0_0_32px_-8px_rgba(255,170,0,0.5)]">
                  <Icon className="size-6" aria-hidden />
                </span>
                <h3 className="mt-5 font-display text-base font-bold text-white">
                  {point.title}
                </h3>
                <p className="mt-2.5 max-w-xs text-[0.88rem] leading-relaxed text-muted text-pretty">
                  {point.body}
                </p>
              </RevealItem>
            );
          })}
        </RevealGroup>
      </div>
    </section>
  );
}

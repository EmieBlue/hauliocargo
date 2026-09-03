import { Boxes, Building2, Hammer, Sofa } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { CARGO_CATEGORIES, SECTION_IDS } from "@/lib/site";
import { CargoStage } from "@/components/three/CargoStage";
import { Card } from "@/components/ui/Card";
import { RevealGroup, RevealItem } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";

const CATEGORY_ICONS: LucideIcon[] = [Boxes, Sofa, Building2, Hammer];

/**
 * The interactive cargo scene, and the page's "Services" anchor: what
 * HaulioCargo actually moves.
 */
export function CargoScene() {
  return (
    <section
      id={SECTION_IDS.services}
      className="relative scroll-mt-24 overflow-hidden border-t border-white/6 py-20 md:py-28"
    >
      <div className="container-page">
        <SectionHeading
          eyebrow="Services"
          align="center"
          title={
            <>
              Whatever you&rsquo;re moving,{" "}
              <span className="text-brand-gradient">there&rsquo;s a truck for it</span>
            </>
          }
          sub="Household goods, furniture and appliances, business stock or building materials — tell us what it is and we help match it to the right vehicle."
        />
      </div>

      {/* Full-bleed stage so the scene has room to breathe */}
      <div className="relative mt-12 h-[320px] w-full sm:h-[400px] lg:h-[500px]">
        <CargoStage className="absolute inset-0" />
        {/* Fade the stage into the section on all four edges */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-linear-to-b from-ink-950 via-transparent to-ink-950"
        />
      </div>

      <div className="container-page">
        <RevealGroup className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" stagger={0.08}>
          {CARGO_CATEGORIES.map((category, index) => {
            const Icon = CATEGORY_ICONS[index];
            return (
              <RevealItem key={category.title}>
                <Card className="h-full" tilt={false}>
                  <div className="flex h-full flex-col gap-3.5 p-6">
                    <Icon className="size-5 text-brand" aria-hidden />
                    <h3 className="font-display text-base font-bold text-white">
                      {category.title}
                    </h3>
                    <p className="text-[0.88rem] leading-relaxed text-muted text-pretty">
                      {category.body}
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

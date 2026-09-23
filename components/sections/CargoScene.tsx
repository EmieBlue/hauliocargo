import { Boxes, Building2, Hammer, Sofa } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { CARGO_CATEGORIES, SECTION_IDS } from "@/lib/site";
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
      className="relative scroll-mt-24 overflow-hidden border-t border-black/10 py-20 md:py-28"
    >
      {/* Solid brand yellow, not a translucent tint — a translucent wash over
       * the video underneath read as a muddy gold rather than the site's
       * actual yellow, so this section fully covers the video instead (same
       * idea as the scrolled navbar: a real yellow surface, dark text/cards
       * on top of it). */}
      <div aria-hidden className="absolute inset-0 bg-brand" />
      <div className="container-page relative">
        <SectionHeading
          eyebrow="Services"
          align="center"
          tone="light"
          title={
            <>
              Whatever you&rsquo;re moving,{" "}
              <span className="font-extrabold text-black">there&rsquo;s a truck for it</span>
            </>
          }
          sub="Household goods, furniture and appliances, business stock or building materials — tell us what it is and we help match it to the right vehicle."
        />
      </div>

      <div className="container-page relative">
        <RevealGroup className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" stagger={0.08}>
          {CARGO_CATEGORIES.map((category, index) => {
            const Icon = CATEGORY_ICONS[index];
            return (
              <RevealItem key={category.title}>
                <Card className="h-full" tilt={false}>
                  <div className="flex h-full flex-col gap-3.5 p-6">
                    <span className="grid size-12 place-items-center rounded-xl bg-brand text-black">
                      <Icon className="size-5" aria-hidden />
                    </span>
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

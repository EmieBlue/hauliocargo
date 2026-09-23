"use client";

import { Boxes, Building2, Hammer, Sofa } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { CARGO_CATEGORIES, SECTION_IDS } from "@/lib/site";
import { Card } from "@/components/ui/Card";
import { RevealGroup, RevealItem } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { useTheme } from "@/lib/useTheme";
import { cn } from "@/lib/cn";

const CATEGORY_ICONS: LucideIcon[] = [Boxes, Sofa, Building2, Hammer];

/**
 * The interactive cargo scene, and the page's "Services" anchor: what
 * HaulioCargo actually moves.
 */
export function CargoScene() {
  const [theme] = useTheme();

  return (
    <section
      id={SECTION_IDS.services}
      className="relative scroll-mt-24 overflow-hidden border-t border-edge/6 py-20 md:py-28"
    >
      {/* Same dark panel treatment as every sibling section — only the card
       * row below gets the solid yellow, not this heading. */}
      <div aria-hidden className="absolute inset-0 bg-ink-950/60" />
      <div className="container-page relative">
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

      {/* Solid brand yellow, bounded to just this band (not the whole
       * section) — a translucent wash over the video underneath read as a
       * muddy gold rather than the site's actual yellow, so this fully
       * covers the video within its own height instead, same idea as the
       * scrolled navbar: a real yellow surface, dark cards on top of it. */}
      <div className="relative mt-12 py-10 md:py-12">
        <div aria-hidden className="absolute inset-0 bg-brand" />
        <div className="container-page relative">
          <RevealGroup className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" stagger={0.08}>
            {CARGO_CATEGORIES.map((category, index) => {
              const Icon = CATEGORY_ICONS[index];
              return (
                <RevealItem key={category.title}>
                  {/* Pinned dark regardless of site theme — see the
                   * `[data-theme="dark"]` block in app/globals.css (same
                   * mechanism Footer.tsx uses). */}
                  <div data-theme="dark" className="h-full">
                    <Card className="h-full" tilt={false}>
                      <div className="flex h-full flex-col gap-3.5 p-6">
                        <span
                          className={cn(
                            "grid size-12 place-items-center rounded-xl bg-brand",
                            // Deliberately theme-driven, unlike every other
                            // yellow-chip icon on the site (which stay
                            // black-on-yellow always) — confirmed request.
                            theme === "light" ? "text-white" : "text-black",
                          )}
                        >
                          <Icon className="size-5" aria-hidden />
                        </span>
                        <h3 className="font-display text-base font-bold text-fg">
                          {category.title}
                        </h3>
                        <p className="text-[0.88rem] leading-relaxed text-muted text-pretty">
                          {category.body}
                        </p>
                      </div>
                    </Card>
                  </div>
                </RevealItem>
              );
            })}
          </RevealGroup>
        </div>
      </div>
    </section>
  );
}

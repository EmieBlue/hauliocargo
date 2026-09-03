"use client";

import { motion, useTransform } from "framer-motion";
import { Armchair, Package, Refrigerator, Sofa, Tv } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import { usePointerParallax } from "@/lib/usePointerParallax";
import { useSettledReducedMotion } from "@/lib/useSettledReducedMotion";
import { TruckSilhouette } from "./TruckSilhouette";

type FloatingItem = {
  icon: LucideIcon;
  label: string;
  /**
   * Percentage inset within the stage. Right-hand chips anchor by `right`, not
   * `left`: a chip placed at `left: 84%` starts 84% across and then runs its own
   * width past the edge, which on a phone clipped half the label off.
   */
  left?: string;
  right?: string;
  top: string;
  /** Parallax depth: higher moves further with the pointer. */
  depth: number;
  delay: string;
  /**
   * Dropped on the narrowest screens. At 390px the truck spans nearly the full
   * stage, so anything sitting beside or below it gets painted over — and five
   * chips around a phone-sized truck is exactly the overcrowding the design is
   * meant to avoid. Mobile keeps the two that sit clear, above the truck band.
   */
  hideOnMobile?: boolean;
};

const ITEMS: FloatingItem[] = [
  { icon: Package, label: "Boxes", left: "4%", top: "18%", depth: 26, delay: "0s" },
  { icon: Sofa, label: "Sofa", right: "4%", top: "11%", depth: 34, delay: "1.1s" },
  {
    icon: Refrigerator,
    label: "Appliances",
    left: "3%",
    top: "58%",
    depth: 18,
    delay: "2.2s",
    hideOnMobile: true,
  },
  {
    icon: Armchair,
    label: "Furniture",
    right: "3%",
    top: "52%",
    depth: 30,
    delay: "0.6s",
    hideOnMobile: true,
  },
  {
    icon: Tv,
    label: "Electronics",
    left: "38%",
    top: "9%",
    depth: 22,
    delay: "1.7s",
    hideOnMobile: true,
  },
];

/** Non-WebGL version of the cargo scene: same idea, a fraction of the cost. */
export default function CargoFallback({ className }: { className?: string }) {
  const reduced = useSettledReducedMotion();
  const { ref, x, y } = usePointerParallax<HTMLDivElement>(reduced);

  const truckX = useTransform(x, [-1, 1], [16, -16]);
  const truckRotate = useTransform(x, [-1, 1], [4, -4]);

  return (
    <div
      ref={ref}
      aria-hidden
      className={cn("relative h-full w-full overflow-hidden", className)}
    >
      <div className="absolute top-1/2 left-1/2 h-[60%] w-[70%] -translate-x-1/2 -translate-y-1/2 rounded-[50%] bg-brand/10 blur-[100px]" />

      {ITEMS.map((item) => (
        <FloatingChip key={item.label} item={item} x={x} y={y} reduced={reduced} />
      ))}

      <motion.div
        style={reduced ? undefined : { x: truckX, rotate: truckRotate }}
        className="absolute inset-x-0 bottom-[14%] mx-auto w-[min(84%,620px)]"
      >
        <TruckSilhouette animateWheels={false} />
      </motion.div>
    </div>
  );
}

function FloatingChip({
  item,
  x,
  y,
  reduced,
}: {
  item: FloatingItem;
  x: ReturnType<typeof usePointerParallax<HTMLDivElement>>["x"];
  y: ReturnType<typeof usePointerParallax<HTMLDivElement>>["y"];
  reduced: boolean;
}) {
  const offsetX = useTransform(x, [-1, 1], [item.depth, -item.depth]);
  const offsetY = useTransform(y, [-1, 1], [item.depth * 0.6, -item.depth * 0.6]);
  const Icon = item.icon;

  return (
    <motion.div
      style={
        reduced
          ? { left: item.left, right: item.right, top: item.top }
          : { left: item.left, right: item.right, top: item.top, x: offsetX, y: offsetY }
      }
      className={cn("absolute", item.hideOnMobile && "hidden sm:block")}
    >
      <div
        className="flex items-center gap-2 rounded-xl border border-white/10 bg-ink-850/80 px-3 py-2 backdrop-blur-sm sm:gap-2.5 sm:px-3.5 sm:py-2.5"
        style={
          reduced
            ? undefined
            : { animation: `float-slow 7s ease-in-out ${item.delay} infinite` }
        }
      >
        <Icon className="size-4 text-brand" aria-hidden />
        <span className="font-display text-[0.66rem] font-semibold tracking-[0.14em] text-mist uppercase">
          {item.label}
        </span>
      </div>
    </motion.div>
  );
}

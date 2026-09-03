"use client";

import { motion, useTransform } from "framer-motion";
import { Package, Sofa } from "lucide-react";
import { cn } from "@/lib/cn";
import { usePointerParallax } from "@/lib/usePointerParallax";
import { useSettledReducedMotion } from "@/lib/useSettledReducedMotion";
import { TruckSilhouette } from "./TruckSilhouette";

/** Non-WebGL version of the auth visual — same idea as `CargoFallback`, sparser. */
export default function AuthFallback({ className }: { className?: string }) {
  const reduced = useSettledReducedMotion();
  // Only horizontal drift here — this visual is a modest side column, not a
  // full hero, so vertical parallax would be more motion than the space
  // warrants. `y` is intentionally unused.
  const { ref, x } = usePointerParallax<HTMLDivElement>(reduced);

  const truckX = useTransform(x, [-1, 1], [10, -10]);
  const truckRotate = useTransform(x, [-1, 1], [3, -3]);
  const boxOffset = useTransform(x, [-1, 1], [14, -14]);
  const sofaOffset = useTransform(x, [-1, 1], [-14, 14]);

  return (
    <div
      ref={ref}
      aria-hidden
      className={cn("relative h-full w-full overflow-hidden", className)}
    >
      <div className="absolute top-1/2 left-1/2 h-[65%] w-[80%] -translate-x-1/2 -translate-y-1/2 rounded-[50%] bg-brand/10 blur-[100px]" />

      <motion.div
        style={reduced ? undefined : { x: boxOffset }}
        className="absolute top-[16%] left-[8%]"
      >
        <div
          className="flex items-center gap-2 rounded-xl border border-white/10 bg-ink-850/80 px-3 py-2 backdrop-blur-sm"
          style={reduced ? undefined : { animation: "float-slow 7s ease-in-out infinite" }}
        >
          <Package className="size-4 text-brand" aria-hidden />
          <span className="font-display text-[0.66rem] font-semibold tracking-[0.14em] text-mist uppercase">
            Boxes
          </span>
        </div>
      </motion.div>

      <motion.div
        style={reduced ? undefined : { x: sofaOffset }}
        className="absolute top-[12%] right-[8%]"
      >
        <div
          className="flex items-center gap-2 rounded-xl border border-white/10 bg-ink-850/80 px-3 py-2 backdrop-blur-sm"
          style={reduced ? undefined : { animation: "float-slow 8s ease-in-out 1.1s infinite" }}
        >
          <Sofa className="size-4 text-brand" aria-hidden />
          <span className="font-display text-[0.66rem] font-semibold tracking-[0.14em] text-mist uppercase">
            Furniture
          </span>
        </div>
      </motion.div>

      <motion.div
        style={
          reduced
            ? undefined
            : { x: truckX, rotate: truckRotate }
        }
        className="absolute inset-x-0 bottom-[18%] mx-auto w-[min(80%,420px)]"
      >
        <TruckSilhouette animateWheels={!reduced} />
      </motion.div>
    </div>
  );
}

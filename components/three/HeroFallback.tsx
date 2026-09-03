"use client";

import { motion, useTransform } from "framer-motion";
import { cn } from "@/lib/cn";
import { usePointerParallax } from "@/lib/usePointerParallax";
import { useSettledReducedMotion } from "@/lib/useSettledReducedMotion";
import { TruckSilhouette } from "./TruckSilhouette";

/** Deterministic streak layout — identical on server and client. */
const STREAKS = [
  { top: "22%", width: 180, duration: 3.4, delay: 0, opacity: 0.3, warm: true },
  { top: "34%", width: 110, duration: 4.6, delay: 1.1, opacity: 0.2, warm: false },
  { top: "47%", width: 230, duration: 2.9, delay: 0.5, opacity: 0.35, warm: true },
  { top: "58%", width: 140, duration: 5.2, delay: 2.0, opacity: 0.18, warm: false },
  { top: "69%", width: 200, duration: 3.8, delay: 1.6, opacity: 0.28, warm: true },
  { top: "78%", width: 90, duration: 4.2, delay: 0.9, opacity: 0.16, warm: false },
];

/**
 * The scene every device can afford: layered vectors in CSS 3D space, with the
 * same composition, palette and sense of motion as the WebGL version.
 */
export default function HeroFallback({ className }: { className?: string }) {
  const reduced = useSettledReducedMotion();
  const { ref, x, y } = usePointerParallax<HTMLDivElement>(reduced);

  const rotateY = useTransform(x, [-1, 1], [7, -7]);
  const rotateX = useTransform(y, [-1, 1], [-4.5, 4.5]);
  const driftX = useTransform(x, [-1, 1], [22, -22]);
  const backdropX = useTransform(x, [-1, 1], [-14, 14]);

  return (
    <div
      ref={ref}
      aria-hidden
      className={cn(
        "relative h-full w-full overflow-hidden [perspective:1400px]",
        className,
      )}
    >
      {/* Depth glow, furthest back */}
      <motion.div
        style={{ x: backdropX }}
        className="absolute inset-0 [transform:translateZ(-160px)]"
      >
        <div className="absolute top-[38%] left-1/2 h-[46%] w-[78%] -translate-x-1/2 rounded-[50%] bg-brand/12 blur-[110px]" />
        <div className="absolute top-[26%] left-[64%] size-56 rounded-full bg-white/6 blur-[90px]" />
      </motion.div>

      {/* Light trails */}
      <div className="absolute inset-0 [transform:translateZ(-90px)]">
        {STREAKS.map((streak) => (
          <span
            key={streak.top}
            className={cn(
              "absolute h-px rounded-full",
              streak.warm ? "bg-brand" : "bg-white",
            )}
            style={{
              top: streak.top,
              right: 0,
              width: streak.width,
              opacity: streak.opacity,
              animation: reduced
                ? undefined
                : `streak ${streak.duration}s linear ${streak.delay}s infinite`,
            }}
          />
        ))}
      </div>

      {/* Horizon */}
      <div className="absolute inset-x-0 bottom-[26%] h-px bg-linear-to-r from-transparent via-brand/25 to-transparent" />

      {/*
       * Road rushing past beneath the truck. This is what makes the vector
       * scene read as *driving* — spinning wheels alone leave it looking parked,
       * because nothing in the frame is passing the truck. Masked at both ends
       * so the dashes fade out instead of stopping at a hard edge.
       */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-[13%] h-[3px] overflow-hidden opacity-45 [mask-image:linear-gradient(to_right,transparent,black_18%,black_82%,transparent)] lg:bottom-[24%]"
        aria-hidden
      >
        <div className={cn("h-full", !reduced && "road-rush")} />
      </div>

      {/* The truck */}
      <motion.div
        style={
          reduced
            ? undefined
            : { rotateX, rotateY, x: driftX, transformPerspective: 1400 }
        }
        /*
         * Sized and placed to match the WebGL framing: centred in the bottom
         * band on mobile, right-of-centre on desktop where the copy occupies
         * the left. Without this the crossfade jumps scale and position.
         */
        className="absolute inset-x-0 bottom-[16%] mx-auto w-[min(90%,600px)] [transform-style:preserve-3d] lg:bottom-[27%] lg:mr-[7%] lg:ml-auto lg:w-[42%]"
      >
        <div className={cn(!reduced && "body-bob")}>
          <TruckSilhouette animateWheels={!reduced} />
        </div>
        {/* Contact shadow */}
        <div className="absolute inset-x-[8%] -bottom-3 h-8 rounded-[50%] bg-black/70 blur-xl" />
      </motion.div>

      {/* Foreground haze */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/4 bg-linear-to-t from-ink-950 to-transparent" />
    </div>
  );
}

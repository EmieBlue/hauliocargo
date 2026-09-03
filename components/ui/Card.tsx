"use client";

import {
  motion,
  useMotionTemplate,
  useTransform,
} from "framer-motion";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { usePointerParallax } from "@/lib/usePointerParallax";

type CardProps = {
  children: ReactNode;
  className?: string;
  /** Pointer-driven tilt + spotlight. Off for dense grids. */
  tilt?: boolean;
  /** Max tilt in degrees. Kept small on purpose — this is not a toy. */
  maxTilt?: number;
};

/**
 * Dark surface with a machined hairline edge. On pointer devices it tilts
 * slightly and a soft yellow spotlight tracks the cursor.
 */
export function Card({
  children,
  className,
  tilt = true,
  maxTilt = 5,
}: CardProps) {
  const { ref, x, y } = usePointerParallax<HTMLDivElement>(!tilt);

  const rotateX = useTransform(y, [-1, 1], [maxTilt, -maxTilt]);
  const rotateY = useTransform(x, [-1, 1], [-maxTilt, maxTilt]);

  const spotX = useTransform(x, (value) => `${50 + value * 32}%`);
  const spotY = useTransform(y, (value) => `${50 + value * 32}%`);
  const spotlight = useMotionTemplate`radial-gradient(360px circle at ${spotX} ${spotY}, rgba(255,192,43,0.11), transparent 68%)`;

  return (
    <motion.div
      ref={ref}
      style={
        tilt
          ? { rotateX, rotateY, transformPerspective: 1000 }
          : undefined
      }
      className={cn(
        "group/card relative isolate overflow-hidden rounded-2xl border border-white/8 bg-ink-850/70",
        "transition-[border-color,box-shadow,transform] duration-500 ease-brand",
        "hover:border-brand/35 hover:shadow-[0_28px_70px_-40px_rgba(255,192,43,0.55)]",
        className,
      )}
    >
      {/* Cursor spotlight */}
      {tilt ? (
        <motion.span
          aria-hidden
          style={{ background: spotlight }}
          className="pointer-events-none absolute inset-0 -z-10 opacity-0 transition-opacity duration-500 group-hover/card:opacity-100"
        />
      ) : null}

      {/* Top edge highlight — reads as a lit bevel */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-6 top-0 h-px bg-linear-to-r from-transparent via-white/20 to-transparent"
      />

      {children}
    </motion.div>
  );
}

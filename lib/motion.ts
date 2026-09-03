import type { Variants } from "framer-motion";

/** House easing. Confident settle, no bounce. */
export const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

/** Shared viewport config so every section reveals at the same trigger point. */
export const VIEWPORT = { once: true, margin: "-80px" } as const;

/** Parent that staggers its children in. */
export const staggerParent = (stagger = 0.09, delayChildren = 0): Variants => ({
  hidden: {},
  show: {
    transition: { staggerChildren: stagger, delayChildren },
  },
});

/** Standard entrance: rise, fade and de-blur. */
export const riseIn: Variants = {
  hidden: { opacity: 0, y: 24, filter: "blur(8px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.85, ease: EASE },
  },
};

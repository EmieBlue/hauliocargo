"use client";

import { useMotionValue, useSpring, type MotionValue } from "framer-motion";
import { useEffect, useRef, type RefObject } from "react";

type Parallax<T extends HTMLElement> = {
  ref: RefObject<T | null>;
  /** -1 (left/top) .. 1 (right/bottom), spring-damped. */
  x: MotionValue<number>;
  y: MotionValue<number>;
};

/**
 * Tracks the pointer across an element and returns damped -1..1 offsets.
 * Touch input is ignored on purpose: a finger dragging the page should scroll
 * it, not tilt the artwork.
 */
export function usePointerParallax<T extends HTMLElement>(
  disabled = false,
): Parallax<T> {
  const ref = useRef<T>(null);
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);

  const spring = { stiffness: 110, damping: 22, mass: 0.6 };
  const x = useSpring(rawX, spring);
  const y = useSpring(rawY, spring);

  useEffect(() => {
    const element = ref.current;
    if (!element || disabled) return;

    const handleMove = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      const rect = element.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      rawX.set(((event.clientX - rect.left) / rect.width - 0.5) * 2);
      rawY.set(((event.clientY - rect.top) / rect.height - 0.5) * 2);
    };

    const handleLeave = () => {
      rawX.set(0);
      rawY.set(0);
    };

    element.addEventListener("pointermove", handleMove);
    element.addEventListener("pointerleave", handleLeave);

    return () => {
      element.removeEventListener("pointermove", handleMove);
      element.removeEventListener("pointerleave", handleLeave);
    };
  }, [disabled, rawX, rawY]);

  return { ref, x, y };
}

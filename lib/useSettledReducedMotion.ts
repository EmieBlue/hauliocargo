"use client";

import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(onChange: () => void): () => void {
  const query = window.matchMedia(QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function getSnapshot(): boolean {
  return window.matchMedia(QUERY).matches;
}

/** The server cannot know the preference, so assume motion is allowed. */
function getServerSnapshot(): boolean {
  return false;
}

/**
 * The motion preference, safe to branch rendered markup on.
 *
 * `useSyncExternalStore` returns the server snapshot during SSR *and* during
 * hydration, then re-reads on the client — so the two trees always agree.
 * Reading `matchMedia` directly during render, or flipping a flag from an
 * effect, both produce a hydration mismatch instead.
 *
 * Only needed where the preference changes rendered attributes; plain `motion`
 * animations are already covered by `<MotionConfig reducedMotion="user">`.
 */
export function useSettledReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

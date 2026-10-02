"use client";

import { useSyncExternalStore } from "react";

function subscribe(query: string) {
  return (onChange: () => void): (() => void) => {
    const mql = window.matchMedia(query);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  };
}

/**
 * Whether a media query currently matches — settles after hydration like
 * `useSettledReducedMotion`/`useDeviceTier` (same `useSyncExternalStore`
 * shape), so server and first client render agree before the real answer
 * takes over.
 *
 * For picking which of two *different* things to actually mount for a given
 * viewport (not just which to show/hide) — e.g. Move With You's map panel,
 * which must exist as exactly one live `mapboxgl.Map` instance, never two
 * CSS-toggled copies both quietly running in the background.
 */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    subscribe(query),
    () => window.matchMedia(query).matches,
    () => false,
  );
}

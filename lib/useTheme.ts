"use client";

import { useCallback, useSyncExternalStore } from "react";

export type Theme = "dark" | "light";

const STORAGE_KEY = "haulio-theme";
const listeners = new Set<() => void>();

// A short-lived class, not a permanent rule — see the matching
// `html.theme-transitioning` block in app/globals.css. Added right before
// `data-theme` flips and removed a beat later, so an actual theme switch
// eases the whole page instead of every token snapping instantly, without
// touching the hover/interaction transition timings components already
// hand-tune for themselves the rest of the time.
const TRANSITION_CLASS = "theme-transitioning";
const TRANSITION_MS = 420;
let transitionTimeoutId: number | undefined;

function apply(theme: Theme) {
  // No attribute = dark, the default — mirrors the inline script in
  // app/layout.tsx and app/globals.css's `[data-theme="light"]` override.
  if (theme === "light") {
    document.documentElement.setAttribute("data-theme", "light");
  } else {
    document.documentElement.removeAttribute("data-theme");
  }
}

function subscribe(onStoreChange: () => void): () => void {
  listeners.add(onStoreChange);
  return () => listeners.delete(onStoreChange);
}

function getSnapshot(): Theme {
  return document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
}

/** The server (and the first client render, to match it) can't know what
 * the inline pre-paint script already set — assume dark, same default. */
function getServerSnapshot(): Theme {
  return "dark";
}

/**
 * The current theme, plus a setter — reads the live `data-theme` attribute
 * on `<html>` rather than owning separate React state, so every component
 * calling this hook (the navbar's toggle, the auth header's toggle) agrees,
 * and flipping it from any one of them updates all the others.
 */
export function useTheme(): [Theme, (next: Theme) => void] {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setTheme = useCallback((next: Theme) => {
    const root = document.documentElement;
    root.classList.add(TRANSITION_CLASS);
    window.clearTimeout(transitionTimeoutId);
    transitionTimeoutId = window.setTimeout(() => {
      root.classList.remove(TRANSITION_CLASS);
    }, TRANSITION_MS);

    apply(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Private browsing / blocked storage — theme still applies this load,
      // it just won't be remembered next visit.
    }
    listeners.forEach((listener) => listener());
  }, []);

  return [theme, setTheme];
}

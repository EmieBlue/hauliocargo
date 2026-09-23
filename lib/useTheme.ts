"use client";

import { useCallback, useSyncExternalStore } from "react";

export type Theme = "dark" | "light";

const STORAGE_KEY = "haulio-theme";
const listeners = new Set<() => void>();

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

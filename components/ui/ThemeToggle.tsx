"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/lib/useTheme";
import { cn } from "@/lib/cn";

/**
 * Sun/moon button that flips `useTheme`'s stored theme. `dark` here means
 * the same thing it does on `Logo`/nav links — "sitting on the yellow
 * scrolled bar" — not the site theme; it just needs to stay readable
 * against whatever's directly behind it (transparent-over-video vs. yellow),
 * independent of light/dark theme.
 */
export function ThemeToggle({ dark = false, className }: { dark?: boolean; className?: string }) {
  const [theme, setTheme] = useTheme();
  const isLight = theme === "light";

  return (
    <button
      type="button"
      onClick={() => setTheme(isLight ? "dark" : "light")}
      aria-label={isLight ? "Switch to dark theme" : "Switch to light theme"}
      aria-pressed={isLight}
      className={cn(
        "grid size-10 shrink-0 place-items-center rounded-xl border transition-colors duration-300",
        dark
          ? "border-black/15 bg-black/5 text-black/70 hover:border-black/30 hover:text-black"
          : "border-edge/10 bg-edge/[0.03] text-mist hover:border-brand/40 hover:text-brand",
        className,
      )}
    >
      {isLight ? <Sun className="size-4.5" aria-hidden /> : <Moon className="size-4.5" aria-hidden />}
    </button>
  );
}

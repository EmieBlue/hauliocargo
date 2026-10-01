"use client";

import Link from "next/link";
import { cn } from "@/lib/cn";
import { ROUTES } from "@/lib/site";
import { useTheme } from "@/lib/useTheme";

/**
 * Mark + wordmark, kept as separate elements deliberately.
 *
 * `nav-mark.png` (the real brand droplet, cropped tight to content) carries
 * only the icon. The wordmark stays live text rather than being baked into
 * the same image: six letters of "Haulio" downscaled into a ~28px-tall nav
 * slot turn to mush and stop reading as text at all — confirmed by actually
 * screenshotting it, not assumed. Text has no such floor; it stays crisp at
 * any size a browser renders it.
 *
 * Always links to the homepage — this used to be wrapped by hand at each
 * call site (`AuthShell`'s own `Link`, `Navbar`'s own `<a>`), which is how
 * three of the five usages (`DashboardShell`, `Footer`, `MobileMenu`) ended
 * up not clickable at all. Baked in here instead so every usage, current or
 * future, gets it for free. Callers must not wrap this in another
 * link/anchor themselves — nesting one inside another is invalid HTML.
 */
export function Logo({ className, dark = false }: { className?: string; dark?: boolean }) {
  const [theme] = useTheme();

  // `dark` here means "sitting on the solid yellow scrolled bar" — always
  // nav-mark-dark.png regardless of site theme ("not when scrolling", per
  // the brief). Otherwise: the default mark is white + yellow, tuned for the
  // dark video backdrop; in light theme that backdrop is deliberately
  // lightened, so nav-mark-light.png (black + yellow) takes over instead.
  const markSrc = dark
    ? "/brand/nav-mark-dark.png"
    : theme === "light"
      ? "/brand/nav-mark-light.png"
      : "/brand/nav-mark.png";

  return (
    <Link
      href={ROUTES.homePage}
      className={cn("inline-flex items-center gap-2.5 transition-opacity duration-300 hover:opacity-85", className)}
    >
      <img src={markSrc} alt="" className="h-7 w-auto" />
      <span className="font-display text-[1.05rem] leading-none font-extrabold tracking-[0.02em]">
        <span className={dark ? "text-white" : "text-brand"}>HAULIO</span>
        <span className={dark || theme === "light" ? "text-black" : "text-white"}>CARGO</span>
      </span>
    </Link>
  );
}

"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { DashboardBackdrop } from "@/components/layout/DashboardBackdrop";
import { Logo } from "@/components/ui/Logo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { cn } from "@/lib/cn";
import { useScrolled } from "@/lib/useScrolled";
import { ProfileMenu } from "./ProfileMenu";

/**
 * Shared chrome for every dashboard page (customer/driver/admin, profile,
 * bookings, the booking forms) — `DashboardBackdrop`'s branded fleet photo
 * is mounted once here, same "mount once, used by every page through the
 * shell" approach as the marketing site's `VideoBackdrop`.
 *
 * Header is `fixed` and turns solid yellow on scroll, same rule as every
 * other page on the site (`Navbar.tsx`, `AuthShell.tsx`) — unscrolled stays
 * transparent over the backdrop's own scrim, matching how `Navbar` sits over
 * `VideoBackdrop`.
 *
 * Inherits the site's real light/dark theme like every other page — this
 * used to force `data-theme="dark"` here regardless of the toggle, but that
 * left the theme button on every dashboard page doing nothing visible, which
 * read as broken. The color tokens (`ink-950` etc., see app/globals.css)
 * already invert role-for-role per theme, so `DashboardBackdrop`'s scrim
 * lightens correctly in light mode without needing a forced pin.
 */
export function DashboardShell({
  children,
  backLink,
  sidebar,
  clearBackdrop,
}: {
  children: ReactNode;
  /** Optional "back" link shown in the fixed header, next to the logo — for
   * sub-pages deep in a flow (e.g. Move With You) where a plain in-content
   * text link reads as buried. Most dashboard pages omit this. */
  backLink?: { href: string; label: string };
  /** Optional side menu pinned to the far-left edge under the header. When
   * passed, the page content fills the remaining width instead of the
   * centered container. */
  sidebar?: ReactNode;
  /** One page (driver, so far) only — see `DashboardBackdrop`'s own `clear`
   * prop for why. Every other page omits this and keeps the default. */
  clearBackdrop?: boolean;
}) {
  const scrolled = useScrolled();

  return (
    <div className="relative flex min-h-svh flex-col">
      <DashboardBackdrop clear={clearBackdrop} />
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-60 transition-[background-color,backdrop-filter,border-color] duration-150 ease-brand",
          scrolled ? "border-b border-transparent bg-brand/65 backdrop-blur-lg" : "border-b border-edge/6 bg-transparent",
        )}
      >
        <div className="container-page flex h-20 items-center justify-between">
          <div className="flex items-center gap-5">
            <Logo dark={scrolled} />
            {backLink ? (
              <Link
                href={backLink.href}
                aria-label={backLink.label}
                className={cn(
                  "inline-flex h-10 items-center gap-1.5 rounded-xl border px-3 text-[0.82rem] font-medium transition-colors duration-300",
                  scrolled
                    ? "border-black/15 bg-black/5 text-black/70 hover:border-black/30 hover:text-black"
                    : "border-edge/10 bg-edge/[0.03] text-mist hover:border-brand/40 hover:text-brand",
                )}
              >
                <ArrowLeft className="size-3.5 shrink-0" aria-hidden />
                <span className="hidden sm:inline">{backLink.label}</span>
              </Link>
            ) : null}
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle dark={scrolled} />
            <ProfileMenu dark={scrolled} />
          </div>
        </div>
      </header>
      {sidebar ? (
        <div className="relative flex flex-1 items-start pt-28 pb-16">
          <div className="sticky top-28 shrink-0">{sidebar}</div>
          <div className="container-page relative flex min-w-0 flex-1 items-start justify-center">{children}</div>
        </div>
      ) : (
        <div className="container-page relative flex flex-1 items-center justify-center pt-28 pb-16">{children}</div>
      )}
    </div>
  );
}

export function DashboardLoading() {
  return (
    <div className="grid min-h-svh place-items-center bg-ink-950">
      <div className="size-8 animate-spin rounded-full border-2 border-edge/15 border-t-brand" />
    </div>
  );
}

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
}: {
  children: ReactNode;
  /** Optional "back" link shown in the fixed header, next to the logo — for
   * sub-pages deep in a flow (e.g. Move With You) where a plain in-content
   * text link reads as buried. Most dashboard pages omit this. */
  backLink?: { href: string; label: string };
}) {
  const scrolled = useScrolled();

  return (
    <div className="relative flex min-h-svh flex-col">
      <DashboardBackdrop />
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
                  "inline-flex items-center gap-1.5 text-[0.82rem] font-medium transition-colors duration-300",
                  scrolled ? "text-black/70 hover:text-black" : "text-mist hover:text-fg",
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
      <div className="container-page relative flex flex-1 items-center justify-center pt-28 pb-16">{children}</div>
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

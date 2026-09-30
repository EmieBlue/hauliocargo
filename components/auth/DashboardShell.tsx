"use client";

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
 * Pinned `data-theme="dark"` throughout, regardless of the site's own
 * light/dark toggle — same reasoning as `CargoScene`/`HowItWorks`/`Trust` on
 * the marketing site: `DashboardBackdrop` is a permanently dark, heavily
 * scrimmed image (not Hero's variable-brightness video), so light theme's
 * near-black `text-fg` etc. would be illegible against it. Confirmed via
 * screenshot: without the pin, light theme's default text tokens render
 * unreadable against this backdrop.
 */
export function DashboardShell({ children }: { children: ReactNode }) {
  const scrolled = useScrolled();

  return (
    <div data-theme="dark" className="relative flex min-h-svh flex-col">
      <DashboardBackdrop />
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-60 transition-[background-color,backdrop-filter,border-color] duration-150 ease-brand",
          scrolled ? "border-b border-transparent bg-brand/65 backdrop-blur-lg" : "border-b border-edge/6 bg-transparent",
        )}
      >
        <div className="container-page flex h-20 items-center justify-between">
          <Logo dark={scrolled} />
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

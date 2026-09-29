"use client";

import type { ReactNode } from "react";
import { Logo } from "@/components/ui/Logo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { cn } from "@/lib/cn";
import { useScrolled } from "@/lib/useScrolled";
import { ProfileMenu } from "./ProfileMenu";

/**
 * Shared chrome for the three placeholder destinations. Deliberately plain —
 * these are stand-ins for the real customer/driver/admin dashboards, not the
 * dashboards themselves (out of scope this round, per the brief's own
 * section 18).
 *
 * Header is `fixed` and turns solid yellow on scroll, same rule as every
 * other page on the site (`Navbar.tsx`, `AuthShell.tsx`) — no video backdrop
 * here, so unscrolled just stays transparent over the page's own background
 * rather than needing a separate treatment.
 */
export function DashboardShell({ children }: { children: ReactNode }) {
  const scrolled = useScrolled();

  return (
    <div className="flex min-h-svh flex-col bg-ink-950">
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
      <div className="container-page flex flex-1 items-center justify-center pt-28 pb-16">{children}</div>
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

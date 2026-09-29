"use client";

import type { ReactNode } from "react";
import { Logo } from "@/components/ui/Logo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { ProfileMenu } from "./ProfileMenu";

/**
 * Shared chrome for the three placeholder destinations. Deliberately plain —
 * these are stand-ins for the real customer/driver/admin dashboards, not the
 * dashboards themselves (out of scope this round, per the brief's own
 * section 18).
 */
export function DashboardShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col bg-ink-950">
      <header className="container-page flex h-20 items-center justify-between border-b border-edge/6">
        <Logo />
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <ProfileMenu />
        </div>
      </header>
      <div className="container-page flex flex-1 items-center py-16">{children}</div>
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

"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { Logo } from "@/components/ui/Logo";
import { signOut } from "@/lib/auth";
import { ROUTES } from "@/lib/site";

/**
 * Shared chrome for the three placeholder destinations. Deliberately plain —
 * these are stand-ins for the real customer/driver/admin dashboards, not the
 * dashboards themselves (out of scope this round, per the brief's own
 * section 18).
 */
export function DashboardShell({ children }: { children: ReactNode }) {
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    router.push(ROUTES.signin);
  }

  return (
    <div className="flex min-h-svh flex-col bg-ink-950">
      <header className="container-page flex h-20 items-center justify-between border-b border-white/6">
        <Logo />
        <button
          type="button"
          onClick={handleSignOut}
          className="inline-flex items-center gap-1.5 font-display text-[0.72rem] font-semibold tracking-[0.08em] text-mist uppercase transition-colors duration-200 hover:text-brand"
        >
          <LogOut className="size-3.5" aria-hidden />
          Sign Out
        </button>
      </header>
      <div className="container-page flex flex-1 items-center py-16">{children}</div>
    </div>
  );
}

export function DashboardLoading() {
  return (
    <div className="grid min-h-svh place-items-center bg-ink-950">
      <div className="size-8 animate-spin rounded-full border-2 border-white/15 border-t-brand" />
    </div>
  );
}

"use client";

import { LayoutDashboard, MessageSquare, Menu, Truck, User, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { ROUTES } from "@/lib/site";
import { getClient } from "@/lib/supabase";

const INK_MENU = "#141518";
const AMBER = "#f0b429";
const EASE = "cubic-bezier(0.2,0.74,0.18,1)";

type MenuItem = {
  key: string;
  label: string;
  icon: LucideIcon;
  href: string | null;
};

// Chat stays disabled ("coming soon") — same honest-placeholder treatment
// AppSideMenu already gives its own Chat item.
const ITEMS: MenuItem[] = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard, href: ROUTES.dashboardDriver },
  { key: "jobs", label: "Jobs", icon: Truck, href: ROUTES.driverJobs },
  { key: "profile", label: "Profile", icon: User, href: ROUTES.profile },
  { key: "chat", label: "Chat", icon: MessageSquare, href: null },
];

/**
 * The driver's own expanding side menu — same chrome as the customer side's
 * `AppSideMenu` (76px rail, opens to 230px on hover/focus, mobile drawer
 * under `lg`), but a separate component rather than a shared/refactored one:
 * AppSideMenu's items and its data fetch (customer bookings) are specific to
 * that role and would be wrong here, and duplicating the chrome avoids any
 * risk to the already-shipped customer menu.
 */
export function DriverSideMenu({ activeKey = "dashboard" }: { activeKey?: string }) {
  const [name, setName] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const supabase = getClient();
    if (!supabase) return;

    let cancelled = false;
    supabase.auth.getUser().then(({ data }) => {
      const userId = data.user?.id;
      if (!userId || cancelled) return;

      supabase
        .from("profiles")
        .select("first_name, last_name")
        .eq("id", userId)
        .single()
        .then(({ data: profile }) => {
          if (!cancelled && profile) setName(`${profile.first_name} ${profile.last_name}`.trim());
        });
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <aside
        className={cn(
          "group hidden h-[calc(100svh-8rem)] shrink-0 flex-col overflow-hidden rounded-r-2xl lg:flex",
          "w-[76px] transition-[width] duration-[760ms] focus-within:w-[230px] hover:w-[230px]",
        )}
        style={{ background: INK_MENU, transitionTimingFunction: EASE }}
      >
        <MenuBody activeKey={activeKey} name={name} expanded={false} />
      </aside>

      <button
        type="button"
        onClick={() => setDrawerOpen(true)}
        aria-label="Open menu"
        className="fixed top-24 left-4 z-40 grid size-11 place-items-center rounded-xl border border-white/10 lg:hidden"
        style={{ background: INK_MENU, color: "#c9c6c0" }}
      >
        <Menu className="size-5" aria-hidden />
      </button>

      {drawerOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setDrawerOpen(false)}
            className="absolute inset-0 bg-black/60"
          />
          <div
            className="absolute top-0 left-0 flex h-full w-[260px] flex-col overflow-y-auto pt-24"
            style={{ background: INK_MENU }}
          >
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              aria-label="Close menu"
              className="absolute top-6 right-4 grid size-9 place-items-center rounded-lg"
              style={{ color: "#c9c6c0" }}
            >
              <X className="size-5" aria-hidden />
            </button>
            <MenuBody activeKey={activeKey} name={name} expanded onNavigate={() => setDrawerOpen(false)} />
          </div>
        </div>
      ) : null}
    </>
  );
}

function MenuBody({
  activeKey,
  name,
  expanded,
  onNavigate,
}: {
  activeKey: string;
  name: string;
  expanded: boolean;
  onNavigate?: () => void;
}) {
  return (
    <>
      <nav className="flex flex-col gap-1 px-2 py-4" aria-label="Driver menu">
        {ITEMS.map((item) => {
          const active = item.key === activeKey;
          const Icon = item.icon;
          const row = (
            <>
              <span className="grid size-5 shrink-0 place-items-center">
                <Icon className="size-5" aria-hidden />
              </span>
              <span
                className={cn(
                  "ml-3 whitespace-nowrap text-[0.88rem] font-medium transition-[opacity,transform] duration-300",
                  expanded
                    ? "translate-x-0 opacity-100"
                    : "-translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 group-hover:delay-[120ms] group-focus-within:translate-x-0 group-focus-within:opacity-100",
                )}
              >
                {item.label}
              </span>
            </>
          );

          const className = cn(
            "relative flex h-11 items-center rounded-xl pl-4 pr-3 transition-colors duration-200",
            active ? "bg-black/60 text-white" : "text-[#c9c6c0] hover:text-white",
          );

          if (!item.href) {
            return (
              <div key={item.key} className={cn(className, "cursor-default opacity-60")} title="Coming soon">
                {row}
              </div>
            );
          }
          return (
            <Link key={item.key} href={item.href} className={className} aria-current={active ? "page" : undefined} onClick={onNavigate}>
              {row}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto flex items-center gap-3 border-t border-white/10 px-4 py-4">
        <span
          className="grid size-9 shrink-0 place-items-center rounded-full"
          style={{ background: AMBER, color: "#141518" }}
          aria-hidden
        >
          <User className="size-4" />
        </span>
        <span
          className={cn(
            "min-w-0 truncate text-[0.85rem] font-semibold text-white transition-[opacity,transform] duration-300",
            expanded
              ? "opacity-100"
              : "opacity-0 group-hover:opacity-100 group-hover:delay-[120ms] group-focus-within:opacity-100",
          )}
        >
          {name || "Driver"}
        </span>
      </div>
    </>
  );
}

"use client";

import { LayoutDashboard, MessageSquare, Navigation, Package, Send, Truck, User, X, Menu } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { ROUTES } from "@/lib/site";
import { getClient } from "@/lib/supabase";

const INK_MENU = "#141518";
const TEXT_MENU = "#c9c6c0";
const AMBER = "#f0b429";
const EASE = "cubic-bezier(0.2,0.74,0.18,1)";

type RequestStatus = "pending" | "confirmed" | "in_progress" | "completed" | "cancelled";

type RequestItem = {
  id: string;
  pickup_location: string;
  dropoff_location: string;
  status: RequestStatus;
};

type MenuItem = {
  key: string;
  label: string;
  icon: LucideIcon;
  href: string | null;
  badge?: "tracking" | "chat";
};

const ITEMS: MenuItem[] = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard, href: ROUTES.dashboardCustomer },
  { key: "move", label: "Move with you", icon: Truck, href: ROUTES.bookMove },
  { key: "send", label: "Send only", icon: Send, href: ROUTES.bookSend },
  { key: "packages", label: "Packages", icon: Package, href: ROUTES.bookReceive },
  { key: "tracking", label: "Tracking", icon: Navigation, href: ROUTES.bookings, badge: "tracking" },
  { key: "chat", label: "Chat", icon: MessageSquare, href: null, badge: "chat" },
];

const ACTIVE_STATUSES: RequestStatus[] = ["pending", "confirmed", "in_progress"];

/**
 * The customer's expanding side menu. Closed it's a 76px icon rail; hovering
 * or focusing it opens it to 230px, and the labels slide in. Under `lg` it
 * becomes a drawer opened by a menu button, since hover doesn't exist on a
 * phone. The menu also lists the customer's own requests under "Move with
 * you" so a request can be opened straight from here.
 */
export function AppSideMenu({ activeKey, selectedId }: { activeKey: string; selectedId?: string | null }) {
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [name, setName] = useState<string>("");
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

      supabase
        .from("bookings")
        .select("id, pickup_location, dropoff_location, status")
        .order("created_at", { ascending: false })
        .limit(20)
        .then(({ data: rows }) => {
          if (!cancelled && rows) setRequests(rows as RequestItem[]);
        });
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const activeCount = requests.filter((r) => ACTIVE_STATUSES.includes(r.status)).length;

  return (
    <>
      <aside
        className={cn(
          "group sticky top-24 hidden h-[calc(100svh-7rem)] shrink-0 flex-col overflow-hidden rounded-2xl lg:flex",
          "w-[76px] transition-[width] duration-[760ms] focus-within:w-[230px] hover:w-[230px]",
        )}
        style={{ background: INK_MENU, transitionTimingFunction: EASE }}
      >
        <MenuBody
          activeKey={activeKey}
          selectedId={selectedId}
          requests={requests}
          activeCount={activeCount}
          name={name}
          expanded={false}
        />
      </aside>

      <button
        type="button"
        onClick={() => setDrawerOpen(true)}
        aria-label="Open menu"
        className="fixed top-24 left-4 z-40 grid size-11 place-items-center rounded-xl border border-white/10 lg:hidden"
        style={{ background: INK_MENU, color: TEXT_MENU }}
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
              style={{ color: TEXT_MENU }}
            >
              <X className="size-5" aria-hidden />
            </button>
            <MenuBody
              activeKey={activeKey}
              selectedId={selectedId}
              requests={requests}
              activeCount={activeCount}
              name={name}
              expanded
              onNavigate={() => setDrawerOpen(false)}
            />
          </div>
        </div>
      ) : null}
    </>
  );
}

function MenuBody({
  activeKey,
  selectedId,
  requests,
  activeCount,
  name,
  expanded,
  onNavigate,
}: {
  activeKey: string;
  selectedId?: string | null;
  requests: RequestItem[];
  activeCount: number;
  name: string;
  expanded: boolean;
  onNavigate?: () => void;
}) {
  return (
    <>
      <nav className="flex flex-col gap-1 px-2 py-4" aria-label="Customer menu">
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
              {item.badge === "tracking" && activeCount > 0 ? (
                <>
                  <BadgeCount count={activeCount} expanded={expanded} />
                  {!expanded ? <BadgeDot expanded={false} /> : null}
                </>
              ) : null}
              {item.badge === "chat" ? <BadgeDot expanded={expanded} /> : null}
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

        {requests.length > 0 ? (
          <div className="mt-3 flex flex-col gap-1 border-t border-white/10 pt-3">
            {requests.map((request) => {
              const selected = request.id === selectedId;
              return (
                <Link
                  key={request.id}
                  href={`${ROUTES.bookings}?id=${request.id}`}
                  onClick={onNavigate}
                  className={cn(
                    "flex min-h-11 items-center rounded-xl py-2 pr-3 pl-4 transition-colors duration-200",
                    selected ? "bg-black/60 text-white" : "text-[#c9c6c0] hover:text-white",
                  )}
                >
                  <span className="grid size-5 shrink-0 place-items-center">
                    <span className="size-2 rounded-full" style={{ background: requestDotColor(request.status) }} />
                  </span>
                  <span
                    className={cn(
                      "ml-3 min-w-0 transition-[opacity,transform] duration-300",
                      expanded
                        ? "translate-x-0 opacity-100"
                        : "-translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 group-hover:delay-[120ms] group-focus-within:translate-x-0 group-focus-within:opacity-100",
                    )}
                  >
                    <span className="block truncate text-[0.8rem] font-medium">{request.dropoff_location}</span>
                    <span className="block truncate text-[0.7rem] opacity-70">{statusLabel(request.status)}</span>
                  </span>
                </Link>
              );
            })}
          </div>
        ) : null}
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
          {name || "Customer"}
        </span>
      </div>
    </>
  );
}

function BadgeDot({ expanded }: { expanded: boolean }) {
  return (
    <span
      className={cn(
        "absolute size-2 rounded-full",
        expanded ? "top-1/2 right-4 -translate-y-1/2" : "top-2 right-2 group-hover:hidden group-focus-within:hidden",
      )}
      style={{ background: AMBER }}
      aria-hidden
    />
  );
}

function BadgeCount({ count, expanded }: { count: number; expanded: boolean }) {
  return (
    <span
      className={cn(
        "ml-auto min-w-5 rounded-full px-1.5 text-center text-[0.7rem] font-semibold",
        expanded ? "inline-block" : "hidden group-hover:inline-block group-focus-within:inline-block",
      )}
      style={{ background: AMBER, color: "#141518" }}
    >
      {count}
    </span>
  );
}

function requestDotColor(status: RequestStatus): string {
  if (status === "cancelled") return "#6b6b74";
  if (status === "completed") return "#4ade80";
  return AMBER;
}

function statusLabel(status: RequestStatus): string {
  switch (status) {
    case "pending":
      return "Requested";
    case "confirmed":
      return "Confirmed";
    case "in_progress":
      return "On the way";
    case "completed":
      return "Completed";
    case "cancelled":
      return "Cancelled";
  }
}

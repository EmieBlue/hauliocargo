"use client";

import { ClipboardCheck, Package, Truck, Users, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Panel, SectionLabel } from "@/components/dashboard/admin/ApplicationsSection";
import { fetchAdminStats, type AdminStats } from "@/lib/admin";
import { ROUTES } from "@/lib/site";

type Card = { key: keyof AdminStats; label: string; icon: LucideIcon; href: string };

const CARDS: Card[] = [
  { key: "customerCount", label: "Customers", icon: Users, href: `${ROUTES.dashboardAdmin}?section=customers` },
  { key: "verifiedDriverCount", label: "Verified Drivers", icon: Truck, href: `${ROUTES.dashboardAdmin}?section=applications&status=verified` },
  { key: "bookingCount", label: "Total Bookings", icon: Package, href: `${ROUTES.dashboardAdmin}?section=bookings` },
  { key: "pendingApplicationCount", label: "Pending Applications", icon: ClipboardCheck, href: ROUTES.dashboardAdmin + "?section=applications" },
];

/** The admin dashboard's landing section — plain counts, each card linking
 * straight to the section it summarizes. */
export function OverviewSection() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchAdminStats().then((result) => {
      if (cancelled) return;
      if (result.ok) setStats(result.data);
      else setError(result.message);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="flex w-full max-w-5xl flex-col gap-5">
      <Panel>
        <h1 className="text-[1.5rem] font-extrabold tracking-[-0.02em] text-fg">Admin Overview</h1>
        <p className="mt-1.5 text-[0.88rem] text-muted">A snapshot of everything on HaulioCargo right now.</p>
      </Panel>

      {error ? (
        <Panel>
          <p className="text-[0.85rem] text-brand">{error}</p>
        </Panel>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {CARDS.map((card) => (
            <StatCard key={card.key} card={card} value={stats?.[card.key]} />
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({ card, value }: { card: Card; value: number | undefined }) {
  const Icon = card.icon;
  return (
    <Link
      href={card.href}
      className="flex flex-col gap-3 rounded-xl border border-edge/12 bg-ink-950 p-5 transition-colors duration-200 hover:border-brand/30"
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand">
        <Icon className="size-5" aria-hidden />
      </span>
      <div>
        <p className="text-[1.75rem] font-extrabold tracking-[-0.02em] text-fg">{value ?? "—"}</p>
        <SectionLabel>{card.label}</SectionLabel>
      </div>
    </Link>
  );
}

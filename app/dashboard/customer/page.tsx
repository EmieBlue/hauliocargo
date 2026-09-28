"use client";

import { Package, Send, Truck } from "lucide-react";
import { useRouter } from "next/navigation";
import { DashboardLoading, DashboardShell } from "@/components/auth/DashboardShell";
import { RoleCard } from "@/components/auth/RoleCard";
import { ROUTES } from "@/lib/site";
import { useRequireRole } from "@/lib/useRequireRole";

const BOOKING_TYPES = [
  {
    icon: Truck,
    title: "Move With You",
    body: "You travel with the driver and your cargo all the way to the destination.",
    href: ROUTES.bookMove,
  },
  {
    icon: Send,
    title: "Send Only",
    body: "Hand off your cargo — the driver delivers it for you, no need to come along.",
    href: ROUTES.bookSend,
  },
  {
    icon: Package,
    title: "Package Delivery",
    body: "Quick delivery for smaller items and parcels.",
    href: ROUTES.bookReceive,
  },
] as const;

export default function CustomerDashboardPage() {
  const { loading } = useRequireRole("customer");
  const router = useRouter();

  if (loading) return <DashboardLoading />;

  return (
    <DashboardShell>
      <div className="max-w-3xl">
        <h1 className="text-[clamp(1.8rem,3.6vw,2.4rem)] font-extrabold tracking-[-0.02em] text-fg">
          What would you like to do today?
        </h1>
        <p className="mt-3 max-w-lg text-[0.95rem] leading-relaxed text-muted">
          Choose how you&rsquo;d like to book — each option fits a different kind of move.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {BOOKING_TYPES.map((type) => (
            <RoleCard
              key={type.title}
              icon={type.icon}
              title={type.title}
              body={type.body}
              selected={false}
              onSelect={() => router.push(type.href)}
            />
          ))}
        </div>
      </div>
    </DashboardShell>
  );
}

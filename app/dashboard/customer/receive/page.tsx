"use client";

import Link from "next/link";
import { DashboardLoading, DashboardShell } from "@/components/auth/DashboardShell";
import { ROUTES } from "@/lib/site";
import { useRequireRole } from "@/lib/useRequireRole";

/** Placeholder destination only — the real "Package Delivery" booking form is separate work. */
export default function PackageDeliveryPage() {
  const { loading } = useRequireRole("customer");
  if (loading) return <DashboardLoading />;

  return (
    <DashboardShell>
      <div className="flex max-w-lg flex-col gap-6">
        <Link
          href={ROUTES.dashboardCustomer}
          className="self-start text-[0.8rem] font-medium text-muted transition-colors duration-200 hover:text-brand"
        >
          ← Back to dashboard
        </Link>
        <div>
          <h1 className="text-[clamp(1.8rem,3.6vw,2.4rem)] font-extrabold tracking-[-0.02em] text-fg">
            Package Delivery
          </h1>
          <p className="mt-3 text-[0.95rem] leading-relaxed text-muted">
            Booking a package delivery isn&rsquo;t built yet — this page exists so the dashboard has somewhere
            real to land.
          </p>
        </div>
      </div>
    </DashboardShell>
  );
}

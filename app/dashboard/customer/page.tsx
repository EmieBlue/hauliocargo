"use client";

import { DashboardLoading, DashboardShell } from "@/components/auth/DashboardShell";
import { useRequireRole } from "@/lib/useRequireRole";

/** Placeholder destination only — the real customer dashboard is separate work. */
export default function CustomerDashboardPage() {
  const { loading } = useRequireRole("customer");
  if (loading) return <DashboardLoading />;

  return (
    <DashboardShell>
      <div className="max-w-lg">
        <h1 className="text-[clamp(1.8rem,3.6vw,2.4rem)] font-extrabold tracking-[-0.02em] text-white">
          Welcome to HaulioCargo
        </h1>
        <p className="mt-3 text-[0.95rem] leading-relaxed text-muted">
          Your account is set up. Booking a truck isn&rsquo;t built yet — this page exists so sign-in has
          somewhere real to land.
        </p>
      </div>
    </DashboardShell>
  );
}

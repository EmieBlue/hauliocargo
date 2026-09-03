"use client";

import { DashboardLoading, DashboardShell } from "@/components/auth/DashboardShell";
import { useRequireRole } from "@/lib/useRequireRole";

/** Placeholder destination only — the real admin dashboard is separate work. */
export default function AdminDashboardPage() {
  const { loading } = useRequireRole("admin");
  if (loading) return <DashboardLoading />;

  return (
    <DashboardShell>
      <div className="max-w-lg">
        <h1 className="text-[clamp(1.8rem,3.6vw,2.4rem)] font-extrabold tracking-[-0.02em] text-white">
          Admin
        </h1>
        <p className="mt-3 text-[0.95rem] leading-relaxed text-muted">
          The admin dashboard isn&rsquo;t built yet — this page exists so authentication has a real
          destination for the admin role.
        </p>
      </div>
    </DashboardShell>
  );
}

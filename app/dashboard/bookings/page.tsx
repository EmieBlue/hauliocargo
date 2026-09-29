"use client";

import Link from "next/link";
import { DashboardLoading, DashboardShell } from "@/components/auth/DashboardShell";
import { redirectPathFor } from "@/lib/auth";
import { useRequireAuth } from "@/lib/useRequireAuth";

/** Placeholder destination only — the real booking history screen is separate work. */
export default function BookingsPage() {
  const { loading, profile } = useRequireAuth();
  if (loading || !profile) return <DashboardLoading />;

  return (
    <DashboardShell>
      <div className="flex max-w-lg flex-col gap-6">
        <Link
          href={redirectPathFor(profile)}
          className="self-start text-[0.8rem] font-medium text-muted transition-colors duration-200 hover:text-brand"
        >
          ← Back to dashboard
        </Link>
        <div>
          <h1 className="text-[clamp(1.8rem,3.6vw,2.4rem)] font-extrabold tracking-[-0.02em] text-fg">
            My Bookings
          </h1>
          <p className="mt-3 text-[0.95rem] leading-relaxed text-muted">
            Booking history isn&rsquo;t built yet — this page exists so the account menu has somewhere real to
            land.
          </p>
        </div>
      </div>
    </DashboardShell>
  );
}

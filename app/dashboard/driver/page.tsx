"use client";

import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { DashboardLoading, DashboardShell } from "@/components/auth/DashboardShell";
import { Badge } from "@/components/ui/Badge";
import type { DriverStatus } from "@/lib/auth";
import { useRequireRole } from "@/lib/useRequireRole";

const STATUS_COPY: Record<DriverStatus, { label: string; body: string; icon: typeof Clock }> = {
  pending: {
    label: "Pending Verification",
    body: "Your application is being reviewed. We'll notify you as soon as verification is complete.",
    icon: Clock,
  },
  verified: {
    label: "Verified",
    body: "You're verified and ready to go. Driver matching isn't built yet — this page exists so registration has somewhere real to land.",
    icon: CheckCircle2,
  },
  rejected: {
    label: "Application Not Approved",
    body: "Your application wasn't approved this time. Contact support if you believe this is a mistake.",
    icon: XCircle,
  },
};

/** Placeholder destination only — the real driver dashboard is separate work. */
export default function DriverDashboardPage() {
  const { loading, profile } = useRequireRole("driver");
  if (loading || !profile) return <DashboardLoading />;

  const status = profile.driverStatus ?? "pending";
  const copy = STATUS_COPY[status];
  const Icon = copy.icon;

  return (
    <DashboardShell>
      <div className="max-w-lg">
        <Badge pulse={status === "pending"}>
          <Icon className="size-3" aria-hidden />
          {copy.label}
        </Badge>
        <h1 className="mt-5 text-[clamp(1.8rem,3.6vw,2.4rem)] font-extrabold tracking-[-0.02em] text-white">
          {status === "pending" ? "Application Submitted" : "Your Driver Account"}
        </h1>
        <p className="mt-3 text-[0.95rem] leading-relaxed text-muted">{copy.body}</p>
      </div>
    </DashboardShell>
  );
}

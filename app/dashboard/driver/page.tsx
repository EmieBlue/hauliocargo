"use client";

import { CheckCircle2, Circle, Clock, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { DashboardLoading, DashboardShell } from "@/components/auth/DashboardShell";
import { DriverSideMenu } from "@/components/dashboard/DriverSideMenu";
import { Badge } from "@/components/ui/Badge";
import type { DriverStatus } from "@/lib/auth";
import { getClient } from "@/lib/supabase";
import { useRequireRole } from "@/lib/useRequireRole";

const STATUS_COPY: Record<DriverStatus, { label: string; body: string; icon: typeof Clock }> = {
  pending: {
    label: "Pending Verification",
    body: "Your application is being reviewed. We'll notify you as soon as verification is complete.",
    icon: Clock,
  },
  verified: {
    label: "Verified",
    body: "You're verified. Driver matching isn't built yet — this page exists so registration has somewhere real to land, and so you can check what's on file.",
    icon: CheckCircle2,
  },
  rejected: {
    label: "Application Not Approved",
    body: "Your application wasn't approved this time. Contact support if you believe this is a mistake.",
    icon: XCircle,
  },
};

type ApplicationRow = {
  date_of_birth: string | null;
  license_number: string;
  vehicle_type: string;
  vehicle_make: string;
  vehicle_model: string;
  vehicle_year: number;
  vehicle_registration_no: string;
  vehicle_capacity: string;
  status: DriverStatus;
};

type ProfileRow = {
  first_name: string;
  last_name: string;
  phone: string;
};

const DOCUMENT_KINDS = [
  { kind: "license", label: "Driver's Licence", required: true },
  { kind: "vehicle-registration", label: "Vehicle Registration", required: true },
  { kind: "insurance", label: "Insurance Documentation", required: false },
  { kind: "vehicle-photo", label: "Vehicle Photos", required: false },
] as const;

export default function DriverDashboardPage() {
  const { loading, profile } = useRequireRole("driver");
  const [application, setApplication] = useState<ApplicationRow | null>(null);
  const [driverProfile, setDriverProfile] = useState<ProfileRow | null>(null);
  const [documentKinds, setDocumentKinds] = useState<Set<string> | null>(null);

  useEffect(() => {
    const supabase = getClient();
    if (!supabase) return;

    supabase.auth.getUser().then(({ data }) => {
      const userId = data.user?.id;
      if (!userId) return;

      supabase
        .from("profiles")
        .select("first_name, last_name, phone")
        .eq("id", userId)
        .single()
        .then(({ data: row }) => setDriverProfile((row as ProfileRow | null) ?? null));

      supabase
        .from("driver_applications")
        .select("date_of_birth, license_number, vehicle_type, vehicle_make, vehicle_model, vehicle_year, vehicle_registration_no, vehicle_capacity, status")
        .eq("profile_id", userId)
        .single()
        .then(({ data: row }) => setApplication((row as ApplicationRow | null) ?? null));

      // Each uploaded file is named `${kind}-${timestamp}-${original name}`
      // (see uploadDriverDocument in lib/auth.ts) — matching that prefix is
      // how this page knows which of the four kinds actually made it,
      // since an upload can fail without blocking the application itself.
      supabase.storage
        .from("driver-documents")
        .list(userId)
        .then(({ data: files }) => {
          const present = new Set<string>();
          for (const file of files ?? []) {
            const match = DOCUMENT_KINDS.find((d) => file.name.startsWith(`${d.kind}-`));
            if (match) present.add(match.kind);
          }
          setDocumentKinds(present);
        });
    });
  }, []);

  if (loading || !profile) return <DashboardLoading />;

  const status = profile.driverStatus ?? "pending";
  const copy = STATUS_COPY[status];
  const Icon = copy.icon;

  return (
    <DashboardShell clearBackdrop sidebar={<DriverSideMenu activeKey="dashboard" />}>
      <div className="flex w-full max-w-2xl flex-col gap-4">
        {/* Its own solid card now, not bare on the backdrop — that was the
         * one piece of the last version left directly on the (now much
         * lighter) clear backdrop, which is exactly what made it illegible. */}
        <section className="rounded-xl border border-edge/12 bg-ink-950 p-5">
          <Badge pulse={status === "pending"}>
            <Icon className="size-3" aria-hidden />
            {copy.label}
          </Badge>
          <h1 className="mt-4 text-[1.5rem] font-extrabold tracking-[-0.02em] text-fg">
            {driverProfile ? `Hi, ${driverProfile.first_name}` : "Your Driver Account"}
          </h1>
          <p className="mt-2 text-[0.88rem] leading-relaxed text-muted">{copy.body}</p>
        </section>

        <InfoCard title="Application Details">
          {driverProfile && application ? (
            <dl className="grid gap-3.5 sm:grid-cols-2">
              <Row label="Name" value={`${driverProfile.first_name} ${driverProfile.last_name}`} />
              <Row label="Phone" value={driverProfile.phone} />
              <Row label="Licence Number" value={application.license_number} />
              <Row
                label="Vehicle"
                value={`${application.vehicle_year} ${application.vehicle_make} ${application.vehicle_model}`}
              />
              <Row label="Vehicle Type" value={application.vehicle_type} />
              <Row label="Registration No." value={application.vehicle_registration_no} />
              <Row label="Capacity" value={application.vehicle_capacity} />
            </dl>
          ) : (
            <p className="text-[0.85rem] text-muted">Loading…</p>
          )}
        </InfoCard>

        <InfoCard title="Documents">
          {documentKinds ? (
            <ul className="flex flex-col gap-2.5">
              {DOCUMENT_KINDS.map((doc) => {
                const present = documentKinds.has(doc.kind);
                return (
                  <li key={doc.kind} className="flex items-center gap-2.5 text-[0.85rem]">
                    {present ? (
                      <CheckCircle2 className="size-4 shrink-0 text-brand" aria-hidden />
                    ) : (
                      <Circle className="size-4 shrink-0 text-muted" aria-hidden />
                    )}
                    <span className={present ? "text-fg" : "text-muted"}>{doc.label}</span>
                    {!present ? (
                      <span className="text-[0.72rem] text-muted">
                        — {doc.required ? "missing" : "not provided"}
                      </span>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-[0.85rem] text-muted">Loading…</p>
          )}
        </InfoCard>
      </div>
    </DashboardShell>
  );
}

function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-edge/12 bg-ink-950 p-5">
      <h2 className="font-display text-[0.68rem] font-semibold tracking-[0.18em] text-mist uppercase">{title}</h2>
      <div className="mt-3.5">{children}</div>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-[0.7rem] font-semibold tracking-[0.05em] text-muted uppercase">{label}</dt>
      <dd className="text-[0.88rem] text-fg">{value}</dd>
    </div>
  );
}

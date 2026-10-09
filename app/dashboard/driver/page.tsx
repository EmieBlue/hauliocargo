"use client";

import { CheckCircle2, Circle, Clock, Loader2, Truck, Upload, Weight, XCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { DashboardLoading, DashboardShell } from "@/components/auth/DashboardShell";
import { DriverSideMenu } from "@/components/dashboard/DriverSideMenu";
import { Badge } from "@/components/ui/Badge";
import { uploadDriverDocument, type DriverStatus } from "@/lib/auth";
import { getClient } from "@/lib/supabase";
import { useRequireRole } from "@/lib/useRequireRole";

// A deliberate light-card exception on this one card, same reasoning as
// Move With You's own cream/amber palette: a vehicle showcase reads as a
// product card, not a dark dashboard panel — fixed, not theme-reactive.
const CARD_INK = "#17181c";
const CARD_MUTED = "#6b6b74";
const CARD_CREAM = "#f6f3ed";
const CARD_TILE_BG = "rgba(0,0,0,0.045)";
const CARD_ACCENT = "#f0b429";

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
  const [vehiclePhotoUrl, setVehiclePhotoUrl] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = getClient();
    if (!supabase) return;

    supabase.auth.getUser().then(({ data }) => {
      const userId = data.user?.id;
      if (!userId) return;
      setUserId(userId);

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
          let photoPath: string | null = null;
          for (const file of files ?? []) {
            const match = DOCUMENT_KINDS.find((d) => file.name.startsWith(`${d.kind}-`));
            if (match) present.add(match.kind);
            if (file.name.startsWith("vehicle-photo-")) photoPath = `${userId}/${file.name}`;
          }
          setDocumentKinds(present);
          if (photoPath) {
            supabase.storage
              .from("driver-documents")
              .createSignedUrl(photoPath, 3600)
              .then(({ data: signed }) => {
                if (signed?.signedUrl) setVehiclePhotoUrl(signed.signedUrl);
              });
          }
        });
    });
  }, []);

  if (loading || !profile) return <DashboardLoading />;

  const status = profile.driverStatus ?? "pending";
  const copy = STATUS_COPY[status];
  const Icon = copy.icon;

  async function handlePhotoSelected(file: File | null) {
    if (!file || !userId) return;
    const supabase = getClient();
    if (!supabase) return;

    setPhotoUploading(true);
    setPhotoError(null);
    const result = await uploadDriverDocument(userId, "vehicle-photo", file);
    if (!result.ok) {
      setPhotoUploading(false);
      setPhotoError(result.message);
      return;
    }

    // Old vehicle-photo uploads are left in place, not deleted — harmless
    // clutter in storage, never shown again once this newer one exists,
    // since the dashboard always displays the most recently uploaded one.
    const { data: signed } = await supabase.storage.from("driver-documents").createSignedUrl(result.data, 3600);
    setPhotoUploading(false);
    if (signed?.signedUrl) setVehiclePhotoUrl(signed.signedUrl);
    setDocumentKinds((prev) => new Set(prev).add("vehicle-photo"));
  }

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

        {application ? (
          <CarCard
            application={application}
            photoUrl={vehiclePhotoUrl}
            verified={status === "verified"}
            uploading={photoUploading}
            error={photoError}
            onPhotoSelected={handlePhotoSelected}
          />
        ) : null}

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

/**
 * A vehicle showcase card, like the reference the user sent — badges, a
 * title, stat tiles and a photo. Adapted to what's actually collected at
 * registration (driver_applications) rather than copied feature-for-
 * feature: no "0-60 mph" or "Configure Vehicle" here, since neither
 * applies to a cargo truck or exists as a real action in this app.
 */
function CarCard({
  application,
  photoUrl,
  verified,
  uploading,
  error,
  onPhotoSelected,
}: {
  application: ApplicationRow;
  photoUrl: string | null;
  verified: boolean;
  uploading: boolean;
  error: string | null;
  onPhotoSelected: (file: File | null) => void;
}) {
  const fileInput = useRef<HTMLInputElement>(null);

  return (
    <section
      className="rounded-2xl border p-5"
      style={{ borderColor: "rgba(0,0,0,0.08)", background: CARD_CREAM }}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span
          className="rounded-full px-3 py-1 text-[0.68rem] font-semibold tracking-[0.04em]"
          style={{ background: CARD_TILE_BG, color: CARD_INK }}
        >
          {verified ? "Verified" : "Pending Verification"}
        </span>
        <span
          className="rounded-full px-3 py-1 text-[0.68rem] font-semibold tracking-[0.04em]"
          style={{ background: CARD_TILE_BG, color: CARD_INK }}
        >
          {application.vehicle_year} Edition
        </span>
      </div>

      <h2 className="mt-4 text-[1.6rem] font-extrabold tracking-[-0.02em]" style={{ color: CARD_INK }}>
        {application.vehicle_make} {application.vehicle_model}
      </h2>
      <p className="mt-1 text-[0.85rem]" style={{ color: CARD_MUTED }}>
        {application.vehicle_type} · {application.vehicle_capacity} capacity
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-[auto_1fr]">
        <div>
          <div
            className="relative h-40 w-full overflow-hidden rounded-xl sm:h-auto sm:w-56"
            style={{ background: CARD_TILE_BG }}
          >
            {photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- a signed storage URL, next/image gains nothing here
              <img src={photoUrl} alt="Your vehicle" className="size-full object-cover" />
            ) : (
              <div className="grid size-full place-items-center">
                <Truck className="size-10" style={{ color: "rgba(0,0,0,0.2)" }} aria-hidden />
              </div>
            )}

            <input
              ref={fileInput}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => onPhotoSelected(e.target.files?.[0] ?? null)}
            />
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              disabled={uploading}
              className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1.5 px-2 py-2 text-[0.72rem] font-semibold transition-opacity disabled:opacity-70"
              style={{ background: "rgba(0,0,0,0.55)", color: "#fff" }}
            >
              {uploading ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" aria-hidden />
                  Uploading
                </>
              ) : (
                <>
                  <Upload className="size-3.5" aria-hidden />
                  {photoUrl ? "Replace Photo" : "Add Photo"}
                </>
              )}
            </button>
          </div>
          {error ? (
            <p role="alert" className="mt-1.5 text-[0.72rem]" style={{ color: "#b91c1c" }}>
              {error}
            </p>
          ) : null}
        </div>
        <div className="flex flex-col gap-3">
          <StatTile icon={Truck} label="Vehicle Type" value={application.vehicle_type} />
          <StatTile icon={Weight} label="Capacity" value={application.vehicle_capacity} />
        </div>
      </div>

      <div
        className="mt-5 flex items-center justify-between rounded-xl px-4 py-3"
        style={{ background: CARD_TILE_BG }}
      >
        <div>
          <p className="text-[0.65rem] font-semibold tracking-[0.08em] uppercase" style={{ color: CARD_MUTED }}>
            Registration
          </p>
          <p className="text-[0.9rem] font-bold" style={{ color: CARD_INK }}>
            {application.vehicle_registration_no}
          </p>
        </div>
        <span
          className="rounded-full px-3 py-1.5 text-[0.72rem] font-semibold"
          style={{ background: CARD_INK, color: CARD_ACCENT }}
        >
          On File
        </span>
      </div>
    </section>
  );
}

function StatTile({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl px-4 py-3" style={{ background: CARD_TILE_BG }}>
      <span
        className="grid size-9 shrink-0 place-items-center rounded-lg"
        style={{ background: CARD_ACCENT, color: CARD_INK }}
      >
        <Icon className="size-4" aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="text-[0.65rem] font-semibold tracking-[0.06em] uppercase" style={{ color: CARD_MUTED }}>
          {label}
        </p>
        <p className="truncate text-[0.88rem] font-bold" style={{ color: CARD_INK }}>
          {value}
        </p>
      </div>
    </div>
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

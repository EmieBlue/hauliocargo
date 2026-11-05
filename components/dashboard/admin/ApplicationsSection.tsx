"use client";

import { CheckCircle2, Clock, ExternalLink, Loader2, XCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { BackButton } from "@/components/dashboard/BackButton";
import { REJECTION_REASONS, ReasonDialog } from "@/components/dashboard/ReasonDialog";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  decideDriverApplication,
  fetchDriverApplication,
  fetchDriverApplications,
  type DriverApplicationRow,
} from "@/lib/admin";
import type { DriverStatus } from "@/lib/auth";
import { cn } from "@/lib/cn";
import { ROUTES } from "@/lib/site";
import { getClient } from "@/lib/supabase";

const STATUS_COPY: Record<DriverStatus, { label: string; icon: LucideIcon }> = {
  pending: { label: "Pending", icon: Clock },
  verified: { label: "Verified", icon: CheckCircle2 },
  rejected: { label: "Rejected", icon: XCircle },
};

const FILTERS: { key: DriverStatus | "all"; label: string }[] = [
  { key: "pending", label: "Pending" },
  { key: "verified", label: "Verified" },
  { key: "rejected", label: "Rejected" },
  { key: "all", label: "All" },
];

const DOCUMENT_KINDS = [
  { kind: "license", label: "Driver's Licence" },
  { kind: "vehicle-registration", label: "Vehicle Registration" },
  { kind: "insurance", label: "Insurance Documentation" },
  { kind: "vehicle-photo", label: "Vehicle Photo" },
] as const;

function isDriverStatus(value: string | null): value is DriverStatus {
  return value === "pending" || value === "verified" || value === "rejected";
}

type Selected = { id: string; row: DriverApplicationRow | null };

/** Driver-application review — list, filter, detail, approve/reject. Moved
 * out of `app/dashboard/admin/page.tsx` unchanged when the admin dashboard
 * grew Overview/Customers/Bookings sections alongside it. */
export function ApplicationsSection() {
  const searchParams = useSearchParams();
  const applicationId = searchParams.get("id");
  const statusParam = searchParams.get("status");
  const statusFilter: DriverStatus | "all" =
    statusParam === "all" ? "all" : isDriverStatus(statusParam) ? statusParam : "pending";

  const [applications, setApplications] = useState<DriverApplicationRow[] | null>(null);
  const [selected, setSelected] = useState<Selected | null>(null);
  const [acting, setActing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);

  // Direct async-helper calls from inside an effect trip React's "no
  // setState in an effect body" lint rule — inlined .then() chains instead,
  // same fix pattern used throughout this project's other list pages.
  useEffect(() => {
    let cancelled = false;
    const filter = statusFilter === "all" ? undefined : statusFilter;
    fetchDriverApplications(filter).then((result) => {
      if (!cancelled && result.ok) setApplications(result.data);
    });
    return () => {
      cancelled = true;
    };
  }, [statusFilter]);

  useEffect(() => {
    if (!applicationId) return;
    let cancelled = false;
    fetchDriverApplication(applicationId).then((result) => {
      if (cancelled) return;
      setSelected({ id: applicationId, row: result.ok ? result.data : null });
    });
    return () => {
      cancelled = true;
    };
  }, [applicationId]);

  const current = applicationId && selected && selected.id === applicationId ? selected : null;
  const detailOpen = Boolean(applicationId);

  async function reload() {
    const filter = statusFilter === "all" ? undefined : statusFilter;
    const listResult = await fetchDriverApplications(filter);
    if (listResult.ok) setApplications(listResult.data);
    if (applicationId) {
      const detailResult = await fetchDriverApplication(applicationId);
      setSelected({ id: applicationId, row: detailResult.ok ? detailResult.data : null });
    }
  }

  async function handleApprove() {
    if (!current?.row) return;
    setActing(true);
    setActionError(null);
    const result = await decideDriverApplication(current.row.id, "verified");
    setActing(false);
    if (!result.ok) {
      setActionError(result.message);
      return;
    }
    await reload();
  }

  async function handleReject(reasons: string[]) {
    if (!current?.row) return;
    setActing(true);
    setActionError(null);
    const result = await decideDriverApplication(current.row.id, "rejected", reasons);
    setActing(false);
    setRejectOpen(false);
    if (!result.ok) {
      setActionError(result.message);
      return;
    }
    await reload();
  }

  return (
    <div className={cn("flex w-full flex-col gap-5", !detailOpen && "max-w-3xl")}>
      {detailOpen ? <BackButton /> : null}

      {!detailOpen ? (
        <>
          <Panel>
            <h1 className="text-[1.5rem] font-extrabold tracking-[-0.02em] text-fg">Driver Applications</h1>
            <p className="mt-1.5 text-[0.88rem] text-muted">Review and approve or reject driver applications.</p>
          </Panel>

          <div className="flex flex-wrap gap-2">
            {FILTERS.map((f) => (
              <a
                key={f.key}
                href={f.key === "pending" ? `${ROUTES.dashboardAdmin}?section=applications` : `${ROUTES.dashboardAdmin}?section=applications&status=${f.key}`}
                className={cn(
                  "rounded-full border px-4 py-1.5 text-[0.78rem] font-medium transition-colors duration-200",
                  statusFilter === f.key
                    ? "border-brand bg-brand/10 text-brand"
                    : "border-edge/12 text-muted hover:border-brand/30 hover:text-fg",
                )}
              >
                {f.label}
              </a>
            ))}
          </div>

          <Panel>
            {applications === null ? (
              <p className="text-[0.85rem] text-muted">Loading…</p>
            ) : applications.length === 0 ? (
              <p className="text-[0.85rem] text-muted">Nothing here.</p>
            ) : (
              <div className="divide-y divide-edge/10">
                {applications.map((app) => (
                  <ApplicationRow key={app.id} application={app} />
                ))}
              </div>
            )}
          </Panel>
        </>
      ) : current?.row ? (
        <DetailPanel
          application={current.row}
          acting={acting}
          error={actionError}
          onApprove={handleApprove}
          onReject={() => setRejectOpen(true)}
        />
      ) : (
        <Panel>
          <p className="text-[0.85rem] text-muted">{current ? "Application not found." : "Loading…"}</p>
        </Panel>
      )}

      <ReasonDialog
        open={rejectOpen}
        busy={acting}
        title="Reject application"
        description="Pick one or more reasons — the driver will see this on their own profile."
        confirmLabel="Reject Application"
        reasons={REJECTION_REASONS}
        onConfirm={handleReject}
        onClose={() => setRejectOpen(false)}
      />
    </div>
  );
}

function ApplicationRow({ application }: { application: DriverApplicationRow }) {
  const copy = STATUS_COPY[application.status];
  const Icon = copy.icon;
  const name = application.profiles
    ? `${application.profiles.first_name} ${application.profiles.last_name}`
    : "Unknown applicant";

  return (
    <a
      href={`${ROUTES.dashboardAdmin}?section=applications&id=${application.id}`}
      className="-mx-5 flex items-center justify-between gap-3 px-5 py-3.5 transition-colors duration-200 first:pt-0 hover:bg-edge/[0.03]"
    >
      <div className="min-w-0">
        <p className="truncate text-[0.9rem] font-semibold text-fg">{name}</p>
        <p className="mt-0.5 truncate text-[0.8rem] text-muted">
          {application.vehicle_year} {application.vehicle_make} {application.vehicle_model}
        </p>
      </div>
      <Badge pulse={application.status === "pending"} className="shrink-0">
        <Icon className="size-3" aria-hidden />
        {copy.label}
      </Badge>
    </a>
  );
}

function DetailPanel({
  application,
  acting,
  error,
  onApprove,
  onReject,
}: {
  application: DriverApplicationRow;
  acting: boolean;
  error: string | null;
  onApprove: () => void;
  onReject: () => void;
}) {
  const copy = STATUS_COPY[application.status];
  const Icon = copy.icon;
  const name = application.profiles
    ? `${application.profiles.first_name} ${application.profiles.last_name}`
    : "Unknown applicant";

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-5 lg:flex-row lg:items-start">
      <div className="flex w-full min-w-0 flex-col gap-4 lg:w-2/3">
        <Panel>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <ApplicantAvatar avatarPath={application.profiles?.avatar_path ?? null} />
              <div>
                <h1 className="text-[1.4rem] font-extrabold tracking-[-0.02em] text-fg">{name}</h1>
                <p className="mt-1 text-[0.85rem] text-muted">
                  Submitted {new Date(application.submitted_at).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}
                </p>
              </div>
            </div>
            <Badge pulse={application.status === "pending"} className="shrink-0">
              <Icon className="size-3" aria-hidden />
              {copy.label}
            </Badge>
          </div>

          {application.status === "rejected" && application.rejection_reasons?.length ? (
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              {application.rejection_reasons.map((reason) => (
                <span
                  key={reason}
                  className="rounded-full border border-edge/12 bg-edge/[0.04] px-2.5 py-1 text-[0.7rem] text-muted"
                >
                  {reason}
                </span>
              ))}
            </div>
          ) : null}
        </Panel>

        <Panel>
          <SectionLabel>Applicant</SectionLabel>
          <dl className="mt-3 grid gap-3.5 sm:grid-cols-2">
            <Row label="Phone" value={application.profiles?.phone ?? "—"} />
            <Row label="Date of Birth" value={application.date_of_birth ?? "Not provided"} />
            <Row label="Licence Number" value={application.license_number} />
          </dl>
        </Panel>

        <Panel>
          <SectionLabel>Vehicle</SectionLabel>
          <dl className="mt-3 grid gap-3.5 sm:grid-cols-2">
            <Row label="Vehicle" value={`${application.vehicle_year} ${application.vehicle_make} ${application.vehicle_model}`} />
            <Row label="Type" value={application.vehicle_type} />
            <Row label="Registration No." value={application.vehicle_registration_no} />
            <Row label="Capacity" value={application.vehicle_capacity} />
            {application.vehicle_color ? <Row label="Color" value={application.vehicle_color} /> : null}
          </dl>
        </Panel>

        <DocumentsPanel profileId={application.profile_id} />
      </div>

      <div className="w-full lg:sticky lg:top-28 lg:w-1/3 lg:self-start">
        <Panel>
          <SectionLabel>Decision</SectionLabel>
          {application.status === "pending" ? (
            <div className="mt-3 flex flex-col gap-2.5">
              <Button type="button" variant="primary" disabled={acting} onClick={onApprove}>
                {acting ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
                Approve
              </Button>
              <Button type="button" variant="ghost" disabled={acting} onClick={onReject}>
                Reject
              </Button>
            </div>
          ) : (
            <p className="mt-3 text-[0.85rem] text-muted">
              This application has already been {application.status === "verified" ? "approved" : "rejected"}.
            </p>
          )}
          {error ? (
            <p role="alert" className="mt-3 text-[0.78rem] text-brand">
              {error}
            </p>
          ) : null}
        </Panel>
      </div>
    </div>
  );
}

/** The applicant's profile picture — `avatars` bucket, admin-wide read added
 * in migration 026. Same signed-URL pattern as `BookingsSection`'s own
 * `DriverMedia`. */
function ApplicantAvatar({ avatarPath }: { avatarPath: string | null }) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!avatarPath) return;
    const supabase = getClient();
    if (!supabase) return;
    let cancelled = false;

    supabase.storage
      .from("avatars")
      .createSignedUrl(avatarPath, 3600)
      .then(({ data }) => {
        if (!cancelled) setUrl(data?.signedUrl ?? null);
      });

    return () => {
      cancelled = true;
    };
  }, [avatarPath]);

  if (!url) {
    return (
      <span className="grid size-12 shrink-0 place-items-center rounded-full border border-edge/12 bg-edge/[0.04] text-[0.62rem] text-muted">
        No photo
      </span>
    );
  }
  return <img src={url} alt="" className="size-12 shrink-0 rounded-full border border-edge/12 object-cover" />;
}

function DocumentsPanel({ profileId }: { profileId: string }) {
  const [urls, setUrls] = useState<Record<string, string> | null>(null);

  useEffect(() => {
    const supabase = getClient();
    if (!supabase) return;
    let cancelled = false;

    supabase.storage
      .from("driver-documents")
      .list(profileId)
      .then(({ data: files }) => {
        if (cancelled || !files) return;
        const latestByKind = new Map<string, string>();
        for (const file of files) {
          const match = DOCUMENT_KINDS.find((d) => file.name.startsWith(`${d.kind}-`));
          if (match) latestByKind.set(match.kind, `${profileId}/${file.name}`);
        }
        Promise.all(
          [...latestByKind.entries()].map(([kind, path]) =>
            supabase.storage
              .from("driver-documents")
              .createSignedUrl(path, 3600)
              .then(({ data }) => [kind, data?.signedUrl ?? null] as const),
          ),
        ).then((entries) => {
          if (cancelled) return;
          const next: Record<string, string> = {};
          for (const [kind, url] of entries) if (url) next[kind] = url;
          setUrls(next);
        });
      });

    return () => {
      cancelled = true;
    };
  }, [profileId]);

  return (
    <Panel>
      <SectionLabel>Documents</SectionLabel>
      <ul className="mt-3 flex flex-col gap-2.5">
        {DOCUMENT_KINDS.map((doc) => {
          const url = urls?.[doc.kind];
          return (
            <li key={doc.kind} className="flex items-center justify-between gap-3 text-[0.85rem]">
              <span className={url ? "text-fg" : "text-muted"}>{doc.label}</span>
              {url ? (
                <a
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-[0.8rem] font-medium text-brand hover:underline"
                >
                  View
                  <ExternalLink className="size-3.5" aria-hidden />
                </a>
              ) : (
                <span className="text-[0.75rem] text-muted">
                  {urls === null ? "Loading…" : "Not provided"}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <h2 className="font-display text-[0.68rem] font-semibold tracking-[0.18em] text-mist uppercase">{children}</h2>
  );
}

export function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-[0.7rem] font-semibold tracking-[0.05em] text-muted uppercase">{label}</dt>
      <dd className="text-[0.88rem] text-fg">{value}</dd>
    </div>
  );
}

export function Panel({ children }: { children: ReactNode }) {
  return <section className="rounded-xl border border-edge/12 bg-ink-950 p-5">{children}</section>;
}

"use client";

import { Clock, Loader2, MapPin, Truck } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState, type ReactNode } from "react";
import { DashboardLoading, DashboardShell } from "@/components/auth/DashboardShell";
import { BackButton } from "@/components/dashboard/BackButton";
import { DriverSideMenu } from "@/components/dashboard/DriverSideMenu";
import type { LocationPoint } from "@/components/dashboard/MoveMap";
import { MoveMapPanel } from "@/components/dashboard/MoveMapPanel";
import { Button } from "@/components/ui/Button";
import {
  acceptJob,
  advanceJob,
  fetchAvailableJobs,
  fetchJob,
  fetchMyJobs,
  type BookingStatus,
  type JobRow,
} from "@/lib/bookings";
import { cn } from "@/lib/cn";
import { formatPrice } from "@/lib/pricing";
import { ROUTES } from "@/lib/site";
import { getClient } from "@/lib/supabase";
import { useRequireRole } from "@/lib/useRequireRole";

/**
 * Declining a job is personal, not a rejection for everyone — it just
 * removes that job from this one driver's own list; the job stays open
 * for any other driver. Saved to this driver's own browser, not the
 * database, since nothing shared needs to change.
 */
function declinedStorageKey(userId: string): string {
  return `haulio:declined-jobs:${userId}`;
}

function loadDeclined(userId: string): Set<string> {
  try {
    const raw = localStorage.getItem(declinedStorageKey(userId));
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

function saveDeclined(userId: string, ids: Set<string>) {
  try {
    localStorage.setItem(declinedStorageKey(userId), JSON.stringify([...ids]));
  } catch {
    // Best effort — a driver who can't persist this just sees the job
    // again next visit, not a broken page.
  }
}

const STATUS_LABEL: Record<BookingStatus, string> = {
  pending: "Open",
  confirmed: "Accepted",
  in_progress: "On The Way",
  completed: "Completed",
  cancelled: "Cancelled",
};

/** `useSearchParams` needs a Suspense boundary — see AGENTS.md. */
export default function DriverJobsPage() {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <DriverJobsContent />
    </Suspense>
  );
}

type Selected = { id: string; row: JobRow | null };

function DriverJobsContent() {
  const { loading, profile } = useRequireRole("driver");
  const jobId = useSearchParams().get("id");
  const router = useRouter();

  const [available, setAvailable] = useState<JobRow[] | null>(null);
  const [mine, setMine] = useState<JobRow[] | null>(null);
  const [selected, setSelected] = useState<Selected | null>(null);
  const [actingOn, setActingOn] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [declinedIds, setDeclinedIds] = useState<Set<string>>(new Set());

  const verified = profile?.driverStatus === "verified";

  useEffect(() => {
    const supabase = getClient();
    if (!supabase) return;
    let cancelled = false;
    supabase.auth.getUser().then(({ data }) => {
      const id = data.user?.id;
      if (cancelled || !id) return;
      setUserId(id);
      setDeclinedIds(loadDeclined(id));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Initial list load — see the jobs list page's earlier version of this
  // same comment: a direct call to an async helper from inside the effect
  // trips React's "no setState in an effect body" lint rule, since it can't
  // see the setState calls are deferred past this .then(). `reload` below
  // (used by the button handlers, a normal event-handler context) is fine.
  useEffect(() => {
    if (!verified) return;
    let cancelled = false;
    Promise.all([fetchAvailableJobs(), fetchMyJobs()]).then(([av, my]) => {
      if (cancelled) return;
      if (av.ok) setAvailable(av.data);
      if (my.ok) setMine(my.data);
    });
    return () => {
      cancelled = true;
    };
  }, [verified]);

  useEffect(() => {
    if (!jobId || !verified) return;
    let cancelled = false;
    fetchJob(jobId).then((result) => {
      if (cancelled) return;
      setSelected({ id: jobId, row: result.ok ? result.data : null });
    });
    return () => {
      cancelled = true;
    };
  }, [jobId, verified]);

  if (loading || !profile) return <DashboardLoading />;

  async function reload() {
    const [av, my] = await Promise.all([fetchAvailableJobs(), fetchMyJobs()]);
    if (av.ok) setAvailable(av.data);
    if (my.ok) setMine(my.data);
    if (jobId) {
      const result = await fetchJob(jobId);
      setSelected({ id: jobId, row: result.ok ? result.data : null });
    }
  }

  async function handleAccept(id: string) {
    setActingOn(id);
    setError(null);
    const result = await acceptJob(id);
    setActingOn(null);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    await reload();
  }

  async function handleAdvance(id: string, status: BookingStatus) {
    setActingOn(id);
    setError(null);
    const result = await advanceJob(id, status);
    setActingOn(null);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    await reload();
  }

  function handleDecline(id: string) {
    if (!userId) return;
    setDeclinedIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      saveDeclined(userId, next);
      return next;
    });
  }

  function handleDeclineFromDetail(id: string) {
    handleDecline(id);
    router.push(ROUTES.driverJobs);
  }

  const openMine = mine?.filter((j) => j.status === "confirmed" || j.status === "in_progress") ?? [];
  const visibleAvailable = available?.filter((j) => !declinedIds.has(j.id)) ?? null;
  const current = jobId && selected && selected.id === jobId ? selected : null;
  const detailOpen = Boolean(jobId);

  const pickupPoint: LocationPoint | null =
    current?.row && current.row.pickup_lat != null && current.row.pickup_lng != null
      ? { placeName: current.row.pickup_location, center: [current.row.pickup_lng, current.row.pickup_lat] }
      : null;
  const dropoffPoint: LocationPoint | null =
    current?.row && current.row.dropoff_lat != null && current.row.dropoff_lng != null
      ? { placeName: current.row.dropoff_location, center: [current.row.dropoff_lng, current.row.dropoff_lat] }
      : null;

  return (
    <DashboardShell clearBackdrop sidebar={<DriverSideMenu activeKey="jobs" />}>
      <div className={cn("flex w-full flex-col gap-5", !detailOpen && "max-w-2xl")}>
        {detailOpen ? <BackButton /> : null}

        {!detailOpen ? (
          <Panel>
            <h1 className="text-[1.5rem] font-extrabold tracking-[-0.02em] text-fg">Jobs</h1>
            <p className="mt-1.5 text-[0.88rem] text-muted">
              {verified
                ? "Accept an open request, then take it through to delivered."
                : "Jobs open up once your application is verified."}
            </p>
          </Panel>
        ) : null}

        {error ? (
          <p
            role="alert"
            className="rounded-xl border border-brand/25 bg-brand/[0.06] px-4 py-3 text-[0.85rem] text-brand"
          >
            {error}
          </p>
        ) : null}

        {!verified ? (
          <Panel>
            <p className="text-[0.88rem] text-muted">
              {profile.driverStatus === "rejected"
                ? "Your application wasn't approved, so jobs aren't available on this account."
                : "Your application is still pending verification. Once it's approved, open jobs will show up here."}
            </p>
          </Panel>
        ) : detailOpen ? (
          <div className="flex min-w-0 flex-1 flex-col gap-5 lg:flex-row lg:items-start">
            <div className="order-2 w-full min-w-0 lg:order-1 lg:w-1/2">
              {current?.row ? (
                <JobDetailPanel
                  key={current.row.id}
                  job={current.row}
                  busy={actingOn === current.row.id}
                  onAccept={() => handleAccept(current.row!.id)}
                  onAdvance={() => handleAdvance(current.row!.id, current.row!.status)}
                  onDecline={() => handleDeclineFromDetail(current.row!.id)}
                />
              ) : current ? (
                <Panel>
                  <h2 className="text-[1.1rem] font-bold text-fg">Job not found</h2>
                  <p className="mt-2 text-[0.85rem] text-muted">
                    This request doesn&rsquo;t exist, or it isn&rsquo;t available to you anymore.
                  </p>
                </Panel>
              ) : (
                <Panel>
                  <p className="text-[0.85rem] text-muted">Loading…</p>
                </Panel>
              )}
            </div>
            <div className="order-1 w-full min-w-0 lg:order-2 lg:sticky lg:top-28 lg:w-1/2 lg:self-start">
              <MoveMapPanel
                pickup={pickupPoint}
                dropoff={dropoffPoint}
                className="h-[22rem] lg:h-[32rem]"
                emptyMessage="No saved locations for this request."
              />
            </div>
          </div>
        ) : (
          <>
            {openMine.length > 0 ? (
              <section className="flex flex-col gap-3">
                <SectionLabel>My Jobs</SectionLabel>
                {openMine.map((job) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    busy={actingOn === job.id}
                    action={
                      job.status === "confirmed"
                        ? { label: "Start Trip", onClick: () => handleAdvance(job.id, job.status) }
                        : job.status === "in_progress"
                          ? { label: "Mark Delivered", onClick: () => handleAdvance(job.id, job.status) }
                          : null
                    }
                  />
                ))}
              </section>
            ) : null}

            <section className="flex flex-col gap-3">
              <SectionLabel>Available Jobs</SectionLabel>
              {visibleAvailable === null ? (
                <Panel>
                  <p className="text-[0.85rem] text-muted">Loading…</p>
                </Panel>
              ) : visibleAvailable.length === 0 ? (
                <Panel>
                  <p className="text-[0.85rem] text-muted">
                    {available && available.length > 0
                      ? "No jobs left to show — you've declined the rest for now."
                      : "No open jobs right now — check back soon."}
                  </p>
                </Panel>
              ) : (
                visibleAvailable.map((job) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    busy={actingOn === job.id}
                    action={{ label: "Accept", onClick: () => handleAccept(job.id) }}
                    onDecline={() => handleDecline(job.id)}
                  />
                ))
              )}
            </section>
          </>
        )}
      </div>
    </DashboardShell>
  );
}

function JobDetailPanel({
  job,
  busy,
  onAccept,
  onAdvance,
  onDecline,
}: {
  job: JobRow;
  busy: boolean;
  onAccept: () => void;
  onAdvance: () => void;
  onDecline: () => void;
}) {
  const [customer, setCustomer] = useState<{ first_name: string; last_name: string; phone: string } | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  // Only readable once this is the driver's own accepted job (RLS
  // migration 015's cross-table exception) — for an open, unclaimed job
  // there's no match between the two accounts yet. No reset-to-null guard
  // needed here: JobDetailPanel is keyed by job.id, so switching jobs
  // remounts it and this starts back at its initial null state.
  useEffect(() => {
    const supabase = getClient();
    if (!supabase || !job.driver_id) return;
    let cancelled = false;
    supabase
      .from("profiles")
      .select("first_name, last_name, phone")
      .eq("id", job.customer_id)
      .single()
      .then(({ data }) => {
        if (!cancelled && data) setCustomer(data as { first_name: string; last_name: string; phone: string });
      });
    return () => {
      cancelled = true;
    };
  }, [job.driver_id, job.customer_id]);

  useEffect(() => {
    const supabase = getClient();
    if (!supabase || !job.cargo_photo_url) return;
    let cancelled = false;
    supabase.storage
      .from("cargo-photos")
      .createSignedUrl(job.cargo_photo_url, 3600)
      .then(({ data }) => {
        if (!cancelled && data?.signedUrl) setPhotoUrl(data.signedUrl);
      });
    return () => {
      cancelled = true;
    };
  }, [job.cargo_photo_url]);

  return (
    <div className="flex flex-col gap-4">
      <Panel>
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-[1.3rem] font-extrabold tracking-[-0.02em] text-fg">Job Details</h1>
          <span className="shrink-0 rounded-full border border-brand/35 bg-brand/8 px-2.5 py-1 text-[0.65rem] font-semibold tracking-[0.08em] text-brand uppercase">
            {STATUS_LABEL[job.status]}
          </span>
        </div>
      </Panel>

      <Panel title="Request">
        <dl className="flex flex-col gap-3">
          <Row label="Pickup" value={job.pickup_location} />
          <Row label="Drop-off" value={job.dropoff_location} />
          <Row label="Cargo" value={job.cargo_description} />
          <Row label="Truck" value={`${job.vehicle_size} · ${job.vehicle_category}`} />
          <Row label="Assistants" value={formatAssistants(job.loading_assistants)} />
          <Row label="When" value={formatSchedule(job.scheduled_for)} />
          {job.cargo_weight_kg != null ? <Row label="Weight" value={`${job.cargo_weight_kg} kg`} /> : null}
          {job.cargo_volume_m3 != null ? <Row label="Volume" value={`${job.cargo_volume_m3} m³`} /> : null}
        </dl>
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- a signed storage URL, next/image gains nothing here
          <img src={photoUrl} alt="Cargo" className="mt-4 h-36 w-full rounded-xl object-cover" />
        ) : null}
      </Panel>

      {job.estimated_price != null ? (
        <Panel title="Price">
          <div className="flex items-center justify-between">
            {job.distance_km != null ? (
              <span className="text-[0.85rem] text-muted">{job.distance_km.toFixed(1)} km</span>
            ) : (
              <span />
            )}
            <span className="text-[1.1rem] font-extrabold text-fg">{formatPrice(job.estimated_price)}</span>
          </div>
        </Panel>
      ) : null}

      {job.driver_id ? (
        <Panel title="Customer">
          {customer ? (
            <dl className="flex flex-col gap-3">
              <Row label="Name" value={`${customer.first_name} ${customer.last_name}`} />
              <Row label="Phone" value={customer.phone} />
            </dl>
          ) : (
            <p className="text-[0.85rem] text-muted">Loading…</p>
          )}
        </Panel>
      ) : null}

      {job.status === "pending" ? (
        <div className="flex gap-2.5">
          <Button type="button" variant="primary" className="flex-1" disabled={busy} onClick={onAccept}>
            {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
            Accept
          </Button>
          <Button type="button" variant="ghost" disabled={busy} onClick={onDecline}>
            Decline
          </Button>
        </div>
      ) : job.status === "confirmed" ? (
        <Button type="button" variant="primary" className="w-full" disabled={busy} onClick={onAdvance}>
          {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
          Start Trip
        </Button>
      ) : job.status === "in_progress" ? (
        <Button type="button" variant="primary" className="w-full" disabled={busy} onClick={onAdvance}>
          {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
          Mark Delivered
        </Button>
      ) : null}
    </div>
  );
}

function JobCard({
  job,
  action,
  busy,
  onDecline,
}: {
  job: JobRow;
  action: { label: string; onClick: () => void } | null;
  busy: boolean;
  /** Only open (pending, unclaimed) jobs can be declined — a driver's own
   * accepted job has Start Trip/Mark Delivered instead, never this. */
  onDecline?: () => void;
}) {
  const router = useRouter();

  function open() {
    router.push(`${ROUTES.driverJobs}?id=${job.id}`);
  }

  return (
    <section
      role="button"
      tabIndex={0}
      onClick={open}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          open();
        }
      }}
      className="cursor-pointer rounded-xl border border-edge/12 bg-ink-950 p-5 transition-colors duration-200 hover:border-brand/30"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-[0.85rem] font-semibold text-fg">
            <MapPin className="size-3.5 shrink-0 text-brand" aria-hidden />
            <span className="truncate">{job.pickup_location}</span>
          </p>
          <p className="mt-1 flex items-center gap-1.5 text-[0.85rem] text-muted">
            <MapPin className="size-3.5 shrink-0" aria-hidden />
            <span className="truncate">{job.dropoff_location}</span>
          </p>
        </div>
        <span className="shrink-0 rounded-full border border-brand/35 bg-brand/8 px-2.5 py-1 text-[0.65rem] font-semibold tracking-[0.08em] text-brand uppercase">
          {STATUS_LABEL[job.status]}
        </span>
      </div>

      <p className="mt-3 text-[0.82rem] text-muted">{job.cargo_description}</p>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-[0.78rem] text-muted">
        <span className="flex items-center gap-1.5">
          <Truck className="size-3.5" aria-hidden />
          {job.vehicle_size} · {job.vehicle_category}
        </span>
        <span className="flex items-center gap-1.5">
          <Clock className="size-3.5" aria-hidden />
          {job.scheduled_for
            ? new Date(job.scheduled_for).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })
            : "As soon as possible"}
        </span>
        {job.estimated_price != null ? (
          <span className="font-semibold text-fg">{formatPrice(job.estimated_price)}</span>
        ) : null}
      </div>

      {action ? (
        <div className="mt-4 flex gap-2.5">
          <Button
            type="button"
            variant="primary"
            size="sm"
            className="flex-1"
            disabled={busy}
            onClick={(e) => {
              // The card itself navigates to the detail view on click —
              // these buttons need to act in place instead, same as the
              // detail view they're also reached from.
              e.stopPropagation();
              action.onClick();
            }}
          >
            {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
            {action.label}
          </Button>
          {onDecline ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={busy}
              onClick={(e) => {
                e.stopPropagation();
                onDecline();
              }}
            >
              Decline
            </Button>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

/** A small solid-backed label, not bare text — the clear backdrop has both
 * bright and dark regions, so no text color alone is safe to leave
 * floating on it. */
function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="inline-block self-start rounded-lg border border-edge/12 bg-ink-950 px-3 py-1.5">
      <h2 className="font-display text-[0.68rem] font-semibold tracking-[0.18em] text-mist uppercase">
        {children}
      </h2>
    </div>
  );
}

function Panel({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-edge/12 bg-ink-950 p-5">
      {title ? (
        <h2 className="mb-3.5 font-display text-[0.68rem] font-semibold tracking-[0.18em] text-mist uppercase">
          {title}
        </h2>
      ) : null}
      {children}
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

function formatAssistants(value: string | null): string {
  if (!value) return "None requested";
  if (value === "1") return "1 assistant";
  return `${value} assistants`;
}

function formatSchedule(value: string | null): string {
  if (!value) return "As soon as possible";
  return new Date(value).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });
}

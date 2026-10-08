"use client";

import { Clock, Loader2, MapPin, Truck } from "lucide-react";
import { useEffect, useState } from "react";
import { DashboardLoading, DashboardShell } from "@/components/auth/DashboardShell";
import { DriverSideMenu } from "@/components/dashboard/DriverSideMenu";
import { Button } from "@/components/ui/Button";
import { acceptJob, advanceJob, fetchAvailableJobs, fetchMyJobs, type BookingStatus, type JobRow } from "@/lib/bookings";
import { formatPrice } from "@/lib/pricing";
import { useRequireRole } from "@/lib/useRequireRole";

const STATUS_LABEL: Record<BookingStatus, string> = {
  pending: "Open",
  confirmed: "Accepted",
  in_progress: "On The Way",
  completed: "Completed",
  cancelled: "Cancelled",
};

/**
 * The real job-matching loop: any verified driver sees open requests and
 * can claim one (first to click wins — see `acceptJob`'s own comment on
 * how the race is handled), then moves it forward to delivered. Everything
 * else about a driver's account (status, documents, vehicle info) stays on
 * `/dashboard/driver` — this page is just the job list.
 */
export default function DriverJobsPage() {
  const { loading, profile } = useRequireRole("driver");
  const [available, setAvailable] = useState<JobRow[] | null>(null);
  const [mine, setMine] = useState<JobRow[] | null>(null);
  const [actingOn, setActingOn] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const verified = profile?.driverStatus === "verified";

  // Initial load, on its own .then() chain rather than an awaited call to
  // `reload` below — React's lint rule can't see into an async function to
  // know its setState calls are deferred past a microtask, so it flags a
  // direct call as a synchronous one. `reload` itself is only ever invoked
  // from the button handlers after this, a normal event-handler context.
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

  async function reload() {
    const [av, my] = await Promise.all([fetchAvailableJobs(), fetchMyJobs()]);
    if (av.ok) setAvailable(av.data);
    if (my.ok) setMine(my.data);
  }

  if (loading || !profile) return <DashboardLoading />;

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

  const openMine = mine?.filter((j) => j.status === "confirmed" || j.status === "in_progress") ?? [];

  return (
    <DashboardShell clearBackdrop sidebar={<DriverSideMenu activeKey="jobs" />}>
      <div className="flex w-full max-w-2xl flex-col gap-6">
        <div>
          <h1 className="text-[1.5rem] font-extrabold tracking-[-0.02em] text-fg">Jobs</h1>
          <p className="mt-1.5 text-[0.88rem] text-muted">
            {verified
              ? "Accept an open request, then take it through to delivered."
              : "Jobs open up once your application is verified."}
          </p>
        </div>

        {error ? (
          <p
            role="alert"
            className="rounded-xl border border-brand/25 bg-brand/[0.06] px-4 py-3 text-[0.85rem] text-brand"
          >
            {error}
          </p>
        ) : null}

        {!verified ? (
          <section className="rounded-xl border border-edge/12 bg-ink-950 p-5">
            <p className="text-[0.88rem] text-muted">
              {profile.driverStatus === "rejected"
                ? "Your application wasn't approved, so jobs aren't available on this account."
                : "Your application is still pending verification. Once it's approved, open jobs will show up here."}
            </p>
          </section>
        ) : (
          <>
            {openMine.length > 0 ? (
              <section className="flex flex-col gap-3">
                <h2 className="font-display text-[0.68rem] font-semibold tracking-[0.18em] text-mist uppercase">
                  My Jobs
                </h2>
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
              <h2 className="font-display text-[0.68rem] font-semibold tracking-[0.18em] text-mist uppercase">
                Available Jobs
              </h2>
              {available === null ? (
                <p className="text-[0.85rem] text-muted">Loading…</p>
              ) : available.length === 0 ? (
                <p className="text-[0.85rem] text-muted">No open jobs right now — check back soon.</p>
              ) : (
                available.map((job) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    busy={actingOn === job.id}
                    action={{ label: "Accept", onClick: () => handleAccept(job.id) }}
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

function JobCard({
  job,
  action,
  busy,
}: {
  job: JobRow;
  action: { label: string; onClick: () => void } | null;
  busy: boolean;
}) {
  return (
    <section className="rounded-xl border border-edge/12 bg-ink-950 p-5">
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
        <Button type="button" variant="primary" size="sm" className="mt-4 w-full" disabled={busy} onClick={action.onClick}>
          {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
          {action.label}
        </Button>
      ) : null}
    </section>
  );
}

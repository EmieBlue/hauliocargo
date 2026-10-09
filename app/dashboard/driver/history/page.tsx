"use client";

import { CheckCircle2, Clock, MapPin, XCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { DashboardLoading, DashboardShell } from "@/components/auth/DashboardShell";
import { DriverSideMenu } from "@/components/dashboard/DriverSideMenu";
import {
  fetchCancellationHistory,
  fetchDeclineHistory,
  fetchMyJobs,
  type HistoryRow,
  type JobRow,
} from "@/lib/bookings";
import { formatPrice } from "@/lib/pricing";
import { useRequireRole } from "@/lib/useRequireRole";

/**
 * A read-only record of what's already happened — completed rides, and
 * the declines/cancellations logged by lib/bookings.ts's own functions
 * (job_declines / job_cancellations), each keeping a snapshot of the
 * job's details since the live `bookings` row may no longer be readable
 * once another driver takes it over (migration 015's own-job-only SELECT
 * policy).
 *
 * Each section is one card with its title as an internal header, same
 * shape as the dashboard's own `InfoCard` — rows live inside that same
 * card, divided by thin borders, not as separate nested boxes. The first
 * version floated the title above a separate card per section, which read
 * as disconnected and left every card looking mostly empty.
 */
export default function DriverHistoryPage() {
  const { loading, profile } = useRequireRole("driver");
  const [completed, setCompleted] = useState<JobRow[] | null>(null);
  const [declines, setDeclines] = useState<HistoryRow[] | null>(null);
  const [cancellations, setCancellations] = useState<HistoryRow[] | null>(null);

  const verified = profile?.driverStatus === "verified";

  useEffect(() => {
    if (!verified) return;
    let cancelled = false;
    Promise.all([fetchMyJobs(), fetchDeclineHistory(), fetchCancellationHistory()]).then(([my, dec, can]) => {
      if (cancelled) return;
      if (my.ok) setCompleted(my.data.filter((job) => job.status === "completed"));
      if (dec.ok) setDeclines(dec.data);
      if (can.ok) setCancellations(can.data);
    });
    return () => {
      cancelled = true;
    };
  }, [verified]);

  if (loading || !profile) return <DashboardLoading />;

  return (
    <DashboardShell clearBackdrop sidebar={<DriverSideMenu activeKey="history" />}>
      <div className="flex w-full max-w-2xl flex-col gap-6">
        <Panel>
          <h1 className="text-[1.5rem] font-extrabold tracking-[-0.02em] text-fg">History</h1>
          <p className="mt-1.5 text-[0.88rem] text-muted">Your past rides, declines and cancellations.</p>
        </Panel>

        {!verified ? (
          <Panel>
            <p className="text-[0.88rem] text-muted">
              {profile.driverStatus === "rejected"
                ? "Your application wasn't approved, so there's no history on this account."
                : "Your application is still pending verification."}
            </p>
          </Panel>
        ) : (
          <>
            <Section title="Completed Rides" icon={CheckCircle2} empty="Nothing delivered yet.">
              {completed?.map((job) => (
                <div key={job.id} className="py-3.5 first:pt-0">
                  <RouteLine pickup={job.pickup_location} dropoff={job.dropoff_location} />
                  <p className="mt-2 text-[0.82rem] text-muted">{job.cargo_description}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.78rem] text-muted">
                    <span>
                      {job.vehicle_size} · {job.vehicle_category}
                    </span>
                    <span>{formatSchedule(job.scheduled_for)}</span>
                    {job.estimated_price != null ? (
                      <span className="font-semibold text-fg">{formatPrice(job.estimated_price)}</span>
                    ) : null}
                  </div>
                </div>
              ))}
            </Section>

            <Section title="Declined" icon={Clock} empty="No declines on record.">
              {declines?.map((row) => <HistoryRowItem key={row.id} row={row} />)}
            </Section>

            <Section title="Cancelled" icon={XCircle} empty="No cancellations on record.">
              {cancellations?.map((row) => <HistoryRowItem key={row.id} row={row} />)}
            </Section>
          </>
        )}
      </div>
    </DashboardShell>
  );
}

function Section({
  title,
  icon: Icon,
  empty,
  children,
}: {
  title: string;
  icon: LucideIcon;
  empty: string;
  children: ReactNode;
}) {
  const hasChildren = Array.isArray(children) ? children.filter(Boolean).length > 0 : Boolean(children);
  return (
    <Panel>
      <div className="flex items-center gap-2">
        <Icon className="size-4 text-brand" aria-hidden />
        <h2 className="font-display text-[0.68rem] font-semibold tracking-[0.18em] text-mist uppercase">{title}</h2>
      </div>
      <div className="mt-3.5 border-t border-edge/10">
        {hasChildren ? (
          <div className="divide-y divide-edge/10">{children}</div>
        ) : (
          <p className="pt-3.5 text-[0.85rem] text-muted">{empty}</p>
        )}
      </div>
    </Panel>
  );
}

function HistoryRowItem({ row }: { row: HistoryRow }) {
  return (
    <div className="py-3.5 first:pt-0">
      <RouteLine pickup={row.pickup_location} dropoff={row.dropoff_location} />
      <p className="mt-2 text-[0.82rem] text-muted">{row.cargo_description}</p>
      {row.vehicle_size || row.vehicle_category ? (
        <p className="mt-1 text-[0.78rem] text-muted">
          {row.vehicle_size} · {row.vehicle_category}
        </p>
      ) : null}
      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
        {row.reasons.map((reason) => (
          <span
            key={reason}
            className="rounded-full border border-edge/12 bg-edge/[0.04] px-2.5 py-1 text-[0.7rem] text-muted"
          >
            {reason}
          </span>
        ))}
        <span className="text-[0.75rem] text-muted">
          {new Date(row.created_at).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}
        </span>
      </div>
    </div>
  );
}

function RouteLine({ pickup, dropoff }: { pickup: string | null; dropoff: string | null }) {
  return (
    <div>
      <p className="flex items-center gap-1.5 text-[0.85rem] font-semibold text-fg">
        <MapPin className="size-3.5 shrink-0 text-brand" aria-hidden />
        <span className="truncate">{pickup ?? "Not recorded"}</span>
      </p>
      <p className="mt-1 flex items-center gap-1.5 text-[0.85rem] text-muted">
        <MapPin className="size-3.5 shrink-0" aria-hidden />
        <span className="truncate">{dropoff ?? "Not recorded"}</span>
      </p>
    </div>
  );
}

function Panel({ children }: { children: ReactNode }) {
  return <section className="rounded-xl border border-edge/12 bg-ink-950 p-5">{children}</section>;
}

function formatSchedule(value: string | null): string {
  if (!value) return "As soon as possible";
  return new Date(value).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });
}

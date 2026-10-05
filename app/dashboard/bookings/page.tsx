"use client";

import { Outfit } from "next/font/google";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState, type ReactNode } from "react";
import { AppSideMenu } from "@/components/dashboard/AppSideMenu";
import { DashboardLoading, DashboardShell } from "@/components/auth/DashboardShell";
import type { LocationPoint } from "@/components/dashboard/MoveMap";
import { MoveMapPanel } from "@/components/dashboard/MoveMapPanel";
import { cn } from "@/lib/cn";
import { ROUTES } from "@/lib/site";
import { getClient } from "@/lib/supabase";
import { useRequireAuth } from "@/lib/useRequireAuth";

const outfit = Outfit({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"] });

const INK = "#17181c";
const MUTED = "#6b6b74";
const CREAM = "#f6f3ed";
const AMBER = "#f0b429";
const ACCRA_CENTER: [number, number] = [-0.2, 5.6];

type BookingStatus = "pending" | "confirmed" | "in_progress" | "completed" | "cancelled";

type BookingRow = {
  id: string;
  pickup_location: string;
  dropoff_location: string;
  pickup_lat: number | null;
  pickup_lng: number | null;
  dropoff_lat: number | null;
  dropoff_lng: number | null;
  scheduled_for: string | null;
  cargo_description: string;
  vehicle_category: string;
  vehicle_size: string;
  loading_assistants: string | null;
  cargo_photo_url: string | null;
  status: BookingStatus;
};

const BOOKING_COLUMNS =
  "id, pickup_location, dropoff_location, pickup_lat, pickup_lng, dropoff_lat, dropoff_lng, scheduled_for, cargo_description, vehicle_category, vehicle_size, loading_assistants, cargo_photo_url, status";

const PROGRESS_STEPS = [
  { status: "pending", label: "Requested" },
  { status: "confirmed", label: "Confirmed" },
  { status: "in_progress", label: "On the way" },
  { status: "completed", label: "Completed" },
] as const;

/**
 * The customer's bookings page. The side menu lists their requests; picking
 * one opens its detail panel beside the map. With nothing picked, the map
 * fills the page. Selection lives in `?id=` (static export, so no `[id]`
 * route), which also means refresh and back keep the same selection.
 */
export default function BookingsPage() {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <BookingsContent />
    </Suspense>
  );
}

type Fetched = { id: string; row: BookingRow | null };

function BookingsContent() {
  const { loading, profile } = useRequireAuth();
  const bookingId = useSearchParams().get("id");
  const [fetched, setFetched] = useState<Fetched | null>(null);

  useEffect(() => {
    if (!bookingId) return;
    const supabase = getClient();
    if (!supabase) return;

    let cancelled = false;
    supabase
      .from("bookings")
      .select(BOOKING_COLUMNS)
      .eq("id", bookingId)
      .single()
      .then(({ data, error }) => {
        if (cancelled) return;
        setFetched({ id: bookingId, row: error || !data ? null : (data as BookingRow) });
      });

    return () => {
      cancelled = true;
    };
  }, [bookingId]);

  if (loading || !profile) return <DashboardLoading />;

  const current = bookingId && fetched && fetched.id === bookingId ? fetched : null;
  const row = current?.row ?? null;
  const missing = Boolean(bookingId && current && !current.row);

  const pickupPoint: LocationPoint | null =
    row && row.pickup_lat != null && row.pickup_lng != null
      ? { placeName: row.pickup_location, center: [row.pickup_lng, row.pickup_lat] }
      : null;
  const dropoffPoint: LocationPoint | null =
    row && row.dropoff_lat != null && row.dropoff_lng != null
      ? { placeName: row.dropoff_location, center: [row.dropoff_lng, row.dropoff_lat] }
      : null;

  const panelOpen = Boolean(bookingId);

  return (
    <DashboardShell
      backLink={{ href: ROUTES.dashboardCustomer, label: "Dashboard" }}
      sidebar={<AppSideMenu activeKey="tracking" selectedId={bookingId} />}
    >
      <div className={cn("flex w-full items-start", outfit.className)}>
        <div className="flex min-w-0 flex-1 flex-col gap-5 lg:flex-row lg:items-start">
          {panelOpen ? (
            <div className="order-2 w-full min-w-0 lg:order-1 lg:w-1/2">
              {row ? (
                <BookingDetailPanel booking={row} />
              ) : missing ? (
                <PanelNote title="Booking not found">
                  This request doesn&rsquo;t exist, or it isn&rsquo;t on your account.
                </PanelNote>
              ) : (
                <PanelNote title="Loading your request…" />
              )}
            </div>
          ) : null}

          <div
            className={cn(
              "order-1 w-full min-w-0 lg:order-2",
              panelOpen ? "lg:sticky lg:top-28 lg:w-1/2 lg:self-start" : "lg:w-full",
            )}
          >
            <MoveMapPanel
              pickup={pickupPoint}
              dropoff={dropoffPoint}
              className="h-[22rem] lg:h-[42rem]"
              defaultCenter={ACCRA_CENTER}
              emptyMessage="Pick a request from the menu to see its route."
            />
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}

function BookingDetailPanel({ booking }: { booking: BookingRow }) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  useEffect(() => {
    const path = booking.cargo_photo_url;
    const supabase = getClient();
    if (!path || !supabase) return;

    let cancelled = false;
    supabase.storage
      .from("cargo-photos")
      .createSignedUrl(path, 3600)
      .then(({ data }) => {
        if (!cancelled && data?.signedUrl) setPhotoUrl(data.signedUrl);
      });

    return () => {
      cancelled = true;
    };
  }, [booking.cargo_photo_url]);

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <p className="text-[0.68rem] font-semibold tracking-[0.22em] uppercase" style={{ color: MUTED }}>
          Move With You
        </p>
        <h1 className="mt-1 text-[1.6rem] font-extrabold tracking-[-0.02em]" style={{ color: INK }}>
          Your move
        </h1>
        <ProgressTracker status={booking.status} />
      </Card>

      <Card>
        <SectionLabel>Request details</SectionLabel>
        <dl className="mt-3 flex flex-col gap-3 text-[0.88rem]" style={{ color: INK }}>
          <DetailRow label="Pickup" value={booking.pickup_location} />
          <DetailRow label="Drop-off" value={booking.dropoff_location} />
          <DetailRow label="Cargo" value={booking.cargo_description} />
          <DetailRow label="Truck" value={`${booking.vehicle_size} · ${booking.vehicle_category}`} />
          <DetailRow label="Assistants" value={formatAssistants(booking.loading_assistants)} />
          <DetailRow label="When" value={formatSchedule(booking.scheduled_for)} />
        </dl>
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- a signed storage URL, next/image gains nothing here
          <img src={photoUrl} alt="Cargo" className="mt-4 h-36 w-full rounded-xl object-cover" />
        ) : null}
      </Card>

      <Card>
        <SectionLabel>Driver</SectionLabel>
        <p className="mt-2 text-[0.88rem]" style={{ color: MUTED }}>
          Waiting for a driver to accept your request.
        </p>
      </Card>

      <Card>
        <SectionLabel>Price</SectionLabel>
        <p className="mt-2 text-[0.88rem]" style={{ color: MUTED }}>
          Pricing coming soon.
        </p>
        {booking.loading_assistants ? (
          <p className="mt-2 text-[0.85rem]" style={{ color: INK }}>
            Loading assistants: {formatAssistants(booking.loading_assistants)}
          </p>
        ) : null}
      </Card>

      <Card>
        <SectionLabel>Chat</SectionLabel>
        <p className="mt-2 text-[0.88rem]" style={{ color: MUTED }}>
          Chat opens once a driver accepts.
        </p>
      </Card>
    </div>
  );
}

function PanelNote({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <Card>
      <h1 className="text-[1.3rem] font-extrabold tracking-[-0.02em]" style={{ color: INK }}>
        {title}
      </h1>
      {children ? (
        <p className="mt-2 text-[0.88rem] leading-relaxed" style={{ color: MUTED }}>
          {children}
        </p>
      ) : null}
    </Card>
  );
}

function Card({ children }: { children: ReactNode }) {
  return (
    <section className="rounded-2xl border p-5" style={{ borderColor: "rgba(0,0,0,0.08)", background: CREAM }}>
      {children}
    </section>
  );
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="text-[0.72rem] font-semibold tracking-[0.08em] uppercase" style={{ color: MUTED }}>
      {children}
    </p>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-[0.7rem] font-semibold tracking-[0.06em] uppercase" style={{ color: MUTED }}>
        {label}
      </dt>
      <dd className="leading-snug">{value}</dd>
    </div>
  );
}

const STEP_INDEX: Record<BookingStatus, number> = { pending: 0, confirmed: 1, in_progress: 2, completed: 3, cancelled: -1 };

function ProgressTracker({ status }: { status: BookingStatus }) {
  if (status === "cancelled") {
    return (
      <p className="mt-4 text-[0.88rem]" style={{ color: MUTED }}>
        This request was cancelled.
      </p>
    );
  }
  const current = STEP_INDEX[status];
  return (
    <ol className="mt-4 flex flex-col gap-2.5">
      {PROGRESS_STEPS.map((step, index) => {
        const reached = index <= current;
        return (
          <li key={step.status} className="flex items-center gap-3 text-[0.88rem]" style={{ color: reached ? INK : MUTED }}>
            <span
              className="grid size-4 shrink-0 place-items-center rounded-full"
              style={{ background: reached ? AMBER : "rgba(0,0,0,0.12)" }}
              aria-hidden
            />
            <span className={cn(index === current && "font-semibold")}>{step.label}</span>
          </li>
        );
      })}
    </ol>
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

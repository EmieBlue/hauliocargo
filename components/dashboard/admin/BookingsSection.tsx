"use client";

import { CheckCircle2, Clock, Navigation, PackageCheck, XCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { BackButton } from "@/components/dashboard/BackButton";
import { Panel, Row, SectionLabel } from "@/components/dashboard/admin/ApplicationsSection";
import type { LocationPoint } from "@/components/dashboard/MoveMap";
import { LiveLocationNote, MoveMapPanel } from "@/components/dashboard/MoveMapPanel";
import { Badge } from "@/components/ui/Badge";
import { fetchAdminBooking, fetchAdminBookings, fetchBookingTimeline, type AdminBookingRow, type BookingStatusEvent } from "@/lib/admin";
import type { BookingStatus } from "@/lib/bookings";
import { formatPrice } from "@/lib/pricing";
import { cn } from "@/lib/cn";
import { ROUTES } from "@/lib/site";
import { getClient } from "@/lib/supabase";
import { useLiveLocation } from "@/lib/useLiveLocation";

const ACCRA_CENTER: [number, number] = [-0.2, 5.6];

export const BOOKING_STATUS_COPY: Record<BookingStatus, { label: string; icon: LucideIcon }> = {
  pending: { label: "Pending", icon: Clock },
  confirmed: { label: "Confirmed", icon: CheckCircle2 },
  in_progress: { label: "On the way", icon: Navigation },
  completed: { label: "Completed", icon: PackageCheck },
  cancelled: { label: "Cancelled", icon: XCircle },
};

const FILTERS: { key: BookingStatus | "all"; label: string }[] = [
  { key: "pending", label: "Pending" },
  { key: "confirmed", label: "Confirmed" },
  { key: "in_progress", label: "On the way" },
  { key: "completed", label: "Completed" },
  { key: "cancelled", label: "Cancelled" },
  { key: "all", label: "All" },
];

function isBookingStatus(value: string | null): value is BookingStatus {
  return value === "pending" || value === "confirmed" || value === "in_progress" || value === "completed" || value === "cancelled";
}

type Selected = { id: string; row: AdminBookingRow | null };

/** Every booking across every customer — route, status, price, assigned
 * driver — with a detail view that includes the pickup/dropoff map, same
 * `MoveMapPanel` the customer's own bookings page already uses. View-only:
 * no status changes or reassignment from here this round. */
export function BookingsSection() {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get("id");
  const statusParam = searchParams.get("status");
  const statusFilter: BookingStatus | "all" = isBookingStatus(statusParam) ? statusParam : "all";

  const [bookings, setBookings] = useState<AdminBookingRow[] | null>(null);
  const [selected, setSelected] = useState<Selected | null>(null);

  useEffect(() => {
    let cancelled = false;
    const filter = statusFilter === "all" ? undefined : statusFilter;
    fetchAdminBookings(filter).then((result) => {
      if (!cancelled && result.ok) setBookings(result.data);
    });
    return () => {
      cancelled = true;
    };
  }, [statusFilter]);

  useEffect(() => {
    if (!bookingId) return;
    let cancelled = false;
    fetchAdminBooking(bookingId).then((result) => {
      if (cancelled) return;
      setSelected({ id: bookingId, row: result.ok ? result.data : null });
    });
    return () => {
      cancelled = true;
    };
  }, [bookingId]);

  const current = bookingId && selected && selected.id === bookingId ? selected : null;
  const detailOpen = Boolean(bookingId);

  return (
    <div className={cn("flex w-full flex-col gap-5", !detailOpen && "max-w-3xl")}>
      {detailOpen ? <BackButton /> : null}

      {!detailOpen ? (
        <>
          <Panel>
            <h1 className="text-[1.5rem] font-extrabold tracking-[-0.02em] text-fg">Bookings</h1>
            <p className="mt-1.5 text-[0.88rem] text-muted">Every trip requested on HaulioCargo, across every customer.</p>
          </Panel>

          <div className="flex flex-wrap gap-2">
            {FILTERS.map((f) => (
              <Link
                key={f.key}
                href={f.key === "all" ? `${ROUTES.dashboardAdmin}?section=bookings` : `${ROUTES.dashboardAdmin}?section=bookings&status=${f.key}`}
                className={cn(
                  "rounded-full border px-4 py-1.5 text-[0.78rem] font-medium transition-colors duration-200",
                  statusFilter === f.key
                    ? "border-brand bg-brand/10 text-brand"
                    : "border-edge/12 text-muted hover:border-brand/30 hover:text-fg",
                )}
              >
                {f.label}
              </Link>
            ))}
          </div>

          <Panel>
            {bookings === null ? (
              <p className="text-[0.85rem] text-muted">Loading…</p>
            ) : bookings.length === 0 ? (
              <p className="text-[0.85rem] text-muted">Nothing here.</p>
            ) : (
              <div className="divide-y divide-edge/10">
                {bookings.map((booking) => (
                  <BookingRow key={booking.id} booking={booking} />
                ))}
              </div>
            )}
          </Panel>
        </>
      ) : current?.row ? (
        <DetailPanel booking={current.row} />
      ) : (
        <Panel>
          <p className="text-[0.85rem] text-muted">{current ? "Booking not found." : "Loading…"}</p>
        </Panel>
      )}
    </div>
  );
}

function BookingRow({ booking }: { booking: AdminBookingRow }) {
  const copy = BOOKING_STATUS_COPY[booking.status];
  const Icon = copy.icon;
  const customerName = booking.customer ? `${booking.customer.first_name} ${booking.customer.last_name}` : "Unknown customer";

  return (
    <Link
      href={`${ROUTES.dashboardAdmin}?section=bookings&id=${booking.id}`}
      className="-mx-5 flex items-center justify-between gap-3 px-5 py-3.5 transition-colors duration-200 first:pt-0 hover:bg-edge/[0.03]"
    >
      <div className="min-w-0">
        <p className="truncate text-[0.9rem] font-semibold text-fg">{customerName}</p>
        <p className="mt-0.5 truncate text-[0.8rem] text-muted">
          {booking.pickup_location} → {booking.dropoff_location}
        </p>
      </div>
      <Badge pulse={booking.status === "pending"} className="shrink-0">
        <Icon className="size-3" aria-hidden />
        {copy.label}
      </Badge>
    </Link>
  );
}

function DetailPanel({ booking }: { booking: AdminBookingRow }) {
  const copy = BOOKING_STATUS_COPY[booking.status];
  const Icon = copy.icon;
  const customerName = booking.customer ? `${booking.customer.first_name} ${booking.customer.last_name}` : "Unknown customer";
  const driverName = booking.driver ? `${booking.driver.first_name} ${booking.driver.last_name}` : "Unclaimed";

  const pickup: LocationPoint | null =
    booking.pickup_lat != null && booking.pickup_lng != null
      ? { placeName: booking.pickup_location, center: [booking.pickup_lng, booking.pickup_lat] }
      : null;
  const dropoff: LocationPoint | null =
    booking.dropoff_lat != null && booking.dropoff_lng != null
      ? { placeName: booking.dropoff_location, center: [booking.dropoff_lng, booking.dropoff_lat] }
      : null;

  const { position: livePosition, updatedAt: liveUpdatedAt } = useLiveLocation(
    booking.status === "in_progress" ? booking.id : null,
  );

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-5 lg:flex-row lg:items-start">
      <div className="flex w-full min-w-0 flex-col gap-4 lg:w-2/3">
        <Panel>
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-[1.4rem] font-extrabold tracking-[-0.02em] text-fg">
                {booking.pickup_location} → {booking.dropoff_location}
              </h1>
              <p className="mt-1 text-[0.85rem] text-muted">
                Requested {new Date(booking.created_at).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}
              </p>
            </div>
            <Badge pulse={booking.status === "pending"} className="shrink-0">
              <Icon className="size-3" aria-hidden />
              {copy.label}
            </Badge>
          </div>
        </Panel>

        <Panel>
          <SectionLabel>Route</SectionLabel>
          <div className="mt-3">
            {livePosition ? <LiveLocationNote updatedAt={liveUpdatedAt} /> : null}
            <div className="h-80 overflow-hidden rounded-xl">
              <MoveMapPanel
                pickup={pickup}
                dropoff={dropoff}
                livePosition={livePosition}
                defaultCenter={ACCRA_CENTER}
                emptyMessage="No map points saved for this trip."
              />
            </div>
          </div>
        </Panel>

        <Panel>
          <SectionLabel>Timeline</SectionLabel>
          <Timeline bookingId={booking.id} />
        </Panel>

        <Panel>
          <SectionLabel>Cargo</SectionLabel>
          <dl className="mt-3 grid gap-3.5 sm:grid-cols-2">
            <Row label="Type" value={booking.booking_type} />
            <Row label="Category" value={booking.vehicle_category} />
            <Row label="Truck Size" value={booking.vehicle_size} />
            <Row label="Description" value={booking.cargo_description} />
            {booking.cargo_weight_kg ? <Row label="Weight" value={`${booking.cargo_weight_kg} kg`} /> : null}
            {booking.cargo_volume_m3 ? <Row label="Volume" value={`${booking.cargo_volume_m3} m³`} /> : null}
            {booking.loading_assistants ? <Row label="Loading Assistants" value={booking.loading_assistants} /> : null}
          </dl>
        </Panel>
      </div>

      <div className="flex w-full flex-col gap-4 lg:sticky lg:top-28 lg:w-1/3 lg:self-start">
        <Panel>
          <SectionLabel>Customer</SectionLabel>
          <dl className="mt-3 flex flex-col gap-3.5">
            <Row label="Name" value={customerName} />
            {booking.customer ? <Row label="Phone" value={booking.customer.phone} /> : null}
          </dl>
        </Panel>

        <Panel>
          <SectionLabel>Driver</SectionLabel>
          {booking.driver_id ? (
            <DriverMedia driverId={booking.driver_id} avatarPath={booking.driver?.avatar_path ?? null} />
          ) : null}
          <dl className="mt-3 flex flex-col gap-3.5">
            <Row label="Name" value={driverName} />
            {booking.driver ? <Row label="Phone" value={booking.driver.phone} /> : null}
          </dl>
        </Panel>

        <Panel>
          <SectionLabel>Price</SectionLabel>
          <dl className="mt-3 flex flex-col gap-3.5">
            <Row label="Distance" value={booking.distance_km != null ? `${booking.distance_km} km` : "—"} />
            <Row label="Estimated Price" value={booking.estimated_price != null ? formatPrice(booking.estimated_price) : "—"} />
          </dl>
        </Panel>
      </div>
    </div>
  );
}

/**
 * A booking's status history (migration 027) — when it moved from pending to
 * confirmed to in_progress to completed, not just what it is now. This is a
 * stage timeline, not live location: it answers "what's happened and when",
 * not "where is it right now" — that's a separate future round.
 */
function Timeline({ bookingId }: { bookingId: string }) {
  const [events, setEvents] = useState<BookingStatusEvent[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchBookingTimeline(bookingId).then((result) => {
      if (!cancelled && result.ok) setEvents(result.data);
    });
    return () => {
      cancelled = true;
    };
  }, [bookingId]);

  if (events === null) return <p className="mt-3 text-[0.85rem] text-muted">Loading…</p>;
  if (events.length === 0) return <p className="mt-3 text-[0.85rem] text-muted">No history yet.</p>;

  return (
    <ol className="mt-3 flex flex-col gap-3">
      {events.map((event, index) => {
        const copy = BOOKING_STATUS_COPY[event.status];
        const Icon = copy.icon;
        return (
          <li key={`${event.status}-${event.created_at}`} className="flex items-center gap-3">
            <span
              className={cn(
                "grid size-7 shrink-0 place-items-center rounded-full border",
                index === events.length - 1 ? "border-brand bg-brand/10 text-brand" : "border-edge/12 text-muted",
              )}
            >
              <Icon className="size-3.5" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="text-[0.85rem] font-medium text-fg">{copy.label}</p>
              <p className="text-[0.75rem] text-muted">
                {new Date(event.created_at).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/**
 * The driver's profile picture (`avatars` bucket, admin-wide read added in
 * migration 026) and truck photo (`driver-documents` bucket, `vehicle-photo-`
 * prefix — same convention `ApplicationsSection`'s own `DocumentsPanel`
 * already relies on, already admin-readable since 023/024).
 */
function DriverMedia({ driverId, avatarPath }: { driverId: string; avatarPath: string | null }) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [truckUrl, setTruckUrl] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    const supabase = getClient();
    if (!supabase) return;
    let cancelled = false;

    if (avatarPath) {
      supabase.storage
        .from("avatars")
        .createSignedUrl(avatarPath, 3600)
        .then(({ data }) => {
          if (!cancelled) setAvatarUrl(data?.signedUrl ?? null);
        });
    }

    supabase.storage
      .from("driver-documents")
      .list(driverId)
      .then(({ data: files }) => {
        if (cancelled) return;
        // `upsert: false` on upload (lib/auth.ts) means re-uploading the same
        // document kind adds another file rather than replacing one — take
        // the last match in list order (same "latest wins" convention
        // ApplicationsSection's own DocumentsPanel already uses), not the
        // first, or a driver's older test upload can outrank their real photo.
        let latestName: string | null = null;
        for (const f of files ?? []) {
          if (f.name.startsWith("vehicle-photo-")) latestName = f.name;
        }
        if (!latestName) {
          setTruckUrl(null);
          return;
        }
        supabase.storage
          .from("driver-documents")
          .createSignedUrl(`${driverId}/${latestName}`, 3600)
          .then(({ data }) => {
            if (!cancelled) setTruckUrl(data?.signedUrl ?? null);
          });
      });

    return () => {
      cancelled = true;
    };
  }, [driverId, avatarPath]);

  return (
    <div className="mt-3 flex flex-col gap-3">
      <div className="flex items-center gap-3">
        {avatarUrl ? (
          <img src={avatarUrl} alt="" className="size-12 shrink-0 rounded-full border border-edge/12 object-cover" />
        ) : (
          <span className="grid size-12 shrink-0 place-items-center rounded-full border border-edge/12 bg-edge/[0.04] text-[0.62rem] text-muted">
            No photo
          </span>
        )}
      </div>

      <div>
        <p className="text-[0.7rem] font-semibold tracking-[0.05em] text-muted uppercase">Truck Photo</p>
        {truckUrl === undefined ? (
          <p className="mt-1.5 text-[0.8rem] text-muted">Loading…</p>
        ) : truckUrl ? (
          <img src={truckUrl} alt="" className="mt-1.5 h-36 w-full rounded-lg border border-edge/12 object-cover" />
        ) : (
          <p className="mt-1.5 text-[0.8rem] text-muted">Not provided</p>
        )}
      </div>
    </div>
  );
}

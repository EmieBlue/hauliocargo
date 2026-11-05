"use client";

import { useEffect, useState } from "react";
import type { LocationPoint } from "@/components/dashboard/MoveMap";
import { fetchLatestLocation, subscribeToLocation, type LocationPing } from "./bookings";

/**
 * A booking's live position — the latest ping on mount, then live updates via
 * Realtime (migration 028), same fetch-then-subscribe shape `lib/messages.ts`
 * already uses for chat. Pass `null` when there's nothing to track (the
 * caller decides that — typically whether `booking.status` is one of
 * `ACTIVE_TRANSIT_STATUSES`, lib/bookings.ts) so the fetch and the
 * subscription only ever run when a live position is actually meaningful.
 */
export function useLiveLocation(bookingId: string | null): {
  position: LocationPoint | null;
  updatedAt: string | null;
} {
  const [ping, setPing] = useState<LocationPing | null>(null);

  useEffect(() => {
    // No synchronous setState here (that caused cascading renders) — instead
    // the render-time guard below (`bookingId ? ping : null`) hides stale
    // state when there's nothing to track. Both setPing calls happen inside
    // callbacks (a promise resolution, a Realtime event), not the effect
    // body itself.
    if (!bookingId) return;
    let cancelled = false;

    fetchLatestLocation(bookingId).then((result) => {
      if (!cancelled && result.ok) setPing(result.data);
    });

    const unsubscribe = subscribeToLocation(bookingId, (newPing) => {
      if (!cancelled) setPing(newPing);
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [bookingId]);

  const effectivePing = bookingId ? ping : null;
  return {
    position: effectivePing ? { placeName: "Live position", center: [effectivePing.lng, effectivePing.lat] } : null,
    updatedAt: effectivePing?.recorded_at ?? null,
  };
}

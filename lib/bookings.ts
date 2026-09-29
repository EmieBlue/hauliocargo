"use client";

import type { AuthResult } from "./auth";
import { authEnabled, getClient } from "./supabase";

export type BookingType = "move" | "send" | "receive";

export type BookingFields = {
  pickupLocation: string;
  dropoffLocation: string;
  /** ISO datetime string, or null for "as soon as possible". */
  scheduledFor: string | null;
  cargoDescription: string;
  vehicleCategory: string;
};

const NOT_CONFIGURED = "Booking is not available yet. Please check back shortly.";

/**
 * Saves a booking request against the signed-in customer. Same shape used by
 * all three booking types (move/send/receive) — see `supabase/005_bookings.sql`.
 * No pricing or driver-matching yet; this only records what the customer
 * asked for.
 */
export async function createBooking(
  type: BookingType,
  fields: BookingFields,
): Promise<AuthResult> {
  if (!authEnabled) return { ok: false, message: NOT_CONFIGURED };
  const supabase = getClient();
  if (!supabase) return { ok: false, message: NOT_CONFIGURED };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Please sign in again." };

  const { error } = await supabase.from("bookings").insert({
    customer_id: user.id,
    booking_type: type,
    pickup_location: fields.pickupLocation.trim(),
    dropoff_location: fields.dropoffLocation.trim(),
    scheduled_for: fields.scheduledFor,
    cargo_description: fields.cargoDescription.trim(),
    vehicle_category: fields.vehicleCategory,
  });
  if (error) {
    console.error("booking failed", error);
    return { ok: false, message: "That didn't go through. Please try again." };
  }

  return { ok: true, data: undefined };
}

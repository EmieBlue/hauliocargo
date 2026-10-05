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
  /** One of CARGO_CATEGORIES — both paths (AI or manual) always resolve one. */
  vehicleCategory: string;
  /** One of TRUCK_SIZES (10ft/15ft/20ft/26ft) — the real final answer. */
  vehicleSize: string;
  /** Storage path from `uploadCargoPhoto`, or null if no photo was attached. */
  cargoPhotoUrl?: string | null;
  /** One of LOADING_ASSISTANT_COUNTS, or null if no assistant was requested. */
  loadingAssistants?: string | null;
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
    vehicle_size: fields.vehicleSize,
    vehicle_category: fields.vehicleCategory,
    cargo_photo_url: fields.cargoPhotoUrl ?? null,
    loading_assistants: fields.loadingAssistants ?? null,
  });
  if (error) {
    console.error("booking failed", error);
    return { ok: false, message: "That didn't go through. Please try again." };
  }

  return { ok: true, data: undefined };
}

/**
 * Uploads a cargo photo to the private `cargo-photos` bucket, under a path
 * prefixed with the signed-in customer's own id — same policy shape as
 * `uploadDriverDocument` in `lib/auth.ts`. Returns the storage path to save
 * against the booking, not a public URL (the bucket isn't public).
 */
export async function uploadCargoPhoto(file: File): Promise<AuthResult<string>> {
  if (!authEnabled) return { ok: false, message: NOT_CONFIGURED };
  const supabase = getClient();
  if (!supabase) return { ok: false, message: NOT_CONFIGURED };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Please sign in again." };

  const path = `${user.id}/${Date.now()}-${file.name}`;
  const { error } = await supabase.storage.from("cargo-photos").upload(path, file, {
    upsert: false,
  });
  if (error) {
    console.error("cargo photo upload failed", error);
    return { ok: false, message: "That photo didn't upload. You can still submit without it." };
  }

  return { ok: true, data: path };
}

export type CargoAnalysis = { category: string | null; size: string | null };

/**
 * Sends a cargo photo to the `analyze-cargo` Supabase Edge Function, which
 * holds the Anthropic API key server-side and returns a suggested cargo
 * category and truck size — see supabase/functions/analyze-cargo/index.ts
 * for why this can't happen directly from the browser the way Mapbox's
 * calls do.
 */
export async function analyzeCargoPhoto(file: File): Promise<AuthResult<CargoAnalysis>> {
  if (!authEnabled) return { ok: false, message: NOT_CONFIGURED };
  const supabase = getClient();
  if (!supabase) return { ok: false, message: NOT_CONFIGURED };

  let base64: string;
  try {
    base64 = await fileToBase64(file);
  } catch (error) {
    console.error("cargo photo read failed", error);
    return { ok: false, message: "Couldn't read that photo. Please choose a size manually." };
  }

  const { data, error } = await supabase.functions.invoke("analyze-cargo", {
    body: { image: base64, mimeType: file.type },
  });
  if (error) {
    console.error("cargo analysis failed", error);
    return { ok: false, message: "SmartLoad couldn't look at that photo. Please choose a size manually." };
  }

  return { ok: true, data: data as CargoAnalysis };
}

/** Strips the `data:image/...;base64,` prefix FileReader adds — the edge function wants raw base64. */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const commaIndex = result.indexOf(",");
      resolve(commaIndex === -1 ? result : result.slice(commaIndex + 1));
    };
    reader.onerror = () => reject(reader.error ?? new Error("FileReader failed"));
    reader.readAsDataURL(file);
  });
}

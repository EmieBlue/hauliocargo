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
  /** Exact map points the customer picked, as [lng, lat], or null if they only typed. */
  pickupCenter?: [number, number] | null;
  dropoffCenter?: [number, number] | null;
  /** Trip distance and the total the customer saw before submitting. */
  distanceKm?: number | null;
  estimatedPrice?: number | null;
  /** Optional cargo size the customer entered — affects price, not routing. */
  cargoWeightKg?: number | null;
  cargoVolumeM3?: number | null;
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
): Promise<AuthResult<string>> {
  if (!authEnabled) return { ok: false, message: NOT_CONFIGURED };
  const supabase = getClient();
  if (!supabase) return { ok: false, message: NOT_CONFIGURED };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Please sign in again." };

  const { data, error } = await supabase
    .from("bookings")
    .insert({
      customer_id: user.id,
      booking_type: type,
      pickup_location: fields.pickupLocation.trim(),
      dropoff_location: fields.dropoffLocation.trim(),
      pickup_lng: fields.pickupCenter?.[0] ?? null,
      pickup_lat: fields.pickupCenter?.[1] ?? null,
      dropoff_lng: fields.dropoffCenter?.[0] ?? null,
      dropoff_lat: fields.dropoffCenter?.[1] ?? null,
      scheduled_for: fields.scheduledFor,
      cargo_description: fields.cargoDescription.trim(),
      vehicle_size: fields.vehicleSize,
      vehicle_category: fields.vehicleCategory,
      cargo_photo_url: fields.cargoPhotoUrl ?? null,
      loading_assistants: fields.loadingAssistants ?? null,
      distance_km: fields.distanceKm ?? null,
      estimated_price: fields.estimatedPrice ?? null,
      cargo_weight_kg: fields.cargoWeightKg ?? null,
      cargo_volume_m3: fields.cargoVolumeM3 ?? null,
    })
    .select("id")
    .single();
  if (error) {
    console.error("booking failed", error);
    return { ok: false, message: "That didn't go through. Please try again." };
  }

  return { ok: true, data: data.id };
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

// ---------------------------------------------------------------------------
// Driver jobs
// ---------------------------------------------------------------------------

export type BookingStatus = "pending" | "confirmed" | "in_progress" | "completed" | "cancelled";

export type JobRow = {
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
  distance_km: number | null;
  estimated_price: number | null;
  cargo_weight_kg: number | null;
  cargo_volume_m3: number | null;
  status: BookingStatus;
  driver_id: string | null;
  customer_id: string;
};

// Same field set as the customer side's own BOOKING_COLUMNS
// (app/dashboard/bookings/page.tsx) — a job is the same `bookings` row the
// customer sees, just through a driver's RLS instead of a customer's.
const JOB_COLUMNS =
  "id, pickup_location, dropoff_location, pickup_lat, pickup_lng, dropoff_lat, dropoff_lng, scheduled_for, cargo_description, vehicle_category, vehicle_size, loading_assistants, cargo_photo_url, distance_km, estimated_price, cargo_weight_kg, cargo_volume_m3, status, driver_id, customer_id";

/**
 * Open jobs any verified driver can claim. RLS already scopes this to
 * pending, unclaimed bookings for a verified driver (see migration 015) —
 * the `.eq`/`.is` here are belt-and-suspenders, not what's actually doing
 * the restricting.
 */
export async function fetchAvailableJobs(): Promise<AuthResult<JobRow[]>> {
  if (!authEnabled) return { ok: false, message: NOT_CONFIGURED };
  const supabase = getClient();
  if (!supabase) return { ok: false, message: NOT_CONFIGURED };

  const { data, error } = await supabase
    .from("bookings")
    .select(JOB_COLUMNS)
    .is("driver_id", null)
    .eq("status", "pending")
    .order("created_at", { ascending: false });
  if (error) {
    console.error("fetch available jobs failed", error);
    return { ok: false, message: "Couldn't load available jobs. Please try again." };
  }
  return { ok: true, data: data as JobRow[] };
}

/** The signed-in driver's own accepted/in-progress/completed jobs. */
export async function fetchMyJobs(): Promise<AuthResult<JobRow[]>> {
  if (!authEnabled) return { ok: false, message: NOT_CONFIGURED };
  const supabase = getClient();
  if (!supabase) return { ok: false, message: NOT_CONFIGURED };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Please sign in again." };

  const { data, error } = await supabase
    .from("bookings")
    .select(JOB_COLUMNS)
    .eq("driver_id", user.id)
    .order("created_at", { ascending: false });
  if (error) {
    console.error("fetch my jobs failed", error);
    return { ok: false, message: "Couldn't load your jobs. Please try again." };
  }
  return { ok: true, data: data as JobRow[] };
}

/**
 * One job's full row, for the detail view — the same RLS as the two list
 * fetches above (migration 015): a verified driver can load an open
 * pending job or one that's already theirs, nothing else.
 */
export async function fetchJob(bookingId: string): Promise<AuthResult<JobRow | null>> {
  if (!authEnabled) return { ok: false, message: NOT_CONFIGURED };
  const supabase = getClient();
  if (!supabase) return { ok: false, message: NOT_CONFIGURED };

  const { data, error } = await supabase.from("bookings").select(JOB_COLUMNS).eq("id", bookingId).maybeSingle();
  if (error) {
    console.error("fetch job failed", error);
    return { ok: false, message: "Couldn't load that job. Please try again." };
  }
  return { ok: true, data: (data as JobRow | null) ?? null };
}

/**
 * Claims an open job — a conditional update (only if still pending and
 * unclaimed) so two drivers racing for the same job can't both win: the
 * first request to land satisfies the `.eq`/`.is` filters and succeeds,
 * the second finds zero matching rows and comes back empty rather than
 * overwriting the first driver's claim.
 */
export async function acceptJob(bookingId: string): Promise<AuthResult> {
  if (!authEnabled) return { ok: false, message: NOT_CONFIGURED };
  const supabase = getClient();
  if (!supabase) return { ok: false, message: NOT_CONFIGURED };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Please sign in again." };

  const { data, error } = await supabase
    .from("bookings")
    .update({ driver_id: user.id, status: "confirmed" })
    .eq("id", bookingId)
    .eq("status", "pending")
    .is("driver_id", null)
    .select("id")
    .maybeSingle();
  if (error) {
    console.error("accept job failed", error);
    return { ok: false, message: "That didn't go through. Please try again." };
  }
  if (!data) {
    return { ok: false, message: "This job was just taken by another driver." };
  }
  return { ok: true, data: undefined };
}

const NEXT_STATUS: Partial<Record<BookingStatus, BookingStatus>> = {
  confirmed: "in_progress",
  in_progress: "completed",
};

/** Moves the driver's own job one step forward: confirmed → in_progress → completed. */
export async function advanceJob(bookingId: string, currentStatus: BookingStatus): Promise<AuthResult> {
  if (!authEnabled) return { ok: false, message: NOT_CONFIGURED };
  const supabase = getClient();
  if (!supabase) return { ok: false, message: NOT_CONFIGURED };

  const next = NEXT_STATUS[currentStatus];
  if (!next) return { ok: false, message: "This job can't move forward from here." };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Please sign in again." };

  const { error } = await supabase
    .from("bookings")
    .update({ status: next })
    .eq("id", bookingId)
    .eq("driver_id", user.id);
  if (error) {
    console.error("advance job failed", error);
    return { ok: false, message: "That didn't go through. Please try again." };
  }
  return { ok: true, data: undefined };
}

/**
 * Records why the signed-in driver declined an open job — never touches
 * the booking itself, so it stays open for every other driver. See
 * supabase/016_job_declines.sql.
 */
export async function declineJob(bookingId: string, reasons: string[]): Promise<AuthResult> {
  if (!authEnabled) return { ok: false, message: NOT_CONFIGURED };
  const supabase = getClient();
  if (!supabase) return { ok: false, message: NOT_CONFIGURED };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Please sign in again." };

  const { error } = await supabase
    .from("job_declines")
    .insert({ booking_id: bookingId, driver_id: user.id, reasons });
  if (error) {
    console.error("decline job failed", error);
    return { ok: false, message: "That didn't go through. Please try again." };
  }
  return { ok: true, data: undefined };
}

/** The signed-in driver's own declined booking ids — used to filter them out of the available list. */
export async function fetchDeclinedJobIds(): Promise<AuthResult<string[]>> {
  if (!authEnabled) return { ok: false, message: NOT_CONFIGURED };
  const supabase = getClient();
  if (!supabase) return { ok: false, message: NOT_CONFIGURED };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Please sign in again." };

  const { data, error } = await supabase.from("job_declines").select("booking_id").eq("driver_id", user.id);
  if (error) {
    console.error("fetch declined jobs failed", error);
    return { ok: false, message: "Couldn't load your declined jobs. Please try again." };
  }
  return { ok: true, data: (data ?? []).map((row) => row.booking_id as string) };
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

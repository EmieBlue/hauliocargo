"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { AuthResult, DriverStatus } from "./auth";
import { JOB_COLUMNS, type BookingStatus, type JobRow } from "./bookings";
import { authEnabled, getClient } from "./supabase";

/**
 * Admin-only reads of driver applications (migration 023's admin-scoped
 * policies) and the one write path that exists for them — the
 * `admin-driver-decision` Edge Function, since `driver_applications.status`
 * can only ever change via the service_role key (migration 019's trigger),
 * never a direct call from here.
 *
 * Everything below (stats, customers, admin-wide bookings) is view-only —
 * all reads, no writes, gated entirely by the `public.is_admin()`-backed RLS
 * policies on `profiles` (023/024) and `bookings` (025). No new Edge
 * Function needed since nothing here mutates anything.
 */

const NOT_CONFIGURED = "Admin tools are not available yet. Please check back shortly.";

export type DriverApplicationRow = {
  id: string;
  profile_id: string;
  date_of_birth: string | null;
  license_number: string;
  vehicle_type: string;
  vehicle_make: string;
  vehicle_model: string;
  vehicle_year: number;
  vehicle_registration_no: string;
  vehicle_capacity: string;
  vehicle_color: string | null;
  status: DriverStatus;
  rejection_reasons: string[] | null;
  submitted_at: string;
  profiles: { first_name: string; last_name: string; phone: string; avatar_path: string | null } | null;
};

const APPLICATION_COLUMNS =
  "id, profile_id, date_of_birth, license_number, vehicle_type, vehicle_make, vehicle_model, vehicle_year, vehicle_registration_no, vehicle_capacity, vehicle_color, status, rejection_reasons, submitted_at, profiles(first_name, last_name, phone, avatar_path)";

export async function fetchDriverApplications(status?: DriverStatus): Promise<AuthResult<DriverApplicationRow[]>> {
  if (!authEnabled) return { ok: false, message: NOT_CONFIGURED };
  const supabase = getClient();
  if (!supabase) return { ok: false, message: NOT_CONFIGURED };

  let query = supabase
    .from("driver_applications")
    .select(APPLICATION_COLUMNS)
    .order("submitted_at", { ascending: false });
  if (status) query = query.eq("status", status);

  const { data, error } = await query;
  if (error) {
    console.error("fetch driver applications failed", error);
    return { ok: false, message: "Couldn't load driver applications." };
  }
  return { ok: true, data: (data ?? []) as unknown as DriverApplicationRow[] };
}

export async function fetchDriverApplication(id: string): Promise<AuthResult<DriverApplicationRow | null>> {
  if (!authEnabled) return { ok: false, message: NOT_CONFIGURED };
  const supabase = getClient();
  if (!supabase) return { ok: false, message: NOT_CONFIGURED };

  const { data, error } = await supabase
    .from("driver_applications")
    .select(APPLICATION_COLUMNS)
    .eq("id", id)
    .maybeSingle();
  if (error) {
    console.error("fetch driver application failed", error);
    return { ok: false, message: "Couldn't load that application." };
  }
  return { ok: true, data: (data ?? null) as unknown as DriverApplicationRow | null };
}

export type DriverDecision = "verified" | "rejected";

export async function decideDriverApplication(
  applicationId: string,
  decision: DriverDecision,
  reasons?: string[],
): Promise<AuthResult> {
  if (!authEnabled) return { ok: false, message: NOT_CONFIGURED };
  const supabase = getClient();
  if (!supabase) return { ok: false, message: NOT_CONFIGURED };

  const { error } = await supabase.functions.invoke("admin-driver-decision", {
    body: { applicationId, decision, reasons },
  });
  if (error) {
    console.error("decide driver application failed", error);
    return { ok: false, message: "Couldn't save that decision. Please try again." };
  }

  return { ok: true, data: undefined };
}

// ---------------------------------------------------------------------------
// Overview stats
// ---------------------------------------------------------------------------

export type AdminStats = {
  customerCount: number;
  verifiedDriverCount: number;
  bookingCount: number;
  pendingApplicationCount: number;
};

export async function fetchAdminStats(): Promise<AuthResult<AdminStats>> {
  if (!authEnabled) return { ok: false, message: NOT_CONFIGURED };
  const supabase = getClient();
  if (!supabase) return { ok: false, message: NOT_CONFIGURED };

  const [customers, verifiedDrivers, bookings, pendingApplications] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "customer"),
    supabase.from("driver_applications").select("id", { count: "exact", head: true }).eq("status", "verified"),
    supabase.from("bookings").select("id", { count: "exact", head: true }),
    supabase.from("driver_applications").select("id", { count: "exact", head: true }).eq("status", "pending"),
  ]);

  const firstError = customers.error ?? verifiedDrivers.error ?? bookings.error ?? pendingApplications.error;
  if (firstError) {
    console.error("fetch admin stats failed", firstError);
    return { ok: false, message: "Couldn't load dashboard stats." };
  }

  return {
    ok: true,
    data: {
      customerCount: customers.count ?? 0,
      verifiedDriverCount: verifiedDrivers.count ?? 0,
      bookingCount: bookings.count ?? 0,
      pendingApplicationCount: pendingApplications.count ?? 0,
    },
  };
}

// ---------------------------------------------------------------------------
// Customers
// ---------------------------------------------------------------------------

export type CustomerRow = {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  city: string | null;
  area: string | null;
  created_at: string;
};

const CUSTOMER_COLUMNS = "id, first_name, last_name, phone, city, area, created_at";

export async function fetchCustomers(): Promise<AuthResult<CustomerRow[]>> {
  if (!authEnabled) return { ok: false, message: NOT_CONFIGURED };
  const supabase = getClient();
  if (!supabase) return { ok: false, message: NOT_CONFIGURED };

  const { data, error } = await supabase
    .from("profiles")
    .select(CUSTOMER_COLUMNS)
    .eq("role", "customer")
    .order("created_at", { ascending: false });
  if (error) {
    console.error("fetch customers failed", error);
    return { ok: false, message: "Couldn't load customers." };
  }
  return { ok: true, data: (data ?? []) as CustomerRow[] };
}

export type CustomerBookingSummary = {
  id: string;
  booking_type: string;
  pickup_location: string;
  dropoff_location: string;
  status: BookingStatus;
  estimated_price: number | null;
  created_at: string;
};

export type CustomerDetail = { profile: CustomerRow; bookings: CustomerBookingSummary[] };

export async function fetchCustomer(id: string): Promise<AuthResult<CustomerDetail | null>> {
  if (!authEnabled) return { ok: false, message: NOT_CONFIGURED };
  const supabase = getClient();
  if (!supabase) return { ok: false, message: NOT_CONFIGURED };

  const [profileResult, bookingsResult] = await Promise.all([
    supabase.from("profiles").select(CUSTOMER_COLUMNS).eq("id", id).maybeSingle(),
    supabase
      .from("bookings")
      .select("id, booking_type, pickup_location, dropoff_location, status, estimated_price, created_at")
      .eq("customer_id", id)
      .order("created_at", { ascending: false }),
  ]);

  if (profileResult.error || bookingsResult.error) {
    console.error("fetch customer failed", profileResult.error ?? bookingsResult.error);
    return { ok: false, message: "Couldn't load that customer." };
  }
  if (!profileResult.data) return { ok: true, data: null };

  return {
    ok: true,
    data: {
      profile: profileResult.data as CustomerRow,
      bookings: (bookingsResult.data ?? []) as CustomerBookingSummary[],
    },
  };
}

// ---------------------------------------------------------------------------
// Bookings (admin-wide)
// ---------------------------------------------------------------------------

type AdminBookingBase = JobRow & { created_at: string; booking_type: string };

export type AdminBookingRow = AdminBookingBase & {
  customer: { first_name: string; last_name: string; phone: string; avatar_path: string | null } | null;
  driver: { first_name: string; last_name: string; phone: string; avatar_path: string | null } | null;
};

const ADMIN_BOOKING_COLUMNS = `${JOB_COLUMNS}, created_at, booking_type`;

/**
 * `bookings` has two FKs into `profiles` (customer_id, driver_id), which
 * makes PostgREST's embedded-relation shorthand ambiguous without hard-coding
 * its auto-generated constraint names — a second plain query + client-side
 * zip avoids depending on that naming at all.
 */
async function withNames(supabase: SupabaseClient, rows: AdminBookingBase[]): Promise<AdminBookingRow[]> {
  if (rows.length === 0) return [];

  const ids = [...new Set(rows.flatMap((r) => [r.customer_id, r.driver_id]).filter((v): v is string => Boolean(v)))];
  const { data: profiles } = await supabase.from("profiles").select("id, first_name, last_name, phone, avatar_path").in("id", ids);
  const byId = new Map((profiles ?? []).map((p) => [p.id, p]));

  return rows.map((r) => ({
    ...r,
    customer: byId.get(r.customer_id) ?? null,
    driver: r.driver_id ? (byId.get(r.driver_id) ?? null) : null,
  }));
}

export async function fetchAdminBookings(status?: BookingStatus): Promise<AuthResult<AdminBookingRow[]>> {
  if (!authEnabled) return { ok: false, message: NOT_CONFIGURED };
  const supabase = getClient();
  if (!supabase) return { ok: false, message: NOT_CONFIGURED };

  let query = supabase.from("bookings").select(ADMIN_BOOKING_COLUMNS).order("created_at", { ascending: false });
  if (status) query = query.eq("status", status);

  const { data, error } = await query;
  if (error) {
    console.error("fetch admin bookings failed", error);
    return { ok: false, message: "Couldn't load bookings." };
  }
  const rows = await withNames(supabase, (data ?? []) as unknown as AdminBookingBase[]);
  return { ok: true, data: rows };
}

export async function fetchAdminBooking(id: string): Promise<AuthResult<AdminBookingRow | null>> {
  if (!authEnabled) return { ok: false, message: NOT_CONFIGURED };
  const supabase = getClient();
  if (!supabase) return { ok: false, message: NOT_CONFIGURED };

  const { data, error } = await supabase.from("bookings").select(ADMIN_BOOKING_COLUMNS).eq("id", id).maybeSingle();
  if (error) {
    console.error("fetch admin booking failed", error);
    return { ok: false, message: "Couldn't load that booking." };
  }
  if (!data) return { ok: true, data: null };

  const [row] = await withNames(supabase, [data as unknown as AdminBookingBase]);
  return { ok: true, data: row };
}

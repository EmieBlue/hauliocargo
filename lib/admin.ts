"use client";

import type { AuthResult, DriverStatus } from "./auth";
import { authEnabled, getClient } from "./supabase";

/**
 * Admin-only reads of driver applications (migration 023's admin-scoped
 * policies) and the one write path that exists for them — the
 * `admin-driver-decision` Edge Function, since `driver_applications.status`
 * can only ever change via the service_role key (migration 019's trigger),
 * never a direct call from here.
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
  profiles: { first_name: string; last_name: string; phone: string } | null;
};

const APPLICATION_COLUMNS =
  "id, profile_id, date_of_birth, license_number, vehicle_type, vehicle_make, vehicle_model, vehicle_year, vehicle_registration_no, vehicle_capacity, vehicle_color, status, rejection_reasons, submitted_at, profiles(first_name, last_name, phone)";

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

"use client";

import type { AuthError } from "@supabase/supabase-js";
import { authEnabled, getClient } from "./supabase";

/**
 * All of sign-in, registration, OTP and password reset, calling Supabase
 * directly from the browser — Supabase's hosted service is the real backend
 * (password hashing, session tokens, OTP generation/expiry, rate limiting),
 * not this file. This file only shapes the calls and translates errors.
 *
 * Sign-in is email-only for real, despite the "Email or Phone Number" label
 * the brief asks for. Registration collects phone as contact information, but
 * the Supabase identity is created against email — there is no configured
 * path (no SMS provider, no phone→email lookup table) to authenticate by
 * phone yet. A phone-shaped sign-in attempt gets a clear, honest message
 * rather than silently failing against a wrong endpoint.
 */

export type Role = "customer" | "driver" | "admin";
export type DriverStatus = "pending" | "verified" | "rejected";

export type CustomerFields = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  city: string;
  area: string;
};

export type DriverFields = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  dateOfBirth?: string;
  licenseNumber: string;
  vehicleType: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleYear: string;
  vehicleRegistrationNo: string;
  vehicleCapacity: string;
};

export type AuthResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; message: string };

const NOT_CONFIGURED = "Sign-in is not available yet. Please check back shortly.";

/**
 * Supabase's own error strings, translated to the exact friendly copy the
 * brief specifies. Deliberately over-matches ("includes") rather than exact
 * string comparison — Supabase's wording has shifted slightly across
 * supabase-js versions before, and a near-miss should still land the right
 * message rather than fall through to the generic one.
 */
function friendlyAuthError(error: AuthError | Error | unknown): string {
  const raw = error instanceof Error ? error.message : String(error);
  const msg = raw.toLowerCase();

  if (msg.includes("invalid login credentials")) {
    return "The email/phone number or password is incorrect.";
  }
  if (msg.includes("already registered") || msg.includes("already exists")) {
    return "An account with this email or phone number already exists.";
  }
  if (msg.includes("expired")) {
    return "This verification code has expired. Please request a new one.";
  }
  if (
    msg.includes("token") &&
    (msg.includes("invalid") || msg.includes("otp"))
  ) {
    return "That verification code is incorrect. Please try again.";
  }
  if (msg.includes("rate limit") || msg.includes("too many")) {
    return "Too many attempts. Please wait a moment before trying again.";
  }
  if (
    msg.includes("failed to fetch") ||
    msg.includes("network") ||
    msg.includes("load failed")
  ) {
    return "We couldn't connect right now. Please check your connection and try again.";
  }
  if (msg.includes("password") && msg.includes("least")) {
    return "Password must meet all the requirements listed below.";
  }

  // Never surface a raw Supabase/Postgres message — log it for diagnosis,
  // show something a visitor can actually act on.
  console.error("auth error", raw);
  return "Something went wrong on our end. Please try again.";
}

function client() {
  const c = getClient();
  if (!c) throw new Error(NOT_CONFIGURED);
  return c;
}

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

export async function signUpCustomer(fields: CustomerFields): Promise<AuthResult> {
  if (!authEnabled) return { ok: false, message: NOT_CONFIGURED };
  const supabase = client();

  const { data, error } = await supabase.auth.signUp({
    email: fields.email.trim().toLowerCase(),
    password: fields.password,
  });
  if (error) return { ok: false, message: friendlyAuthError(error) };
  if (!data.user) return { ok: false, message: friendlyAuthError(new Error("no user")) };

  const { error: profileError } = await supabase.from("profiles").insert({
    id: data.user.id,
    role: "customer",
    first_name: fields.firstName.trim(),
    last_name: fields.lastName.trim(),
    phone: fields.phone.trim(),
    city: fields.city.trim(),
    area: fields.area.trim(),
  });
  if (profileError) return { ok: false, message: friendlyAuthError(profileError) };

  return { ok: true, data: undefined };
}

export async function signUpDriver(
  fields: DriverFields,
): Promise<AuthResult<{ userId: string }>> {
  if (!authEnabled) return { ok: false, message: NOT_CONFIGURED };
  const supabase = client();

  const { data, error } = await supabase.auth.signUp({
    email: fields.email.trim().toLowerCase(),
    password: fields.password,
  });
  if (error) return { ok: false, message: friendlyAuthError(error) };
  if (!data.user) return { ok: false, message: friendlyAuthError(new Error("no user")) };

  const { error: profileError } = await supabase.from("profiles").insert({
    id: data.user.id,
    role: "driver",
    first_name: fields.firstName.trim(),
    last_name: fields.lastName.trim(),
    phone: fields.phone.trim(),
  });
  if (profileError) return { ok: false, message: friendlyAuthError(profileError) };

  const { error: applicationError } = await supabase.from("driver_applications").insert({
    profile_id: data.user.id,
    date_of_birth: fields.dateOfBirth || null,
    license_number: fields.licenseNumber.trim(),
    vehicle_type: fields.vehicleType.trim(),
    vehicle_make: fields.vehicleMake.trim(),
    vehicle_model: fields.vehicleModel.trim(),
    vehicle_year: Number(fields.vehicleYear),
    vehicle_registration_no: fields.vehicleRegistrationNo.trim(),
    vehicle_capacity: fields.vehicleCapacity.trim(),
  });
  if (applicationError) return { ok: false, message: friendlyAuthError(applicationError) };

  return { ok: true, data: { userId: data.user.id } };
}

/**
 * Uploads one driver document/photo to the private `driver-documents` bucket,
 * under a path prefixed with the signed-in user's own id — the storage
 * policy only allows a user to write inside their own prefix.
 */
export async function uploadDriverDocument(
  userId: string,
  kind: string,
  file: File,
): Promise<AuthResult<string>> {
  if (!authEnabled) return { ok: false, message: NOT_CONFIGURED };
  const supabase = client();

  const path = `${userId}/${kind}-${Date.now()}-${file.name}`;
  const { error } = await supabase.storage.from("driver-documents").upload(path, file, {
    upsert: false,
  });
  if (error) return { ok: false, message: friendlyAuthError(error) };

  return { ok: true, data: path };
}

// ---------------------------------------------------------------------------
// Sign in / out
// ---------------------------------------------------------------------------

export async function signIn(
  emailOrPhone: string,
  password: string,
): Promise<AuthResult> {
  if (!authEnabled) return { ok: false, message: NOT_CONFIGURED };

  const value = emailOrPhone.trim();
  const looksLikeEmail = value.includes("@");
  if (!looksLikeEmail) {
    return {
      ok: false,
      message: "Please sign in with your email address for now.",
    };
  }

  const supabase = client();
  const { error } = await supabase.auth.signInWithPassword({
    email: value.toLowerCase(),
    password,
  });
  if (error) return { ok: false, message: friendlyAuthError(error) };

  return { ok: true, data: undefined };
}

export async function signOut(): Promise<void> {
  const supabase = getClient();
  if (!supabase) return;
  await supabase.auth.signOut();
}

// ---------------------------------------------------------------------------
// OTP + password reset
// ---------------------------------------------------------------------------

/**
 * Fires the recovery email. Supabase's dashboard must have the recovery
 * email template set to "OTP" rather than the default magic-link, or this
 * sends a link the reset screen's 6-digit input can't consume.
 */
export async function requestPasswordReset(email: string): Promise<AuthResult> {
  if (!authEnabled) return { ok: false, message: NOT_CONFIGURED };
  const supabase = client();

  const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase());
  if (error) return { ok: false, message: friendlyAuthError(error) };

  return { ok: true, data: undefined };
}

export type OtpPurpose = "signup" | "recovery";

export async function verifyOtp(
  email: string,
  token: string,
  purpose: OtpPurpose,
): Promise<AuthResult> {
  if (!authEnabled) return { ok: false, message: NOT_CONFIGURED };
  const supabase = client();

  const { error } = await supabase.auth.verifyOtp({
    email: email.trim().toLowerCase(),
    token,
    type: purpose,
  });
  if (error) return { ok: false, message: friendlyAuthError(error) };

  return { ok: true, data: undefined };
}

export async function resendOtp(email: string, purpose: OtpPurpose): Promise<AuthResult> {
  if (!authEnabled) return { ok: false, message: NOT_CONFIGURED };
  const supabase = client();

  const { error } =
    purpose === "signup"
      ? await supabase.auth.resend({ type: "signup", email: email.trim().toLowerCase() })
      : await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase());
  if (error) return { ok: false, message: friendlyAuthError(error) };

  return { ok: true, data: undefined };
}

/** Called once an OTP-verified recovery session exists. */
export async function updatePassword(newPassword: string): Promise<AuthResult> {
  if (!authEnabled) return { ok: false, message: NOT_CONFIGURED };
  const supabase = client();

  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) return { ok: false, message: friendlyAuthError(error) };

  return { ok: true, data: undefined };
}

// ---------------------------------------------------------------------------
// Session + role-based redirect
// ---------------------------------------------------------------------------

export type SessionProfile = {
  role: Role;
  driverStatus: DriverStatus | null;
};

/**
 * Reads the signed-in user's role (and, for drivers, their application
 * status) straight from the tables RLS already scopes to `auth.uid()`.
 */
export async function getSessionProfile(): Promise<SessionProfile | null> {
  const supabase = getClient();
  if (!supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (!profile) return null;

  let driverStatus: DriverStatus | null = null;
  if (profile.role === "driver") {
    const { data: application } = await supabase
      .from("driver_applications")
      .select("status")
      .eq("profile_id", user.id)
      .single();
    driverStatus = (application?.status as DriverStatus) ?? "pending";
  }

  return { role: profile.role as Role, driverStatus };
}

/**
 * Where a signed-in visitor belongs. Client-side only this round (see
 * next.config.ts / the deploy-approach note in the plan) — real for
 * placeholder destinations with no sensitive data behind them, not a
 * substitute for server-enforced route protection once real dashboards
 * exist.
 */
export function redirectPathFor(profile: SessionProfile): string {
  if (profile.role === "admin") return "/dashboard/admin";
  if (profile.role === "customer") return "/dashboard/customer";

  // driver
  if (profile.driverStatus === "verified") return "/dashboard/driver";
  return "/dashboard/driver"; // the driver dashboard itself renders the pending/rejected state
}

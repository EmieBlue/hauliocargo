"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Shared Supabase browser client — the early-access list and real
 * authentication both go through this one instance.
 *
 * The anon key is meant to be public — it identifies the project, it does not
 * grant anything. What actually protects each table is its own row-level
 * security policy (insert-only for `signups`; own-row-only for `profiles` and
 * `driver_applications` — see `lib/auth.ts`).
 *
 * Both env values are optional on purpose. The site deploys and works before
 * the Supabase project exists; auth-dependent UI presents itself as
 * not-yet-open rather than failing the build or throwing at runtime.
 *
 * `persistSession: true` (Supabase's own default) is required here — a
 * logged-in visitor needs their session to survive a reload. The old
 * `persistSession: false` only ever existed because nothing used sessions
 * yet.
 */

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** False until both env vars are set, in `.env.local` and in Netlify. */
export const signupsEnabled = Boolean(url && anonKey);
/** Same underlying check, named for where auth code reads it. */
export const authEnabled = signupsEnabled;

let client: SupabaseClient | null = null;

/** Exported: `lib/auth.ts` uses the same instance rather than opening a second. */
export function getClient(): SupabaseClient | null {
  if (!url || !anonKey) return null;
  client ??= createClient(url, anonKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  });
  return client;
}

export type SignupIntent = "contact" | "register";

export type SignupResult =
  | { ok: true }
  | { ok: false; message: string };

/**
 * Records an email against an intent. Errors are deliberately vague to the
 * visitor — a database message is no use to them and may say more about the
 * schema than it should.
 */
export async function submitSignup(
  email: string,
  intent: SignupIntent,
): Promise<SignupResult> {
  const supabase = getClient();
  if (!supabase) {
    return { ok: false, message: "Sign-ups are not open yet." };
  }

  const { error } = await supabase
    .from("signups")
    .insert({ email: email.trim().toLowerCase(), intent });

  if (error) {
    console.error("signup failed", error);
    return {
      ok: false,
      message: "That did not go through. Please try again in a moment.",
    };
  }

  return { ok: true };
}

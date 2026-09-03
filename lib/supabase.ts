"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Supabase browser client for the early-access list.
 *
 * The anon key is meant to be public — it identifies the project, it does not
 * grant anything. What actually protects the table is row-level security: the
 * `signups` policy allows INSERT and nothing else, so a browser can add a row
 * and can never read one back.
 *
 * Both values are optional on purpose. The site deploys and works before the
 * Supabase project exists; the form simply presents itself as not-yet-open
 * rather than failing the build or throwing at runtime.
 */

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** False until both env vars are set, in `.env.local` and in Netlify. */
export const signupsEnabled = Boolean(url && anonKey);

let client: SupabaseClient | null = null;

function getClient(): SupabaseClient | null {
  if (!url || !anonKey) return null;
  client ??= createClient(url, anonKey, {
    auth: { persistSession: false },
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

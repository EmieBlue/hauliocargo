// Approves or rejects a driver application. This is the only place that
// can ever change driver_applications.status outside the database itself --
// migration 019's lock_driver_application_status trigger silently reverts
// any status change that doesn't come from the service_role key, exactly
// because that key must never live in browser code. So this function, not
// a direct Supabase call, is how the admin page's Approve/Reject buttons
// work: it re-derives who's calling from their own JWT (never trusts a
// client-supplied id), checks THAT user's profiles.role is 'admin' using
// the service-role client, and only then performs the privileged update.
//
// Deploy: Supabase dashboard → Edge Functions → deploy this file as
// `admin-driver-decision`. No secret to set — SUPABASE_URL, SUPABASE_ANON_KEY
// and SUPABASE_SERVICE_ROLE_KEY are reserved names Supabase already injects
// into every Edge Function automatically.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    console.error("Supabase env vars are not set");
    return jsonResponse({ error: "This isn't configured yet." }, 500);
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return jsonResponse({ error: "Not signed in." }, 401);
  }

  // Scoped to the caller's own JWT — this is what makes auth.getUser() below
  // trustworthy, rather than taking a user id straight from the request body.
  const callerClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const {
    data: { user },
    error: userError,
  } = await callerClient.auth.getUser();
  if (userError || !user) {
    return jsonResponse({ error: "Not signed in." }, 401);
  }

  // Elevated client — only ever used after the admin check below passes.
  const adminClient = createClient(supabaseUrl, serviceRoleKey);

  const { data: callerProfile, error: profileError } = await adminClient
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profileError || callerProfile?.role !== "admin") {
    return jsonResponse({ error: "Admins only." }, 403);
  }

  let body: { applicationId?: string; decision?: string; reasons?: string[] };
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Expected a JSON body." }, 400);
  }

  const { applicationId, decision, reasons } = body;
  if (!applicationId || (decision !== "verified" && decision !== "rejected")) {
    return jsonResponse({ error: "Missing applicationId or an invalid decision." }, 400);
  }

  const { error: updateError } = await adminClient
    .from("driver_applications")
    .update({
      status: decision,
      rejection_reasons: decision === "rejected" && reasons && reasons.length > 0 ? reasons : null,
    })
    .eq("id", applicationId);

  if (updateError) {
    console.error("admin-driver-decision update failed", updateError);
    return jsonResponse({ error: "Couldn't save that decision." }, 500);
  }

  return jsonResponse({ ok: true });
});

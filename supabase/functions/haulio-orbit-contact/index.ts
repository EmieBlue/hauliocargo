// Sends a Haulio Orbit contact/partnership form submission by email. A
// separate site (haulio-orbit, its own repo/deploy) calls this across
// origins — it has no database of its own to write to, so an email is the
// entire feature. Uses Gmail SMTP with its own credential, not Supabase
// Auth's SMTP config: that one only powers Supabase's own signup/OTP
// emails and isn't reusable for an arbitrary application email like this.
//
// Deploy: Supabase dashboard → Edge Functions → deploy this file as
// `haulio-orbit-contact`. Needs two secrets set first: Project Settings →
// Edge Functions → Secrets → `GMAIL_SMTP_USER` (haulioorbits@gmail.com)
// and `GMAIL_SMTP_PASSWORD` (a Gmail App Password generated for this,
// never the account's real password).

import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ENQUIRY_TYPES = ["General", "Partnerships", "Press", "Careers", "Platform Support"] as const;
const RECIPIENT = "haulioorbits@gmail.com";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  const smtpUser = Deno.env.get("GMAIL_SMTP_USER");
  const smtpPassword = Deno.env.get("GMAIL_SMTP_PASSWORD");
  if (!smtpUser || !smtpPassword) {
    console.error("Gmail SMTP secrets are not set");
    return jsonResponse({ error: "This isn't configured yet." }, 500);
  }

  let body: {
    name?: string;
    email?: string;
    organization?: string;
    enquiryType?: string;
    message?: string;
    consent?: boolean;
    company?: string; // honeypot — real visitors never see or fill this field
  };
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Expected a JSON body." }, 400);
  }

  // Silently "succeed" for a filled honeypot — a bot fills every field, a
  // real visitor never sees this one, so a non-empty value reliably means
  // spam without ever showing the sender they were caught.
  if (body.company) {
    return jsonResponse({ ok: true });
  }

  const { name, email, organization, enquiryType, message, consent } = body;
  if (!name?.trim() || !email?.trim() || !message?.trim() || !consent) {
    return jsonResponse({ error: "Please fill in all required fields." }, 400);
  }
  if (!enquiryType || !ENQUIRY_TYPES.includes(enquiryType as (typeof ENQUIRY_TYPES)[number])) {
    return jsonResponse({ error: "Please choose a valid enquiry type." }, 400);
  }

  const client = new SMTPClient({
    connection: {
      hostname: "smtp.gmail.com",
      port: 465,
      tls: true,
      auth: { username: smtpUser, password: smtpPassword },
    },
  });

  try {
    await client.send({
      from: smtpUser,
      to: RECIPIENT,
      replyTo: email.trim(),
      subject: `[${enquiryType}] Haulio Orbit enquiry from ${name.trim()}`,
      html: `
        <p><strong>Enquiry type:</strong> ${escapeHtml(enquiryType)}</p>
        <p><strong>Name:</strong> ${escapeHtml(name.trim())}</p>
        <p><strong>Email:</strong> ${escapeHtml(email.trim())}</p>
        <p><strong>Organization:</strong> ${escapeHtml(organization?.trim() || "—")}</p>
        <p><strong>Message:</strong></p>
        <p>${escapeHtml(message.trim()).replace(/\n/g, "<br>")}</p>
      `,
    });
  } catch (error) {
    console.error("haulio-orbit-contact send failed", error);
    return jsonResponse({ error: "Couldn't send that right now. Please try again shortly." }, 502);
  } finally {
    await client.close();
  }

  return jsonResponse({ ok: true });
});

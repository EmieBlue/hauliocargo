// Haulio SmartLoad™ — looks at a cargo photo and suggests a truck size
// (Small/Middle/Big). This is the project's first server-side code of any
// kind: everything else (auth, bookings, storage) is called
// straight from the browser with Supabase's public anon key, which is safe
// because row-level security — not secrecy — is what protects it. An
// Anthropic API key is a different kind of credential: it's secret, with no
// domain-restriction option, so it can only live here, never in browser code
// (see the plan doc for the full reasoning).
//
// Deployed as a Supabase Edge Function (Deno runtime) rather than a Vercel
// serverless function, so it lives in the same dashboard as the rest of this
// project's backend. Called from the browser via `supabase.functions.invoke`,
// which already attaches the anon key — no extra auth wiring needed here,
// and Supabase verifies that JWT before this code ever runs.
//
// Deploy: Supabase dashboard → Edge Functions → deploy this file as
// `analyze-cargo`. Needs one secret set first: Project Settings → Edge
// Functions → Secrets → `ANTHROPIC_API_KEY`.

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Mirrors lib/site.ts's TRUCK_SIZES titles. Deno can't import straight from
// the Next app, so this list is kept here deliberately — if the sizes in
// lib/site.ts ever change, update this array to match.
const VEHICLE_SIZES = ["Small", "Middle", "Big"] as const;

const PROMPT = `You are helping size a delivery truck for a cargo photo. Look at how much is shown — a few boxes, a room's worth of furniture, a full household or bulky goods — and choose exactly one truck size that best fits it:

${VEHICLE_SIZES.map((s) => `- ${s}`).join("\n")}

Reply with only the size name, exactly as written above, and nothing else.`;

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

  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) {
    console.error("ANTHROPIC_API_KEY is not set");
    return jsonResponse({ error: "SmartLoad is not configured yet." }, 500);
  }

  let image: string | undefined;
  let mimeType: string | undefined;
  try {
    const body = await req.json();
    image = body.image;
    mimeType = body.mimeType;
  } catch {
    return jsonResponse({ error: "Expected a JSON body with image + mimeType." }, 400);
  }

  if (!image || !mimeType) {
    return jsonResponse({ error: "Missing image or mimeType." }, 400);
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 32,
        messages: [
          {
            role: "user",
            content: [
              { type: "image", source: { type: "base64", media_type: mimeType, data: image } },
              { type: "text", text: PROMPT },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const detail = await response.text();
      console.error("Anthropic API error", response.status, detail);
      return jsonResponse({ error: "SmartLoad couldn't look at that photo right now." }, 502);
    }

    const data = await response.json();
    const raw = (data?.content?.[0]?.text ?? "").trim();
    const size = VEHICLE_SIZES.find((s) => s.toLowerCase() === raw.toLowerCase()) ?? null;

    return jsonResponse({ size });
  } catch (error) {
    console.error("analyze-cargo failed", error);
    return jsonResponse({ error: "SmartLoad couldn't look at that photo right now." }, 500);
  }
});

// Truck-aware route distance for Move With You. Mapbox (still used for the
// map itself) has no truck-restriction routing, so the actual route/distance
// comes from OpenRouteService's `driving-hgv` profile instead — same reason
// this is a Supabase Edge Function as `analyze-cargo`: the ORS key is a
// secret credential and can't live in browser code.
//
// Always routes for the fleet's biggest truck (26ft, fully loaded) rather
// than per the customer's chosen size, so one route/distance is valid no
// matter which size they end up picking, and weight/volume (both optional
// on the booking form) never have to be known before a route can be drawn.
// See the plan doc for the full reasoning.
//
// Deploy: Supabase dashboard → Edge Functions → deploy this file as
// `calculate-route`. Needs one secret set first: Project Settings → Edge
// Functions → Secrets → `ORS_API_KEY` (free key from openrouteservice.org).

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Typical dimensions/weight for a fully loaded 26ft box truck — the
// project's biggest size — used as a fixed worst case for every request.
// Approximate; adjust if the real fleet differs. Mirrors the capacity
// figures in lib/site.ts's TRUCK_SPECS (Deno can't import that file
// directly, same reason analyze-cargo duplicates lib/site.ts's lists).
const RESTRICTIONS = { height: 3.6, width: 2.5, length: 9, weight: 7 };

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

type RouteResult = { coordinates: [number, number][]; distanceKm: number } | null;

async function fetchOrsRoute(
  apiKey: string,
  pickup: [number, number],
  dropoff: [number, number],
  withRestrictions: boolean,
): Promise<RouteResult> {
  const body: Record<string, unknown> = { coordinates: [pickup, dropoff] };
  if (withRestrictions) {
    body.options = { vehicle_type: "hgv", profile_params: { restrictions: RESTRICTIONS } };
  }

  const response = await fetch("https://api.openrouteservice.org/v2/directions/driving-hgv/geojson", {
    method: "POST",
    headers: { Authorization: apiKey, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) return null;

  const data = await response.json();
  const feature = data?.features?.[0];
  const coordinates = feature?.geometry?.coordinates;
  const distanceMeters = feature?.properties?.summary?.distance;
  if (!Array.isArray(coordinates) || typeof distanceMeters !== "number") return null;
  return { coordinates, distanceKm: distanceMeters / 1000 };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  const apiKey = Deno.env.get("ORS_API_KEY");
  if (!apiKey) {
    console.error("ORS_API_KEY is not set");
    return jsonResponse({ error: "Routing is not configured yet." }, 500);
  }

  let pickup: [number, number] | undefined;
  let dropoff: [number, number] | undefined;
  try {
    const parsedBody = await req.json();
    pickup = parsedBody.pickup;
    dropoff = parsedBody.dropoff;
  } catch {
    return jsonResponse({ error: "Expected a JSON body with pickup + dropoff." }, 400);
  }

  if (!Array.isArray(pickup) || !Array.isArray(dropoff)) {
    return jsonResponse({ error: "Missing pickup or dropoff." }, 400);
  }

  try {
    // Restricted first (a real truck-safe route where OSM has the data);
    // if no such route exists, fall back to a plain route rather than
    // leaving the customer with nothing.
    const restricted = await fetchOrsRoute(apiKey, pickup, dropoff, true);
    const result = restricted ?? (await fetchOrsRoute(apiKey, pickup, dropoff, false));
    if (!result) return jsonResponse({ error: "No route found." }, 502);
    return jsonResponse(result);
  } catch (error) {
    console.error("calculate-route failed", error);
    return jsonResponse({ error: "Couldn't calculate a route right now." }, 500);
  }
});

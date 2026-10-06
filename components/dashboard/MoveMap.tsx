"use client";

import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { straightLineKm } from "@/lib/pricing";

const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
if (TOKEN) mapboxgl.accessToken = TOKEN;

const INK = "#17181c";
const MUTED = "#6b6b74";
const AMBER = "#f0b429";
const ROUTE_BLUE = "#2563eb";

export type LocationPoint = { placeName: string; center: [number, number] };
type Tab = "route" | "load" | "driver";

// Lucide's "truck" glyph, inlined as raw markup — Mapbox markers take a
// plain DOM element, not a React tree, so this can't be the usual
// `<Truck />` import; it's the same path data that import renders.
const TRUCK_GLYPH =
  '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M10 17h4V5H2v12h3"/><path d="M14 10h4.5l3.5 3.5V17h-2"/><circle cx="7.5" cy="17.5" r="1.8" fill="white" stroke="none"/><circle cx="17.5" cy="17.5" r="1.8" fill="white" stroke="none"/></svg>';

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

// Mapbox's `place_name` is "Street, City, Region, Country" — split once so
// the card can show the street on its own line and city/region underneath.
function formatAddress(placeName: string): { line1: string; line2: string } {
  const idx = placeName.indexOf(",");
  if (idx === -1) return { line1: placeName, line2: "" };
  return { line1: placeName.slice(0, idx), line2: placeName.slice(idx + 1).trim() };
}

function createPinElement(): HTMLDivElement {
  const el = document.createElement("div");
  el.className = "relative flex flex-col items-center";
  el.innerHTML = `
    <div class="card-slot"></div>
    <div class="grid size-7 place-items-center rounded-full bg-black ring-2 ring-white" style="box-shadow:0 8px 18px -6px rgba(0,0,0,0.55)">
      ${TRUCK_GLYPH}
    </div>
  `;
  return el;
}

function updatePinCard(pinEl: HTMLDivElement, point: LocationPoint, label: string, subtitle?: string) {
  const slot = pinEl.querySelector<HTMLDivElement>(".card-slot");
  if (!slot) return;
  const { line1, line2 } = formatAddress(point.placeName);
  slot.innerHTML = `
    <div class="mb-2 w-44 rounded-2xl border border-black/5 bg-white px-3 py-2.5 text-left" style="box-shadow:0 18px 40px -22px rgba(0,0,0,0.5)">
      <p style="color:${AMBER};font-size:0.62rem;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;margin:0">${label}</p>
      <p style="color:${INK};font-size:0.78rem;font-weight:600;line-height:1.3;margin:2px 0 0">${escapeHtml(line1)}</p>
      ${line2 ? `<p style="color:${MUTED};font-size:0.7rem;line-height:1.3;margin:0">${escapeHtml(line2)}</p>` : ""}
      ${subtitle ? `<p style="color:#9a9aa3;font-size:0.68rem;margin:4px 0 0">${escapeHtml(subtitle)}</p>` : ""}
    </div>
  `;
}

async function fetchRoute(
  a: [number, number],
  b: [number, number],
): Promise<{ coordinates: [number, number][]; distanceKm: number } | null> {
  try {
    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${a[0]},${a[1]};${b[0]},${b[1]}?geometries=geojson&overview=full&access_token=${TOKEN}`;
    const response = await fetch(url);
    if (!response.ok) return null;
    const data = await response.json();
    const route = data.routes?.[0];
    const coordinates = route?.geometry?.coordinates;
    if (!Array.isArray(coordinates) || typeof route.distance !== "number") return null;
    return { coordinates, distanceKm: route.distance / 1000 };
  } catch {
    return null;
  }
}

const ROUTE_SOURCE_ID = "move-route";

/**
 * The live tracking-style map for Move With You — pickup/drop-off pins,
 * a real driving route between them, and a small floating Route/Load/Driver
 * card, all styled to the page's own cream/amber look rather than the site's
 * dark theme tokens (a real map reads as a map regardless of the app's
 * light/dark toggle — see the plan's reasoning for this page's restyle).
 *
 * Loaded only via `MoveMapPanel.tsx`'s `dynamic(..., { ssr: false })` —
 * never imported anywhere that could run during the static-export prerender
 * pass, same rule this codebase already applies to its three.js scenes.
 */
export default function MoveMap({
  pickup,
  dropoff,
  className,
  defaultCenter,
  emptyMessage = "Add a pickup to see it on the map.",
  onRouteDistance,
}: {
  pickup: LocationPoint | null;
  dropoff: LocationPoint | null;
  className?: string;
  /** Shows a bare map centered here when there are no points yet. */
  defaultCenter?: [number, number];
  emptyMessage?: string;
  /** Reports the trip distance in km (road route, or straight line if the route fails), or null when cleared. */
  onRouteDistance?: (km: number | null) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const pickupMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const dropoffMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState<Tab>("route");

  const hasAny = Boolean(pickup || dropoff);
  const showMap = hasAny || Boolean(defaultCenter);

  // Created once, the first time there's something to show — not on mount,
  // so the empty state costs nothing.
  useEffect(() => {
    if (!showMap || mapRef.current || !containerRef.current || !TOKEN) return;
    const initialCenter = (pickup ?? dropoff)?.center ?? defaultCenter!;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      // Mapbox's standard colorful style — green parks, blue water, colored
      // roads at any zoom. The written spec originally asked for a "pale
      // map" (light-v11, flat and near-monochrome); after seeing the real
      // result the user explicitly asked for this instead, especially since
      // a far-apart pickup/drop-off pair zooms out to a country-wide view
      // where a pale style reads as almost empty.
      style: "mapbox://styles/mapbox/streets-v12",
      center: initialCenter,
      zoom: hasAny ? 12 : 11,
      attributionControl: false,
    });
    map.addControl(new mapboxgl.AttributionControl({ compact: true }));
    map.on("load", () => setReady(true));
    mapRef.current = map;
  }, [showMap, hasAny, pickup, dropoff, defaultCenter]);

  // Torn down only when the panel itself unmounts — not on every coordinate
  // change, which is handled by the sync effect below instead.
  useEffect(() => {
    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;

    if (pickup) {
      if (!pickupMarkerRef.current) {
        pickupMarkerRef.current = new mapboxgl.Marker({ element: createPinElement(), anchor: "bottom" })
          .setLngLat(pickup.center)
          .addTo(map);
      } else {
        pickupMarkerRef.current.setLngLat(pickup.center);
      }
      updatePinCard(pickupMarkerRef.current.getElement() as HTMLDivElement, pickup, "Pickup", "You + cargo");
    } else {
      pickupMarkerRef.current?.remove();
      pickupMarkerRef.current = null;
    }

    if (dropoff) {
      if (!dropoffMarkerRef.current) {
        dropoffMarkerRef.current = new mapboxgl.Marker({ element: createPinElement(), anchor: "bottom" })
          .setLngLat(dropoff.center)
          .addTo(map);
      } else {
        dropoffMarkerRef.current.setLngLat(dropoff.center);
      }
      updatePinCard(dropoffMarkerRef.current.getElement() as HTMLDivElement, dropoff, "Drop-off");
    } else {
      dropoffMarkerRef.current?.remove();
      dropoffMarkerRef.current = null;
    }

    const points: [number, number][] = [pickup?.center, dropoff?.center].filter(
      (p): p is [number, number] => Boolean(p),
    );
    if (points.length === 1) {
      map.easeTo({ center: points[0], zoom: 12, duration: 500 });
    } else if (points.length === 2) {
      const bounds = new mapboxgl.LngLatBounds(points[0], points[0]).extend(points[1]);
      map.fitBounds(bounds, { padding: 64, maxZoom: 14, duration: 600 });
    }

    let cancelled = false;
    (async () => {
      if (!pickup || !dropoff) {
        if (map.getLayer(ROUTE_SOURCE_ID)) map.removeLayer(ROUTE_SOURCE_ID);
        if (map.getSource(ROUTE_SOURCE_ID)) map.removeSource(ROUTE_SOURCE_ID);
        onRouteDistance?.(null);
        return;
      }
      const route = await fetchRoute(pickup.center, dropoff.center);
      if (cancelled) return;
      const coordinates = route?.coordinates ?? [pickup.center, dropoff.center];
      onRouteDistance?.(route?.distanceKm ?? straightLineKm(pickup.center, dropoff.center));
      const source = map.getSource(ROUTE_SOURCE_ID) as mapboxgl.GeoJSONSource | undefined;
      const data = {
        type: "Feature" as const,
        properties: {},
        geometry: { type: "LineString" as const, coordinates },
      };
      if (source) {
        source.setData(data);
      } else {
        map.addSource(ROUTE_SOURCE_ID, { type: "geojson", data });
        map.addLayer({
          id: ROUTE_SOURCE_ID,
          type: "line",
          source: ROUTE_SOURCE_ID,
          layout: { "line-join": "round", "line-cap": "round" },
          paint: { "line-color": ROUTE_BLUE, "line-width": 3.5 },
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [pickup, dropoff, ready, onRouteDistance]);

  if (!TOKEN) return null;

  if (!showMap) {
    return (
      <div
        className={cn("flex min-h-[22rem] flex-col items-center justify-center gap-2 rounded-2xl border px-6 text-center", className)}
        style={{ borderColor: "rgba(0,0,0,0.06)", background: "rgba(255,255,255,0.7)" }}
      >
        <p style={{ color: MUTED, fontSize: "0.85rem", fontWeight: 500 }}>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div
      className={cn("relative min-h-[22rem] overflow-hidden rounded-2xl border", className)}
      style={{ borderColor: "rgba(0,0,0,0.06)", boxShadow: "0 30px 70px -45px rgba(0,0,0,0.6)" }}
    >
      {/* mapbox-gl.css ships its own `.mapboxgl-map { position: relative }`
       * rule (Mapbox adds that class to this exact element once the map
       * initializes) — same specificity as Tailwind's `.absolute`, and it
       * loads after Tailwind's sheet, so it wins the cascade and silently
       * collapses this to a zero-height box without `!important` forcing
       * the override back. */}
      <div ref={containerRef} className="!absolute !inset-0" />
      <RouteCard tab={tab} onTabChange={setTab} pickup={pickup} dropoff={dropoff} />
    </div>
  );
}

function RouteCard({
  tab,
  onTabChange,
  pickup,
  dropoff,
}: {
  tab: Tab;
  onTabChange: (tab: Tab) => void;
  pickup: LocationPoint | null;
  dropoff: LocationPoint | null;
}) {
  const TABS: { id: Tab; label: string }[] = [
    { id: "route", label: "Route" },
    { id: "load", label: "Load" },
    { id: "driver", label: "Driver" },
  ];

  return (
    <div
      className="absolute left-3 top-3 w-60 rounded-2xl border bg-white p-3"
      style={{ borderColor: "rgba(0,0,0,0.06)", boxShadow: "0 20px 45px -25px rgba(0,0,0,0.5)" }}
    >
      <div className="flex gap-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => onTabChange(t.id)}
            className={cn(
              "rounded-full px-2.5 py-1 text-[0.65rem] font-semibold tracking-[0.04em] uppercase transition-colors duration-150",
              tab === t.id ? "bg-black text-white" : undefined,
            )}
            style={tab === t.id ? undefined : { color: MUTED }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-2.5">
        {tab === "route" ? (
          pickup || dropoff ? (
            <div className="flex flex-col gap-1.5">
              <p style={{ color: INK, fontSize: "0.72rem", fontWeight: 600 }}>
                {pickup ? "Pickup" : "…"} → {dropoff ? "Drop-off" : "…"}
              </p>
              {pickup ? <AddressLine label="Pickup" placeName={pickup.placeName} /> : null}
              {dropoff ? <AddressLine label="Drop-off" placeName={dropoff.placeName} /> : null}
            </div>
          ) : (
            <p style={{ color: MUTED, fontSize: "0.72rem" }}>Add an address to see the route.</p>
          )
        ) : (
          <p style={{ color: MUTED, fontSize: "0.72rem" }}>Not available yet.</p>
        )}
      </div>
    </div>
  );
}

function AddressLine({ label, placeName }: { label: string; placeName: string }) {
  return (
    <p style={{ color: MUTED, fontSize: "0.68rem", lineHeight: 1.4 }}>
      <span style={{ color: INK, fontWeight: 600 }}>{label}: </span>
      {placeName}
    </p>
  );
}

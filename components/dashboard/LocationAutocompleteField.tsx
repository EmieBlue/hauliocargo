"use client";

import { useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/cn";

const DEBOUNCE_MS = 250;

type GeocodeFeature = {
  id: number;
  place_name: string;
  center: [number, number];
};

type NominatimResult = {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
};

// OpenStreetMap's free public search (Nominatim) — chosen over Mapbox's
// geocoder after a direct side-by-side test: searching "Madina" (a
// well-known Accra suburb) through Mapbox returned only an unrelated
// village 500km away in Upper West — the real Accra-area Madina simply
// isn't in Mapbox's Ghana places index. The same search through Nominatim
// found it correctly. No API key needed, no account to set up — but it
// does ask callers to identify themselves and keeps requests to roughly
// one per second; this component's own debounce already keeps well under
// that for one person typing, and the browser's automatic `Referer` header
// (this site's own URL) is what the usage policy expects from a site
// calling it directly, same pattern small apps commonly use. If booking
// volume ever grows a lot, a small server-side proxy (same shape as the
// existing `analyze-cargo` Supabase function) would be the next step, to
// set a proper identifying header — not needed at today's scale.
async function fetchPredictions(query: string): Promise<GeocodeFeature[]> {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=jsonv2&countrycodes=gh&limit=5`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`OpenStreetMap search failed: ${response.status}`);
  const results = (await response.json()) as NominatimResult[];
  return results.map((result) => ({
    id: result.place_id,
    place_name: result.display_name,
    center: [Number(result.lon), Number(result.lat)],
  }));
}

/**
 * Address input with live OpenStreetMap suggestions, styled to match
 * `TextField`. Nominatim is a plain REST endpoint — no script tag or SDK to
 * load, unlike Google's Maps JS API or Mapbox GL, so this is just a
 * debounced `fetch`. The map itself (`MoveMap.tsx`) still renders with
 * Mapbox GL and still needs `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` — only this
 * search step moved providers, coordinates work the same either way.
 */
export function LocationAutocompleteField({
  label,
  value,
  onChange,
  onLocationSelected,
  placeholder,
  required,
  bare = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  /**
   * Fires only when the customer actually taps a suggestion — not on plain
   * typing — with the exact coordinates already returned for that place (no
   * extra geocode call). Typed-but-never-selected text still just updates
   * `value` via `onChange`, same accepted gap described below; this is the
   * "upgrade path" to real coordinates, e.g. for dropping a map pin.
   */
  onLocationSelected?: (feature: { placeName: string; center: [number, number] }) => void;
  placeholder?: string;
  required?: boolean;
  /**
   * For grouping two or more of these inside one external card (e.g.
   * Pickup/Drop-off sharing a single bordered card with a divider, instead
   * of each field being its own card) — drops this field's own
   * border/background and its own hint line, so the caller can supply a
   * shared card and a single hint instead.
   */
  bare?: boolean;
}) {
  const inputId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [predictions, setPredictions] = useState<GeocodeFeature[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!value.trim()) {
      // Deferred rather than called synchronously in the effect body, same
      // async pattern as the fetch branch below — avoids a same-tick
      // setState-in-effect cascade for what's otherwise an identical result.
      const clearTimer = window.setTimeout(() => setPredictions([]), 0);
      return () => window.clearTimeout(clearTimer);
    }

    let cancelled = false;
    const timer = window.setTimeout(() => {
      fetchPredictions(value)
        .then((results) => {
          if (cancelled) return;
          setPredictions(results);
          setOpen(true);
        })
        .catch((error) => {
          if (!cancelled) console.error("openstreetmap geocoding", error);
        });
    }, DEBOUNCE_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [value]);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  function selectPrediction(feature: GeocodeFeature) {
    onChange(feature.place_name);
    onLocationSelected?.({ placeName: feature.place_name, center: feature.center });
    setPredictions([]);
    setOpen(false);
  }

  return (
    <div ref={rootRef} className={cn("relative flex flex-col gap-1.5", bare && "py-3")}>
      <label
        htmlFor={inputId}
        className={cn(
          "font-display text-[0.72rem] font-semibold tracking-[0.08em] uppercase",
          // `bare` means a caller-supplied host card, not the usual dark
          // token-based surface — on Move With You that card is a fixed
          // cream regardless of site theme, so this needs a fixed ink/muted
          // color too (literal hex, matching that page's own INK/MUTED
          // constants — Tailwind can't reference a shared JS value here).
          // Without this, `text-mist`/`text-fg` resolve to near-white in
          // dark site-theme and disappear against the cream card.
          bare ? "text-[#6b6b74]" : "text-mist",
        )}
      >
        {label}
      </label>
      <input
        id={inputId}
        type="text"
        required={required}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onFocus={() => predictions.length > 0 && setOpen(true)}
        autoComplete="off"
        className={cn(
          "h-12 text-[0.95rem] transition-colors duration-200 focus:outline-none",
          bare
            ? "border-0 bg-transparent px-0 text-[#17181c] placeholder:text-[#6b6b74]"
            : "text-fg placeholder:text-muted rounded-xl border border-edge/12 bg-ink-950 px-4 focus:border-brand/50 focus:ring-2 focus:ring-brand/25",
        )}
      />

      {open && predictions.length > 0 ? (
        <div
          role="listbox"
          className="absolute top-full z-50 mt-1.5 w-full overflow-hidden rounded-xl border border-edge/10 bg-ink-950 shadow-[0_28px_70px_-40px_rgba(0,0,0,0.7)]"
        >
          {predictions.map((prediction) => (
            <button
              key={prediction.id}
              type="button"
              role="option"
              aria-selected={false}
              onClick={() => selectPrediction(prediction)}
              className={cn(
                "block w-full px-4 py-2.5 text-left text-[0.88rem] text-fg transition-colors duration-150",
                "hover:bg-edge/[0.05]",
              )}
            >
              {prediction.place_name}
            </button>
          ))}
          {/* Required by OpenStreetMap's data license wherever its search
           * results are shown — see openstreetmap.org/copyright. */}
          <a
            href="https://www.openstreetmap.org/copyright"
            target="_blank"
            rel="noreferrer"
            className="block border-t border-edge/8 px-4 py-2 text-[0.65rem] text-muted transition-colors duration-150 hover:text-fg"
          >
            © OpenStreetMap contributors
          </a>
        </div>
      ) : null}

      {/*
       * No search coverage is ever fully exhaustive — a specific address (a
       * named building, a small local landmark) may still not show up as a
       * suggestion even though the general area does. This is a real gap,
       * not a bug to chase: the input is a plain controlled text field
       * underneath the dropdown, so whatever the customer types is already
       * what gets submitted if they never tap a suggestion. This line just
       * makes that fallback visible instead of leaving the customer unsure
       * whether they're allowed to keep going without picking one.
       *
       * Skipped in `bare` mode — the caller shows one shared copy of this
       * below the whole group instead of one per field.
       */}
      {!bare ? (
        <p className="text-[0.72rem] text-muted">
          Can&rsquo;t find the exact spot? Keep typing — we&rsquo;ll use exactly what you enter.
        </p>
      ) : null}
    </div>
  );
}

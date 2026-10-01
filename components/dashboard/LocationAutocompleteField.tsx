"use client";

import { useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/cn";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
const DEBOUNCE_MS = 250;

type MapboxFeature = {
  id: string;
  place_name: string;
};

async function fetchPredictions(query: string): Promise<MapboxFeature[]> {
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&country=gh&autocomplete=true&limit=5`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Mapbox geocoding failed: ${response.status}`);
  const data = await response.json();
  return (data.features ?? []) as MapboxFeature[];
}

/**
 * Address input with live Mapbox suggestions, styled to match `TextField`.
 * Mapbox's Geocoding API is a plain REST endpoint — no script tag or SDK to
 * load, unlike Google's Maps JS API, so this is just a debounced `fetch`.
 * Degrades to a plain text input if `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` isn't
 * set, same "works without the key, just without the feature" pattern
 * already used for Supabase (`lib/supabase.ts`'s `authEnabled`).
 */
export function LocationAutocompleteField({
  label,
  value,
  onChange,
  placeholder,
  required,
  bare = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
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
  const [predictions, setPredictions] = useState<MapboxFeature[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!MAPBOX_TOKEN || !value.trim()) {
      setPredictions([]);
      return;
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
          if (!cancelled) console.error("mapbox geocoding", error);
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

  function selectPrediction(placeName: string) {
    onChange(placeName);
    setPredictions([]);
    setOpen(false);
  }

  return (
    <div ref={rootRef} className={cn("relative flex flex-col gap-1.5", bare && "py-3")}>
      <label
        htmlFor={inputId}
        className="font-display text-[0.72rem] font-semibold tracking-[0.08em] text-mist uppercase"
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
          "h-12 text-[0.95rem] text-fg placeholder:text-muted transition-colors duration-200 focus:outline-none",
          bare
            ? "border-0 bg-transparent px-0"
            : "rounded-xl border border-edge/12 bg-ink-950 px-4 focus:border-brand/50 focus:ring-2 focus:ring-brand/25",
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
              onClick={() => selectPrediction(prediction.place_name)}
              className={cn(
                "block w-full px-4 py-2.5 text-left text-[0.88rem] text-fg transition-colors duration-150",
                "hover:bg-edge/[0.05]",
              )}
            >
              {prediction.place_name}
            </button>
          ))}
        </div>
      ) : null}

      {/*
       * Mapbox's Ghana coverage is decent but not exhaustive — a specific
       * address (a named building, a small local landmark) may never show up
       * as a suggestion even though the general area does. This is a real
       * gap, not a bug to chase: the input is a plain controlled text field
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

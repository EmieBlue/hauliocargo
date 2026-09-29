"use client";

import { useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/cn";

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;
const SCRIPT_ID = "google-places-script";
const DEBOUNCE_MS = 250;

let scriptLoadPromise: Promise<void> | null = null;

/**
 * Loads the Maps JS API once per page, on demand — not globally in
 * `app/layout.tsx`, since only screens with a location field need it. Safe
 * to call from multiple mounted instances of this component; they all share
 * the one in-flight load.
 */
function loadPlacesScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.google?.maps?.places) return Promise.resolve();
  if (scriptLoadPromise) return scriptLoadPromise;

  scriptLoadPromise = new Promise((resolve, reject) => {
    const existing = document.getElementById(SCRIPT_ID);
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Failed to load Google Maps script")));
      return;
    }

    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}&libraries=places`;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Google Maps script"));
    document.head.appendChild(script);
  });

  return scriptLoadPromise;
}

/**
 * Address input with live Google Places suggestions, styled to match
 * `TextField` rather than Google's own default-styled Autocomplete widget —
 * uses `AutocompleteService` (predictions only, no attached UI) for that
 * reason. Degrades to a plain text input if `NEXT_PUBLIC_GOOGLE_PLACES_API_KEY`
 * isn't set, same "works without the key, just without the feature" pattern
 * already used for Supabase (`lib/supabase.ts`'s `authEnabled`).
 */
export function LocationAutocompleteField({
  label,
  value,
  onChange,
  placeholder,
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  const inputId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const serviceRef = useRef<google.maps.places.AutocompleteService | null>(null);
  const [predictions, setPredictions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!API_KEY) return;
    loadPlacesScript()
      .then(() => {
        serviceRef.current = new window.google.maps.places.AutocompleteService();
      })
      .catch((error) => console.error("places script", error));
  }, []);

  useEffect(() => {
    if (!serviceRef.current || !value.trim()) {
      setPredictions([]);
      return;
    }

    const timer = window.setTimeout(() => {
      serviceRef.current?.getPlacePredictions(
        { input: value, componentRestrictions: { country: "gh" } },
        (results, status) => {
          if (status !== window.google.maps.places.PlacesServiceStatus.OK || !results) {
            setPredictions([]);
            return;
          }
          setPredictions(results);
          setOpen(true);
        },
      );
    }, DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
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

  function selectPrediction(description: string) {
    onChange(description);
    setPredictions([]);
    setOpen(false);
  }

  return (
    <div ref={rootRef} className="relative flex flex-col gap-1.5">
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
        className="h-12 rounded-xl border border-edge/12 bg-ink-950 px-4 text-[0.95rem] text-fg placeholder:text-muted/70 transition-colors duration-200 focus:border-brand/50 focus:ring-2 focus:ring-brand/25 focus:outline-none"
      />

      {open && predictions.length > 0 ? (
        <div
          role="listbox"
          className="absolute top-full z-50 mt-1.5 w-full overflow-hidden rounded-xl border border-edge/10 bg-ink-950 shadow-[0_28px_70px_-40px_rgba(0,0,0,0.7)]"
        >
          {predictions.map((prediction) => (
            <button
              key={prediction.place_id}
              type="button"
              role="option"
              aria-selected={false}
              onClick={() => selectPrediction(prediction.description)}
              className={cn(
                "block w-full px-4 py-2.5 text-left text-[0.88rem] text-fg transition-colors duration-150",
                "hover:bg-edge/[0.05]",
              )}
            >
              {prediction.description}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

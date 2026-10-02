"use client";

import { ArrowLeft, Box, Forklift, Loader2, Truck } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Outfit } from "next/font/google";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { ProfileMenu } from "@/components/auth/ProfileMenu";
import { CargoPhotoUpload } from "@/components/dashboard/CargoPhotoUpload";
import { LocationAutocompleteField } from "@/components/dashboard/LocationAutocompleteField";
import { TruckSizePicker } from "@/components/dashboard/TruckSizePicker";
import { analyzeCargoPhoto, createBooking, uploadCargoPhoto } from "@/lib/bookings";
import { cn } from "@/lib/cn";
import { CARGO_CATEGORIES, DEFAULT_TRUCK_SIZE, ROUTES } from "@/lib/site";
import { useRequireRole } from "@/lib/useRequireRole";
import { useSettledReducedMotion } from "@/lib/useSettledReducedMotion";

// Scoped to this page only — the rest of the site stays on Sora/Inter (see
// app/layout.tsx). Applied via className on the page root below, not the
// global font setup, so this doesn't touch any other page.
const outfit = Outfit({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"] });

type When = "now" | "later";
type AiChoice = "yes" | "no" | null;
type Category = (typeof CARGO_CATEGORIES)[number]["title"];

// This page's own literal palette (a specific written spec, not the
// sitewide black/yellow theme tokens) — kept as named constants rather than
// scattering hex strings through the JSX below.
const INK = "#141210";
const AMBER = "#e7a31a";
const SELECTED_FILL = "#fff4d6";

// Spec names the same "truck" icon for both Household Moves and Furniture &
// Appliances (not the distinct Van/Truck pairing used elsewhere on this
// site) — same order as CARGO_CATEGORIES in lib/site.ts.
const CATEGORY_ICONS: LucideIcon[] = [Truck, Truck, Box, Forklift];

// Sentence-case display labels + short card copy, local to this page only.
// CARGO_CATEGORIES' own `title`/`body` stay exactly as they are in
// lib/site.ts — that `title` string is validated by a Postgres check
// constraint and mirrored in the analyze-cargo Edge Function, so renaming it
// there would be a real backend change, not a cosmetic one. This is a
// display-only relabeling for this one page.
const CATEGORY_DISPLAY: Record<Category, string> = {
  "Household Moves": "Household moves",
  "Furniture & Appliances": "Furniture & appliances",
  "Business Goods": "Business goods",
  "Building Materials": "Building materials",
};
const CATEGORY_SHORT_BODY: Record<Category, string> = {
  "Household Moves": "boxes, beds, wardrobes",
  "Furniture & Appliances": "sofas, fridges, TVs",
  "Business Goods": "stock and equipment",
  "Building Materials": "heavier loads",
};

/**
 * "Move With You" — the ride-along booking form, built to a specific written
 * spec the user sent after a few rounds of screenshot-based guessing didn't
 * land: exact colors, exact copy, exact stage-reveal rules. This page is
 * deliberately self-contained rather than using `DashboardShell` — its own
 * flat cream background and header, not the dark photo backdrop the rest of
 * the dashboard uses, per that spec. Scoped to this page only; nothing else
 * on the site changes.
 *
 * Root is pinned `data-theme="light"` so every reused component
 * (`LocationAutocompleteField`, `CargoPhotoUpload`, `ProfileMenu`) renders
 * its light-theme form regardless of the site's real toggle — this page
 * doesn't react to that toggle at all.
 *
 * Stage reveal: Cargo Type shows as soon as Yes/No is answered (not gated on
 * a photo finishing analysis — the photo upload is an optional, parallel way
 * to get a suggestion, not a prerequisite). Truck Size shows as soon as a
 * category is picked. On the Yes path, once a category is known, the
 * SmartLoad Suggestion banner always has something to say — the AI's real
 * size if a photo was analyzed, otherwise `DEFAULT_TRUCK_SIZE`'s per-category
 * fallback — rather than only appearing when a photo happened to be used.
 */
export default function MoveWithYouPage() {
  const { loading } = useRequireRole("customer");
  const reducedMotion = useSettledReducedMotion();

  const [pickupLocation, setPickupLocation] = useState("");
  const [dropoffLocation, setDropoffLocation] = useState("");
  const [when, setWhen] = useState<When>("now");
  const [scheduledFor, setScheduledFor] = useState("");
  const [cargoDescription, setCargoDescription] = useState("");
  const [aiChoice, setAiChoice] = useState<AiChoice>(null);
  const [vehicleCategory, setVehicleCategory] = useState<Category | null>(null);
  const [vehicleSize, setVehicleSize] = useState<string | null>(null);
  const [cargoPhoto, setCargoPhoto] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="grid min-h-svh place-items-center bg-[#f4f0e8]">
        <div className="size-8 animate-spin rounded-full border-2 border-[#141210]/15 border-t-[#e7a31a]" />
      </div>
    );
  }

  // Switching the AI/manual answer clears whatever belonged to the other
  // path — a leftover category or a leftover AI-suggested size would be
  // confusing sitting under the wrong branch.
  function handleAiChoice(choice: AiChoice) {
    setAiChoice(choice);
    setVehicleCategory(null);
    setVehicleSize(null);
    setCargoPhoto(null);
    setPhotoError(null);
  }

  // Manual pick from the Cargo Type grid — used on both paths. On the Yes
  // path, if nothing's been suggested yet (no photo, or the photo didn't
  // return a size), fill in the per-category default so Truck Size always
  // has something preselected once a category's known, same as the spec's
  // own "Preselect 20ft" example. On the No path this never fires — the
  // spec is explicit that nothing is preselected there.
  function handleCategorySelected(category: Category) {
    setVehicleCategory(category);
    if (aiChoice === "yes" && !vehicleSize) {
      setVehicleSize(DEFAULT_TRUCK_SIZE[category]);
    }
  }

  async function handlePhotoSelected(file: File | null) {
    setCargoPhoto(file);
    setPhotoError(null);
    setVehicleCategory(null);
    setVehicleSize(null);
    if (!file) return;

    setAnalyzing(true);
    const result = await analyzeCargoPhoto(file);
    setAnalyzing(false);

    if (!result.ok) {
      setPhotoError(result.message);
      return;
    }

    const { category, size } = result.data;
    if (category) {
      const resolved = category as Category;
      setVehicleCategory(resolved);
      // A real AI size wins; otherwise the category's own default fills in
      // immediately, so the Truck Size grid has something preselected the
      // moment it appears, not just the banner text claiming a suggestion.
      setVehicleSize(size ?? DEFAULT_TRUCK_SIZE[resolved]);
    } else if (size) {
      setVehicleSize(size);
    } else {
      setPhotoError("SmartLoad™ wasn't sure from that photo — please choose below.");
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (submitting || !vehicleCategory || !vehicleSize) return;
    setError(null);

    if (!pickupLocation.trim() || !dropoffLocation.trim()) {
      setError("Please enter both a pickup and drop-off location.");
      return;
    }
    if (!cargoDescription.trim()) {
      setError("Let us know what you're moving.");
      return;
    }
    if (when === "later" && !scheduledFor) {
      setError("Please choose a date and time, or switch back to Now.");
      return;
    }

    setSubmitting(true);

    // A photo failing to upload shouldn't block the booking itself — the
    // request still has everything it needs without it.
    let cargoPhotoUrl: string | null = null;
    if (cargoPhoto) {
      const uploadResult = await uploadCargoPhoto(cargoPhoto);
      if (uploadResult.ok) cargoPhotoUrl = uploadResult.data;
    }

    const result = await createBooking("move", {
      pickupLocation,
      dropoffLocation,
      cargoDescription,
      vehicleCategory,
      vehicleSize,
      cargoPhotoUrl,
      scheduledFor: when === "later" ? new Date(scheduledFor).toISOString() : null,
    });
    setSubmitting(false);

    if (!result.ok) {
      setError(result.message);
      return;
    }
    setSubmitted(true);
  }

  const canSubmit = Boolean(vehicleCategory && vehicleSize);

  if (submitted) {
    return (
      <div data-theme="light" className={cn("min-h-svh bg-[#f4f0e8]", outfit.className)}>
        <MoveHeader />
        <div className="mx-auto flex max-w-xl flex-col gap-6 px-5 py-16">
          <h1 className="text-[clamp(1.8rem,3.6vw,2.4rem)] font-extrabold tracking-[-0.02em]" style={{ color: INK }}>
            Request Received
          </h1>
          <p className="text-[0.95rem] leading-relaxed" style={{ color: `${INK}99` }}>
            We&rsquo;ve got your move request. Pricing and driver-matching aren&rsquo;t live yet, so this won&rsquo;t
            move any further on its own right now — but it&rsquo;s saved, and we&rsquo;ll be in touch once that
            part is ready.
          </p>
          <Link
            href={ROUTES.dashboardCustomer}
            className="inline-flex h-13 w-fit items-center justify-center rounded-xl px-7 font-display text-[0.78rem] font-semibold uppercase tracking-[0.09em] transition-colors duration-200"
            style={{ backgroundColor: AMBER, color: INK }}
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div data-theme="light" className={cn("min-h-svh bg-[#f4f0e8]", outfit.className)}>
      <MoveHeader />

      <div className="mx-auto flex w-full max-w-xl flex-col gap-6 px-5 py-10">
        <div>
          <p className="font-display text-[0.68rem] font-semibold tracking-[0.22em] uppercase" style={{ color: `${INK}80` }}>
            Move With You
          </p>
          <h1 className="mt-1.5 text-[clamp(1.8rem,3.6vw,2.4rem)] font-extrabold tracking-[-0.02em]" style={{ color: INK }}>
            You&rsquo;ll ride with the load.
          </h1>
          <p className="mt-3 text-[0.95rem] leading-relaxed" style={{ color: `${INK}99` }}>
            You&rsquo;ll travel with the driver and your cargo all the way to the destination.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Stage 1 — always visible */}
          <div className="flex flex-col gap-1.5">
            <div className="flex flex-col divide-y divide-[#1412101a] rounded-2xl border px-4" style={{ borderColor: `${INK}1a`, backgroundColor: "#fff" }}>
              <LocationAutocompleteField
                label="Pickup Location"
                placeholder="Where should the driver pick you up?"
                required
                value={pickupLocation}
                onChange={setPickupLocation}
                bare
              />
              <LocationAutocompleteField
                label="Drop-off Location"
                placeholder="Where are you headed?"
                required
                value={dropoffLocation}
                onChange={setDropoffLocation}
                bare
              />
            </div>
            <p className="text-[0.72rem]" style={{ color: `${INK}70` }}>
              Can&rsquo;t find the exact spot? Keep typing — we&rsquo;ll use exactly what you enter.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <span className="font-display text-[0.72rem] font-semibold tracking-[0.08em] uppercase" style={{ color: `${INK}80` }}>
              When
            </span>
            <div className="flex gap-2.5">
              <SegmentButton label="Now" active={when === "now"} onClick={() => setWhen("now")} />
              <SegmentButton label="Schedule" active={when === "later"} onClick={() => setWhen("later")} />
            </div>
            {when === "later" ? (
              <input
                type="datetime-local"
                value={scheduledFor}
                onChange={(e) => setScheduledFor(e.target.value)}
                className="h-12 rounded-xl border px-4 text-[0.95rem] transition-colors duration-200 focus:outline-none"
                style={{ borderColor: `${INK}1a`, color: INK, backgroundColor: "#fff" }}
              />
            ) : null}
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="cargo-description"
              className="font-display text-[0.72rem] font-semibold tracking-[0.08em] uppercase"
              style={{ color: `${INK}80` }}
            >
              What Are You Moving?
            </label>
            <textarea
              id="cargo-description"
              required
              rows={3}
              placeholder="e.g. 2-bedroom household move, sofa and boxes"
              value={cargoDescription}
              onChange={(e) => setCargoDescription(e.target.value)}
              className="resize-none rounded-2xl border px-4 py-3 text-[0.95rem] transition-colors duration-200 focus:outline-none"
              style={{ borderColor: `${INK}1a`, color: INK, backgroundColor: "#fff" }}
            />
          </div>

          <div className="flex flex-col gap-2">
            <span className="font-display text-[0.72rem] font-semibold tracking-[0.08em] uppercase" style={{ color: `${INK}80` }}>
              Want SmartLoad™ to Help?
            </span>
            <p className="text-[0.8rem]" style={{ color: `${INK}99` }}>
              Upload a photo and let AI suggest the right truck — or choose one yourself.
            </p>
            <div className="flex gap-2.5">
              <SegmentButton label="Yes, use AI" active={aiChoice === "yes"} onClick={() => handleAiChoice("yes")} />
              <SegmentButton label="No, I’ll choose" active={aiChoice === "no"} onClick={() => handleAiChoice("no")} />
            </div>
          </div>

          {/* Stage 2 — cargo type, as soon as Yes or No is answered */}
          {aiChoice ? (
            <>
              {aiChoice === "yes" ? (
                <>
                  <CargoPhotoUpload onFileSelected={handlePhotoSelected} />
                  {analyzing ? (
                    <p className="flex items-center gap-2 text-[0.8rem]" style={{ color: `${INK}99` }}>
                      <Loader2 className="size-3.5 animate-spin" aria-hidden />
                      SmartLoad™ is looking at your photo…
                    </p>
                  ) : photoError ? (
                    <p className="text-[0.8rem]" style={{ color: "#b3440c" }}>
                      {photoError}
                    </p>
                  ) : null}
                </>
              ) : null}

              <div className="flex flex-col gap-2">
                <span className="font-display text-[0.72rem] font-semibold tracking-[0.08em] uppercase" style={{ color: `${INK}80` }}>
                  Cargo Type
                </span>
                <p className="text-[0.8rem]" style={{ color: `${INK}99` }}>
                  {aiChoice === "yes"
                    ? "AI is on. Pick the cargo, then SmartLoad suggests a truck. You can still change it."
                    : "You’ll choose the truck yourself. Pick the cargo first."}
                </p>
                <div className="grid grid-cols-2 gap-2.5">
                  {CARGO_CATEGORIES.map((category, index) => {
                    const Icon = CATEGORY_ICONS[index];
                    const active = vehicleCategory === category.title;
                    return (
                      <button
                        key={category.title}
                        type="button"
                        onClick={() => handleCategorySelected(category.title)}
                        aria-pressed={active}
                        className="flex flex-col items-start gap-2.5 rounded-2xl border p-4 text-left transition-colors duration-200"
                        style={{
                          borderColor: active ? AMBER : `${INK}1a`,
                          backgroundColor: active ? SELECTED_FILL : "#fff",
                        }}
                      >
                        <span
                          className={cn(
                            "grid size-11 shrink-0 place-items-center rounded-xl text-white",
                            !reducedMotion && "icon-drive",
                          )}
                          style={{ backgroundColor: AMBER, animationDelay: reducedMotion ? undefined : `${index * 0.25}s` }}
                        >
                          <Icon className="size-5" aria-hidden />
                        </span>
                        <span>
                          <span className="block text-[0.85rem] font-semibold" style={{ color: INK }}>
                            {CATEGORY_DISPLAY[category.title]}
                          </span>
                          <span className="mt-0.5 block text-[0.75rem]" style={{ color: `${INK}80` }}>
                            {CATEGORY_SHORT_BODY[category.title]}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          ) : null}

          {/* Stage 3 — truck size, as soon as a cargo type is picked */}
          {vehicleCategory ? (
            <>
              {aiChoice === "yes" ? (
                <div className="rounded-2xl px-4 py-3.5" style={{ backgroundColor: INK }}>
                  <p className="font-display text-[0.65rem] font-semibold tracking-[0.15em] uppercase" style={{ color: AMBER }}>
                    SmartLoad Suggestion
                  </p>
                  <p className="mt-1 text-[0.85rem] leading-relaxed text-white/90">
                    For {CATEGORY_DISPLAY[vehicleCategory]}, SmartLoad suggests the {vehicleSize} truck. Tap another
                    size if you want.
                  </p>
                </div>
              ) : null}
              <TruckSizePicker category={vehicleCategory} value={vehicleSize} onChange={setVehicleSize} />
            </>
          ) : null}

          {error ? (
            <p role="alert" className="rounded-xl border px-4 py-3 text-[0.85rem]" style={{ borderColor: "#e3b48a", backgroundColor: "#fdf1e6", color: "#b3440c" }}>
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={!canSubmit || submitting}
            className={cn(
              "h-13 w-full rounded-xl font-display text-[0.78rem] font-semibold uppercase tracking-[0.09em] transition-[background-color,color] duration-200",
              canSubmit ? "cursor-pointer" : "cursor-not-allowed",
            )}
            style={{
              backgroundColor: canSubmit ? AMBER : "#e9e2d2",
              color: canSubmit ? INK : `${INK}66`,
            }}
          >
            {submitting ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Requesting
              </span>
            ) : (
              "Request This Move"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

function MoveHeader() {
  return (
    <header className="sticky top-0 z-50 border-b" style={{ borderColor: `${INK}14`, backgroundColor: "#f4f0e8f2" }}>
      <div className="mx-auto flex h-18 max-w-3xl items-center justify-between px-5">
        <div className="flex items-center gap-3">
          <Link
            href={ROUTES.dashboardCustomer}
            className="flex items-center gap-2 rounded-full border py-1.5 pr-4 pl-1.5 text-[0.8rem] font-semibold transition-colors duration-200"
            style={{ borderColor: `${INK}1a`, backgroundColor: "#fff", color: INK }}
          >
            <span className="grid size-7 shrink-0 place-items-center rounded-full text-white" style={{ backgroundColor: INK }}>
              <ArrowLeft className="size-3.5" aria-hidden />
            </span>
            Dashboard
          </Link>
          <Link href={ROUTES.homePage} className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element -- static brand asset, next/image gains nothing here */}
            <img src="/brand/nav-mark-light.png" alt="" className="h-6 w-auto" />
            <span className="font-display text-[0.95rem] leading-none font-extrabold tracking-[0.02em]">
              <span style={{ color: AMBER }}>HAULIO</span>
              <span style={{ color: INK }}>CARGO</span>
            </span>
          </Link>
        </div>
        <ProfileMenu />
      </div>
    </header>
  );
}

function SegmentButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className="h-11 flex-1 rounded-xl border font-display text-[0.85rem] font-semibold transition-colors duration-200"
      style={{
        borderColor: active ? INK : `${INK}1a`,
        backgroundColor: active ? INK : "#fff",
        color: active ? "#fff" : INK,
      }}
    >
      {label}
    </button>
  );
}

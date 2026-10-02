"use client";

import { Box, Forklift, Loader2, Sparkles, Truck } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useState, type FormEvent } from "react";
import { DashboardLoading, DashboardShell } from "@/components/auth/DashboardShell";
import { CargoPhotoUpload } from "@/components/dashboard/CargoPhotoUpload";
import { LocationAutocompleteField } from "@/components/dashboard/LocationAutocompleteField";
import { TruckSizePicker } from "@/components/dashboard/TruckSizePicker";
import { Button } from "@/components/ui/Button";
import { analyzeCargoPhoto, createBooking, uploadCargoPhoto } from "@/lib/bookings";
import { cn } from "@/lib/cn";
import { CARGO_CATEGORIES, DEFAULT_TRUCK_SIZE, ROUTES } from "@/lib/site";
import { useRequireRole } from "@/lib/useRequireRole";
import { useSettledReducedMotion } from "@/lib/useSettledReducedMotion";

type When = "now" | "later";
type AiChoice = "yes" | "no" | null;
type Category = (typeof CARGO_CATEGORIES)[number]["title"];

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
 * "Move With You" — the ride-along booking form. Uses the real
 * `DashboardShell` (dark photo backdrop, working theme toggle, scroll-to-
 * real-brand-yellow header) like every other dashboard page — an earlier
 * pass replaced this with a one-off cream shell to match a written spec's
 * literal hex colors, which read as broken (a theme toggle with no visible
 * effect, a yellow that didn't match the rest of the site). The content
 * improvements from that spec stay; only the shell reverted.
 *
 * Cargo Type and Truck Size's cards stay pinned `data-theme="light"` (always
 * white) — a separate, already-approved fix matching the spec's own "white
 * cards" request, never contradicted by this revert — everything else goes
 * back to the standard theme-reactive token classes DashboardShell's other
 * content already uses.
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

  if (loading) return <DashboardLoading />;

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
  // has something preselected once a category's known. On the No path this
  // never fires — nothing is preselected there.
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
      <DashboardShell backLink={{ href: ROUTES.dashboardCustomer, label: "Dashboard" }}>
        <div className="flex max-w-lg flex-col gap-6">
          <h1 className="text-[clamp(1.8rem,3.6vw,2.4rem)] font-extrabold tracking-[-0.02em] text-fg">
            Request Received
          </h1>
          <p className="text-[0.95rem] leading-relaxed text-muted">
            We&rsquo;ve got your move request. Pricing and driver-matching aren&rsquo;t live yet, so this won&rsquo;t
            move any further on its own right now — but it&rsquo;s saved, and we&rsquo;ll be in touch once that
            part is ready.
          </p>
          <Button href={ROUTES.dashboardCustomer} variant="primary" className="w-full sm:w-auto">
            Back to Dashboard
          </Button>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell backLink={{ href: ROUTES.dashboardCustomer, label: "Dashboard" }}>
      <div className="flex w-full max-w-xl flex-col gap-6">
        <div>
          <p className="font-display text-[0.68rem] font-semibold tracking-[0.22em] text-mist uppercase">
            Move With You
          </p>
          <h1 className="mt-1.5 text-[clamp(1.8rem,3.6vw,2.4rem)] font-extrabold tracking-[-0.02em] text-fg">
            You&rsquo;ll ride with the load.
          </h1>
          <p className="mt-3 text-[0.95rem] leading-relaxed text-muted">
            You&rsquo;ll travel with the driver and your cargo all the way to the destination.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Stage 1 — always visible */}
          <div className="flex flex-col gap-1.5">
            <div className="flex flex-col divide-y divide-edge/10 rounded-xl border border-edge/12 bg-ink-950 px-4">
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
            <p className="text-[0.72rem] text-muted">
              Can&rsquo;t find the exact spot? Keep typing — we&rsquo;ll use exactly what you enter.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <span className="font-display text-[0.72rem] font-semibold tracking-[0.08em] text-mist uppercase">
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
                className="h-12 rounded-xl border border-edge/12 bg-ink-950 px-4 text-[0.95rem] text-fg transition-colors duration-200 focus:border-brand/50 focus:ring-2 focus:ring-brand/25 focus:outline-none"
              />
            ) : null}
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="cargo-description"
              className="font-display text-[0.72rem] font-semibold tracking-[0.08em] text-mist uppercase"
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
              className="resize-none rounded-xl border border-edge/12 bg-ink-950 px-4 py-3 text-[0.95rem] text-fg placeholder:text-muted transition-colors duration-200 focus:border-brand/50 focus:ring-2 focus:ring-brand/25 focus:outline-none"
            />
          </div>

          <div className="flex flex-col gap-2">
            <span className="font-display text-[0.72rem] font-semibold tracking-[0.08em] text-mist uppercase">
              Want SmartLoad™ to Help?
            </span>
            <p className="text-[0.8rem] text-muted">
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
                    <p className="flex items-center gap-2 text-[0.8rem] text-muted">
                      <Loader2 className="size-3.5 animate-spin" aria-hidden />
                      SmartLoad™ is looking at your photo…
                    </p>
                  ) : photoError ? (
                    <p className="flex items-start gap-2 text-[0.8rem] text-brand">
                      <Sparkles className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                      {photoError}
                    </p>
                  ) : null}
                </>
              ) : null}

              <div className="flex flex-col gap-2">
                <span className="font-display text-[0.72rem] font-semibold tracking-[0.08em] text-mist uppercase">
                  Cargo Type
                </span>
                <p className="text-[0.8rem] text-muted">
                  {aiChoice === "yes"
                    ? "AI is on. Pick the cargo, then SmartLoad suggests a truck. You can still change it."
                    : "You’ll choose the truck yourself. Pick the cargo first."}
                </p>
                {/* Pinned light, matching an earlier-approved fix and the
                 * written spec's own "white cards" — everything else on
                 * this page is theme-reactive again, but these grid cards
                 * stay white regardless of the toggle. */}
                <div data-theme="light" className="grid grid-cols-2 gap-2.5">
                  {CARGO_CATEGORIES.map((category, index) => {
                    const Icon = CATEGORY_ICONS[index];
                    const active = vehicleCategory === category.title;
                    return (
                      <button
                        key={category.title}
                        type="button"
                        onClick={() => handleCategorySelected(category.title)}
                        aria-pressed={active}
                        className={cn(
                          "flex flex-col items-start gap-2.5 rounded-xl border p-4 text-left transition-colors duration-200",
                          active
                            ? "border-brand bg-[color-mix(in_oklab,var(--color-brand)_8%,var(--color-ink-950))]"
                            : "border-edge/12 bg-ink-950 hover:border-brand/40",
                        )}
                      >
                        <span
                          className={cn(
                            "grid size-11 shrink-0 place-items-center rounded-xl bg-brand text-white",
                            !reducedMotion && "icon-drive",
                          )}
                          style={reducedMotion ? undefined : { animationDelay: `${index * 0.25}s` }}
                        >
                          <Icon className="size-5" aria-hidden />
                        </span>
                        <span>
                          <span className="block text-[0.85rem] font-semibold text-fg">
                            {CATEGORY_DISPLAY[category.title]}
                          </span>
                          <span className="mt-0.5 block text-[0.75rem] text-muted">
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
                <div data-theme="dark" className="rounded-xl border border-edge/12 bg-ink-950 px-4 py-3.5">
                  <p className="font-display text-[0.65rem] font-semibold tracking-[0.15em] text-brand uppercase">
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
            <p role="alert" className="rounded-xl border border-brand/25 bg-brand/[0.06] px-4 py-3 text-[0.85rem] text-brand">
              {error}
            </p>
          ) : null}

          <Button type="submit" variant="primary" className="w-full" disabled={!canSubmit || submitting}>
            {submitting ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Requesting
              </>
            ) : (
              "Request This Move"
            )}
          </Button>
        </form>
      </div>
    </DashboardShell>
  );
}

function SegmentButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "h-11 flex-1 rounded-xl border text-[0.85rem] font-semibold transition-colors duration-200",
        active ? "border-brand bg-brand/[0.06] text-brand" : "border-edge/12 bg-ink-950 text-fg hover:border-brand/40",
      )}
    >
      {label}
    </button>
  );
}

"use client";

import { Box, Forklift, Loader2, Sparkles, Truck, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Outfit } from "next/font/google";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { DashboardLoading, DashboardShell } from "@/components/auth/DashboardShell";
import { AppSideMenu } from "@/components/dashboard/AppSideMenu";
import { CargoPhotoUpload } from "@/components/dashboard/CargoPhotoUpload";
import { LocationAutocompleteField } from "@/components/dashboard/LocationAutocompleteField";
import type { LocationPoint } from "@/components/dashboard/MoveMap";
import { MoveMapPanel } from "@/components/dashboard/MoveMapPanel";
import { TruckSizePicker } from "@/components/dashboard/TruckSizePicker";
import { Button } from "@/components/ui/Button";
import { analyzeCargoPhoto, createBooking, uploadCargoPhoto } from "@/lib/bookings";
import { cn } from "@/lib/cn";
import { CARGO_CATEGORIES, DEFAULT_TRUCK_SIZE, LOADING_ASSISTANT_COUNTS, ROUTES } from "@/lib/site";
import { useMediaQuery } from "@/lib/useMediaQuery";
import { useRequireRole } from "@/lib/useRequireRole";
import { useSettledReducedMotion } from "@/lib/useSettledReducedMotion";

const outfit = Outfit({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"] });

// Move With You's own cream/amber look, confirmed with the user as a
// deliberate exception to the site's shared dark-card tokens — these cards
// float on the real (unchanged) dark photo backdrop, they just don't borrow
// its color system. See the plan for the full reasoning; `TruckSizePicker`
// uses the same constants.
const INK = "#17181c";
const MUTED = "#6b6b74";
const CREAM = "#f6f3ed";
const AMBER = "#f0b429";
const AMBER_BORDER = "#e2b04a";
const AMBER_FILL = "#fff6df";

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
 * "Move With You" — the ride-along booking form. Shell is the real
 * `DashboardShell` (dark photo backdrop, working theme toggle, scroll-to-
 * real-brand-yellow header) like every other dashboard page — that part
 * stays untouched. This page's own cards/buttons/text, on top of that
 * backdrop, use a page-scoped cream/amber look (see the `INK`/`AMBER`/etc
 * constants above) instead of the shared dark tokens, confirmed directly
 * with the user as a deliberate, page-only exception.
 *
 * Pickup/Drop-off also now feed a live map (`MoveMapPanel`) once a
 * suggestion is actually selected (not just typed) — `LocationAutocomplete
 * Field`'s `onLocationSelected` hands back real Mapbox coordinates for
 * that.
 */
export default function MoveWithYouPage() {
  const { loading } = useRequireRole("customer");
  const router = useRouter();
  const reducedMotion = useSettledReducedMotion();
  // Exactly one `MoveMapPanel` ever mounts — gated in JS, not just hidden
  // via CSS, so there's only ever one live `mapboxgl.Map` instance (two
  // CSS-toggled copies would both quietly fetch tiles/styles and hold a
  // WebGL context even while one sat at `display: none`).
  const isDesktop = useMediaQuery("(min-width: 1024px)");

  const [pickupLocation, setPickupLocation] = useState("");
  const [dropoffLocation, setDropoffLocation] = useState("");
  const [pickupPoint, setPickupPoint] = useState<LocationPoint | null>(null);
  const [dropoffPoint, setDropoffPoint] = useState<LocationPoint | null>(null);
  const [when, setWhen] = useState<When>("now");
  const [scheduledFor, setScheduledFor] = useState("");
  const [cargoDescription, setCargoDescription] = useState("");
  const [aiChoice, setAiChoice] = useState<AiChoice>(null);
  const [vehicleCategory, setVehicleCategory] = useState<Category | null>(null);
  const [vehicleSize, setVehicleSize] = useState<string | null>(null);
  const [needsAssistant, setNeedsAssistant] = useState<"yes" | "no" | null>(null);
  const [assistantCount, setAssistantCount] = useState<string | null>(null);
  const [cargoPhoto, setCargoPhoto] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (loading) return <DashboardLoading />;

  // Typing after a selection invalidates it — the map pin shouldn't keep
  // pointing at an address the customer has since edited away from.
  function handlePickupChange(value: string) {
    setPickupLocation(value);
    setPickupPoint(null);
  }
  function handleDropoffChange(value: string) {
    setDropoffLocation(value);
    setDropoffPoint(null);
  }
  function handlePickupSelected(feature: LocationPoint) {
    setPickupLocation(feature.placeName);
    setPickupPoint(feature);
  }
  function handleDropoffSelected(feature: LocationPoint) {
    setDropoffLocation(feature.placeName);
    setDropoffPoint(feature);
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
  // has something preselected once a category's known. On the No path this
  // never fires — nothing is preselected there.
  function handleCategorySelected(category: Category) {
    setVehicleCategory(category);
    if (aiChoice === "yes" && !vehicleSize) {
      setVehicleSize(DEFAULT_TRUCK_SIZE[category]);
    }
  }

  // Switching back to "No" clears any count already picked — otherwise a
  // stale count would silently still submit even though the customer said
  // they didn't want an assistant after all.
  function handleAssistantChoice(choice: "yes" | "no") {
    setNeedsAssistant(choice);
    setAssistantCount(null);
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
      loadingAssistants: needsAssistant === "yes" ? assistantCount : null,
      pickupCenter: pickupPoint?.center ?? null,
      dropoffCenter: dropoffPoint?.center ?? null,
      scheduledFor: when === "later" ? new Date(scheduledFor).toISOString() : null,
    });
    setSubmitting(false);

    if (!result.ok) {
      setError(result.message);
      return;
    }
    router.push(`${ROUTES.bookings}?id=${result.data}`);
  }

  // Need Help Loading? is now required, same as every earlier stage on this
  // page — an unanswered question used to quietly let the customer submit
  // anyway, which read as skippable. Saying "yes" still also means picking
  // how many before the button enables.
  const canSubmit = Boolean(
    vehicleCategory && vehicleSize && needsAssistant && (needsAssistant !== "yes" || assistantCount),
  );

  return (
    <DashboardShell backLink={{ href: ROUTES.dashboardCustomer, label: "Dashboard" }}>
      <div className="flex w-full max-w-6xl items-start gap-5">
        <AppSideMenu activeKey="move" />
        <div className={cn("flex min-w-0 flex-1 flex-col gap-6 lg:flex-row lg:items-start", outfit.className)}>
        <div className="flex w-full flex-col gap-6 lg:w-[27rem] lg:shrink-0">
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
              <div
                className="flex flex-col divide-y rounded-2xl border px-4"
                style={{ borderColor: "rgba(0,0,0,0.08)", background: CREAM, color: INK }}
              >
                <LocationAutocompleteField
                  label="Pickup Location"
                  placeholder="Where should the driver pick you up?"
                  required
                  value={pickupLocation}
                  onChange={handlePickupChange}
                  onLocationSelected={handlePickupSelected}
                  bare
                />
                <LocationAutocompleteField
                  label="Drop-off Location"
                  placeholder="Where are you headed?"
                  required
                  value={dropoffLocation}
                  onChange={handleDropoffChange}
                  onLocationSelected={handleDropoffSelected}
                  bare
                />
              </div>
              <p className="text-[0.72rem] text-muted">
                Can&rsquo;t find the exact spot? Keep typing — we&rsquo;ll use exactly what you enter.
              </p>
            </div>

            {/* Map — right after Pickup/Drop-off below the `lg` breakpoint,
             * since that's the moment it has something to show; the desktop
             * column sits to the right instead (below). Only one of the two
             * call sites is ever actually mounted — see `isDesktop` above. */}
            {!isDesktop ? <MoveMapPanel pickup={pickupPoint} dropoff={dropoffPoint} /> : null}

            <div className="flex flex-col gap-2">
              <span className="text-[0.72rem] font-semibold tracking-[0.08em] text-mist uppercase">
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
                  className="h-12 rounded-2xl border px-4 text-[0.95rem] transition-colors duration-200 focus:outline-none"
                  style={{ borderColor: "rgba(0,0,0,0.08)", background: CREAM, color: INK }}
                />
              ) : null}
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="cargo-description"
                className="text-[0.72rem] font-semibold tracking-[0.08em] text-mist uppercase"
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
                style={{ borderColor: "rgba(0,0,0,0.08)", background: CREAM, color: INK }}
              />
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-[0.72rem] font-semibold tracking-[0.08em] text-mist uppercase">
                Want SmartLoad™ to Help?
              </span>
              <p className="text-[0.8rem] text-muted">
                Upload a photo and let AI suggest the right truck — or choose one yourself.
              </p>
              <div className="flex gap-2.5">
                <SegmentButton label="Yes, use AI" active={aiChoice === "yes"} onClick={() => handleAiChoice("yes")} />
                <SegmentButton label="No, I'll choose" active={aiChoice === "no"} onClick={() => handleAiChoice("no")} />
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
                      <p className="flex items-start gap-2 text-[0.8rem]" style={{ color: AMBER }}>
                        <Sparkles className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                        {photoError}
                      </p>
                    ) : null}
                  </>
                ) : null}

                <div className="flex flex-col gap-2">
                  <span className="text-[0.72rem] font-semibold tracking-[0.08em] text-mist uppercase">
                    Cargo Type
                  </span>
                  <p className="text-[0.8rem] text-muted">
                    {aiChoice === "yes"
                      ? "AI is on. Pick the cargo, then SmartLoad suggests a truck. You can still change it."
                      : "You'll choose the truck yourself. Pick the cargo first."}
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
                            borderColor: active ? AMBER_BORDER : "rgba(0,0,0,0.08)",
                            background: active ? AMBER_FILL : CREAM,
                          }}
                        >
                          <span
                            className={cn("grid size-11 shrink-0 place-items-center rounded-xl text-white", !reducedMotion && "icon-drive")}
                            style={{ background: AMBER, animationDelay: reducedMotion ? undefined : `${index * 0.25}s` }}
                          >
                            <Icon className="size-5" aria-hidden />
                          </span>
                          <span>
                            <span className="block text-[0.85rem] font-semibold" style={{ color: INK }}>
                              {CATEGORY_DISPLAY[category.title]}
                            </span>
                            <span className="mt-0.5 block text-[0.75rem]" style={{ color: MUTED }}>
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
                  <div className="rounded-2xl border border-white/10 bg-black px-4 py-3.5">
                    <p
                      className="text-[0.65rem] font-semibold tracking-[0.15em] uppercase"
                      style={{ color: AMBER }}
                    >
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

            {/* Stage 4 — optional loading help, as soon as a truck size is picked */}
            {vehicleSize ? (
              <>
                <div className="flex flex-col gap-2">
                  <span className="text-[0.72rem] font-semibold tracking-[0.08em] text-mist uppercase">
                    Need Help Loading?
                  </span>
                  <p className="text-[0.8rem] text-muted">
                    Want an assistant to help load your items? We can arrange extra hands.
                  </p>
                  <div className="flex gap-2.5">
                    <SegmentButton
                      label="Yes"
                      active={needsAssistant === "yes"}
                      onClick={() => handleAssistantChoice("yes")}
                    />
                    <SegmentButton
                      label="No"
                      active={needsAssistant === "no"}
                      onClick={() => handleAssistantChoice("no")}
                    />
                  </div>
                </div>

                {needsAssistant === "yes" ? (
                  <div className="flex flex-col gap-2">
                    <span className="text-[0.72rem] font-semibold tracking-[0.08em] text-mist uppercase">
                      How Many Assistants?
                    </span>
                    <div className="grid grid-cols-2 gap-2.5">
                      {LOADING_ASSISTANT_COUNTS.map((count) => {
                        const active = assistantCount === count.title;
                        return (
                          <button
                            key={count.title}
                            type="button"
                            onClick={() => setAssistantCount(count.title)}
                            aria-pressed={active}
                            className="flex flex-col items-start gap-2.5 rounded-2xl border p-4 text-left transition-colors duration-200"
                            style={{
                              borderColor: active ? AMBER_BORDER : "rgba(0,0,0,0.08)",
                              background: active ? AMBER_FILL : CREAM,
                            }}
                          >
                            <span className="grid size-11 shrink-0 place-items-center rounded-xl text-white" style={{ background: AMBER }}>
                              <Users className="size-5" aria-hidden />
                            </span>
                            <span className="block text-[0.85rem] font-semibold" style={{ color: INK }}>
                              {count.title} assistant{count.title === "1" ? "" : "s"}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
              </>
            ) : null}

            {error ? (
              <p
                role="alert"
                className="rounded-2xl border px-4 py-3 text-[0.85rem]"
                style={{ borderColor: AMBER_BORDER, background: AMBER_FILL, color: INK }}
              >
                {error}
              </p>
            ) : null}

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              style={{ background: canSubmit && !submitting ? AMBER : undefined }}
              disabled={!canSubmit || submitting}
            >
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

        {isDesktop ? (
          <div className="lg:sticky lg:top-28 lg:flex-1 lg:self-start">
            <MoveMapPanel pickup={pickupPoint} dropoff={dropoffPoint} className="h-[42rem]" />
          </div>
        ) : null}
        </div>
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
      className="h-11 flex-1 rounded-2xl border text-[0.85rem] font-semibold transition-colors duration-200"
      style={{
        borderColor: active ? AMBER : "rgba(0,0,0,0.08)",
        background: active ? AMBER : CREAM,
        color: INK,
      }}
    >
      {label}
    </button>
  );
}

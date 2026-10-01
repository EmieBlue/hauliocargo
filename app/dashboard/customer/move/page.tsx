"use client";

import { Container, Forklift, Loader2, Sparkles, Truck, Van } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { DashboardLoading, DashboardShell } from "@/components/auth/DashboardShell";
import { TextField } from "@/components/auth/TextField";
import { CargoPhotoUpload } from "@/components/dashboard/CargoPhotoUpload";
import { LocationAutocompleteField } from "@/components/dashboard/LocationAutocompleteField";
import { TruckSizePicker } from "@/components/dashboard/TruckSizePicker";
import { Button } from "@/components/ui/Button";
import { analyzeCargoPhoto, createBooking, uploadCargoPhoto } from "@/lib/bookings";
import { cn } from "@/lib/cn";
import { CARGO_CATEGORIES, ROUTES } from "@/lib/site";
import { useRequireRole } from "@/lib/useRequireRole";
import { useSettledReducedMotion } from "@/lib/useSettledReducedMotion";

type When = "now" | "later";
type AiChoice = "yes" | "no" | null;
type Category = (typeof CARGO_CATEGORIES)[number]["title"];

// Same order as CARGO_CATEGORIES in lib/site.ts. Truck-family icons rather
// than CargoScene's generic category icons (Boxes/Sofa/Building2/Hammer) —
// Uber-picker style. Plain `Truck` alone for all four was considered and
// dropped: `Truck` is already the icon for "Move With You" itself one level
// up (the customer dashboard's quick actions, and the homepage's SmartLoad
// teaser), so every option would both collide with that and look identical
// apart from the label.
const CATEGORY_ICONS: LucideIcon[] = [Van, Truck, Container, Forklift];

/**
 * "Move With You" — the ride-along booking form. Modeled on Uber's own
 * public ride page (pickup/dropoff/"pickup now" + a single request button,
 * no live map), adapted to cargo.
 *
 * Everything after "What Are You Moving?" is a short step-by-step flow: a
 * Yes/No question on whether to let SmartLoad™'s AI suggest a cargo type +
 * truck size from a photo, then either path lands on the same truck-size
 * guide (10ft/15ft/20ft/26ft, captions specific to the cargo type) — that's
 * the real final answer on the booking.
 *
 * Both paths always resolve a cargo type now — the size guide's captions
 * are type-specific (see `TRUCK_SIZE_GUIDE` in lib/site.ts), so there's no
 * guide to show without one. The AI path tries to get both from one photo;
 * if it only manages the size (or neither), the cargo-type grid appears as
 * a fallback so the customer is never stuck.
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
  const [smartLoadNote, setSmartLoadNote] = useState<string | null>(null);
  // Whether smartLoadNote describes an actual suggestion (shown as the
  // bannered "SmartLoad Suggestion" callout) vs. a genuine failure — a
  // dropped API call or an inconclusive photo (plain muted/brand text,
  // same as before; dressing a non-result up as a "suggestion" would be
  // misleading).
  const [smartLoadHasSuggestion, setSmartLoadHasSuggestion] = useState(false);
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
    setSmartLoadNote(null);
    setSmartLoadHasSuggestion(false);
  }

  async function handlePhotoSelected(file: File | null) {
    setCargoPhoto(file);
    setSmartLoadNote(null);
    setSmartLoadHasSuggestion(false);
    setVehicleCategory(null);
    setVehicleSize(null);
    if (!file) return;

    setAnalyzing(true);
    const result = await analyzeCargoPhoto(file);
    setAnalyzing(false);

    if (!result.ok) {
      setSmartLoadNote(result.message);
      setSmartLoadHasSuggestion(false);
      return;
    }

    const { category, size } = result.data;
    if (category) setVehicleCategory(category as Category);
    if (size) setVehicleSize(size);

    if (category && size) {
      setSmartLoadNote(`SmartLoad™ suggests ${category} — a ${size} truck. Tap a different size below to change it.`);
      setSmartLoadHasSuggestion(true);
    } else if (category) {
      setSmartLoadNote(`SmartLoad™ suggests ${category}, but wasn't sure on a size — please choose below.`);
      setSmartLoadHasSuggestion(true);
    } else if (size) {
      setSmartLoadNote(`SmartLoad™ suggests a ${size} truck — please confirm what you're moving below to see the full guide.`);
      setSmartLoadHasSuggestion(true);
    } else {
      setSmartLoadNote("SmartLoad™ wasn't sure from that photo — please choose below.");
      setSmartLoadHasSuggestion(false);
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (submitting) return;
    setError(null);

    if (!pickupLocation.trim() || !dropoffLocation.trim()) {
      setError("Please enter both a pickup and drop-off location.");
      return;
    }
    if (!cargoDescription.trim()) {
      setError("Let us know what you're moving.");
      return;
    }
    if (!aiChoice) {
      setError("Please answer the SmartLoad™ question above.");
      return;
    }
    if (!vehicleCategory) {
      setError("Please choose what you're moving.");
      return;
    }
    if (!vehicleSize) {
      setError("Please choose a truck size.");
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

  if (submitted) {
    return (
      <DashboardShell>
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

  // Manual path: the grid is always the first thing shown. AI path: it's a
  // fallback, shown only once the photo's been analyzed and SmartLoad™
  // still doesn't have a category to work with.
  const showCategoryGrid =
    aiChoice === "no" || (aiChoice === "yes" && cargoPhoto !== null && !analyzing && !vehicleCategory);

  return (
    <DashboardShell>
      <div className="flex w-full max-w-xl flex-col gap-6">
        <Link
          href={ROUTES.dashboardCustomer}
          className="self-start text-[0.8rem] font-medium text-muted transition-colors duration-200 hover:text-brand"
        >
          ← Back to dashboard
        </Link>

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
              <ToggleButton label="Now" active={when === "now"} onClick={() => setWhen("now")} />
              <ToggleButton label="Schedule" active={when === "later"} onClick={() => setWhen("later")} />
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

          <TextField
            label="What Are You Moving?"
            placeholder="e.g. 2-bedroom household move, sofa and boxes"
            required
            value={cargoDescription}
            onChange={(e) => setCargoDescription(e.target.value)}
          />

          <div className="flex flex-col gap-2">
            <span className="font-display text-[0.72rem] font-semibold tracking-[0.08em] text-mist uppercase">
              Want SmartLoad™ to Help?
            </span>
            <p className="text-[0.8rem] text-muted">
              Upload a photo and let AI suggest the right truck — or choose one yourself.
            </p>
            <div className="flex gap-2.5">
              <ToggleButton label="Yes, use AI" active={aiChoice === "yes"} onClick={() => handleAiChoice("yes")} />
              <ToggleButton label="No, I&rsquo;ll choose" active={aiChoice === "no"} onClick={() => handleAiChoice("no")} />
            </div>
          </div>

          {aiChoice === "yes" ? (
            <>
              <CargoPhotoUpload onFileSelected={handlePhotoSelected} />
              {analyzing ? (
                <p className="flex items-center gap-2 text-[0.8rem] text-muted">
                  <Loader2 className="size-3.5 animate-spin" aria-hidden />
                  SmartLoad™ is looking at your photo…
                </p>
              ) : smartLoadNote && smartLoadHasSuggestion ? (
                // A real result — dressed up as a proper callout rather than
                // a plain line, pinned dark regardless of site theme (same
                // reasoning as Footer/CargoScene/the dashboard photo card:
                // this needs to read consistently as "a highlighted note,"
                // not blend into whichever theme the page happens to be in).
                <div data-theme="dark" className="rounded-xl border border-edge/12 bg-ink-950 px-4 py-3.5">
                  <p className="font-display text-[0.65rem] font-semibold tracking-[0.15em] text-brand uppercase">
                    SmartLoad Suggestion
                  </p>
                  <p className="mt-1 text-[0.85rem] leading-relaxed text-white/90">{smartLoadNote}</p>
                </div>
              ) : smartLoadNote ? (
                // A genuine failure (the call itself failed, or nothing was
                // found) — not a result, so it stays plain text rather than
                // being presented as a "suggestion" that didn't happen.
                <p className="flex items-start gap-2 text-[0.8rem] text-brand">
                  <Sparkles className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                  {smartLoadNote}
                </p>
              ) : null}
            </>
          ) : null}

          {showCategoryGrid ? (
            <CargoTypeGrid
              value={vehicleCategory}
              onChange={setVehicleCategory}
              reducedMotion={reducedMotion}
              hint={
                aiChoice === "yes"
                  ? "AI is on. Pick the cargo, then SmartLoad suggests a truck. You can still change it."
                  : undefined
              }
            />
          ) : null}

          {vehicleCategory ? (
            <TruckSizePicker category={vehicleCategory} value={vehicleSize} onChange={setVehicleSize} />
          ) : null}

          {error ? (
            <p role="alert" className="rounded-xl border border-brand/25 bg-brand/[0.06] px-4 py-3 text-[0.85rem] text-brand">
              {error}
            </p>
          ) : null}

          <Button type="submit" variant="primary" className="w-full" disabled={submitting}>
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

function ToggleButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
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

function CargoTypeGrid({
  value,
  onChange,
  reducedMotion,
  hint,
}: {
  value: Category | null;
  onChange: (category: Category) => void;
  reducedMotion: boolean;
  /** Only passed on the AI-path fallback — not true on the manual path. */
  hint?: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="font-display text-[0.72rem] font-semibold tracking-[0.08em] text-mist uppercase">
        Cargo Type
      </span>
      {hint ? <p className="text-[0.8rem] text-muted">{hint}</p> : null}
      {/* Pinned light, same as the reference image — these cards are always
       * white/cream regardless of the site's own theme toggle, same
       * data-theme pinning technique used everywhere else on this site for
       * "this surface must always look like X" (Footer, CargoScene, the
       * SmartLoad banner above), just the light-pinned direction instead of
       * the usual dark one. The existing bg-ink-950/border-edge/text-fg
       * classes below already resolve correctly from this pin alone — no
       * class changes needed, only the attribute. */}
      <div data-theme="light" className="grid gap-2.5 sm:grid-cols-2">
        {CARGO_CATEGORIES.map((category, index) => {
          const Icon = CATEGORY_ICONS[index];
          const active = value === category.title;
          return (
            <button
              key={category.title}
              type="button"
              onClick={() => onChange(category.title)}
              aria-pressed={active}
              className={cn(
                "flex flex-col items-center gap-2.5 rounded-xl border px-4 py-4 text-center transition-colors duration-200",
                // `bg-brand/[0.06]` (a transparent wash) was fine when this
                // sat on the page's own theme-reactive backdrop, but it has
                // no solid base — now that the card is pinned light, a
                // selected card shows the dark photo backdrop bleeding
                // through instead of a white card. `color-mix` against the
                // pinned ink-950 base gives a solid, always-opaque tint
                // instead.
                active
                  ? "border-brand bg-[color-mix(in_oklab,var(--color-brand)_8%,var(--color-ink-950))]"
                  : "border-edge/12 bg-ink-950 hover:border-brand/40",
              )}
            >
              {/* Brand-yellow chip is a fixed color regardless of theme. The
               * card itself is now always presented in the light-theme
               * visual language (see the pin above), so the icon
               * consistently uses the light-theme contrast rule too
               * (white-on-yellow) rather than branching on the site's real
               * theme — same white/black contrast rule as QuickAction's icon
               * chips on the customer dashboard home and CargoScene on the
               * marketing site, just fixed to one side of it here. */}
              <span
                className={cn(
                  "grid size-12 shrink-0 place-items-center rounded-xl bg-brand text-white",
                  !reducedMotion && "icon-drive",
                )}
                style={reducedMotion ? undefined : { animationDelay: `${index * 0.25}s` }}
              >
                <Icon className="size-6" aria-hidden />
              </span>
              <span className="text-[0.85rem] font-semibold text-fg">{category.title}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

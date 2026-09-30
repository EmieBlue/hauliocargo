"use client";

import { Loader2, Sparkles } from "lucide-react";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { DashboardLoading, DashboardShell } from "@/components/auth/DashboardShell";
import { TextField } from "@/components/auth/TextField";
import { CargoPhotoUpload } from "@/components/dashboard/CargoPhotoUpload";
import { LocationAutocompleteField } from "@/components/dashboard/LocationAutocompleteField";
import { Button } from "@/components/ui/Button";
import { analyzeCargoPhoto, createBooking, uploadCargoPhoto } from "@/lib/bookings";
import { cn } from "@/lib/cn";
import { CARGO_CATEGORIES, ROUTES } from "@/lib/site";
import { useRequireRole } from "@/lib/useRequireRole";

type When = "now" | "later";

/**
 * "Move With You" — the ride-along booking form. Modeled on Uber's own
 * public ride page (pickup/dropoff/"pickup now" + a single request button,
 * no live map — that only shows up post-booking in their real app, and
 * this project has no mapping service integrated yet either), adapted to
 * cargo: what's being moved and what size vehicle it needs, instead of a
 * passenger seat count.
 */
export default function MoveWithYouPage() {
  const { loading } = useRequireRole("customer");

  const [pickupLocation, setPickupLocation] = useState("");
  const [dropoffLocation, setDropoffLocation] = useState("");
  const [when, setWhen] = useState<When>("now");
  const [scheduledFor, setScheduledFor] = useState("");
  const [cargoDescription, setCargoDescription] = useState("");
  const [vehicleCategory, setVehicleCategory] = useState<string | null>(null);
  const [cargoPhoto, setCargoPhoto] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [smartLoadNote, setSmartLoadNote] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (loading) return <DashboardLoading />;

  async function handlePhotoSelected(file: File | null) {
    setCargoPhoto(file);
    setSmartLoadNote(null);
    if (!file) return;

    setAnalyzing(true);
    const result = await analyzeCargoPhoto(file);
    setAnalyzing(false);

    if (!result.ok) {
      setSmartLoadNote(result.message);
      return;
    }
    if (result.data.category) {
      setVehicleCategory(result.data.category);
      setSmartLoadNote(`SmartLoad™ suggests ${result.data.category} — tap a different size below to change it.`);
    } else {
      setSmartLoadNote("SmartLoad™ wasn't sure from that photo — please choose a size below.");
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
    if (!vehicleCategory) {
      setError("Please choose a vehicle size.");
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
          <h1 className="text-[clamp(1.8rem,3.6vw,2.4rem)] font-extrabold tracking-[-0.02em] text-fg">
            Move With You
          </h1>
          <p className="mt-3 text-[0.95rem] leading-relaxed text-muted">
            You&rsquo;ll travel with the driver and your cargo all the way to the destination.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <LocationAutocompleteField
            label="Pickup Location"
            placeholder="Where should the driver pick you up?"
            required
            value={pickupLocation}
            onChange={setPickupLocation}
          />
          <LocationAutocompleteField
            label="Drop-off Location"
            placeholder="Where are you headed?"
            required
            value={dropoffLocation}
            onChange={setDropoffLocation}
          />

          <div className="flex flex-col gap-2">
            <span className="font-display text-[0.72rem] font-semibold tracking-[0.08em] text-mist uppercase">
              When
            </span>
            <div className="flex gap-2.5">
              <WhenButton label="Now" active={when === "now"} onClick={() => setWhen("now")} />
              <WhenButton label="Schedule" active={when === "later"} onClick={() => setWhen("later")} />
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

          <CargoPhotoUpload onFileSelected={handlePhotoSelected} />

          {analyzing ? (
            <p className="flex items-center gap-2 text-[0.8rem] text-muted">
              <Loader2 className="size-3.5 animate-spin" aria-hidden />
              SmartLoad™ is looking at your photo…
            </p>
          ) : smartLoadNote ? (
            <p className="flex items-start gap-2 text-[0.8rem] text-brand">
              <Sparkles className="mt-0.5 size-3.5 shrink-0" aria-hidden />
              {smartLoadNote}
            </p>
          ) : null}

          <div className="flex flex-col gap-2">
            <span className="font-display text-[0.72rem] font-semibold tracking-[0.08em] text-mist uppercase">
              Vehicle Size
            </span>
            <div className="grid gap-2.5 sm:grid-cols-2">
              {CARGO_CATEGORIES.map((category) => (
                <button
                  key={category.title}
                  type="button"
                  onClick={() => setVehicleCategory(category.title)}
                  aria-pressed={vehicleCategory === category.title}
                  className={cn(
                    "rounded-xl border px-4 py-3 text-left text-[0.85rem] font-semibold text-fg transition-colors duration-200",
                    vehicleCategory === category.title
                      ? "border-brand bg-brand/[0.06]"
                      : "border-edge/12 bg-ink-950 hover:border-brand/40",
                  )}
                >
                  {category.title}
                </button>
              ))}
            </div>
          </div>

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

function WhenButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
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

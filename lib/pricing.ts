/**
 * Delivery pricing, in GH₵. Every price on the booking screens comes from
 * `quotePrice` below — nothing is typed in as a fixed amount.
 *
 * Per-km rates by truck size: 10ft 120, 15ft 150, 20ft 180, 26ft 220 (GH₵).
 *
 * PER-KG AND PER-M³ RATES ARE PLACEHOLDERS (2 and 50) — weight and volume
 * are optional on the booking form, so most customers won't see these at
 * all until real rates are set here.
 */
export const PRICING = {
  currency: "GH₵",
  baseFee: 2500,
  minimum: 4000,
  perAssistant: 50,
  perKg: 2,
  perM3: 50,
  perKm: {
    "10ft": 120,
    "15ft": 150,
    "20ft": 180,
    "26ft": 220,
  } as Record<string, number>,
} as const;

/** Assistant count as a number — the "4+" option is priced as 4. */
export function assistantCountValue(count: string | null): number {
  if (!count) return 0;
  return count === "4+" ? 4 : Number(count) || 0;
}

/** Assistant fee on its own, e.g. 2 assistants → 100. */
export function assistantFee(assistants: number): number {
  return assistants * PRICING.perAssistant;
}

/**
 * price = base fee + (km × rate for the truck size) + assistant fee
 *       + (weightKg × per-kg rate) + (volumeM3 × per-m³ rate),
 * then never below the minimum. Rounded to whole cedis.
 *
 * `weightKg`/`volumeM3` default to 0 — a customer who leaves them blank
 * gets exactly the distance + assistants price this had before.
 */
export function quotePrice(
  distanceKm: number,
  assistants: number,
  vehicleSize: string,
  weightKg = 0,
  volumeM3 = 0,
): number {
  const perKm = PRICING.perKm[vehicleSize] ?? PRICING.perKm["10ft"];
  const raw =
    PRICING.baseFee +
    distanceKm * perKm +
    assistantFee(assistants) +
    weightKg * PRICING.perKg +
    volumeM3 * PRICING.perM3;
  return Math.max(Math.round(raw), PRICING.minimum);
}

/** Straight-line distance in km — used only when the road route can't be fetched. */
export function straightLineKm(a: [number, number], b: [number, number]): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const [lng1, lat1] = a;
  const [lng2, lat2] = b;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

/** Whole-cedi display, e.g. "GH₵ 5,290". */
export function formatPrice(amount: number): string {
  return `${PRICING.currency} ${Math.round(amount).toLocaleString("en-US")}`;
}

/**
 * Delivery pricing, in GH₵. Every price on the booking screens comes from
 * `quotePrice` below — nothing is typed in as a fixed amount.
 *
 * PER-KM RATES ARE A PLACEHOLDER: all four sizes are 180 until the real
 * 10ft / 15ft / 20ft / 26ft rates are entered here.
 */
export const PRICING = {
  currency: "GH₵",
  baseFee: 2500,
  minimum: 4000,
  perAssistant: 50,
  perKm: {
    "10ft": 180,
    "15ft": 180,
    "20ft": 180,
    "26ft": 180,
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
 * price = base fee + (km × rate for the truck size) + assistant fee,
 * then never below the minimum. Rounded to whole cedis.
 */
export function quotePrice(distanceKm: number, assistants: number, vehicleSize: string): number {
  const perKm = PRICING.perKm[vehicleSize] ?? PRICING.perKm["10ft"];
  const raw = PRICING.baseFee + distanceKm * perKm + assistantFee(assistants);
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

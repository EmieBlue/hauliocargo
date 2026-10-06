/**
 * PLACEHOLDER RATES — replace these with real numbers before customers rely
 * on the prices. Everything is in GH₵. Every price on the booking screens is
 * calculated from this one file.
 */
export const PRICING = {
  currency: "GH₵",
  baseFee: 30,
  perKm: {
    "10ft": 3,
    "15ft": 4,
    "20ft": 5,
    "26ft": 6,
  } as Record<string, number>,
  perAssistant: 40,
} as const;

export type PriceBreakdown = {
  base: number;
  distance: number;
  assistants: number;
  total: number;
};

/** Assistant count as a number — the "4+" option is priced as 4. */
export function assistantCountValue(count: string | null): number {
  if (!count) return 0;
  return count === "4+" ? 4 : Number(count) || 0;
}

export function calculatePrice({
  distanceKm,
  vehicleSize,
  assistantCount,
}: {
  distanceKm: number;
  vehicleSize: string;
  assistantCount: string | null;
}): PriceBreakdown {
  const perKm = PRICING.perKm[vehicleSize] ?? PRICING.perKm["10ft"];
  const base = PRICING.baseFee;
  const distance = Math.round(distanceKm * perKm * 100) / 100;
  const assistants = assistantCountValue(assistantCount) * PRICING.perAssistant;
  const total = Math.round((base + distance + assistants) * 100) / 100;
  return { base, distance, assistants, total };
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

export function formatPrice(amount: number): string {
  return `${PRICING.currency} ${amount.toFixed(2)}`;
}

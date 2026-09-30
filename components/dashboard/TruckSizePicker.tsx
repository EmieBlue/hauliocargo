"use client";

import { useId } from "react";
import { cn } from "@/lib/cn";
import { TRUCK_SIZES } from "@/lib/site";

type Size = "Small" | "Middle" | "Big";

/**
 * Three small flat-vector trucks, same brand palette as the hero's
 * `TruckSilhouette` (yellow box, dark chassis/cab) but far simpler — that
 * illustration is built for a large hero panel, not a compact selectable
 * card. All three share one viewBox; the truck itself occupies more of the
 * frame as size increases, which is what actually reads as "bigger" at a
 * glance rather than three same-sized trucks with different labels.
 *
 * Gradient ids are suffixed with a `useId()` value in the picker below —
 * without that, three copies on one page would collide on the same id.
 */
function TruckIllustration({ size, gradientId }: { size: Size; gradientId: string }) {
  // Each truck's box spans roughly this fraction of the 240-wide frame —
  // the core "reads as bigger" trick.
  const spans: Record<Size, { boxX: number; boxW: number; boxH: number; cabW: number; wheelR: number }> = {
    Small: { boxX: 92, boxW: 60, boxH: 34, cabW: 30, wheelR: 11 },
    Middle: { boxX: 56, boxW: 92, boxH: 42, cabW: 34, wheelR: 13 },
    Big: { boxX: 20, boxW: 128, boxH: 50, cabW: 38, wheelR: 15 },
  };
  const s = spans[size];
  const groundY = 96;
  const boxY = groundY - s.boxH - 8;
  const cabX = s.boxX + s.boxW;
  const cabY = groundY - s.cabW - 8;

  return (
    <svg viewBox="0 0 240 120" fill="none" aria-hidden className="h-auto w-full">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffcb45" />
          <stop offset="55%" stopColor="#f7b21d" />
          <stop offset="100%" stopColor="#d9930a" />
        </linearGradient>
      </defs>

      {/* Ground line */}
      <rect x="8" y={groundY + 8} width="224" height="2" rx="1" fill="currentColor" opacity="0.1" />

      {/* Chassis */}
      <rect x={s.boxX - 4} y={groundY - 2} width={cabX - s.boxX + s.cabW + 4 - (s.boxX - 4)} height="6" rx="2" fill="#121216" />

      {/* Cargo box */}
      <rect x={s.boxX} y={boxY} width={s.boxW} height={s.boxH} rx="3" fill={`url(#${gradientId})`} />
      <rect x={s.boxX} y={boxY} width={s.boxW} height="4" rx="1.5" fill="#b9bdc6" />

      {/* Cab */}
      <path
        d={`M${cabX} ${cabY + s.cabW * 0.25}
            h${s.cabW * 0.55} q8 0 8 8
            v${s.cabW * 0.75 - 8}
            h${-(s.cabW * 0.55 + 8)}
            Z`}
        fill="#e2e3e8"
      />
      <rect x={cabX + 4} y={cabY + s.cabW * 0.32} width={s.cabW * 0.4} height={s.cabW * 0.38} rx="2.5" fill="#3a4b60" />

      {/* Wheels */}
      {[s.boxX + s.boxW * 0.28, cabX + s.cabW * 0.6].map((cx, i) => (
        <g key={i}>
          <circle cx={cx} cy={groundY} r={s.wheelR} fill="#0b0b0d" />
          <circle cx={cx} cy={groundY} r={s.wheelR * 0.42} fill="#c8ccd4" />
        </g>
      ))}
    </svg>
  );
}

export function TruckSizePicker({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (size: string) => void;
}) {
  const idBase = useId();

  return (
    <div className="flex flex-col gap-2">
      <span className="font-display text-[0.72rem] font-semibold tracking-[0.08em] text-mist uppercase">
        Truck Size
      </span>
      <div className="grid gap-2.5 sm:grid-cols-3">
        {TRUCK_SIZES.map((size) => {
          const active = value === size.title;
          return (
            <button
              key={size.title}
              type="button"
              onClick={() => onChange(size.title)}
              aria-pressed={active}
              className={cn(
                "flex flex-col items-center gap-2 rounded-xl border px-3 py-3.5 text-center transition-colors duration-200",
                active ? "border-brand bg-brand/[0.06]" : "border-edge/12 bg-ink-950 hover:border-brand/40",
              )}
            >
              <div className="w-full max-w-32 text-fg">
                <TruckIllustration size={size.title as Size} gradientId={`${idBase}-${size.title}`} />
              </div>
              <span className="text-[0.85rem] font-semibold text-fg">{size.title}</span>
              <span className="text-[0.72rem] leading-snug text-muted">{size.body}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

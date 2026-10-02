"use client";

import { useId } from "react";
import { cn } from "@/lib/cn";
import { CARGO_CATEGORIES, TRUCK_SIZE_GUIDE, TRUCK_SIZES } from "@/lib/site";
import { useSettledReducedMotion } from "@/lib/useSettledReducedMotion";

type Size = "10ft" | "15ft" | "20ft" | "26ft";
type Category = (typeof CARGO_CATEGORIES)[number]["title"];

/**
 * Four vector trucks — cab, windshield, a diagonal gloss streak on the box.
 * Same brand palette as the hero's `TruckSilhouette` (yellow box, dark
 * chassis) — a brief detour through a page-specific amber got reverted; this
 * site has one real yellow (`--color-brand`), not a second shade for one
 * page.
 *
 * Wheels spin using `.wheel-spin` — the exact same class/keyframe the hero
 * truck's own wheels use (see app/globals.css and
 * components/three/TruckSilhouette.tsx) — reused rather than a second
 * "truck is moving" treatment. Gated behind `useSettledReducedMotion` like
 * every other motion effect on this project.
 *
 * All four share one viewBox; the truck occupies more of the frame as size
 * increases, which is what actually reads as "bigger" at a glance rather
 * than four same-sized trucks with different labels.
 *
 * Gradient ids are suffixed with a `useId()` value in the picker below —
 * without that, four copies on one page would collide on the same id.
 */
function TruckIllustration({ size, gradientId, animate }: { size: Size; gradientId: string; animate: boolean }) {
  const spans: Record<Size, { boxX: number; boxW: number; boxH: number; cabW: number; wheelR: number }> = {
    "10ft": { boxX: 112, boxW: 44, boxH: 28, cabW: 28, wheelR: 10 },
    "15ft": { boxX: 82, boxW: 70, boxH: 34, cabW: 32, wheelR: 12 },
    "20ft": { boxX: 48, boxW: 100, boxH: 42, cabW: 36, wheelR: 14 },
    "26ft": { boxX: 10, boxW: 138, boxH: 50, cabW: 40, wheelR: 16 },
  };
  const s = spans[size];
  const groundY = 96;
  const boxY = groundY - s.boxH - 10;
  const cabX = s.boxX + s.boxW;
  const cabH = s.boxH - 4;
  const cabY = groundY - cabH - 10;
  const nose = 8;
  const glassId = `${gradientId}-glass`;
  const wheelXs = [s.boxX + s.boxW * 0.22, cabX + s.cabW * 0.55];

  return (
    <svg viewBox="0 0 240 120" fill="none" aria-hidden className="h-auto w-full">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffd75e" />
          <stop offset="55%" stopColor="#f7b21d" />
          <stop offset="100%" stopColor="#d9930a" />
        </linearGradient>
        <linearGradient id={glassId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#8fb2d1" />
          <stop offset="100%" stopColor="#3a5978" />
        </linearGradient>
      </defs>

      {/* Ground */}
      <rect x="6" y={groundY + 9} width="228" height="2" rx="1" fill="currentColor" opacity="0.1" />

      {/* Chassis */}
      <rect x={s.boxX - 4} y={groundY - 3} width={cabX + s.cabW + 6 - (s.boxX - 4)} height="6" rx="2" fill="#17171a" />

      {/* Cargo box, with a diagonal gloss streak like the reference guide */}
      <rect x={s.boxX} y={boxY} width={s.boxW} height={s.boxH} rx="3" fill={`url(#${gradientId})`} />
      <path
        d={`M${s.boxX + s.boxW * 0.16} ${boxY} L${s.boxX + s.boxW * 0.32} ${boxY} L${s.boxX + s.boxW * 0.18} ${boxY + s.boxH} L${s.boxX + s.boxW * 0.02} ${boxY + s.boxH} Z`}
        fill="#ffffff"
        opacity="0.3"
      />
      <rect x={s.boxX} y={boxY} width={s.boxW} height="3.5" rx="1.5" fill="#00000020" />

      {/* Cab — rounded front corner (nose), flat back against the box */}
      <path
        d={`M${cabX} ${cabY}
            h${s.cabW - nose}
            a${nose} ${nose} 0 0 1 ${nose} ${nose}
            v${cabH - nose}
            h${-s.cabW}
            Z`}
        fill="#eef0f3"
        stroke="#00000014"
      />
      {/* Windshield, same diagonal-gloss language as the box */}
      <path
        d={`M${cabX + s.cabW * 0.3} ${cabY + 4}
            h${s.cabW * 0.52 - nose}
            a${nose} ${nose} 0 0 1 ${nose} ${nose}
            v${cabH * 0.4}
            h${-s.cabW * 0.52}
            Z`}
        fill={`url(#${glassId})`}
      />

      {/* Wheels — inner rim + hub spin, tire stays put (same rig as TruckSilhouette) */}
      {wheelXs.map((cx, i) => (
        <g key={i}>
          <circle cx={cx} cy={groundY} r={s.wheelR} fill="#121216" />
          <g className={animate ? "wheel-spin" : undefined}>
            <circle cx={cx} cy={groundY} r={s.wheelR * 0.5} fill="#c8ccd4" />
            {[0, 90, 180, 270].map((angle) => {
              const rad = (angle * Math.PI) / 180;
              return (
                <circle
                  key={angle}
                  cx={cx + Math.cos(rad) * s.wheelR * 0.26}
                  cy={groundY + Math.sin(rad) * s.wheelR * 0.26}
                  r={s.wheelR * 0.09}
                  fill="#121216"
                />
              );
            })}
          </g>
        </g>
      ))}
    </svg>
  );
}

export function TruckSizePicker({
  category,
  value,
  onChange,
}: {
  /** Which category's "Best for" captions to show — see `TRUCK_SIZE_GUIDE`. */
  category: Category;
  value: string | null;
  onChange: (size: string) => void;
}) {
  const idBase = useId();
  const reducedMotion = useSettledReducedMotion();
  const captions = TRUCK_SIZE_GUIDE[category];

  return (
    <div className="flex flex-col gap-2">
      <span className="font-display text-[0.72rem] font-semibold tracking-[0.08em] text-mist uppercase">
        Truck Size
      </span>
      {/* Pinned light, matching an earlier-approved fix — always white
       * regardless of the site's theme toggle, same data-theme pinning
       * technique used elsewhere on this site (Footer, CargoScene, the
       * Cargo Type grid right above this on Move With You). */}
      <div data-theme="light" className="grid grid-cols-2 gap-2.5">
        {TRUCK_SIZES.map((size, index) => {
          const active = value === size.title;
          return (
            <button
              key={size.title}
              type="button"
              onClick={() => onChange(size.title)}
              aria-pressed={active}
              className={cn(
                "flex flex-col items-center gap-2 rounded-xl border px-3 py-3.5 text-center transition-colors duration-200",
                active
                  ? "border-brand bg-[color-mix(in_oklab,var(--color-brand)_8%,var(--color-ink-950))]"
                  : "border-edge/12 bg-ink-950 hover:border-brand/40",
              )}
            >
              <div className="w-full max-w-32 text-fg">
                <TruckIllustration size={size.title as Size} gradientId={`${idBase}-${size.title}`} animate={!reducedMotion} />
              </div>
              <span className="text-[0.85rem] font-semibold text-fg">{size.title} truck</span>
              <span className="text-[0.72rem] leading-snug text-muted">Best for {captions[index]}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

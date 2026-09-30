"use client";

import { useId } from "react";
import { cn } from "@/lib/cn";
import { TRUCK_SIZES } from "@/lib/site";
import { useSettledReducedMotion } from "@/lib/useSettledReducedMotion";

type Size = "Small" | "Middle" | "Big";

/**
 * Three small vector trucks — cab, windshield, a diagonal gloss streak on
 * the box, closer to a real "truck size guide" illustration than the plain
 * boxes this started as (reference: a moving-company size-guide graphic the
 * user sent). Still the same brand palette as the hero's `TruckSilhouette`
 * (yellow box, dark chassis) rather than switching to the reference's plain
 * white — every other truck on this site is branded yellow, this one
 * shouldn't be the odd one out.
 *
 * Wheels spin using `.wheel-spin` — the exact same class/keyframe the hero
 * truck's own wheels use (see app/globals.css and
 * components/three/TruckSilhouette.tsx) — reused rather than inventing a
 * second "truck is moving" treatment. Gated behind `useSettledReducedMotion`
 * like every other motion effect on this project.
 *
 * All three share one viewBox; the truck occupies more of the frame as size
 * increases, which is what actually reads as "bigger" at a glance rather
 * than three same-sized trucks with different labels.
 *
 * Gradient ids are suffixed with a `useId()` value in the picker below —
 * without that, three copies on one page would collide on the same id.
 */
function TruckIllustration({ size, gradientId, animate }: { size: Size; gradientId: string; animate: boolean }) {
  const spans: Record<Size, { boxX: number; boxW: number; boxH: number; cabW: number; wheelR: number }> = {
    Small: { boxX: 100, boxW: 56, boxH: 32, cabW: 34, wheelR: 12 },
    Middle: { boxX: 62, boxW: 90, boxH: 40, cabW: 38, wheelR: 14 },
    Big: { boxX: 18, boxW: 130, boxH: 48, cabW: 42, wheelR: 16 },
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
  value,
  onChange,
}: {
  value: string | null;
  onChange: (size: string) => void;
}) {
  const idBase = useId();
  const reducedMotion = useSettledReducedMotion();

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
                <TruckIllustration size={size.title as Size} gradientId={`${idBase}-${size.title}`} animate={!reducedMotion} />
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

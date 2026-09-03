import { cn } from "@/lib/cn";

/**
 * Vector hauler used by the non-WebGL scene.
 *
 * Must stay in step with `TruckModel.tsx`: `AdaptiveScene` crossfades between
 * the two, and this is the *only* truck reduced-motion and low-tier devices
 * ever see. Same straight box body on a cab-over chassis — white cab, yellow
 * box standing behind it with nothing overhanging forward, wheels tucked just
 * under a dark side skirt.
 *
 * Laid out at 62px per world unit against `TruckModel`'s coordinates:
 * `svgX = 60 + (worldX + 3.9) * 62`, `svgY = 272 - worldY * 62`.
 */
export function TruckSilhouette({
  className,
  animateWheels = true,
}: {
  className?: string;
  animateWheels?: boolean;
}) {
  const wheelClass = animateWheels ? "wheel-spin" : undefined;

  return (
    <svg
      viewBox="0 0 620 290"
      fill="none"
      aria-hidden="true"
      className={cn("h-auto w-full", className)}
    >
      <defs>
        <linearGradient id="hc-box" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffcb45" />
          <stop offset="55%" stopColor="#f7b21d" />
          <stop offset="100%" stopColor="#d9930a" />
        </linearGradient>
        <linearGradient id="hc-cab" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f7f8fa" />
          <stop offset="65%" stopColor="#e2e3e8" />
          <stop offset="100%" stopColor="#c4c6cd" />
        </linearGradient>
        <linearGradient id="hc-glass" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#546b83" />
          <stop offset="100%" stopColor="#28384a" />
        </linearGradient>
        <radialGradient id="hc-underglow">
          <stop offset="0%" stopColor="#ffaa00" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#ffaa00" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="hc-beam">
          <stop offset="0%" stopColor="#fff4d6" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#fff4d6" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Underglow pooling on the road */}
      <ellipse cx="290" cy="268" rx="245" ry="20" fill="url(#hc-underglow)" />

      {/* ---------- Chassis ---------- */}
      <rect x="76" y="217" width="424" height="14" rx="4" fill="#121216" />

      {/* ---------- Cargo box ----------
          A plain wall behind the cab; nothing overhangs forward above it. */}
      <rect x="82" y="52" width="288" height="155" rx="4" fill="url(#hc-box)" />

      {/* Livery */}
      <text
        x="108"
        y="122"
        fill="#0d0d10"
        fontSize="32"
        fontWeight="800"
        letterSpacing="0.4"
        fontFamily="system-ui, 'Segoe UI', Roboto, Arial, sans-serif"
      >
        HAULIOCARGO
      </text>
      <rect x="109" y="133" width="118" height="3" fill="#0d0d10" />
      <text
        x="109"
        y="154"
        fill="#0d0d10"
        fontSize="12"
        fontWeight="600"
        fontFamily="system-ui, 'Segoe UI', Roboto, Arial, sans-serif"
      >
        CARGO &amp; TRUCK BOOKING
      </text>

      {/* Aluminium rails — without these the box is a plain rectangle */}
      <rect x="80" y="52" width="292" height="6" rx="2" fill="#b9bdc6" />
      <rect x="80" y="199" width="292" height="8" rx="2" fill="#b9bdc6" />
      {/* Rear corner post */}
      <rect x="82" y="52" width="6" height="155" fill="#b9bdc6" />

      {/* Side skirt — the strongest horizontal line, tying box to chassis */}
      <rect x="84" y="207" width="284" height="13" rx="3" fill="#121216" />

      {/* Rear: tail light and underrun bar on its brackets */}
      <rect x="74" y="176" width="8" height="22" rx="3" fill="#ffaa00" />
      <rect x="86" y="220" width="6" height="18" fill="#121216" />
      <rect x="70" y="235" width="32" height="9" rx="4" fill="#121216" />

      {/* ---------- Cab ---------- */}
      <path
        d="M373 117h107c11 0 20 9 20 20v85c0 9-7 16-16 16h-111V117Z"
        fill="url(#hc-cab)"
      />
      <path
        d="M373 117h107c11 0 20 9 20 20v85c0 9-7 16-16 16h-111V117Z"
        stroke="#ffffff"
        strokeOpacity="0.35"
      />

      {/* Windscreen filling the flat front, and door glass behind it */}
      <path d="M466 129h20c7 0 12 6 12 13v34h-44l12-47Z" fill="url(#hc-glass)" />
      <rect x="392" y="129" width="62" height="47" rx="5" fill="url(#hc-glass)" />
      {/* Interior hint */}
      <rect x="408" y="152" width="18" height="24" rx="3" fill="#4a4f5a" />

      {/* Door shut line + handle */}
      <rect x="386" y="178" width="2.5" height="54" rx="1.25" fill="#b9bdc6" />
      <rect x="400" y="188" width="18" height="6" rx="3" fill="#121216" />
      {/* Wing mirror */}
      <rect x="494" y="122" width="6" height="16" rx="3" fill="#121216" />
      <rect x="496" y="132" width="9" height="24" rx="4" fill="#121216" />

      {/* ---------- Front end ---------- */}
      {/* Bumper */}
      <rect x="496" y="214" width="24" height="28" rx="7" fill="#121216" />
      <rect x="502" y="222" width="14" height="9" rx="2" fill="#e8e8ec" />
      {/* Grille slot */}
      <rect x="497" y="188" width="21" height="8" rx="3" fill="#121216" />
      {/* Headlight, indicator and the light thrown */}
      <ellipse cx="546" cy="208" rx="36" ry="15" fill="url(#hc-beam)" />
      <rect x="512" y="202" width="13" height="13" rx="3" fill="#fff4d6" />
      <rect x="512" y="190" width="13" height="8" rx="3" fill="#ff9d1c" />

      {/* ---------- Wheels ---------- */}
      {[193, 432].map((cx) => (
        <g key={cx}>
          {/* Mud flap behind the wheel */}
          <rect x={cx - 46} y="238" width="7" height="28" rx="2" fill="#121216" />
          {/* Arch over the front wheel; the rear sits under the skirt */}
          {cx > 300 ? (
            <path
              d={`M${cx - 38} 242a38 38 0 0 1 76 0h-10a28 28 0 0 0-56 0Z`}
              fill="#121216"
            />
          ) : null}
          <circle cx={cx} cy="242" r="30" fill="#0b0b0d" />
          <circle cx={cx} cy="242" r="30" stroke="#ffffff" strokeOpacity="0.09" />
          <g className={wheelClass}>
            <circle cx={cx} cy="242" r="18.5" fill="#c8ccd4" />
            {/* Six recessed holes — what makes the rotation legible */}
            {[0, 60, 120, 180, 240, 300].map((angle) => {
              const radians = (angle * Math.PI) / 180;
              return (
                <circle
                  key={angle}
                  cx={cx + Math.cos(radians) * 11.5}
                  cy={242 + Math.sin(radians) * 11.5}
                  r="3.6"
                  fill="#121216"
                />
              );
            })}
            <circle cx={cx} cy="242" r="5" fill="#e8ebef" />
          </g>
        </g>
      ))}
    </svg>
  );
}

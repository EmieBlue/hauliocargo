import { cn } from "@/lib/cn";

/** The mark alone — an abstract truck in motion. Inherits `currentColor`. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      className={cn("size-8", className)}
    >
      {/* Motion trails */}
      <rect x="0" y="10" width="6" height="2" rx="1" fill="currentColor" opacity="0.3" />
      <rect x="2" y="14.5" width="5" height="2" rx="1" fill="currentColor" opacity="0.5" />
      <rect x="0" y="19" width="7" height="2" rx="1" fill="currentColor" opacity="0.3" />

      {/* Cargo body */}
      <rect x="9" y="7.5" width="12" height="13" rx="2.5" fill="currentColor" />

      {/* Cab */}
      <path
        d="M21 11.5h3.7c.6 0 1.2.3 1.6.8l2.2 2.7c.3.4.5.9.5 1.4v4.1H21V11.5Z"
        fill="currentColor"
      />

      {/* Wheels */}
      <circle cx="13.5" cy="22" r="3" fill="currentColor" />
      <circle cx="24.5" cy="22" r="3" fill="currentColor" />
      <circle cx="13.5" cy="22" r="1.1" fill="#050505" />
      <circle cx="24.5" cy="22" r="1.1" fill="#050505" />
    </svg>
  );
}

type LogoProps = {
  className?: string;
  /** Hides the wordmark, leaving only the mark. */
  markOnly?: boolean;
};

export function Logo({ className, markOnly = false }: LogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark className="size-7 text-brand" />
      {markOnly ? (
        <span className="sr-only">HaulioCargo</span>
      ) : (
        <span className="font-display text-[1.05rem] leading-none font-extrabold tracking-[0.02em]">
          <span className="text-white">HAULIO</span>
          <span className="text-brand">CARGO</span>
        </span>
      )}
    </span>
  );
}

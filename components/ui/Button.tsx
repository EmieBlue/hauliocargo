import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md";

const BASE =
  "group/btn relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-xl font-display font-semibold uppercase tracking-[0.09em] whitespace-nowrap " +
  "transition-[transform,box-shadow,background-color,border-color,color] duration-300 ease-brand will-change-transform " +
  "hover:-translate-y-0.5 active:translate-y-0 active:duration-100";

const VARIANTS: Record<Variant, string> = {
  // Lift-on-hover reads as a brightness change, not a second yellow — there
  // is only one brand yellow (#ffaa00) in the system now.
  primary:
    "bg-brand text-black shadow-[0_8px_24px_-14px_rgba(255,170,0,0.9)] hover:brightness-110 hover:shadow-[0_16px_44px_-12px_rgba(255,170,0,0.65)]",
  secondary:
    "border border-brand/55 bg-brand/[0.04] text-white hover:border-brand hover:bg-brand/10 hover:text-brand hover:shadow-[0_16px_44px_-16px_rgba(255,170,0,0.5)]",
  ghost:
    "border border-white/12 bg-white/[0.02] text-mist hover:border-white/25 hover:bg-white/[0.06] hover:text-white",
};

const SIZES: Record<Size, string> = {
  sm: "h-11 px-5 text-[0.7rem]",
  md: "h-13 px-7 text-[0.78rem]",
};

type BaseProps = {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
};

type AnchorProps = BaseProps &
  Omit<ComponentPropsWithoutRef<"a">, keyof BaseProps> & { href: string };

type NativeButtonProps = BaseProps &
  Omit<ComponentPropsWithoutRef<"button">, keyof BaseProps> & {
    href?: never;
  };

export function Button(props: AnchorProps | NativeButtonProps) {
  const {
    variant = "primary",
    size = "md",
    className,
    children,
    ...rest
  } = props as BaseProps & Record<string, unknown>;

  const classes = cn(BASE, VARIANTS[variant], SIZES[size], className);

  const content = (
    <>
      {/* Light sweeps across the face on hover — the 3D "lift" cue. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 ease-brand group-hover/btn:translate-x-full"
      />
      <span className="relative flex items-center gap-2">{children}</span>
    </>
  );

  if (typeof props.href === "string") {
    return (
      <a {...(rest as ComponentPropsWithoutRef<"a">)} className={classes}>
        {content}
      </a>
    );
  }

  return (
    <button {...(rest as ComponentPropsWithoutRef<"button">)} className={classes}>
      {content}
    </button>
  );
}

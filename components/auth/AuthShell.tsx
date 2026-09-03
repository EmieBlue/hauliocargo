"use client";

import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";
import { AuthVisual } from "@/components/three/AuthVisual";
import { Logo } from "@/components/ui/Logo";
import { riseIn, staggerParent } from "@/lib/motion";
import { ROUTES } from "@/lib/site";
import { cn } from "@/lib/cn";

/**
 * The shared frame every auth screen mounts inside: form on the left (right
 * on desktop, full-width on mobile), the 3D visual on the right — the exact
 * split the brief asks for, minus reinventing layout per screen.
 *
 * On mobile the visual becomes a fixed-height band above the form rather
 * than vanishing — small enough that it never pushes the form below the
 * fold, per the "must not reduce readability" rule.
 */
export function AuthShell({
  eyebrow,
  title,
  subtitle,
  backHref,
  backLabel = "Back",
  children,
  wide = false,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  backHref?: string;
  backLabel?: string;
  children: ReactNode;
  /** Registration's forms run longer than sign-in's — a touch more room. */
  wide?: boolean;
}) {
  return (
    <div className="relative flex min-h-svh flex-col overflow-hidden bg-ink-950">
      <div
        aria-hidden
        className="absolute inset-0 -z-10 opacity-70"
        style={{
          background:
            "radial-gradient(1000px 560px at 78% 8%, rgba(255,170,0,0.08), transparent 62%), radial-gradient(700px 480px at 4% 92%, rgba(70,90,130,0.12), transparent 65%)",
        }}
      />
      <div aria-hidden className="grain-layer pointer-events-none absolute inset-0 -z-10 opacity-[0.15]" />

      <header className="container-page flex h-20 shrink-0 items-center justify-between">
        <a href={ROUTES.home} className="shrink-0 transition-opacity duration-300 hover:opacity-85">
          <Logo />
        </a>
        {backHref ? (
          <a
            href={backHref}
            className="inline-flex items-center gap-1.5 font-display text-[0.72rem] font-semibold tracking-[0.08em] text-mist uppercase transition-colors duration-200 hover:text-brand"
          >
            <ArrowLeft className="size-3.5" aria-hidden />
            {backLabel}
          </a>
        ) : null}
      </header>

      <div className="container-page flex flex-1 flex-col lg:grid lg:grid-cols-2 lg:items-center lg:gap-12">
        {/* Visual: a fixed band on mobile, a full column on desktop */}
        <div className="relative h-[220px] shrink-0 lg:order-2 lg:h-[560px]">
          <AuthVisual className="absolute inset-0" />
        </div>

        <div className="flex flex-1 items-center py-8 lg:order-1 lg:py-16">
          <motion.div
            variants={staggerParent(0.08, 0.05)}
            initial="hidden"
            animate="show"
            className={cn("mx-auto w-full", wide ? "max-w-xl" : "max-w-md")}
          >
            {eyebrow ? (
              <motion.span
                variants={riseIn}
                className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-3.5 py-1.5 font-display text-[0.62rem] font-semibold tracking-[0.18em] text-mist uppercase"
              >
                {eyebrow}
              </motion.span>
            ) : null}

            <motion.h1
              variants={riseIn}
              className="mt-5 text-[clamp(2rem,4.4vw,2.7rem)] leading-[1.04] font-extrabold tracking-[-0.02em] text-white"
            >
              {title}
            </motion.h1>

            {subtitle ? (
              <motion.p variants={riseIn} className="mt-3 text-[1rem] leading-relaxed text-muted text-pretty">
                {subtitle}
              </motion.p>
            ) : null}

            <motion.div variants={riseIn} className="mt-8">
              {children}
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

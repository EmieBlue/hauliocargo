"use client";

import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { VideoBackdrop } from "@/components/layout/VideoBackdrop";
import { Logo } from "@/components/ui/Logo";
import { riseIn, staggerParent } from "@/lib/motion";
import { ROUTES } from "@/lib/site";
import { cn } from "@/lib/cn";

/**
 * The shared frame every auth screen mounts inside: a single centered form
 * column over `VideoBackdrop`. No dedicated visual column any more — the
 * real video behind it replaced the old 3D truck illustration, which would
 * otherwise compete with it.
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
    <div className="relative flex min-h-svh flex-col overflow-hidden">
      <VideoBackdrop />

      <header className="container-page relative flex h-20 shrink-0 items-center justify-between">
        <Link href={ROUTES.homePage} className="shrink-0 transition-opacity duration-300 hover:opacity-85">
          <Logo />
        </Link>
        {backHref ? (
          <Link
            href={backHref}
            className="inline-flex items-center gap-1.5 font-display text-[0.72rem] font-semibold tracking-[0.08em] text-mist uppercase transition-colors duration-200 hover:text-brand"
          >
            <ArrowLeft className="size-3.5" aria-hidden />
            {backLabel}
          </Link>
        ) : null}
      </header>

      <div className="container-page flex flex-1 flex-col items-center justify-center py-8 lg:py-16">
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
  );
}

"use client";

import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { AuthVisual } from "@/components/three/AuthVisual";
import { VideoBackdrop } from "@/components/layout/VideoBackdrop";
import { Card } from "@/components/ui/Card";
import { Logo } from "@/components/ui/Logo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { riseIn, staggerParent } from "@/lib/motion";
import { ROUTES } from "@/lib/site";
import { useScrolled } from "@/lib/useScrolled";
import { cn } from "@/lib/cn";

/**
 * The shared frame every auth screen mounts inside: a single centered form
 * column over `VideoBackdrop`, form fields grouped in a `Card` for legibility
 * against the footage. `visual` opts a screen back into a two-column layout
 * with `AuthVisual` alongside the form — used only where a screen is dense
 * enough to want it (the customer/driver registration forms); everywhere
 * else stays video-only, since the illustration would otherwise compete with
 * the real footage behind it.
 */
export function AuthShell({
  eyebrow,
  title,
  subtitle,
  backHref,
  backLabel = "Back",
  children,
  wide = false,
  visual = false,
  formCard = true,
  align = "center",
}: {
  eyebrow?: string;
  title: ReactNode;
  subtitle?: string;
  backHref?: string;
  backLabel?: string;
  children: ReactNode;
  /** Registration's forms run longer than sign-in's — a touch more room. */
  wide?: boolean;
  /** Restore the AuthVisual column alongside the form. Off by default. */
  visual?: boolean;
  /**
   * Wrap the eyebrow/title/subtitle/children together in a `Card`. On by
   * default — off for register's role-picker screen, whose `RoleCard`s are
   * already `Card`s themselves; wrapping that in another `Card` would nest a
   * card inside a card.
   */
  formCard?: boolean;
  /** Horizontal placement of the content column when not `visual`. */
  align?: "center" | "left";
}) {
  const scrolled = useScrolled();

  return (
    <div className="relative flex min-h-svh flex-col overflow-hidden">
      <VideoBackdrop />

      {/* Same scroll-in dark panel Hero.tsx has on the home page — invisible
       * at rest, fades in once scrolling starts, pinned dark regardless of
       * site theme. The root wrapper is sized to the whole page (not just
       * one viewport), so `inset-0` here covers a long form all the way
       * down, not just the first screen. */}
      <div
        aria-hidden
        data-theme="dark"
        className={cn(
          "absolute inset-0 bg-ink-950/60 transition-opacity duration-500",
          scrolled ? "opacity-100" : "opacity-0",
        )}
      />

      {/* `fixed`, matching Navbar.tsx exactly — `sticky` looked right in
       * Chromium testing but doesn't actually stick in WebKit/Safari inside
       * this wrapper's `overflow-hidden` (confirmed live: the header just
       * scrolls away with the page). The content below adds top padding to
       * compensate for the header no longer taking up flow space. */}
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-60 transition-[background-color,backdrop-filter] duration-150 ease-brand",
          scrolled ? "bg-brand/90 backdrop-blur-md" : "bg-transparent",
        )}
      >
        <div className="container-page relative flex h-20 items-center justify-between gap-3">
          <Link href={ROUTES.homePage} className="shrink-0 transition-opacity duration-300 hover:opacity-85">
            <Logo dark={scrolled} />
          </Link>
          <div className="flex items-center gap-4">
            {backHref ? (
              <Link
                href={backHref}
                className={cn(
                  "inline-flex items-center gap-1.5 font-display text-[0.72rem] font-semibold tracking-[0.08em] uppercase transition-colors duration-200",
                  scrolled ? "text-black/70 hover:text-black" : "text-mist hover:text-brand",
                )}
              >
                <ArrowLeft className="size-3.5" aria-hidden />
                {backLabel}
              </Link>
            ) : null}
            <ThemeToggle dark={scrolled} />
          </div>
        </div>
      </header>

      <div
        className={cn(
          // pt- clears the now-fixed header (h-20 = 80px); pb- unchanged.
          "container-page flex flex-1 flex-col pt-28 pb-8 lg:pt-32 lg:pb-16",
          visual
            ? "lg:grid lg:grid-cols-2 lg:items-center lg:gap-12"
            : cn("justify-center", align === "left" ? "items-stretch" : "items-center"),
        )}
      >
        {visual ? (
          <div className="relative h-[220px] shrink-0 lg:order-2 lg:h-[560px]">
            <AuthVisual className="absolute inset-0" />
          </div>
        ) : null}

        <motion.div
          variants={staggerParent(0.08, 0.05)}
          initial="hidden"
          animate="show"
          className={cn(
            "w-full",
            wide ? "max-w-xl" : "max-w-md",
            align === "left" ? "" : "mx-auto",
            visual && "lg:order-1",
          )}
        >
          {(() => {
            const header = (
              <>
                {eyebrow ? (
                  <motion.span
                    variants={riseIn}
                    className="inline-flex items-center gap-2 rounded-full border border-brand/25 bg-brand/[0.06] px-3.5 py-1.5 font-display text-[0.62rem] font-semibold tracking-[0.18em] text-brand uppercase"
                  >
                    {eyebrow}
                  </motion.span>
                ) : null}

                <motion.h1
                  variants={riseIn}
                  className="mt-5 text-[clamp(2rem,4.4vw,2.7rem)] leading-[1.04] font-extrabold tracking-[-0.02em] text-fg"
                >
                  {title}
                </motion.h1>

                {subtitle ? (
                  <motion.p variants={riseIn} className="mt-3 text-[1rem] leading-relaxed text-muted text-pretty">
                    {subtitle}
                  </motion.p>
                ) : null}
              </>
            );

            if (formCard) {
              return (
                <Card tilt={false} className="p-6 sm:p-8">
                  {header}
                  <div className="mt-8">{children}</div>
                </Card>
              );
            }

            return (
              <>
                {header}
                <motion.div variants={riseIn} className="mt-8">
                  {children}
                </motion.div>
              </>
            );
          })()}
        </motion.div>
      </div>
    </div>
  );
}

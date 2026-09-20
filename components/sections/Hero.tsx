"use client";

import { motion } from "framer-motion";
import { ArrowRight, Truck } from "lucide-react";
import { EASE, riseIn, staggerParent } from "@/lib/motion";
import { BRAND, ROUTES, SECTION_IDS } from "@/lib/site";
import { cn } from "@/lib/cn";
import { useScrolled } from "@/lib/useScrolled";
import { Button } from "@/components/ui/Button";

/**
 * No background layers here — `VideoBackdrop` (mounted once at the page root,
 * see `app/page.tsx`) covers the whole page now, Hero included. Just content,
 * same as every other homepage section.
 */
export function Hero() {
  const scrolled = useScrolled();

  return (
    <section
      id={SECTION_IDS.home}
      className="relative flex min-h-[100svh] flex-col overflow-hidden"
    >
      {/* Panel starts partway down, roughly level with the badge below — the
       * sky/navbar area above it stays clear video, matching the request to
       * start "from where the badge is," not the very top of the section.
       * Fades in on scroll, in step with the navbar's own color change,
       * rather than sitting there from the first paint. */}
      <div
        aria-hidden
        className={cn(
          "absolute inset-x-0 top-28 bottom-0 bg-ink-950/60 transition-opacity duration-500 md:top-64",
          scrolled ? "opacity-100" : "opacity-0",
        )}
      />

      {/* --- Copy --- */}
      <div className="container-page relative flex flex-1 items-center pt-28 pb-[42svh] md:pt-32 lg:pb-32">
        <motion.div
          variants={staggerParent(0.11, 0.15)}
          initial="hidden"
          animate="show"
          className="flex w-full max-w-2xl flex-col items-center text-center lg:items-start lg:text-left"
        >
          <motion.span
            variants={riseIn}
            className="inline-flex items-center gap-2.5 rounded-full border border-white/12 bg-white/[0.04] px-4 py-2 font-display text-[0.63rem] font-semibold tracking-[0.2em] text-mist uppercase backdrop-blur-sm"
          >
            <Truck className="size-3.5 text-brand" aria-hidden />
            Smart cargo &amp; truck booking
          </motion.span>

          <motion.h1
            variants={riseIn}
            className="mt-7 text-[clamp(2.6rem,7.6vw,4.6rem)] leading-[0.97] font-extrabold tracking-[-0.035em]"
          >
            <span className="block text-white">{BRAND.heroLead}</span>
            <span className="block text-brand-gradient">{BRAND.heroAccent}</span>
          </motion.h1>

          <motion.p
            variants={riseIn}
            className="mt-6 max-w-md text-[clamp(1rem,1.9vw,1.15rem)] leading-relaxed text-muted text-pretty lg:max-w-lg"
          >
            {BRAND.heroSub}
          </motion.p>

          <motion.div
            variants={riseIn}
            className="mt-10 flex w-full flex-col gap-3.5 sm:w-auto sm:flex-row sm:items-center"
          >
            <Button href={ROUTES.book} variant="primary" className="w-full sm:w-auto">
              Book a Truck
              <ArrowRight className="size-4 transition-transform duration-300 ease-brand group-hover/btn:translate-x-1" aria-hidden />
            </Button>
            <Button href={ROUTES.register} variant="secondary" className="w-full sm:w-auto">
              Get Started
            </Button>
          </motion.div>
        </motion.div>
      </div>

      {/* --- Scroll cue --- */}
      <motion.a
        href={ROUTES.services}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 0.9, ease: EASE }}
        className="absolute bottom-7 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2.5 text-muted transition-colors duration-300 hover:text-brand lg:flex"
      >
        <span className="font-display text-[0.58rem] font-semibold tracking-[0.26em] uppercase">
          Scroll
        </span>
        <span className="relative h-10 w-px overflow-hidden bg-white/15">
          <motion.span
            className="absolute inset-x-0 top-0 h-4 bg-brand"
            animate={{ y: [-16, 40] }}
            transition={{ duration: 2.1, repeat: Infinity, ease: "easeInOut" }}
          />
        </span>
      </motion.a>
    </section>
  );
}

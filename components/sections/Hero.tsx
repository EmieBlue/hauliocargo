"use client";

import { motion } from "framer-motion";
import { ArrowRight, Truck } from "lucide-react";
import { EASE, riseIn, staggerParent } from "@/lib/motion";
import { BRAND, ROUTES, SECTION_IDS } from "@/lib/site";
import { Button } from "@/components/ui/Button";
import { useSettledReducedMotion } from "@/lib/useSettledReducedMotion";

export function Hero() {
  const reduced = useSettledReducedMotion();

  return (
    <section
      id={SECTION_IDS.home}
      className="relative isolate flex min-h-[100svh] flex-col overflow-hidden"
    >
      {/* --- Background depth: glows sit behind the video --- */}
      <div aria-hidden className="absolute inset-0 -z-30 bg-ink-950" />
      <div
        aria-hidden
        className="absolute inset-0 -z-30 opacity-70"
        style={{
          background:
            "radial-gradient(1100px 620px at 68% 30%, rgba(255,170,0,0.09), transparent 62%), radial-gradient(760px 520px at 10% 76%, rgba(70,90,130,0.14), transparent 65%)",
        }}
      />

      {/*
       * Real footage, full-bleed at every breakpoint (unlike the old 3D scene
       * it replaces, which only filled the section from `lg` up and sat in a
       * bottom band on mobile) — dropped when reduced motion is preferred,
       * same fallback contract as `AuthShell`.
       */}
      {!reduced ? (
        <video
          aria-hidden
          autoPlay
          muted
          loop
          playsInline
          className="pointer-events-none absolute inset-0 -z-20 size-full object-cover"
          src="/videos/haulio-bg.mp4"
        />
      ) : null}

      {/*
       * Legibility scrim — now always on, not just `lg`: the old scene only
       * sat under the copy on desktop, but the video is full-bleed everywhere,
       * so text needs the dark layer on every breakpoint now.
       */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-linear-to-r from-ink-950 via-ink-950/55 to-transparent"
      />
      <div aria-hidden className="absolute inset-0 -z-10 bg-ink-950/35" />
      <div aria-hidden className="grain-layer pointer-events-none absolute inset-0 -z-10 opacity-[0.15]" />

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

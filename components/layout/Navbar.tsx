"use client";

import { motion } from "framer-motion";
import { Menu } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { EASE } from "@/lib/motion";
import { NAV_LINKS, ROUTES } from "@/lib/site";
import { useScrolled } from "@/lib/useScrolled";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import { MobileMenu } from "./MobileMenu";

const SCROLLED_FAVICON = "/favicon-scrolled.png";

export function Navbar() {
  const scrolled = useScrolled();
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  // Swap the browser-tab favicon in step with the navbar's own color change.
  // Next's client runtime turns out to add a *second* set of icon `<link>`
  // elements sometime after mount (confirmed against a real production
  // build, not just dev — this isn't a dev/HMR artifact), so a one-time
  // capture-on-mount misses the ones that show up later and can never
  // restore them. Storing each element's own original href on itself (a
  // data attribute) instead is self-healing: whenever a not-yet-seen link
  // shows up while not scrolled, it gets its own original captured right
  // there, regardless of how many elements exist or when they appeared.
  useEffect(() => {
    const links = Array.from(
      document.querySelectorAll<HTMLLinkElement>(
        'link[rel="icon"], link[rel="apple-touch-icon"]',
      ),
    );
    // Capture each element's original the first time we ever see it —
    // regardless of the *current* scrolled state. Confirmed (by instrumenting
    // this effect against a real production build) that Next inserts a
    // second set of icon `<link>` elements sometime after mount, and that
    // insertion can land on a render where `scrolled` is already true. Gating
    // the capture on `!scrolled` meant those elements were never captured
    // before being overwritten, so they could never be restored again.
    links.forEach((link) => {
      if (!link.dataset.originalHref && !link.href.endsWith(SCROLLED_FAVICON)) {
        link.dataset.originalHref = link.href;
      }
    });
    links.forEach((link) => {
      if (scrolled) {
        link.href = SCROLLED_FAVICON;
      } else if (link.dataset.originalHref) {
        link.href = link.dataset.originalHref;
      }
    });
  }, [scrolled]);

  return (
    <>
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: EASE, delay: 0.1 }}
        className={cn(
          "fixed inset-x-0 top-0 z-60 transition-[background-color,backdrop-filter,border-color] duration-500 ease-brand",
          scrolled
            ? "border-b border-transparent bg-brand"
            : "border-b border-transparent bg-transparent",
        )}
      >
        <div className="container-page flex h-18 items-center justify-between gap-6 md:h-20">
          <a
            href={ROUTES.home}
            className="shrink-0 transition-opacity duration-300 hover:opacity-85"
          >
            <Logo dark={scrolled} />
          </a>

          <nav aria-label="Primary" className="hidden lg:block">
            <ul className="flex items-center gap-1">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className={cn(
                      "group relative inline-flex h-11 items-center px-3.5 text-[0.86rem] font-medium transition-colors duration-300",
                      scrolled ? "text-black/70 hover:text-black" : "text-mist hover:text-white",
                    )}
                  >
                    {link.label}
                    <span
                      aria-hidden
                      className={cn(
                        "absolute inset-x-3.5 bottom-2.5 h-px origin-left scale-x-0 transition-transform duration-300 ease-brand group-hover:scale-x-100",
                        scrolled ? "bg-black" : "bg-brand",
                      )}
                    />
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <a
              href={ROUTES.signin}
              className={cn(
                "hidden h-11 items-center px-3 font-display text-[0.72rem] font-semibold tracking-[0.09em] uppercase transition-colors duration-300 sm:inline-flex",
                scrolled ? "text-black/70 hover:text-black" : "text-mist hover:text-brand",
              )}
            >
              Sign In
            </a>

            {/*
             * Visibility lives on a wrapper, not on the Button. The Button's
             * own base class sets `inline-flex`, and Tailwind emits that after
             * `.hidden` — so `hidden` on the Button itself loses and the
             * button leaks onto small screens.
             */}
            <span className="hidden sm:block">
              <Button href={ROUTES.register} size="sm" variant={scrolled ? "dark" : "primary"}>
                Register
              </Button>
            </span>

            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
              aria-expanded={menuOpen}
              className={cn(
                "grid size-12 place-items-center rounded-xl border transition-colors duration-300 lg:hidden",
                scrolled
                  ? "border-black/15 bg-black/5 text-black/70 hover:border-black/30 hover:text-black"
                  : "border-white/10 bg-white/[0.03] text-mist hover:border-brand/40 hover:text-brand",
              )}
            >
              <Menu className="size-5" aria-hidden />
            </button>
          </div>
        </div>
      </motion.header>

      <MobileMenu open={menuOpen} onClose={closeMenu} />
    </>
  );
}

"use client";

import { motion } from "framer-motion";
import { Menu } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { EASE } from "@/lib/motion";
import { NAV_LINKS, ROUTES } from "@/lib/site";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import { MobileMenu } from "./MobileMenu";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 24);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  return (
    <>
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: EASE, delay: 0.1 }}
        className={cn(
          "fixed inset-x-0 top-0 z-60 transition-[background-color,backdrop-filter,border-color] duration-500 ease-brand",
          scrolled
            ? "border-b border-white/8 bg-ink-950/78 backdrop-blur-xl"
            : "border-b border-transparent bg-transparent",
        )}
      >
        <div className="container-page flex h-18 items-center justify-between gap-6 md:h-20">
          <a
            href={ROUTES.home}
            className="shrink-0 transition-opacity duration-300 hover:opacity-85"
          >
            <Logo />
          </a>

          <nav aria-label="Primary" className="hidden lg:block">
            <ul className="flex items-center gap-1">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="group relative inline-flex h-11 items-center px-3.5 text-[0.86rem] font-medium text-mist transition-colors duration-300 hover:text-white"
                  >
                    {link.label}
                    <span
                      aria-hidden
                      className="absolute inset-x-3.5 bottom-2.5 h-px origin-left scale-x-0 bg-brand transition-transform duration-300 ease-brand group-hover:scale-x-100"
                    />
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <a
              href={ROUTES.signin}
              className="hidden h-11 items-center px-3 font-display text-[0.72rem] font-semibold tracking-[0.09em] text-mist uppercase transition-colors duration-300 hover:text-brand sm:inline-flex"
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
              <Button href={ROUTES.register} size="sm">
                Register
              </Button>
            </span>

            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
              aria-expanded={menuOpen}
              className="grid size-12 place-items-center rounded-xl border border-white/10 bg-white/[0.03] text-mist transition-colors duration-300 hover:border-brand/40 hover:text-brand lg:hidden"
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

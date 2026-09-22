"use client";

import { motion } from "framer-motion";
import { Menu } from "lucide-react";
import Link from "next/link";
import { useCallback, useState } from "react";
import { cn } from "@/lib/cn";
import { EASE } from "@/lib/motion";
import { NAV_LINKS, ROUTES } from "@/lib/site";
import { useScrolled } from "@/lib/useScrolled";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import { MobileMenu } from "./MobileMenu";

export function Navbar() {
  const scrolled = useScrolled();
  const [menuOpen, setMenuOpen] = useState(false);

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
            <Link
              href={ROUTES.signin}
              className={cn(
                "hidden h-11 items-center px-3 font-display text-[0.72rem] font-semibold tracking-[0.09em] uppercase transition-colors duration-300 sm:inline-flex",
                scrolled ? "text-black/70 hover:text-black" : "text-mist hover:text-brand",
              )}
            >
              Sign In
            </Link>

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

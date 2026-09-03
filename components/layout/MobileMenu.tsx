"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useRef } from "react";
import { EASE } from "@/lib/motion";
import { NAV_LINKS, ROUTES } from "@/lib/site";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";

const FOCUSABLE = 'a[href], button:not([disabled])';

export function MobileMenu({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const panel = useRef<HTMLDivElement>(null);

  /* Scroll lock + Esc + focus trap, all torn down on close. */
  useEffect(() => {
    if (!open) return;

    document.body.dataset.scrollLocked = "true";
    const previouslyFocused = document.activeElement as HTMLElement | null;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab" || !panel.current) return;

      const items = Array.from(
        panel.current.querySelectorAll<HTMLElement>(FOCUSABLE),
      );
      if (items.length === 0) return;

      const first = items[0];
      const last = items[items.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    const focusTimer = window.setTimeout(
      () => panel.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus(),
      120,
    );

    return () => {
      delete document.body.dataset.scrollLocked;
      document.removeEventListener("keydown", handleKeyDown);
      window.clearTimeout(focusTimer);
      previouslyFocused?.focus?.();
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          ref={panel}
          role="dialog"
          aria-modal="true"
          aria-label="Main menu"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.32, ease: EASE }}
          className="fixed inset-0 z-70 flex flex-col bg-ink-950/97 backdrop-blur-xl lg:hidden"
        >
          <div
            aria-hidden
            className="absolute inset-0 opacity-60"
            style={{
              background:
                "radial-gradient(680px 420px at 78% 12%, rgba(255,192,43,0.13), transparent 65%)",
            }}
          />

          <div className="relative flex h-20 items-center justify-between px-5">
            <Logo />
            <button
              type="button"
              onClick={onClose}
              aria-label="Close menu"
              className="grid size-12 place-items-center rounded-xl border border-white/10 text-mist transition-colors duration-300 hover:border-brand/40 hover:text-brand"
            >
              <X className="size-5" aria-hidden />
            </button>
          </div>

          <nav className="relative flex flex-1 flex-col justify-center px-5">
            <ul className="flex flex-col">
              {NAV_LINKS.map((link, index) => (
                <motion.li
                  key={link.href}
                  initial={{ opacity: 0, x: -24 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.06 + index * 0.055, duration: 0.5, ease: EASE }}
                  className="border-b border-white/8"
                >
                  <a
                    href={link.href}
                    onClick={onClose}
                    className="flex min-h-16 items-center font-display text-2xl font-semibold text-white transition-colors duration-300 hover:text-brand"
                  >
                    {link.label}
                  </a>
                </motion.li>
              ))}
            </ul>
          </nav>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.34, duration: 0.5, ease: EASE }}
            className="relative flex flex-col gap-3 px-5 pt-6 pb-10"
          >
            <Button href={ROUTES.register} variant="primary" onClick={onClose}>
              Register
            </Button>
            <Button href={ROUTES.signin} variant="ghost" onClick={onClose}>
              Sign In
            </Button>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

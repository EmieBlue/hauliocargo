"use client";

import { AnimatePresence, motion } from "framer-motion";
import { LogOut, Package, User, UserCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { signOut } from "@/lib/auth";
import { cn } from "@/lib/cn";
import { ROUTES } from "@/lib/site";
import { getClient } from "@/lib/supabase";

/**
 * Replaces the old bare "Sign Out" header link. Self-contained: fetches its
 * own email (not threaded through every dashboard page's props) and owns
 * the sign-out-and-redirect logic that used to live in `DashboardShell`.
 * No dropdown primitive exists in this codebase yet, so open/outside-click/
 * Escape are hand-rolled here, the same way `MobileMenu` handles its own —
 * just a small positioned panel instead of a full-screen takeover.
 */
export function ProfileMenu({ dark = false }: { dark?: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = getClient();
    if (!supabase) return;
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
  }, []);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  async function handleSignOut() {
    await signOut();
    router.push(ROUTES.signin);
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label="Account menu"
        aria-expanded={open}
        className={cn(
          "grid size-10 shrink-0 place-items-center rounded-xl border transition-colors duration-300",
          dark
            ? "border-black/15 bg-black/5 text-black/70 hover:border-black/30 hover:text-black"
            : "border-edge/10 bg-edge/[0.03] text-mist hover:border-brand/40 hover:text-brand",
        )}
      >
        <User className="size-4.5" aria-hidden />
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.18 }}
            role="menu"
            className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-2xl border border-edge/10 bg-ink-950/95 shadow-[0_28px_70px_-40px_rgba(0,0,0,0.7)] backdrop-blur-xl"
          >
            <div className="border-b border-edge/8 px-4 py-3">
              <p className="truncate text-[0.82rem] text-muted">{email ?? "Signed in"}</p>
            </div>

            <div className="flex flex-col p-1.5">
              <MenuLink href={ROUTES.profile} icon={UserCircle} label="My Profile" onClick={() => setOpen(false)} />
              <MenuLink href={ROUTES.bookings} icon={Package} label="My Bookings" onClick={() => setOpen(false)} />
            </div>

            <div className="border-t border-edge/8 p-1.5">
              <button
                type="button"
                onClick={handleSignOut}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left font-display text-[0.78rem] font-semibold tracking-[0.04em] text-mist uppercase transition-colors duration-200 hover:bg-edge/[0.05] hover:text-brand"
              >
                <LogOut className="size-4" aria-hidden />
                Sign Out
              </button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function MenuLink({
  href,
  icon: Icon,
  label,
  onClick,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      role="menuitem"
      className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[0.85rem] font-medium text-fg transition-colors duration-200 hover:bg-edge/[0.05] hover:text-brand"
    >
      <Icon className="size-4 text-muted" aria-hidden />
      {label}
    </Link>
  );
}

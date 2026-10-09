"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Loader2, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { EASE } from "@/lib/motion";

export const DECLINE_REASONS = [
  "Too far from me",
  "My truck doesn't match",
  "Price is too low",
  "Timing doesn't work",
  "Other",
] as const;

export const CANCEL_REASONS = [
  "Vehicle trouble",
  "Running too late",
  "Can't reach the customer",
  "Changed my mind",
  "Other",
] as const;

/**
 * A checkbox popup asking why — used for both declining an open job and
 * cancelling an already-accepted one (same modal pattern as
 * components/ui/SignupDialog.tsx: overlay, Escape to close, focus on
 * open), since both are meant to actually be recorded, not just a silent
 * dismissal. See declineJob/cancelJob in lib/bookings.ts.
 */
export function ReasonDialog({
  open,
  busy,
  title,
  description,
  confirmLabel,
  reasons,
  onConfirm,
  onClose,
}: {
  open: boolean;
  busy: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  reasons: readonly string[];
  onConfirm: (reasons: string[]) => void;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {open ? (
        <Panel
          title={title}
          description={description}
          confirmLabel={confirmLabel}
          reasons={reasons}
          busy={busy}
          onConfirm={onConfirm}
          onClose={onClose}
        />
      ) : null}
    </AnimatePresence>
  );
}

function Panel({
  title,
  description,
  confirmLabel,
  reasons,
  busy,
  onConfirm,
  onClose,
}: {
  title: string;
  description: string;
  confirmLabel: string;
  reasons: readonly string[];
  busy: boolean;
  onConfirm: (reasons: string[]) => void;
  onClose: () => void;
}) {
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const titleId = useId();
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    panel.current?.querySelector<HTMLElement>("input,button")?.focus();

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [onClose]);

  function toggle(reason: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(reason)) next.delete(reason);
      else next.add(reason);
      return next;
    });
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25, ease: EASE }}
      className="fixed inset-0 z-90 grid place-items-center bg-black/75 p-5 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <motion.div
        ref={panel}
        initial={{ opacity: 0, y: 18, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.98 }}
        transition={{ duration: 0.4, ease: EASE }}
        onClick={(event) => event.stopPropagation()}
        className="relative w-full max-w-md rounded-2xl border border-edge/12 bg-ink-900 p-7"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 grid size-9 place-items-center rounded-lg text-muted transition-colors duration-200 hover:bg-edge/6 hover:text-fg"
        >
          <X className="size-4" aria-hidden />
        </button>

        <h2 id={titleId} className="font-display text-xl font-bold text-fg">
          {title}
        </h2>
        <p className="mt-2 text-[0.88rem] leading-relaxed text-muted">{description}</p>

        <div className="mt-5 flex flex-col gap-2.5">
          {reasons.map((reason) => {
            const isChecked = checked.has(reason);
            return (
              <label
                key={reason}
                className="flex cursor-pointer items-center gap-3 rounded-xl border border-edge/12 bg-ink-950 px-4 py-3 text-[0.88rem] text-fg transition-colors duration-200 hover:border-brand/30"
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggle(reason)}
                  className="size-4 shrink-0 accent-brand"
                />
                {reason}
              </label>
            );
          })}
        </div>

        <Button
          type="button"
          variant="primary"
          className="mt-6 w-full"
          disabled={checked.size === 0 || busy}
          onClick={() => onConfirm([...checked])}
        >
          {busy ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Submitting
            </>
          ) : (
            confirmLabel
          )}
        </Button>
      </motion.div>
    </motion.div>
  );
}

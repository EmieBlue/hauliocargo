"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, Loader2, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { EASE } from "@/lib/motion";
import { signupsEnabled, submitSignup, type SignupIntent } from "@/lib/supabase";
import { Button } from "@/components/ui/Button";

/*
 * Wording matters here. This collects an email for an early-access list — it
 * does not create an account, and there is no booking system behind it yet.
 * Nothing in this component may imply otherwise.
 */
const COPY: Record<SignupIntent, { title: string; body: string; done: string }> = {
  contact: {
    title: "Talk to us",
    body: "Leave your email and the HaulioCargo team will get back to you about your move.",
    done: "Thanks — we have your email and will be in touch.",
  },
  register: {
    title: "Join the early list",
    body: "Booking is not open yet. Leave your email and we will tell you the moment it is.",
    done: "You are on the list. We will email you when booking opens.",
  },
};

export function SignupDialog({
  intent,
  onClose,
}: {
  intent: SignupIntent | null;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {intent ? <Panel intent={intent} onClose={onClose} /> : null}
    </AnimatePresence>
  );
}

function Panel({
  intent,
  onClose,
}: {
  intent: SignupIntent;
  onClose: () => void;
}) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState<string | null>(null);
  const inputId = useId();
  const panel = useRef<HTMLDivElement>(null);
  const copy = COPY[intent];

  // Escape to dismiss, and hold the page still behind the panel.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    panel.current?.querySelector("input")?.focus();

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [onClose]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (state === "sending") return;

    setState("sending");
    setError(null);

    const result = await submitSignup(email, intent);
    if (result.ok) {
      setState("done");
    } else {
      setState("idle");
      setError(result.message);
    }
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
      aria-labelledby={`${inputId}-title`}
    >
      <motion.div
        ref={panel}
        initial={{ opacity: 0, y: 18, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.98 }}
        transition={{ duration: 0.4, ease: EASE }}
        onClick={(event) => event.stopPropagation()}
        className="relative w-full max-w-md rounded-2xl border border-white/12 bg-ink-900 p-7 md:p-8"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 grid size-9 place-items-center rounded-lg text-muted transition-colors duration-200 hover:bg-white/6 hover:text-white"
        >
          <X className="size-4" aria-hidden />
        </button>

        {state === "done" ? (
          <div className="flex flex-col items-center gap-4 py-6 text-center">
            <span className="grid size-12 place-items-center rounded-full border border-brand/30 bg-brand/10 text-brand">
              <Check className="size-5" aria-hidden />
            </span>
            <p className="text-[0.96rem] leading-relaxed text-mist text-pretty">
              {copy.done}
            </p>
          </div>
        ) : (
          <>
            <h2
              id={`${inputId}-title`}
              className="font-display text-2xl font-bold text-white"
            >
              {copy.title}
            </h2>
            <p className="mt-2.5 text-[0.94rem] leading-relaxed text-muted text-pretty">
              {copy.body}
            </p>

            {signupsEnabled ? (
              <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3">
                <label htmlFor={inputId} className="sr-only">
                  Email address
                </label>
                <input
                  id={inputId}
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  className="h-12 rounded-xl border border-white/12 bg-ink-950 px-4 text-[0.95rem] text-white placeholder:text-muted/70 focus:border-brand/50 focus:ring-2 focus:ring-brand/25 focus:outline-none"
                />
                <Button type="submit" variant="primary" className="w-full">
                  {state === "sending" ? (
                    <>
                      <Loader2 className="size-4 animate-spin" aria-hidden />
                      Sending
                    </>
                  ) : (
                    "Send"
                  )}
                </Button>
                {/* Only one brand yellow in the system now — no separate
                    "deep" shade to reach for. */}
                {error ? (
                  <p role="alert" className="text-[0.85rem] text-brand">
                    {error}
                  </p>
                ) : null}
              </form>
            ) : (
              <p className="mt-6 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3.5 text-[0.88rem] leading-relaxed text-muted">
                The sign-up list is not connected yet — check back shortly.
              </p>
            )}
          </>
        )}
      </motion.div>
    </motion.div>
  );
}

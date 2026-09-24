"use client";

import { ArrowUpRight, Compass, MessageSquare, UserPlus } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { ROUTES, SECTION_IDS } from "@/lib/site";
import type { SignupIntent } from "@/lib/supabase";
import { Card } from "@/components/ui/Card";
import { RevealGroup, RevealItem } from "@/components/ui/Reveal";
import { SignupDialog } from "@/components/ui/SignupDialog";
import { useTheme } from "@/lib/useTheme";
import { cn } from "@/lib/cn";

type Action = {
  id?: string;
  icon: LucideIcon;
  title: string;
  body: string;
  cta: string;
  /** Where the card goes. Exactly one of `href` or `intent`. */
  href?: string;
  /** Opens the early-access panel instead of navigating. */
  intent?: SignupIntent;
};

const ACTIONS: Action[] = [
  {
    id: SECTION_IDS.contact,
    icon: MessageSquare,
    title: "Contact Us",
    body: "Talk to the HaulioCargo team about a move, a quote, or anything you want to check first.",
    cta: "Start a conversation",
    intent: "contact",
  },
  {
    icon: UserPlus,
    title: "Register",
    body: "Create your account and start booking a truck.",
    cta: "Create your account",
    href: ROUTES.register,
  },
  {
    icon: Compass,
    title: "Know More",
    body: "See exactly how HaulioCargo works, from your first photo through to delivery.",
    cta: "See how it works",
    href: ROUTES.howItWorks,
  },
];

/**
 * Sits directly under the hero so the three primary actions are impossible to
 * miss. Reordering the page is a one-line change in `app/page.tsx`.
 */
export function ActionTrio() {
  const [intent, setIntent] = useState<SignupIntent | null>(null);
  const [theme] = useTheme();

  return (
    <section
      id={SECTION_IDS.getStarted}
      className="relative scroll-mt-24 border-t border-edge/6 py-20 md:py-28"
    >
      <div aria-hidden data-theme="dark" className="absolute inset-0 bg-ink-950/60" />
      <div className="container-page relative">
        <RevealGroup className="grid gap-5 md:grid-cols-3" stagger={0.12}>
          {ACTIONS.map(({ id, icon: Icon, title, body, cta, href, intent: cardIntent }) => (
            <RevealItem key={title} id={id} className="scroll-mt-28">
              <Card className="h-full">
                <CardBody href={href} onOpen={cardIntent ? () => setIntent(cardIntent) : undefined}>
                  <span
                    className={cn(
                      "grid size-12 place-items-center rounded-xl bg-brand transition-[filter] duration-500 group-hover/card:brightness-110",
                      theme === "light" ? "text-white" : "text-black",
                    )}
                  >
                    <Icon className="size-5" aria-hidden />
                  </span>

                  <div className="flex flex-col gap-2.5">
                    <h3 className="font-display text-xl font-bold text-fg">{title}</h3>
                    <p className="text-[0.94rem] leading-relaxed text-muted text-pretty">
                      {body}
                    </p>
                  </div>

                  <span className="mt-auto inline-flex items-center gap-2 pt-2 font-display text-[0.72rem] font-semibold tracking-[0.13em] text-brand uppercase">
                    {cta}
                    <ArrowUpRight
                      className="size-4 transition-transform duration-300 ease-brand group-hover/card:translate-x-0.5 group-hover/card:-translate-y-0.5"
                      aria-hidden
                    />
                  </span>
                </CardBody>
              </Card>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>

      <SignupDialog intent={intent} onClose={() => setIntent(null)} />
    </section>
  );
}

/**
 * A card is either a link or a button depending on what it does. Rendering a
 * button as an `<a href="#">` would lie to assistive tech about what happens
 * next, and rendering a navigation as a button would break open-in-new-tab.
 */
function CardBody({
  href,
  onOpen,
  children,
}: {
  href?: string;
  onOpen?: () => void;
  children: React.ReactNode;
}) {
  const shared = "flex h-full w-full flex-col gap-5 p-7 text-left md:p-8";

  if (onOpen) {
    return (
      <button type="button" onClick={onOpen} className={shared}>
        {children}
      </button>
    );
  }

  return (
    // `Link`, not a plain `<a>` — the Register card points at an internal
    // route and a plain anchor would force a full hard reload there (see
    // components/ui/Button.tsx for the same fix, same reasoning).
    <Link href={href ?? "#"} className={shared}>
      {children}
    </Link>
  );
}

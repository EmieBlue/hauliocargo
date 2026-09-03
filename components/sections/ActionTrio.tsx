import { ArrowUpRight, Compass, MessageSquare, UserPlus } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ROUTES, SECTION_IDS } from "@/lib/site";
import { Card } from "@/components/ui/Card";
import { RevealGroup, RevealItem } from "@/components/ui/Reveal";

type Action = {
  id?: string;
  icon: LucideIcon;
  title: string;
  body: string;
  cta: string;
  href: string;
};

const ACTIONS: Action[] = [
  {
    id: SECTION_IDS.contact,
    icon: MessageSquare,
    title: "Contact Us",
    body: "Talk to the HaulioCargo team about a move, a quote, or anything you want to check first.",
    cta: "Start a conversation",
    href: ROUTES.contact,
  },
  {
    icon: UserPlus,
    title: "Register",
    body: "Create your account and you are ready to book a truck whenever the day arrives.",
    cta: "Create an account",
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
  return (
    <section
      id={SECTION_IDS.getStarted}
      className="relative scroll-mt-24 border-t border-white/6 py-20 md:py-28"
    >
      <div className="container-page">
        <RevealGroup className="grid gap-5 md:grid-cols-3" stagger={0.12}>
          {ACTIONS.map(({ id, icon: Icon, title, body, cta, href }) => (
            <RevealItem key={title} id={id} className="scroll-mt-28">
              <Card className="h-full">
                <a href={href} className="flex h-full flex-col gap-5 p-7 md:p-8">
                  <span className="grid size-12 place-items-center rounded-xl border border-brand/25 bg-brand/10 text-brand transition-colors duration-500 group-hover/card:border-brand/50 group-hover/card:bg-brand/15">
                    <Icon className="size-5" aria-hidden />
                  </span>

                  <div className="flex flex-col gap-2.5">
                    <h3 className="font-display text-xl font-bold text-white">{title}</h3>
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
                </a>
              </Card>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}

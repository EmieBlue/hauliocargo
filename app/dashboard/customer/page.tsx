"use client";

import { ArrowRight, BadgeCheck, MapPin, Package, Receipt, Send, ShieldCheck, Truck } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { DashboardLoading, DashboardShell } from "@/components/auth/DashboardShell";
import { cn } from "@/lib/cn";
import { ROUTES, TRUST_POINTS } from "@/lib/site";
import { getClient } from "@/lib/supabase";
import { useRequireRole } from "@/lib/useRequireRole";
import { useTheme } from "@/lib/useTheme";

const FLEET_PHOTO = "/brand/dashboard-fleet.jpg";

const QUICK_ACTIONS = [
  {
    icon: Truck,
    title: "Move With You",
    body: "You travel with the driver and your cargo, all the way.",
    href: ROUTES.bookMove,
    variant: "photo",
  },
  {
    icon: Send,
    title: "Send Only",
    body: "The cargo goes, you don't — a verified driver handles pickup and drop-off.",
    href: ROUTES.bookSend,
    variant: "plain",
  },
  {
    icon: Package,
    title: "Package Delivery",
    body: "A smaller parcel, not a full move — still tracked door to door.",
    href: ROUTES.bookReceive,
    variant: "plain",
  },
] as const;

// Same pairing components/sections/Trust.tsx uses for these same four points.
const TRUST_ICONS: LucideIcon[] = [BadgeCheck, Receipt, MapPin, ShieldCheck];

export default function CustomerDashboardPage() {
  const { loading } = useRequireRole("customer");
  const router = useRouter();
  const [theme] = useTheme();
  const [firstName, setFirstName] = useState<string | null>(null);

  useEffect(() => {
    const supabase = getClient();
    if (!supabase) return;
    supabase.auth.getUser().then(({ data }) => {
      const userId = data.user?.id;
      if (!userId) return;
      supabase
        .from("profiles")
        .select("first_name")
        .eq("id", userId)
        .single()
        .then(({ data: profile }) => setFirstName(profile?.first_name ?? null));
    });
  }, []);

  if (loading) return <DashboardLoading />;

  return (
    <DashboardShell>
      <div className="w-full max-w-3xl">
        <h1 className="text-[clamp(1.5rem,3vw,1.9rem)] font-extrabold tracking-[-0.02em] text-fg">
          {firstName ? `Hi, ${firstName}` : "Welcome back"}
        </h1>
        <p className="mt-1.5 text-[0.9rem] text-muted">What would you like to do today?</p>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {QUICK_ACTIONS.map((action) => (
            <QuickActionCard
              key={action.title}
              icon={action.icon}
              title={action.title}
              body={action.body}
              variant={action.variant}
              theme={theme}
              onSelect={() => router.push(action.href)}
            />
          ))}
        </div>

        <div className="mt-16">
          <h2 className="font-display text-[0.68rem] font-semibold tracking-[0.22em] text-mist uppercase">
            Why HaulioCargo
          </h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {TRUST_POINTS.map((point, index) => {
              const Icon = TRUST_ICONS[index];
              return (
                <div
                  key={point.title}
                  className="flex items-start gap-3.5 rounded-xl border border-edge/12 bg-ink-950 p-5"
                >
                  <span
                    className={cn(
                      "grid size-10 shrink-0 place-items-center rounded-xl bg-brand",
                      theme === "light" ? "text-white" : "text-black",
                    )}
                  >
                    <Icon className="size-4.5" aria-hidden />
                  </span>
                  <div>
                    <h3 className="font-display text-[0.9rem] font-bold text-fg">{point.title}</h3>
                    <p className="mt-0.5 text-[0.85rem] leading-relaxed text-muted">{point.body}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}

function QuickActionCard({
  icon: Icon,
  title,
  body,
  variant,
  theme,
  onSelect,
}: {
  icon: LucideIcon;
  title: string;
  body: string;
  variant: "photo" | "plain";
  theme: "dark" | "light";
  onSelect: () => void;
}) {
  const isPhoto = variant === "photo";

  return (
    <button
      type="button"
      onClick={onSelect}
      // Pinned dark on the photo card only — its scrim and white text need
      // to read correctly regardless of site theme, same reasoning as
      // Footer/CargoScene/Trust staying dark regardless of the toggle.
      // Without this, `bg-ink-950` below (a theme-reactive token) flips to
      // a *white* scrim in light theme, washing out the white title text
      // instead of darkening the photo behind it.
      data-theme={isPhoto ? "dark" : undefined}
      className={cn(
        "group/card relative flex min-h-44 flex-col justify-between overflow-hidden rounded-2xl border p-5 text-left transition-colors duration-200",
        isPhoto ? "border-edge/12" : "border-edge/12 bg-ink-950 hover:border-brand/40",
      )}
    >
      {isPhoto ? (
        <>
          {/* Own photo background, scoped to this one card — the page's
           * own backdrop (DashboardBackdrop) is untouched; this just gives
           * "Move With You" the same visual weight the reference image
           * gives its first card. Same image already used for the page
           * backdrop, same dark-scrim idea, just contained to this card. */}
          <div aria-hidden className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${FLEET_PHOTO})` }} />
          <div aria-hidden className="absolute inset-0 bg-ink-950/70 transition-colors duration-200 group-hover/card:bg-ink-950/60" />
        </>
      ) : null}

      <span
        className={cn(
          "relative grid size-11 shrink-0 place-items-center rounded-xl bg-brand",
          // The photo card's own backdrop is always dark regardless of site
          // theme (same scrim treatment as DashboardBackdrop), so its icon
          // stays fixed black-on-yellow rather than theme-branching — only
          // the plain card's icon needs to track the real theme.
          isPhoto ? "text-black" : theme === "light" ? "text-white" : "text-black",
        )}
      >
        <Icon className="size-5" aria-hidden />
      </span>

      <div className="relative">
        <h3 className={cn("font-display text-base font-bold", isPhoto ? "text-white" : "text-fg")}>{title}</h3>
        <p className={cn("mt-1.5 text-[0.82rem] leading-relaxed", isPhoto ? "text-white/80" : "text-muted")}>
          {body}
        </p>
        <span
          className={cn(
            "mt-3 inline-flex items-center gap-1.5 font-display text-[0.68rem] font-semibold tracking-[0.08em] text-brand uppercase transition-transform duration-200 group-hover/card:translate-x-0.5",
          )}
        >
          Choose this
          <ArrowRight className="size-3.5" aria-hidden />
        </span>
      </div>
    </button>
  );
}

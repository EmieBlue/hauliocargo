"use client";

import { Package, Send, Truck } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { DashboardLoading, DashboardShell } from "@/components/auth/DashboardShell";
import { cn } from "@/lib/cn";
import { ROUTES } from "@/lib/site";
import { getClient } from "@/lib/supabase";
import { useRequireRole } from "@/lib/useRequireRole";
import { useTheme } from "@/lib/useTheme";

const QUICK_ACTIONS = [
  { icon: Truck, label: "Move With You", href: ROUTES.bookMove },
  { icon: Send, label: "Send Only", href: ROUTES.bookSend },
  { icon: Package, label: "Package Delivery", href: ROUTES.bookReceive },
] as const;

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

        <div className="mt-8 flex gap-6">
          {QUICK_ACTIONS.map((action) => (
            <QuickAction
              key={action.label}
              icon={action.icon}
              label={action.label}
              theme={theme}
              onSelect={() => router.push(action.href)}
            />
          ))}
        </div>
      </div>
    </DashboardShell>
  );
}

function QuickAction({
  icon: Icon,
  label,
  theme,
  onSelect,
}: {
  icon: LucideIcon;
  label: string;
  theme: "dark" | "light";
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="group/quick flex flex-col items-center gap-2.5 text-center"
    >
      <span
        className={cn(
          "grid size-16 place-items-center rounded-full bg-brand transition-[filter] duration-300 group-hover/quick:brightness-110",
          theme === "light" ? "text-white" : "text-black",
        )}
      >
        <Icon className="size-6" aria-hidden />
      </span>
      <span className="max-w-20 text-[0.8rem] font-semibold text-fg">{label}</span>
    </button>
  );
}

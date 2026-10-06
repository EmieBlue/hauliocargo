"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import { ROUTES } from "@/lib/site";

/**
 * A visible "← Back" that returns to the page the customer came from. With no
 * history to go back to (a fresh tab or a bookmarked link), it falls back to
 * the dashboard home instead of doing nothing.
 */
export function BackButton({ className }: { className?: string }) {
  const router = useRouter();

  function handleBack() {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push(ROUTES.dashboardCustomer);
    }
  }

  return (
    <button
      type="button"
      onClick={handleBack}
      className={cn(
        "inline-flex h-10 items-center gap-2 self-start rounded-xl border px-3.5 text-[0.85rem] font-medium transition-colors duration-200",
        "border-edge/10 bg-edge/[0.03] text-mist hover:border-brand/40 hover:text-brand",
        className,
      )}
    >
      <ArrowLeft className="size-4" aria-hidden />
      Back
    </button>
  );
}

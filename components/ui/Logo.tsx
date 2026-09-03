import { cn } from "@/lib/cn";

/**
 * Mark + wordmark, kept as separate elements deliberately.
 *
 * `nav-mark.png` (the real brand droplet, cropped tight to content) carries
 * only the icon. The wordmark stays live text rather than being baked into
 * the same image: six letters of "Haulio" downscaled into a ~28px-tall nav
 * slot turn to mush and stop reading as text at all — confirmed by actually
 * screenshotting it, not assumed. Text has no such floor; it stays crisp at
 * any size a browser renders it.
 */
export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <img src="/brand/nav-mark.png" alt="" className="h-7 w-auto" />
      <span className="font-display text-[1.05rem] leading-none font-extrabold tracking-[0.02em]">
        <span className="text-white">HAULIO</span>
        <span className="text-brand">CARGO</span>
      </span>
    </span>
  );
}

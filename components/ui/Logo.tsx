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
export function Logo({ className, dark = false }: { className?: string; dark?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      {/* The default mark is white + yellow, which disappears on the yellow
       * scrolled navbar — `dark` swaps in the black + white version. */}
      <img
        src={dark ? "/brand/nav-mark-dark.png" : "/brand/nav-mark.png"}
        alt=""
        className="h-7 w-auto"
      />
      <span className="font-display text-[1.05rem] leading-none font-extrabold tracking-[0.02em]">
        <span className={dark ? "text-black" : "text-brand"}>HAULIO</span>
        <span className="text-white">CARGO</span>
      </span>
    </span>
  );
}

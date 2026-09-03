import { BRAND, FOOTER_COLUMNS, ROUTES, SOCIAL_LINKS } from "@/lib/site";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import { SocialIcon } from "@/components/ui/SocialIcon";

export function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-white/8 bg-ink-900">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-brand/40 to-transparent"
      />

      <div className="container-page relative py-16 md:py-20">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          {/* Brand */}
          <div className="flex flex-col gap-5">
            <Logo />
            <p className="max-w-xs font-display text-lg font-semibold text-white">
              {BRAND.tagline}
            </p>
            <p className="max-w-xs text-[0.88rem] leading-relaxed text-muted">
              Smart cargo and truck booking — from the first photo to the final
              delivery.
            </p>

            <ul className="mt-1 flex items-center gap-2.5">
              {SOCIAL_LINKS.map((social) => (
                <li key={social.icon}>
                  <a
                    href={social.href}
                    aria-label={social.label}
                    className="grid size-11 place-items-center rounded-xl border border-white/10 bg-white/[0.02] text-muted transition-[color,border-color,transform] duration-300 ease-brand hover:-translate-y-0.5 hover:border-brand/40 hover:text-brand"
                  >
                    <SocialIcon name={social.icon} />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Link columns */}
          {FOOTER_COLUMNS.map((column) => (
            <nav key={column.title} aria-label={column.title}>
              <h2 className="font-display text-[0.66rem] font-semibold tracking-[0.22em] text-white uppercase">
                {column.title}
              </h2>
              <ul className="mt-5 flex flex-col gap-3.5">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-[0.9rem] text-muted transition-colors duration-300 hover:text-brand"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          {/* Sign-up prompt */}
          <div className="flex flex-col gap-5">
            <h2 className="font-display text-[0.66rem] font-semibold tracking-[0.22em] text-white uppercase">
              Get moving
            </h2>
            <p className="text-[0.9rem] leading-relaxed text-muted">
              Create an account and book your first truck.
            </p>
            <Button href={ROUTES.register} size="sm" className="w-full">
              Register
            </Button>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-4 border-t border-white/8 pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[0.82rem] text-muted">
            © 2026 HaulioCargo. All rights reserved.
          </p>
          <p className="text-[0.82rem] text-muted/70">
            Haulio SmartLoad™ is in development.
          </p>
        </div>
      </div>
    </footer>
  );
}

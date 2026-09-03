"use client";

import { Check } from "lucide-react";
import { useId, type ReactNode } from "react";

export function Checkbox({
  checked,
  onChange,
  children,
  required,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  children: ReactNode;
  required?: boolean;
}) {
  const id = useId();

  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer items-start gap-3 text-[0.86rem] leading-relaxed text-mist"
    >
      <span className="relative mt-0.5 shrink-0">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          required={required}
          onChange={(event) => onChange(event.target.checked)}
          className="peer sr-only"
        />
        <span
          aria-hidden
          className="grid size-5 place-items-center rounded-md border border-white/20 bg-ink-950 transition-colors duration-200 peer-checked:border-brand peer-checked:bg-brand peer-focus-visible:ring-2 peer-focus-visible:ring-brand/40"
        >
          {/*
           * Driven by the `checked` prop directly, not a `peer-checked`
           * class: this icon is nested inside the span that's the peer's
           * sibling, not a direct sibling itself, so `peer-checked` here
           * would never actually match.
           */}
          <Check
            className="size-3.5 text-black transition-opacity duration-150"
            style={{ opacity: checked ? 1 : 0 }}
            aria-hidden
          />
        </span>
      </span>
      <span>{children}</span>
    </label>
  );
}

import { cn } from "@/lib/utils";

/** Divide safely, returning 0 instead of NaN or Infinity when the denominator is 0. */
export function safeDiv(a: number, b: number) {
  return b > 0 ? a / b : 0;
}

/** Format a dollar amount to two decimal places, the convention every calculator in this section uses. */
export function formatUSD(value: number) {
  return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** Shared style for a pressed/unpressed toggle button — used anywhere a lesson lets a learner flip a cause or a preset on and off. */
export function toggleClass(active: boolean) {
  return cn(
    "min-h-[2.75rem] rounded-lg border px-4 text-sm transition-colors",
    active
      ? "border-primary bg-primary/10 text-foreground"
      : "border-border text-muted-foreground hover:text-foreground"
  );
}

/** Shared style for a plain action button (not a toggle) — press it, something happens once. */
export const actionButtonClass =
  "min-h-[2.75rem] rounded-lg border border-border px-4 text-sm text-foreground transition-colors hover:border-border-strong disabled:opacity-50";

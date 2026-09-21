import type { ReactNode } from "react";

/**
 * "IQM in the field" — an optional, inline callout a lesson drops into its
 * body where the concept it's teaching is something IQM's own platform does
 * in production. Deliberately rare and deliberately small: one card, no
 * stat-tile grid. Every fact here must be traceable to a public IQM source
 * (iqm.com, published award coverage) — never invented.
 */
export function IqmSpotlight({ children }: { children: ReactNode }) {
  return (
    <div className="mb-6 flex gap-3 rounded-lg border border-primary/20 bg-primary/5 p-4">
      <span
        aria-hidden="true"
        className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary text-xs font-bold text-primary-foreground"
      >
        IQ
      </span>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">
          IQM in the field
        </p>
        <p className="mt-1 text-sm text-muted-foreground">{children}</p>
      </div>
    </div>
  );
}

import type { ReactNode } from "react";

/**
 * Shared presentation for the AI section.
 *
 * The old AIModule rendered six application objects (bid optimization, DCO,
 * audience prediction, fraud detection, attribution modeling, budget
 * allocation) through one "How It Works" numbered list and one "Business
 * Impact" card. Each application now belongs to exactly one lesson, but the
 * two presentational pieces are still shared so every lesson tells its
 * mechanism and its payoff the same way.
 */

/** A step in an AI application's "how it works" list, in reading order. */
export function NumberedSteps({ steps }: { steps: ReactNode[] }) {
  return (
    <ol className="space-y-2">
      {steps.map((step, i) => (
        <li key={i} className="flex gap-3 text-muted-foreground">
          <span className="figure shrink-0">{i + 1}</span>
          <span className="measure">{step}</span>
        </li>
      ))}
    </ol>
  );
}

/**
 * The payoff card. The old module paired every application's impact line with
 * the same hardcoded 75% bar regardless of what the line actually said — a
 * placeholder, not a measurement of that application. This replaces the bar
 * with the figure itself, set in the numeral type the rest of the app uses
 * for a stat.
 */
export function ImpactCallout({ figure, description }: { figure: ReactNode; description: ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-secondary p-4">
      <p className="text-xs uppercase text-muted-foreground">Business impact</p>
      <p className="mt-1 text-lg text-foreground">{figure}</p>
      <p className="measure mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

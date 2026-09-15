/**
 * Shared material for the build/rent/buy section.
 *
 * The old BuildBuyModule rendered rent, buy, and build through one card driven
 * by a tab selector. The three profiles below are that same data, still one
 * definition each so lessons 1-4 never have to retell it — lesson 1 uses it
 * for a quick preview, lessons 2-4 each render the one profile they teach in
 * full, and the comparison and takeaways lessons draw their own local data
 * grounded in the same book chapter.
 */

import type { ReactNode } from "react";

export type StrategyId = "rent" | "buy" | "build";

export interface StrategyProfile {
  id: StrategyId;
  name: string;
  tagline: string;
  description: string;
  advantages: { title: string; detail: string }[];
  challenges: { title: string; detail: string }[];
  /** Roughly how fast you are live, 0-100. Illustrative, not a measurement. */
  speedPct: number;
  /** Roughly how much long-term control you keep, 0-100. Illustrative. */
  controlPct: number;
}

export const STRATEGIES: StrategyProfile[] = [
  {
    id: "rent",
    name: "Rent",
    tagline: "Software-as-a-service",
    description:
      "Renting means leveraging software-as-a-service (SaaS) platforms — perfect for companies at the start of their AdTech journey.",
    advantages: [
      {
        title: "Rapid time-to-market",
        detail: "Minimal setup, easy onboarding, and low upfront costs with pay-as-you-go flexibility.",
      },
      {
        title: "Learning period",
        detail: "Gain clarity on what you actually need before committing to anything bigger.",
      },
    ],
    challenges: [
      { title: "Rising costs", detail: "Expenses grow as usage and data volume increase." },
      { title: "Limited customization", detail: "Features and workflows can't be fully tailored." },
      { title: "No control over roadmap", detail: "Development depends on the vendor's priorities." },
      {
        title: "Transparency concerns",
        detail: "Restricted visibility into platform operations and data handling.",
      },
    ],
    speedPct: 90,
    controlPct: 20,
  },
  {
    id: "buy",
    name: "Buy",
    tagline: "Acquire an existing company",
    description:
      "Buying involves acquiring an existing company and its technology — the product, codebase, intellectual property, and often the development team behind it.",
    advantages: [
      {
        title: "Full ownership and transparency",
        detail: "Control over features and data from day one.",
      },
      { title: "Accelerated timeline", detail: "Faster than building a platform entirely from scratch." },
      {
        title: "Control over roadmap",
        detail: "Adapt and evolve the acquired technology to your business strategy.",
      },
    ],
    challenges: [
      {
        title: "Integration complexity",
        detail: "Merging the acquired system can be time-consuming and resource-intensive.",
      },
      {
        title: "Retention risks",
        detail: "Key team members may leave post-acquisition, impacting knowledge transfer.",
      },
      {
        title: "Inherited issues",
        detail: "Technical debt, architectural limitations, and unresolved bugs come with the deal.",
      },
    ],
    speedPct: 55,
    controlPct: 70,
  },
  {
    id: "build",
    name: "Build",
    tagline: "Develop it yourself",
    description:
      "Building means developing a custom AdTech platform from scratch, or replacing components in phases.",
    advantages: [
      { title: "Complete control", detail: "A platform designed to your exact workflow." },
      { title: "Future-proof", detail: "Scalable alongside your growth." },
      {
        title: "Cost becomes investment",
        detail: "Ownership turns monthly fees into long-term asset value.",
      },
    ],
    challenges: [
      { title: "Time-consuming", detail: "Developing a full MVP can take 3 to 6 months." },
      {
        title: "Higher upfront investment",
        detail: "Requires a skilled, dedicated engineering team.",
      },
      { title: "Scope management", detail: "Risk of overcomplication." },
    ],
    speedPct: 20,
    controlPct: 95,
  },
];

export function strategyById(id: StrategyId): StrategyProfile {
  return STRATEGIES.find((s) => s.id === id) ?? STRATEGIES[0];
}

/** The advantages/challenges card, ported from the module's detail panel. */
export function StrategyDetail({ profile }: { profile: StrategyProfile }) {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <h3 className="text-lg text-foreground">
        {profile.name}
        <span className="ml-2 text-base text-muted-foreground">{profile.tagline}</span>
      </h3>
      <p className="measure mt-1 text-muted-foreground">{profile.description}</p>

      <div className="mt-5 grid gap-6 lg:grid-cols-2">
        <div>
          <h4 className="text-primary">Advantages</h4>
          <div className="mt-3 space-y-3">
            {profile.advantages.map((item) => (
              <div key={item.title} className="rounded-lg border border-border bg-secondary p-3">
                <p className="text-foreground">{item.title}</p>
                <p className="mt-0.5 text-sm text-muted-foreground">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-destructive">Challenges</h4>
          <div className="mt-3 space-y-3">
            {profile.challenges.map((item) => (
              <div key={item.title} className="rounded-lg border border-border bg-secondary p-3">
                <p className="text-foreground">{item.title}</p>
                <p className="mt-0.5 text-sm text-muted-foreground">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/** A single labeled 0-100 bar, for the illustrative speed/control meters. */
export function Meter({
  label,
  pct,
  valueLabel,
}: {
  label: string;
  pct: number;
  valueLabel: string;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <p className="text-xs uppercase text-muted-foreground">{label}</p>
        <p className="text-sm text-foreground">{valueLabel}</p>
      </div>
      <div
        className="mt-1 h-2 overflow-hidden rounded-full bg-secondary"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        aria-label={label}
      >
        <div
          className="h-full rounded-full bg-primary transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function BulletList({ items }: { items: ReactNode[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex gap-3 text-muted-foreground">
          <span aria-hidden="true" className="mt-2 h-1 w-1 shrink-0 rounded-full bg-primary" />
          <span className="measure">{item}</span>
        </li>
      ))}
    </ul>
  );
}

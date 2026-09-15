import { useState } from "react";

import type { LessonContent } from "@/components/journey/lesson-content";
import { cn } from "@/lib/utils";
import { strategyById, StrategyDetail } from "./_shared";

const RENT = strategyById("rent");

/** Illustrative volume steps, in millions of monthly impressions. */
const VOLUME_STEPS = [1, 5, 10, 25, 50, 100] as const;

/** A flat monthly fee, chosen only to sit inside the step range for teaching purposes. */
const OWNERSHIP_FLAT_COST = 18_000;
const BASE_FEE = 2_000;
const PER_MILLION_RATE = 320;

function rentCostFor(volumeMillions: number): number {
  return BASE_FEE + volumeMillions * PER_MILLION_RATE;
}

function Body() {
  const [volume, setVolume] = useState<(typeof VOLUME_STEPS)[number]>(VOLUME_STEPS[0]);
  const rentCost = rentCostFor(volume);
  const overOwnership = rentCost > OWNERSHIP_FLAT_COST;
  const maxCost = rentCostFor(VOLUME_STEPS[VOLUME_STEPS.length - 1]);

  return (
    <div className="space-y-8">
      <div className="measure space-y-4 text-muted-foreground">
        <p>{RENT.description}</p>
        <p>
          Renting is where most companies start, and the book is direct about why: it gets you
          live fast and buys you a learning period before you commit to anything larger. The
          catch is in the name — a rented platform bills you for what you use, and usage only goes
          up.
        </p>
      </div>

      <StrategyDetail profile={RENT} />

      <section>
        <h3 className="mb-1 text-lg text-foreground">Try it</h3>
        <p className="measure mb-4 text-sm text-muted-foreground">
          Rising costs is the challenge that ends most rental arrangements. Move the monthly volume
          up and watch the pay-as-you-go bill climb against a flat line — a stand-in for what
          owning the equivalent capability would cost every month, whichever way you got there.
        </p>

        <div className="flex flex-wrap gap-2" role="group" aria-label="Choose a monthly volume, in millions of impressions">
          {VOLUME_STEPS.map((step) => (
            <button
              key={step}
              type="button"
              onClick={() => setVolume(step)}
              aria-pressed={volume === step}
              className={cn(
                "min-h-[2.75rem] rounded-lg border px-4 text-sm transition-colors",
                volume === step
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border text-muted-foreground hover:text-foreground"
              )}
            >
              <span className="figure">{step}</span>M
            </button>
          ))}
        </div>

        <div className="mt-4 rounded-lg border border-border bg-card p-5">
          <div className="flex flex-wrap gap-6">
            <div>
              <p className="text-xs uppercase text-muted-foreground">Monthly volume</p>
              <p className="mt-1 text-foreground">
                <span className="figure text-2xl">{volume}</span>
                <span className="text-muted-foreground"> million impressions</span>
              </p>
            </div>
            <div>
              <p className="text-xs uppercase text-muted-foreground">Pay-as-you-go bill</p>
              <p className={cn("mt-1", overOwnership ? "text-destructive" : "text-foreground")}>
                <span className="figure text-2xl">${rentCost.toLocaleString()}</span>
                <span className="text-muted-foreground"> / month</span>
              </p>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <div className="relative h-3 overflow-hidden rounded-full bg-secondary">
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-primary transition-all duration-300"
                style={{ width: `${Math.min((rentCost / maxCost) * 100, 100)}%` }}
              />
              <div
                className="absolute inset-y-0 w-px bg-foreground"
                style={{ left: `${(OWNERSHIP_FLAT_COST / maxCost) * 100}%` }}
                aria-hidden="true"
              />
            </div>
            <p className="measure text-sm text-muted-foreground">
              The line marks a flat <span className="figure">${OWNERSHIP_FLAT_COST.toLocaleString()}</span>{" "}
              a month — an illustrative stand-in for owning the equivalent capability. It never
              moves. The bar does.
            </p>
          </div>

          <p className="measure mt-3 text-sm text-muted-foreground">
            {overOwnership
              ? "At this volume, the rented bill has crossed the flat line. This is the moment the book means by rising costs: expenses grow as usage and data volume increase, and a platform that was cheap to start on can become the expensive option."
              : "At this volume, renting is still the cheaper path — this is the learning period the book describes, where low upfront cost lets you find out what you actually need."}
          </p>
        </div>

        <p className="measure mt-3 text-sm text-muted-foreground">
          The figures here are illustrative, not a quote from any vendor. What is real is the shape:
          a per-usage bill and a flat cost cross at some volume, and that crossing point is exactly
          what "rising costs" is warning you about.
        </p>
      </section>
    </div>
  );
}

const lesson: LessonContent = {
  whyThisMatters: (
    <p>
      You will sign up for a SaaS platform because it is the fastest way to get live, and that will
      be the right call. The mistake is not checking, twelve months later, whether the bill still
      makes sense at your current volume — this lesson is about noticing that moment before finance
      does.
    </p>
  ),
  objectives: [
    "Define renting an AdTech platform in one sentence",
    "Name the two advantages of renting and explain why they matter most early on",
    "List the four challenges of renting, and explain why rising costs is the one that ends the arrangement",
  ],
  Body,
  takeaways: [
    "Renting means leveraging a software-as-a-service platform — minimal setup, easy onboarding, and low upfront costs with pay-as-you-go flexibility.",
    "Renting buys you a learning period: clarity on what you actually need before you commit to buying or building anything larger.",
    "Renting's costs rise with usage and data volume, and its features, roadmap, and transparency stay under the vendor's control, not yours.",
  ],
  checkYourself: [
    {
      question: "A team says renting is the safest choice because it has the lowest risk. What would you check before agreeing?",
      answer: (
        <p>
          Check the time horizon. Renting is low risk initially, precisely because upfront costs are
          low — but the book flags rising costs, limited customization, and no control over the
          roadmap as the tradeoffs. Low risk today can still mean a worse deal in a year, once usage
          has grown.
        </p>
      ),
    },
  ],
};

export default lesson;

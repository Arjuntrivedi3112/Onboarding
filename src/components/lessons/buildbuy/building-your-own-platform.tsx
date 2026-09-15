import { useState } from "react";

import type { LessonContent } from "@/components/journey/lesson-content";
import { cn } from "@/lib/utils";
import { strategyById, StrategyDetail } from "./_shared";

const BUILD = strategyById("build");

/** A stand-in feature list from a "big platform," each with a rough months cost. */
const FEATURES = [
  { id: "core-bidding", label: "Core bidding logic", months: 1 },
  { id: "reporting", label: "Basic reporting dashboard", months: 1 },
  { id: "budget-caps", label: "Budget pacing and caps", months: 0.5 },
  { id: "creative-mgmt", label: "Creative management tools", months: 1 },
  { id: "multi-channel", label: "Multi-channel delivery (web, app, DOOH)", months: 1.5 },
  { id: "self-serve-ui", label: "Full self-serve user interface", months: 1 },
  { id: "advanced-optim", label: "Machine-learning optimization", months: 2 },
  { id: "identity", label: "Cross-device identity resolution", months: 2 },
  { id: "audience-marketplace", label: "Third-party audience marketplace", months: 1.5 },
  { id: "white-label", label: "White-label reseller support", months: 1 },
] as const;

const MVP_MIN_MONTHS = 3;
const MVP_MAX_MONTHS = 6;

function Body() {
  const [picked, setPicked] = useState<string[]>(["core-bidding", "reporting", "budget-caps"]);

  const toggle = (id: string) =>
    setPicked((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const totalMonths = FEATURES.filter((f) => picked.includes(f.id)).reduce(
    (sum, f) => sum + f.months,
    0
  );
  const withinWindow = totalMonths > 0 && totalMonths <= MVP_MAX_MONTHS;
  const overWindow = totalMonths > MVP_MAX_MONTHS;

  return (
    <div className="space-y-8">
      <div className="measure space-y-4 text-muted-foreground">
        <p>{BUILD.description}</p>
        <p>
          The book is specific about the biggest challenge: a full MVP can take three to six
          months, and the risk is overcomplication. What decides which side of that window you land
          on is not the build strategy itself — it is how much you chose to build.
        </p>
      </div>

      <StrategyDetail profile={BUILD} />

      <section>
        <h3 className="mb-1 text-lg text-foreground">Try it</h3>
        <p className="measure mb-4 text-sm text-muted-foreground">
          Below is a feature list drawn from a typical big AdTech platform. Tick only what your
          first version actually needs, and watch the delivery estimate move. A narrow scope lands
          inside the three-to-six-month MVP window; keep adding and it pushes past it.
        </p>

        <ul className="grid gap-2 sm:grid-cols-2" role="group" aria-label="Choose MVP features">
          {FEATURES.map((feature) => {
            const isOn = picked.includes(feature.id);
            return (
              <li key={feature.id}>
                <button
                  type="button"
                  onClick={() => toggle(feature.id)}
                  aria-pressed={isOn}
                  className={cn(
                    "min-h-[2.75rem] w-full rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                    isOn
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border text-muted-foreground hover:text-foreground"
                  )}
                >
                  {feature.label}
                  <span className="figure ml-2 text-xs text-muted-foreground">
                    +{feature.months}mo
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        <div className="mt-4 rounded-lg border border-border bg-card p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-xs uppercase text-muted-foreground">Estimated delivery</p>
            <p className={cn(overWindow ? "text-destructive" : "text-foreground")}>
              <span className="figure text-2xl">{totalMonths}</span>
              <span className="text-muted-foreground"> months</span>
            </p>
          </div>

          <div className="relative mt-3 h-3 overflow-hidden rounded-full bg-secondary">
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-primary transition-all duration-300"
              style={{ width: `${Math.min((totalMonths / (MVP_MAX_MONTHS * 1.5)) * 100, 100)}%` }}
            />
            <div
              className="absolute inset-y-0 w-px bg-foreground"
              style={{ left: `${(MVP_MIN_MONTHS / (MVP_MAX_MONTHS * 1.5)) * 100}%` }}
              aria-hidden="true"
            />
            <div
              className="absolute inset-y-0 w-px bg-foreground"
              style={{ left: `${(MVP_MAX_MONTHS / (MVP_MAX_MONTHS * 1.5)) * 100}%` }}
              aria-hidden="true"
            />
          </div>
          <p className="measure mt-2 text-sm text-muted-foreground">
            The two marks are the book's three-to-six-month MVP window.
          </p>

          <p className="measure mt-3 text-sm text-muted-foreground">
            {picked.length === 0
              ? "Nothing is picked yet — an MVP with no features is not a platform."
              : overWindow
                ? "This scope has pushed past six months. This is the scope management challenge the book warns about: the risk is not building, it's overcomplicating the first version."
                : withinWindow
                  ? "This scope lands inside the three-to-six-month window — narrow enough to ship, complete enough to run on."
                  : "A scope this narrow may ship even faster than the book's window — worth checking it still does the job."}
          </p>
        </div>

        <p className="measure mt-3 text-sm text-muted-foreground">
          The months here are illustrative, not a quote for any real project. What is real is the
          principle: custom does not mean complex, and a narrow scope is what makes the delivery
          estimate believable.
        </p>
      </section>
    </div>
  );
}

const lesson: LessonContent = {
  whyThisMatters: (
    <p>
      "Let's just build it ourselves" is the sentence that turns a three-month project into an
      eighteen-month one, almost always because the scope quietly grew past what anyone needed on
      day one. This lesson is about keeping the first version small enough to actually ship.
    </p>
  ),
  objectives: [
    "Define building an AdTech platform in one sentence",
    "Name the three advantages of building and what each requires you to have first",
    "Explain why scope, not the build strategy itself, is what usually pushes an MVP past six months",
  ],
  Body,
  takeaways: [
    "Building means developing a custom AdTech platform from scratch, or replacing components in phases.",
    "Building gives complete control over your workflow, scales alongside your growth, and turns spend into a long-term asset instead of a recurring fee.",
    "A full MVP can take three to six months and needs a skilled, dedicated engineering team — and the real risk is scope creeping into overcomplication.",
  ],
  checkYourself: [
    {
      question: "A team plans to build their own platform and lists twelve features for version one, including machine-learning optimization and a reseller marketplace. What would you tell them?",
      answer: (
        <p>
          That list is scope management risk, not a build plan. The book's advantages of building —
          complete control, future-proofing, cost becoming investment — do not require shipping
          everything at once. Cut the list to what the business needs on day one, ship inside the
          three-to-six-month window, and add the rest in phases.
        </p>
      ),
    },
  ],
};

export default lesson;

import { useState } from "react";

import type { LessonContent } from "@/components/journey/lesson-content";
import { cn } from "@/lib/utils";
import { Meter, STRATEGIES, type StrategyId } from "./_shared";

function Body() {
  const [id, setId] = useState<StrategyId>("rent");
  const strategy = STRATEGIES.find((s) => s.id === id) ?? STRATEGIES[0];

  return (
    <div className="space-y-8">
      <div className="measure space-y-4 text-muted-foreground">
        <p>
          When it comes to selecting an AdTech platform, there is no one-size-fits-all answer.
          Businesses must decide between renting, buying, or building — each with unique benefits
          and drawbacks.
        </p>
        <p>
          Those three words describe three different relationships to the same platform. Renting
          means paying someone else to run it for you. Buying means acquiring a company that
          already built one, along with its product, codebase, and often its team. Building means
          creating your own, from scratch or in phases. None of the three is universally right —
          each trades speed for control in a different amount.
        </p>
      </div>

      <section>
        <h3 className="mb-1 text-lg text-foreground">Try it</h3>
        <p className="measure mb-4 text-sm text-muted-foreground">
          Switch between the three paths and watch two things move: how fast you would be live, and
          how much long-term control you would keep. They move in opposite directions — nothing
          here gives you both at once.
        </p>

        <div className="flex flex-wrap gap-2" role="group" aria-label="Choose a strategy">
          {STRATEGIES.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setId(option.id)}
              aria-pressed={id === option.id}
              className={cn(
                "min-h-[2.75rem] rounded-lg border px-4 text-sm transition-colors",
                id === option.id
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border text-muted-foreground hover:text-foreground"
              )}
            >
              {option.name}
            </button>
          ))}
        </div>

        <div className="mt-4 space-y-4 rounded-lg border border-border bg-card p-5">
          <p className="text-foreground">
            {strategy.name}
            <span className="ml-2 text-muted-foreground">{strategy.tagline}</span>
          </p>
          <p className="measure text-sm text-muted-foreground">{strategy.description}</p>

          <div className="grid gap-4 sm:grid-cols-2">
            <Meter
              label="Time to live"
              pct={strategy.speedPct}
              valueLabel={
                strategy.id === "rent" ? "Fast" : strategy.id === "buy" ? "Moderate" : "Slow"
              }
            />
            <Meter
              label="Control you keep"
              pct={strategy.controlPct}
              valueLabel={
                strategy.id === "rent" ? "Low" : strategy.id === "buy" ? "High" : "Very high"
              }
            />
          </div>
        </div>
      </section>

      <div className="measure space-y-4 text-muted-foreground">
        <p>
          Your choice between rent, buy, and build depends on your stage of business maturity,
          budget, urgency to launch, and how much long-term strategic control you need. The
          following lessons take each path in turn — what it actually is, what it gives you, and
          what it costs — before putting all three side by side.
        </p>
      </div>
    </div>
  );
}

const lesson: LessonContent = {
  whyThisMatters: (
    <p>
      Someone at your company will eventually ask "should we build our own?" — usually right after
      a vendor bill lands. Knowing that rent, buy, and build are the only three answers, and what
      each one actually trades away, means you can have that conversation in minutes instead of
      months.
    </p>
  ),
  objectives: [
    "Name the three ways a company can get an AdTech platform",
    "Explain the core tradeoff between how fast you launch and how much control you keep",
    "State which factors — beyond preference — should decide between them",
  ],
  Body,
  takeaways: [
    "There is no one-size-fits-all AdTech platform choice: renting, buying, and building trade speed for control in different amounts.",
    "Renting means paying for someone else's SaaS platform, buying means acquiring an existing company's product and team, and building means creating your own from scratch or in phases.",
    "The right path depends on business maturity, budget, urgency to launch, and long-term strategic control needs — not on which option sounds most impressive.",
  ],
  checkYourself: [
    {
      question: "A founder says building your own platform is always the best long-term move. What is missing from that claim?",
      answer: (
        <p>
          It ignores the tradeoff. Building maximizes control, but it is also the slowest and most
          expensive path to launch — and a full MVP alone can take three to six months. "Best" only
          means something once you have named what you are optimizing for: speed, cost, or control.
        </p>
      ),
    },
    {
      question: "What is the difference between buying a platform and building one?",
      answer: (
        <p>
          Buying acquires a platform that already exists — the product, codebase, intellectual
          property, and often the development team behind it, usually through acquiring the
          company that built it. Building creates a platform that does not exist yet, from scratch
          or in phases, using your own team.
        </p>
      ),
    },
  ],
};

export default lesson;

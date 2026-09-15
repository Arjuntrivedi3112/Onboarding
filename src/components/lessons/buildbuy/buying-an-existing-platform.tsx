import { useState } from "react";

import type { LessonContent } from "@/components/journey/lesson-content";
import { cn } from "@/lib/utils";
import { strategyById, StrategyDetail } from "./_shared";

const BUY = strategyById("buy");

type TeamOutcome = "stays" | "leaves";
type CodebaseState = "modern" | "legacy";

function Body() {
  const [team, setTeam] = useState<TeamOutcome>("stays");
  const [codebase, setCodebase] = useState<CodebaseState>("modern");

  const retentionLit = team === "leaves";
  const inheritedLit = codebase === "legacy";

  return (
    <div className="space-y-8">
      <div className="measure space-y-4 text-muted-foreground">
        <p>{BUY.description}</p>
        <p>
          The deal is never just the software. What comes with it — the codebase, the intellectual
          property, and the people who understand it — decides how much of the buy strategy's
          benefit you actually get to keep.
        </p>
      </div>

      <StrategyDetail profile={BUY} />

      <section>
        <h3 className="mb-1 text-lg text-foreground">Try it</h3>
        <p className="measure mb-4 text-sm text-muted-foreground">
          Two things about the acquired company change how the challenges above show up in
          practice: whether the development team stays, and what kind of codebase you inherit. Set
          both and watch which challenge lights up.
        </p>

        <div className="space-y-5">
          <div>
            <p className="mb-2 text-sm text-foreground">The development team</p>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Choose whether the development team stays">
              {(["stays", "leaves"] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setTeam(option)}
                  aria-pressed={team === option}
                  className={cn(
                    "min-h-[2.75rem] rounded-lg border px-4 text-sm capitalize transition-colors",
                    team === option
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border text-muted-foreground hover:text-foreground"
                  )}
                >
                  Team {option}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm text-foreground">The codebase you inherit</p>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Choose the state of the inherited codebase">
              {(["modern", "legacy"] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setCodebase(option)}
                  aria-pressed={codebase === option}
                  className={cn(
                    "min-h-[2.75rem] rounded-lg border px-4 text-sm capitalize transition-colors",
                    codebase === option
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border text-muted-foreground hover:text-foreground"
                  )}
                >
                  {option === "modern" ? "Well-maintained codebase" : "Aging, undocumented codebase"}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {BUY.challenges.map((item) => {
            const lit =
              (item.title === "Retention risks" && retentionLit) ||
              (item.title === "Inherited issues" && inheritedLit);
            return (
              <div
                key={item.title}
                className={cn(
                  "rounded-lg border p-3 transition-colors",
                  lit ? "border-destructive bg-destructive/10" : "border-border bg-secondary"
                )}
              >
                <p className={lit ? "text-destructive" : "text-foreground"}>{item.title}</p>
                <p className="mt-0.5 text-sm text-muted-foreground">{item.detail}</p>
              </div>
            );
          })}
        </div>

        <p className="measure mt-3 text-sm text-muted-foreground">
          {retentionLit && inheritedLit
            ? "This is the expensive version of a buy: the people who understood the system are gone, and what is left needs real repair before it can adapt to your roadmap."
            : retentionLit
              ? "Even a clean codebase loses value fast without the people who knew why it was built that way — knowledge transfer is the part an acquisition can't guarantee."
              : inheritedLit
                ? "A team that stays can carry you through this — they know where the technical debt and unresolved bugs are, even if the code itself needs work."
                : "This is the buy strategy at its best: the team stays to explain the system, and the system does not need explaining much anyway."}
        </p>
      </section>
    </div>
  );
}

const lesson: LessonContent = {
  whyThisMatters: (
    <p>
      An acquisition announcement reads as good news — ownership, roadmap control, a faster
      timeline than building from zero. Whether it actually is depends on two things due diligence
      is supposed to catch: who stays, and what state the code is in. This lesson is what to check
      before you sign.
    </p>
  ),
  objectives: [
    "Define buying an AdTech platform in one sentence",
    "Name the three advantages of buying and what each depends on",
    "Explain how the development team staying or leaving changes what you actually acquired",
  ],
  Body,
  takeaways: [
    "Buying means acquiring an existing company and its technology — the product, codebase, intellectual property, and often the development team behind it.",
    "Buying gives full ownership and transparency, a faster timeline than building from scratch, and control over the roadmap going forward.",
    "Buying's risks are integration complexity, retention risk if key people leave post-acquisition, and inherited technical debt or unresolved bugs.",
  ],
  checkYourself: [
    {
      question: "Two acquisition targets offer the same product at the same price. One's founding engineers are staying for a year; the other's are leaving at close. Why might that change which one you pick?",
      answer: (
        <p>
          The team that stays reduces retention risk — the book's specific concern that knowledge
          transfer breaks down when key people leave post-acquisition. Without them, you still gain
          the product and the codebase, but you inherit any technical debt or architectural
          limitations with no one left who can explain why they are there.
        </p>
      ),
    },
  ],
};

export default lesson;

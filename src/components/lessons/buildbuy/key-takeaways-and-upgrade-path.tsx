import { useState } from "react";

import type { LessonContent } from "@/components/journey/lesson-content";
import { cn } from "@/lib/utils";

const KEY_TAKEAWAYS = [
  { n: 1, title: "Start with rent", detail: "It's ideal for fast launches and early learning." },
  { n: 2, title: "Upgrade to buy or build when ready", detail: "If your tool can't adapt to you, it's time to change." },
  { n: 3, title: "Focus on core needs", detail: "You likely only need two to five percent of big platforms' features." },
  { n: 4, title: "Incremental builds work", detail: "Replace third-party parts gradually." },
  { n: 5, title: "Custom doesn't mean complex", detail: "Narrow scope ensures faster delivery and return on investment." },
  { n: 6, title: "The tool should serve you", detail: "Not the other way around." },
] as const;

interface StackPart {
  id: string;
  name: string;
  months: number;
  gain: string;
}

/** A fully-rented starting stack, in the order the book's takeaway 4 has you replace it: gradually. */
const STACK: StackPart[] = [
  { id: "reporting", name: "Reporting", months: 1, gain: "Your own numbers, not the vendor's summary of them." },
  { id: "data-store", name: "Data store", months: 2, gain: "Audience data lives with you, not inside someone else's account." },
  { id: "bidder", name: "Bidding logic", months: 3, gain: "Your targeting and pacing rules, not the vendor's defaults." },
  { id: "dsp", name: "Full demand-side platform", months: 4, gain: "The whole buying workflow, on your own roadmap." },
];

function Body() {
  const [order, setOrder] = useState<string[]>([]);

  const toggle = (id: string) =>
    setOrder((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const cumulativeMonths = order.reduce((sum, id) => {
    const part = STACK.find((p) => p.id === id);
    return sum + (part?.months ?? 0);
  }, 0);

  return (
    <div className="space-y-8">
      <div className="measure space-y-4 text-muted-foreground">
        <p>
          Everything in this section comes down to six ideas, and one plan for acting on them:
          start rented, replace pieces one at a time, and keep the scope of each replacement narrow
          enough to actually finish.
        </p>
      </div>

      <section>
        <h3 className="mb-3 text-lg text-foreground">Key takeaways</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {KEY_TAKEAWAYS.map((item) => (
            <div key={item.n} className="flex gap-4 rounded-lg border border-border bg-card p-4">
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary"
                aria-hidden="true"
              >
                <span className="figure text-sm">{item.n}</span>
              </div>
              <div>
                <p className="text-foreground">{item.title}</p>
                <p className="mt-0.5 text-sm text-muted-foreground">{item.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h3 className="mb-1 text-lg text-foreground">Try it</h3>
        <p className="measure mb-4 text-sm text-muted-foreground">
          Takeaway four says incremental builds work: replace third-party parts gradually rather
          than all at once. Start from a fully rented stack and click the parts below in the order
          you would replace them. Each one you add shows what you gain — and what it costs in
          months.
        </p>

        <div className="flex flex-wrap gap-2" role="group" aria-label="Choose which stack parts to replace, and in what order">
          {STACK.map((part) => {
            const position = order.indexOf(part.id);
            const isPicked = position !== -1;
            return (
              <button
                key={part.id}
                type="button"
                onClick={() => toggle(part.id)}
                aria-pressed={isPicked}
                className={cn(
                  "min-h-[2.75rem] rounded-lg border px-4 text-sm transition-colors",
                  isPicked
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border text-muted-foreground hover:text-foreground"
                )}
              >
                {isPicked && <span className="figure mr-2">{position + 1}</span>}
                {part.name}
              </button>
            );
          })}
        </div>

        <div className="mt-4 rounded-lg border border-border bg-card p-5">
          {order.length === 0 ? (
            <p className="measure text-muted-foreground">
              Nothing replaced yet — the stack is entirely rented, which is exactly where the book
              says to start.
            </p>
          ) : (
            <>
              <p className="text-xs uppercase text-muted-foreground">Your migration plan</p>
              <ol className="mt-2 space-y-2">
                {order.map((id, i) => {
                  const part = STACK.find((p) => p.id === id)!;
                  return (
                    <li key={id} className="flex gap-3 text-muted-foreground">
                      <span className="figure shrink-0">{i + 1}</span>
                      <span>
                        <span className="text-foreground">{part.name}</span> — {part.gain}
                      </span>
                    </li>
                  );
                })}
              </ol>
              <p className="measure mt-3 text-sm text-muted-foreground">
                Cumulative estimate so far: <span className="figure">{cumulativeMonths}</span>{" "}
                months, replacing <span className="figure">{order.length}</span> of{" "}
                <span className="figure">{STACK.length}</span> rented parts. The rest stays rented
                until you choose to move it.
              </p>
            </>
          )}
        </div>

        <p className="measure mt-3 text-sm text-muted-foreground">
          The months are illustrative. The point takeaway four is making is structural: you do not
          need one enormous cutover project. Each part you replace only has to beat what renting it
          currently costs you — the same rising-costs pressure and control ceiling covered earlier
          in this section.
        </p>
      </section>

      <div className="rounded-lg border border-primary/30 bg-primary/5 p-5">
        <p className="measure text-sm text-muted-foreground">
          If you start small, learn fast, and upgrade strategically, you will avoid costly missteps
          and end up with an AdTech stack that truly fits your business.
        </p>
      </div>
    </div>
  );
}

const lesson: LessonContent = {
  whyThisMatters: (
    <p>
      This is the plan you actually carry into the job: not "which one strategy should we pick
      forever," but "what do we rent today, and what earns replacing first." Most real stacks are a
      mix, arrived at gradually — this lesson is how that mix gets decided.
    </p>
  ),
  objectives: [
    "Recite the chapter's six key takeaways in your own words",
    "Explain what an incremental build replaces first, and why",
    "State the chapter's closing advice for avoiding a costly platform decision",
  ],
  Body,
  takeaways: [
    "Start with rent for fast launches and early learning, then upgrade to buy or build once your tool can no longer adapt to you.",
    "You likely need only two to five percent of a big platform's features, so incremental builds — replacing third-party parts gradually — work, and custom doesn't have to mean complex.",
    "The tool should serve you, not the other way around: start small, learn fast, and upgrade strategically to end up with a stack that truly fits your business.",
  ],
  checkYourself: [
    {
      question: "A team wants to replace their entire rented stack with a custom build in one project. How would you apply takeaway four?",
      answer: (
        <p>
          Push back on the single cutover. Takeaway four is that incremental builds work: replace
          third-party parts gradually, starting with whichever piece is cheapest to replace or
          causing the most pain today. A staged plan also keeps each phase's scope narrow — the
          same discipline that keeps a custom build from becoming complex.
        </p>
      ),
    },
    {
      question: "How do you know it's time to upgrade off a rented platform, according to the book?",
      answer: (
        <p>
          When the tool can no longer adapt to you — takeaway two, "if your tool can't adapt to you,
          it's time to change." That is the practical trigger, more useful than a fixed timeline:
          rising costs, a roadmap you don't control, or limits on customization are the earlier
          lessons' way of describing that same moment.
        </p>
      ),
    },
  ],
};

export default lesson;

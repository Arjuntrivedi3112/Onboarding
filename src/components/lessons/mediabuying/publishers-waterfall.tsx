import { useState } from "react";

import type { LessonContent } from "@/components/journey/lesson-content";
import { cn } from "@/lib/utils";
import { NO_BID_REASONS, WATERFALL_TIERS, noBidReason, type NoBidReasonId } from "./_shared";

interface TierOutcome {
  tierId: string;
  fills: boolean;
  reason?: NoBidReasonId;
}

interface Scenario {
  id: 1 | 2 | 3;
  label: string;
  description: string;
  outcomes: TierOutcome[];
  houseAd: boolean;
}

const SCENARIOS: Scenario[] = [
  {
    id: 1,
    label: "Scenario 1",
    description: "A direct deal has an impression ready to go.",
    outcomes: [{ tierId: "direct", fills: true }],
    houseAd: false,
  },
  {
    id: 2,
    label: "Scenario 2",
    description: "Direct deals have nothing. Both exchanges pass. The remnant network fills it.",
    outcomes: [
      { tierId: "direct", fills: false, reason: "no-match" },
      { tierId: "exchange1", fills: false, reason: "floor" },
      { tierId: "exchange2", fills: false, reason: "timeout" },
      { tierId: "remnant", fills: true },
    ],
    houseAd: false,
  },
  {
    id: 3,
    label: "Scenario 3",
    description: "Every demand source passes. The publisher's own house ad runs instead.",
    outcomes: [
      { tierId: "direct", fills: false, reason: "no-match" },
      { tierId: "exchange1", fills: false, reason: "floor" },
      { tierId: "exchange2", fills: false, reason: "capping" },
      { tierId: "remnant", fills: false, reason: "timeout" },
    ],
    houseAd: true,
  },
];

function Body() {
  const [scenarioId, setScenarioId] = useState<1 | 2 | 3>(1);
  const [revealed, setRevealed] = useState(0);
  const [reordered, setReordered] = useState(false);

  const scenario = SCENARIOS.find((s) => s.id === scenarioId) as Scenario;
  const steps = scenario.houseAd ? [...scenario.outcomes, { tierId: "house", fills: true }] : scenario.outcomes;
  const revenue = steps.slice(0, revealed).find((s) => s.fills);
  const revenueTier = revenue ? WATERFALL_TIERS.find((t) => t.id === revenue.tierId) : null;

  const selectScenario = (id: 1 | 2 | 3) => {
    setScenarioId(id);
    setRevealed(0);
  };

  return (
    <div className="space-y-8">
      <div className="measure space-y-4 text-muted-foreground">
        <p>
          Waterfalling — also called a daisy chain, or waterfall tags — is how a publisher sells
          remnant inventory: the premium slots its own sales team couldn't sell directly. Demand
          sources are called one after another, in tiers, until one of them fills the impression or
          the chain runs out.
        </p>
        <p>
          This raises what the book calls{" "}
          <span className="text-foreground">the publisher's dilemma</span>: sell at a high CPM and
          risk some slots going unfilled, or fill every slot at a lower CPM and give up the upside?
          The waterfall's order is the publisher's attempt to answer that — direct sales first, since
          they pay the most, then SSPs and ad exchanges through open RTB, then ad networks as the
          lowest tier.
        </p>
        <p>
          Implementing it means an AdOps team configures a passback — sometimes called a fallback
          ad, redirect, or default ad — separately in the publisher's ad server and in every
          network's own system, so an unfilled impression is handed to the next tier automatically.
        </p>
      </div>

      <section>
        <h3 className="mb-1 text-lg text-foreground">Try it</h3>
        <p className="measure mb-4 text-sm text-muted-foreground">
          Pick a scenario, then step through the chain and see exactly where — and why — each tier
          passes.
        </p>

        <div className="flex flex-wrap gap-2" role="group" aria-label="Choose a waterfall scenario">
          {SCENARIOS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => selectScenario(s.id)}
              aria-pressed={scenarioId === s.id}
              className={cn(
                "min-h-[2.75rem] rounded-lg border px-4 text-left text-sm transition-colors",
                scenarioId === s.id
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border text-muted-foreground hover:text-foreground"
              )}
            >
              <span className="block text-foreground">{s.label}</span>
              <span className="text-muted-foreground">{s.description}</span>
            </button>
          ))}
        </div>

        <div className="mt-4 flex items-center gap-3">
          <button
            type="button"
            onClick={() => setRevealed((r) => Math.min(r + 1, steps.length))}
            disabled={revealed >= steps.length}
            className="min-h-[2.75rem] rounded-lg border border-primary bg-primary/10 px-4 text-sm text-foreground transition-colors disabled:opacity-50"
          >
            Send the impression down the chain
          </button>
          <button
            type="button"
            onClick={() => setRevealed(0)}
            className="min-h-[2.75rem] rounded-lg border border-border px-4 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Restart
          </button>
        </div>

        <ol className="mt-4 space-y-2">
          {steps.map((step, i) => {
            const tier = step.tierId === "house" ? null : WATERFALL_TIERS.find((t) => t.id === step.tierId);
            const label = tier ? tier.label : "House ad (fallback)";
            const shown = i < revealed;
            return (
              <li
                key={step.tierId}
                className={cn(
                  "rounded-lg border p-3 transition-colors",
                  !shown && "opacity-40",
                  shown && step.fills && "border-clearing bg-clearing/10",
                  shown && !step.fills && "border-border bg-card"
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-foreground">{label}</span>
                  {shown && (
                    <span className={cn("text-sm", step.fills ? "text-clearing" : "text-nobid")}>
                      {step.fills ? "Fills the impression" : "Passes"}
                    </span>
                  )}
                </div>
                {shown && !step.fills && step.reason && (
                  <p className="measure mt-1 text-sm text-muted-foreground">
                    {noBidReason(step.reason).label} — {noBidReason(step.reason).detail}
                  </p>
                )}
                {shown && step.fills && tier && (
                  <p className="measure mt-1 text-sm text-muted-foreground">
                    Clears at roughly <span className="figure">${tier.historicCpm.toFixed(2)}</span> CPM.
                  </p>
                )}
                {shown && step.fills && !tier && (
                  <p className="measure mt-1 text-sm text-muted-foreground">
                    No demand source paid for this impression — it promotes the publisher's own
                    products or services instead.
                  </p>
                )}
              </li>
            );
          })}
        </ol>

        {revealed >= steps.length && (
          <p className="measure mt-3 rounded-lg border border-border bg-card p-3 text-sm text-muted-foreground">
            {revenueTier ? (
              <>
                Revenue this impression: about{" "}
                <span className="figure">${revenueTier.historicCpm.toFixed(2)}</span> CPM, from{" "}
                {revenueTier.label.toLowerCase()}.
              </>
            ) : (
              "Revenue this impression: none — the house ad fills the slot but pays the publisher nothing."
            )}
          </p>
        )}
      </section>

      <section>
        <h3 className="mb-3 text-lg text-foreground">Why the order itself is a weak point</h3>
        <p className="measure text-muted-foreground">
          The ad server ranks demand sources by average historical yield and calls them in that
          order. That static ranking misses real-time swings: a remnant network ranked third, with a{" "}
          <span className="figure">$2</span> average CPM, might be willing to pay{" "}
          <span className="figure">$5</span> for a user who matches its ideal profile — but because
          the waterfall calls tiers in a fixed sequence, that <span className="figure">$5</span> bid
          may never be seen.
        </p>

        <div className="mt-4 rounded-lg border border-border bg-card p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase text-muted-foreground">
                {reordered ? "Called first, on real-time value" : "Called third, on historical rank"}
              </p>
              <p className="mt-1 text-foreground">Remnant network</p>
            </div>
            <p className="figure text-2xl text-foreground">
              ${reordered ? "5.00" : "2.00"}
            </p>
          </div>
          <p className="measure mt-2 text-sm text-muted-foreground">
            {reordered ? (
              <>
                Ask it first and its real willingness to pay for this specific user —{" "}
                <span className="figure">$5.00</span> — is what the auction sees.
              </>
            ) : (
              <>
                Ranked by its <span className="figure">$2.00</span> historical average, it only gets
                asked after direct deals and both exchanges pass — by which point its{" "}
                <span className="figure">$5.00</span> offer for this user was never on the table.
              </>
            )}
          </p>
          <button
            type="button"
            onClick={() => setReordered((r) => !r)}
            aria-pressed={reordered}
            className="mt-3 min-h-[2.75rem] rounded-lg border border-border px-4 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            {reordered ? "Restore historical order" : "Move remnant network to the front"}
          </button>
        </div>

        <p className="measure mt-3 text-sm text-muted-foreground">
          This exact limitation — a fixed hierarchy that can't reflect what a demand source would pay
          right now — is what led to header bidding, covered next.
        </p>
      </section>
    </div>
  );
}

const lesson: LessonContent = {
  whyThisMatters: (
    <p>
      A publisher will ask why a slot went unsold when "someone would obviously have paid for it."
      The waterfall is usually the answer — a fixed order that never got to ask the buyer who
      actually would have.
    </p>
  ),
  objectives: [
    "Describe the order a publisher's waterfall calls demand sources in, and why",
    "Name the four reasons a demand source can return no bid",
    "Explain why a static, historical-yield ranking can miss a higher real-time bid",
  ],
  Body,
  takeaways: [
    "A waterfall calls demand sources in sequence — direct deals first, then SSPs and exchanges through open RTB, then ad networks — stopping at the first one that fills the impression.",
    "A demand source can return no bid for four reasons: no matching campaigns, a floor price set too high, frequency capping already reached, or a timeout that ends the chain with no ad shown at all.",
    "Because tiers are ranked by historical average yield rather than real-time value, a demand source willing to pay well above its average for this particular user may never get the chance.",
  ],
  checkYourself: [
    {
      question: "In scenario 2, why does the chain skip past both RTB exchanges before the remnant network fills the impression?",
      answer: (
        <p>
          Each one passes for a different reason: direct deals have no matching campaign, the first
          exchange's bids fall under the floor price, and the second exchange times out. None of
          those failures stop the chain — they just hand the impression to the next tier down.
        </p>
      ),
    },
    {
      question: "A remnant network averages $2 CPM but would pay $5 for a user matching its ideal profile. Does classic waterfalling let it pay $5?",
      answer: (
        <p>
          Not usually. It's ranked by its <span className="figure">$2</span> historical average, so
          it's called third — after direct deals and both exchanges — regardless of what it would
          pay for this specific user. If a higher tier fills the impression first, its{" "}
          <span className="figure">$5</span> willingness is never even asked for.
        </p>
      ),
    },
  ],
};

export default lesson;

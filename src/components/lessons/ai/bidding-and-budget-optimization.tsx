import { useMemo, useState } from "react";

import type { LessonContent } from "@/components/journey/lesson-content";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { ImpactCallout, NumberedSteps } from "./_shared";

/**
 * The bid math. A base value plus a per-point weight on predicted CTR and
 * predicted conversion probability — illustrative, the same way the buy-side
 * lesson's signal uplifts are illustrative. The shape of the decision is
 * real; the numbers are not a quoted market rate.
 */
const BASE_BID = 0.5;
const CTR_WEIGHT = 0.3;
const CONV_WEIGHT = 0.09;
const FLAT_BID = 2.0;
const CONVERSION_VALUE = 15;

function aiBidFor(ctr: number, convProb: number) {
  return BASE_BID + ctr * CTR_WEIGHT + convProb * CONV_WEIGHT;
}

/** Five impressions the bidder sees in a row. Nothing here is drawn at random. */
const IMPRESSIONS = [
  { id: 1, label: "Returning shopper, cart abandoned yesterday", ctr: 4.2, convProb: 18, converts: true, competingBid: 3.1 },
  { id: 2, label: "New visitor, generic homepage view", ctr: 0.6, convProb: 1, converts: false, competingBid: 1.2 },
  { id: 3, label: "Searched the exact product model by name", ctr: 3.5, convProb: 22, converts: true, competingBid: 2.8 },
  { id: 4, label: "Browsed once, bounced in four seconds", ctr: 0.4, convProb: 0.5, converts: false, competingBid: 1.0 },
  { id: 5, label: "Compared prices across three open tabs", ctr: 2.1, convProb: 9, converts: true, competingBid: 1.8 },
] as const;

const CAMPAIGNS = [
  { id: "brand", name: "Brand awareness", predictedRoi: 1.2 },
  { id: "retarget", name: "Retargeting cart abandoners", predictedRoi: 4.8 },
  { id: "prospecting", name: "New-customer prospecting", predictedRoi: 2.1 },
] as const;

const SEARCH_KEYWORDS = [
  { keyword: "running shoes near me", ctr: 8.5, convProb: 12, note: "Already in the campaign — high intent, always-on bid" },
  { keyword: "best trail running shoes 2026", ctr: 3.2, convProb: 4, note: "Already in the campaign — research phase, moderate bid" },
  { keyword: "waterproof hiking boots", ctr: 5.1, convProb: 9, note: "Not in the campaign yet — suggested from a rising search trend" },
] as const;

function BidPricer() {
  const [ctr, setCtr] = useState(1.5);
  const [convProb, setConvProb] = useState(5);
  const bid = aiBidFor(ctr, convProb);
  const competingBid = 1.8;
  const wins = bid > competingBid;

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <p className="text-xs uppercase text-muted-foreground">One impression arrives</p>

      <div className="mt-4 grid gap-6 sm:grid-cols-2">
        <div>
          <div className="flex items-baseline justify-between">
            <label htmlFor="ctr-slider" className="text-sm text-muted-foreground">
              Predicted click-through rate
            </label>
            <span className="figure text-foreground">{ctr.toFixed(1)}%</span>
          </div>
          <Slider
            id="ctr-slider"
            className="mt-3 min-h-[2.75rem]"
            min={0.2}
            max={5}
            step={0.1}
            value={[ctr]}
            onValueChange={([v]) => setCtr(v)}
            aria-label="Predicted click-through rate"
          />
        </div>
        <div>
          <div className="flex items-baseline justify-between">
            <label htmlFor="conv-slider" className="text-sm text-muted-foreground">
              Predicted conversion probability
            </label>
            <span className="figure text-foreground">{convProb.toFixed(1)}%</span>
          </div>
          <Slider
            id="conv-slider"
            className="mt-3 min-h-[2.75rem]"
            min={0.5}
            max={25}
            step={0.5}
            value={[convProb]}
            onValueChange={([v]) => setConvProb(v)}
            aria-label="Predicted conversion probability"
          />
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-end gap-8 border-t border-border pt-4">
        <div>
          <p className="text-xs uppercase text-muted-foreground">AI bid</p>
          <p className="mt-1 text-2xl text-foreground">
            <span className="figure">${bid.toFixed(2)}</span>
          </p>
        </div>
        <div>
          <p className="text-xs uppercase text-muted-foreground">Flat bid, always</p>
          <p className="mt-1 text-2xl text-muted-foreground">
            <span className="figure">${FLAT_BID.toFixed(2)}</span>
          </p>
        </div>
        <div>
          <p className="text-xs uppercase text-muted-foreground">Competing bid on this impression</p>
          <p className="mt-1 text-2xl text-muted-foreground">
            <span className="figure">${competingBid.toFixed(2)}</span>
          </p>
        </div>
        <p className={cn("measure text-sm", wins ? "text-foreground" : "text-muted-foreground")}>
          {wins
            ? "The AI bid clears the competing bid — this impression is won."
            : "The AI bid does not clear the competing bid — this impression is passed on."}
        </p>
      </div>
      <p className="measure mt-3 text-sm text-muted-foreground">
        Move the sliders and watch only the AI bid respond. The flat bid cannot see either
        prediction, so it wins or loses whatever it happens to be sitting on that day.
      </p>
    </div>
  );
}

function BidBatch() {
  const [strategy, setStrategy] = useState<"ai" | "flat">("ai");

  const rows = IMPRESSIONS.map((imp) => {
    const bid = strategy === "ai" ? aiBidFor(imp.ctr, imp.convProb) : FLAT_BID;
    const won = bid > imp.competingBid;
    return { ...imp, bid, won };
  });

  const won = rows.filter((r) => r.won);
  const spend = won.reduce((sum, r) => sum + r.bid, 0);
  const conversions = won.filter((r) => r.converts).length;
  const value = conversions * CONVERSION_VALUE;
  const roi = spend > 0 ? ((value - spend) / spend) * 100 : 0;

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs uppercase text-muted-foreground">The same five impressions, one strategy at a time</p>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Choose a bidding strategy">
          {(["ai", "flat"] as const).map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setStrategy(id)}
              aria-pressed={strategy === id}
              className={cn(
                "min-h-[2.75rem] rounded-lg border px-4 text-sm transition-colors",
                strategy === id
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border text-muted-foreground hover:text-foreground"
              )}
            >
              {id === "ai" ? "AI bidding" : "Flat bidding"}
            </button>
          ))}
        </div>
      </div>

      <ul className="mt-4 space-y-2">
        {rows.map((r) => (
          <li
            key={r.id}
            className={cn("rounded-lg border p-3", r.won ? "border-primary bg-primary/10" : "border-border")}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-foreground">{r.label}</span>
              <span className={cn("text-sm", r.won ? "text-foreground" : "text-muted-foreground")}>
                {r.won ? "Wins" : "Passes"} <span className="figure">${r.bid.toFixed(2)}</span> vs{" "}
                <span className="figure">${r.competingBid.toFixed(2)}</span>
              </span>
            </div>
            <span className="text-sm text-muted-foreground">
              {r.converts ? "This impression would have converted" : "This impression would not have converted"}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-5 grid grid-cols-2 gap-4 border-t border-border pt-4 sm:grid-cols-4">
        <div>
          <p className="text-xs uppercase text-muted-foreground">Spend</p>
          <p className="figure mt-1 text-foreground">${spend.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-xs uppercase text-muted-foreground">Conversions won</p>
          <p className="figure mt-1 text-foreground">{conversions}</p>
        </div>
        <div>
          <p className="text-xs uppercase text-muted-foreground">Value returned</p>
          <p className="figure mt-1 text-foreground">${value.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-xs uppercase text-muted-foreground">ROI</p>
          <p className="figure mt-1 text-foreground">{roi.toFixed(0)}%</p>
        </div>
      </div>
      <p className="measure mt-3 text-sm text-muted-foreground">
        Switch strategies. AI bidding wins every impression that was going to convert and passes on
        every one that was not, because its bid moves with the prediction. Flat bidding cannot tell
        the two kinds apart, so it wins and loses the wrong ones — this toy batch exaggerates the
        gap for clarity, but the direction is the book's cited{" "}
        <span className="figure">20-40%</span> ROI improvement, not the exact size of it.
      </p>
    </div>
  );
}

function BudgetAllocator() {
  const [budget, setBudget] = useState(10000);
  const [mode, setMode] = useState<"even" | "ai">("ai");

  const sumRoi = CAMPAIGNS.reduce((s, c) => s + c.predictedRoi, 0);

  const rows = CAMPAIGNS.map((c) => {
    const share = mode === "even" ? 1 / CAMPAIGNS.length : c.predictedRoi / sumRoi;
    const amount = share * budget;
    return { ...c, share, amount, projectedReturn: amount * c.predictedRoi };
  });

  const totalReturn = rows.reduce((s, r) => s + r.projectedReturn, 0);
  const otherModeTotal = useMemo(() => {
    const otherRows = CAMPAIGNS.map((c) => {
      const share = mode === "even" ? c.predictedRoi / sumRoi : 1 / CAMPAIGNS.length;
      return share * budget * c.predictedRoi;
    });
    return otherRows.reduce((s, v) => s + v, 0);
  }, [mode, budget, sumRoi]);

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="flex items-baseline justify-between">
        <label htmlFor="budget-slider" className="text-sm text-muted-foreground">
          Total daily budget
        </label>
        <span className="figure text-foreground">${budget.toLocaleString()}</span>
      </div>
      <Slider
        id="budget-slider"
        className="mt-3 min-h-[2.75rem]"
        min={2000}
        max={20000}
        step={500}
        value={[budget]}
        onValueChange={([v]) => setBudget(v)}
        aria-label="Total daily budget"
      />

      <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Choose a budget-allocation mode">
        {(["ai", "even"] as const).map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => setMode(id)}
            aria-pressed={mode === id}
            className={cn(
              "min-h-[2.75rem] rounded-lg border px-4 text-sm transition-colors",
              mode === id
                ? "border-primary bg-primary/10 text-foreground"
                : "border-border text-muted-foreground hover:text-foreground"
            )}
          >
            {id === "ai" ? "AI reallocation" : "Even split"}
          </button>
        ))}
      </div>

      <ul className="mt-4 space-y-2">
        {rows.map((r) => (
          <li key={r.id} className="rounded-lg border border-border p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-foreground">{r.name}</span>
              <span className="text-sm text-muted-foreground">
                predicted return <span className="figure">{r.predictedRoi.toFixed(1)}x</span>
              </span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${Math.min(100, r.share * 100)}%` }}
              />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              <span className="figure">${r.amount.toFixed(0)}</span> of the budget
            </p>
          </li>
        ))}
      </ul>

      <div className="mt-4 flex flex-wrap gap-8 border-t border-border pt-4">
        <div>
          <p className="text-xs uppercase text-muted-foreground">Total projected return, this mode</p>
          <p className="figure mt-1 text-lg text-foreground">${totalReturn.toFixed(0)}</p>
        </div>
        <div>
          <p className="text-xs uppercase text-muted-foreground">
            {mode === "ai" ? "Even split would return" : "AI reallocation would return"}
          </p>
          <p className="figure mt-1 text-lg text-muted-foreground">${otherModeTotal.toFixed(0)}</p>
        </div>
      </div>
      <p className="measure mt-3 text-sm text-muted-foreground">
        The same dollars, moved toward the campaign with the best predicted return, produce more
        total return than splitting them evenly — the book's cited{" "}
        <span className="figure">15-25%</span> more efficient use of budget, and the mechanism
        this section calls reallocating spend to the highest-performing campaigns in real time.
      </p>
    </div>
  );
}

function Body() {
  return (
    <div className="space-y-8">
      <div className="measure space-y-4 text-muted-foreground">
        <p>
          In display advertising, AI powers programmatic buying through real-time bidding,
          evaluating each impression based on user behavior, context, and predicted performance.
          DSPs use AI to automate bid strategies, optimize budget allocation, and select the most
          effective ad placements, ensuring maximum return on investment.
        </p>
        <p>
          Two separate jobs sit inside that sentence. One prices a single impression the instant it
          arrives. The other watches many campaigns at once and moves money between them while they
          run. Both are covered here, because a bidder that is right about one impression and a
          budget that never moves would still waste money.
        </p>
      </div>

      <section>
        <h3 className="mb-3 text-lg text-foreground">Bid optimization</h3>
        <p className="measure mb-3 text-muted-foreground">
          AI evaluates each impression in real time, predicting performance and adjusting bids
          automatically.
        </p>
        <NumberedSteps
          steps={[
            "Analyze historical performance data across millions of impressions",
            "Predict click-through and conversion probability for each bid request",
            "Adjust the bid price dynamically based on that predicted value",
            "Continuously learn from outcomes to improve the next prediction",
          ]}
        />
        <div className="mt-4">
          <ImpactCallout
            figure={<><span className="figure">20-40%</span> improvement in campaign ROI</>}
            description="Through bidding that prices each impression on its predicted value instead of paying the same amount for all of them."
          />
        </div>
      </section>

      <section>
        <h3 className="mb-1 text-lg text-foreground">Try it — price one impression</h3>
        <p className="measure mb-4 text-sm text-muted-foreground">
          Move the sliders and watch the AI bid move with them, while the flat bid sits still.
        </p>
        <BidPricer />
      </section>

      <section>
        <h3 className="mb-1 text-lg text-foreground">Try it — the same five impressions, two strategies</h3>
        <p className="measure mb-4 text-sm text-muted-foreground">
          Switch between AI bidding and a flat bid across a small batch, and watch which impressions
          each strategy wins.
        </p>
        <BidBatch />
      </section>

      <section>
        <h3 className="mb-3 text-lg text-foreground">Budget allocation</h3>
        <p className="measure mb-3 text-muted-foreground">
          AI optimizes budget distribution across campaigns, channels, and time.
        </p>
        <NumberedSteps
          steps={[
            "Forecast performance for different budget scenarios",
            "Reallocate spend to the highest-performing campaigns in real time",
            "Optimize pacing to meet goals efficiently across the day",
            "Balance reach, frequency, and conversion objectives against each other",
          ]}
        />
      </section>

      <section>
        <h3 className="mb-1 text-lg text-foreground">Try it — move the budget</h3>
        <p className="measure mb-4 text-sm text-muted-foreground">
          Set a total budget, then compare splitting it evenly across three campaigns against
          letting AI reallocate it toward the one with the best predicted return.
        </p>
        <BudgetAllocator />
      </section>

      <section>
        <h3 className="mb-1 text-lg text-foreground">The same job, aimed at a keyword</h3>
        <p className="measure mb-4 text-muted-foreground">
          In search advertising, AI streamlines campaign management through automated bidding,
          keyword optimization, and predictive analytics. It helps advertisers reach users with high
          intent by forecasting click-through and conversion rates, adjusting bids in real time, and
          suggesting new keyword opportunities based on historical performance and trends. That is
          the same bidder from above, priced per keyword instead of per impression — plus one job
          display bidding never needs, because display has no keyword to discover.
        </p>
        <ul className="space-y-2">
          {SEARCH_KEYWORDS.map((k) => {
            const bid = aiBidFor(k.ctr, k.convProb);
            return (
              <li key={k.keyword} className="rounded-lg border border-border bg-card p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-foreground">{k.keyword}</span>
                  <span className="text-sm text-muted-foreground">
                    suggested bid <span className="figure">${bid.toFixed(2)}</span>
                  </span>
                </div>
                <span className="text-sm text-muted-foreground">{k.note}</span>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

const lesson: LessonContent = {
  whyThisMatters: (
    <p>
      A stakeholder will ask why the same campaign pays a different price for every impression
      instead of one flat rate, and separately why the budget moved off a campaign that was doing
      fine. Both questions have the same answer: an AI is pricing and reallocating against a
      prediction, not holding a number steady.
    </p>
  ),
  objectives: [
    "Convert a predicted click-through rate and conversion probability into a bid price the way a DSP's bidder does",
    "Explain why an AI-set bid outperforms a single flat bid across a batch of impressions",
    "Describe how AI reallocates budget across campaigns while they are running, and why that beats an even split",
    "Say what AI automates in search advertising beyond display bidding",
  ],
  Body,
  takeaways: [
    "An AI bidder does not set one price — it predicts click-through rate and conversion probability for each impression and prices it accordingly, so it can pay more for the impressions actually worth more.",
    "Reallocating budget toward the campaigns with the best predicted return produces more total value than splitting it evenly, which is why a fixed even split protects nothing.",
    "In search advertising the AI job is the same shape as display bidding — automated bidding priced off forecasted click-through and conversion rates — plus one job display doesn't need: suggesting new keywords from historical performance and trends.",
  ],
  checkYourself: [
    {
      question:
        "A flat $2 bid wins impressions with a low predicted conversion probability and loses the impressions most likely to convert. Why?",
      answer: (
        <p>
          Because a flat bid is disconnected from predicted value — it wins or loses whatever it
          happens to be sitting on. Only a bid that scales with click-through rate and conversion
          probability will price the high-value impressions above what competitors are willing to
          pay for them, and let the low-value ones go uncontested.
        </p>
      ),
    },
    {
      question:
        "Your search campaign manager asks whether AI bidding for search is basically the same job as display. What's the same, and what's different?",
      answer: (
        <p>
          The same: automated bidding priced off forecasted click-through and conversion rates,
          adjusted in real time. Different: search's AI job also includes discovering new keyword
          opportunities from historical performance and trends — there is no equivalent "new unit to
          discover" in display, where the AI only ever prices an impression it was already offered.
        </p>
      ),
    },
  ],
};

export default lesson;

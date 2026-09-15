import { useState } from "react";

import type { LessonContent } from "@/components/journey/lesson-content";
import { cn } from "@/lib/utils";

type Model = "cpm" | "cpc" | "cpa";

const MODELS: Array<{ id: Model; label: string; unit: string; risk: string }> = [
  { id: "cpm", label: "CPM", unit: "per 1,000 impressions", risk: "The advertiser" },
  { id: "cpc", label: "CPC", unit: "per click", risk: "Shared" },
  { id: "cpa", label: "CPA", unit: "per conversion", risk: "The publisher or affiliate" },
];

const RATES: Record<Model, number> = { cpm: 5, cpc: 1.1, cpa: 20 };

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function Stepper({
  label,
  value,
  onDecrease,
  onIncrease,
  decreaseLabel,
  increaseLabel,
}: {
  label: string;
  value: string;
  onDecrease: () => void;
  onIncrease: () => void;
  decreaseLabel: string;
  increaseLabel: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-3">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onDecrease}
          aria-label={decreaseLabel}
          className="flex min-h-[2.75rem] min-w-[2.75rem] items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:text-foreground"
        >
          −
        </button>
        <span className="figure w-20 text-center text-foreground">{value}</span>
        <button
          type="button"
          onClick={onIncrease}
          aria-label={increaseLabel}
          className="flex min-h-[2.75rem] min-w-[2.75rem] items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:text-foreground"
        >
          +
        </button>
      </div>
    </div>
  );
}

function Body() {
  const [model, setModel] = useState<Model>("cpm");
  const [impressions, setImpressions] = useState(10000);
  const [ctr, setCtr] = useState(0.2);
  const [convRate, setConvRate] = useState(5);

  const clicks = Math.round(impressions * (ctr / 100));
  const conversions = Math.round(clicks * (convRate / 100));

  const cost =
    model === "cpm"
      ? (impressions / 1000) * RATES.cpm
      : model === "cpc"
        ? clicks * RATES.cpc
        : conversions * RATES.cpa;

  const perImpression = RATES.cpm / 1000;
  const current = MODELS.find((m) => m.id === model) ?? MODELS[0];

  return (
    <div className="space-y-8">
      <div className="measure space-y-4 text-muted-foreground">
        <p>
          Cost per mille (CPM) charges the advertiser a fixed rate for every 1,000 impressions
          served — mille is Latin for a thousand. Pricing is quoted in thousands rather than per
          impression because the per-impression price is tiny: at a $5.00 CPM, one impression costs
          $0.005, and billing an advertiser $0.002 line by line would be an accounting headache
          nobody wants.
        </p>
        <p>
          Cost per click (CPC) is a pricing model that expresses what each click on an ad costs the
          advertiser. Buy at a $1.10 CPC and every time a visitor clicks, the advertiser is charged
          $1.10 — the number of impressions it took to earn that click never enters the bill.
        </p>
        <p>
          Cost per action, or cost per acquisition (CPA), only charges the advertiser once a user
          converts — makes a purchase or submits a lead form — after viewing or clicking the ad.
          CPA is common in affiliate networks, though it is still less widespread than CPM or CPC.
        </p>
      </div>

      <section>
        <h3 className="mb-1 text-lg text-foreground">Try it</h3>
        <p className="measure mb-4 text-sm text-muted-foreground">
          Set a funnel — impressions, the share that click, the share of clicks that convert — then
          switch pricing models and watch the advertiser's bill get calculated from a completely
          different stage of that same funnel.
        </p>

        <div className="flex flex-wrap gap-2" role="group" aria-label="Choose a pricing model">
          {MODELS.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setModel(option.id)}
              aria-pressed={model === option.id}
              className={cn(
                "min-h-[2.75rem] rounded-lg border px-4 text-sm transition-colors",
                model === option.id
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border text-muted-foreground hover:text-foreground"
              )}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="mt-4 space-y-2">
          <Stepper
            label="Impressions bought"
            value={impressions.toLocaleString()}
            onDecrease={() => setImpressions((v) => clamp(v - 1000, 1000, 50000))}
            onIncrease={() => setImpressions((v) => clamp(v + 1000, 1000, 50000))}
            decreaseLabel="Decrease impressions by 1,000"
            increaseLabel="Increase impressions by 1,000"
          />
          <Stepper
            label="Click-through rate"
            value={`${ctr.toFixed(1)}%`}
            onDecrease={() => setCtr((v) => Number(clamp(v - 0.1, 0.1, 2).toFixed(1)))}
            onIncrease={() => setCtr((v) => Number(clamp(v + 0.1, 0.1, 2).toFixed(1)))}
            decreaseLabel="Decrease click-through rate by 0.1 percentage points"
            increaseLabel="Increase click-through rate by 0.1 percentage points"
          />
          <Stepper
            label="Conversion rate on clicks"
            value={`${convRate}%`}
            onDecrease={() => setConvRate((v) => clamp(v - 1, 1, 20))}
            onIncrease={() => setConvRate((v) => clamp(v + 1, 1, 20))}
            decreaseLabel="Decrease conversion rate by 1 percentage point"
            increaseLabel="Increase conversion rate by 1 percentage point"
          />
        </div>

        <div className="mt-4 rounded-lg border border-border bg-card p-5">
          <p className="measure text-sm text-muted-foreground">
            <span className="figure">{impressions.toLocaleString()}</span> impressions produce{" "}
            <span className="figure">{clicks.toLocaleString()}</span> clicks and{" "}
            <span className="figure">{conversions.toLocaleString()}</span> conversions.
          </p>

          <div className="mt-4 border-t border-border pt-4">
            <p className="text-xs uppercase text-muted-foreground">
              {current.label} rate: ${RATES[model].toFixed(2)} {current.unit}
            </p>
            <p className="figure mt-1 text-3xl text-foreground">${cost.toFixed(2)}</p>
            <p className="measure mt-1 text-sm text-muted-foreground">
              {model === "cpm" &&
                `Worked out per impression, that is $${perImpression.toFixed(3)} — the fraction of a cent CPM pricing exists to avoid billing directly.`}
              {model === "cpc" &&
                `Billed only on the ${clicks.toLocaleString()} clicks. It took ${impressions.toLocaleString()} impressions to produce them, and none of those impressions appear on the invoice.`}
              {model === "cpa" &&
                `Billed only on the ${conversions.toLocaleString()} conversions. Every impression and every click that did not convert cost the advertiser nothing directly.`}
            </p>
          </div>

          <div className="mt-4 border-t border-border pt-4">
            <p className="text-xs uppercase text-muted-foreground">Risk carried by</p>
            <p className="mt-1 text-foreground">{current.risk}</p>
          </div>
        </div>
      </section>

      <div className="measure space-y-4 text-muted-foreground">
        <p>
          Notice the pattern as you move from CPM to CPC to CPA: the event that triggers payment
          moves further down the funnel, and the risk of a poor-performing campaign moves with it.
          Under CPM the advertiser pays no matter what happens after the impression; under CPA the
          publisher or affiliate is paid only if the visitor actually converts.
        </p>
      </div>
    </div>
  );
}

const lesson: LessonContent = {
  whyThisMatters: (
    <p>
      A media plan proposes buying inventory on a CPA basis instead of the CPM rate you were
      quoted elsewhere, and before you can say whether that is a good deal for your side of the
      table, you need to know exactly what event triggers payment and who is left holding the risk
      if it never happens.
    </p>
  ),
  objectives: [
    "Explain what a mille is and why CPM is priced per thousand impressions instead of per impression",
    "Calculate the cost of a given number of impressions, clicks, or conversions under CPM, CPC, and CPA",
    "Say which side, advertiser or publisher, carries the risk under each pricing model",
  ],
  Body,
  takeaways: [
    "CPM charges the advertiser a fixed rate for every 1,000 impressions served — mille is Latin for a thousand — because pricing each individual impression at a fraction of a cent, such as $0.002, would be impractical to account for.",
    "CPC charges only for a click, so a $1.10 CPC deal bills the advertiser $1.10 every time a visitor clicks, regardless of how many impressions it took to produce that click.",
    "CPA pays the publisher or affiliate only once a user actually converts, which is common in affiliate networks but less widespread than CPM or CPC, and it is also where the performance risk sits most heavily on the seller rather than the buyer.",
  ],
  checkYourself: [
    {
      question: "An advertiser is quoted $0.002 per impression instead of a CPM rate. Why would an accountant push back on that?",
      answer: (
        <p>
          Because that is an awkwardly small unit to bill against — thousands of line items for a
          single campaign. The industry converts the same price into a $2.00 CPM instead, which is
          exactly the accounting problem mille pricing exists to solve.
        </p>
      ),
    },
    {
      question: "A publisher can offer the same inventory at $4 CPM or $20 CPA. Which one is riskier for the publisher to accept, and why?",
      answer: (
        <p>
          The $20 CPA deal. Under CPM the publisher gets paid for every impression served, whatever
          happens afterward. Under CPA, payment depends on the visitor actually converting once they
          leave the publisher's page — something largely outside the publisher's control.
        </p>
      ),
    },
    {
      question: "You are a publisher confident your traffic clicks well, but you have no way to see whether it converts once it leaves your page. Which pricing model should you push for, and why?",
      answer: (
        <p>
          CPM or CPC, not CPA. You cannot verify or influence what happens after the click, so
          agreeing to CPA means taking on the advertiser's downstream performance risk with no
          visibility into it — and no way to prove you delivered your side of the deal if a dispute
          comes up.
        </p>
      ),
    },
  ],
};

export default lesson;

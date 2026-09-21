import { useState } from "react";

import { IqmSpotlight } from "@/components/journey/IqmSpotlight";
import type { LessonContent } from "@/components/journey/lesson-content";
import { formatUSD, safeDiv, toggleClass } from "./_shared";

const DATA_ATTRIBUTES = [
  "Timestamp of the impression, click, or conversion",
  "IP address",
  "Campaign ID, line item ID, creative ID",
  "Geolocation, browser, operating system",
  "Publisher domain and placement",
];

const METRICS = [
  { metric: "Impressions", description: "Number of times an ad is displayed" },
  { metric: "Clicks", description: "Number of times an ad is clicked" },
  { metric: "Conversions", description: "Number of desired user actions completed" },
  { metric: "Reach", description: "Number of unique visitors or devices reached" },
  { metric: "CTR", description: "Click-through rate — (clicks ÷ impressions) × 100" },
  { metric: "CVR", description: "Conversion rate — (conversions ÷ clicks) × 100" },
  { metric: "CPM", description: "Cost per mille — cost per 1,000 impressions" },
  { metric: "CPC", description: "Cost per click" },
  { metric: "CPA", description: "Cost per action — cost per conversion" },
  { metric: "Amount spent", description: "Total media cost" },
  { metric: "Revenue", description: "Total conversion value" },
  { metric: "Viewability rate", description: "Percent of impressions that were viewable" },
];

type Campaign = {
  impressions: number;
  clicks: number;
  conversions: number;
  cost: number;
  revenue: number;
};

const PRESETS: Array<{ id: string; label: string; pricedAs: string } & Campaign> = [
  {
    id: "cpm",
    label: "Load campaign #1 — priced CPM",
    pricedAs: "CPM",
    impressions: 1_000_000,
    clicks: 1_500,
    conversions: 10,
    cost: 4_000,
    revenue: 5_200,
  },
  {
    id: "cpc",
    label: "Load campaign #2 — priced CPC",
    pricedAs: "CPC",
    impressions: 1_000_000,
    clicks: 2_000,
    conversions: 50,
    cost: 10_000,
    revenue: 13_000,
  },
  {
    id: "cpa",
    label: "Load campaign #3 — priced CPA",
    pricedAs: "CPA",
    impressions: 1_000_000,
    clicks: 2_500,
    conversions: 80,
    cost: 15_000,
    revenue: 19_500,
  },
];

function deriveMetrics(c: Campaign) {
  return {
    eCPM: safeDiv(c.cost, c.impressions) * 1000,
    eCPC: safeDiv(c.cost, c.clicks),
    eCPA: safeDiv(c.cost, c.conversions),
    ctr: safeDiv(c.clicks, c.impressions) * 100,
    cvr: safeDiv(c.conversions, c.clicks) * 100,
    roi: safeDiv(c.revenue - c.cost, c.cost) * 100,
  };
}

function Body() {
  const [campaign, setCampaign] = useState<Campaign>(PRESETS[0]);
  const [selectedPresetId, setSelectedPresetId] = useState<string>(PRESETS[0].id);

  const derived = deriveMetrics(campaign);

  const loadPreset = (preset: (typeof PRESETS)[number]) => {
    const { impressions, clicks, conversions, cost, revenue } = preset;
    setCampaign({ impressions, clicks, conversions, cost, revenue });
    setSelectedPresetId(preset.id);
  };

  const editField = (key: keyof Campaign, value: number) => {
    setCampaign((c) => ({ ...c, [key]: value }));
    setSelectedPresetId("");
  };

  const fields: { key: keyof Campaign; label: string; step: number }[] = [
    { key: "impressions", label: "Impressions", step: 10_000 },
    { key: "clicks", label: "Clicks", step: 100 },
    { key: "conversions", label: "Conversions", step: 5 },
    { key: "cost", label: "Cost", step: 500 },
    { key: "revenue", label: "Revenue", step: 500 },
  ];

  const outputs: { label: string; value: string; formula: string }[] = [
    { label: "eCPM", value: formatUSD(derived.eCPM), formula: "(cost ÷ impressions) × 1,000" },
    { label: "eCPC", value: formatUSD(derived.eCPC), formula: "cost ÷ clicks" },
    { label: "eCPA", value: formatUSD(derived.eCPA), formula: "cost ÷ conversions" },
    { label: "CTR", value: `${derived.ctr.toFixed(2)}%`, formula: "(clicks ÷ impressions) × 100" },
    { label: "CVR", value: `${derived.cvr.toFixed(2)}%`, formula: "(conversions ÷ clicks) × 100" },
    {
      label: "ROI",
      value: `${derived.roi >= 0 ? "+" : ""}${derived.roi.toFixed(1)}%`,
      formula: "(revenue − cost) ÷ cost × 100",
    },
  ];

  return (
    <div className="space-y-8">
      <div className="measure space-y-4 text-muted-foreground">
        <p>
          The reporting function gives both sides of the market visibility into how a campaign is
          actually doing. For every impression, click, and conversion event, the platform stores a
          set of attributes, and everything you see on a report is either one of those attributes or
          a value derived from combining them.
        </p>
        <ul className="mt-2 space-y-1.5">
          {DATA_ATTRIBUTES.map((attr) => (
            <li key={attr} className="flex gap-3 text-muted-foreground">
              <span aria-hidden="true" className="mt-2 h-1 w-1 shrink-0 rounded-full bg-primary" />
              <span>{attr}</span>
            </li>
          ))}
        </ul>
      </div>

      <IqmSpotlight>
        IQM's reporting layer runs this analysis automatically: an AI-powered bid drop-off funnel
        pinpoints exactly where in the auction chain — request, bid, win, render — impressions are
        being lost, instead of leaving a trafficker to infer it from a handful of aggregate metrics.
      </IqmSpotlight>

      <section>
        <h3 className="mb-3 text-lg text-foreground">Key reporting metrics</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {METRICS.map((item) => (
            <div key={item.metric} className="rounded-lg border border-border bg-card p-3">
              <p className="text-foreground">{item.metric}</p>
              <p className="mt-0.5 text-sm text-muted-foreground">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h3 className="mb-1 text-lg text-foreground">Try it — the effective metrics calculator</h3>
        <p className="measure mb-4 text-sm text-muted-foreground">
          Load any of the three campaigns from the book — one priced CPM, one CPC, one CPA, all with
          the same million impressions — or edit the numbers yourself. Every "effective" metric below
          restates the same spend in the same units, so campaigns priced completely differently
          become directly comparable.
        </p>

        <div className="flex flex-wrap gap-2" role="group" aria-label="Load a preset campaign">
          {PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => loadPreset(preset)}
              className={toggleClass(selectedPresetId === preset.id)}
            >
              {preset.label}
            </button>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {fields.map((field) => (
            <label key={field.key} className="block">
              <span className="text-xs uppercase text-muted-foreground">{field.label}</span>
              <input
                type="number"
                min={0}
                step={field.step}
                value={campaign[field.key]}
                onChange={(e) => editField(field.key, Math.max(0, Number(e.target.value) || 0))}
                className="figure mt-1.5 min-h-[2.75rem] w-full rounded-lg border border-border bg-card px-3 text-sm text-foreground focus-visible:border-primary"
              />
            </label>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {outputs.map((item) => (
            <div key={item.label} className="rounded-lg border border-border bg-card p-3">
              <p className="text-xs uppercase text-muted-foreground">{item.label}</p>
              <p className="figure mt-1 text-lg text-foreground">{item.value}</p>
              <p className="mt-1 text-sm text-muted-foreground">{item.formula}</p>
            </div>
          ))}
        </div>

        <p className="measure mt-4 text-sm text-muted-foreground">
          ROI excludes operational costs entirely — worth remembering for physical goods, less
          important for a digital product with almost no marginal cost. Effective metrics also let a
          publisher retroactively ask what its revenue would have looked like under a different
          pricing model.
        </p>
      </section>

      <section>
        <h3 className="mb-3 text-lg text-foreground">The same three campaigns, side by side</h3>
        <p className="measure mb-3 text-sm text-muted-foreground">
          This is the comparison that makes the e-prefix worth having: rank these by eCPM and
          campaign #1 wins. Rank them by eCPA and campaign #1 loses badly. Nothing about the
          campaigns changed between those two rankings — only which effective metric you read.
        </p>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-secondary text-muted-foreground">
              <tr>
                <th className="p-3 font-normal">Campaign</th>
                <th className="p-3 font-normal">Priced as</th>
                <th className="p-3 font-normal">Cost</th>
                <th className="p-3 font-normal">eCPM</th>
                <th className="p-3 font-normal">eCPC</th>
                <th className="p-3 font-normal">eCPA</th>
              </tr>
            </thead>
            <tbody>
              {PRESETS.map((preset, index) => {
                const m = deriveMetrics(preset);
                return (
                  <tr key={preset.id} className={index > 0 ? "border-t border-border" : undefined}>
                    <td className="p-3 text-foreground">#{index + 1}</td>
                    <td className="p-3 text-muted-foreground">{preset.pricedAs}</td>
                    <td className="figure p-3 text-foreground">{formatUSD(preset.cost)}</td>
                    <td className="figure p-3 text-foreground">{formatUSD(m.eCPM)}</td>
                    <td className="figure p-3 text-foreground">{formatUSD(m.eCPC)}</td>
                    <td className="figure p-3 text-foreground">{formatUSD(m.eCPA)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

const lesson: LessonContent = {
  whyThisMatters: (
    <p>
      You will be handed a report full of metrics you have never priced a campaign against and asked
      whether the number is good. Knowing which raw counters everything derives from, and which
      metrics can only be compared after converting to the same units, is what turns that question
      into something you can actually answer.
    </p>
  ),
  objectives: [
    "List the core metrics found on almost any campaign report and what each counts",
    "Compute eCPM, eCPC, and eCPA for a campaign and say what makes them effective",
    "Compute CTR, CVR, and ROI, and say what ROI leaves out",
    "Use effective metrics to compare campaigns priced under different models",
  ],
  Body,
  takeaways: [
    "A report's metrics come from a handful of event attributes stored per impression, click, and conversion — the rest are derived by combining them, like CTR from clicks divided by impressions.",
    "eCPM, eCPC, and eCPA restate a campaign's cost per 1,000 impressions, per click, and per conversion no matter how it was actually priced, which is the only way to compare a CPM deal against a CPC or CPA one.",
    "ROI tells you whether a campaign made money relative to what it cost, but it ignores operational costs entirely, so it means less for a service with high fulfillment costs than for a digital product with almost none.",
  ],
  checkYourself: [
    {
      question:
        "Three campaigns were priced CPM, CPC, and CPA respectively, and each spent a different total amount. How do you compare their performance fairly?",
      answer: (
        <p>
          Convert all three to effective metrics — eCPM, eCPC, eCPA — which normalize by outcome
          rather than by the pricing model each one happened to be sold under. Comparing raw spend
          or raw CPM alone would only be fair if all three used the same pricing model.
        </p>
      ),
    },
    {
      question:
        "A campaign's eCPA looks like the cheapest of three options while its eCPM looks like the most expensive. Which number should you trust?",
      answer: (
        <p>
          Neither is more correct — it depends what you are optimizing for. Read eCPA if the goal is
          conversions and eCPM if the goal is reach. The ranking legitimately flips depending on the
          objective, which is exactly why a report shows more than one effective metric.
        </p>
      ),
    },
    {
      question:
        "A campaign shows +20% ROI, but the product it is selling has high production and fulfillment costs. Is the campaign definitely profitable?",
      answer: (
        <p>
          Not necessarily. The ROI formula excludes operational costs, so a healthy-looking ROI can
          still hide a loss once real-world fulfillment costs are added — a bigger risk for physical
          goods than for a digital product with low marginal cost.
        </p>
      ),
    },
  ],
};

export default lesson;

/**
 * Pure maths for the "Life of an impression" simulator (unit-tested).
 *
 * Rates and funnel defaults come from the basics lessons (pricing-models,
 * impressions-and-viewability, click-to-conversion): $5.00 CPM, $1.10 CPC,
 * $20 CPA, a 0.2% CTR and a 5% conversion rate. The viewability shares per
 * slot position are illustrative — the lessons give the rule (50% of the ad
 * on screen for 1+ second), not a rate.
 */

export type Model = "cpm" | "cpc" | "cpa";
export type SlotPosition = "above" | "below";

export interface Rates {
  cpm: number;
  cpc: number;
  cpa: number;
}

export interface Funnel {
  impressions: number;
  viewable: number;
  clicks: number;
  conversions: number;
}

export const MODELS: Array<{ id: Model; label: string; unit: string; trigger: string; risk: string }> = [
  { id: "cpm", label: "CPM", unit: "per 1,000 impressions", trigger: "every impression served", risk: "The advertiser" },
  { id: "cpc", label: "CPC", unit: "per click", trigger: "each click", risk: "Shared" },
  { id: "cpa", label: "CPA", unit: "per conversion", trigger: "each conversion", risk: "The publisher or affiliate" },
];

/** The lesson's quoted rates. */
export const DEFAULT_RATES: Rates = { cpm: 5, cpc: 1.1, cpa: 20 };

/** IAB display rule from the viewability lesson. */
export const VIEWABLE_RULE = { share: 50, seconds: 1 } as const;

/** Illustrative share of impressions that become viewable, by slot position. */
export const VIEWABILITY: Record<SlotPosition, number> = { above: 0.7, below: 0.3 };

const cents = (v: number) => Math.round(v * 100) / 100;

/** Impressions → viewable → clicks → conversions. CTR is clicks ÷ impressions, as the lesson defines it. */
export function buildFunnel(impressions: number, ctrPct: number, convRatePct: number, slot: SlotPosition): Funnel {
  const clicks = Math.round(impressions * (ctrPct / 100));
  return {
    impressions,
    viewable: Math.round(impressions * VIEWABILITY[slot]),
    clicks,
    conversions: Math.round(clicks * (convRatePct / 100)),
  };
}

/** What the same campaign costs the advertiser under each pricing model. */
export function campaignCosts(funnel: Funnel, rates: Rates): Record<Model, number> {
  return {
    cpm: cents((funnel.impressions / 1000) * rates.cpm),
    cpc: cents(funnel.clicks * rates.cpc),
    cpa: cents(funnel.conversions * rates.cpa),
  };
}

/** Every model tied for the lowest cost (usually one). */
export function cheapestModels(costs: Record<Model, number>): Model[] {
  const min = Math.min(costs.cpm, costs.cpc, costs.cpa);
  return (Object.keys(costs) as Model[]).filter((m) => Math.abs(costs[m] - min) < 0.005);
}

/** The challenge: the learner's pick is (one of) the cheapest models for the advertiser. */
export function isCheapestPick(pick: Model | null, costs: Record<Model, number>): boolean {
  return pick !== null && cheapestModels(costs).includes(pick);
}

/** CPM spend on impressions nobody could have seen. */
export function unseenCpmSpend(funnel: Funnel, rates: Rates): number {
  return cents(((funnel.impressions - funnel.viewable) / 1000) * rates.cpm);
}

/* -------------------------------------------------------------------------- */
/* One visitor at a time                                                      */
/* -------------------------------------------------------------------------- */

/** Real milliseconds one simulated page load takes on screen. */
export const LOAD_MS = 2600;
/** Within a load: the ad tag fires, then the creative renders and the impression counts. */
export const TAG_AT = 350;
export const IMPRESSION_AT = 800;
/** When a below-the-fold slot scrolls into view (if the visitor scrolls at all). */
export const SCROLL_AT = 1150;

/**
 * Whether visitor number `index` keeps the ad in view long enough to count.
 * Deterministic (a golden-ratio sequence), so replays match and the share
 * converges on VIEWABILITY for the slot.
 */
export function visitIsViewable(index: number, slot: SlotPosition): boolean {
  const u = (index * 0.6180339887 + 0.31) % 1;
  return u < VIEWABILITY[slot];
}

/** When, within a load, the slot enters the viewport (null = it never does). */
export function inViewAt(index: number, slot: SlotPosition): number | null {
  if (slot === "above") return IMPRESSION_AT;
  return visitIsViewable(index, slot) ? SCROLL_AT : null;
}

/** When, within a load, the impression becomes viewable (null = never). */
export function viewableAt(index: number, slot: SlotPosition): number | null {
  if (!visitIsViewable(index, slot)) return null;
  const start = inViewAt(index, slot);
  return start === null ? null : start + VIEWABLE_RULE.seconds * 1000;
}

/** Session counters at elapsed time t across back-to-back loads. */
export function sessionCounts(t: number, slot: SlotPosition, maxLoads: number) {
  let impressions = 0;
  let viewable = 0;
  for (let i = 0; i < maxLoads; i++) {
    const start = i * LOAD_MS;
    if (t >= start + IMPRESSION_AT) impressions++;
    const v = viewableAt(i, slot);
    if (v !== null && t >= start + v) viewable++;
  }
  return { impressions, viewable };
}

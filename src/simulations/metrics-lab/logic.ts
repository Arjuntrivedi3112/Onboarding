/**
 * Pure maths for the metrics and reconciliation lab (unit-tested).
 *
 * Part one turns raw counts into the effective metrics the tracking lessons
 * define. Part two counts the same served impressions the way a publisher's
 * ad server and an advertiser's third-party ad server would, and explains
 * the gap with the causes those lessons name.
 */

export interface Campaign {
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
}

/** Divide safely, returning 0 instead of NaN or Infinity when the denominator is 0. */
export function safeDiv(a: number, b: number): number {
  return b > 0 ? a / b : 0;
}

export interface EffectiveMetrics {
  /** (cost ÷ impressions) × 1,000 */
  eCPM: number;
  /** cost ÷ clicks */
  eCPC: number;
  /** cost ÷ conversions */
  eCPA: number;
  /** (clicks ÷ impressions) × 100 */
  ctr: number;
  /** (conversions ÷ clicks) × 100 */
  cvr: number;
}

export function effectiveMetrics(c: Campaign): EffectiveMetrics {
  return {
    eCPM: safeDiv(c.spend, c.impressions) * 1000,
    eCPC: safeDiv(c.spend, c.clicks),
    eCPA: safeDiv(c.spend, c.conversions),
    ctr: safeDiv(c.clicks, c.impressions) * 100,
    cvr: safeDiv(c.conversions, c.clicks) * 100,
  };
}

/** The three campaigns from the effective-metrics lesson: same million impressions, priced CPM, CPC and CPA. */
export const PRESETS: Array<{ id: string; label: string } & Campaign> = [
  { id: "cpm", label: "Campaign #1 · CPM", spend: 4_000, impressions: 1_000_000, clicks: 1_500, conversions: 10 },
  { id: "cpc", label: "Campaign #2 · CPC", spend: 10_000, impressions: 1_000_000, clicks: 2_000, conversions: 50 },
  { id: "cpa", label: "Campaign #3 · CPA", spend: 15_000, impressions: 1_000_000, clicks: 2_500, conversions: 80 },
];

/* -------------------------------------------------------------------------- */
/* Reconciliation                                                             */
/* -------------------------------------------------------------------------- */

/**
 * How the two systems count.
 * - mixed:  the publisher's ad server counts requests (server-side), the advertiser's counts its pixel (client-side)
 * - pixel:  dual pixel — both count a pixel fired from the same markup, so both lose the same failed renders
 * - server: both count server-side, so nothing in the browser has to succeed
 */
export type Counting = "mixed" | "pixel" | "server";

export interface Scenario {
  counting: Counting;
  /** Does the publisher's ad server filter bot traffic the way the advertiser's verification vendor does? */
  publisherFiltersBots: boolean;
  /** Ad blockers, slow connections and script errors stop some pixels firing. */
  clientIssues: boolean;
  /** Is the advertiser counting only viewable impressions (50% of pixels for 1 second)? */
  advertiserViewableOnly: boolean;
}

/** Share of served traffic that is bots, always removed by the advertiser's third-party verification. */
export const BOT_SHARE = 0.06;
/** The discrepancy lesson's numbers: an ad blocker strips 8% of pixels, added latency drops 3% of renders. */
export const AD_BLOCK_LOSS = 0.08;
export const LATENCY_LOSS = 0.03;
export const CLIENT_LOSS = AD_BLOCK_LOSS + LATENCY_LOSS;
/** Share of rendered impressions that meet the viewability standard. */
export const VIEWABLE_RATE = 0.6;
/** The IAB's recommended tolerance, in percent, measured against the advertiser's number. */
export const IAB_TOLERANCE = 10;

export interface Reconciliation {
  publisher: number;
  advertiser: number;
  /** (publisher − advertiser) ÷ advertiser × 100 */
  discrepancyPct: number;
  /** How the publisher's extra count breaks down; the three parts sum to publisher − advertiser. */
  gap: { bots: number; renders: number; viewability: number };
}

/** Count `served` impressions the way each side would, and explain the difference. */
export function reconcile(served: number, s: Scenario): Reconciliation {
  const loss = s.clientIssues ? CLIENT_LOSS : 0;
  const publisher = served * (s.publisherFiltersBots ? 1 - BOT_SHARE : 1) * (s.counting === "pixel" ? 1 - loss : 1);
  const advertiser = served * (1 - BOT_SHARE) * (s.counting === "server" ? 1 : 1 - loss) * (s.advertiserViewableOnly ? VIEWABLE_RATE : 1);

  // Walk from the publisher's number to the advertiser's, one cause at a time.
  let running = publisher;
  const bots = s.publisherFiltersBots ? 0 : running * BOT_SHARE;
  running -= bots;
  const renders = s.counting === "mixed" ? running * loss : 0;
  running -= renders;
  const viewability = s.advertiserViewableOnly ? running * (1 - VIEWABLE_RATE) : 0;

  return {
    publisher,
    advertiser,
    discrepancyPct: safeDiv(publisher - advertiser, advertiser) * 100,
    gap: { bots, renders, viewability },
  };
}

export function withinTolerance(discrepancyPct: number): boolean {
  return Math.abs(discrepancyPct) <= IAB_TOLERANCE;
}

/** The challenge: discrepancy within the IAB's 10% and eCPM between $2 and $5. */
export function reconciledAndPriced(eCPM: number, discrepancyPct: number): boolean {
  return withinTolerance(discrepancyPct) && eCPM >= 2 && eCPM <= 5;
}

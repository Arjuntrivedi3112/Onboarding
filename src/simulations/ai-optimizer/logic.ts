/**
 * Pure maths for the AI bidding and budget optimizer (unit-tested).
 *
 * One simulated day of auction opportunities, generated from a seed so the
 * same settings always replay the same day. Two buyers see the identical
 * stream: "Rules" bids a flat price and splits budget evenly; "Model" prices
 * each impression from its predicted conversion probability (bid = pConv ×
 * target CPA, capped) and can move budget toward the channels performing
 * best. Prices are per impression and deliberately toy-sized, like the
 * lessons' examples — the shape of the decision is real, the rates are not.
 */

export type ChannelId = "search" | "social" | "display" | "video";

export interface ChannelProfile {
  id: ChannelId;
  name: string;
  /** Share of the day's impressions that come from this channel. */
  share: number;
  /** Typical predicted conversion probability (0–1). */
  meanConv: number;
  /** Typical competing price per impression, in dollars. */
  basePrice: number;
}

export const CHANNELS: ChannelProfile[] = [
  { id: "search", name: "Search", share: 0.2, meanConv: 0.16, basePrice: 0.95 },
  { id: "social", name: "Social", share: 0.3, meanConv: 0.07, basePrice: 0.6 },
  { id: "display", name: "Display", share: 0.33, meanConv: 0.025, basePrice: 0.4 },
  { id: "video", name: "Video", share: 0.17, meanConv: 0.05, basePrice: 0.75 },
];

export const CHANNEL_IDS = CHANNELS.map((c) => c.id);

export interface Impression {
  index: number;
  /** Minute of the day it arrives, 0–1440. */
  minute: number;
  channel: ChannelId;
  /** The model's predicted conversion probability (0–1). */
  pConv: number;
  /** Highest competing bid; you must bid at least this to win. */
  market: number;
  /**
   * The impression's real chance of converting. The model only sees its
   * prediction (pConv), which is close but not exact.
   */
  pTrue: number;
}

export const IMPRESSIONS_PER_DAY = 500;
export const DAY_MINUTES = 1440;
/** Reallocation checkpoints across the day. */
export const CHECKPOINTS = 8;

/** Deterministic PRNG (mulberry32): same seed, same day. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A standard-normal draw from two uniforms (Box–Muller). */
function normal(rand: () => number): number {
  const u = Math.max(1e-9, rand());
  const v = rand();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

/** Traffic is quiet overnight and peaks in the evening. */
function trafficWeight(minute: number): number {
  const h = minute / 60;
  return 0.25 + Math.exp(-((h - 13) ** 2) / 18) + 1.1 * Math.exp(-((h - 20.5) ** 2) / 6);
}

/** Generate one day of impressions, in arrival order. */
export function generateDay(seed: number, count = IMPRESSIONS_PER_DAY): Impression[] {
  const rand = mulberry32(seed * 7919 + 17);

  // Arrival times: rejection-sample against the traffic curve, then sort.
  const maxW = 1.6;
  const minutes: number[] = [];
  while (minutes.length < count) {
    const m = rand() * DAY_MINUTES;
    if (rand() * maxW <= trafficWeight(m)) minutes.push(m);
  }
  minutes.sort((a, b) => a - b);

  return minutes.map((minute, index) => {
    let r = rand();
    let profile = CHANNELS[CHANNELS.length - 1];
    for (const c of CHANNELS) {
      if (r < c.share) {
        profile = c;
        break;
      }
      r -= c.share;
    }
    const pConv = clamp(profile.meanConv * Math.exp(0.8 * normal(rand) - 0.32), 0.004, 0.6);
    // Competitors see value too, but only partly: price rises a little with pConv.
    const market = round2(profile.basePrice * Math.exp(0.35 * normal(rand)) + 1.5 * pConv);
    const pTrue = clamp(pConv * Math.exp(0.3 * normal(rand)), 0.002, 0.7);
    return { index, minute, channel: profile.id, pConv: round4(pConv), market, pTrue: round4(pTrue) };
  });
}

export interface Strategy {
  /** "flat" bids the same price everywhere; "model" bids pConv × target CPA. */
  bidding: "flat" | "model";
  flatBid: number;
  targetCpa: number;
  bidCap: number;
  /** Move remaining budget toward the channels with the best expected return. */
  reallocate: boolean;
  dailyBudget: number;
}

/** What one buyer bids on one impression. */
export function bidFor(imp: Pick<Impression, "pConv">, s: Pick<Strategy, "bidding" | "flatBid" | "targetCpa" | "bidCap">): number {
  if (s.bidding === "flat") return s.flatBid;
  return round2(Math.min(s.bidCap, imp.pConv * s.targetCpa));
}

export interface LaneFrame {
  /** Cumulative totals after this impression. */
  spend: number;
  won: number;
  conversions: number;
  /** Bid placed (0 when the channel's budget was spent). */
  bid: number;
  outcome: "won" | "lost" | "no-budget";
  /** This won impression tipped the conversion count up by one. */
  converted: boolean;
}

export interface AllocationSnapshot {
  /** Index of the first impression this allocation applies to. */
  fromIndex: number;
  /** Total budget assigned to each channel (spent + remaining). */
  budget: Record<ChannelId, number>;
}

export interface LaneResult {
  frames: LaneFrame[];
  allocations: AllocationSnapshot[];
  spendByChannel: Record<ChannelId, number>;
  convByChannel: Record<ChannelId, number>;
  spend: number;
  won: number;
  conversions: number;
  /** Cost per conversion; Infinity when nothing converted. */
  cpa: number;
}

const zero = (): Record<ChannelId, number> => ({ search: 0, social: 0, display: 0, video: 0 });

/**
 * Run one buyer through the day. First-price: a winning bid pays itself.
 * Conversions accumulate each won impression's true conversion chance and
 * count a whole conversion each time the running total crosses the next
 * integer — the expected outcome without coin-flip noise, so the same
 * settings always tell the same story.
 * Each channel has its own slice of the daily budget; when it is spent, that
 * channel stops bidding. With reallocation on, at each checkpoint the
 * unspent budget is re-split in proportion to each channel's expected
 * conversions per dollar so far (the model's own predictions, smoothed).
 */
export function runLane(day: Impression[], s: Strategy): LaneResult {
  const budget = zero();
  for (const c of CHANNELS) budget[c.id] = s.dailyBudget / CHANNELS.length;
  const spent = zero();
  const expected = zero();
  const convByChannel = zero();
  const frames: LaneFrame[] = [];
  const allocations: AllocationSnapshot[] = [{ fromIndex: 0, budget: { ...budget } }];
  const every = Math.ceil(day.length / CHECKPOINTS);

  let spend = 0;
  let won = 0;
  let conversions = 0;
  let expectedConv = 0;

  day.forEach((imp, i) => {
    if (s.reallocate && i > 0 && i % every === 0) {
      reallocate(budget, spent, expected, s.dailyBudget);
      allocations.push({ fromIndex: i, budget: { ...budget } });
    }
    const bid = bidFor(imp, s);
    const left = budget[imp.channel] - spent[imp.channel];
    let outcome: LaneFrame["outcome"] = "lost";
    let converted = false;
    if (left < bid || bid <= 0) {
      outcome = "no-budget";
    } else if (bid >= imp.market) {
      outcome = "won";
      spent[imp.channel] += bid;
      expected[imp.channel] += imp.pConv;
      spend += bid;
      won += 1;
      expectedConv += imp.pTrue;
      const whole = Math.floor(expectedConv + 0.5);
      if (whole > conversions) {
        converted = true;
        convByChannel[imp.channel] += whole - conversions;
        conversions = whole;
      }
    }
    frames.push({ spend: round2(spend), won, conversions, bid: outcome === "no-budget" ? 0 : bid, outcome, converted });
  });

  return {
    frames,
    allocations,
    spendByChannel: spent,
    convByChannel,
    spend: round2(spend),
    won,
    conversions,
    cpa: conversions > 0 ? spend / conversions : Infinity,
  };
}

/** Re-split the unspent budget by smoothed expected conversions per dollar. */
function reallocate(budget: Record<ChannelId, number>, spent: Record<ChannelId, number>, expected: Record<ChannelId, number>, daily: number) {
  const totalSpent = CHANNEL_IDS.reduce((a, c) => a + spent[c], 0);
  const remaining = Math.max(0, daily - totalSpent);
  // A small prior keeps an untested channel from being starved forever.
  const PRIOR_SPEND = 4;
  const PRIOR_CONV = 0.06;
  const score = zero();
  for (const c of CHANNEL_IDS) score[c] = ((expected[c] + PRIOR_CONV) / (spent[c] + PRIOR_SPEND)) ** 2;
  const total = CHANNEL_IDS.reduce((a, c) => a + score[c], 0) || 1;
  for (const c of CHANNEL_IDS) budget[c] = spent[c] + remaining * (score[c] / total);
}

export interface DayResult {
  rules: LaneResult;
  model: LaneResult;
  /** Fractional CPA improvement of model over rules (0.3 = 30% cheaper). */
  improvement: number;
}

export interface Settings {
  seed: number;
  flatBid: number;
  targetCpa: number;
  bidCap: number;
  modelBidding: boolean;
  reallocate: boolean;
  dailyBudget: number;
}

export const DEFAULT_SETTINGS: Settings = {
  seed: 1,
  flatBid: 1.0,
  targetCpa: 25,
  bidCap: 3,
  modelBidding: false,
  reallocate: false,
  dailyBudget: 240,
};

/** Rules always bid flat and split evenly; the model lane uses the toggles. */
export function simulateDay(settings: Settings, day = generateDay(settings.seed)): DayResult {
  const rules = runLane(day, {
    bidding: "flat",
    flatBid: settings.flatBid,
    targetCpa: settings.targetCpa,
    bidCap: settings.bidCap,
    reallocate: false,
    dailyBudget: settings.dailyBudget,
  });
  const model = runLane(day, {
    bidding: settings.modelBidding ? "model" : "flat",
    flatBid: settings.flatBid,
    targetCpa: settings.targetCpa,
    bidCap: settings.bidCap,
    reallocate: settings.reallocate,
    dailyBudget: settings.dailyBudget,
  });
  return { rules, model, improvement: improvementOf(rules.cpa, model.cpa) };
}

/** How much cheaper the model's cost per conversion is than the rules'. */
export function improvementOf(rulesCpa: number, modelCpa: number): number {
  if (!Number.isFinite(modelCpa)) return -Infinity;
  if (!Number.isFinite(rulesCpa)) return 1;
  return 1 - modelCpa / rulesCpa;
}

/** Share of the daily budget the model lane must actually spend for a win to count. */
export const MIN_BUDGET_USE = 0.5;

/**
 * The challenge: with model bidding on, its CPA is at least 25% lower while
 * spending at least half the daily budget — a model that barely buys can
 * look cheap without doing the job.
 */
export function beatsTheRules(result: DayResult, modelBidding: boolean, dailyBudget = DEFAULT_SETTINGS.dailyBudget): boolean {
  return (
    modelBidding &&
    result.model.conversions > 0 &&
    result.improvement >= 0.25 &&
    result.model.spend >= dailyBudget * MIN_BUDGET_USE
  );
}

/** How many impressions have arrived by a given minute (binary search). */
export function arrivedBy(day: Impression[], minute: number): number {
  let lo = 0;
  let hi = day.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (day[mid].minute <= minute) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

/** The allocation in force at a given impression index. */
export function allocationAt(lane: LaneResult, index: number): AllocationSnapshot {
  let current = lane.allocations[0];
  for (const a of lane.allocations) if (a.fromIndex <= index) current = a;
  return current;
}

/** Totals for a lane after `count` impressions have arrived. */
export function laneAt(lane: LaneResult, count: number): { spend: number; won: number; conversions: number } {
  if (count <= 0) return { spend: 0, won: 0, conversions: 0 };
  const f = lane.frames[Math.min(count, lane.frames.length) - 1];
  return { spend: f.spend, won: f.won, conversions: f.conversions };
}

/** Per-channel spend after `count` impressions. */
export function channelSpendAt(day: Impression[], lane: LaneResult, count: number): Record<ChannelId, number> {
  const out = zero();
  for (let i = 0; i < Math.min(count, day.length); i++) {
    if (lane.frames[i].outcome === "won") out[day[i].channel] += lane.frames[i].bid;
  }
  return out;
}

export function clockLabel(minute: number): string {
  const m = Math.min(DAY_MINUTES - 1, Math.max(0, Math.floor(minute)));
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

function clamp(v: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, v));
}

function round4(v: number) {
  return Math.round(v * 10000) / 10000;
}

function round2(v: number) {
  return Math.round(v * 100) / 100;
}

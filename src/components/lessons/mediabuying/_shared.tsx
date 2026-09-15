/**
 * Shared material for the media-buying section.
 *
 * Three things get reused across lessons rather than redefined per file:
 *  - the three DSPs bidding on one impression (the auction lesson's live bids
 *    are the same numbers the auction-dynamics lesson does its math on)
 *  - the four demand tiers a publisher calls in a waterfall (called one at a
 *    time in the waterfall lesson, called all at once in the header-bidding
 *    lesson)
 *  - the four reasons a demand source returns no bid at all
 */

/** One bid from one DSP in a live auction, in CPM dollars. */
export interface Bid {
  id: string;
  dsp: string;
  amount: number;
}

/**
 * The three DSPs bidding on one impression. Used as the live bids in the
 * auction-in-100ms lesson and as the starting point for the clearing-price
 * calculator in the auction-dynamics lesson, so a learner recognizes the
 * numbers when the math behind them shows up a lesson later.
 */
export const DEFAULT_BIDS: Bid[] = [
  { id: "alpha", dsp: "DSP Alpha", amount: 4.5 },
  { id: "beta", dsp: "DSP Beta", amount: 3.8 },
  { id: "gamma", dsp: "DSP Gamma", amount: 2.9 },
];

/** The highest bid in a set. Assumes at least one bid is present. */
export function highestBid(bids: Bid[]): Bid {
  return bids.reduce((a, b) => (b.amount > a.amount ? b : a));
}

/** The second-highest bid in a set, falling back to the winner if only one bid remains. */
export function secondHighestBid(bids: Bid[]): Bid {
  const winner = highestBid(bids);
  const rest = bids.filter((b) => b.id !== winner.id);
  return rest.length > 0 ? highestBid(rest) : winner;
}

/** Second-price clearing: one cent above the runner-up. */
export function secondPriceClearing(bids: Bid[]): number {
  return secondHighestBid(bids).amount + 0.01;
}

/**
 * The four demand tiers a publisher's ad server calls in sequence before
 * falling back to a house ad. `historicCpm` is the average yield the tier has
 * delivered in the past — the number a static waterfall ranks it by, whether
 * or not it still reflects what the tier would pay right now.
 */
export interface WaterfallTier {
  id: string;
  label: string;
  historicCpm: number;
}

export const WATERFALL_TIERS: WaterfallTier[] = [
  { id: "direct", label: "Direct deals", historicCpm: 8.0 },
  { id: "exchange1", label: "RTB exchange #1", historicCpm: 3.2 },
  { id: "exchange2", label: "RTB exchange #2", historicCpm: 2.5 },
  { id: "remnant", label: "Remnant network", historicCpm: 2.0 },
];

/** The four reasons the book gives for a demand source returning no bid. */
export const NO_BID_REASONS = [
  {
    id: "no-match",
    label: "No matching campaigns",
    detail: "The advertiser's targeting criteria don't align with this page or this user's profile.",
  },
  {
    id: "floor",
    label: "High floor price",
    detail: "The publisher's floor price is above every bid this source is willing to place.",
  },
  {
    id: "capping",
    label: "Impression capping",
    detail: "This user already hit the advertiser's frequency limit for the period.",
  },
  {
    id: "timeout",
    label: "Timeout",
    detail:
      "The ad server, DSP, or network took too long to respond. The chain ends here with no ad shown at all.",
  },
] as const;

export type NoBidReasonId = (typeof NO_BID_REASONS)[number]["id"];

export function noBidReason(id: NoBidReasonId) {
  return NO_BID_REASONS.find((r) => r.id === id) ?? NO_BID_REASONS[0];
}

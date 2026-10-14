/** Pure auction maths for the RTB simulator (unit-tested). */

export type AuctionType = "second" | "first";

export interface Outcome {
  /** DSP ids at or above the floor, highest bid first. */
  eligible: string[];
  winner: string | null;
  /** CPM the winner pays, rounded to cents; null when unsold. */
  price: number | null;
  runnerUp: string | null;
}

/**
 * Highest eligible bid wins. First-price pays its own bid; second-price pays
 * one cent above the runner-up (or the floor, if nobody else cleared it),
 * never more than its own bid.
 */
export function runAuction(bids: Record<string, number>, floor: number, type: AuctionType): Outcome {
  const eligible = Object.entries(bids)
    .filter(([, amount]) => amount >= floor)
    .sort((a, b) => b[1] - a[1]);
  if (eligible.length === 0) return { eligible: [], winner: null, price: null, runnerUp: null };
  const [winnerId, winnerBid] = eligible[0];
  const runner = eligible[1];
  const price = type === "first" ? winnerBid : Math.min(winnerBid, Math.max(runner ? runner[1] : floor, floor) + 0.01);
  return {
    eligible: eligible.map(([id]) => id),
    winner: winnerId,
    price: Math.round(price * 100) / 100,
    runnerUp: runner?.[0] ?? null,
  };
}

/** The challenge: Beta wins and pays under $3.50. */
export function betaWinsCheaply(outcome: Outcome): boolean {
  return outcome.winner === "beta" && outcome.price !== null && outcome.price < 3.5;
}

/**
 * Pure model of the AdTech stack for the ecosystem-flow simulator (unit-tested).
 *
 * The chain and each platform's job follow the technology lessons
 * (why-there-is-a-stack, the-buy-side, the-sell-side-and-the-auction,
 * who-runs-the-stack). The fee percentages are ILLUSTRATIVE — the lessons
 * do not quote take rates — and are labelled that way on screen.
 */

export type Mode = "open" | "walled";
export type Role = "advertiser" | "agency" | "dsp" | "exchange" | "ssp" | "publisher";

export interface Hop {
  id: string;
  label: string;
  role: Role;
  /** Illustrative share of the money passing through that this platform keeps. */
  fee: number;
  adds: string;
  takes: string;
}

export const OPEN_CHAIN: Hop[] = [
  {
    id: "advertiser",
    label: "Advertiser",
    role: "advertiser",
    fee: 0,
    adds: "The budget, the creative and the campaign goal. Every dollar in the chain starts here.",
    takes: "Nothing — it pays.",
  },
  {
    id: "atd",
    label: "Agency trading desk",
    role: "agency",
    fee: 0.1,
    adds: "Manages the buy: chooses the DSP, sets targeting, watches pacing.",
    takes: "A management fee for running programmatic on the brand's behalf.",
  },
  {
    id: "dsp",
    label: "DSP",
    role: "dsp",
    fee: 0.15,
    adds: "One interface to buy across many exchanges and SSPs; its bidder decides whether to bid, how much, and with which creative.",
    takes: "A platform fee on the media it buys.",
  },
  {
    id: "exchange",
    label: "Ad exchange",
    role: "exchange",
    fee: 0.08,
    adds: "Runs the real-time auction: broadcasts the impression to DSPs, collects bids, picks the highest.",
    takes: "A cut of each cleared impression.",
  },
  {
    id: "ssp",
    label: "SSP",
    role: "ssp",
    fee: 0.12,
    adds: "Manages the publisher's inventory and rules — floor prices, formats, quality and fraud controls.",
    takes: "A share of the publisher's revenue.",
  },
  {
    id: "publisher",
    label: "Publisher",
    role: "publisher",
    fee: 0,
    adds: "The page, the audience and the ad slot the whole chain is competing for.",
    takes: "Whatever is left of the dollar.",
  },
];

export const WALLED_CHAIN: Hop[] = [
  OPEN_CHAIN[0],
  {
    ...OPEN_CHAIN[1],
    adds: "Still manages the buy — but through the platform's own ad-buying interface instead of an open-market DSP.",
  },
  {
    id: "platform",
    label: "Walled-garden platform",
    role: "publisher",
    fee: 0,
    adds: "One company owns the users, the data, the buying tools, the auction and the inventory.",
    takes: "Everything that reaches it — it is the publisher too, and its data never leaves.",
  },
];

export function chainFor(mode: Mode): Hop[] {
  return mode === "open" ? OPEN_CHAIN : WALLED_CHAIN;
}

export interface TrailStep {
  id: string;
  /** Money arriving at this hop, in dollars. */
  arrives: number;
  /** Money this hop keeps. */
  kept: number;
  /** Money passed on to the next hop. */
  passes: number;
}

const round4 = (v: number) => Math.round(v * 10000) / 10000;

/** Follow $1 (or any budget) down the chain. Each fee is a share of what reaches that platform. */
export function dollarTrail(chain: Hop[], feesOn: boolean, budget = 1): TrailStep[] {
  let money = budget;
  return chain.map((hop) => {
    const arrives = money;
    const kept = feesOn ? arrives * hop.fee : 0;
    money = arrives - kept;
    return { id: hop.id, arrives: round4(arrives), kept: round4(kept), passes: round4(money) };
  });
}

/** What reaches the last hop (the publisher, or the walled-garden platform). */
export function publisherShare(chain: Hop[], feesOn: boolean, budget = 1): number {
  const trail = dollarTrail(chain, feesOn, budget);
  return trail[trail.length - 1].arrives;
}

/** The platform sitting between two others in a chain (computed, never typed in). */
export function between(chain: Hop[], leftId: string, rightId: string): Hop | null {
  const a = chain.findIndex((h) => h.id === leftId);
  const b = chain.findIndex((h) => h.id === rightId);
  if (a < 0 || b < 0 || Math.abs(a - b) !== 2) return null;
  return chain[Math.min(a, b) + 1];
}

export const QUIZ_OPTIONS = [
  { id: "atd", label: "Agency trading desk" },
  { id: "exchange", label: "Ad exchange" },
  { id: "adserver", label: "Ad server" },
  { id: "dmp", label: "DMP" },
] as const;

/** The challenge: an open-web run with fees on has finished, and the learner named the DSP–SSP middle platform. */
export function traceTheDollarMet(ranOpenWithFees: boolean, answer: string | null): boolean {
  const middle = between(OPEN_CHAIN, "dsp", "ssp");
  return ranOpenWithFees && middle !== null && answer === middle.id;
}

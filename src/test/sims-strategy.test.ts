import { describe, expect, it } from "vitest";

import {
  DEFAULT_JOURNEY,
  INTRA_JOURNEY,
  bestChannel,
  clampCustom,
  computeCredit,
  creditByChannel,
  displayMatters,
  intraChannel,
  nextDaysAgo,
  placements,
  sortJourney,
  type Touchpoint,
} from "@/simulations/attribution-lab/logic";
import {
  DEFAULT_ANSWERS,
  PRESETS,
  allThreeFound,
  cheapestOverFiveYears,
  confidence,
  costCurve,
  cumulativeCost,
  profile,
  recommend,
  recordWinner,
  scoreAnswers,
  type Answers,
} from "@/simulations/build-rent-buy/logic";
import {
  DEFAULT_SETTINGS,
  IMPRESSIONS_PER_DAY,
  arrivedBy,
  beatsTheRules,
  bidFor,
  clockLabel,
  generateDay,
  improvementOf,
  laneAt,
  mulberry32,
  runLane,
  simulateDay,
} from "@/simulations/ai-optimizer/logic";

const tp = (id: string, kind: Touchpoint["kind"], daysAgo: number): Touchpoint => ({ id, kind, channel: kind, daysAgo });
const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

/* -------------------------------------------------------------------------- */
/* Attribution lab                                                             */
/* -------------------------------------------------------------------------- */

describe("attribution lab logic", () => {
  it("reuses the lessons' credit maths for every model", () => {
    expect(computeCredit(DEFAULT_JOURNEY, "last-click", { first: 50, last: 30 })).toEqual([0, 0, 0, 100]);
    expect(computeCredit(DEFAULT_JOURNEY, "last-non-direct", { first: 50, last: 30 })).toEqual([0, 0, 100, 0]);
    expect(computeCredit(DEFAULT_JOURNEY, "position", { first: 50, last: 30 })).toEqual([40, 10, 10, 40]);
    const decay = computeCredit(DEFAULT_JOURNEY, "time-decay", { first: 50, last: 30 });
    expect(sum(decay)).toBeCloseTo(100, 6);
    // 7-day half-life: a touch 7 days further back earns half as much.
    expect(computeCredit([tp("a", "display", 7), tp("b", "search", 0)], "time-decay", { first: 0, last: 0 })[0]).toBeCloseTo(100 / 3, 6);
  });

  it("keeps journeys in time order and letters placements per channel", () => {
    const sorted = sortJourney([tp("a", "email", 2), tp("b", "display", 10), tp("c", "display", 5)]);
    expect(sorted.map((t) => t.id)).toEqual(["b", "c", "a"]);
    expect(placements(INTRA_JOURNEY)).toEqual(["A", "B", "C", "A"]);
    expect(nextDaysAgo(DEFAULT_JOURNEY)).toBe(0);
    expect(nextDaysAgo([tp("a", "display", 6)])).toBe(5);
  });

  it("totals credit by channel and names the best-looking one", () => {
    const credit = computeCredit(INTRA_JOURNEY, "linear", { first: 50, last: 30 });
    const rows = creditByChannel(INTRA_JOURNEY, credit);
    expect(rows[0]).toMatchObject({ kind: "display", touches: 3 });
    expect(rows[0].credit).toBeCloseTo(75, 6);
    expect(bestChannel(rows)).toBe("display");
    // A 50/50 split is a tie.
    const pair = [tp("a", "display", 3), tp("b", "search", 0)];
    expect(bestChannel(creditByChannel(pair, [50, 50]))).toBeNull();
  });

  it("splits one channel's credit across its placements (intra-channel)", () => {
    const credit = computeCredit(INTRA_JOURNEY, "position", { first: 50, last: 30 });
    const rows = intraChannel(INTRA_JOURNEY, credit, "display");
    expect(rows.map((r) => r.placement)).toEqual(["A", "B", "C"]);
    expect(sum(rows.map((r) => r.share))).toBeCloseTo(100, 6);
    expect(rows[0].share).toBeGreaterThan(rows[1].share);
  });

  it("never lets custom first + last weights pass 100%", () => {
    expect(clampCustom({ first: 80, last: 30 }, "first")).toEqual({ first: 80, last: 20 });
    expect(clampCustom({ first: 50, last: 70 }, "last")).toEqual({ first: 30, last: 70 });
  });

  it("passes the challenge only with a shared-credit model, Display ≥ 40% and another channel", () => {
    const w = { first: 50, last: 30 };
    // Single-touch and position-based models don't count, even when they give Display 40%+.
    expect(displayMatters(DEFAULT_JOURNEY, computeCredit(DEFAULT_JOURNEY, "first-click", w), "first-click")).toBe(false);
    expect(displayMatters(DEFAULT_JOURNEY, computeCredit(DEFAULT_JOURNEY, "position", w), "position")).toBe(false);
    // Linear on the default journey: Display has 25%.
    expect(displayMatters(DEFAULT_JOURNEY, computeCredit(DEFAULT_JOURNEY, "linear", w), "linear")).toBe(false);
    // Two Display touches out of four under Linear: 50%.
    const heavy = [tp("a", "display", 9), tp("b", "display", 6), tp("c", "search", 3), tp("d", "direct", 0)];
    expect(displayMatters(heavy, computeCredit(heavy, "linear", w), "linear")).toBe(true);
    const onlyDisplay = [tp("a", "display", 5), tp("b", "display", 0)];
    expect(displayMatters(onlyDisplay, [50, 50], "linear")).toBe(false);
  });

});

/* -------------------------------------------------------------------------- */
/* Build, rent or buy                                                          */
/* -------------------------------------------------------------------------- */

describe("build, rent or buy logic", () => {
  const startup = PRESETS.find((p) => p.id === "startup")!.answers;
  const enterprise = PRESETS.find((p) => p.id === "enterprise")!.answers;
  const scaleUp: Answers = { budget: 4, urgency: "months", control: 4, engineering: "small", scale: 3 };

  it("recommends rent for a startup, build for an enterprise, buy for a funded scale-up", () => {
    expect(recommend(scoreAnswers(startup))).toBe("rent");
    expect(recommend(scoreAnswers(enterprise))).toBe("build");
    expect(recommend(scoreAnswers(scaleUp))).toBe("buy");
    expect(recommend(scoreAnswers(DEFAULT_ANSWERS))).toBe("buy");
  });

  it("breaks ties toward the lighter commitment", () => {
    expect(recommend({ rent: 5, buy: 5, build: 5 })).toBe("rent");
    expect(recommend({ rent: 2, buy: 7, build: 7 })).toBe("buy");
  });

  it("reports confidence as the winner's share of all points", () => {
    expect(confidence({ rent: 10, buy: 5, build: 5 })).toBeCloseTo(50, 6);
    expect(confidence({ rent: 0, buy: 0, build: 0 })).toBe(0);
  });

  it("draws cost curves where renting gets dearer with scale and building wins long-term at scale", () => {
    const curve = costCurve("rent", startup);
    expect(curve).toHaveLength(21);
    for (let i = 1; i < curve.length; i++) expect(curve[i]).toBeGreaterThanOrEqual(curve[i - 1]);
    expect(cumulativeCost("buy", startup, 0)).toBe(450);
    expect(cheapestOverFiveYears(startup)).toBe("rent");
    expect(cheapestOverFiveYears(enterprise)).toBe("build");
    expect(cumulativeCost("rent", { ...startup, scale: 5 }, 60)).toBeGreaterThan(cumulativeCost("rent", startup, 60));
  });

  it("keeps meters in range and rents fastest", () => {
    for (const a of [startup, enterprise, scaleUp]) {
      for (const p of ["rent", "buy", "build"] as const) {
        const pr = profile(p, a);
        for (const v of [pr.cost, pr.speed, pr.control, pr.risk]) {
          expect(v).toBeGreaterThanOrEqual(0);
          expect(v).toBeLessThanOrEqual(100);
        }
      }
      expect(profile("rent", a).months).toBeLessThan(profile("build", a).months);
    }
  });

  it("passes the challenge once all three paths have been recommended", () => {
    let seen = recordWinner([], "buy");
    seen = recordWinner(seen, "buy");
    expect(seen).toEqual(["buy"]);
    seen = recordWinner(seen, "rent");
    expect(allThreeFound(seen)).toBe(false);
    seen = recordWinner(seen, "build");
    expect(seen).toEqual(["rent", "buy", "build"]);
    expect(allThreeFound(seen)).toBe(true);
  });
});

/* -------------------------------------------------------------------------- */
/* AI optimizer                                                                */
/* -------------------------------------------------------------------------- */

describe("AI optimizer logic", () => {
  it("generates the same seeded day every time, in arrival order", () => {
    const a = generateDay(3);
    const b = generateDay(3);
    expect(a).toEqual(b);
    expect(a).toHaveLength(IMPRESSIONS_PER_DAY);
    for (let i = 1; i < a.length; i++) expect(a[i].minute).toBeGreaterThanOrEqual(a[i - 1].minute);
    expect(generateDay(4)).not.toEqual(a);
    const r = mulberry32(1);
    expect(r()).toBe(mulberry32(1)());
  });

  it("prices model bids as pConv × target CPA, capped", () => {
    const s = { bidding: "model" as const, flatBid: 1, targetCpa: 20, bidCap: 3 };
    expect(bidFor({ pConv: 0.05 }, s)).toBe(1);
    expect(bidFor({ pConv: 0.4 }, s)).toBe(3);
    expect(bidFor({ pConv: 0.4 }, { ...s, bidding: "flat" })).toBe(1);
  });

  it("never spends more than the daily budget and only counts won impressions", () => {
    const day = generateDay(1);
    for (const reallocate of [false, true]) {
      const lane = runLane(day, { bidding: "model", flatBid: 1, targetCpa: 15, bidCap: 3, reallocate, dailyBudget: 240 });
      expect(lane.spend).toBeLessThanOrEqual(240 + 1e-6);
      expect(lane.won).toBe(lane.frames.filter((f) => f.outcome === "won").length);
      expect(lane.frames.filter((f) => f.converted).length).toBeLessThanOrEqual(lane.conversions);
    }
  });

  it("makes both lanes identical with model bidding and reallocation off", () => {
    const r = simulateDay(DEFAULT_SETTINGS);
    expect(r.model.spend).toBe(r.rules.spend);
    expect(r.model.conversions).toBe(r.rules.conversions);
    expect(r.improvement).toBeCloseTo(0, 9);
    expect(beatsTheRules(r, false)).toBe(false);
  });

  it("passes the challenge with a sensible target CPA and fails with an inflated one", () => {
    const good = { ...DEFAULT_SETTINGS, modelBidding: true, reallocate: true, targetCpa: 14 };
    const r = simulateDay(good);
    expect(r.improvement).toBeGreaterThanOrEqual(0.25);
    expect(beatsTheRules(r, true)).toBe(true);
    expect(beatsTheRules(r, false)).toBe(false);

    const overpaying = simulateDay({ ...DEFAULT_SETTINGS, modelBidding: true, targetCpa: 40 });
    expect(beatsTheRules(overpaying, true)).toBe(false);
  });

  it("computes improvement, playback position and clock labels", () => {
    expect(improvementOf(20, 15)).toBeCloseTo(0.25, 9);
    expect(improvementOf(20, Infinity)).toBe(-Infinity);
    const day = generateDay(1);
    expect(arrivedBy(day, -1)).toBe(0);
    expect(arrivedBy(day, 1440)).toBe(day.length);
    const lane = runLane(day, { bidding: "flat", flatBid: 1, targetCpa: 20, bidCap: 3, reallocate: false, dailyBudget: 240 });
    expect(laneAt(lane, 0)).toEqual({ spend: 0, won: 0, conversions: 0 });
    expect(laneAt(lane, day.length).spend).toBe(lane.spend);
    expect(clockLabel(0)).toBe("00:00");
    expect(clockLabel(13 * 60 + 5)).toBe("13:05");
  });
});

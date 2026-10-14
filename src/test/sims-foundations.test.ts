import { describe, expect, it } from "vitest";

import {
  BUDGET_MS,
  DEFAULT_CONFIG,
  decide,
  serveSteps,
  servesAnAd,
  totalMs,
  under200,
} from "@/simulations/ad-serving-flow/logic";
import { BRIEFS, CHANNELS, allBriefsMatched, correctCount, firedQuartiles } from "@/simulations/channel-explorer/logic";
import {
  OPEN_CHAIN,
  WALLED_CHAIN,
  between,
  dollarTrail,
  publisherShare,
  traceTheDollarMet,
} from "@/simulations/ecosystem-flow/logic";
import {
  DEFAULT_RATES,
  buildFunnel,
  campaignCosts,
  cheapestModels,
  isCheapestPick,
  sessionCounts,
  unseenCpmSpend,
  visitIsViewable,
} from "@/simulations/life-of-an-impression/logic";

describe("life of an impression", () => {
  it("builds the funnel the way the lessons define CTR and conversion rate", () => {
    expect(buildFunnel(10000, 0.2, 5, "above")).toEqual({ impressions: 10000, viewable: 7000, clicks: 20, conversions: 1 });
    expect(buildFunnel(10000, 0.2, 5, "below").viewable).toBe(3000);
  });

  it("prices the same campaign under CPM, CPC and CPA", () => {
    const costs = campaignCosts(buildFunnel(50000, 0.2, 5, "above"), DEFAULT_RATES);
    expect(costs).toEqual({ cpm: 250, cpc: 110, cpa: 100 });
  });

  it("computes the cheapest model, and the answer moves with the inputs", () => {
    const base = campaignCosts(buildFunnel(50000, 0.2, 5, "above"), DEFAULT_RATES);
    expect(cheapestModels(base)).toEqual(["cpa"]);
    expect(isCheapestPick("cpa", base)).toBe(true);
    expect(isCheapestPick("cpm", base)).toBe(false);
    expect(isCheapestPick(null, base)).toBe(false);

    // A high click-through rate makes paying per thousand impressions the bargain.
    const highCtr = campaignCosts(buildFunnel(50000, 1.5, 5, "above"), DEFAULT_RATES);
    expect(cheapestModels(highCtr)).toEqual(["cpm"]);
    // A strong conversion rate makes paying per conversion expensive, so CPC wins.
    const highCvr = campaignCosts(buildFunnel(50000, 0.2, 10, "above"), DEFAULT_RATES);
    expect(cheapestModels(highCvr)).toEqual(["cpc"]);
    // A cheaper CPM quote flips it again.
    const cheapCpm = campaignCosts(buildFunnel(50000, 0.2, 5, "above"), { ...DEFAULT_RATES, cpm: 1.5 });
    expect(isCheapestPick("cpm", cheapCpm)).toBe(true);
  });

  it("accepts any model tied for cheapest", () => {
    const tie = { cpm: 100, cpc: 100, cpa: 150 };
    expect(cheapestModels(tie)).toEqual(["cpm", "cpc"]);
    expect(isCheapestPick("cpc", tie)).toBe(true);
  });

  it("counts CPM spend on impressions nobody could see", () => {
    expect(unseenCpmSpend(buildFunnel(50000, 0.2, 5, "below"), DEFAULT_RATES)).toBe(175);
  });

  it("makes viewability drop below the fold in the visit-by-visit view", () => {
    const share = (slot: "above" | "below") => Array.from({ length: 100 }, (_, i) => visitIsViewable(i, slot)).filter(Boolean).length;
    expect(share("above")).toBeGreaterThan(share("below"));
    const end = sessionCounts(1e9, "below", 10);
    expect(end.impressions).toBe(10);
    expect(end.viewable).toBeLessThan(end.impressions);
    expect(sessionCounts(0, "above", 10)).toEqual({ impressions: 0, viewable: 0 });
  });
});

describe("ecosystem flow", () => {
  it("follows a dollar down the open chain with illustrative fees", () => {
    const trail = dollarTrail(OPEN_CHAIN, true);
    expect(trail[0].arrives).toBe(1);
    expect(trail.find((s) => s.id === "atd")?.kept).toBeCloseTo(0.1, 4);
    const share = publisherShare(OPEN_CHAIN, true);
    expect(share).toBeCloseTo(0.9 * 0.85 * 0.92 * 0.88, 4);
    expect(share).toBeLessThan(1);
    // Money is conserved: what is kept plus what reaches the publisher is the whole dollar.
    expect(trail.reduce((s, t) => s + t.kept, 0) + share).toBeCloseTo(1, 4);
  });

  it("passes the whole dollar through when fees are off", () => {
    expect(publisherShare(OPEN_CHAIN, false)).toBe(1);
  });

  it("collapses the chain in a walled garden", () => {
    expect(WALLED_CHAIN.length).toBeLessThan(OPEN_CHAIN.length);
    expect(publisherShare(WALLED_CHAIN, true)).toBeGreaterThan(publisherShare(OPEN_CHAIN, true));
  });

  it("finds the platform between the DSP and the SSP", () => {
    expect(between(OPEN_CHAIN, "dsp", "ssp")?.id).toBe("exchange");
    expect(between(OPEN_CHAIN, "advertiser", "publisher")).toBeNull();
  });

  it("only passes the challenge after a fees-on open-web run and the right answer", () => {
    expect(traceTheDollarMet(true, "exchange")).toBe(true);
    expect(traceTheDollarMet(false, "exchange")).toBe(false);
    expect(traceTheDollarMet(true, "atd")).toBe(false);
    expect(traceTheDollarMet(true, null)).toBe(false);
  });
});

describe("channel explorer", () => {
  it("covers the channels the registry promises", () => {
    const ids = CHANNELS.map((c) => c.id);
    for (const id of ["display", "video", "ctv", "audio", "dooh", "mobile", "native"]) expect(ids).toContain(id);
    for (const brief of BRIEFS) expect(ids).toContain(brief.answer);
  });

  it("fires VAST quartile events in order as the ad plays", () => {
    expect(firedQuartiles(0, false)).toEqual([]);
    expect(firedQuartiles(0, true)).toEqual(["start"]);
    expect(firedQuartiles(0.5, true)).toEqual(["start", "firstQuartile", "midpoint"]);
    expect(firedQuartiles(0.99, true)).not.toContain("complete");
    expect(firedQuartiles(1, true)).toEqual(["start", "firstQuartile", "midpoint", "thirdQuartile", "complete"]);
  });

  it("passes the media-planner challenge only when all three briefs match", () => {
    const right = Object.fromEntries(BRIEFS.map((b) => [b.id, b.answer]));
    expect(allBriefsMatched(right)).toBe(true);
    expect(correctCount(right)).toBe(3);
    const oneWrong = { ...right, [BRIEFS[0].id]: "search" as const };
    expect(allBriefsMatched(oneWrong)).toBe(false);
    expect(correctCount(oneWrong)).toBe(2);
    expect(allBriefsMatched({})).toBe(false);
  });
});

describe("ad serving flow", () => {
  it("uses the lessons' step times for a direct-only serve", () => {
    const steps = serveSteps({ direct: true, programmatic: false, redirect: false, cdnCache: true });
    expect(steps.map((s) => s.id)).toEqual(["tag", "request", "match", "select", "fetch", "track"]);
    // 10 + 15 + 20 + 10 + 20 + 5 = 80 ms from the lesson, plus 3 illustrative 4G round trips.
    expect(totalMs(steps) - steps.reduce((s, x) => s + x.network, 0)).toBe(80);
  });

  it("adds the auction, the redirect and an uncached creative", () => {
    const base = { direct: true, programmatic: false, redirect: false, cdnCache: true };
    const t = (c: typeof base) => totalMs(serveSteps(c));
    expect(t({ ...base, programmatic: true }) - t(base)).toBe(50);
    expect(t({ ...base, redirect: true }) - t(base)).toBe(45);
    expect(t({ ...base, cdnCache: false }) - t(base)).toBe(40);
  });

  it("starts over budget and lets the decision engine pick the higher CPM", () => {
    expect(totalMs(serveSteps(DEFAULT_CONFIG))).toBeGreaterThan(BUDGET_MS);
    expect(under200(DEFAULT_CONFIG)).toBe(false);
    expect(decide(DEFAULT_CONFIG)).toBe("programmatic");
    expect(decide({ ...DEFAULT_CONFIG, programmatic: false })).toBe("direct");
  });

  it("passes under 200 ms only while still serving an ad", () => {
    expect(under200({ ...DEFAULT_CONFIG, redirect: false, cdnCache: true })).toBe(true);
    expect(under200({ ...DEFAULT_CONFIG, programmatic: false, cdnCache: true })).toBe(true);
    expect(under200({ ...DEFAULT_CONFIG, redirect: false })).toBe(false);
    const empty = { direct: false, programmatic: false, redirect: false, cdnCache: true };
    expect(totalMs(serveSteps(empty))).toBeLessThan(BUDGET_MS);
    expect(servesAnAd(empty)).toBe(false);
    expect(under200(empty)).toBe(false);
  });
});

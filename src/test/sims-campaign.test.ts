import { describe, expect, it } from "vitest";

import {
  CROWD_SIZE,
  FILTER_IDS,
  audience,
  clock,
  generateCrowd,
  rightSizedAndEven,
  simulatePacing,
} from "@/simulations/audience-narrowing/logic";
import { PRESETS, effectiveMetrics, reconcile, reconciledAndPriced, withinTolerance } from "@/simulations/metrics-lab/logic";
import { buildGraph, matchingMode, oneProfileWithoutCookies } from "@/simulations/identity-graph/logic";
import { buildSegment, buildWorld, segmentKey, storeAt, usableFirstPartySegment, type Activation } from "@/simulations/dmp-pipeline/logic";

describe("audience narrowing logic", () => {
  const crowd = generateCrowd();

  it("generates the same seeded crowd every time", () => {
    expect(crowd).toHaveLength(CROWD_SIZE);
    expect(generateCrowd()).toEqual(crowd);
  });

  it("only ever shrinks the audience as filters stack, and reports each step", () => {
    const one = audience(crowd, ["geo"]);
    const two = audience(crowd, ["geo", "device"]);
    expect(audience(crowd, []).reachPct).toBe(100);
    expect(one.matched).toBeLessThan(CROWD_SIZE);
    expect(two.matched).toBeLessThanOrEqual(one.matched);
    expect(two.waterfall.map((w) => w.id)).toEqual(["geo", "device"]);
    expect(two.waterfall[1].remaining).toBe(two.matched);
    for (const id of FILTER_IDS) expect(audience(crowd, [id]).matched).toBeGreaterThan(0);
  });

  it("makes retargeting more precise than the untargeted crowd", () => {
    expect(audience(crowd, ["retargeting"]).precisionPct).toBeGreaterThan(audience(crowd, []).precisionPct);
  });

  it("burns an ASAP budget early and spreads an even one across the day", () => {
    const asap = simulatePacing(150, 100, "asap");
    const even = simulatePacing(150, 100, "even");
    expect(asap.exhaustedAt).not.toBeNull();
    expect(asap.exhaustedAt!).toBeLessThan(12 * 60);
    expect(asap.totalSpent).toBeCloseTo(150, 1);
    expect(even.exhaustedAt).toBeNull();
    expect(even.cumulative[12 * 60]).toBeLessThan(asap.cumulative[12 * 60]);
    expect(even.totalSpent).toBeCloseTo(150, 0);
  });

  it("under-delivers when the audience is too narrow to absorb the budget", () => {
    const tiny = simulatePacing(150, 5, "asap");
    expect(tiny.exhaustedAt).toBeNull();
    expect(tiny.totalSpent).toBeLessThan(150);
  });

  it("formats clock times", () => {
    expect(clock(700)).toBe("11:40");
    expect(clock(0)).toBe("00:00");
  });

  it("recognises the challenge", () => {
    const { reachPct } = audience(crowd, ["geo", "interest"]);
    expect(reachPct).toBeGreaterThanOrEqual(10);
    expect(reachPct).toBeLessThanOrEqual(25);
    expect(rightSizedAndEven(reachPct, "even")).toBe(true);
    expect(rightSizedAndEven(reachPct, "asap")).toBe(false);
    expect(rightSizedAndEven(100, "even")).toBe(false);
    expect(rightSizedAndEven(5, "even")).toBe(false);
  });
});

describe("metrics lab logic", () => {
  it("computes the lesson's effective metrics", () => {
    const m = effectiveMetrics(PRESETS[0]);
    expect(m.eCPM).toBeCloseTo(4);
    expect(m.eCPC).toBeCloseTo(2.6667, 3);
    expect(m.eCPA).toBeCloseTo(400);
    expect(m.ctr).toBeCloseTo(0.15);
    expect(m.cvr).toBeCloseTo(0.6667, 3);
  });

  it("returns 0 instead of Infinity for empty denominators", () => {
    expect(effectiveMetrics({ spend: 100, impressions: 0, clicks: 0, conversions: 0 })).toEqual({ eCPM: 0, eCPC: 0, eCPA: 0, ctr: 0, cvr: 0 });
  });

  const base = { counting: "mixed" as const, publisherFiltersBots: false, clientIssues: true, advertiserViewableOnly: false };

  it("measures discrepancy against the advertiser and explains the whole gap", () => {
    const r = reconcile(1_000_000, base);
    expect(r.publisher).toBe(1_000_000);
    expect(r.advertiser).toBeCloseTo(836_600);
    expect(r.discrepancyPct).toBeCloseTo(19.53, 1);
    expect(r.gap.bots + r.gap.renders + r.gap.viewability).toBeCloseTo(r.publisher - r.advertiser);
    expect(withinTolerance(r.discrepancyPct)).toBe(false);
  });

  it("narrows the gap with bot filtering and server-side counting", () => {
    expect(reconcile(1_000_000, { ...base, publisherFiltersBots: true }).discrepancyPct).toBeCloseTo(12.36, 1);
    expect(reconcile(1_000_000, { ...base, counting: "server" }).discrepancyPct).toBeCloseTo(6.38, 1);
    expect(reconcile(1_000_000, { ...base, counting: "server", publisherFiltersBots: true }).discrepancyPct).toBeCloseTo(0);
    expect(reconcile(1_000_000, { ...base, counting: "pixel", publisherFiltersBots: true }).discrepancyPct).toBeCloseTo(0);
  });

  it("shows counting only viewable impressions as a big, explained gap", () => {
    const r = reconcile(1_000_000, { ...base, counting: "server", publisherFiltersBots: true, advertiserViewableOnly: true });
    expect(r.discrepancyPct).toBeCloseTo(66.67, 1);
    expect(r.gap.viewability).toBeCloseTo(r.publisher - r.advertiser);
  });

  it("recognises the challenge", () => {
    expect(reconciledAndPriced(4, 6.4)).toBe(true);
    expect(reconciledAndPriced(4, -9.9)).toBe(true);
    expect(reconciledAndPriced(4, 19.5)).toBe(false);
    expect(reconciledAndPriced(10, 0)).toBe(false);
    expect(reconciledAndPriced(1.5, 0)).toBe(false);
  });
});

describe("identity graph logic", () => {
  const on = { thirdPartyCookies: true, consent: true };
  const noCookies = { thirdPartyCookies: false, consent: true };

  it("links laptop and phone probabilistically through a synced cookie and IP", () => {
    const g = buildGraph(["thirdParty", "ip"], on);
    expect(g.links).toHaveLength(1);
    expect(g.links[0]).toMatchObject({ pair: "phone-laptop", kind: "probabilistic" });
    expect(g.links[0].confidence).toBeCloseTo(0.86);
    expect(g.anchored.tv).toBe(false);
    expect(g.profileDevices).toHaveLength(2);
  });

  it("breaks cookie-dependent links when third-party cookies go away", () => {
    const g = buildGraph(["thirdParty", "ip"], noCookies);
    expect(g.links).toHaveLength(0);
    expect(g.blocked.map((b) => b.id)).toEqual(["thirdParty"]);
  });

  it("makes a login a deterministic link", () => {
    const g = buildGraph(["email"], noCookies);
    expect(g.links[0]).toMatchObject({ pair: "phone-laptop", kind: "deterministic" });
    expect(g.links[0].confidence).toBeCloseTo(0.95);
  });

  it("removes everything consent gates when consent is withdrawn", () => {
    const g = buildGraph(["email", "maid", "ip", "location", "userAgent", "firstParty"], { thirdPartyCookies: false, consent: false });
    expect(g.links).toHaveLength(0);
    expect(g.confidence).toBe(0);
  });

  it("builds a hybrid three-device profile without cookies, and recognises the challenge", () => {
    const g = buildGraph(["email", "maid", "ip", "location"], noCookies);
    expect(g.profileDevices).toHaveLength(3);
    expect(g.confidence).toBeGreaterThanOrEqual(0.8);
    expect(matchingMode(g)).toBe("hybrid");
    expect(oneProfileWithoutCookies(g, noCookies)).toBe(true);
    // The same graph with cookies still on doesn't count.
    expect(oneProfileWithoutCookies(buildGraph(["email", "maid", "ip", "location"], on), on)).toBe(false);
  });

  it("can't reach 80% on probabilistic signals alone", () => {
    const g = buildGraph(["firstParty", "maid", "ip", "location", "userAgent"], noCookies);
    expect(g.profileDevices).toHaveLength(3);
    expect(g.confidence).toBeLessThan(0.8);
    expect(oneProfileWithoutCookies(g, noCookies)).toBe(false);
    expect(oneProfileWithoutCookies(buildGraph(["email", "maid", "ip"], noCookies), noCookies)).toBe(false);
  });
});

describe("DMP pipeline logic", () => {
  const world = buildWorld();

  it("is deterministic and fills the store as the stream progresses", () => {
    expect(buildWorld().events.length).toBe(world.events.length);
    const half = storeAt(world, ["first"], 0.5);
    const full = storeAt(world, ["first"], 1);
    expect(storeAt(world, ["first"], 0).profiles).toHaveLength(0);
    expect(half.profiles.length).toBeGreaterThan(0);
    expect(full.profiles.length).toBeGreaterThan(half.profiles.length);
    expect(full.bySource.second).toBe(0);
    expect(full.duplicatesRemoved).toBeGreaterThan(0);
  });

  it("merges people seen in more than one source into one profile", () => {
    const all = storeAt(world, ["first", "second", "third"], 1);
    expect(all.merged).toBeGreaterThan(0);
    expect(storeAt(world, ["first"], 1).merged).toBe(0);
  });

  it("can't answer rules no enabled source supplies", () => {
    const store = storeAt(world, ["first"], 1);
    const seg = buildSegment(store, ["first"], ["age"], "all");
    expect(seg.size).toBe(0);
    expect(seg.unanswerable).toEqual(["age"]);
  });

  it("widens with 'any' and narrows with 'all'", () => {
    const store = storeAt(world, ["first"], 1);
    const all = buildSegment(store, ["first"], ["country", "mobile"], "all").size;
    const any = buildSegment(store, ["first"], ["country", "mobile"], "any").size;
    const one = buildSegment(store, ["first"], ["country"], "all").size;
    expect(all).toBeLessThan(one);
    expect(any).toBeGreaterThan(one);
  });

  it("recognises the challenge only for a current, first-party, 500+ activation", () => {
    const store = storeAt(world, ["first"], 1);
    const seg = buildSegment(store, ["first"], ["country"], "all");
    expect(seg.size).toBeGreaterThanOrEqual(500);
    expect(seg.matchedInDsp).toBeLessThanOrEqual(seg.size);
    const key = segmentKey(["first"], ["country"], "all");
    const act: Activation = { key, size: seg.size, matchedInDsp: seg.matchedInDsp, firstPartyOnly: true };
    expect(usableFirstPartySegment(act, key)).toBe(true);
    expect(usableFirstPartySegment(null, key)).toBe(false);
    expect(usableFirstPartySegment(act, segmentKey(["first"], ["country", "mobile"], "all"))).toBe(false);
    expect(usableFirstPartySegment({ ...act, size: 400 }, key)).toBe(false);
    const mixed = segmentKey(["first", "third"], ["country"], "all");
    expect(usableFirstPartySegment({ ...act, key: mixed, firstPartyOnly: false }, mixed)).toBe(false);
  });
});

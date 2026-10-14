/**
 * Pure data-pipeline maths for the "Inside the data pipeline" simulator
 * (unit-tested).
 *
 * A seeded population appears in three sources — first-party (the brand's
 * own site, app and CRM), second-party (a partner's first-party data) and
 * third-party (a data broker) — each knowing different attributes. A seeded
 * event stream feeds the five DMP stages from the data lessons: collection,
 * normalization, profile building, segmentation and activation.
 */

export type SourceId = "first" | "second" | "third";
export type RuleId = "country" | "mobile" | "visits" | "cart" | "travel" | "age";
export type MatchMode = "all" | "any";

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

export const SOURCES: Array<{
  id: SourceId;
  label: string;
  short: string;
  origin: string;
  /** People (by index in the population) this source knows about. */
  range: [number, number];
  /** Events per person, min and max. */
  events: [number, number];
  /** Example raw records, in the source's own schema. */
  rawKeys: { id: string; device: string; country: string; extra: string };
}> = [
  {
    id: "first",
    label: "First-party",
    short: "1P",
    origin: "Your site, app & CRM",
    range: [0, 1200],
    events: [2, 4],
    rawKeys: { id: "uid", device: "Device_Type", country: "ctry", extra: "evt" },
  },
  {
    id: "second",
    label: "Second-party",
    short: "2P",
    origin: "Airline partner",
    range: [800, 1700],
    events: [1, 3],
    rawKeys: { id: "partnerUserID", device: "deviceType", country: "Country", extra: "action" },
  },
  {
    id: "third",
    label: "Third-party",
    short: "3P",
    origin: "Data broker",
    range: [1000, 4000],
    events: [1, 2],
    rawKeys: { id: "bkr_id", device: "dev", country: "geo", extra: "seg" },
  },
];

export const SOURCE_IDS = SOURCES.map((s) => s.id);
export const POPULATION = 4000;

export const RULES: Array<{ id: RuleId; label: string; family: string; providers: SourceId[] }> = [
  { id: "country", label: "Country: United States", family: "General", providers: ["first", "second", "third"] },
  { id: "mobile", label: "Device type: mobile", family: "General", providers: ["first", "second", "third"] },
  { id: "visits", label: "Visited 3+ times in 30 days", family: "Behavioral", providers: ["first"] },
  { id: "cart", label: "Added to cart", family: "Behavioral", providers: ["first"] },
  { id: "travel", label: "Interest: travel", family: "Behavioral", providers: ["second", "third"] },
  { id: "age", label: "Age 25–34", family: "Demographic", providers: ["third"] },
];

export const RULE_IDS = RULES.map((r) => r.id);

export interface Person {
  id: number;
  traits: Record<RuleId, boolean>;
  /** Has a cookie ID the DSP can recognise. */
  dspMatch: boolean;
  /** Stream position of this person's first event from each source (Infinity if absent). */
  firstSeen: Record<SourceId, number>;
}

export interface StreamEvent {
  personId: number;
  source: SourceId;
  /** A redundant copy the normalization step throws away. */
  duplicate: boolean;
  kind: string;
}

export interface World {
  people: Person[];
  events: StreamEvent[];
  /** prefix[source][i] = events from that source among the first i of the stream. */
  prefix: Record<SourceId, Int32Array>;
  /** Same, counting only duplicates. */
  dupPrefix: Record<SourceId, Int32Array>;
}

const EVENT_KINDS: Record<SourceId, string[]> = {
  first: ["page_view", "add_to_cart", "login", "purchase", "crm_row"],
  second: ["flight_booked", "loyalty_signup", "page_view"],
  third: ["segment_hit", "app_open"],
};

export function buildWorld(seed = 7): World {
  const rand = mulberry32(seed);
  const people: Person[] = [];
  for (let id = 0; id < POPULATION; id++) {
    people.push({
      id,
      traits: {
        country: rand() < 0.6,
        mobile: rand() < 0.55,
        visits: rand() < 0.35,
        cart: rand() < 0.2,
        travel: rand() < 0.3,
        age: rand() < 0.25,
      },
      dspMatch: rand() < 0.78,
      firstSeen: { first: Infinity, second: Infinity, third: Infinity },
    });
  }

  const events: StreamEvent[] = [];
  for (const s of SOURCES) {
    for (let id = s.range[0]; id < s.range[1]; id++) {
      const n = s.events[0] + Math.floor(rand() * (s.events[1] - s.events[0] + 1));
      for (let k = 0; k < n; k++) {
        const kinds = EVENT_KINDS[s.id];
        events.push({ personId: id, source: s.id, duplicate: rand() < 0.08, kind: kinds[Math.floor(rand() * kinds.length)] });
      }
    }
  }
  // Fisher–Yates: sources stream in interleaved, as they would in real life.
  for (let i = events.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [events[i], events[j]] = [events[j], events[i]];
  }

  const prefix = {} as World["prefix"];
  const dupPrefix = {} as World["dupPrefix"];
  for (const s of SOURCE_IDS) {
    prefix[s] = new Int32Array(events.length + 1);
    dupPrefix[s] = new Int32Array(events.length + 1);
  }
  events.forEach((e, i) => {
    for (const s of SOURCE_IDS) {
      prefix[s][i + 1] = prefix[s][i] + (e.source === s ? 1 : 0);
      dupPrefix[s][i + 1] = dupPrefix[s][i] + (e.source === s && e.duplicate ? 1 : 0);
    }
    const p = people[e.personId];
    if (!e.duplicate && i < p.firstSeen[e.source]) p.firstSeen[e.source] = i;
  });

  return { people, events, prefix, dupPrefix };
}

export interface StoreState {
  /** Stream position reached. */
  cutoff: number;
  eventsIn: number;
  duplicatesRemoved: number;
  bySource: Record<SourceId, number>;
  /** Unique profiles after merging identities seen in more than one source. */
  profiles: Person[];
  /** Profiles that were merged from two or more sources. */
  merged: number;
}

/** The profile store once `progress` (0–1) of the stream has arrived from the enabled sources. */
export function storeAt(world: World, enabled: SourceId[], progress: number): StoreState {
  const cutoff = Math.max(0, Math.min(world.events.length, Math.floor(world.events.length * progress)));
  const bySource = { first: 0, second: 0, third: 0 } as Record<SourceId, number>;
  let eventsIn = 0;
  let duplicatesRemoved = 0;
  for (const s of enabled) {
    bySource[s] = world.prefix[s][cutoff];
    eventsIn += world.prefix[s][cutoff];
    duplicatesRemoved += world.dupPrefix[s][cutoff];
  }
  const profiles: Person[] = [];
  let merged = 0;
  for (const p of world.people) {
    let seen = 0;
    for (const s of enabled) if (p.firstSeen[s] < cutoff) seen++;
    if (seen > 0) profiles.push(p);
    if (seen > 1) merged++;
  }
  return { cutoff, eventsIn, duplicatesRemoved, bySource, profiles, merged };
}

/** Does this profile satisfy one rule, given what the enabled, already-seen sources know about it? */
export function knows(p: Person, rule: RuleId, enabled: SourceId[], cutoff: number): boolean {
  const r = RULES.find((x) => x.id === rule);
  if (!r) return false;
  return r.providers.some((s) => enabled.includes(s) && p.firstSeen[s] < cutoff);
}

export interface SegmentResult {
  size: number;
  matchedInDsp: number;
  /** Rules no enabled source can answer, so they match nobody. */
  unanswerable: RuleId[];
}

export function buildSegment(store: StoreState, enabled: SourceId[], rules: RuleId[], mode: MatchMode): SegmentResult {
  const unanswerable = rules.filter((id) => !RULES.find((r) => r.id === id)?.providers.some((s) => enabled.includes(s)));
  if (rules.length === 0) return { size: 0, matchedInDsp: 0, unanswerable };
  let size = 0;
  let matchedInDsp = 0;
  for (const p of store.profiles) {
    const test = (id: RuleId) => knows(p, id, enabled, store.cutoff) && p.traits[id];
    const ok = mode === "all" ? rules.every(test) : rules.some(test);
    if (ok) {
      size++;
      if (p.dspMatch) matchedInDsp++;
    }
  }
  return { size, matchedInDsp, unanswerable };
}

/** A stable key for "the segment as configured", so an activation goes stale when it changes. */
export function segmentKey(enabled: SourceId[], rules: RuleId[], mode: MatchMode): string {
  return `${SOURCE_IDS.filter((s) => enabled.includes(s)).join("+")}|${RULE_IDS.filter((r) => rules.includes(r)).join("+")}|${mode}`;
}

export interface Activation {
  key: string;
  size: number;
  matchedInDsp: number;
  firstPartyOnly: boolean;
}

/** The challenge: an activated segment of 500+ profiles built from first-party data only, still current. */
export function usableFirstPartySegment(activation: Activation | null, currentKey: string): boolean {
  return !!activation && activation.key === currentKey && activation.firstPartyOnly && activation.size >= 500;
}

/** A raw record as its source sent it, and the same record after normalization. */
export function sampleRecord(world: World, index: number): { source: SourceId; raw: string; clean: string; duplicate: boolean } | null {
  const e = world.events[index];
  if (!e) return null;
  const p = world.people[e.personId];
  const s = SOURCES.find((x) => x.id === e.source)!;
  const k = s.rawKeys;
  const rawDevice = { first: p.traits.mobile ? "iPhone" : "Win10", second: p.traits.mobile ? "Android" : "MacBook", third: p.traits.mobile ? "MOB" : "DESK" }[e.source];
  const rawCountry = { first: p.traits.country ? "us" : "gb", second: p.traits.country ? "United States" : "Germany", third: p.traits.country ? "USA" : "FRA" }[e.source];
  const rawId = { first: `ck_${(p.id * 7919) % 99991}`, second: `AIR-${p.id + 10000}`, third: `${(p.id * 104729).toString(36)}` }[e.source];
  const raw = `{"${k.id}":"${rawId}","${k.device}":"${rawDevice}","${k.country}":"${rawCountry}","${k.extra}":"${e.kind}"}`;
  const clean = `profile_${String(p.id).padStart(4, "0")} · device_type=${p.traits.mobile ? "mobile" : "desktop"} · country=${p.traits.country ? "US" : "other"} · event=${e.kind}`;
  return { source: e.source, raw, clean, duplicate: e.duplicate };
}

/** The most recent stream position before `cutoff` that came from an enabled source. */
export function latestIndex(world: World, enabled: SourceId[], cutoff: number): number {
  for (let i = Math.min(cutoff, world.events.length) - 1; i >= 0 && i > cutoff - 200; i--) {
    if (enabled.includes(world.events[i].source)) return i;
  }
  return -1;
}

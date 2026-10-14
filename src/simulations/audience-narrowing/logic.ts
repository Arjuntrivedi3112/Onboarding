/**
 * Pure maths for the "Watch the audience narrow" simulator (unit-tested).
 *
 * A seeded crowd of 400 users, six targeting filters drawn from the
 * targeting lessons (geo and device from the ad request, a day-part window,
 * an interest from a behavioral profile, retargeting from a pixel cookie, and
 * an age band), plus a 24-hour budget-pacing model comparing ASAP with even
 * (uniform) pacing.
 */

/* -------------------------------------------------------------------------- */
/* Seeded randomness                                                          */
/* -------------------------------------------------------------------------- */

/** mulberry32: a tiny deterministic PRNG, so the crowd is identical on every render and in tests. */
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

function pick<T>(rand: () => number, options: ReadonlyArray<readonly [T, number]>): T {
  const total = options.reduce((a, [, w]) => a + w, 0);
  let r = rand() * total;
  for (const [value, w] of options) {
    r -= w;
    if (r < 0) return value;
  }
  return options[options.length - 1][0];
}

/* -------------------------------------------------------------------------- */
/* The crowd                                                                  */
/* -------------------------------------------------------------------------- */

export type Country = "US" | "UK" | "DE" | "Other";
export type Device = "mobile" | "desktop" | "ctv";
export type Interest = "sports" | "tech" | "travel" | "food" | "fashion";
export type AgeBand = "18-24" | "25-34" | "35-44" | "45-54" | "55+";

export interface CrowdUser {
  id: number;
  country: Country;
  device: Device;
  interests: Interest[];
  /** Local hour (0–23) this user is usually online. */
  hour: number;
  pastVisitor: boolean;
  age: AgeBand;
  /** Hidden truth: would this person actually buy the advertised running shoe? */
  buyer: boolean;
}

export const CROWD_SIZE = 400;
export const CROWD_COLS = 25;
export const CROWD_ROWS = CROWD_SIZE / CROWD_COLS;
/** Each dot stands in for this many real people. */
export const PEOPLE_PER_DOT = 5_000;
export const CROWD_SEED = 20_241;

/** Likelihood a user would buy the campaign's product (a running shoe launching in the US). */
export function buyerAffinity(u: Omit<CrowdUser, "buyer" | "id">): number {
  return (
    0.02 +
    (u.country === "US" ? 0.05 : 0) +
    (u.device === "mobile" ? 0.02 : 0) +
    (u.interests.includes("sports") ? 0.14 : 0) +
    (u.hour >= 15 && u.hour < 20 ? 0.02 : 0) +
    (u.pastVisitor ? 0.32 : 0) +
    (u.age === "25-34" ? 0.06 : 0)
  );
}

const HOUR_WEIGHTS = [1, 0.6, 0.4, 0.3, 0.3, 0.5, 1.2, 2.4, 3.4, 3.8, 3.9, 4.2, 4.6, 4.4, 4.1, 4.3, 4.8, 5.4, 6.0, 6.2, 5.6, 4.4, 3.0, 1.8];

export function generateCrowd(seed = CROWD_SEED, size = CROWD_SIZE): CrowdUser[] {
  const rand = mulberry32(seed);
  const hourOptions = HOUR_WEIGHTS.map((w, h) => [h, w] as const);
  const users: CrowdUser[] = [];
  for (let id = 0; id < size; id++) {
    const country = pick<Country>(rand, [["US", 50], ["UK", 20], ["DE", 15], ["Other", 15]]);
    const device = pick<Device>(rand, [["mobile", 60], ["desktop", 30], ["ctv", 10]]);
    const first = pick<Interest>(rand, [["sports", 22], ["tech", 22], ["travel", 20], ["food", 18], ["fashion", 18]]);
    const interests: Interest[] = [first];
    if (rand() < 0.35) {
      const second = pick<Interest>(rand, [["sports", 1], ["tech", 1], ["travel", 1], ["food", 1], ["fashion", 1]]);
      if (second !== first) interests.push(second);
    }
    const hour = pick(rand, hourOptions);
    const pastVisitor = rand() < 0.12;
    const age = pick<AgeBand>(rand, [["18-24", 18], ["25-34", 25], ["35-44", 22], ["45-54", 18], ["55+", 17]]);
    const base = { country, device, interests, hour, pastVisitor, age };
    const buyer = rand() < buyerAffinity(base);
    users.push({ id, ...base, buyer });
  }
  return users;
}

/* -------------------------------------------------------------------------- */
/* Filters                                                                    */
/* -------------------------------------------------------------------------- */

export type FilterId = "geo" | "device" | "interest" | "daypart" | "retargeting" | "demographic";

export interface TargetingFilter {
  id: FilterId;
  /** Method name, as the targeting lessons use it. */
  method: string;
  /** The rule the learner switches on. */
  rule: string;
  /** Which of the three sources of knowledge the method reads. */
  source: "The ad request" | "The person";
  test: (u: CrowdUser) => boolean;
}

export const FILTERS: TargetingFilter[] = [
  { id: "geo", method: "Geolocation", rule: "United States", source: "The ad request", test: (u) => u.country === "US" },
  { id: "device", method: "Device", rule: "Mobile phones", source: "The ad request", test: (u) => u.device === "mobile" },
  { id: "daypart", method: "Day-part", rule: "3 PM – 8 PM", source: "The ad request", test: (u) => u.hour >= 15 && u.hour < 20 },
  { id: "interest", method: "Behavioral", rule: "Sports & fitness fans", source: "The person", test: (u) => u.interests.includes("sports") },
  { id: "retargeting", method: "Retargeting", rule: "Visited the brand's site", source: "The person", test: (u) => u.pastVisitor },
  { id: "demographic", method: "Demographic", rule: "Age 25–34", source: "The person", test: (u) => u.age === "25-34" },
];

export const FILTER_IDS = FILTERS.map((f) => f.id);

export function filterById(id: FilterId): TargetingFilter {
  const f = FILTERS.find((x) => x.id === id);
  if (!f) throw new Error(`Unknown filter ${id}`);
  return f;
}

export function matches(user: CrowdUser, active: FilterId[]): boolean {
  return active.every((id) => filterById(id).test(user));
}

export interface AudienceResult {
  matched: number;
  reachPct: number;
  buyers: number;
  /** Share of the matched audience who are real would-be buyers, 0–100. */
  precisionPct: number;
  /** Matched count after each filter, in the order the filters were applied. */
  waterfall: Array<{ id: FilterId; remaining: number }>;
}

export function audience(crowd: CrowdUser[], active: FilterId[]): AudienceResult {
  let pool = crowd;
  const waterfall: AudienceResult["waterfall"] = [];
  for (const id of active) {
    const f = filterById(id);
    pool = pool.filter(f.test);
    waterfall.push({ id, remaining: pool.length });
  }
  const buyers = pool.filter((u) => u.buyer).length;
  return {
    matched: pool.length,
    reachPct: crowd.length ? (pool.length / crowd.length) * 100 : 0,
    buyers,
    precisionPct: pool.length ? (buyers / pool.length) * 100 : 0,
    waterfall,
  };
}

/* -------------------------------------------------------------------------- */
/* Budget pacing                                                              */
/* -------------------------------------------------------------------------- */

export type Pacing = "asap" | "even";

export const MINUTES_PER_DAY = 1440;
/** What the whole crowd could absorb in a day, in dollars, before any targeting. */
export const FULL_REACH_DAILY_CAPACITY = 2400;

const HOUR_SHARE = (() => {
  const total = HOUR_WEIGHTS.reduce((a, b) => a + b, 0);
  return HOUR_WEIGHTS.map((w) => w / total);
})();

/** Share of the day's matching traffic that arrives in each hour (sums to 1). */
export const hourlyTrafficShare = (): number[] => [...HOUR_SHARE];

export interface PacingResult {
  /** Cumulative spend at the end of each minute; length MINUTES_PER_DAY + 1, starting at 0. */
  cumulative: number[];
  totalSpent: number;
  /** Minute of the day the budget ran out, or null if it lasted (or never filled). */
  exhaustedAt: number | null;
  /** Dollars the targeted audience could have absorbed today. */
  capacity: number;
}

/**
 * Spend a daily budget against the inventory a targeted audience offers.
 * ASAP buys everything it can until the money runs out; even pacing aims for
 * a straight line (budget × minutes elapsed ÷ 1,440), catching up when slow
 * night-time traffic leaves it behind.
 */
export function simulatePacing(budget: number, reachPct: number, pacing: Pacing): PacingResult {
  const capacity = FULL_REACH_DAILY_CAPACITY * (reachPct / 100);
  const cumulative = [0];
  let spent = 0;
  let exhaustedAt: number | null = null;
  for (let m = 0; m < MINUTES_PER_DAY; m++) {
    const available = (capacity * HOUR_SHARE[Math.floor(m / 60)]) / 60;
    const room = pacing === "asap" ? budget - spent : Math.max(0, (budget * (m + 1)) / MINUTES_PER_DAY - spent);
    const spend = Math.max(0, Math.min(available, room, budget - spent));
    spent += spend;
    cumulative.push(spent);
    if (exhaustedAt === null && budget - spent < 0.005 && pacing === "asap") exhaustedAt = m + 1;
  }
  return { cumulative, totalSpent: spent, exhaustedAt, capacity };
}

/** "11:40"-style clock for a minute of the day. */
export function clock(minute: number): string {
  const m = Math.max(0, Math.min(MINUTES_PER_DAY, Math.round(minute)));
  if (m === MINUTES_PER_DAY) return "24:00";
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${String(h).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

/* -------------------------------------------------------------------------- */
/* Challenge                                                                  */
/* -------------------------------------------------------------------------- */

/** The challenge: the audience lands between 10% and 25% of the crowd, with even pacing. */
export function rightSizedAndEven(reachPct: number, pacing: Pacing): boolean {
  return reachPct >= 10 && reachPct <= 25 && pacing === "even";
}

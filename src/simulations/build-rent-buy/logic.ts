/**
 * Pure scoring for the build / rent / buy decision helper (unit-tested).
 *
 * Five answers about a company — budget, urgency, control needs, in-house
 * engineering and scale — each add points to the paths they favour, in the
 * same spirit as the "Choosing your path" lesson's four-question helper.
 * Ties go to the lighter commitment (rent, then buy, then build), echoing the
 * chapter's "start with rent" advice. Every money and month figure here is
 * illustrative: the shapes are the book's, the amounts are not quotes.
 */

export type PathId = "rent" | "buy" | "build";
export const PATHS: PathId[] = ["rent", "buy", "build"];

export const PATH_LABELS: Record<PathId, string> = { rent: "Rent", buy: "Buy", build: "Build" };
export const PATH_TAGLINES: Record<PathId, string> = {
  rent: "Software-as-a-service",
  buy: "Acquire an existing company",
  build: "Develop it yourself",
};

export type Urgency = "weeks" | "months" | "patient";
export type Engineering = "none" | "small" | "strong";

export interface Answers {
  /** 1 (tight) – 5 (substantial). */
  budget: number;
  urgency: Urgency;
  /** 1 (a vendor's roadmap is fine) – 5 (the platform is our differentiator). */
  control: number;
  engineering: Engineering;
  /** 1 (pilot volume) – 5 (massive volume). */
  scale: number;
}

export const DEFAULT_ANSWERS: Answers = { budget: 3, urgency: "months", control: 3, engineering: "small", scale: 2 };

export const BUDGET_LABELS = ["Tight", "Lean", "Moderate", "Healthy", "Substantial"];
export const CONTROL_LABELS = ["Low", "Some", "Moderate", "High", "Total"];
export const SCALE_LABELS = ["Pilot", "Small", "Growing", "Large", "Massive"];
export const URGENCY_LABELS: Record<Urgency, string> = { weeks: "Days or weeks", months: "A few months", patient: "Six-plus months" };
export const ENGINEERING_LABELS: Record<Engineering, string> = { none: "None", small: "Small team", strong: "Strong team" };

const URGENCY_INDEX: Record<Urgency, number> = { weeks: 0, months: 1, patient: 2 };
const ENGINEERING_INDEX: Record<Engineering, number> = { none: 0, small: 1, strong: 2 };

/** Points each answer adds to each path. */
const WEIGHTS = {
  budget: { rent: [3, 2, 1, 0, 0], buy: [0, 1, 2, 3, 3], build: [0, 1, 2, 2, 3] },
  urgency: { rent: [3, 1, 0], buy: [0, 3, 1], build: [0, 1, 3] },
  control: { rent: [3, 2, 0, 0, 0], buy: [0, 1, 2, 3, 1], build: [0, 0, 1, 2, 3] },
  engineering: { rent: [2, 1, 0], buy: [1, 2, 1], build: [0, 1, 3] },
  scale: { rent: [2, 2, 1, 0, 0], buy: [0, 1, 2, 2, 2], build: [0, 0, 1, 2, 3] },
} as const;

const level = (v: number) => Math.max(0, Math.min(4, Math.round(v) - 1));

export function scoreAnswers(a: Answers): Record<PathId, number> {
  const out: Record<PathId, number> = { rent: 0, buy: 0, build: 0 };
  for (const p of PATHS) {
    out[p] =
      WEIGHTS.budget[p][level(a.budget)] +
      WEIGHTS.urgency[p][URGENCY_INDEX[a.urgency]] +
      WEIGHTS.control[p][level(a.control)] +
      WEIGHTS.engineering[p][ENGINEERING_INDEX[a.engineering]] +
      WEIGHTS.scale[p][level(a.scale)];
  }
  return out;
}

/** The top-scoring path; ties go to the lighter commitment. */
export function recommend(scores: Record<PathId, number>): PathId {
  return PATHS.reduce((best, p) => (scores[p] > scores[best] ? p : best), PATHS[0]);
}

/** The winner's share of all points, as a rough confidence (0–100). */
export function confidence(scores: Record<PathId, number>): number {
  const total = PATHS.reduce((a, p) => a + scores[p], 0);
  return total > 0 ? (scores[recommend(scores)] / total) * 100 : 0;
}

/* -------------------------------------------------------------------------- */
/* Illustrative trade-off meters                                              */
/* -------------------------------------------------------------------------- */

export interface Profile {
  /** Months until live. */
  months: number;
  /** Five-year cost in $ thousands. */
  fiveYearCost: number;
  /** 0–100 meters. */
  cost: number;
  speed: number;
  control: number;
  risk: number;
}

/** Monthly impression volume multiplier for each scale level. */
const VOLUME = [0.5, 1, 2, 4, 7];

/** Months until live, by path. Build's MVP takes three to six months with a team; longer if you must hire one. */
export function monthsToLive(path: PathId, a: Answers): number {
  const eng = ENGINEERING_INDEX[a.engineering];
  if (path === "rent") return 1;
  if (path === "buy") return [6, 4, 3][eng];
  return [9, 6, 4][eng];
}

/**
 * Cumulative cost in $ thousands at month m (0–60). Rent: a small setup fee,
 * then a monthly bill that scales with volume and grows each year. Buy: an
 * acquisition price and integration work up front, then running costs. Build:
 * a dev team until launch, then cheaper running costs.
 */
export function cumulativeCost(path: PathId, a: Answers, m: number): number {
  const v = VOLUME[level(a.scale)];
  if (path === "rent") {
    let total = 5;
    for (let month = 0; month < m; month++) total += 6 * v * Math.pow(1.15, Math.floor(month / 12));
    return total;
  }
  if (path === "buy") {
    const integration = monthsToLive("buy", a);
    let total = 450;
    for (let month = 0; month < m; month++) total += month < integration ? 120 / integration : 12 + 3 * v;
    return total;
  }
  const eng = ENGINEERING_INDEX[a.engineering];
  const devMonthly = [70, 55, 45][eng];
  const launch = monthsToLive("build", a);
  let total = 0;
  for (let month = 0; month < m; month++) total += month < launch ? devMonthly : 10 + 1.5 * v;
  return total;
}

/** Five-year cost curve, sampled every quarter (21 points, months 0–60). */
export function costCurve(path: PathId, a: Answers): number[] {
  return Array.from({ length: 21 }, (_, i) => cumulativeCost(path, a, i * 3));
}

export function cheapestOverFiveYears(a: Answers): PathId {
  return PATHS.reduce((best, p) => (cumulativeCost(p, a, 60) < cumulativeCost(best, a, 60) ? p : best), PATHS[0]);
}

/** Month at which one path's cumulative cost first exceeds another's, if ever. */
export function crossover(a: Answers, cheaperFirst: PathId, other: PathId): number | null {
  for (let m = 1; m <= 60; m++) {
    if (cumulativeCost(cheaperFirst, a, m) > cumulativeCost(other, a, m)) return m;
  }
  return null;
}

export function profile(path: PathId, a: Answers): Profile {
  const months = monthsToLive(path, a);
  const fiveYearCost = cumulativeCost(path, a, 60);
  const maxCost = Math.max(...PATHS.map((p) => cumulativeCost(p, a, 60)));
  const scaleLevel = level(a.scale);
  const controlNeed = level(a.control);
  const eng = ENGINEERING_INDEX[a.engineering];

  // Risk: each path's characteristic risk, made worse by a mismatch with the answers.
  let risk: number;
  if (path === "rent") {
    // Low initially, higher long-term: rising costs at scale and a roadmap you don't control.
    risk = 20 + scaleLevel * 9 + Math.max(0, controlNeed - 1) * 8;
  } else if (path === "buy") {
    // Integration complexity, retention, inherited issues — harder without engineers to absorb it.
    risk = 45 + (2 - eng) * 12 + (a.urgency === "weeks" ? 10 : 0);
  } else {
    // High initially, lower long-term — worse with no team or no time.
    risk = 50 + (2 - eng) * 15 + (a.urgency === "weeks" ? 15 : a.urgency === "months" ? 5 : -5) - scaleLevel * 3;
  }

  return {
    months,
    fiveYearCost,
    cost: (fiveYearCost / maxCost) * 100,
    speed: Math.max(5, 100 - (months - 1) * 11),
    control: { rent: 20, buy: 70, build: 95 }[path],
    risk: Math.max(5, Math.min(100, risk)),
  };
}

/* -------------------------------------------------------------------------- */
/* Challenge                                                                  */
/* -------------------------------------------------------------------------- */

/** Add this answer set's recommendation to the set seen this session. */
export function recordWinner(seen: PathId[], winner: PathId): PathId[] {
  return seen.includes(winner) ? seen : [...seen, winner].sort((a, b) => PATHS.indexOf(a) - PATHS.indexOf(b));
}

/** The challenge: every path has been the top recommendation at least once. */
export function allThreeFound(seen: PathId[]): boolean {
  return PATHS.every((p) => seen.includes(p));
}

/** Quick company presets for the "try this" steps. */
export const PRESETS: Array<{ id: string; label: string; answers: Answers }> = [
  { id: "startup", label: "Small startup", answers: { budget: 1, urgency: "weeks", control: 1, engineering: "none", scale: 1 } },
  { id: "enterprise", label: "Large enterprise", answers: { budget: 5, urgency: "patient", control: 5, engineering: "strong", scale: 5 } },
];

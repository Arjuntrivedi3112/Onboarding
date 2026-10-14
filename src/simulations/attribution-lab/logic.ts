/**
 * Pure helpers for the attribution model lab (unit-tested).
 *
 * The credit maths is NOT re-implemented here: every model's numbers come
 * from `computeCredit` in the attribution lessons' shared module, so the Lab
 * and the lessons can never disagree. This file only adds what the Lab needs
 * on top — journey editing, per-channel totals and the challenge condition.
 */
import {
  DEFAULT_CUSTOM_WEIGHTS,
  DEFAULT_JOURNEY,
  KIND_LABELS,
  MAX_TOUCHPOINTS,
  MODELS,
  TIME_DECAY_HALF_LIFE_DAYS,
  computeCredit,
  type CustomWeights,
  type ModelId,
  type TouchKind,
  type Touchpoint,
} from "@/components/lessons/attribution/_shared";

export { DEFAULT_CUSTOM_WEIGHTS, DEFAULT_JOURNEY, KIND_LABELS, MAX_TOUCHPOINTS, MODELS, TIME_DECAY_HALF_LIFE_DAYS, computeCredit };
export type { CustomWeights, ModelId, TouchKind, Touchpoint };

export const MIN_TOUCHPOINTS = 2;
export const MAX_DAYS = 30;
export const KINDS: TouchKind[] = ["display", "social", "search", "email", "direct"];

/** Short names for tight spaces. */
export const KIND_SHORT: Record<TouchKind, string> = {
  display: "Display",
  social: "Social",
  search: "Search",
  email: "Email",
  direct: "Direct",
};

/** Journeys are chronological: earliest (most days before) first. Stable. */
export function sortJourney(journey: Touchpoint[]): Touchpoint[] {
  return journey
    .map((t, i) => ({ t, i }))
    .sort((a, b) => b.t.daysAgo - a.t.daysAgo || a.i - b.i)
    .map(({ t }) => t);
}

/** Placement letters within each channel, in journey order: "A", "B", … */
export function placements(journey: Touchpoint[]): string[] {
  const seen: Partial<Record<TouchKind, number>> = {};
  return journey.map((t) => {
    const n = seen[t.kind] ?? 0;
    seen[t.kind] = n + 1;
    return String.fromCharCode(65 + n);
  });
}

export interface ChannelCredit {
  kind: TouchKind;
  credit: number;
  touches: number;
}

/** Total credit per channel present in the journey, highest first. */
export function creditByChannel(journey: Touchpoint[], credit: number[]): ChannelCredit[] {
  const map = new Map<TouchKind, ChannelCredit>();
  journey.forEach((t, i) => {
    const row = map.get(t.kind) ?? { kind: t.kind, credit: 0, touches: 0 };
    row.credit += credit[i] ?? 0;
    row.touches += 1;
    map.set(t.kind, row);
  });
  return [...map.values()].sort((a, b) => b.credit - a.credit || KINDS.indexOf(a.kind) - KINDS.indexOf(b.kind));
}

/** The channel a report under this model would make look best (ties: null). */
export function bestChannel(rows: ChannelCredit[]): TouchKind | null {
  if (rows.length === 0) return null;
  if (rows.length > 1 && Math.abs(rows[0].credit - rows[1].credit) < 0.05) return null;
  return rows[0].kind;
}

/**
 * Intra-channel view: how one channel's credit splits across its own
 * placements, as a share of that channel's total.
 */
export function intraChannel(journey: Touchpoint[], credit: number[], kind: TouchKind): Array<{ id: string; placement: string; credit: number; share: number }> {
  const letters = placements(journey);
  const rows = journey
    .map((t, i) => ({ t, i }))
    .filter(({ t }) => t.kind === kind)
    .map(({ t, i }) => ({ id: t.id, placement: letters[i], credit: credit[i] ?? 0, share: 0 }));
  const total = rows.reduce((a, r) => a + r.credit, 0);
  return rows.map((r) => ({ ...r, share: total > 0 ? (r.credit / total) * 100 : 0 }));
}

/** Keep the custom first + last weights from exceeding 100%. */
export function clampCustom(next: CustomWeights, changed: keyof CustomWeights): CustomWeights {
  const other: keyof CustomWeights = changed === "first" ? "last" : "first";
  const v = Math.max(0, Math.min(100, next[changed]));
  return { ...next, [changed]: v, [other]: Math.min(next[other], 100 - v) } as CustomWeights;
}

/** Models that share credit across every touch — the challenge must be won with one of these. */
export const SHARED_CREDIT_MODELS = ["linear", "time-decay"] as const;

/**
 * The challenge: under a shared-credit model (Linear or Time decay), Display
 * earns ≥ 40% while the journey has a non-Display touch. Single-touch and
 * position-based models would hand it over without any journey design.
 */
export function displayMatters(journey: Touchpoint[], credit: number[], modelId: string): boolean {
  if (!(SHARED_CREDIT_MODELS as readonly string[]).includes(modelId)) return false;
  const hasOther = journey.some((t) => t.kind !== "display");
  const display = journey.reduce((a, t, i) => a + (t.kind === "display" ? credit[i] ?? 0 : 0), 0);
  return hasOther && display >= 40 - 1e-9;
}

export function displayShare(journey: Touchpoint[], credit: number[]): number {
  return journey.reduce((a, t, i) => a + (t.kind === "display" ? credit[i] ?? 0 : 0), 0);
}

/** A three-placement display journey that closes on search: an intra-channel story. */
export const INTRA_JOURNEY: Touchpoint[] = [
  { id: "i1", channel: KIND_LABELS.display, kind: "display", daysAgo: 14 },
  { id: "i2", channel: KIND_LABELS.display, kind: "display", daysAgo: 9 },
  { id: "i3", channel: KIND_LABELS.display, kind: "display", daysAgo: 4 },
  { id: "i4", channel: KIND_LABELS.search, kind: "search", daysAgo: 1 },
];

/** Days for a new touchpoint: just after the latest one, never negative. */
export function nextDaysAgo(journey: Touchpoint[]): number {
  const latest = journey.length ? Math.min(...journey.map((t) => t.daysAgo)) : 4;
  return Math.max(0, latest - 1);
}

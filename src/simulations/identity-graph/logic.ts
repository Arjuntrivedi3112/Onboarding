/**
 * Pure identity-graph maths for the "Build an identity graph" simulator
 * (unit-tested).
 *
 * One person, three devices. Identifiers are added one at a time; each can
 * anchor a device (give it a persistent ID that signals can attach to) and/or
 * link pairs of devices, either deterministically (a shared login) or
 * probabilistically (shared IP, location, device characteristics). Two
 * conditions from the identity lessons gate them: whether third-party cookies
 * still work, and whether the user gave consent (GDPR consent for IP and
 * location, the ATT opt-in for mobile ad IDs, and consent to use a hashed
 * email for advertising).
 */

export type DeviceId = "phone" | "laptop" | "tv";
export type SignalId = "thirdParty" | "firstParty" | "maid" | "email" | "ip" | "location" | "userAgent";
export type PairId = "phone-laptop" | "phone-tv" | "laptop-tv";
export type LinkKind = "deterministic" | "probabilistic";

export const DEVICES: Array<{ id: DeviceId; label: string; sub: string }> = [
  { id: "laptop", label: "Laptop", sub: "Chrome browser" },
  { id: "phone", label: "Phone", sub: "Android app + browser" },
  { id: "tv", label: "TV", sub: "connected TV streaming app" },
];

export const PAIRS: Array<{ id: PairId; a: DeviceId; b: DeviceId }> = [
  { id: "phone-laptop", a: "phone", b: "laptop" },
  { id: "phone-tv", a: "phone", b: "tv" },
  { id: "laptop-tv", a: "laptop", b: "tv" },
];

export interface Signal {
  id: SignalId;
  label: string;
  short: string;
  kind: LinkKind | "anchor";
  /** One sentence on what it is and what it links. */
  detail: string;
  /** Devices this identifier is observed on. */
  seenOn: DeviceId[];
  /** Devices it gives a persistent ID to. */
  anchors: DeviceId[];
  /** Pair links it contributes, with the confidence of each. */
  links: Partial<Record<PairId, number>>;
  needsThirdPartyCookies: boolean;
  needsConsent: boolean;
}

export const SIGNALS: Signal[] = [
  {
    id: "email",
    label: "Hashed email login",
    short: "Email",
    kind: "deterministic",
    detail: "The same hashed email signs in on the phone app and the laptop site — a shared, unique identifier.",
    seenOn: ["phone", "laptop"],
    anchors: ["phone", "laptop"],
    links: { "phone-laptop": 0.95 },
    needsThirdPartyCookies: false,
    needsConsent: true,
  },
  {
    id: "thirdParty",
    label: "Third-party cookie",
    short: "3P cookie",
    kind: "probabilistic",
    detail: "An ad-tech vendor's cookie, synced into its device graph. Links the laptop and phone browsers — while third-party cookies last.",
    seenOn: ["laptop", "phone"],
    anchors: ["laptop", "phone"],
    links: { "phone-laptop": 0.6 },
    needsThirdPartyCookies: true,
    needsConsent: true,
  },
  {
    id: "firstParty",
    label: "First-party cookie",
    short: "1P cookie",
    kind: "anchor",
    detail: "Set by the site the person is on. Gives the laptop a persistent ID, but it can't be read on any other domain or device.",
    seenOn: ["laptop"],
    anchors: ["laptop"],
    links: {},
    needsThirdPartyCookies: false,
    needsConsent: false,
  },
  {
    id: "maid",
    label: "Mobile ad ID (MAID)",
    short: "MAID",
    kind: "anchor",
    detail: "The phone's advertising ID (GAID or IDFA) and the TV app's own ad ID: device-level IDs that signals can attach to, readable only after the user opts in.",
    seenOn: ["phone", "tv"],
    anchors: ["phone", "tv"],
    links: {},
    needsThirdPartyCookies: false,
    needsConsent: true,
  },
  {
    id: "ip",
    label: "Shared IP address",
    short: "IP",
    kind: "probabilistic",
    detail: "All three devices use the same home Wi-Fi. Strong household evidence, but not proof it's one person.",
    seenOn: ["phone", "laptop", "tv"],
    anchors: [],
    links: { "phone-laptop": 0.65, "phone-tv": 0.65, "laptop-tv": 0.65 },
    needsThirdPartyCookies: false,
    needsConsent: true,
  },
  {
    id: "location",
    label: "Location data",
    short: "Location",
    kind: "probabilistic",
    detail: "The phone and the TV sit at the same address every night; the laptop's location is coarser.",
    seenOn: ["phone", "tv", "laptop"],
    anchors: [],
    links: { "phone-tv": 0.55, "phone-laptop": 0.45, "laptop-tv": 0.35 },
    needsThirdPartyCookies: false,
    needsConsent: true,
  },
  {
    id: "userAgent",
    label: "Device characteristics",
    short: "User agent",
    kind: "probabilistic",
    detail: "OS, browser version, time zone and settings from the user-agent header. Weak on its own — and controversial, because no consent flag gates it.",
    seenOn: ["phone", "laptop", "tv"],
    anchors: [],
    links: { "phone-laptop": 0.3, "phone-tv": 0.3, "laptop-tv": 0.3 },
    needsThirdPartyCookies: false,
    needsConsent: false,
  },
];

export const SIGNAL_IDS = SIGNALS.map((s) => s.id);

export function signalById(id: SignalId): Signal {
  const s = SIGNALS.find((x) => x.id === id);
  if (!s) throw new Error(`Unknown signal ${id}`);
  return s;
}

export interface Conditions {
  thirdPartyCookies: boolean;
  consent: boolean;
}

/** Why an added identifier can't be used right now, or null if it works. */
export function blockedReason(s: Signal, c: Conditions): string | null {
  if (s.needsThirdPartyCookies && !c.thirdPartyCookies) return "Third-party cookies are blocked";
  if (s.needsConsent && !c.consent) return "No consent";
  return null;
}

export interface PairLink {
  pair: PairId;
  a: DeviceId;
  b: DeviceId;
  /** 0–1, combining every contributing signal as independent evidence. */
  confidence: number;
  kind: LinkKind;
  signals: SignalId[];
}

export interface Graph {
  usable: SignalId[];
  blocked: Array<{ id: SignalId; reason: string }>;
  anchored: Record<DeviceId, boolean>;
  links: PairLink[];
  /** Devices joined into the person's profile (the largest connected group). */
  profileDevices: DeviceId[];
  /** Chance every link holding the profile together is right, 0–1. */
  confidence: number;
}

/**
 * Build the graph. A device needs a persistent ID (an anchor) before any
 * signal seen on it can be attributed to it; a pair links when both ends are
 * anchored and at least one usable signal connects them. Evidence combines as
 * 1 − Π(1 − c). The profile's confidence is the best spanning tree's product.
 */
export function buildGraph(added: SignalId[], c: Conditions): Graph {
  const usable: SignalId[] = [];
  const blocked: Graph["blocked"] = [];
  for (const id of SIGNAL_IDS) {
    if (!added.includes(id)) continue;
    const reason = blockedReason(signalById(id), c);
    if (reason) blocked.push({ id, reason });
    else usable.push(id);
  }

  const anchored: Record<DeviceId, boolean> = { phone: false, laptop: false, tv: false };
  for (const id of usable) for (const d of signalById(id).anchors) anchored[d] = true;

  const links: PairLink[] = [];
  for (const p of PAIRS) {
    if (!anchored[p.a] || !anchored[p.b]) continue;
    let miss = 1;
    let kind: LinkKind = "probabilistic";
    const contributing: SignalId[] = [];
    for (const id of usable) {
      const s = signalById(id);
      const conf = s.links[p.id];
      if (!conf) continue;
      miss *= 1 - conf;
      contributing.push(id);
      if (s.kind === "deterministic") kind = "deterministic";
    }
    if (contributing.length) links.push({ pair: p.id, a: p.a, b: p.b, confidence: 1 - miss, kind, signals: contributing });
  }

  const { devices, confidence } = bestProfile(links);
  return { usable, blocked, anchored, links, profileDevices: devices, confidence };
}

function bestProfile(links: PairLink[]): { devices: DeviceId[]; confidence: number } {
  if (links.length === 0) return { devices: [], confidence: 0 };
  // With three devices, any two distinct links form a spanning tree.
  if (links.length >= 2) {
    let confidence = 0;
    for (let i = 0; i < links.length; i++) {
      for (let j = i + 1; j < links.length; j++) confidence = Math.max(confidence, links[i].confidence * links[j].confidence);
    }
    return { devices: ["phone", "laptop", "tv"], confidence };
  }
  const strongest = links[0];
  return { devices: [strongest.a, strongest.b], confidence: strongest.confidence };
}

/** The challenge: phone, laptop and TV in one profile at ≥ 80% confidence, with third-party cookies off. */
export function oneProfileWithoutCookies(g: Graph, c: Conditions): boolean {
  return !c.thirdPartyCookies && g.profileDevices.length === 3 && g.confidence >= 0.8;
}

/** "Hybrid" when deterministic and probabilistic links both hold the graph together. */
export function matchingMode(g: Graph): "none" | LinkKind | "hybrid" {
  if (!g.links.length) return "none";
  const det = g.links.some((l) => l.kind === "deterministic");
  const prob = g.links.some((l) => l.signals.some((id) => signalById(id).kind === "probabilistic"));
  if (det && prob) return "hybrid";
  return det ? "deterministic" : "probabilistic";
}

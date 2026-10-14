/**
 * Pure model of one ad serve for the ad-serving-flow simulator (unit-tested).
 *
 * Step durations come from the ad-serving lessons' seven-step chain
 * (lessons/adserving/_shared.tsx): page/tag 10 ms, request 15, campaign
 * matching 20, RTB auction 50 (programmatic only), selection 10, creative
 * delivery 20 (from a CDN), impression pixel 5 — plus the 25 ms redirect to
 * the advertiser's ad server from when-the-auction-joins-in.
 *
 * Two numbers are ILLUSTRATIVE and labelled so on screen: the extra 40 ms an
 * uncached creative costs coming from the origin server instead of the CDN
 * edge, and the 20 ms a 4G mobile connection adds to every browser round
 * trip in this placement's scenario. The auction is server-to-server, so the
 * visitor's connection doesn't slow it.
 */

export interface ServeConfig {
  /** Direct (sold-in-advance) campaigns booked on this placement are eligible. */
  direct: boolean;
  /** A programmatic auction joins in. */
  programmatic: boolean;
  /** The winning advertiser serves its creative from its own (third-party) ad server. */
  redirect: boolean;
  /** The creative is cached at the CDN edge. */
  cdnCache: boolean;
}

export const DEFAULT_CONFIG: ServeConfig = { direct: true, programmatic: true, redirect: true, cdnCache: false };

export const BUDGET_MS = 200;
/** Illustrative: added to each round trip the visitor's browser makes over 4G. */
export const MOBILE_RTT_MS = 20;
/** Illustrative: extra time when the creative is fetched from origin instead of the CDN edge. */
export const ORIGIN_PENALTY_MS = 40;

/** Booked direct campaign vs the auction's best bid (DSP B's $6.35 from the auction lesson). */
export const DIRECT_CAMPAIGN = { name: "Booked sportswear campaign", cpm: 4 };
export const AUCTION_BEST = { name: "DSP B, retail advertiser", cpm: 6.35 };

export type Component = "browser" | "adserver" | "auction" | "advertiser" | "cdn";

export interface ServeStep {
  id: string;
  label: string;
  component: Component;
  duration: number;
  /** Part of that duration that is the 4G round trip. */
  network: number;
  detail: string;
}

export type Winner = "direct" | "programmatic" | null;

/** Which demand wins the decision engine: the higher CPM among the sources switched on. */
export function decide(config: ServeConfig): Winner {
  if (config.direct && config.programmatic) return AUCTION_BEST.cpm >= DIRECT_CAMPAIGN.cpm ? "programmatic" : "direct";
  if (config.programmatic) return "programmatic";
  if (config.direct) return "direct";
  return null;
}

/** The serve, step by step, for a configuration. With no eligible demand, the sequence ends unfilled. */
export function serveSteps(config: ServeConfig): ServeStep[] {
  const winner = decide(config);
  const steps: ServeStep[] = [
    {
      id: "tag",
      label: "Ad tag fires",
      component: "browser",
      duration: 10,
      network: 0,
      detail: "The page loads and the slot's JavaScript tag wakes up, ready to request an ad.",
    },
    {
      id: "request",
      label: "Request reaches the ad server",
      component: "browser",
      duration: 15 + MOBILE_RTT_MS,
      network: MOBILE_RTT_MS,
      detail: "The tag sends the publisher's ad server the context: location, device, browser, page content and any user ID.",
    },
    {
      id: "match",
      label: "Decision engine matches campaigns",
      component: "adserver",
      duration: 20,
      network: 0,
      detail: "The decision engine lists every campaign on this placement, then drops anything failing targeting, flight dates or budget caps.",
    },
  ];
  if (config.programmatic) {
    steps.push({
      id: "auction",
      label: "Programmatic auction joins in",
      component: "auction",
      duration: 50,
      network: 0,
      detail: "The SSP sends bid requests via the exchange to DSPs; each bids and the highest wins. Server-to-server, so 4G doesn't slow it.",
    });
  }
  steps.push({
    id: "select",
    label: winner ? "Ad selected" : "No eligible ad",
    component: "adserver",
    duration: 10,
    network: 0,
    detail:
      winner === "programmatic"
        ? `The engine compares sources: the auction's ${formatCpm(AUCTION_BEST.cpm)} beats the direct campaign${config.direct ? `'s ${formatCpm(DIRECT_CAMPAIGN.cpm)}` : ""}.`
        : winner === "direct"
          ? `The booked direct campaign wins at ${formatCpm(DIRECT_CAMPAIGN.cpm)}.`
          : "Nothing is eligible — no direct campaign and no auction. The slot goes unfilled and no impression is counted.",
  });
  if (!winner) return steps;
  if (config.redirect) {
    steps.push({
      id: "redirect",
      label: "Redirect to advertiser's ad server",
      component: "advertiser",
      duration: 25 + MOBILE_RTT_MS,
      network: MOBILE_RTT_MS,
      detail: "The markup is the advertiser's third-party tag, so the browser makes one more hop: the advertiser's server picks the creative and logs its own impression.",
    });
  }
  steps.push({
    id: "fetch",
    label: config.cdnCache ? "Creative from CDN edge, rendered" : "Creative from origin, rendered",
    component: "cdn",
    duration: 20 + (config.cdnCache ? 0 : ORIGIN_PENALTY_MS) + MOBILE_RTT_MS,
    network: MOBILE_RTT_MS,
    detail: config.cdnCache
      ? "The markup points at a creative cached on a nearby CDN edge; the browser renders it in the slot."
      : "Nothing is cached nearby, so the creative travels from the origin server before the browser can render it.",
  });
  steps.push({
    id: "track",
    label: "Impression counted",
    component: "browser",
    duration: 5 + MOBILE_RTT_MS,
    network: MOBILE_RTT_MS,
    detail: "A 1×1 impression pixel fires and the impression is recorded. Verification pixels may fire alongside it.",
  });
  return steps;
}

export function totalMs(steps: readonly { duration: number }[]): number {
  return steps.reduce((sum, s) => sum + s.duration, 0);
}

export function servesAnAd(config: ServeConfig): boolean {
  return decide(config) !== null;
}

/** The challenge: an ad is served and the whole sequence completes in under 200 ms. */
export function under200(config: ServeConfig): boolean {
  return servesAnAd(config) && totalMs(serveSteps(config)) < BUDGET_MS;
}

function formatCpm(v: number) {
  return `$${v.toFixed(2)} CPM`;
}

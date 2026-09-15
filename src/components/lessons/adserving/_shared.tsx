import type { ReactNode } from "react";

/**
 * The seven steps of one served impression, shared by the four-stages lesson
 * and the auction lesson. Step 4 is the auction and only runs on programmatic
 * inventory, which is why the two lessons render different slices of this list.
 */
export interface ServingStep {
  id: number;
  title: string;
  description: string;
  detail: ReactNode;
  /** Milliseconds this step takes on a typical desktop request. */
  duration: number;
}

export const SERVING_STEPS: ServingStep[] = [
  {
    id: 1,
    title: "User visits page",
    description: "Browser loads a webpage with ad slots",
    detail: (
      <>
        When a user opens a website or app containing ad space, the page begins loading. The ad
        slot's code — a JavaScript or iframe tag — prepares to request an ad.
      </>
    ),
    duration: 10,
  },
  {
    id: 2,
    title: "Ad request sent",
    description: "The ad tag fires a request to the ad server",
    detail: (
      <>
        The ad tag sends an ad request to the publisher's ad server. That request carries
        contextual and technical information: the user's location, device type and browser, the
        content of the page, and any cookie or user ID data available for targeting.
      </>
    ),
    duration: 15,
  },
  {
    id: 3,
    title: "Campaign matching",
    description: "The ad server evaluates eligible campaigns",
    detail: (
      <>
        The ad server compiles a list of all campaigns assigned to the requested placement, then
        applies business rules and targeting criteria — segmentation filters such as demographics,
        geography and interests, plus flight dates and budget caps — and drops everything
        ineligible.
      </>
    ),
    duration: 20,
  },
  {
    id: 4,
    title: "RTB auction (optional)",
    description: "Real-time bidding, if the impression is programmatic",
    detail: (
      <>
        For programmatic inventory, the supply-side platform sends bid requests to connected
        demand-side platforms via the ad exchange. Each one evaluates the impression and submits a
        bid, and the highest bidder wins.
      </>
    ),
    duration: 50,
  },
  {
    id: 5,
    title: "Ad selection",
    description: "The winning creative is chosen",
    detail: (
      <>
        The ad server picks the winning ad on bid price, targeting match and priority rules,
        weighing campaign goals such as cost per mille and cost per click. Selection can be random,
        weight-based, or decided by an auction.
      </>
    ),
    duration: 10,
  },
  {
    id: 6,
    title: "Creative delivery",
    description: "Ad markup is returned to the browser",
    detail: (
      <>
        The ad server returns ad markup — HTML and JavaScript — containing the link to the creative
        file on a content delivery network. The browser renders the ad in the designated slot.
      </>
    ),
    duration: 20,
  },
  {
    id: 7,
    title: "Impression tracked",
    description: "Tracking pixels fire for measurement",
    detail: (
      <>
        A transparent <span className="figure">1×1</span> impression pixel fires, recording the
        impression. Further third-party pixels may fire for verification, viewability measurement
        and cross-platform tracking.
      </>
    ),
    duration: 5,
  },
];

export const DIRECT_STEPS = SERVING_STEPS.filter((step) => step.id !== 4);
export const AUCTION_STEP = SERVING_STEPS.find((step) => step.id === 4) as ServingStep;

/** Total milliseconds for any slice of the chain — always summed, never typed in. */
export function totalMs(steps: readonly { duration: number }[]) {
  return steps.reduce((sum, step) => sum + step.duration, 0);
}

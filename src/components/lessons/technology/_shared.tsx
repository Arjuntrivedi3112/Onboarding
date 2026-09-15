/**
 * Shared material for the technology section.
 *
 * The six platform records below are the section's spine: lesson 1 shows them
 * as a map, and lessons 2-4 render the full profile for the ones they teach.
 * The copy lives here once so the same definition is never told two ways.
 */

import { cn } from "@/lib/utils";

export interface Platform {
  id: string;
  /** The acronym or short name people actually say. */
  name: string;
  fullName: string;
  /** One line, for the map in lesson 1. */
  description: string;
  whatIs: string;
  whyExists: string;
  /** Arrow-separated steps, split at render time. */
  dataFlow: string;
  /** Upstream, the platform itself, downstream. */
  ecosystem: [string, string, string];
}

export const PLATFORMS: Platform[] = [
  {
    id: "dsp",
    name: "DSP",
    fullName: "Demand-side platform",
    description: "Buy ad inventory programmatically",
    whatIs:
      "A DSP is software that allows advertisers and agencies to purchase display, video, mobile, and search ads automatically. It connects to multiple ad exchanges and SSPs.",
    whyExists:
      "Before DSPs, media buyers had to manually negotiate with each publisher. DSPs automate this, enabling real-time bidding on millions of impressions per second.",
    dataFlow:
      "Receives bid requests → Checks audience data from DMP → Calculates optimal bid → Submits bid to exchange → Receives win notification → Serves creative",
    ecosystem: ["Advertiser", "DSP", "Exchange"],
  },
  {
    id: "ssp",
    name: "SSP",
    fullName: "Supply-side platform",
    description: "Sell ad inventory efficiently",
    whatIs:
      "An SSP helps publishers manage, sell, and optimize their ad inventory. It connects to multiple ad exchanges and DSPs to maximize revenue.",
    whyExists:
      "Publishers needed a way to sell remnant inventory programmatically and get the best price. SSPs create competition among buyers and set floor prices.",
    dataFlow:
      "Receives ad request from publisher → Creates bid request → Sends to exchanges → Collects bids → Runs auction → Returns winning ad to publisher",
    ecosystem: ["Publisher", "SSP", "Exchange"],
  },
  {
    id: "exchange",
    name: "Ad exchange",
    fullName: "Ad exchange",
    description: "Marketplace for real-time trading",
    whatIs:
      "An ad exchange is a technology platform that facilitates the buying and selling of ad inventory from multiple ad networks. It operates like a stock exchange for ads.",
    whyExists:
      "Creates liquidity and transparency. Connects thousands of buyers and sellers in real-time, ensuring fair market pricing through auction mechanisms.",
    dataFlow:
      "Receives bid requests from SSPs → Broadcasts to connected DSPs → Collects bids → Determines winner via auction → Notifies winner → Facilitates creative delivery",
    ecosystem: ["DSPs", "Exchange", "SSPs"],
  },
  {
    id: "dmp",
    name: "DMP",
    fullName: "Data management platform",
    description: "Collect and segment audience data",
    whatIs:
      "A DMP collects, organizes, and activates first, second, and third-party audience data. It creates segments that can be used for targeting.",
    whyExists:
      "Advertisers need to understand their audience. DMPs unify data from multiple sources to create actionable segments for precise targeting.",
    dataFlow:
      "Collects user data → Normalizes and enriches → Creates segments → Syncs with DSPs → Enables targeted bidding → Measures and optimizes",
    ecosystem: ["Data sources", "DMP", "DSP"],
  },
  {
    id: "adserver",
    name: "Ad server",
    fullName: "Ad server",
    description: "Store and deliver creatives",
    whatIs:
      "An ad server stores advertising content and delivers it to users. It tracks impressions, clicks, and conversions while managing ad rotation and targeting.",
    whyExists:
      "Centralizes creative management, enables A/B testing, provides unified reporting, and ensures ads are served correctly across all campaigns.",
    dataFlow:
      "Stores creatives → Receives ad call → Applies targeting rules → Selects best creative → Delivers to user → Logs impression/click data",
    ecosystem: ["Creatives", "Ad server", "User"],
  },
  {
    id: "adnetwork",
    name: "Ad network",
    fullName: "Ad network",
    description: "Aggregate inventory from publishers",
    whatIs:
      "An ad network aggregates ad space from multiple publishers and sells it to advertisers. It acts as an intermediary, often focusing on specific verticals or formats.",
    whyExists:
      "Small publishers can't attract direct advertisers. Ad networks bundle their inventory and sell at scale, providing access to larger ad budgets.",
    dataFlow:
      "Collects inventory from publishers → Categorizes and packages → Sells to advertisers → Distributes campaigns → Reports performance",
    ecosystem: ["Publishers", "Network", "Advertisers"],
  },
];

export function getPlatform(id: string): Platform {
  const found = PLATFORMS.find((p) => p.id === id);
  if (!found) throw new Error(`Unknown platform: ${id}`);
  return found;
}

/** A box in a chain diagram. Nothing here animates on a loop. */
export function StackNode({
  label,
  active = false,
  dimmed = false,
}: {
  label: string;
  active?: boolean;
  dimmed?: boolean;
}) {
  return (
    <span
      className={cn(
        "flex min-h-[3rem] min-w-[4.5rem] items-center justify-center rounded-xl border px-3 py-2 text-center text-sm transition-colors",
        active
          ? "border-border-strong bg-secondary text-foreground"
          : "border-border bg-card text-muted-foreground",
        dimmed && "opacity-40"
      )}
    >
      {label}
    </span>
  );
}

/** The connector between two StackNodes. Decorative. */
export function ChainArrow() {
  return (
    <span aria-hidden="true" className="px-1 text-muted-foreground">
      →
    </span>
  );
}

/**
 * The full profile for one platform: what it is, why it exists, the data that
 * moves through it, and the three nodes it sits between.
 */
export function PlatformProfile({ id }: { id: string }) {
  const p = getPlatform(id);
  const steps = p.dataFlow.split("→").map((s) => s.trim());
  const [upstream, self, downstream] = p.ecosystem;

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <p className="text-xs uppercase text-muted-foreground">{p.name}</p>
      <h4 className="mt-1 text-lg text-foreground">{p.fullName}</h4>

      <p className="measure mt-3 text-muted-foreground">{p.whatIs}</p>

      <p className="mt-5 text-xs uppercase text-muted-foreground">Why it exists</p>
      <p className="measure mt-1 text-muted-foreground">{p.whyExists}</p>

      <p className="mt-5 text-xs uppercase text-muted-foreground">Data flow</p>
      <ol className="mt-2 space-y-1">
        {steps.map((step, i) => (
          <li key={step} className="flex gap-3 text-sm text-muted-foreground">
            <span className="figure shrink-0 text-muted-foreground">{i + 1}</span>
            <span>{step}</span>
          </li>
        ))}
      </ol>

      <p className="mt-5 text-xs uppercase text-muted-foreground">In the ecosystem</p>
      <div className="mt-2 flex flex-wrap items-center gap-1">
        <StackNode label={upstream} />
        <ChainArrow />
        <StackNode label={self} active />
        <ChainArrow />
        <StackNode label={downstream} />
      </div>
    </div>
  );
}

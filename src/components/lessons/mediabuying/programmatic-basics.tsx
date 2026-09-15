import { useState } from "react";

import type { LessonContent } from "@/components/journey/lesson-content";
import { cn } from "@/lib/utils";

interface BuyingModel {
  id: string;
  name: string;
  oneLiner: string;
  control: string;
  pricing: string;
  scale: string;
  bullets: string[];
}

const MODELS: BuyingModel[] = [
  {
    id: "auction",
    name: "Open auction",
    oneLiner: "Public real-time bidding (RTB) — any advertiser can bid on the inventory available.",
    control: "Lowest — placement is decided by whoever wins the auction",
    pricing: "Competitive, set by the market impression by impression",
    scale: "Highest — thousands of publishers, billions of daily impressions",
    bullets: [
      "Maximum reach and scale",
      "Competitive pricing set live, not negotiated",
      "The least control over exactly where an ad lands",
    ],
  },
  {
    id: "pmp",
    name: "Private marketplace (PMP)",
    oneLiner:
      "An invite-only RTB environment. A publisher hands out Deal IDs that let specific advertisers bid on inventory before it ever reaches the open market.",
    control: "Moderate — the publisher chooses who is invited and what is bundled",
    pricing: "Still an auction, but only among invited bidders",
    scale: "Moderate — limited to whoever holds a Deal ID",
    bullets: [
      "Early access to premium, brand-safe inventory",
      "Better viewability and transparency into placement quality",
      "A middle ground between open auction and programmatic direct",
    ],
  },
  {
    id: "direct",
    name: "Programmatic direct",
    oneLiner:
      "Also called programmatic guaranteed, reserved, or automated guaranteed. No auction — a fixed cost per mille (CPM), negotiated directly, executed automatically.",
    control: "Highest — placement, dates, and volume are agreed in advance",
    pricing: "Fixed CPM, set by negotiation, not by bidding",
    scale: "Lowest — limited to the inventory a publisher chooses to reserve",
    bullets: [
      "Guaranteed inventory, locked in ahead of the flight",
      "Predictable pricing and delivery commitments",
      "Automation removes manual trafficking once the order is approved",
    ],
  },
];

const DIRECT_STEPS = [
  "Advertisers browse digital media catalogs",
  "They select placements, dates, and impression volumes",
  "Creatives and tracking pixels are configured",
  "The order is placed through the platform",
  "The publisher audits the campaign for compliance",
  "Once approved, the campaign runs without manual trafficking by AdOps",
];

interface Brief {
  id: string;
  label: string;
  match: string;
}

const BRIEFS: Brief[] = [
  {
    id: "launch",
    label: "A brand launch that needs a guaranteed homepage takeover on launch day",
    match: "direct",
  },
  {
    id: "performance",
    label: "A performance campaign that needs maximum reach at the lowest cost per action",
    match: "auction",
  },
  {
    id: "premium-video",
    label: "A premium, brand-safe video buy for a category that can't risk the open market",
    match: "pmp",
  },
];

function Body() {
  const [briefId, setBriefId] = useState<string | null>(null);
  const brief = BRIEFS.find((b) => b.id === briefId) ?? null;
  const matched = brief ? MODELS.find((m) => m.id === brief.match) ?? null : null;

  return (
    <div className="space-y-8">
      <div className="measure space-y-4 text-muted-foreground">
        <p>
          Running a digital campaign used to be a manual process. Advertisers and publishers
          negotiated deals directly, exchanged ad tags by email, and coordinated placements and
          schedules by hand. That worked at a small scale and broke down as digital advertising
          grew.
        </p>
        <p>
          <span className="text-foreground">Programmatic</span> means using software, data, and
          algorithms to automate the buying and selling of digital ads. An advertiser sets rules —
          audience targeting, bid limits — and the system executes the campaign, adjusts bids, and
          optimizes performance, often in real time. People still set strategy and monitor results;
          the day-to-day execution runs on its own.
        </p>
        <p>
          There isn't one way to buy programmatically. Three models exist, and they trade the same
          three things against each other in different amounts: control over placement, price, and
          scale.
        </p>
      </div>

      <section>
        <h3 className="mb-3 text-lg text-foreground">Three ways to buy</h3>
        <ul className="grid gap-4 lg:grid-cols-3">
          {MODELS.map((m) => (
            <li key={m.id} className="rounded-lg border border-border bg-card p-4">
              <h4 className="text-foreground">{m.name}</h4>
              <p className="measure mt-1 text-sm text-muted-foreground">{m.oneLiner}</p>
              <ul className="mt-3 space-y-1.5">
                {m.bullets.map((b) => (
                  <li key={b} className="flex gap-2 text-sm text-muted-foreground">
                    <span aria-hidden="true" className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3 className="mb-1 text-lg text-foreground">Programmatic direct, step by step</h3>
        <p className="measure mb-4 text-sm text-muted-foreground">
          Unlike real-time bidding, programmatic direct never runs an auction. This is the process
          behind the fixed CPM.
        </p>
        <ol className="space-y-1.5">
          {DIRECT_STEPS.map((step, i) => (
            <li key={step} className="flex gap-3 text-sm text-muted-foreground">
              <span className="figure shrink-0">{i + 1}</span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
        <p className="measure mt-3 text-sm text-muted-foreground">
          The trade-off: guaranteed inventory and predictable delivery, but typically higher CPMs,
          targeting limited to context and placement, and the publisher's own risk of unfilled
          inventory if the deal doesn't sell out.
        </p>
      </section>

      <section>
        <h3 className="mb-1 text-lg text-foreground">Try it</h3>
        <p className="measure mb-4 text-sm text-muted-foreground">
          Pick a brief and see which buying model actually fits it. The right model is rarely the
          one with the best reach — it's the one that matches what the brief can't compromise on.
        </p>

        <div className="flex flex-col gap-2" role="group" aria-label="Choose a campaign brief">
          {BRIEFS.map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={() => setBriefId(b.id)}
              aria-pressed={briefId === b.id}
              className={cn(
                "min-h-[2.75rem] rounded-lg border px-4 py-2 text-left text-sm transition-colors",
                briefId === b.id
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border text-muted-foreground hover:text-foreground"
              )}
            >
              {b.label}
            </button>
          ))}
        </div>

        <div className="mt-4 rounded-lg border border-border bg-card p-5">
          {matched ? (
            <>
              <p className="text-xs uppercase text-muted-foreground">Best fit</p>
              <p className="mt-1 text-foreground">{matched.name}</p>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div>
                  <p className="text-xs uppercase text-muted-foreground">Control</p>
                  <p className="measure mt-0.5 text-sm text-muted-foreground">{matched.control}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-muted-foreground">Pricing</p>
                  <p className="measure mt-0.5 text-sm text-muted-foreground">{matched.pricing}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-muted-foreground">Scale</p>
                  <p className="measure mt-0.5 text-sm text-muted-foreground">{matched.scale}</p>
                </div>
              </div>

              {matched.id === "pmp" && (
                <p className="mt-4 text-sm text-muted-foreground">
                  Sample deal ID: <span className="figure text-foreground">PMP-4471-PREMIUM-VIDEO</span>
                </p>
              )}
              {matched.id === "direct" && (
                <p className="measure mt-4 text-sm text-muted-foreground">
                  This is the guaranteed path: the six-step flow above runs in full, and the
                  homepage takeover is reserved before launch day, not auctioned for on it.
                </p>
              )}
              {matched.id === "auction" && (
                <p className="measure mt-4 text-sm text-muted-foreground">
                  No inventory is reserved here. Every impression is bought in an open RTB auction,
                  which is exactly what makes the scale possible.
                </p>
              )}
            </>
          ) : (
            <p className="text-muted-foreground">Choose a brief above to see the matching model.</p>
          )}
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-lg text-foreground">How the three compare</h3>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[36rem] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="py-2 pr-4 font-normal">Dimension</th>
                <th className="py-2 pr-4 font-normal">Open auction</th>
                <th className="py-2 pr-4 font-normal">PMP</th>
                <th className="py-2 pr-4 font-normal">Programmatic direct</th>
              </tr>
            </thead>
            <tbody className="text-muted-foreground">
              <tr className="border-b border-border">
                <td className="py-2 pr-4 text-foreground">Auction involved</td>
                <td className="py-2 pr-4">Yes, open to all</td>
                <td className="py-2 pr-4">Yes, invited only</td>
                <td className="py-2 pr-4">No</td>
              </tr>
              <tr className="border-b border-border">
                <td className="py-2 pr-4 text-foreground">Pricing</td>
                <td className="py-2 pr-4">Market-set per impression</td>
                <td className="py-2 pr-4">Market-set, narrower pool</td>
                <td className="py-2 pr-4">Fixed, negotiated CPM</td>
              </tr>
              <tr className="border-b border-border">
                <td className="py-2 pr-4 text-foreground">Inventory guarantee</td>
                <td className="py-2 pr-4">None</td>
                <td className="py-2 pr-4">None</td>
                <td className="py-2 pr-4">Guaranteed</td>
              </tr>
              <tr>
                <td className="py-2 pr-4 text-foreground">Best for</td>
                <td className="py-2 pr-4">Scale, performance goals</td>
                <td className="py-2 pr-4">Brand-safe, premium reach</td>
                <td className="py-2 pr-4">Must-run, high-visibility placements</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

const lesson: LessonContent = {
  whyThisMatters: (
    <p>
      Someone will hand you a media plan that mixes all three buying models in one campaign, and
      expect you to know why. Pick the wrong one for a brief — an auction for a must-run placement,
      a guaranteed deal for a performance campaign — and you either overpay or miss the moment
      entirely.
    </p>
  ),
  objectives: [
    "Explain what programmatic added to media buying that manual negotiation lacked",
    "Describe the trade-offs of open auction, private marketplace (PMP), and programmatic direct buying",
    "Match a campaign brief to the buying model that fits it best",
  ],
  Body,
  takeaways: [
    "Programmatic replaced manual negotiation and emailed ad tags with software that sets rules once and executes the buy in real time.",
    "Programmatic direct trades an auction for a guaranteed, negotiated cost per mille (CPM); open auction trades that guarantee for maximum reach; a private marketplace sits between the two.",
    "A private marketplace runs on Deal IDs, which let an invited advertiser bid on inventory before it ever reaches the open market.",
  ],
  checkYourself: [
    {
      question:
        "A media buyer needs a guaranteed homepage takeover for a product launch and cannot risk the slot going unsold to a higher bidder. Which buying model fits, and why not an open auction?",
      answer: (
        <p>
          Programmatic direct. It offers guaranteed inventory and predictable delivery at a fixed
          CPM. An open auction guarantees nothing — someone else's bid could win the slot, or it
          could go unfilled.
        </p>
      ),
    },
    {
      question: "What is a Deal ID, and which buying model depends on it?",
      answer: (
        <p>
          A Deal ID is the identifier a publisher issues to an invited advertiser in a private
          marketplace, letting that advertiser bid on specific inventory before it reaches the open
          market. Private marketplaces depend on it — it's the mechanism that makes the environment
          invite-only.
        </p>
      ),
    },
  ],
};

export default lesson;

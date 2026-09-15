import { useState } from "react";

import type { LessonContent } from "@/components/journey/lesson-content";
import { cn } from "@/lib/utils";
import { PlatformProfile } from "./_shared";

const SSP_FUNCTIONS = [
  "Manage and organize ad inventory, including formats, sizes, and targeting options",
  "Connect to multiple ad exchanges and DSPs to maximize competition for each impression",
  "Run real-time auctions and select the highest bid in milliseconds",
  "Provide ad quality controls, fraud detection, and brand safety protections",
  "Support audience targeting, frequency capping, and privacy-compliant data use",
  "Deliver real-time and custom reporting for revenue and performance tracking",
  "Support both client-side and server-side header bidding to increase competition and yield",
  "Allow operational flexibility through macros, overrides, and custom settings",
  "Optimize yield with dynamic floor pricing, packaging strategies, and data-driven analysis",
];

const SSP_COMPONENTS = [
  { name: "Auction engine and bidder infrastructure", role: "Often cloud-hosted, so it can scale to every impression at once." },
  { name: "Integrations", role: "Wired into ad servers, DSPs, ad exchanges, and data platforms." },
  { name: "Ad exchange functionality", role: "For trading inventory directly, without a separate exchange in the middle." },
  { name: "Header bidding module", role: "Lets several demand sources compete for the same impression at once." },
  { name: "Data collection systems", role: "Gathers audience and performance signals." },
  { name: "Reporting database", role: "Real-time and historical analytics." },
  { name: "User interface", role: "Campaign setup, monitoring, and yield management." },
];

const SSP_INTEGRATIONS = [
  "Ad exchanges, DSPs, and direct buyers",
  "Data platforms (DMPs, CDPs, or clean rooms)",
  "Ad servers",
  "Yield optimization tools and header bidding frameworks (e.g., Prebid)",
];

const EXCHANGE_STEPS = [
  {
    title: "User visit",
    detail: "A user opens a website or app. The publisher's supply-side platform sends the exchange a request for an available impression.",
  },
  {
    title: "Real-time bidding",
    detail: "The exchange starts a real-time auction in which advertisers, through their demand-side platforms, can bid on that specific impression.",
  },
  {
    title: "Bidding and targeting",
    detail: "Advertisers lean on audience data — demographics, location, browsing history — to set a bid price and target the users worth most to them.",
  },
  {
    title: "Winning bidder",
    detail: "The exchange selects the highest bidder, and the corresponding ad is chosen for delivery.",
  },
  {
    title: "Ad served",
    detail: "The publisher's ad server delivers the winning ad to the user's device.",
  },
];

const EXCHANGE_INTEGRATIONS = ["SSPs and DSPs", "Analytics platforms and optimization tools", "Anti-fraud systems"];

/**
 * The auction floor. Each bid is data, not display copy — every figure the
 * learner sees (who wins, what clears, what the publisher earns) is derived
 * from this array plus the two controls, never typed separately.
 */
const CANDIDATE_BIDS = [
  { id: "a", buyer: "DSP A", amount: 2.2, passesQuality: true, headerBidding: false },
  { id: "b", buyer: "DSP B", amount: 1.35, passesQuality: true, headerBidding: false },
  { id: "c", buyer: "DSP C", amount: 3.4, passesQuality: false, headerBidding: false },
  { id: "d", buyer: "DSP D", amount: 2.75, passesQuality: true, headerBidding: true },
  { id: "e", buyer: "DSP E", amount: 1.9, passesQuality: true, headerBidding: true },
] as const;

const FLOOR_OPTIONS = [
  { id: "open", value: 0 },
  { id: "mid", value: 2 },
  { id: "high", value: 3 },
] as const;

function Body() {
  const [floorId, setFloorId] = useState<(typeof FLOOR_OPTIONS)[number]["id"]>("mid");
  const [headerBidding, setHeaderBidding] = useState(false);

  const floor = FLOOR_OPTIONS.find((f) => f.id === floorId) ?? FLOOR_OPTIONS[0];
  const visible = CANDIDATE_BIDS.filter((b) => !b.headerBidding || headerBidding);
  const eligible = visible.filter((b) => b.amount >= floor.value && b.passesQuality);
  const winner = eligible.length
    ? eligible.reduce((best, b) => (b.amount > best.amount ? b : best))
    : null;

  return (
    <div className="space-y-8">
      <div className="measure space-y-4 text-muted-foreground">
        <p>
          A <span className="text-foreground">supply-side platform (SSP)</span> — the software a
          publisher sells its inventory through — is the sell side's counterpart to the demand-side
          platform (DSP) from the last lesson. Where a DSP's job is to find the best impression for a
          budget, an SSP's job is to find the best price for a slot, impression by impression, across
          every exchange and buyer it can reach.
        </p>
      </div>

      <PlatformProfile id="ssp" />

      <section>
        <h3 className="mb-3 text-lg text-foreground">What an SSP actually does</h3>
        <ul className="grid gap-2 sm:grid-cols-2">
          {SSP_FUNCTIONS.map((fn) => (
            <li key={fn} className="flex gap-3 text-muted-foreground">
              <span aria-hidden="true" className="mt-2 h-1 w-1 shrink-0 rounded-full bg-primary" />
              <span className="measure">{fn}</span>
            </li>
          ))}
        </ul>
        <p className="measure mt-4 text-muted-foreground">
          Two of those are the ones people underrate. Frequency capping — limiting how many times one
          person sees the same ad — protects the publisher's own audience from wearing an ad out.
          And a floor price — the lowest bid the publisher will accept for a slot — is how a
          publisher refuses to sell an impression too cheaply, even when a real-time bidding (RTB)
          auction is running.
        </p>
      </section>

      <section>
        <h3 className="mb-1 text-lg text-foreground">How an SSP works, once</h3>
        <p className="measure mb-4 text-muted-foreground">
          A publisher defines its available ad space and sets parameters such as format, size,
          targeting criteria, and floor prices. When a user visits, an ad request goes out through
          the SSP to connected exchanges, DSPs, and demand partners. The SSP runs a real-time
          auction, evaluates the bids on price, relevance, ad quality, and the publisher's own rules,
          and determines a winner — all in under a second.
        </p>

        <h4 className="mb-2 text-foreground">The parts doing that work</h4>
        <ul className="grid gap-2 sm:grid-cols-2">
          {SSP_COMPONENTS.map((c) => (
            <li key={c.name} className="rounded-lg border border-border bg-card p-3">
              <span className="block text-foreground">{c.name}</span>
              <span className="mt-0.5 block text-sm text-muted-foreground">{c.role}</span>
            </li>
          ))}
        </ul>

        <h4 className="mb-2 mt-5 text-foreground">What it has to be plugged into</h4>
        <div className="flex flex-wrap gap-2">
          {SSP_INTEGRATIONS.map((item) => (
            <span
              key={item}
              className="rounded-lg border border-border bg-secondary px-3 py-1 text-sm text-muted-foreground"
            >
              {item}
            </span>
          ))}
        </div>
      </section>

      <section>
        <h3 className="mb-2 text-lg text-foreground">In the wild</h3>
        <p className="measure text-muted-foreground">
          Not every SSP treats every sale the same way. The book describes a deal-based SSP — a
          premium supply platform built to support both open auctions and private, negotiated deals
          side by side — giving a publisher a flexible way to maximize monetization across both.
        </p>
      </section>

      <section>
        <h3 className="mb-3 text-lg text-foreground">Where the winning bid actually gets picked</h3>
        <p className="measure mb-4 text-muted-foreground">
          An <span className="text-foreground">ad exchange</span> is the marketplace where DSPs
          bidding on behalf of advertisers meet SSPs selling on behalf of publishers — a dynamic
          platform matching the two sides rather than owning inventory or budget itself.
        </p>

        <PlatformProfile id="exchange" />

        <ol className="mt-4 space-y-2">
          {EXCHANGE_STEPS.map((step, i) => (
            <li key={step.title} className="flex gap-3 text-muted-foreground">
              <span className="figure shrink-0">{i + 1}</span>
              <span className="measure">
                <span className="text-foreground">{step.title}.</span> {step.detail}
              </span>
            </li>
          ))}
        </ol>

        <h4 className="mb-2 mt-5 text-foreground">What it has to be plugged into</h4>
        <div className="flex flex-wrap gap-2">
          {EXCHANGE_INTEGRATIONS.map((item) => (
            <span
              key={item}
              className="rounded-lg border border-border bg-secondary px-3 py-1 text-sm text-muted-foreground"
            >
              {item}
            </span>
          ))}
        </div>
      </section>

      <section>
        <h3 className="mb-1 text-lg text-foreground">Try it</h3>
        <p className="measure mb-4 text-sm text-muted-foreground">
          Five demand-side platforms want this slot. Set a floor price and switch header bidding —
          letting more demand sources compete for the same impression at once — on and off, and watch
          which bids even reach the auction, which get rejected, and what the publisher ends up
          earning.
        </p>

        <div className="flex flex-wrap gap-2" role="group" aria-label="Set the publisher's floor price">
          {FLOOR_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setFloorId(option.id)}
              aria-pressed={floorId === option.id}
              className={cn(
                "min-h-[2.75rem] rounded-lg border px-4 text-sm transition-colors",
                floorId === option.id
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border text-muted-foreground hover:text-foreground"
              )}
            >
              {option.value === 0 ? (
                "No floor"
              ) : (
                <>
                  <span className="figure">${option.value.toFixed(2)}</span> floor
                </>
              )}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setHeaderBidding((v) => !v)}
            aria-pressed={headerBidding}
            className={cn(
              "min-h-[2.75rem] rounded-lg border px-4 text-sm transition-colors",
              headerBidding
                ? "border-primary bg-primary/10 text-foreground"
                : "border-border text-muted-foreground hover:text-foreground"
            )}
          >
            Header bidding {headerBidding ? "on" : "off"}
          </button>
        </div>

        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {visible.map((bid) => {
            const isWinner = winner?.id === bid.id;
            const belowFloor = bid.amount < floor.value;
            const status = isWinner
              ? "Winning bid"
              : !bid.passesQuality
              ? "Rejected — failed ad-quality and brand-safety checks"
              : belowFloor
              ? "Rejected — below the floor price"
              : "Outbid";
            return (
              <li
                key={bid.id}
                className={cn(
                  "rounded-lg border p-3",
                  isWinner ? "border-primary bg-primary/10" : "border-border bg-card"
                )}
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-foreground">{bid.buyer}</span>
                  <span className="figure text-foreground">${bid.amount.toFixed(2)}</span>
                </div>
                <span className="mt-0.5 block text-sm text-muted-foreground">{status}</span>
              </li>
            );
          })}
        </ul>

        <div className="mt-4 rounded-lg border border-border bg-card p-5">
          <p className="text-xs uppercase text-muted-foreground">Publisher revenue</p>
          {winner ? (
            <p className="mt-1 text-foreground">
              <span className="figure text-2xl">${winner.amount.toFixed(2)}</span>
              <span className="text-muted-foreground"> from {winner.buyer}</span>
            </p>
          ) : (
            <p className="mt-1 text-destructive">No sale — nothing cleared the floor and the quality checks</p>
          )}
          <p className="measure mt-2 text-sm text-muted-foreground">
            <span className="figure">{eligible.length}</span> of{" "}
            <span className="figure">{visible.length}</span> visible bids cleared the floor and the
            quality checks this round.
          </p>
        </div>

        <p className="measure mt-3 text-sm text-muted-foreground">
          The amounts here are illustrative, not a quoted market rate. What is real is the shape of
          it: header bidding widens the pool of competing demand, and a floor price protects the
          publisher from a low winning bid — sometimes at the cost of selling the impression at all.
        </p>
      </section>

      <div className="measure space-y-4 text-muted-foreground">
        <p>
          Put the last two lessons together and you have most of the auction: a DSP decided whether
          and how much to bid, an SSP collected that bid alongside others and enforced the
          publisher's rules, and an exchange picked the winner. What is still missing is how the
          winning ad actually gets onto the page — that is the next lesson.
        </p>
      </div>
    </div>
  );
}

const lesson: LessonContent = {
  whyThisMatters: (
    <p>
      When a publisher asks why yield dropped, the answer is almost always sitting in the SSP: a
      floor price set too high, header bidding turned off, or a demand source failing quality
      checks. Knowing what the SSP controls — and what the exchange decides instead — tells you where
      to look first.
    </p>
  ),
  objectives: [
    "Explain what a supply-side platform does that a demand-side platform does not",
    "Say what a floor price and header bidding each do to an auction's outcome",
    "Describe the five steps an ad exchange runs between a user visit and a served ad",
  ],
  Body,
  takeaways: [
    "A supply-side platform manages a publisher's inventory and rules — format, targeting, floor prices, quality and fraud controls — while an ad exchange runs the auction itself.",
    "Header bidding increases competition for a single impression by letting multiple demand sources bid at once, and a floor price sets the lowest amount a publisher will accept.",
    "An ad exchange's job is narrow but exact: take the bid requests an SSP sends it, run the auction, pick the highest qualifying bid, and hand the win back so the publisher's ad server can deliver it.",
  ],
  checkYourself: [
    {
      question: "A publisher raises its floor price and revenue drops the same week. What most likely happened?",
      answer: (
        <p>
          The new floor is higher than what several bids were willing to pay, so those impressions
          go unsold instead of clearing at a lower price. A floor price protects against a bad price,
          not against no sale — the publisher traded some volume for a higher price on what still
          clears.
        </p>
      ),
    },
    {
      question: "Why would a publisher turn on header bidding instead of just connecting to more exchanges?",
      answer: (
        <p>
          Header bidding lets multiple demand sources — including several exchanges and SSPs at once
          — bid on the same impression simultaneously rather than in a waterfall where each is asked
          in turn. That simultaneous competition tends to produce a higher winning bid than asking
          sources one after another.
        </p>
      ),
    },
  ],
};

export default lesson;

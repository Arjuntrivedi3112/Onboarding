import { useState } from "react";

import type { LessonContent } from "@/components/journey/lesson-content";
import { cn } from "@/lib/utils";
import { PlatformProfile } from "./_shared";

const FIRST_PARTY_POINTS = [
  "Fills ad slots from direct campaigns, real-time bidding (RTB) auctions, and other media-buying processes",
  "Forecasts future inventory availability and predicts campaign performance from current and historical data",
];

const THIRD_PARTY_POINTS = [
  "Tracks the performance of the whole campaign across every publisher in a single system",
  "Measures campaign reach while accounting for co-viewership — the same person counted on more than one publisher",
  "Verifies the accuracy of the data publishers report back",
];

/**
 * The seven-step call, as data. Each step carries the pool of campaigns still
 * in play after it runs; every number the learner sees (what got filtered,
 * what's left) is derived from these pools, never restated separately.
 */
const AD_SERVER_STEPS = [
  {
    id: "request",
    title: "The ad request",
    pool: 40,
    detail:
      "A user's browser loads the ad tag — a snippet of JavaScript naming the placement — and sends a request to the ad server. Nothing has been filtered yet.",
  },
  {
    id: "compile",
    title: "Compiling campaigns",
    pool: 25,
    detail: "The server compiles every campaign assigned to this placement, checking each one's scheduled flight dates.",
  },
  {
    id: "eligibility",
    title: "Checking eligibility",
    pool: 9,
    detail: "Campaigns targeted only at a different device or region are filtered out, leaving the ones actually eligible to run here.",
  },
  {
    id: "select",
    title: "Selecting the ad",
    pool: 1,
    detail: "One ad is chosen from the eligible pool — the choice can be random, weight-based, or influenced by a bid.",
  },
  {
    id: "deliver",
    title: "Delivering the ad code",
    pool: 1,
    detail: "The server returns the HTML and JavaScript needed to render the ad, and the browser executes it.",
  },
  {
    id: "track",
    title: "Tracking impressions and clicks",
    pool: 1,
    detail:
      "The impression is logged. A click calls back to the server, which records it and calculates click-through rate (CTR) — alongside viewability, invalid traffic, and conversion tracking.",
  },
  {
    id: "monitor",
    title: "Monitoring performance",
    pool: 1,
    detail: "The server keeps a record of every tracked event and reports on it — the same reports that become the basis for billing.",
  },
] as const;

const AD_SERVER_COMPONENTS = [
  "Ad decision engine",
  "Ad planning and scheduling",
  "Creative management and storage",
  "Ad delivery and service module",
  "Targeting and personalization",
  "Tracking and reporting",
  "Inventory management and forecasting",
  "User interface",
];

const AD_SERVER_INTEGRATIONS = [
  "DSPs and SSPs",
  "Ad exchange",
  "DMPs",
  "Creative optimization platforms (DCO)",
  "Verification vendors",
  "CDPs",
];

const NETWORK_TYPES = [
  {
    id: "premium",
    label: "Premium",
    example: "Top-tier publishers, such as a national newspaper",
    pricing: "Higher CPM, sold on the network's reputation",
  },
  {
    id: "vertical",
    label: "Vertical",
    example: "One content category — business, technology, automotive, fashion",
    pricing: "Priced on relevance to that category",
  },
  {
    id: "specialized",
    label: "Specialized",
    example: "One channel type — mobile, video, or native only",
    pricing: "Priced for that format's demand",
  },
  {
    id: "performance",
    label: "Performance and affiliate",
    example: "Runs across almost any publisher willing to take the deal",
    pricing: "Revenue-share, cost-per-click (CPC), or cost-per-action (CPA)",
  },
] as const;

const NETWORK_TARGETING = [
  "Run on network (RON) — run across every site in the network",
  "Run on site (ROS) — target specific domains or publishers within it",
  "IAB content categories",
  "Geolocation",
  "Keywords (context)",
  "Time of day",
  "Browser type and operating system",
];

const NETWORK_INTEGRATIONS = [
  "Publisher sites and apps, via JavaScript tags, header bidding adapters, iFrames, CMS plugins, and mobile SDKs",
  "Ad servers, SSPs, and DSPs",
  "Analytics and attribution providers",
  "DMPs, CDPs, and marketing platforms, through RESTful application programming interfaces (APIs)",
];

function Body() {
  const [step, setStep] = useState(0);
  const [networkType, setNetworkType] = useState<(typeof NETWORK_TYPES)[number]["id"]>("premium");

  const current = AD_SERVER_STEPS[step];
  const previousPool = step > 0 ? AD_SERVER_STEPS[step - 1].pool : 40;
  const filteredOut = previousPool - current.pool;
  const done = step >= AD_SERVER_STEPS.length - 1;
  const network = NETWORK_TYPES.find((n) => n.id === networkType) ?? NETWORK_TYPES[0];

  return (
    <div className="space-y-8">
      <div className="measure space-y-4 text-muted-foreground">
        <p>
          A DSP decides what to bid, an SSP and an exchange decide who wins — but something still
          has to hold the creative, choose which version of it to show, and count what happened. That
          is an <span className="text-foreground">ad server</span>: the platform that decides which
          ads to display, delivers them, and collects and reports data on impressions, clicks, and
          other performance metrics. Much like a content-management system runs a website, an ad
          server runs a placement.
        </p>
      </div>

      <PlatformProfile id="adserver" />

      <section>
        <h3 className="mb-3 text-lg text-foreground">Two ad servers, two owners</h3>
        <p className="measure mb-4 text-muted-foreground">
          "Ad server" is ambiguous on its own, because two different parties each run one. A{" "}
          <span className="text-foreground">first-party ad server</span> belongs to the publisher. A{" "}
          <span className="text-foreground">third-party ad server</span> belongs to the advertiser.
          Both store and deliver creatives; what differs is whose picture of the campaign each one
          keeps.
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs uppercase text-muted-foreground">Publisher's server</p>
            <h4 className="mt-1 mb-2 text-foreground">First-party</h4>
            <ul className="space-y-2">
              {FIRST_PARTY_POINTS.map((point) => (
                <li key={point} className="flex gap-3 text-sm text-muted-foreground">
                  <span aria-hidden="true" className="mt-2 h-1 w-1 shrink-0 rounded-full bg-primary" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs uppercase text-muted-foreground">Advertiser's server</p>
            <h4 className="mt-1 mb-2 text-foreground">Third-party</h4>
            <ul className="space-y-2">
              {THIRD_PARTY_POINTS.map((point) => (
                <li key={point} className="flex gap-3 text-sm text-muted-foreground">
                  <span aria-hidden="true" className="mt-2 h-1 w-1 shrink-0 rounded-full bg-primary" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section>
        <h3 className="mb-1 text-lg text-foreground">Try it</h3>
        <p className="measure mb-4 text-sm text-muted-foreground">
          Forty campaigns are assigned to one placement. Step through the seven-step call and watch
          the pool narrow — flight dates, then eligibility, then one ad chosen — before the same
          server turns around and tracks what its own choice produced.
        </p>

        <div
          className="flex flex-wrap gap-2"
          role="group"
          aria-label="Step through the ad server call"
        >
          <button
            type="button"
            onClick={() => setStep((s) => Math.min(s + 1, AD_SERVER_STEPS.length - 1))}
            disabled={done}
            className={cn(
              "min-h-[2.75rem] rounded-lg border px-4 text-sm transition-colors",
              done
                ? "border-border text-muted-foreground opacity-50"
                : "border-primary bg-primary/10 text-foreground"
            )}
          >
            Advance to the next step
          </button>
          <button
            type="button"
            onClick={() => setStep(0)}
            className="min-h-[2.75rem] rounded-lg border border-border px-4 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Restart the call
          </button>
        </div>

        <div className="mt-4 rounded-lg border border-border bg-card p-5">
          <p className="text-xs uppercase text-muted-foreground">
            Step <span className="figure">{step + 1}</span> of{" "}
            <span className="figure">{AD_SERVER_STEPS.length}</span>
          </p>
          <p className="mt-1 text-foreground">{current.title}</p>
          <p className="measure mt-2 text-muted-foreground">{current.detail}</p>

          <p className="mt-4 text-xs uppercase text-muted-foreground">Campaigns still in play</p>
          <p className="mt-1 text-foreground">
            <span className="figure text-2xl">{current.pool}</span>
            {filteredOut > 0 && (
              <span className="text-sm text-muted-foreground">
                {" "}
                — <span className="figure">{filteredOut}</span> filtered out at this step
              </span>
            )}
          </p>
        </div>

        <p className="measure mt-3 text-sm text-muted-foreground">
          The pool sizes are illustrative. What is real is the order: schedule first, eligibility
          second, choice last — by the time an ad is selected, most of the filtering is already done.
        </p>
      </section>

      <section>
        <h3 className="mb-3 text-lg text-foreground">What's inside it</h3>
        <ul className="grid gap-2 sm:grid-cols-2">
          {AD_SERVER_COMPONENTS.map((c) => (
            <li key={c} className="rounded-lg border border-border bg-card p-3 text-muted-foreground">
              {c}
            </li>
          ))}
        </ul>
        <h4 className="mb-2 mt-5 text-foreground">What it has to be plugged into</h4>
        <div className="flex flex-wrap gap-2">
          {AD_SERVER_INTEGRATIONS.map((item) => (
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
        <h3 className="mb-3 text-lg text-foreground">Ad networks: buying a bundle instead of a slot</h3>
        <p className="measure mb-4 text-muted-foreground">
          An <span className="text-foreground">ad network</span> brokers deals between groups of
          publishers and advertisers. Its raw material is unsold, or remnant, inventory — the space a
          publisher's direct sales team could not fill — which the network aggregates into a
          consolidated, typically lower-cost pool of impressions sold on a cost-per-mille (CPM)
          basis, the price for a thousand impressions.
        </p>

        <PlatformProfile id="adnetwork" />

        <div
          className="mt-4 flex flex-wrap gap-2"
          role="group"
          aria-label="Choose a type of ad network"
        >
          {NETWORK_TYPES.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setNetworkType(option.id)}
              aria-pressed={networkType === option.id}
              className={cn(
                "min-h-[2.75rem] rounded-lg border px-4 text-sm transition-colors",
                networkType === option.id
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border text-muted-foreground hover:text-foreground"
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
        <div className="mt-3 rounded-lg border border-border bg-card p-4">
          <p className="text-xs uppercase text-muted-foreground">{network.label} network</p>
          <p className="measure mt-1 text-foreground">{network.example}</p>
          <p className="measure mt-2 text-sm text-muted-foreground">{network.pricing}</p>
        </div>

        <h4 className="mb-2 mt-5 text-foreground">Why an advertiser bothers with a network at all</h4>
        <ul className="grid gap-2 sm:grid-cols-2">
          <li className="rounded-lg border border-border bg-card p-3">
            <span className="block text-foreground">Scale</span>
            <span className="mt-0.5 block text-sm text-muted-foreground">
              Buy across many publishers through one interface, with centralized reporting.
            </span>
          </li>
          <li className="rounded-lg border border-border bg-card p-3">
            <span className="block text-foreground">Time savings</span>
            <span className="mt-0.5 block text-sm text-muted-foreground">
              Set the campaign up once, instead of negotiating an insertion order with each publisher.
            </span>
          </li>
          <li className="rounded-lg border border-border bg-card p-3">
            <span className="block text-foreground">Reach and measurement</span>
            <span className="mt-0.5 block text-sm text-muted-foreground">
              Frequency capping and reach reporting work at the campaign level, across the whole bundle.
            </span>
          </li>
          <li className="rounded-lg border border-border bg-card p-3">
            <span className="block text-foreground">Monetization</span>
            <span className="mt-0.5 block text-sm text-muted-foreground">
              The publisher's side: unsold inventory becomes revenue instead of an empty slot.
            </span>
          </li>
        </ul>

        <h4 className="mb-2 mt-5 text-foreground">Common targeting criteria in a network</h4>
        <ul className="grid gap-1 sm:grid-cols-2">
          {NETWORK_TARGETING.map((t) => (
            <li key={t} className="text-sm text-muted-foreground">
              {t}
            </li>
          ))}
        </ul>

        <p className="measure mt-4 text-muted-foreground">
          A campaign is set up either in the network's own management panel, or tracked through a
          third-party ad server's pixels for consolidated reporting — common when a campaign spans
          several networks. The advertiser sets targeting, budget, and frequency caps; the publisher
          installs the network's tag directly on the page or through its first-party ad server. Once
          live, the advertiser can rotate creatives on the publisher's site through the network's
          panel, without contacting the publisher again.
        </p>

        <h4 className="mb-2 mt-5 text-foreground">What it has to be plugged into</h4>
        <ul className="space-y-2">
          {NETWORK_INTEGRATIONS.map((item) => (
            <li key={item} className="flex gap-3 text-muted-foreground">
              <span aria-hidden="true" className="mt-2 h-1 w-1 shrink-0 rounded-full bg-primary" />
              <span className="measure">{item}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

const lesson: LessonContent = {
  whyThisMatters: (
    <p>
      Someone will eventually hand you two impression counts for the same campaign that do not
      match — one from the publisher, one from the advertiser's own numbers — and expect you to say
      which is right. Knowing that two separate ad servers are each counting a different thing on
      purpose is what keeps that conversation short.
    </p>
  ),
  objectives: [
    "State the four jobs an ad server does: store, select, deliver, and track",
    "Explain the difference between a first-party and a third-party ad server",
    "Walk the seven steps between an ad request and a billed impression",
    "Say what an ad network adds that a single publisher's direct sales team cannot",
  ],
  Body,
  takeaways: [
    "An ad server stores creatives, decides which one to serve, delivers it, and tracks impressions and clicks — and publishers and advertisers each run their own, counting different things.",
    "A single ad call runs seven steps in order — request, compile, filter for eligibility, select, deliver, track, and report — and most of the filtering happens before an ad is ever chosen.",
    "An ad network aggregates unsold inventory across many publishers into one lower-cost pool, trading a publisher's direct-sale price for scale and a simpler buy.",
  ],
  checkYourself: [
    {
      question:
        "A publisher's ad server reports 50,000 impressions for a campaign; the advertiser's third-party server reports 48,600. Which number is wrong?",
      answer: (
        <p>
          Neither is necessarily wrong. The two servers count at different moments and by different
          rules, which is exactly why advertisers run their own third-party server — to verify the
          publisher's reported numbers rather than take them on faith. A small gap is normal; a large
          one is worth investigating.
        </p>
      ),
    },
    {
      question: "Why would an advertiser buy through an ad network instead of going direct to ten small publishers?",
      answer: (
        <p>
          Going direct means ten insertion orders, ten sets of ad tags, and ten separate reports. An
          ad network bundles that unsold inventory into one buy, one panel, and one frequency cap
          across the whole set — at the cost of not choosing exactly which of the ten sites the ad
          lands on.
        </p>
      ),
    },
  ],
};

export default lesson;

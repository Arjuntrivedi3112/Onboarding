import { useState } from "react";

import type { LessonContent } from "@/components/journey/lesson-content";
import { cn } from "@/lib/utils";
import { WATERFALL_TIERS } from "./_shared";

const FLOOR = 1.5;

const DEMAND_PARTNERS = [
  { id: "a", label: "Exchange A", bid: 1.8 },
  { id: "b", label: "Exchange B", bid: 2.0 },
  { id: "c", label: "SSP C", bid: 1.2 },
  { id: "d", label: "Network D", bid: 0.9 },
];

const DEVICE_TIMEOUTS = {
  desktop: { window: "400–800ms", representative: 600 },
  mobile: { window: "800–1,200ms", representative: 1000 },
} as const;

function Body() {
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [implementation, setImplementation] = useState<"client" | "server">("client");
  const [hasRun, setHasRun] = useState(false);

  // Waterfall path: sequential, historical order. Exchange A is ranked first
  // by history and clears the floor, so the chain stops there — Exchange B's
  // higher, real-time bid is never asked for.
  const waterfallWinner = DEMAND_PARTNERS.find((p) => p.bid >= FLOOR) ?? null;

  // Header bidding path: everyone bids at once within the timeout window, and
  // the highest eligible bid wins.
  const eligible = DEMAND_PARTNERS.filter((p) => p.bid >= FLOOR);
  const headerWinner = eligible.length > 0 ? eligible.reduce((a, b) => (b.bid > a.bid ? b : a)) : null;

  const timeout = DEVICE_TIMEOUTS[device];
  const waterfallLatency = 3 * 150; // three sequential tier checks at ~150ms overhead each

  return (
    <div className="space-y-8">
      <div className="measure space-y-4 text-muted-foreground">
        <p>
          Header bidding — also called pre-bidding, advance bidding, or holistic yield management —
          lets a publisher solicit bids from multiple demand sources at the same time, before its ad
          server calls anything else. It emerged to fix two problems: the waterfall's sequential
          logic, which can miss a higher bid sitting further down the chain, and the preferential
          treatment Google's own ad exchange (AdX) got inside its ad server, formerly DoubleClick
          for Publishers and now Google Ad Manager. Non-Google demand was often excluded from
          premium inventory even when it would pay more.
        </p>
        <p>
          The mechanism is a JavaScript snippet — often a wrapper or container provided by SSPs and
          ad exchanges — placed between a page's{" "}
          <code className="rounded bg-secondary px-1 font-mono text-sm text-foreground">&lt;head&gt;</code>{" "}
          tags. When the page loads, that script fires bid requests to every connected demand partner at
          once, collects responses within a timeout, and passes the highest bid to the ad server to
          compete alongside direct deals.
        </p>
      </div>

      <section>
        <h3 className="mb-1 text-lg text-foreground">Try it</h3>
        <p className="measure mb-4 text-sm text-muted-foreground">
          The same four demand partners, the same <span className="figure">$1.50</span> floor, run
          down a sequential waterfall on one side and through a header-bidding wrapper on the other.
          Choose a device, then run the race.
        </p>

        <div className="flex flex-wrap gap-2" role="group" aria-label="Choose a device">
          {(["desktop", "mobile"] as const).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDevice(d)}
              aria-pressed={device === d}
              className={cn(
                "min-h-[2.75rem] rounded-lg border px-4 text-sm capitalize transition-colors",
                device === d
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border text-muted-foreground hover:text-foreground"
              )}
            >
              {d}
            </button>
          ))}
        </div>
        <p className="measure mt-2 text-sm text-muted-foreground">
          Timeout window on {device}: <span className="figure">{timeout.window}</span>, wider on
          mobile because network conditions are less stable.
        </p>

        <button
          type="button"
          onClick={() => setHasRun(true)}
          className="mt-4 min-h-[2.75rem] rounded-lg border border-primary bg-primary/10 px-4 text-sm text-foreground transition-colors"
        >
          Run the race
        </button>

        {hasRun && (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-border bg-card p-4">
              <h4 className="mb-2 text-foreground">Waterfall — sequential</h4>
              <ul className="space-y-1.5">
                {WATERFALL_TIERS.slice(1, 3).map((tier, i) => (
                  <li key={tier.id} className="text-sm text-muted-foreground">
                    Tier {i + 1} check — no direct deal available this call
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-sm text-muted-foreground">
                Latency: <span className="figure">~{waterfallLatency}ms</span> of sequential checks
                before a bid is even accepted.
              </p>
              {waterfallWinner ? (
                <p className="mt-2 text-foreground">
                  Clears at <span className="figure text-2xl">${waterfallWinner.bid.toFixed(2)}</span> —
                  the first partner ranked ahead of the floor, not the highest one available.
                </p>
              ) : (
                <p className="mt-2 text-nobid">No partner in this chain clears the floor.</p>
              )}
            </div>

            <div className="rounded-lg border border-clearing bg-clearing/10 p-4">
              <h4 className="mb-2 text-foreground">Header bidding — parallel</h4>
              <ul className="space-y-1.5">
                {DEMAND_PARTNERS.map((p) => (
                  <li key={p.id} className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>{p.label}</span>
                    <span className={cn("figure", p.bid < FLOOR && "text-nobid")}>
                      ${p.bid.toFixed(2)}
                      {p.bid < FLOOR ? " — below floor" : ""}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-sm text-muted-foreground">
                Latency: one wrapper round trip, bounded by the{" "}
                <span className="figure">{timeout.representative}ms</span> timeout.
              </p>
              {headerWinner && (
                <p className="mt-2 text-foreground">
                  Clears at <span className="figure text-2xl text-clearing">${headerWinner.bid.toFixed(2)}</span> —
                  the true highest bid, because every partner competed at once.
                </p>
              )}
            </div>
          </div>
        )}

        {hasRun && (
          <p className="measure mt-3 text-sm text-muted-foreground">
            Same floor, same four partners — the waterfall settles for the floor price because it
            only asks one partner at a time; header bidding realizes the full{" "}
            <span className="figure">${headerWinner?.bid.toFixed(2)}</span> because every partner
            answers the same request. That gap is exactly what the book means when it says a{" "}
            <span className="figure">$1.50</span> floor can hide a{" "}
            <span className="figure">$2.00</span> real market value.
          </p>
        )}
      </section>

      <section>
        <h3 className="mb-3 text-lg text-foreground">Client-side vs. server-side</h3>
        <p className="measure mb-4 text-sm text-muted-foreground">
          A wrapper still has to run somewhere. Client-side header bidding (CSHB) runs it in the
          browser; server-side header bidding (SSHB) hands the auction to a dedicated server.
        </p>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Choose an implementation">
          {(["client", "server"] as const).map((impl) => (
            <button
              key={impl}
              type="button"
              onClick={() => setImplementation(impl)}
              aria-pressed={implementation === impl}
              className={cn(
                "min-h-[2.75rem] rounded-lg border px-4 text-sm transition-colors",
                implementation === impl
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border text-muted-foreground hover:text-foreground"
              )}
            >
              {impl === "client" ? "Client-side (CSHB)" : "Server-side (SSHB)"}
            </button>
          ))}
        </div>

        <div className="mt-4 rounded-lg border border-border bg-card p-4">
          {implementation === "client" ? (
            <>
              <h4 className="mb-2 text-foreground">Client-side header bidding</h4>
              <p className="measure mb-2 text-sm text-muted-foreground">
                JavaScript in the browser collects bids directly from SSPs and exchanges.
              </p>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>Higher cookie-matching rates, since matching happens in the browser</li>
                <li>Greater control over the wrapper, and more transparency into clearing prices</li>
                <li>Slower page load, and a limit on how many browser requests can go out</li>
              </ul>
            </>
          ) : (
            <>
              <h4 className="mb-2 text-foreground">Server-side header bidding</h4>
              <p className="measure mb-2 text-sm text-muted-foreground">
                Bid requests go to a dedicated server, which runs the auction externally.
              </p>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>Reduced page-load latency, from a single server call</li>
                <li>More bids collected, since server calls face fewer technical limits</li>
                <li>Less control and transparency, and harder cookie matching</li>
              </ul>
            </>
          )}
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-lg text-foreground">Prebid.js</h3>
        <p className="measure text-muted-foreground">
          Prebid.js, at prebid.org, is a free, open-source framework that makes it easier for
          publishers to run these pre-bid auctions without building the wrapper from scratch. Tools
          built on top of it — commonly called a header bidding control center — let a publisher
          manage ad units, change demand partners, and review analytics without touching code.
        </p>
      </section>

      <section>
        <h3 className="mb-3 text-lg text-foreground">Waterfall vs. header bidding</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-border bg-card p-4">
            <h4 className="mb-2 text-foreground">Waterfall</h4>
            <p className="mb-1 text-xs uppercase text-muted-foreground">Benefits</p>
            <ul className="mb-3 space-y-1 text-sm text-muted-foreground">
              <li>Monetizes remnant inventory that would otherwise go unsold</li>
              <li>Simple to implement — just ad network tags in the ad server</li>
            </ul>
            <p className="mb-1 text-xs uppercase text-muted-foreground">Drawbacks</p>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>Lower yield, since ranking runs on historical averages, not live prices</li>
              <li>Latency from each sequential tier, and revenue lost to timeouts</li>
              <li>A separate passback configuration to maintain for every partner</li>
            </ul>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <h4 className="mb-2 text-foreground">Header bidding</h4>
            <p className="mb-1 text-xs uppercase text-muted-foreground">Benefits</p>
            <ul className="mb-3 space-y-1 text-sm text-muted-foreground">
              <li>Higher competition and pricing from a broader pool of buyers</li>
              <li>Better fill rates across both premium and remnant inventory</li>
              <li>
                Real market transparency — a <span className="figure">$1.50</span> floor revealed to
                be worth <span className="figure">$2.00</span>
              </li>
            </ul>
            <p className="mb-1 text-xs uppercase text-muted-foreground">Drawbacks</p>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>Added script latency, most noticeable in client-side setups</li>
              <li>Duplicate bid requests when several header partners see the same impression</li>
              <li>Rendering cost on older hardware and phones, usually negligible elsewhere</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}

const lesson: LessonContent = {
  whyThisMatters: (
    <p>
      When a page feels sluggish, someone will blame "the header bidding wrapper." You need to know
      what trade-off it's actually buying the publisher before you can say whether cutting it is
      worth the yield it would give up.
    </p>
  ),
  objectives: [
    "Explain the two problems header bidding was built to solve",
    "Contrast client-side and server-side header bidding on control, latency, and cookie matching",
    "State typical header-bidding timeout thresholds for desktop and mobile",
  ],
  Body,
  takeaways: [
    "Header bidding asks every demand source to bid at once, from a script placed in the page's head, instead of calling them one after another the way a waterfall does.",
    "It emerged to fix two problems: bids lost to a waterfall's sequential logic, and Google's own ad exchange getting preferential treatment inside its ad server.",
    "Client-side header bidding trades page speed for transparency and stronger cookie matching; server-side trades some of that back for a single, faster server call.",
  ],
  checkYourself: [
    {
      question: "A publisher's floor is $1.50 CPM but header bidding realizes an average of $2.00 CPM. What does that gap actually tell the publisher?",
      answer: (
        <p>
          It reveals the real market value of the inventory — value that a static floor, or a
          sequential waterfall that stops at the first bid above the floor, was leaving on the
          table.
        </p>
      ),
    },
    {
      question: "Which timeout window applies on mobile, and why is it longer than desktop's?",
      answer: (
        <p>
          Roughly <span className="figure">800</span> to <span className="figure">1,200</span>{" "}
          milliseconds on mobile, versus <span className="figure">400</span> to{" "}
          <span className="figure">800</span> on desktop. Mobile connections are less stable, so
          demand partners are given more time to respond before they're timed out of the auction.
        </p>
      ),
    },
  ],
};

export default lesson;

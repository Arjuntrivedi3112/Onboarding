import type { LessonContent } from "@/components/journey/lesson-content";
import { cn } from "@/lib/utils";
import { enumCodec, useShareableState } from "@/hooks/useShareableState";

import { AUCTION_STEP, DIRECT_STEPS, SERVING_STEPS, totalMs, type ServingStep } from "./_shared";

const WIRING_IDS = ["direct", "programmatic", "both-servers"] as const;
const wiringCodec = enumCodec(WIRING_IDS);

/** The extra hop that appears only when the advertiser runs its own ad server. */
const ADVERTISER_HOP: ServingStep = {
  id: 8,
  title: "Redirect to the advertiser's ad server",
  description: "The publisher's markup points at the advertiser's server, which returns the creative",
  detail: (
    <>
      The publisher's ad server does not return the creative itself. It returns the advertiser's
      third-party tag, the browser calls the advertiser's ad server, and that server decides which
      creative to send and logs its own impression. Two systems now count the same event, which is
      exactly the point — and exactly why their numbers rarely match to the unit.
    </>
  ),
  duration: 25,
};

const WIRINGS = [
  {
    id: "direct",
    label: "Direct only",
    blurb:
      "The impression was sold in advance. The publisher's ad server picks from its own booked campaigns and returns the creative.",
    steps: DIRECT_STEPS,
  },
  {
    id: "programmatic",
    label: "Programmatic, with RTB",
    blurb:
      "The impression is auctioned while the page loads. The request reaches a supply-side platform, which asks demand-side platforms to bid, and the highest bidder's ad is served through the ad server.",
    steps: SERVING_STEPS,
  },
  {
    id: "both-servers",
    label: "Publisher plus advertiser server",
    blurb:
      "The auction happens, and the winning advertiser serves its creative from its own ad server, so the browser makes one more hop before anything renders.",
    steps: [...SERVING_STEPS, ADVERTISER_HOP],
  },
] as const;

/** Bids arriving in the auction. The winner and the price are computed, never typed in. */
const BIDS = [
  { dsp: "DSP A, travel advertiser", bid: 4.1 },
  { dsp: "DSP B, retail advertiser", bid: 6.35 },
  { dsp: "DSP C, finance advertiser", bid: 5.8 },
  { dsp: "DSP D, no bid", bid: 0 },
];

const BIDDING = BIDS.filter((entry) => entry.bid > 0);
const WINNING_BID = BIDDING.reduce((best, entry) => (entry.bid > best.bid ? entry : best));

const EXTRA_COMPONENTS = [
  {
    name: "Real-time bidding engine",
    line: "Auctions the impression in milliseconds to the highest bidder.",
  },
  {
    name: "Header bidding manager",
    line: "Lets multiple demand partners bid before the ad server makes its choice, rather than after it.",
  },
  {
    name: "Brand safety and verification tools",
    line: "Protect brands from showing ads on inappropriate or fraudulent content.",
  },
];

function Body() {
  // Shareable via the URL — a link with ?wiring=both-servers reopens this
  // lesson with that wiring already selected, for "look at this example".
  const [wiringId, setWiringId] = useShareableState("wiring", "direct" as const, wiringCodec);
  const wiring = WIRINGS.find((option) => option.id === wiringId) ?? WIRINGS[0];
  const total = totalMs(wiring.steps);
  const baseline = totalMs(DIRECT_STEPS);

  return (
    <div className="space-y-8">
      <div className="measure space-y-4 text-muted-foreground">
        <p>
          Nothing in the previous lesson changes when an impression is sold programmatically. The
          request still fires, the server still decides, the creative still lands, the pixel still
          goes off. One step is inserted in the middle, and that step buys the publisher access to
          every advertiser who did not book in advance.
        </p>
        <p>
          In programmatic environments the ad serving process includes a real-time auction. The ad
          request is sent to a supply-side platform (SSP) — the system a publisher sells inventory
          through. The SSP communicates with demand-side platforms (DSPs) — the systems advertisers
          buy through. Advertisers bid in real time for the impression via real-time bidding (RTB),
          and the highest bidder wins, with their ad served through the ad server.
        </p>
      </div>

      <section>
        <h3 className="mb-1 text-lg text-foreground">Try it</h3>
        <p className="measure mb-4 text-sm text-muted-foreground">
          Replay the same impression under three different wirings. Watch the timeline gain steps
          and the total time grow — the auction and the advertiser redirect are not free, and the
          page is still waiting.
        </p>

        <div className="flex flex-wrap gap-2" role="group" aria-label="Choose how the impression is sold">
          {WIRINGS.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setWiringId(option.id)}
              aria-pressed={wiringId === option.id}
              className={cn(
                "min-h-[2.75rem] rounded-lg border px-4 text-sm transition-colors",
                wiringId === option.id
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border text-muted-foreground hover:text-foreground"
              )}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="mt-4 rounded-lg border border-border bg-card p-5">
          <p className="measure text-sm text-muted-foreground">{wiring.blurb}</p>

          <div className="mt-4 flex flex-wrap gap-6">
            <div>
              <p className="text-xs uppercase text-muted-foreground">Steps</p>
              <p className="figure mt-1 text-lg text-foreground">{wiring.steps.length}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-muted-foreground">Total time</p>
              <p className="mt-1 text-lg text-foreground">
                <span className="figure">{total}</span>ms
              </p>
            </div>
            <div>
              <p className="text-xs uppercase text-muted-foreground">Versus direct</p>
              <p className="mt-1 text-lg text-foreground">
                <span className="figure">
                  {total === baseline ? "0" : `+${total - baseline}`}
                </span>
                ms
              </p>
            </div>
            <div>
              <p className="text-xs uppercase text-muted-foreground">Winning price</p>
              <p className="mt-1 text-lg text-foreground">
                {wiringId === "direct" ? (
                  <span className="text-muted-foreground text-base">No auction ran</span>
                ) : (
                  <>
                    <span className="figure">${WINNING_BID.bid.toFixed(2)}</span>
                    <span className="text-muted-foreground text-base"> CPM</span>
                  </>
                )}
              </p>
            </div>
          </div>

          <ol className="mt-5 space-y-2">
            {wiring.steps.map((step, index) => {
              const isAuction = step.id === AUCTION_STEP.id;
              const isHop = step.id === ADVERTISER_HOP.id;
              const isNew = isAuction || isHop;
              return (
                <li
                  key={step.id}
                  className={cn(
                    "rounded-lg border p-3",
                    isNew ? "border-primary bg-primary/10" : "border-border"
                  )}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs uppercase text-muted-foreground">
                      Step <span className="figure">{index + 1}</span>
                    </span>
                    <span className="text-xs uppercase text-muted-foreground">
                      <span className="figure">{step.duration}</span>ms
                    </span>
                    {isNew && (
                      <span className="text-xs uppercase text-primary">Added by this wiring</span>
                    )}
                  </div>
                  <p className="mt-1 text-foreground">{step.title}</p>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                  {isNew && (
                    <p className="measure mt-2 text-sm text-muted-foreground">{step.detail}</p>
                  )}
                </li>
              );
            })}
          </ol>

          {wiringId !== "direct" && (
            <div className="mt-5 rounded-lg border border-border-strong bg-secondary p-4">
              <p className="text-xs uppercase text-muted-foreground">Bids received in the auction</p>
              <ul className="mt-2 space-y-1">
                {BIDS.map((entry) => (
                  <li key={entry.dsp} className="text-sm">
                    <span
                      className={
                        entry.dsp === WINNING_BID.dsp ? "text-foreground" : "text-muted-foreground"
                      }
                    >
                      {entry.dsp}
                    </span>
                    <span className="text-muted-foreground">
                      {" — "}
                      {entry.bid > 0 ? (
                        <span className="figure">${entry.bid.toFixed(2)}</span>
                      ) : (
                        "declined to bid"
                      )}
                      {entry.dsp === WINNING_BID.dsp ? " — wins" : ""}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="measure mt-2 text-sm text-muted-foreground">
                <span className="figure">{BIDDING.length}</span> of{" "}
                <span className="figure">{BIDS.length}</span> platforms bid, and the highest bid
                takes the impression. The auction step alone costs{" "}
                <span className="figure">{AUCTION_STEP.duration}</span>ms here; in practice it
                completes in roughly <span className="figure">50</span> to{" "}
                <span className="figure">100</span>ms.
              </p>
            </div>
          )}
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-lg text-foreground">Two wirings, side by side</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-foreground">With just a publisher's ad server</p>
            <p className="measure mt-1 text-sm text-muted-foreground">
              The browser asks the publisher's ad server, and the publisher's ad server answers
              with the creative. One system decides, delivers and counts. Reporting is whatever the
              publisher says it is.
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-foreground">With a publisher's and an advertiser's ad server</p>
            <p className="measure mt-1 text-sm text-muted-foreground">
              The publisher's ad server answers with the advertiser's tag instead. The browser makes
              a second call, the advertiser's server returns the creative and logs its own
              impression, and now both parties have independent numbers for the same event.
            </p>
          </div>
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-lg text-foreground">What a programmatic ad server adds</h3>
        <p className="measure mb-3 text-muted-foreground">
          A programmatic environment, or a large-scale publisher's ad server, carries components a
          purely direct-sold server never needs:
        </p>
        <ul className="space-y-2">
          {EXTRA_COMPONENTS.map((component) => (
            <li key={component.name} className="rounded-lg border border-border bg-card p-3">
              <span className="text-foreground">{component.name}</span>
              <span className="mt-0.5 block text-sm text-muted-foreground">{component.line}</span>
            </li>
          ))}
        </ul>
        <p className="measure mt-3 text-sm text-muted-foreground">
          Header bidding is worth noticing now even though it gets its own chapter later. The
          difference it makes is one of order: demand partners bid{" "}
          <span className="text-foreground">before</span> the ad server chooses, rather than being
          consulted after the ad server has already made up its mind.
        </p>
      </section>
    </div>
  );
}

const lesson: LessonContent = {
  whyThisMatters: (
    <p>
      Someone will tell you page load slowed down after a programmatic partner was added, and
      someone else will tell you the advertiser's numbers are lower than the publisher's. Both
      complaints are about extra hops in this chain, and you can only answer them if you know which
      hops exist and what each one costs.
    </p>
  ),
  objectives: [
    "Describe where the auction step sits in the serving chain and who talks to whom in it",
    "Say what changes when the advertiser runs its own ad server as well as the publisher",
    "Name the three components a programmatic ad server adds beyond a direct-sold one",
  ],
  Body,
  takeaways: [
    "Programmatic serving is the same four stages with an auction inserted: the request goes to an SSP, the SSP asks DSPs, advertisers bid in real time, and the highest bidder's ad is served through the ad server.",
    "Every extra hop — the auction, and a redirect to the advertiser's ad server — costs milliseconds the page is spending while it waits.",
    "When both a publisher's and an advertiser's ad server are in the path, two systems independently count the same impression, which is the whole reason advertisers wanted their own server.",
  ],
  checkYourself: [
    {
      question: "The request goes to the SSP, which asks the DSPs. Which of those two is working for the publisher?",
      answer: (
        <p>
          The SSP. Supply is the inventory the publisher has to sell, so the supply-side platform
          represents the publisher. The DSPs represent the advertisers doing the buying, which is
          why they are the ones submitting bids.
        </p>
      ),
    },
    {
      question: "A publisher reports 1.2 million impressions for a campaign and the advertiser's own ad server reports fewer. Does that mean someone is lying?",
      answer: (
        <p>
          Almost never. When the advertiser's ad server is in the path, its count happens one hop
          later than the publisher's — after another network call that some browsers never complete.
          A gap is expected. A large or growing gap is worth investigating, and reconciling the two
          is a routine part of the job.
        </p>
      ),
    },
  ],
};

export default lesson;

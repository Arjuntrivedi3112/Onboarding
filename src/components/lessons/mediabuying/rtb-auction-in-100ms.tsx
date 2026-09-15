import { useEffect, useRef, useState } from "react";

import type { LessonContent } from "@/components/journey/lesson-content";
import { cn } from "@/lib/utils";
import { DEFAULT_BIDS, highestBid } from "./_shared";

interface AuctionStep {
  id: number;
  title: string;
  description: string;
  /** Milliseconds this step costs, illustrative but summing to the book's total. */
  ms: number;
}

/**
 * The book's nine-step RTB flow. The per-step split is illustrative — the
 * book gives 100-150 ms for the whole cycle, not a breakdown — but it sums to
 * exactly 100 here, which is the number worth remembering.
 */
const STEPS: AuctionStep[] = [
  {
    id: 1,
    title: "User visits a webpage",
    description: "An ad slot on the page is empty and waiting to be filled.",
    ms: 10,
  },
  {
    id: 2,
    title: "Ad request reaches the publisher's ad server",
    description: "The page asks the publisher's first-party ad server whether a direct campaign can fill this slot.",
    ms: 5,
  },
  {
    id: 3,
    title: "No direct match — the SSP tag fires",
    description: "With no direct campaign available, the supply-side platform's (SSP) tag triggers.",
    ms: 5,
  },
  {
    id: 4,
    title: "Bid request goes out to the exchanges",
    description: "The SSP sends a bid request, carrying user and page data, to connected ad exchanges.",
    ms: 10,
  },
  {
    id: 5,
    title: "DSPs evaluate and bid",
    description: "Every connected demand-side platform (DSP) checks the request against its campaigns and returns a bid.",
    ms: 25,
  },
  {
    id: 6,
    title: "The exchange picks a winner",
    description: "The exchange runs the auction — often a second-price model — and notifies the winning DSP.",
    ms: 5,
  },
  {
    id: 7,
    title: "Ad markup travels to the browser",
    description: "The winning DSP's ad markup is sent back down the chain to the user's browser.",
    ms: 5,
  },
  {
    id: 8,
    title: "The creative loads",
    description: "The browser retrieves the actual creative file from the DSP's ad server or a content delivery network (CDN).",
    ms: 15,
  },
  {
    id: 9,
    title: "The ad displays, and pixels fire",
    description: "The ad renders in the slot, and tracking pixels log the impression.",
    ms: 20,
  },
];

const TOTAL_MS = STEPS.reduce((sum, s) => sum + s.ms, 0);
const CUMULATIVE = STEPS.reduce<number[]>((acc, s, i) => {
  acc.push((acc[i - 1] ?? 0) + s.ms);
  return acc;
}, []);

/** Which step is active at a given elapsed time, 0-indexed. */
function stepIndexAt(elapsed: number): number {
  for (let i = 0; i < CUMULATIVE.length; i++) {
    if (elapsed < CUMULATIVE[i]) return i;
  }
  return STEPS.length - 1;
}

const BID_STEP_INDEX = 4; // "DSPs evaluate and bid"
const WINNER_STEP_INDEX = 5; // "The exchange picks a winner"

function Body() {
  const [elapsedMs, setElapsedMs] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [respondents, setRespondents] = useState<Record<string, boolean>>(
    () => Object.fromEntries(DEFAULT_BIDS.map((b) => [b.id, true]))
  );
  const rafRef = useRef<number>();

  // requestAnimationFrame against performance.now(), not a fixed-tick timer —
  // it can be cancelled mid-flight on pause, reset, or unmount, and it never
  // drifts the way a setInterval loop does.
  useEffect(() => {
    if (!isPlaying) return;

    const startedAt = performance.now() - elapsedMs;

    const tick = (now: number) => {
      const next = Math.min(now - startedAt, TOTAL_MS);
      setElapsedMs(next);
      if (next >= TOTAL_MS) {
        setIsPlaying(false);
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== undefined) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying]);

  const currentIndex = stepIndexAt(elapsedMs);
  const done = elapsedMs >= TOTAL_MS;
  const bidsShown = currentIndex >= BID_STEP_INDEX;
  const winnerShown = currentIndex >= WINNER_STEP_INDEX;

  const activeBids = DEFAULT_BIDS.filter((b) => respondents[b.id]);
  const winner = activeBids.length > 0 ? highestBid(activeBids) : null;

  const toggle = () => {
    if (done) {
      setElapsedMs(0);
      setIsPlaying(true);
      return;
    }
    setIsPlaying((p) => !p);
  };

  const reset = () => {
    setIsPlaying(false);
    setElapsedMs(0);
  };

  const toggleRespondent = (id: string) => {
    if (isPlaying) return;
    setRespondents((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-8">
      <div className="measure space-y-4 text-muted-foreground">
        <p>
          Real-time bidding (RTB) emerged in the late 2000s to fix a problem with early ad
          networks: publishers connecting to several of them at once ran into latency and
          coordination trouble, and campaigns routinely over-delivered or under-delivered. Supply-
          side platforms (SSPs) — first called network optimizers — and demand-side platforms
          (DSPs) balanced the supply and demand, and ad exchanges took it further with impression-
          level, real-time auctions.
        </p>
        <p>
          RTB runs like a stock exchange for ad impressions. Every time a user loads a page, an
          auction settles which advertiser's creative appears — and the whole thing has to finish
          in about <span className="figure">100</span> milliseconds, faster than the blink of an
          eye.
        </p>
      </div>

      <section>
        <h3 className="mb-1 text-lg text-foreground">Try it</h3>
        <p className="measure mb-4 text-sm text-muted-foreground">
          Play the auction below and watch the nine handoffs happen in real time. Before you start,
          you can switch a DSP off to see what happens when it doesn't respond in time.
        </p>

        <div className="flex flex-wrap gap-2" role="group" aria-label="Choose which DSPs respond to this bid request">
          {DEFAULT_BIDS.map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={() => toggleRespondent(b.id)}
              aria-pressed={respondents[b.id]}
              disabled={isPlaying}
              className={cn(
                "min-h-[2.75rem] rounded-lg border px-3 text-sm transition-colors disabled:opacity-50",
                respondents[b.id]
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border text-muted-foreground hover:text-foreground"
              )}
            >
              {b.dsp} {respondents[b.id] ? "responds" : "times out"}
            </button>
          ))}
        </div>

        <div className="mt-4 flex items-center gap-4">
          <button
            type="button"
            onClick={toggle}
            className="min-h-[2.75rem] rounded-lg border border-primary bg-primary/10 px-4 text-sm text-foreground transition-colors"
          >
            {done ? "Replay the auction" : isPlaying ? "Pause the auction" : "Play the auction"}
          </button>
          <button
            type="button"
            onClick={reset}
            className="min-h-[2.75rem] rounded-lg border border-border px-4 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Reset the auction
          </button>

          <div className="ml-auto flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
            <span className="figure text-foreground">{Math.round(elapsedMs)}</span>
            <span className="text-sm text-muted-foreground">
              of <span className="figure">{TOTAL_MS}</span> ms
            </span>
          </div>
        </div>

        <div className="mt-3 h-2 overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full bg-primary transition-[width]"
            style={{ width: `${(elapsedMs / TOTAL_MS) * 100}%` }}
          />
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="rounded-lg border border-border bg-card p-5">
            <h4 className="mb-3 text-foreground">Auction timeline</h4>
            <ol className="space-y-2">
              {STEPS.map((step, i) => (
                <li
                  key={step.id}
                  className={cn(
                    "rounded-lg border p-3 transition-colors",
                    i === currentIndex && !done
                      ? "border-primary bg-primary/10"
                      : i < currentIndex || done
                        ? "border-border opacity-70"
                        : "border-border opacity-50"
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className={cn("text-sm", i === currentIndex && !done ? "text-primary" : "text-foreground")}>
                      <span className="figure mr-2">{step.id}</span>
                      {step.title}
                    </p>
                    <span className="figure shrink-0 text-sm text-muted-foreground">+{step.ms}ms</span>
                  </div>
                  <p className="measure mt-1 text-sm text-muted-foreground">{step.description}</p>
                </li>
              ))}
            </ol>
          </div>

          <div className="rounded-lg border border-border bg-card p-5">
            <h4 className="mb-3 text-foreground">Live auction</h4>
            {!bidsShown && (
              <p className="text-muted-foreground">Press play — bids arrive at step 5.</p>
            )}
            {bidsShown && (
              <div className="space-y-2">
                {DEFAULT_BIDS.map((b) => {
                  const responded = respondents[b.id];
                  const isWinner = winnerShown && winner?.id === b.id;
                  return (
                    <div
                      key={b.id}
                      className={cn(
                        "flex items-center justify-between rounded-lg border p-3",
                        isWinner
                          ? "border-clearing bg-clearing/10"
                          : responded
                            ? "border-border bg-secondary"
                            : "border-border opacity-50"
                      )}
                    >
                      <div>
                        <p className="text-foreground">{b.dsp}</p>
                        {!responded && <p className="text-sm text-nobid">No response — timed out</p>}
                        {isWinner && <p className="text-sm text-clearing">Winner</p>}
                      </div>
                      {responded && <span className="figure text-lg text-foreground">${b.amount.toFixed(2)}</span>}
                    </div>
                  );
                })}

                {activeBids.length === 0 && (
                  <p className="measure text-sm text-nobid">
                    No DSP responded in time. The exchange has nothing to sell this impression, and
                    the slot goes to the publisher's next demand source or stays empty.
                  </p>
                )}

                {done && activeBids.length > 0 && (
                  <p className="measure mt-3 border-t border-border pt-3 text-sm text-muted-foreground">
                    {winner?.dsp} bid <span className="figure">${winner?.amount.toFixed(2)}</span> and
                    won — but the amount it actually pays is rarely its full bid. The next lesson
                    does that math.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="measure space-y-4 text-muted-foreground">
        <p>
          Real-time bidding is a standardized protocol: advertisers bid on each impression using
          user and contextual data — demographics, device type, geolocation, behavior. It pays only
          for impressions that match a campaign's targeting, and a single platform can reach
          thousands of publishers and billions of daily impressions. It started out monetizing
          remnant inventory and has since spread to premium display, video, mobile, and connected
          TV.
        </p>
      </div>
    </div>
  );
}

const lesson: LessonContent = {
  whyThisMatters: (
    <p>
      The first time a page feels slow, someone will blame "the ad auction." You need to know that
      the auction itself is one of the fastest things happening on that page — and be able to say,
      step by step, what actually took the time instead.
    </p>
  ),
  objectives: [
    "Trace one impression through the nine handoffs of an RTB auction, from page load to fired pixel",
    "State why the entire cycle has to finish in about 100 milliseconds",
    "Explain what happens to a DSP's bid if it doesn't respond before the auction moves on",
  ],
  Body,
  takeaways: [
    "One RTB auction runs the same nine handoffs every time: ad server check, SSP tag, bid request, DSP evaluation, auction, winner notice, ad markup, creative load, and fired pixel.",
    "The book puts the whole cycle at 100 to 150 milliseconds, which is why no human reviews a single bid before it clears.",
    "A DSP that doesn't respond before the exchange moves on simply isn't in the auction — its bid, however competitive, never gets counted.",
  ],
  checkYourself: [
    {
      question: "A DSP's server has a slow night and takes 200 milliseconds to respond to a bid request. What happens to its bid?",
      answer: (
        <p>
          Nothing happens to it, because it never arrives in time. The exchange times it out and
          runs the auction among whichever DSPs did respond. A slow DSP doesn't get a worse
          outcome — it gets no outcome at all for that impression.
        </p>
      ),
    },
    {
      question: "Which step decides who wins the auction, and which step decides what the ad actually looks like?",
      answer: (
        <p>
          Step 6 — the exchange picking the winner — decides who wins. Step 8 — the browser
          retrieving the creative from the DSP's ad server or a content delivery network (CDN) —
          decides what actually renders. Winning and rendering are separate handoffs, and either can
          fail on its own.
        </p>
      ),
    },
  ],
};

export default lesson;

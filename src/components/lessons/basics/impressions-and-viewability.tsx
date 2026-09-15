import { useEffect, useRef, useState } from "react";

import type { LessonContent } from "@/components/journey/lesson-content";
import { cn } from "@/lib/utils";

const HOLD_MS = 1000;

function Body() {
  const [served, setServed] = useState(0);
  const [viewable, setViewable] = useState(0);
  const [inView, setInView] = useState(false);
  const [holding, setHolding] = useState(false);
  const [countedThisLoad, setCountedThisLoad] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const viewableRate = served > 0 ? Math.round((viewable / served) * 100) : 0;

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  function clearHold() {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setHolding(false);
  }

  function loadPage() {
    clearHold();
    setServed((s) => s + 1);
    setInView(false);
    setCountedThisLoad(false);
  }

  function sendBot() {
    clearHold();
    setServed((s) => s + 1);
    setInView(false);
    setCountedThisLoad(false);
  }

  function toggleScroll() {
    if (served === 0) return;
    setInView((prev) => {
      const next = !prev;
      if (next && !countedThisLoad) {
        setHolding(true);
        timerRef.current = setTimeout(() => {
          setViewable((v) => v + 1);
          setCountedThisLoad(true);
          setHolding(false);
          timerRef.current = null;
        }, HOLD_MS);
      } else {
        clearHold();
      }
      return next;
    });
  }

  const adStatus =
    served === 0
      ? "No ad served yet"
      : !inView
        ? "Below the fold — not in view"
        : countedThisLoad
          ? "Viewable — held 1+ second in view"
          : holding
            ? "In view — holding..."
            : "In view";

  return (
    <div className="space-y-8">
      <div className="measure space-y-4 text-muted-foreground">
        <p>
          An <span className="text-foreground">impression</span> — sometimes called an ad view — is
          counted each time a creative is served. That is a lower bar than it sounds: the count fires
          the moment the ad loads, not when a person actually looks at it. Refresh the same page and
          load the same ad again, and a new impression is recorded, even though nothing about what the
          visitor saw has changed.
        </p>
        <p>
          A <span className="text-foreground">viewable impression</span> corrects for that gap. It is
          a metric that checks whether an impression was actually seen by a real human, rather than
          "seen" by a bot or hidden from the user's view entirely — for example, sitting at the bottom
          of a page the visitor never scrolls down to. The standard is set by the Interactive
          Advertising Bureau (IAB) — the trade group whose measurement rules the industry treats as
          default: a display ad counts as viewable once 50% of it has been on screen for 1 or more
          seconds, and a video ad needs 50% on screen for 2 or more seconds.
        </p>
      </div>

      <section>
        <h3 className="mb-1 text-lg text-foreground">Try it</h3>
        <p className="measure mb-4 text-sm text-muted-foreground">
          Send different visitors to the same page and watch two counters move independently. Every
          visitor served the ad adds to the first counter, no matter what happens next. Only a
          visitor who scrolls the ad into view and holds it there for a second adds to the second.
        </p>

        <div className="flex flex-wrap gap-2" role="group" aria-label="Send a visitor to the page">
          <button
            type="button"
            onClick={loadPage}
            className="min-h-[2.75rem] rounded-lg border border-border px-4 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Load the page
          </button>
          <button
            type="button"
            onClick={sendBot}
            className="min-h-[2.75rem] rounded-lg border border-border px-4 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Send a bot to crawl it
          </button>
        </div>

        <div className="mt-4 rounded-lg border border-border bg-card p-5">
          <div className="rounded-lg border border-border bg-secondary p-4">
            <div className="mb-4 h-3 w-32 rounded bg-muted-foreground/20" aria-hidden="true" />
            <div className="space-y-2" aria-hidden="true">
              <div className="h-2.5 w-full rounded bg-muted-foreground/20" />
              <div className="h-2.5 w-11/12 rounded bg-muted-foreground/20" />
              <div className="h-2.5 w-4/5 rounded bg-muted-foreground/20" />
              <div className="h-2.5 w-full rounded bg-muted-foreground/20" />
              <div className="h-2.5 w-3/4 rounded bg-muted-foreground/20" />
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">Ad slot, near the bottom of the page</p>
              <button
                type="button"
                onClick={toggleScroll}
                aria-pressed={inView}
                disabled={served === 0}
                className={cn(
                  "min-h-[2.75rem] rounded-lg border px-4 text-sm transition-colors disabled:opacity-40",
                  inView
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border text-muted-foreground hover:text-foreground"
                )}
              >
                Scroll the ad into view
              </button>
            </div>

            <div
              className={cn(
                "mt-3 flex h-20 items-center justify-center rounded-lg border-2 p-2 text-center transition-colors",
                inView
                  ? "border-primary bg-primary/10"
                  : "border-dashed border-border-strong bg-card"
              )}
            >
              <span className="text-sm text-foreground">{adStatus}</span>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="figure text-2xl text-foreground">{served}</p>
              <p className="text-xs uppercase text-muted-foreground">Served</p>
            </div>
            <div>
              <p className="figure text-2xl text-foreground">{viewable}</p>
              <p className="text-xs uppercase text-muted-foreground">Viewable</p>
            </div>
            <div>
              <p className="figure text-2xl text-foreground">{viewableRate}%</p>
              <p className="text-xs uppercase text-muted-foreground">Viewable rate</p>
            </div>
          </div>

          <p className="measure mt-3 text-sm text-muted-foreground">
            {served === 0
              ? "Load the page to serve the first impression."
              : "Load the page again as many times as you like — each load is a fresh impression, even though it is the identical ad. The bot never scrolls, so it raises the served count and never the viewable one."}
          </p>
        </div>
      </section>

      <div className="measure space-y-4 text-muted-foreground">
        <p>
          The gap between the two counters is not a rounding error. It is the difference between an
          ad that ran and an ad that ever had a chance of doing its job — and it is the number a
          publisher has to defend when an advertiser asks why their reported impressions do not match
          what a viewability tag recorded on the same campaign.
        </p>
      </div>
    </div>
  );
}

const lesson: LessonContent = {
  whyThisMatters: (
    <p>
      A campaign report shows a healthy number of served impressions and a much smaller number of
      viewable ones, and a client wants to know why they paid for ads nobody could have seen.
      Knowing the difference between an impression and a viewable impression is what lets you answer
      that instead of guessing.
    </p>
  ),
  objectives: [
    "Define an impression as an ad served, not an ad seen",
    "Explain why refreshing a page creates a new impression even though the ad hasn't changed",
    "State the IAB's viewability thresholds for display and video ads",
    "Explain why a bot visit and a below-the-fold placement both fail the viewability bar, for different reasons",
  ],
  Body,
  takeaways: [
    "An impression is counted every time a creative is served, whether or not anyone actually saw it, so refreshing a page and reloading the same ad still records a brand new impression.",
    "A viewable impression only counts once the ad was actually visible to a real person, which the IAB defines as 50% of a display ad on screen for at least 1 second, and 50% of a video ad on screen for at least 2 seconds.",
    "The gap between served and viewable impressions comes from two different causes — a placement nobody scrolls to, and traffic from bots that never look at anything — and both leave the served count high while the viewable count stays flat.",
  ],
  checkYourself: [
    {
      question: "A visitor refreshes the page five times without leaving. How many impressions were recorded for that ad?",
      answer: (
        <p>
          Five, on top of whatever the original load recorded. A refresh loads the creative again,
          and an impression is counted each time a creative is served — the fact that it is the same
          ad, on the same page, for the same visitor, does not stop the count.
        </p>
      ),
    },
    {
      question: "Your dashboard shows 40,000 impressions delivered but a viewability vendor reports only 22,000 viewable impressions for the same campaign. Is something broken?",
      answer: (
        <p>
          Not necessarily. A gap this size is common, and the two most likely causes are placements
          low on a page that most visitors never scroll to, and bot traffic that loads pages without
          ever looking at them. Before assuming an error, check where the ad ran and how much of the
          traffic to that placement was flagged as non-human.
        </p>
      ),
    },
    {
      question: "You are about to buy a large amount of inventory from a publisher who reports high served-impression counts but will not share viewability data. What would you ask for before committing the spend?",
      answer: (
        <p>
          Ask for a third-party viewability rate on that inventory, or the placement's typical
          position on the page, before buying in bulk. A publisher with nothing to hide about
          viewability usually shares the number; one who won't may be selling served impressions that
          are mostly below the fold.
        </p>
      ),
    },
  ],
};

export default lesson;

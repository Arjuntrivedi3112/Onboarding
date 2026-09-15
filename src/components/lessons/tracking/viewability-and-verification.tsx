import { useEffect, useState } from "react";

import type { LessonContent } from "@/components/journey/lesson-content";
import { cn } from "@/lib/utils";
import { actionButtonClass, toggleClass } from "./_shared";

/** A fixed mock page: the ad sits well below the fold. */
const PAGE_HEIGHT = 1400;
const VIEWPORT_HEIGHT = 420;
const AD_TOP = 820;
const AD_HEIGHT = 250;
const MAX_SCROLL = PAGE_HEIGHT - VIEWPORT_HEIGHT;

function visiblePercent(scrollTop: number) {
  const viewTop = scrollTop;
  const viewBottom = scrollTop + VIEWPORT_HEIGHT;
  const adBottom = AD_TOP + AD_HEIGHT;
  const overlap = Math.min(viewBottom, adBottom) - Math.max(viewTop, AD_TOP);
  return Math.max(0, Math.min(100, (overlap / AD_HEIGHT) * 100));
}

function Body() {
  const [scrollTop, setScrollTop] = useState(0);
  const [adType, setAdType] = useState<"display" | "video">("display");
  const [botTraffic, setBotTraffic] = useState(false);
  const [unsafeContext, setUnsafeContext] = useState(false);
  const [dwellMs, setDwellMs] = useState(0);

  const percent = visiblePercent(scrollTop);
  const meetsThreshold = percent >= 50;
  const requiredMs = adType === "video" ? 2000 : 1000;

  useEffect(() => {
    if (!meetsThreshold) {
      setDwellMs(0);
      return;
    }
    const start = Date.now();
    const id = window.setInterval(() => {
      setDwellMs(Math.min(requiredMs, Date.now() - start));
    }, 100);
    return () => window.clearInterval(id);
  }, [meetsThreshold, requiredMs, adType]);

  const isViewable = dwellMs >= requiredMs;
  const verdict = botTraffic
    ? "Rejected — bot traffic"
    : unsafeContext
      ? "Rejected — brand-unsafe context"
      : isViewable
        ? "Viewable"
        : "Served, not viewable";

  return (
    <div className="space-y-8">
      <div className="measure space-y-4 text-muted-foreground">
        <p>
          Viewability asks a narrower question than "was this ad served." It asks whether a human
          actually had a chance to see it. An ad can be technically served but never viewed if it
          appeared below the fold and the page was never scrolled that far.
        </p>
        <p>
          Verification platforms exist to answer three separate questions about the same impression:
          was it viewable, was it fraudulent, and was it shown somewhere brand-safe. They check using
          JavaScript tags, tracking pixels, and sometimes server-side validation.
        </p>
      </div>

      <section>
        <h3 className="mb-3 text-lg text-foreground">What a verification platform checks</h3>
        <ol className="space-y-2">
          {[
            "Verification vendor JavaScript runs alongside the ad",
            "The script measures how much of the ad sits inside the viewport, and for how long",
            "It checks the traffic for bots and other fraudulent activity",
            "It reports whether the surrounding page is brand-safe",
          ].map((step, index) => (
            <li key={step} className="flex gap-3 text-muted-foreground">
              <span className="figure mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-secondary text-sm text-foreground">
                {index + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
        <p className="measure mt-4 text-sm text-muted-foreground">
          The IAB (the Interactive Advertising Bureau) sets the geometry threshold most of the
          industry uses: a display ad counts as viewable once 50 percent of its pixels have been in
          the viewport for 1 continuous second. A video ad needs 50 percent visible for 2 continuous
          seconds, since a video is judged on being watched, not merely glimpsed.
        </p>
      </section>

      <section>
        <h3 className="mb-1 text-lg text-foreground">Try it</h3>
        <p className="measure mb-4 text-sm text-muted-foreground">
          Drag the scroll position down until the ad enters the viewport. Once at least half of it
          is visible, a one-second (or two-second, for video) clock starts running underneath it.
          Let go too early and the clock resets to zero — the same way a user scrolling past too
          quickly resets viewability in the real thing.
        </p>

        <div className="flex flex-wrap gap-2" role="group" aria-label="Choose the ad format">
          {(["display", "video"] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setAdType(type)}
              aria-pressed={adType === type}
              className={toggleClass(adType === type)}
            >
              {type === "display" ? "Display ad — needs 1 second" : "Video ad — needs 2 seconds"}
            </button>
          ))}
        </div>

        <label className="mt-4 block">
          <span className="text-xs uppercase text-muted-foreground">Scroll position</span>
          <input
            type="range"
            min={0}
            max={MAX_SCROLL}
            step={10}
            value={scrollTop}
            onChange={(e) => setScrollTop(Number(e.target.value))}
            className="mt-2 min-h-[2.75rem] w-full"
            aria-label="Scroll position on the mock page"
          />
        </label>

        <div
          className="relative mt-3 overflow-hidden rounded-lg border border-border bg-secondary"
          style={{ height: `${VIEWPORT_HEIGHT / 3}px` }}
          aria-hidden="true"
        >
          <div
            className="absolute inset-x-4 rounded-md border border-border-strong bg-card"
            style={{
              top: `${(AD_TOP - scrollTop) / 3}px`,
              height: `${AD_HEIGHT / 3}px`,
            }}
          >
            <p className="p-2 text-xs text-muted-foreground">Ad unit</p>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs uppercase text-muted-foreground">Ad visible</p>
            <p className="figure mt-1 text-2xl text-foreground">{percent.toFixed(0)}%</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs uppercase text-muted-foreground">Dwell time at 50% or more</p>
            <p className="figure mt-1 text-2xl text-foreground">{(dwellMs / 1000).toFixed(1)}s</p>
            <p className="figure mt-1 text-sm text-muted-foreground">needs {(requiredMs / 1000).toFixed(0)}s</p>
          </div>
          <div
            className={cn(
              "rounded-lg border p-4",
              verdict === "Viewable" ? "border-primary bg-primary/10" : "border-border bg-card"
            )}
          >
            <p className="text-xs uppercase text-muted-foreground">Verdict</p>
            <p className="mt-1 text-foreground">{verdict}</p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Verification vendor findings">
          <button
            type="button"
            onClick={() => setBotTraffic((v) => !v)}
            aria-pressed={botTraffic}
            className={toggleClass(botTraffic)}
          >
            Flag this traffic as bots
          </button>
          <button
            type="button"
            onClick={() => setUnsafeContext((v) => !v)}
            aria-pressed={unsafeContext}
            className={toggleClass(unsafeContext)}
          >
            Flag the page as brand-unsafe
          </button>
          <button type="button" onClick={() => setScrollTop(0)} className={actionButtonClass}>
            Scroll back to the top
          </button>
        </div>

        <p className="measure mt-3 text-sm text-muted-foreground">
          Notice that either flag overrides a genuinely viewable impression. Verification is three
          checks, not one — passing the geometry test only means the ad cleared the first of them.
        </p>
      </section>
    </div>
  );
}

const lesson: LessonContent = {
  whyThisMatters: (
    <p>
      An advertiser will point at a viewability rate well under 100 percent and ask what is wrong
      with the campaign. Nothing may be wrong at all — plenty of paid-for, correctly delivered ads
      simply never get scrolled into view, and knowing the difference between served and viewable is
      what lets you answer that calmly.
    </p>
  ),
  objectives: [
    "Define viewability and distinguish it from an impression being served",
    "State the IAB viewability threshold for a display ad and for a video ad",
    "Name the three things a verification platform checks for and how it checks them",
  ],
  Body,
  takeaways: [
    "Viewability asks whether an ad was actually visible to a human, not whether it was served — an ad below the fold that nobody scrolls to is served but never viewed.",
    "The IAB counts a display ad as viewable once 50 percent of its pixels have been in view for 1 continuous second, and a video ad once 50 percent has played for 2 continuous seconds.",
    "A verification platform checks three separate things at once — viewability, bot and fraud activity, and brand safety — using JavaScript tags, tracking pixels, and sometimes server-side validation, and any one of the three can fail an impression that technically rendered fine.",
  ],
  checkYourself: [
    {
      question:
        "A campaign served a healthy number of impressions but its viewability rate is only 40 percent. What does that gap tell you?",
      answer: (
        <p>
          A large share of impressions rendered somewhere the user never scrolled to, or scrolled
          past too quickly to clear the dwell-time threshold. Served counts markup delivery;
          viewable counts a human actually having the chance to see it.
        </p>
      ),
    },
    {
      question:
        "A video ad plays for 1.5 seconds at 60 percent visible before the user navigates away. Does it count as viewable?",
      answer: (
        <p>
          No. Video needs 2 continuous seconds at 50 percent or more visible, and this only reached
          1.5 seconds — clearing the geometry bar is not enough on its own.
        </p>
      ),
    },
    {
      question: "Traffic clears the viewability threshold cleanly. Does verification count it as a viewable impression if it turns out to be bot traffic?",
      answer: (
        <p>
          No. Fraud detection is a separate gate from the geometry check. An impression from a bot
          gets rejected by verification regardless of how well it would have scored on visibility.
        </p>
      ),
    },
  ],
};

export default lesson;

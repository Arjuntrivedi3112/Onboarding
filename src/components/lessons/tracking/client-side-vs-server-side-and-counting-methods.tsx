import { useState } from "react";

import type { LessonContent } from "@/components/journey/lesson-content";
import { cn } from "@/lib/utils";
import { actionButtonClass, toggleClass } from "./_shared";

type CounterKey = "publisherPixel" | "advertiserPixel" | "piggybackPixel" | "requestBased";

const COUNTERS: { key: CounterKey; label: string; note: string }[] = [
  {
    key: "publisherPixel",
    label: "Publisher pixel",
    note: "The publisher's own 1×1 image, embedded directly in the ad markup.",
  },
  {
    key: "advertiserPixel",
    label: "Advertiser pixel",
    note: "The advertiser's 1×1 image, fired by the same markup at the same moment.",
  },
  {
    key: "piggybackPixel",
    label: "Piggybacked verification pixel",
    note: "A third-party vendor's pixel, riding along with the primary two.",
  },
  {
    key: "requestBased",
    label: "Request-based server count",
    note: "Logged the instant the ad server hands out the ad — before any browser renders it.",
  },
];

type Toggle = { id: "adBlocker" | "slowConnection" | "jsError"; label: string };

const TOGGLES: Toggle[] = [
  { id: "adBlocker", label: "Turn on an ad blocker" },
  { id: "slowConnection", label: "Simulate a slow connection" },
  { id: "jsError", label: "Simulate a JavaScript error" },
];

function Body() {
  const [adBlocker, setAdBlocker] = useState(false);
  const [slowConnection, setSlowConnection] = useState(false);
  const [jsError, setJsError] = useState(false);
  const [counts, setCounts] = useState<Record<CounterKey, number>>({
    publisherPixel: 0,
    advertiserPixel: 0,
    piggybackPixel: 0,
    requestBased: 0,
  });

  const deliverAd = () => {
    setCounts((c) => ({
      // An ad blocker strips every image-pixel request before it leaves the browser.
      publisherPixel: c.publisherPixel + (adBlocker ? 0 : 1),
      // The advertiser's tag depends on a small script to fire — a JS error kills it too.
      advertiserPixel: c.advertiserPixel + (adBlocker || jsError ? 0 : 1),
      // The piggybacked pixel is the extra hop: blocked, broken by a script error, or
      // simply the one most likely to be dropped on a slow connection.
      piggybackPixel: c.piggybackPixel + (adBlocker || jsError || slowConnection ? 0 : 1),
      // This counter never depends on the browser at all.
      requestBased: c.requestBased + 1,
    }));
  };

  const reset = () => {
    setCounts({ publisherPixel: 0, advertiserPixel: 0, piggybackPixel: 0, requestBased: 0 });
  };

  const gap = counts.requestBased - counts.publisherPixel;

  return (
    <div className="space-y-8">
      <div className="measure space-y-4 text-muted-foreground">
        <p>
          Every counting mechanism in this section comes down to one question: does the count
          depend on a browser doing something, or not? A pixel needs the browser to load an image.
          A server-to-server call does not need the browser at all. That single difference explains
          which method gets used where, and why two honest counters can still disagree.
        </p>
      </div>

      <section>
        <h3 className="mb-3 text-lg text-foreground">Two ways to track a conversion</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-foreground">Pixel method</p>
            <p className="measure mt-1 text-muted-foreground">
              A conversion pixel fires on the success page, linking the event to the cookie ID set
              by the original click or view. It works well in a browser, and it is easy to
              implement.
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-foreground">Server-side method</p>
            <p className="measure mt-1 text-muted-foreground">
              The cookie ID or click ID is passed through a server-to-server call instead of a
              pixel. It is used precisely where a pixel cannot fire.
            </p>
          </div>
        </div>
        <ul className="mt-3 space-y-2">
          <li className="flex gap-3 text-muted-foreground">
            <span aria-hidden="true" className="mt-2 h-1 w-1 shrink-0 rounded-full bg-primary" />
            <span>
              <span className="text-foreground">Affiliate marketing</span> — an affiliate's site
              and the advertiser's site are different domains with no shared browser context, so a
              server-to-server call keeps the cost-per-action (CPA) attribution accurate.
            </span>
          </li>
          <li className="flex gap-3 text-muted-foreground">
            <span aria-hidden="true" className="mt-2 h-1 w-1 shrink-0 rounded-full bg-primary" />
            <span>
              <span className="text-foreground">Mobile app installs</span> — there is no web page
              to load a pixel on. A software development kit (SDK) inside the app and a postback
              URL confirm the install happened instead.
            </span>
          </li>
        </ul>
      </section>

      <section>
        <h3 className="mb-3 text-lg text-foreground">Additional pixels and piggybacking</h3>
        <div className="measure space-y-3 text-muted-foreground">
          <p>
            An ad's markup often carries more than one pixel. Third-party tracking pixels get
            embedded alongside the primary one so measurement tools and ad verification services can
            report the same impression across their own platforms. This is called{" "}
            <span className="text-foreground">piggybacking</span>: the extra pixels trigger
            simultaneously with the primary ad server's pixel, each vendor logging the identical
            event independently.
          </p>
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-lg text-foreground">JavaScript-based tracking and server-side tracking</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-foreground">JavaScript-based tracking</p>
            <p className="measure mt-1 text-muted-foreground">
              Runs in the browser and loads or triggers pixels as a user interacts with an ad. It
              captures real-time engagement — mouse movement, scroll depth, whether the ad was even
              on screen — which is exactly the raw signal viewability measurement is built on.
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-foreground">Server-side tracking</p>
            <p className="measure mt-1 text-muted-foreground">
              Eliminates dependency on browser events entirely. Instead of firing a pixel, an
              identifier is transmitted straight to the ad server over a backend connection —
              nothing in the user's browser has to succeed for the count to happen.
            </p>
          </div>
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-lg text-foreground">Two ways to count an impression</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-foreground">Dual pixel method</p>
            <p className="measure mt-1 text-muted-foreground">
              The publisher's ad server embeds two 1×1 pixels in the markup — one for the publisher,
              one for the advertiser. Both fire at once, so each side logs the same impression
              independently.
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-foreground">Request-based method</p>
            <p className="measure mt-1 text-muted-foreground">
              Each ad server — publisher's and advertiser's — counts an impression the moment it
              receives the ad request, before anything renders. It creates discrepancies whenever
              the markup fails to render afterward: network latency, browser errors, ad blockers.
            </p>
          </div>
        </div>
      </section>

      <section>
        <h3 className="mb-1 text-lg text-foreground">Try it</h3>
        <p className="measure mb-4 text-sm text-muted-foreground">
          Press Deliver an ad a few times with nothing switched on and all four counters climb
          together. Then flip on one obstacle at a time and press it again. Watch which counters
          stop moving — and which one never stops, because it never waited on your browser in the
          first place.
        </p>

        <div className="flex flex-wrap gap-2" role="group" aria-label="Obstacles between the ad server and the browser">
          {TOGGLES.map((t) => {
            const active = t.id === "adBlocker" ? adBlocker : t.id === "slowConnection" ? slowConnection : jsError;
            const setActive = t.id === "adBlocker" ? setAdBlocker : t.id === "slowConnection" ? setSlowConnection : setJsError;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActive((v) => !v)}
                aria-pressed={active}
                className={toggleClass(active)}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Drive the delivery simulation">
          <button type="button" onClick={deliverAd} className={actionButtonClass}>
            Deliver an ad
          </button>
          <button type="button" onClick={reset} className={actionButtonClass}>
            Reset the simulation
          </button>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {COUNTERS.map((counter) => (
            <div key={counter.key} className="rounded-lg border border-border bg-card p-4">
              <p className="text-xs uppercase text-muted-foreground">{counter.label}</p>
              <p className="figure mt-1 text-2xl text-foreground">{counts[counter.key]}</p>
              <p className="mt-1 text-sm text-muted-foreground">{counter.note}</p>
            </div>
          ))}
        </div>

        <div
          className={cn(
            "mt-4 rounded-lg border p-4",
            gap === 0 ? "border-border bg-card" : "border-primary bg-primary/10"
          )}
        >
          <p className="text-xs uppercase text-muted-foreground">Request-based count minus publisher pixel count</p>
          <p className="figure mt-1 text-2xl text-foreground">{gap}</p>
          <p className="measure mt-1 text-sm text-muted-foreground">
            Every one of those is an ad the server logged that the browser never actually rendered
            for the publisher's own pixel to see. That gap is exactly what a discrepancy report is
            built to catch.
          </p>
        </div>
      </section>
    </div>
  );
}

const lesson: LessonContent = {
  whyThisMatters: (
    <p>
      Someone will hand you two impression counts for the same ad delivery and ask why they don't
      match, when neither side made a mistake. The answer is almost always which of these methods
      each system used to count, and whether the browser was even asked to do anything.
    </p>
  ),
  objectives: [
    "Tell the pixel method of tracking a conversion from the server-side method, and say when each is used",
    "Explain what piggybacking is and why a publisher lets third-party pixels ride along with its own",
    "Describe the difference between the dual pixel method and the request-based method for counting impressions",
    "Say why an ad blocker, a slow connection, or a JavaScript error affects some counters and not others",
  ],
  Body,
  takeaways: [
    "Pixel-based tracking counts an event only when the browser actually loads the pixel; server-side tracking passes an identifier through a backend call instead, which is why it is used for affiliate marketing and mobile app installs where a pixel might never fire.",
    "Piggybacking lets third-party measurement and verification vendors log the same impression as the primary ad server by embedding their own pixel in the same ad markup, firing at the same instant.",
    "The dual pixel method has the publisher and the advertiser each count the same impression independently and simultaneously; the request-based method counts as soon as the ad server receives the request, so it can log an impression the browser never actually rendered.",
  ],
  checkYourself: [
    {
      question:
        "A mobile app install campaign cannot rely on a 1×1 image pixel to confirm an install. What does it use instead, and why?",
      answer: (
        <p>
          Server-side tracking, through an SDK inside the app and a postback URL. There is no web
          page for a pixel to sit on, so the confirmation has to travel over a backend connection
          instead of waiting for a browser to load an image.
        </p>
      ),
    },
    {
      question:
        "An ad blocker strips every pixel from a page, but the publisher's impression count for that pageview is still nonzero in one report. Which counting method produced that number?",
      answer: (
        <p>
          The request-based method. It logs an impression the instant the ad server hands out the
          ad request, before the browser gets a chance to render — or fail to render — anything.
        </p>
      ),
    },
    {
      question:
        "Why would a publisher agree to let a third-party verification vendor's pixel piggyback on its own ad markup rather than refuse it?",
      answer: (
        <p>
          Because advertisers increasingly demand independent proof of viewability, fraud, and brand
          safety that the publisher's own numbers cannot supply on their own. Piggybacking costs the
          publisher one more simultaneous pixel fire and buys the advertiser's trust.
        </p>
      ),
    },
  ],
};

export default lesson;

import { useState } from "react";

import type { LessonContent } from "@/components/journey/lesson-content";
import { cn } from "@/lib/utils";

const IMPRESSION_STEPS = [
  "The ad server returns ad markup containing a 1×1 transparent pixel",
  "The browser renders the ad and loads that pixel",
  "The pixel request arrives at the ad server and is logged",
  "The impression is counted and attributed to the campaign",
];

const CLICK_STEPS = [
  "The user clicks the ad creative",
  "The click is routed through a redirect URL — the click tracker",
  "The click tracker logs the event and records its metadata",
  "The user is redirected onward, and finally to the landing page",
];

type Hop = {
  id: string;
  label: string;
  url: string;
  counts: "publisher" | "advertiser" | "verification" | "none";
  logs: string;
};

const CHAIN: Hop[] = [
  {
    id: "publisher",
    label: "Publisher click tracker",
    url: "pubads.g.doubleclick.net/gampad/clk?id=123456789&iu=/1234/adunit&redir_url=%%click_url%%",
    counts: "publisher",
    logs: "the publisher's ad server records the click",
  },
  {
    id: "advertiser",
    label: "Advertiser click tracker",
    url: "ad.example.org/click?ad_id=123456&redir_url=%%click_url%%",
    counts: "advertiser",
    logs: "the advertiser's ad server records the same click independently",
  },
  {
    id: "verification",
    label: "Ad verification redirect",
    url: "verify.example.net/r?imp=abc123&redir_url=%%click_url%%",
    counts: "verification",
    logs: "an extra hop inserted for verification, which logs but does not bill",
  },
  {
    id: "landing",
    label: "Landing page",
    url: "shop.example.com/spring-sale",
    counts: "none",
    logs: "the user finally arrives, several logged events later",
  },
];

type LogEntry = { id: number; text: string };

function Body() {
  const [impressions, setImpressions] = useState(0);
  const [pubClicks, setPubClicks] = useState(0);
  const [advClicks, setAdvClicks] = useState(0);
  const [hop, setHop] = useState<number | null>(null);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [nextId, setNextId] = useState(1);

  const push = (text: string) => {
    setNextId((n) => n + 1);
    setLog((entries) => [{ id: nextId, text }, ...entries].slice(0, 8));
  };

  const renderAd = (refresh: boolean) => {
    setImpressions((n) => n + 1);
    push(
      refresh
        ? "Page refreshed — the same creative rendered again, so the pixel fired a second time"
        : "GET ad.doubleclick.net/ddm/trackimp/... — the 1×1 pixel loaded, impression logged"
    );
  };

  const clickAd = () => {
    if (hop !== null) return;
    setHop(0);
    setPubClicks((n) => n + 1);
    push("Click routed into the publisher click tracker — publisher logs a click");
  };

  const followRedirect = () => {
    if (hop === null || hop >= CHAIN.length - 1) return;
    const next = hop + 1;
    const target = CHAIN[next];
    if (target.counts === "advertiser") setAdvClicks((n) => n + 1);
    setHop(next);
    push(`Redirected to the ${target.label.toLowerCase()} — ${target.logs}`);
  };

  const reset = () => {
    setImpressions(0);
    setPubClicks(0);
    setAdvClicks(0);
    setHop(null);
    setLog([]);
  };

  const buttonClass =
    "min-h-[2.75rem] rounded-lg border border-border px-4 text-sm text-foreground transition-colors hover:border-border-strong disabled:opacity-50";

  return (
    <div className="space-y-8">
      <div className="measure space-y-4 text-muted-foreground">
        <p>
          How would you assess a campaign without tracking? You could not. Every number anyone
          argues about later — delivery, performance, the invoice — starts as a small number of
          recorded events: an impression, a click, a conversion.
        </p>
        <p>
          This lesson covers the first two. Both are recorded by the same trick: the browser is
          made to fetch something from a server, and the server writes down that it was asked.
        </p>
      </div>

      <section>
        <h3 className="mb-3 text-lg text-foreground">Impression tracking</h3>
        <div className="measure space-y-4 text-muted-foreground">
          <p>
            An impression is recorded each time an ad is displayed to a user. If someone visits a
            page, sees an ad, then refreshes and sees the same ad again, that is{" "}
            <span className="text-foreground">two impressions</span>, not one.
          </p>
          <p>
            The most common way to count them is a 1×1 transparent image — called an impression
            tracker or impression pixel. The ad server returns it inside the ad markup, and the
            browser only loads it when it actually renders the ad. That is the whole point:
            impressions are counted when the ad is shown, not when the ad server selected it.
          </p>
        </div>

        <ol className="mt-4 space-y-2">
          {IMPRESSION_STEPS.map((step, index) => (
            <li key={step} className="flex gap-3 text-muted-foreground">
              <span className="figure mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-secondary text-sm text-foreground">
                {index + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>

        <p className="mt-5 text-xs uppercase text-muted-foreground">
          An impression tracker in Google Ad Manager
        </p>
        <pre className="mt-2 overflow-x-auto rounded-lg border border-border bg-secondary p-3 text-sm text-foreground">
          <code>{`<IMG SRC="https://ad.doubleclick.net/ddm/trackimp/Nxxxx.site-keyname/
Byyyyyyy.n;dc_trk_aid={ad_id};dc_trk_cid={creative_id};ord=[timestamp];
dc_lat=N;dc_rdid=Czzzz;tag_for_child_directed_treatment=I?"
BORDER="0" HEIGHT="1" WIDTH="1" ALT="Advertisement">`}</code>
        </pre>
        <p className="measure mt-3 text-sm text-muted-foreground">
          Read the parameters and you can see what a logged impression knows about itself:{" "}
          <span className="text-foreground">dc_trk_aid</span> the ad,{" "}
          <span className="text-foreground">dc_trk_cid</span> the creative,{" "}
          <span className="text-foreground">ord</span> a timestamp used as a cache buster so the
          browser cannot serve the pixel from cache instead of requesting it again,{" "}
          <span className="text-foreground">dc_rdid</span> a device identifier, and{" "}
          <span className="text-foreground">tag_for_child_directed_treatment</span> a compliance
          flag.
        </p>
      </section>

      <section>
        <h3 className="mb-3 text-lg text-foreground">Click tracking</h3>
        <div className="measure space-y-4 text-muted-foreground">
          <p>
            Clicks are tracked with click trackers — special redirect URLs provided by ad servers.
            When a user clicks an ad, the tracker counts the click and then redirects them to the
            landing page. A click is counted at that moment, which means it counts even if the
            person gives up before the landing page ever loads.
          </p>
          <p>
            Because both the publisher and the advertiser want to count the click themselves, a
            redirect chain is created: the user goes through the publisher's click tracker, then
            the advertiser's click tracker, and finally to the landing page. More hops may be
            inserted for ad verification or for an intermediary ad network.
          </p>
        </div>

        <ol className="mt-4 space-y-2">
          {CLICK_STEPS.map((step, index) => (
            <li key={step} className="flex gap-3 text-muted-foreground">
              <span className="figure mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-secondary text-sm text-foreground">
                {index + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>

        <div className="mt-5 rounded-lg border border-border bg-card p-4">
          <p className="text-xs uppercase text-muted-foreground">Click URL macros</p>
          <p className="measure mt-2 text-muted-foreground">
            A tracker cannot be hardcoded with the address of the next hop, because the next hop
            changes per campaign. Instead the URL carries a macro — a placeholder the ad server
            expands at serve time:
          </p>
          <pre className="mt-3 overflow-x-auto rounded-lg border border-border bg-secondary p-3 text-sm text-foreground">
            <code>{`https://ad.example.org/click?ad_id=123456&redir_url=%%click_url%%`}</code>
          </pre>
          <p className="measure mt-3 text-sm text-muted-foreground">
            The ad server replaces %%click_url%% (you will also see it written %CLICK_URL%) with
            the next URL in the redirect chain. A macro that is never expanded is one of the most
            common tracking bugs in the industry — the chain simply breaks where the placeholder
            still sits.
          </p>
        </div>
      </section>

      <section>
        <h3 className="mb-1 text-lg text-foreground">Try it</h3>
        <p className="measure mb-4 text-sm text-muted-foreground">
          Press Render the ad and watch the 1×1 pixel request reach the ad server. Press Refresh
          the page and watch the impression counter reach two for one creative seen twice. Then
          press Click the ad and follow each redirect, watching the macro expand into the address
          of the next tracker before the landing page ever loads.
        </p>

        <div className="flex flex-wrap gap-2" role="group" aria-label="Drive the tracking simulation">
          <button type="button" onClick={() => renderAd(false)} className={buttonClass}>
            Render the ad
          </button>
          <button type="button" onClick={() => renderAd(true)} className={buttonClass}>
            Refresh the page
          </button>
          <button type="button" onClick={clickAd} disabled={hop !== null} className={buttonClass}>
            Click the ad
          </button>
          <button
            type="button"
            onClick={followRedirect}
            disabled={hop === null || hop >= CHAIN.length - 1}
            className={buttonClass}
          >
            Follow the next redirect
          </button>
          <button type="button" onClick={reset} className={buttonClass}>
            Reset the simulation
          </button>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {[
            { label: "Impressions logged", value: impressions },
            { label: "Clicks logged by publisher", value: pubClicks },
            { label: "Clicks logged by advertiser", value: advClicks },
          ].map((counter) => (
            <div key={counter.label} className="rounded-lg border border-border bg-card p-4">
              <p className="text-xs uppercase text-muted-foreground">{counter.label}</p>
              <p className="figure mt-1 text-2xl text-foreground">{counter.value}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 space-y-2">
          {CHAIN.map((entry, index) => {
            const reached = hop !== null && index <= hop;
            const isCurrent = hop === index;
            const next = CHAIN[index + 1];
            return (
              <div
                key={entry.id}
                className={cn(
                  "rounded-lg border p-4",
                  isCurrent
                    ? "border-primary bg-primary/10"
                    : reached
                      ? "border-border-strong bg-card"
                      : "border-border bg-card"
                )}
              >
                <p className={cn("text-sm", reached ? "text-foreground" : "text-muted-foreground")}>
                  {entry.label}
                  {isCurrent && <span className="text-primary"> — the user is here</span>}
                </p>
                <p className="figure mt-1 break-all text-sm text-muted-foreground">{entry.url}</p>
                {reached && next && (
                  <p className="measure mt-2 text-sm text-muted-foreground">
                    %%click_url%% expands to{" "}
                    <span className="figure break-all text-foreground">{next.url}</span>
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-4 rounded-lg border border-border bg-card p-4">
          <p className="text-xs uppercase text-muted-foreground">Server log</p>
          {log.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">
              Nothing recorded yet. Every number on a report starts here.
            </p>
          ) : (
            <ul className="mt-2 space-y-1.5">
              {log.map((entry) => (
                <li key={entry.id} className="text-sm text-muted-foreground">
                  {entry.text}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <div className="measure space-y-4 text-muted-foreground">
        <p>
          Notice what the simulation makes obvious: the publisher and the advertiser each logged
          the click in their own system, from the same user action. Two systems, two counts of one
          event. That is where the discrepancies in the last lesson of this section come from.
        </p>
      </div>
    </div>
  );
}

const lesson: LessonContent = {
  whyThisMatters: (
    <p>
      In your first week someone will forward a campaign with "impressions look fine, clicks are
      zero" and expect you to know where to look. Both numbers are produced by machinery you can
      inspect — a pixel that must load and a redirect chain that must resolve — and knowing which
      link broke is most of the job.
    </p>
  ),
  objectives: [
    "Explain why a page refresh produces two impressions rather than one",
    "Describe what a 1×1 impression pixel does and when it fires",
    "Trace a click through a publisher tracker, an advertiser tracker and on to the landing page",
    "Say what a click URL macro is and what breaks when it is not expanded",
  ],
  Body,
  takeaways: [
    "An impression is counted when the browser renders the ad and loads the 1×1 impression pixel, not when the ad server selects the ad.",
    "A click is counted by a redirect URL that logs the event first and sends the user onward second, so a click can exist without a landing page visit.",
    "Both sides count the same click because the redirect chain runs through the publisher's tracker and then the advertiser's tracker, each expanding a click URL macro into the next hop.",
  ],
  checkYourself: [
    {
      question:
        "An advertiser insists their ad was served 10,000 times but their report shows far fewer impressions. What does the pixel mechanism suggest?",
      answer: (
        <p>
          Being selected by an ad server and being rendered by a browser are different events. The
          impression pixel only loads when the ad is actually drawn, so anything that stops the
          markup rendering — the user leaving first, a blocked request, a script failure — leaves
          the ad "served" but never counted.
        </p>
      ),
    },
    {
      question:
        "A click tracker URL in a live campaign still contains the literal text %%click_url%%. What will the user experience?",
      answer: (
        <p>
          The macro was never expanded, so the tracker has no valid next hop. The click gets logged
          by that tracker and then the redirect fails or lands somewhere useless. Clicks appear in
          one report and the landing page sees almost no traffic.
        </p>
      ),
    },
    {
      question:
        "Why would anyone deliberately add a fourth redirect to a chain that already works?",
      answer: (
        <p>
          Because someone else needs to see the event too. Ad verification vendors and intermediary
          ad networks are inserted as extra hops so they can log the click independently. Each hop
          costs the user milliseconds and adds one more place the chain can break, which is why
          people push back on long chains.
        </p>
      ),
    },
  ],
};

export default lesson;

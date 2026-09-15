import { useState } from "react";

import type { LessonContent } from "@/components/journey/lesson-content";
import { cn } from "@/lib/utils";

const IMPRESSIONS = 1000;

const GOALS = [
  { id: "signup", label: "Sign up for the service" },
  { id: "purchase", label: "Buy the product" },
  { id: "ebook", label: "Download the ebook" },
] as const;

type GoalId = (typeof GOALS)[number]["id"];
type Stage = "ad" | "landed" | "converted";

function Body() {
  const [clicks, setClicks] = useState(0);
  const [conversions, setConversions] = useState(0);
  const [stage, setStage] = useState<Stage>("ad");
  const [goal, setGoal] = useState<GoalId | null>(null);
  const [siteDown, setSiteDown] = useState(false);
  const [lastClickFailed, setLastClickFailed] = useState(false);

  const ctr = ((clicks / IMPRESSIONS) * 100).toFixed(2);
  const conversionRate = clicks > 0 ? ((conversions / clicks) * 100).toFixed(1) : "0.0";

  function handleAdClick() {
    setClicks((c) => c + 1);
    if (siteDown) {
      setLastClickFailed(true);
      setStage("ad");
    } else {
      setLastClickFailed(false);
      setStage("landed");
    }
  }

  function handleGoal(id: GoalId) {
    setGoal(id);
    setConversions((c) => c + 1);
    setStage("converted");
  }

  function sendAnother() {
    setStage("ad");
    setGoal(null);
    setLastClickFailed(false);
  }

  return (
    <div className="space-y-8">
      <div className="measure space-y-4 text-muted-foreground">
        <p>
          A <span className="text-foreground">click</span> is counted the moment someone clicks an
          ad. It does not require the advertiser's site to actually load — if that site happens to be
          down at that exact second, the click still counts, because the industry counts the action,
          not the outcome.
        </p>
        <p>
          Click-through rate (CTR) measures how often an impression turns into a click: clicks
          divided by impressions. A typical CTR across the industry sits around 0.1% to 0.3%, which
          is a useful gut check whenever a reported number looks too good.
        </p>
        <p>
          When the click succeeds, it lands the visitor on a{" "}
          <span className="text-foreground">landing page</span> — a page built with a single
          objective, unlike the rest of the advertiser's site: driving a conversion. Campaigns route
          traffic there on purpose, especially direct-response and prospecting campaigns whose whole
          point is getting a visitor to act right now.
        </p>
        <p>
          A <span className="text-foreground">conversion</span> is recorded whenever the visitor
          completes whatever goal the advertiser defined — buying a product, signing up for a
          service, downloading a resource such as an ebook, or filling out a contact form. This is
          usually what an advertiser is actually paying for; the click was only ever a means to it.
        </p>
      </div>

      <section>
        <h3 className="mb-1 text-lg text-foreground">Try it</h3>
        <p className="measure mb-4 text-sm text-muted-foreground">
          Walk one visitor from the ad to the conversion. Take the advertiser's site down first, then
          click the ad again — the click still counts even though the page never loads.
        </p>

        <div className="flex flex-wrap gap-2" role="group" aria-label="Simulate a site outage">
          <button
            type="button"
            onClick={() => setSiteDown((d) => !d)}
            aria-pressed={siteDown}
            className={cn(
              "min-h-[2.75rem] rounded-lg border px-4 text-sm transition-colors",
              siteDown
                ? "border-destructive bg-destructive/10 text-foreground"
                : "border-border text-muted-foreground hover:text-foreground"
            )}
          >
            {siteDown ? "Site is down — click to restore it" : "Take the advertiser's site down"}
          </button>
        </div>

        <div className="mt-4 rounded-lg border border-border bg-card p-5">
          {stage === "ad" && (
            <div className="text-center">
              <button
                type="button"
                onClick={handleAdClick}
                className="min-h-[2.75rem] w-full rounded-lg border border-primary bg-primary/10 px-4 text-sm text-foreground transition-colors hover:bg-primary/20 sm:w-64"
              >
                Click the ad
              </button>
              {lastClickFailed && (
                <p className="measure mt-3 text-sm text-muted-foreground">
                  The click was counted. The advertiser's site did not load, so this visitor never
                  reached a landing page — but the click count already moved.
                </p>
              )}
            </div>
          )}

          {stage === "landed" && (
            <div>
              <p className="text-xs uppercase text-muted-foreground">Landing page</p>
              <p className="measure mt-1 text-foreground">
                Choose the goal this visitor completes.
              </p>
              <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Choose a conversion goal">
                {GOALS.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => handleGoal(g.id)}
                    className="min-h-[2.75rem] rounded-lg border border-border px-4 text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {stage === "converted" && (
            <div>
              <p className="text-xs uppercase text-muted-foreground">Conversion recorded</p>
              <p className="measure mt-1 text-foreground">
                {GOALS.find((g) => g.id === goal)?.label ?? "The visitor converted."}
              </p>
              <button
                type="button"
                onClick={sendAnother}
                className="mt-3 min-h-[2.75rem] rounded-lg border border-border px-4 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Send another visitor
              </button>
            </div>
          )}

          <div className="mt-5 grid grid-cols-2 gap-3 text-center sm:grid-cols-4">
            <div>
              <p className="figure text-2xl text-foreground">{IMPRESSIONS.toLocaleString()}</p>
              <p className="text-xs uppercase text-muted-foreground">Impressions</p>
            </div>
            <div>
              <p className="figure text-2xl text-foreground">{clicks}</p>
              <p className="text-xs uppercase text-muted-foreground">Clicks</p>
            </div>
            <div>
              <p className="figure text-2xl text-foreground">{ctr}%</p>
              <p className="text-xs uppercase text-muted-foreground">CTR</p>
            </div>
            <div>
              <p className="figure text-2xl text-foreground">{conversions}</p>
              <p className="text-xs uppercase text-muted-foreground">Conversions</p>
            </div>
          </div>
          <p className="measure mt-3 text-sm text-muted-foreground">
            Conversion rate against clicks so far: <span className="figure">{conversionRate}%</span>.
          </p>
        </div>
      </section>

      <div className="measure space-y-4 text-muted-foreground">
        <p>
          Notice that clicking, landing, and converting are three separate events with three
          separate failure points. A visitor can click and never land; a visitor can land and never
          convert. Each stage needs its own number, because collapsing them into one metric hides
          exactly where a campaign is losing people.
        </p>
      </div>
    </div>
  );
}

const lesson: LessonContent = {
  whyThisMatters: (
    <p>
      A campaign shows a strong number of clicks, and finance wants to know how many of those
      visitors actually did anything worth paying for. Answering that means tracing one person all
      the way from the click through the landing page to the conversion the advertiser is really
      buying.
    </p>
  ),
  objectives: [
    "Define a click as counted the moment someone clicks, independent of whether the advertiser's site ever loads",
    "Explain what makes a landing page different from any other page on the advertiser's site",
    "Name at least three actions that count as a conversion",
    "Calculate click-through rate and conversion rate from a funnel's raw counts",
  ],
  Body,
  takeaways: [
    "A click is counted the instant someone clicks an ad, even if the advertiser's site fails to load right after — the industry counts the action, not whether it succeeded.",
    "A landing page is built around one objective, driving a conversion, which is why campaigns — especially direct-response and prospecting campaigns — route traffic there instead of to a normal page on the site.",
    "A conversion is recorded whenever a visitor completes the advertiser's defined goal, such as a purchase, a sign-up, an ebook download, or a filled-out contact form, and it is usually the event an advertiser is actually paying for.",
  ],
  checkYourself: [
    {
      question: "A campaign report shows 500 clicks but only 300 landing page sessions. What happened to the other 200?",
      answer: (
        <p>
          Some combination of failed loads, slow connections, and visitors who closed the page before
          it rendered. All 500 clicks still count, because a click is recorded on the click itself —
          reaching the landing page is a separate event that can fail independently.
        </p>
      ),
    },
    {
      question: "A visitor fills out a contact form on the landing page but never buys anything. Does that count as a conversion?",
      answer: (
        <p>
          Yes. A conversion is recorded whenever a visitor completes the goal the advertiser defined,
          and filling out a contact form is explicitly one of those goals — alongside a purchase, a
          sign-up, or a resource download. Not every conversion goal is a sale.
        </p>
      ),
    },
    {
      question: "You can only afford to fix tracking on one part of the funnel this quarter. Clicks are already tracked reliably by the ad server. Should you skip building conversion tracking?",
      answer: (
        <p>
          No. Clicks only tell you a person clicked, not that the advertiser got anything of value
          from it. Without conversion tracking, a strong CTR could be spending real budget on traffic
          that never does what the advertiser is actually paying for — which is exactly the number
          worth fixing before scaling the spend, not after.
        </p>
      ),
    },
  ],
};

export default lesson;

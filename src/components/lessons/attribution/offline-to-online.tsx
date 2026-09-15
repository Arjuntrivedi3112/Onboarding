import { useState } from "react";

import type { LessonContent } from "@/components/journey/lesson-content";
import { cn } from "@/lib/utils";

const OFFLINE_CHANNELS = ["Direct mail", "Out-of-home (OOH) and digital out-of-home (DOOH)", "Telemarketing", "TV", "Radio"];

interface OfflineMethod {
  name: string;
  description: string;
  limitation: string;
}

const METHODS: OfflineMethod[] = [
  {
    name: "Vanity URLs",
    description:
      "A short, brand-aligned domain built for one campaign — standalone (newproduct.com), subpage (company1.com/new-product), or shortened (sv.ly/newproduct). Used in OOH, TV, and radio, where nobody can click anything. Either form redirects the visitor to a destination page and appends campaign tracking parameters, which is what actually makes the traffic attributable.",
    limitation:
      "Some people who see the ad search the brand on Google instead of typing the vanity URL directly — and when they do, the conversion is credited to search, not to the offline campaign that actually created the demand.",
  },
  {
    name: "Time-limited attribution windows",
    description:
      "Look at the period after a TV or radio spot airs — say, 30 minutes — for a lift in web traffic and conversions.",
    limitation:
      "Requires deciding the window's duration, isolating traffic that was actually exposed from a stable baseline that would have shown up anyway, and accounting for any other campaign running at the same time. Most AdTech and MarTech platforms only offer attribution-window features for a single channel, so measuring an offline spot this way usually means configuring it manually in an analytics tool, or using a dedicated cross-channel attribution solution.",
  },
  {
    name: "Online surveys",
    description:
      "Simply ask visitors how they found you — on the purchase or sign-up confirmation page, as a discreet sidebar pop-up while they browse (often with a coupon as an incentive), or as an exit pop-up on the way out.",
    limitation:
      "Low-tech, and it can surface things no attribution model captures — at the cost of relying entirely on what people say, rather than what they did.",
  },
  {
    name: "Coupons",
    description:
      "A unique code printed in direct mail or other physical materials. Issue a distinct coupon per campaign, and per client where possible.",
    limitation:
      "Often more accurate than model-based attribution for print media, but it only counts the people who actually redeem the code — everyone who converted without it is invisible to this method.",
  },
  {
    name: "Zip/postal codes",
    description:
      "Collect ZIP codes from online customers and compare them against the areas a direct mail or OOH campaign covered. Most practical for ecommerce businesses, or companies with both online and physical stores, since they already collect billing and shipping details during checkout.",
    limitation:
      "You can't be certain that someone from a given ZIP code actually saw the ad — it's best used alongside other methods for cross-validation, not on its own.",
  },
];

/** Five-minute traffic buckets from air time to two hours after. */
const BASELINE_PER_BUCKET = 8;
const OVERLAP_PER_BUCKET = 6;
const BUCKET_MINUTES = 5;
const BUCKET_COUNT = 24; // covers 0–120 minutes

function spikeVisits(bucketStartMinute: number) {
  return Math.round(40 * Math.exp(-bucketStartMinute / 20));
}

function Body() {
  const [windowMinutes, setWindowMinutes] = useState(30);
  const [overlapOn, setOverlapOn] = useState(false);
  const [showBaseline, setShowBaseline] = useState(true);

  const bucketsInWindow = Math.min(BUCKET_COUNT, Math.round(windowMinutes / BUCKET_MINUTES));

  let rawTotal = 0;
  for (let b = 0; b < bucketsInWindow; b++) {
    const minute = b * BUCKET_MINUTES;
    rawTotal += BASELINE_PER_BUCKET + spikeVisits(minute) + (overlapOn ? OVERLAP_PER_BUCKET : 0);
  }
  const baselineTotal = BASELINE_PER_BUCKET * bucketsInWindow;
  const naiveLift = rawTotal - baselineTotal;
  const trueLift = naiveLift - (overlapOn ? OVERLAP_PER_BUCKET * bucketsInWindow : 0);

  return (
    <div className="space-y-8">
      <div className="measure space-y-4 text-muted-foreground">
        <p>
          Even as advertising keeps shifting toward digital channels, there's still a real need to
          connect offline exposure to online outcomes — did a billboard or a radio spot actually
          lead to a website visit or a purchase? Most measurement tools only ever see what happens
          inside a browser, and none of the channels below touch one directly:
        </p>
        <ul className="flex flex-wrap gap-2">
          {OFFLINE_CHANNELS.map((channel) => (
            <li key={channel} className="rounded-full bg-secondary px-3 py-1 text-sm text-foreground">
              {channel}
            </li>
          ))}
        </ul>
      </div>

      <section>
        <h3 className="mb-3 text-lg text-foreground">Five ways to bridge the gap</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {METHODS.map((method) => (
            <div key={method.name} className="rounded-lg border border-border bg-card p-4">
              <h4 className="mb-2 text-foreground">{method.name}</h4>
              <p className="text-sm text-muted-foreground">{method.description}</p>
              <p className="mt-3 border-t border-border pt-3 text-sm text-muted-foreground">
                {method.limitation}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h3 className="mb-1 text-lg text-foreground">Try it</h3>
        <p className="measure mb-4 text-sm text-muted-foreground">
          A TV spot airs at minute 0. Drag the attribution window and watch the "lift" numbers move
          — even though not one real visit has changed.
        </p>

        <div className="rounded-lg border border-border bg-card p-4">
          <label className="mb-2 block text-sm text-muted-foreground">
            Attribution window: <span className="figure text-foreground">{windowMinutes}</span>{" "}
            minutes after airtime
          </label>
          <div className="flex min-h-[2.75rem] items-center">
            <input
              type="range"
              min={5}
              max={120}
              step={5}
              value={windowMinutes}
              onChange={(e) => setWindowMinutes(Number(e.target.value))}
              className="w-full accent-primary"
              aria-label="Attribution window in minutes"
            />
          </div>

          <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Toggle scenario conditions">
            <button
              type="button"
              onClick={() => setOverlapOn((v) => !v)}
              aria-pressed={overlapOn}
              className={cn(
                "min-h-[2.75rem] rounded-lg border px-4 text-sm transition-colors",
                overlapOn
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border text-muted-foreground hover:text-foreground"
              )}
            >
              {overlapOn ? "A paid search campaign is also live" : "No other campaign is live"}
            </button>
            <button
              type="button"
              onClick={() => setShowBaseline((v) => !v)}
              aria-pressed={showBaseline}
              className={cn(
                "min-h-[2.75rem] rounded-lg border px-4 text-sm transition-colors",
                showBaseline
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border text-muted-foreground hover:text-foreground"
              )}
            >
              {showBaseline ? "Showing unexposed baseline" : "Hide unexposed baseline"}
            </button>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-border bg-secondary p-3">
              <p className="text-sm text-muted-foreground">Raw visits in window</p>
              <p className="figure mt-1 text-lg text-foreground">{rawTotal}</p>
            </div>
            {showBaseline && (
              <div className="rounded-lg border border-border bg-secondary p-3">
                <p className="text-sm text-muted-foreground">Unexposed baseline</p>
                <p className="figure mt-1 text-lg text-foreground">{baselineTotal}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Traffic that would have shown up with no TV spot at all
                </p>
              </div>
            )}
            <div className="rounded-lg border border-border-strong bg-card p-3">
              <p className="text-sm text-muted-foreground">
                {overlapOn ? "Naive lift (what most reports show)" : "Lift over baseline"}
              </p>
              <p className="figure mt-1 text-lg text-foreground">{naiveLift}</p>
            </div>
            {overlapOn && (
              <div className="rounded-lg border border-border bg-secondary p-3 sm:col-span-3">
                <p className="text-sm text-muted-foreground">True TV-driven lift, with paid search isolated out</p>
                <p className="figure mt-1 text-lg text-foreground">{trueLift}</p>
              </div>
            )}
          </div>

          <p className="measure mt-4 text-sm text-muted-foreground">
            {windowMinutes <= 15
              ? "A short window like this risks cutting off real conversions that simply took a little longer to happen — traffic isolation is easy, but you're throwing away genuine lift."
              : windowMinutes >= 90
                ? "A window this long is picking up traffic that was never going to be caused by a 30-minute TV spot in the first place — you're crediting the ad for something baseline traffic would have done anyway."
                : "Somewhere in this range, most of the real lift is captured without pulling in too much unrelated baseline traffic."}
            {overlapOn &&
              " With a paid search campaign live at the same time, the naive lift number is also counting visits that campaign caused on its own — that's campaign overlap, and it's why the true lift figure sits lower."}
          </p>
        </div>
      </section>
    </div>
  );
}

const lesson: LessonContent = {
  whyThisMatters: (
    <p>
      A media buyer will ask you to prove the billboard budget or the TV spot is worth renewing,
      using only the tools that already sit on the website — and the honest answer is that every
      method for doing this substitutes a proxy signal for a browser referrer that was never sent.
      Knowing what each proxy actually measures, and where it breaks, is what keeps you from
      reporting a number with far more confidence than it deserves.
    </p>
  ),
  objectives: [
    "Name at least three offline channels that have no way to send a browser referrer",
    "Explain the mechanic behind at least three of the five offline-to-online methods, and each one's main limitation",
    "Choose a time-limited attribution window and explain the tradeoff between its duration, traffic isolation, and campaign overlap",
  ],
  Body,
  takeaways: [
    "Offline channels — direct mail, OOH and DOOH, telemarketing, TV, and radio — never send a browser referrer, so connecting them to an online outcome always requires a proxy signal instead of a real one.",
    "Vanity URLs, time-limited attribution windows, online surveys, coupons, and ZIP codes are the five common proxies, and each one has a specific blind spot that follows directly from what it substitutes for a referrer.",
    "A time-limited attribution window has to balance three things at once — how long it stays open, isolating exposed traffic from a stable baseline, and accounting for other campaigns running at the same time — and getting any one of them wrong misattributes real results.",
  ],
  checkYourself: [
    {
      question:
        "Using the simulator above, set the window to 120 minutes with the paid search campaign toggled on. Why does the naive lift number overstate what the TV spot actually did?",
      answer: (
        <p>
          Because it is also counting visits the paid search campaign was driving on its own during
          that same two-hour stretch, plus a stretch of baseline traffic in the later minutes that
          the TV spot's decaying influence no longer explains. The true lift figure subtracts the
          paid search contribution back out — the gap between the two numbers is exactly what
          campaign overlap costs you if you ignore it.
        </p>
      ),
    },
    {
      question:
        "A vanity URL campaign reports fewer conversions than expected, but Google Search traffic to the brand name spiked at the same time. What's the likely explanation?",
      answer: (
        <p>
          Some people who saw the offline ad searched the brand on Google instead of typing the
          vanity URL directly — those conversions get credited to search, not to the offline
          campaign that actually created the demand. The vanity URL number understates the
          campaign's real impact for exactly that reason.
        </p>
      ),
    },
    {
      question:
        "Your CFO wants proof the billboard budget is worth it, using only the web analytics tool that already exists — no new engineering. What's the lowest-effort method from this lesson, and what does it cost you in accuracy?",
      answer: (
        <p>
          ZIP or postal codes, most likely — it just needs a field on a form you're probably
          already collecting billing or shipping details through. The cost is that it isn't highly
          accurate on its own: you can't be certain someone from that ZIP code actually saw the
          billboard. It's best treated as one cross-check among several, not as a standalone proof.
        </p>
      ),
    },
  ],
};

export default lesson;

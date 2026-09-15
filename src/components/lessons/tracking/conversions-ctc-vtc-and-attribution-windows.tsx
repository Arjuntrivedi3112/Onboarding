import { useState } from "react";

import type { LessonContent } from "@/components/journey/lesson-content";
import { cn } from "@/lib/utils";

const CONVERSION_STEPS = [
  "The user clicks the ad and is cookied with a unique identifier",
  "The user completes the goal action on the advertiser's site",
  "A conversion pixel fires on the success or thank-you page",
  "The pixel links the conversion back to the original ad click or view",
];

/** The campaign the whole lesson is measured against. */
const CAMPAIGN = { impressions: 1_000_000, clicks: 1_500 };

type Interaction = "click" | "view";

type ConversionEvent = {
  id: string;
  interaction: Interaction;
  /** Days between the ad interaction and the purchase. */
  delayDays: number;
  count: number;
  note: string;
};

const EVENTS: ConversionEvent[] = [
  { id: "a", interaction: "click", delayDays: 0.25, count: 6, note: "Bought within six hours of clicking" },
  { id: "b", interaction: "view", delayDays: 0.5, count: 8, note: "Saw the ad, searched the brand, bought that evening" },
  { id: "c", interaction: "click", delayDays: 3, count: 3, note: "Clicked, thought about it, came back on day three" },
  { id: "d", interaction: "view", delayDays: 9, count: 5, note: "Saw the ad, bought after payday" },
  { id: "e", interaction: "click", delayDays: 12, count: 2, note: "Clicked, waited for a sale" },
  { id: "f", interaction: "view", delayDays: 28, count: 4, note: "Saw the ad a month before buying" },
  { id: "g", interaction: "click", delayDays: 45, count: 3, note: "Clicked, then bought six weeks later" },
];

const WINDOWS = [
  { id: "24h", label: "Set a 24-hour window", short: "24 hours", days: 1 },
  { id: "7d", label: "Set a 7-day window", short: "7 days", days: 7 },
  { id: "30d", label: "Set a 30-day window", short: "30 days", days: 30 },
] as const;

function Body() {
  const [windowId, setWindowId] = useState<(typeof WINDOWS)[number]["id"]>("7d");
  const [countViews, setCountViews] = useState(true);

  const activeWindow = WINDOWS.find((w) => w.id === windowId) ?? WINDOWS[1];

  const isCredited = (event: ConversionEvent) =>
    event.delayDays <= activeWindow.days && (event.interaction === "click" || countViews);

  const ctc = EVENTS.filter((e) => e.interaction === "click" && isCredited(e)).reduce(
    (sum, e) => sum + e.count,
    0
  );
  const vtc = EVENTS.filter((e) => e.interaction === "view" && isCredited(e)).reduce(
    (sum, e) => sum + e.count,
    0
  );
  const total = EVENTS.reduce((sum, e) => sum + e.count, 0);
  const uncredited = total - ctc - vtc;

  const ctcRate = (ctc / CAMPAIGN.clicks) * 100;
  const vtcRate = (vtc / CAMPAIGN.impressions) * 100;

  const toggleClass = (active: boolean) =>
    cn(
      "min-h-[2.75rem] rounded-lg border px-4 text-sm transition-colors",
      active
        ? "border-primary bg-primary/10 text-foreground"
        : "border-border text-muted-foreground hover:text-foreground"
    );

  return (
    <div className="space-y-8">
      <div className="measure space-y-4 text-muted-foreground">
        <p>
          A conversion occurs when a user completes a predefined goal — a purchase, a form
          submission, a download — after interacting with an ad. Impressions and clicks tell you
          the ad was delivered and noticed. A conversion is the only one of the three that tells
          you something the advertiser actually wanted happened.
        </p>
        <p>
          That makes conversion tracking essential for evaluating campaign performance, and
          unavoidable under a cost-per-action (CPA) model — the pricing model where the advertiser
          pays only when a conversion happens. If nobody counts conversions correctly, nobody knows
          what the invoice should say.
        </p>
      </div>

      <section>
        <h3 className="mb-3 text-lg text-foreground">How a conversion gets recorded</h3>
        <ol className="space-y-2">
          {CONVERSION_STEPS.map((step, index) => (
            <li key={step} className="flex gap-3 text-muted-foreground">
              <span className="figure mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-secondary text-sm text-foreground">
                {index + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
        <p className="measure mt-4 text-muted-foreground">
          The link back to the original interaction is the whole trick. The conversion pixel on the
          thank-you page carries the identifier set when the user first met the ad, which is how an
          event on the advertiser's own site becomes credited to a campaign that ran somewhere
          else entirely.
        </p>
      </section>

      <section>
        <h3 className="mb-3 text-lg text-foreground">Two types of conversion</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-foreground">
              Click-through conversion <span className="figure text-sm text-muted-foreground">CTC</span>
            </p>
            <p className="mt-1 text-muted-foreground">
              The user clicks an ad and later converts.
            </p>
            <p className="figure mt-3 text-sm text-foreground">
              CTC rate = (conversions ÷ clicks) × 100
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-foreground">
              View-through conversion <span className="figure text-sm text-muted-foreground">VTC</span>
            </p>
            <p className="mt-1 text-muted-foreground">
              The user sees an ad, does not click it, and converts later anyway.
            </p>
            <p className="figure mt-3 text-sm text-foreground">
              VTC rate = (conversions ÷ impressions) × 100
            </p>
          </div>
        </div>
        <p className="measure mt-4 text-muted-foreground">
          Look closely at the two denominators. A CTC rate is measured against clicks, of which
          there are few. A VTC rate is measured against impressions, of which there are hundreds of
          times more. The two numbers are not comparable, and quoting them side by side without
          saying which is which is one of the easiest ways to mislead someone with a true number.
        </p>
      </section>

      <section>
        <h3 className="mb-3 text-lg text-foreground">Attribution windows</h3>
        <div className="measure space-y-4 text-muted-foreground">
          <p>
            An attribution window is the timeframe in which a conversion can still be credited to
            an ad interaction — commonly anywhere from 24 hours to 30 days. Choosing it is a real
            decision, not a default to accept: too long and the campaign takes credit for purchases
            it had nothing to do with, too short and genuine conversions are thrown away.
          </p>
          <p>
            View-through windows are usually set shorter than click-through windows for exactly
            this reason. A click is evidence of intent. A view is evidence of nothing more than an
            ad having been on screen.
          </p>
        </div>
      </section>

      <section>
        <h3 className="mb-1 text-lg text-foreground">Try it</h3>
        <p className="measure mb-4 text-sm text-muted-foreground">
          Below is one campaign with{" "}
          <span className="figure">{CAMPAIGN.impressions.toLocaleString()}</span> impressions,{" "}
          <span className="figure">{CAMPAIGN.clicks.toLocaleString()}</span> clicks and{" "}
          <span className="figure">{total}</span> purchases that really happened. Change the
          attribution window and watch purchases move between credited and uncredited without a
          single purchase changing. Then stop counting view-through conversions and watch the
          campaign's measured performance collapse, even though the same people bought the same
          things.
        </p>

        <div className="flex flex-wrap gap-2" role="group" aria-label="Choose an attribution window">
          {WINDOWS.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setWindowId(option.id)}
              aria-pressed={windowId === option.id}
              className={toggleClass(windowId === option.id)}
            >
              {option.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setCountViews((v) => !v)}
            aria-pressed={countViews}
            className={toggleClass(countViews)}
          >
            {countViews ? "Stop counting view-through conversions" : "Count view-through conversions"}
          </button>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs uppercase text-muted-foreground">Credited CTC</p>
            <p className="figure mt-1 text-2xl text-foreground">{ctc}</p>
            <p className="figure mt-1 text-sm text-muted-foreground">
              CTC rate {ctcRate.toFixed(2)}%
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs uppercase text-muted-foreground">Credited VTC</p>
            <p className="figure mt-1 text-2xl text-foreground">{vtc}</p>
            <p className="figure mt-1 text-sm text-muted-foreground">
              VTC rate {vtcRate.toFixed(4)}%
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs uppercase text-muted-foreground">Not credited</p>
            <p className="figure mt-1 text-2xl text-foreground">{uncredited}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Purchases the campaign will never be paid for
            </p>
          </div>
        </div>

        <ul className="mt-4 space-y-2">
          {EVENTS.map((event) => {
            const credited = isCredited(event);
            return (
              <li
                key={event.id}
                className={cn(
                  "flex flex-wrap items-baseline gap-x-3 gap-y-1 rounded-lg border p-3",
                  credited ? "border-border-strong bg-card" : "border-border bg-secondary"
                )}
              >
                <span className="figure text-sm text-muted-foreground">
                  day {event.delayDays}
                </span>
                <span className={credited ? "text-foreground" : "text-muted-foreground"}>
                  <span className="figure">{event.count}</span>{" "}
                  {event.interaction === "click" ? "click-through" : "view-through"} —{" "}
                  {event.note}
                </span>
                <span
                  className={cn(
                    "ml-auto text-sm",
                    credited ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  {credited
                    ? "credited"
                    : event.delayDays > activeWindow.days
                      ? `outside the ${activeWindow.short} window`
                      : "view-through not counted"}
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      <div className="measure space-y-4 text-muted-foreground">
        <p>
          Two teams can look at the same campaign, run the same query, and disagree about how many
          conversions it drove — because one counts view-through conversions in a 30-day window and
          the other counts click-through only in 24 hours. Neither is lying. Before you compare two
          conversion numbers, ask what window produced them and whether views are in there.
        </p>
      </div>
    </div>
  );
}

const lesson: LessonContent = {
  whyThisMatters: (
    <p>
      An advertiser will tell you their agency reports three times the conversions your platform
      does, and imply someone is undercounting. Nine times out of ten the two systems are counting
      honestly under different attribution windows, and one of them is including view-through
      conversions. Knowing that turns an accusation back into a configuration question.
    </p>
  ),
  objectives: [
    "Describe how a conversion pixel links a purchase back to an earlier ad click or view",
    "Tell a click-through conversion from a view-through conversion and compute each one's rate",
    "Explain why a VTC rate divides by impressions while a CTC rate divides by clicks",
    "Choose an attribution window and say what gets misattributed or lost at each end",
  ],
  Body,
  takeaways: [
    "A conversion is a completed predefined goal, linked back to the ad by an identifier the conversion pixel carries on the success page.",
    "A click-through conversion follows a click and its rate divides by clicks; a view-through conversion follows an unclicked impression and its rate divides by impressions, so the two rates are never comparable.",
    "The attribution window decides which real purchases count at all — too long misattributes conversions the campaign did not cause, too short discards ones it did.",
  ],
  checkYourself: [
    {
      question:
        "A campaign reports a CTC rate of 0.8% and a VTC rate of 0.003%. Is the view-through side performing badly?",
      answer: (
        <p>
          You cannot tell from those two numbers. They have different denominators — clicks versus
          impressions — and there are usually hundreds of times more impressions than clicks. Compare
          the raw conversion counts, or compare each rate against its own history, never against the
          other.
        </p>
      ),
    },
    {
      question:
        "An advertiser selling a considered purchase — a mattress, a holiday — asks you to shorten the attribution window from 30 days to 24 hours to be conservative. What do you tell them?",
      answer: (
        <p>
          That it will not make the number more honest, only smaller. People researching an expensive
          purchase convert over weeks, so a 24-hour window discards valid conversions and will make
          every campaign look worse than it is. The conservative move is a shorter window on
          view-through conversions specifically, where the evidence of influence is weakest.
        </p>
      ),
    },
  ],
};

export default lesson;

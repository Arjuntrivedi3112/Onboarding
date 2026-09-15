import { useState } from "react";

import type { LessonContent } from "@/components/journey/lesson-content";
import { cn } from "@/lib/utils";

import { DIRECT_STEPS, totalMs } from "./_shared";

/** Which of the book's four stages each step belongs to. */
const STAGE_OF_STEP: Record<number, string> = {
  1: "Stage 1 — ad request initiation",
  2: "Stage 1 — ad request initiation",
  3: "Stage 2 — ad selection logic",
  5: "Stage 2 — ad selection logic",
  6: "Stage 3 — ad delivery",
  7: "Stage 4 — tracking and analytics",
};

const STAGES = [
  {
    name: "Ad request initiation",
    line: "The site or app sends an ad request carrying contextual and technical information: the user's location, device type and browser, the content of the page, and cookie or user ID data for targeting.",
  },
  {
    name: "Ad selection logic",
    line: "The ad server applies business rules and targeting criteria, reviews the available campaigns, applies segmentation filters such as demographics, geography and interests, evaluates campaign goals and priorities, and selects the best-fitting eligible ad.",
  },
  {
    name: "Ad delivery",
    line: "The selected creative — HTML, image or video — is served into the designated ad slot. Media assets may be pulled from a content delivery network, and the ad is displayed within milliseconds.",
  },
  {
    name: "Tracking and analytics",
    line: "The ad server continuously logs impressions, clicks, conversions, viewability and engagement, and compiles the result into reports advertisers and publishers use to optimize performance.",
  },
];

/** The fields a real ad request carries, shown as step 2 fires. */
const REQUEST_FIELDS = [
  { key: "geo", value: "New York, US" },
  { key: "device", value: "desktop, macOS" },
  { key: "browser", value: "Safari 18" },
  { key: "page", value: "/markets/opening-bell" },
  { key: "user_id", value: "cookie present" },
];

/**
 * The placement's booked campaigns. Everything the interaction reports about
 * these — survivors, the winner, the price — is computed from this list.
 */
const CAMPAIGNS = [
  { name: "Running shoes, spring", cpm: 8.5, drop: null },
  { name: "Regional bank, brand", cpm: 12.0, drop: "Flight ended yesterday" },
  { name: "Airline, New York routes", cpm: 11.25, drop: null },
  { name: "Grocery app install", cpm: 6.0, drop: "Targets mobile only" },
  { name: "Streaming service trial", cpm: 9.75, drop: "Daily budget cap reached" },
  { name: "Business school open day", cpm: 7.4, drop: null },
];

const ELIGIBLE = CAMPAIGNS.filter((campaign) => campaign.drop === null);
const WINNER = ELIGIBLE.reduce((best, campaign) => (campaign.cpm > best.cpm ? campaign : best));

function Body() {
  const [done, setDone] = useState(0);
  const total = totalMs(DIRECT_STEPS);
  const elapsed = totalMs(DIRECT_STEPS.slice(0, done));
  const active = done > 0 ? DIRECT_STEPS[done - 1] : null;

  return (
    <div className="space-y-8">
      <div className="measure space-y-4 text-muted-foreground">
        <p>
          The book splits ad serving into four stages. A real request breaks those four into more
          visible steps, but the shape never changes: something asks, the server decides, the
          creative arrives, and the event is written down.
        </p>
        <p>
          This lesson walks the simplest version — a directly sold ad, no auction involved. The
          auction is the next lesson, and it slots into the middle of exactly this chain.
        </p>
      </div>

      <section>
        <h3 className="mb-3 text-lg text-foreground">The four stages</h3>
        <ol className="space-y-3">
          {STAGES.map((stage, index) => (
            <li key={stage.name} className="rounded-lg border border-border bg-card p-4">
              <p className="text-xs uppercase text-muted-foreground">
                Stage <span className="figure">{index + 1}</span>
              </p>
              <p className="mt-1 text-foreground">{stage.name}</p>
              <p className="measure mt-1 text-sm text-muted-foreground">{stage.line}</p>
            </li>
          ))}
        </ol>
      </section>

      <section>
        <h3 className="mb-1 text-lg text-foreground">Try it</h3>
        <p className="measure mb-4 text-sm text-muted-foreground">
          Advance the request one step at a time and watch two things: the payload panel, which
          shows what is actually moving at that moment, and the clock, which adds up the real cost
          of each step. The whole directly sold chain lands in{" "}
          <span className="figure">{total}</span>ms — roughly the length of a blink.
        </p>

        <div className="rounded-lg border border-border bg-card p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase text-muted-foreground">Elapsed</p>
              <p className="mt-1 text-foreground">
                <span className="figure text-lg">{elapsed}</span>
                <span className="text-muted-foreground">
                  {" "}
                  of <span className="figure">{total}</span>ms
                </span>
              </p>
            </div>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Control the ad request">
              <button
                type="button"
                onClick={() => setDone((n) => Math.min(n + 1, DIRECT_STEPS.length))}
                disabled={done === DIRECT_STEPS.length}
                className="min-h-[2.75rem] rounded-lg border border-border bg-primary/10 px-4 text-sm text-foreground transition-colors hover:border-primary disabled:opacity-50"
              >
                Advance one step
              </button>
              <button
                type="button"
                onClick={() => setDone(0)}
                className="min-h-[2.75rem] rounded-lg border border-border px-4 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Reset to the start
              </button>
            </div>
          </div>

          <div
            className="mt-4 h-2 overflow-hidden rounded-full bg-secondary"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={total}
            aria-valuenow={elapsed}
            aria-label="Milliseconds elapsed in the ad request"
          >
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${(elapsed / total) * 100}%` }}
            />
          </div>

          <ol className="mt-5 space-y-2">
            {DIRECT_STEPS.map((step, index) => {
              const isActive = done === index + 1;
              const isComplete = done > index + 1;
              return (
                <li
                  key={step.id}
                  className={cn(
                    "rounded-lg border p-3 transition-colors",
                    isActive
                      ? "border-primary bg-primary/10"
                      : isComplete
                        ? "border-border bg-secondary"
                        : "border-transparent"
                  )}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs uppercase text-muted-foreground">
                      Step <span className="figure">{index + 1}</span>
                    </span>
                    <span className="text-xs uppercase text-muted-foreground">
                      <span className="figure">{step.duration}</span>ms
                    </span>
                    <span className="text-xs uppercase text-muted-foreground">
                      {STAGE_OF_STEP[step.id]}
                    </span>
                  </div>
                  <p
                    className={cn(
                      "mt-1",
                      isActive || isComplete ? "text-foreground" : "text-muted-foreground"
                    )}
                  >
                    {step.title}
                  </p>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                  {isActive && (
                    <p className="measure mt-2 text-sm text-muted-foreground">{step.detail}</p>
                  )}
                </li>
              );
            })}
          </ol>

          <div className="mt-5 rounded-lg border border-border-strong bg-secondary p-4">
            <p className="text-xs uppercase text-muted-foreground">What is moving right now</p>
            {active === null && (
              <p className="measure mt-2 text-sm text-muted-foreground">
                Nothing yet. The slot is empty and the page has not finished loading. Advance one
                step to start the request.
              </p>
            )}
            {active?.id === 1 && (
              <p className="measure mt-2 text-sm text-muted-foreground">
                The page HTML has arrived with an empty slot in it. The ad tag in that slot is
                about to run.
              </p>
            )}
            {active?.id === 2 && (
              <ul className="mt-2 space-y-1">
                {REQUEST_FIELDS.map((field) => (
                  <li key={field.key} className="text-sm">
                    <span className="figure text-muted-foreground">{field.key}</span>
                    <span className="text-muted-foreground"> — </span>
                    <span className="text-foreground">{field.value}</span>
                  </li>
                ))}
              </ul>
            )}
            {active?.id === 3 && (
              <div className="mt-2">
                <ul className="space-y-1">
                  {CAMPAIGNS.map((campaign) => (
                    <li key={campaign.name} className="text-sm">
                      <span
                        className={campaign.drop ? "text-muted-foreground" : "text-foreground"}
                      >
                        {campaign.name}
                      </span>
                      {campaign.drop ? (
                        <span className="text-destructive"> — dropped: {campaign.drop}</span>
                      ) : (
                        <span className="text-muted-foreground">
                          {" "}
                          — eligible at <span className="figure">${campaign.cpm.toFixed(2)}</span>{" "}
                          CPM
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-sm text-muted-foreground">
                  <span className="figure">{ELIGIBLE.length}</span> of{" "}
                  <span className="figure">{CAMPAIGNS.length}</span> campaigns survive the filters.
                </p>
              </div>
            )}
            {active?.id === 5 && (
              <p className="measure mt-2 text-sm text-muted-foreground">
                Highest cost per mille (CPM) — the price of a thousand impressions — among the
                survivors wins:{" "}
                <span className="text-foreground">{WINNER.name}</span> at{" "}
                <span className="figure">${WINNER.cpm.toFixed(2)}</span>.
              </p>
            )}
            {active?.id === 6 && (
              <p className="measure mt-2 break-all text-sm text-muted-foreground">
                Markup returned, pointing at the creative on a content delivery network (CDN) — the
                geographically distributed file host that keeps load times short:{" "}
                <span className="figure text-foreground">
                  https://cdn.adserver.example/creatives/a91f/300x250.jpg
                </span>
              </p>
            )}
            {active?.id === 7 && (
              <p className="measure mt-2 break-all text-sm text-muted-foreground">
                The impression pixel fires:{" "}
                <span className="figure text-foreground">
                  https://adserver.example/imp?cr=a91f&amp;pl=homepage_top&amp;ts=1718
                </span>{" "}
                — a request whose only purpose is to be logged.
              </p>
            )}
          </div>
        </div>
      </section>

      <div className="measure space-y-4 text-muted-foreground">
        <p>
          Two details are worth carrying forward. First, the filtering in stage two is subtractive:
          the server starts from every campaign booked against the placement and removes the ones
          that cannot run. A campaign that "did not deliver" usually lost here, silently, to a
          flight date or a budget cap.
        </p>
        <p>
          Second, the tracking step is a separate network request from the delivery step. The
          creative can render perfectly and the impression still fail to be counted, which is where
          a great many billing disputes begin.
        </p>
      </div>
    </div>
  );
}

const lesson: LessonContent = {
  whyThisMatters: (
    <p>
      When a slot renders blank or a campaign underdelivers, the useful question is never "is the
      ad server broken" — it is "which of these steps did we get past". Being able to name the step
      is the difference between a five-minute answer and a day of guessing.
    </p>
  ),
  objectives: [
    "Name the four stages of ad serving in order and say what each one produces",
    "List the information an ad request carries to the ad server",
    "Explain why a booked campaign can be filtered out before selection ever happens",
    "Distinguish the delivery request from the tracking request and say why that matters",
  ],
  Body,
  takeaways: [
    "Ad serving unfolds in four stages: request initiation, selection logic, delivery, then tracking and analytics.",
    "The ad request itself carries the targeting signal — location, device, browser, page content and any user ID — so everything the server decides is decided from it.",
    "Selection is subtractive: campaigns are removed for targeting, flight dates and budget before the best-fitting one is chosen from what is left.",
  ],
  checkYourself: [
    {
      question: "The advertiser swears their campaign was booked on the placement, yet it never served. Where would you look first?",
      answer: (
        <p>
          Stage two. Being booked on a placement only gets a campaign onto the candidate list. It
          is then filtered on targeting criteria, flight dates and budget caps — so check whether
          the flight was live, whether the budget had already been spent, and whether the
          targeting could ever match the traffic the placement actually receives.
        </p>
      ),
    },
    {
      question: "Why does the creative come from a content delivery network rather than from the ad server itself?",
      answer: (
        <p>
          Because the ad server's job at that point is a decision, not a file transfer. The markup
          it returns is small, and the heavy asset is pulled from a network of servers close to the
          user, which is what keeps delivery inside the milliseconds budget the page can afford.
        </p>
      ),
    },
    {
      question: "Your log shows a delivered creative but no impression. Is that possible?",
      answer: (
        <p>
          Yes, and it is common. Delivery and tracking are separate requests. An ad blocker, a
          user navigating away before the pixel fires, or a failed tracking host all produce a
          rendered ad that nobody counted — which is exactly why advertisers run their own
          measurement, the subject of a later lesson.
        </p>
      ),
    },
  ],
};

export default lesson;

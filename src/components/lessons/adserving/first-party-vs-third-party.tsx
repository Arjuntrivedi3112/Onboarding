import { useState } from "react";

import type { LessonContent } from "@/components/journey/lesson-content";
import { cn } from "@/lib/utils";

type Side = "publisher" | "advertiser";

const SIDE_LABEL: Record<Side, string> = {
  publisher: "Publisher's server",
  advertiser: "Advertiser's server",
};

/** Every duty below comes from the book's side-by-side comparison. */
const DUTIES: Array<{ id: string; duty: string; side: Side; reason: string }> = [
  {
    id: "forecast",
    duty: "Estimate how much homepage traffic comes from New York State, so the sales team can quote a quantity on an insertion order",
    side: "publisher",
    reason:
      "Inventory forecasting by targeting criteria is a first-party job. Only the publisher's server knows what traffic the site will have and how much of it matches a given targeting rule.",
  },
  {
    id: "attribute",
    duty: "Attribute a conversion to the publisher whose impression earned it",
    side: "advertiser",
    reason:
      "A conversion happens on the advertiser's own site, after the user has left the publisher. Only a server that sees the whole campaign across every publisher can assign the credit.",
  },
  {
    id: "verify",
    duty: "Audit and verify the performance numbers before an invoice is paid",
    side: "advertiser",
    reason:
      "Independent verification of publisher reports is why advertisers adopted their own ad servers in the first place.",
  },
  {
    id: "priority",
    duty: "Compare a demand source bidding through RTB against a direct deal, and assign priorities between them",
    side: "publisher",
    reason:
      "The first-party server evaluates the performance of third-party demand sources and direct deals, letting the publisher see which sources buy the most ad space and set priorities accordingly.",
  },
  {
    id: "abtest",
    duty: "Run an A/B test to find out which of two creatives performs better",
    side: "advertiser",
    reason:
      "Creative testing belongs to the buyer. The third-party server is the one system that sees the same creative's results across every site it ran on.",
  },
  {
    id: "thirdpartytag",
    duty: "Accept and traffic a third-party tag supplied by an external ad server or an SSP",
    side: "publisher",
    reason:
      "AdOps teams manage the site's ad slots, which includes handling third-party tags from external ad servers or platforms such as SSPs.",
  },
  {
    id: "billing",
    duty: "Produce billing reports and track earnings against actual fill rates",
    side: "publisher",
    reason:
      "Earnings and fill rate are the publisher's revenue picture. The first-party server manages and forecasts fill rates across multiple advertisers and reports on both.",
  },
  {
    id: "optimize",
    duty: "Use last quarter's results to decide which sites and targeting criteria to buy again",
    side: "advertiser",
    reason:
      "Optimizing future media buys from past data — identifying what worked and what did not — is a third-party server's purpose.",
  },
];

const FIRST_PARTY_POINTS = [
  "Fills the site's ad slots from direct campaigns, RTB auctions and other media-buying processes",
  "Decides which ad to show using the targeting parameters advertisers set up on their campaigns",
  "Forecasts future inventory availability, and campaign performance, from current and historical data",
  "Lets AdOps teams manage ad slots, run multiple direct campaigns and handle third-party tags from external servers or SSPs",
  "Provides billing reports, tracks earnings and actual fill rates, and assigns priority between demand sources",
];

const THIRD_PARTY_POINTS = [
  "Tracks impressions, clicks and conversions for the whole campaign across all publishers in a single system",
  "Measures overall campaign reach while accounting for co-viewership across publishers",
  "Verifies the reports the publishers provide",
  "Calculates return on investment (ROI) and attributes conversions to the appropriate publishers",
  "Optimizes future media buys, identifies what worked, and runs A/B tests between creatives",
];

function Body() {
  const [answers, setAnswers] = useState<Record<string, Side>>({});
  const answered = DUTIES.filter((duty) => answers[duty.id]);
  const correct = answered.filter((duty) => answers[duty.id] === duty.side);

  return (
    <div className="space-y-8">
      <div className="measure space-y-4 text-muted-foreground">
        <p>There are two types of ad server, and the split is by who owns it, not by what it does.</p>
        <p>
          <span className="text-foreground">First-party ad servers</span> are used by publishers to
          manage and optimize their own ad inventory.{" "}
          <span className="text-foreground">Third-party ad servers</span> — also called advertiser
          ad servers — are used by advertisers and agencies to serve, track and measure ads across
          multiple publishers. Both run on similar technology. They fulfill different roles
          depending on whether they serve the needs of publishers or advertisers.
        </p>
      </div>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-border bg-card p-5">
          <p className="text-xs uppercase text-muted-foreground">Used by publishers</p>
          <h3 className="mt-1 text-lg text-foreground">First-party ad server</h3>
          <p className="measure mt-2 text-sm text-muted-foreground">
            Tasked with filling the ad slots on a website by matching ads from direct campaigns,
            real-time bidding auctions and other media-buying processes, then serving those ads and
            reporting on their performance.
          </p>
          <ul className="mt-3 space-y-2">
            {FIRST_PARTY_POINTS.map((point) => (
              <li key={point} className="flex gap-3 text-sm text-muted-foreground">
                <span aria-hidden="true" className="mt-2 h-1 w-1 shrink-0 rounded-full bg-primary" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-lg border border-border bg-card p-5">
          <p className="text-xs uppercase text-muted-foreground">Used by advertisers</p>
          <h3 className="mt-1 text-lg text-foreground">Third-party ad server</h3>
          <p className="measure mt-2 text-sm text-muted-foreground">
            Adopted because advertisers wanted independent reporting for campaigns running across
            multiple publishers and ad networks, rather than trusting each publisher's own count.
          </p>
          <ul className="mt-3 space-y-2">
            {THIRD_PARTY_POINTS.map((point) => (
              <li key={point} className="flex gap-3 text-sm text-muted-foreground">
                <span aria-hidden="true" className="mt-2 h-1 w-1 shrink-0 rounded-full bg-primary" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <div className="measure space-y-4 text-muted-foreground">
        <p>
          One phrase in that second list deserves a gloss.{" "}
          <span className="text-foreground">Co-viewership</span> is the same person being reached on
          more than one publisher. Add up three publishers' impression counts and you get
          impressions, not people — the advertiser's own server is what turns those overlapping
          counts back into a reach figure.
        </p>
      </div>

      <section>
        <h3 className="mb-1 text-lg text-foreground">Try it</h3>
        <p className="measure mb-4 text-sm text-muted-foreground">
          Assign each responsibility to the server that owns it. Answer and the reason appears
          underneath — read the ones you get wrong, because the pattern behind them is the whole
          lesson.
        </p>

        <ul className="space-y-3">
          {DUTIES.map((duty) => {
            const choice = answers[duty.id];
            const isRight = choice === duty.side;
            return (
              <li key={duty.id} className="rounded-lg border border-border bg-card p-4">
                <p className="measure text-foreground">{duty.duty}</p>
                <div
                  className="mt-3 flex flex-wrap gap-2"
                  role="group"
                  aria-label="Choose which ad server owns this responsibility"
                >
                  {(["publisher", "advertiser"] as Side[]).map((side) => (
                    <button
                      key={side}
                      type="button"
                      onClick={() => setAnswers((prev) => ({ ...prev, [duty.id]: side }))}
                      aria-pressed={choice === side}
                      className={cn(
                        "min-h-[2.75rem] rounded-lg border px-4 text-sm transition-colors",
                        choice === side
                          ? "border-primary bg-primary/10 text-foreground"
                          : "border-border text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {SIDE_LABEL[side]}
                    </button>
                  ))}
                </div>
                {choice && (
                  <div className="mt-3">
                    <p
                      className={cn(
                        "text-xs uppercase",
                        isRight ? "text-primary" : "text-destructive"
                      )}
                    >
                      {isRight ? "Correct" : `Not quite — it is the ${SIDE_LABEL[duty.side].toLowerCase()}`}
                    </p>
                    <p className="measure mt-1 text-sm text-muted-foreground">{duty.reason}</p>
                  </div>
                )}
              </li>
            );
          })}
        </ul>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            <span className="figure">{correct.length}</span> right of{" "}
            <span className="figure">{answered.length}</span> answered, out of{" "}
            <span className="figure">{DUTIES.length}</span>.
          </p>
          <button
            type="button"
            onClick={() => setAnswers({})}
            className="min-h-[2.75rem] rounded-lg border border-border px-4 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Clear my answers
          </button>
        </div>
      </section>

      <div className="measure space-y-4 text-muted-foreground">
        <p>
          The shortcut, once you have sorted a few: the publisher's server is organized around a{" "}
          <span className="text-foreground">place</span> — slots, fill rates, what the site will
          have to sell next month. The advertiser's server is organized around a{" "}
          <span className="text-foreground">campaign</span> — one budget, many sites, one set of
          numbers that has to add up at the end.
        </p>
      </div>
    </div>
  );
}

const lesson: LessonContent = {
  whyThisMatters: (
    <p>
      "Ad server" on its own is ambiguous, and the ambiguity costs real time in meetings. Asking
      whose ad server someone means — the publisher's or the advertiser's — resolves most
      discrepancy arguments before they start, because the two systems are counting different
      moments on purpose.
    </p>
  ),
  objectives: [
    "State who owns a first-party ad server and who owns a third-party one",
    "Explain why advertisers adopted independent ad servers at all",
    "Assign a given responsibility — forecasting, attribution, billing verification — to the right server",
  ],
  Body,
  takeaways: [
    "First-party ad servers belong to publishers and fill their slots; third-party ad servers belong to advertisers and measure their campaigns across every publisher at once.",
    "Both types run on similar technology — the difference is whose needs they serve, not what they are built from.",
    "Advertisers adopted their own servers to track a whole campaign in one system, measure reach accounting for co-viewership, and verify what publishers report.",
  ],
  checkYourself: [
    {
      question: "A publisher's sales team wants to promise an advertiser 2 million impressions on the homepage next month. Which server produces that number, and how?",
      answer: (
        <p>
          The publisher's first-party ad server, through inventory forecasting — predicting how much
          inventory will be available in future from current and historical data, filtered by the
          targeting criteria the advertiser wants. The advertiser's server has no way to know what
          traffic a site it does not own is going to get.
        </p>
      ),
    },
    {
      question: "If both servers run on similar technology, why not let the publisher's server do the advertiser's reporting too?",
      answer: (
        <p>
          Because independence is the product. An advertiser running across many publishers needs
          one system that sees every impression on the same terms and can verify each publisher's
          claims. A count produced by the party sending the invoice is not a check on that invoice.
        </p>
      ),
    },
  ],
};

export default lesson;

import { useState } from "react";

import type { LessonContent } from "@/components/journey/lesson-content";
import { cn } from "@/lib/utils";
import { safeDiv, toggleClass } from "./_shared";

const BASE_IMPRESSIONS = 100_000;

type Side = "publisher" | "advertiser";

type Cause = {
  id: string;
  label: string;
  side: Side;
  /** Percent nudge applied to that side's count when active. Negative loses impressions. */
  pct: number;
  group: 1 | 2 | 3;
};

const CAUSES: Cause[] = [
  { id: "adBlocker", label: "Toggle: an ad blocker strips 8% of publisher pixels", side: "publisher", pct: -8, group: 3 },
  { id: "latency", label: "Toggle: 300ms of added latency drops 3% of renders", side: "publisher", pct: -3, group: 3 },
  { id: "macro", label: "Toggle: a click URL macro never expanded, losing 6% of hops", side: "advertiser", pct: -6, group: 1 },
  { id: "timezone", label: "Toggle: a mismatched reporting time zone shifts 4% across midnight", side: "advertiser", pct: 4, group: 2 },
  { id: "countingMethod", label: "Toggle: advertiser counts by request, publisher counts by pixel", side: "advertiser", pct: 7, group: 2 },
];

const CAUSE_GROUPS = [
  {
    title: "Human and implementation errors",
    items: [
      "Incorrect or partial pixel placement",
      "Misconfigured macros or missing cache busters",
      "Differences in campaign start and end dates across systems",
    ],
  },
  {
    title: "Configuration differences",
    items: [
      "Mismatched reporting time zones",
      "Different fraud filters, traffic-validation criteria, or viewability rules",
      "Varying methods for counting impressions — pixel-fired versus server-served",
    ],
  },
  {
    title: "Client-side tracking limitations",
    items: [
      "Poor connectivity or latency preventing a pixel from loading",
      "JavaScript errors or browser restrictions blocking scripts",
      "URL length limitations truncating redirect paths",
      "Creative file size and resource-heavy pages delaying pixel fires",
    ],
  },
];

function Body() {
  const [active, setActive] = useState<Record<string, boolean>>({});

  const toggle = (id: string) => setActive((a) => ({ ...a, [id]: !a[id] }));

  const sideTotal = (side: Side) =>
    Math.round(
      BASE_IMPRESSIONS *
        (1 +
          CAUSES.filter((c) => c.side === side && active[c.id]).reduce((sum, c) => sum + c.pct / 100, 0))
    );

  const publisher = sideTotal("publisher");
  const advertiser = sideTotal("advertiser");
  const discrepancyPct = safeDiv(publisher - advertiser, advertiser) * 100;
  const withinTolerance = Math.abs(discrepancyPct) <= 10;

  return (
    <div className="space-y-8">
      <div className="measure space-y-4 text-muted-foreground">
        <p>
          A discrepancy is a difference in reported metrics between two systems — almost always
          between a publisher's report and an advertiser's report of the same campaign. It is one of
          the most sensitive numbers in AdOps, because it touches billing and because it can look
          like dishonesty when it almost never is: most discrepancies trace back to a technical or
          implementation issue in client-side tracking, not to anyone inflating a number.
        </p>
      </div>

      <section>
        <h3 className="mb-3 text-lg text-foreground">Discrepancy tolerance</h3>
        <p className="measure text-muted-foreground">
          Discrepancy equals the publisher's impressions minus the advertiser's impressions, divided
          by the advertiser's impressions, times 100. The IAB (the Interactive Advertising Bureau)
          recommends tolerating up to 10 percent, measured against the advertiser's number — a 7
          percent gap is acceptable, but 15 percent needs investigation before anyone bills against
          it.
        </p>
      </section>

      <section>
        <h3 className="mb-1 text-lg text-foreground">Try it — build a discrepancy from its causes</h3>
        <p className="measure mb-4 text-sm text-muted-foreground">
          Both sides start counting the same 100,000 impressions and agree exactly. Switch on real
          causes one at a time — drawn from the three categories below — and watch the gap between
          the two reports grow. Stack enough of them and the discrepancy crosses the 10 percent line;
          switch individual causes back off to reconcile it, the same way an AdOps investigation
          would.
        </p>

        <div className="flex flex-wrap gap-2" role="group" aria-label="Toggle discrepancy causes">
          {CAUSES.map((cause) => (
            <button
              key={cause.id}
              type="button"
              onClick={() => toggle(cause.id)}
              aria-pressed={!!active[cause.id]}
              className={toggleClass(!!active[cause.id])}
            >
              {cause.label}
            </button>
          ))}
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="text-xs uppercase text-muted-foreground">Publisher impressions</p>
              <p className="figure mt-1 text-2xl text-foreground">{publisher.toLocaleString()}</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="text-xs uppercase text-muted-foreground">Advertiser impressions</p>
              <p className="figure mt-1 text-2xl text-foreground">{advertiser.toLocaleString()}</p>
            </div>
            <p className="figure col-span-2 text-sm text-muted-foreground">
              (publisher − advertiser) ÷ advertiser × 100
            </p>
          </div>

          <div
            className={cn(
              "flex flex-col justify-center rounded-lg border p-5",
              withinTolerance ? "border-primary bg-primary/10" : "border-destructive bg-destructive/10"
            )}
          >
            <p className="text-xs uppercase text-muted-foreground">Discrepancy</p>
            <p
              className={cn(
                "figure mt-1 text-3xl",
                withinTolerance ? "text-primary" : "text-destructive"
              )}
            >
              {discrepancyPct >= 0 ? "+" : ""}
              {discrepancyPct.toFixed(1)}%
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              {withinTolerance
                ? "Within the IAB-recommended 10% tolerance — the publisher's data is typically accepted for billing."
                : "Outside the IAB-recommended 10% tolerance — this needs investigation and reconciliation before billing."}
            </p>
          </div>
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-lg text-foreground">Common causes</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          {CAUSE_GROUPS.map((group, index) => (
            <div key={group.title} className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center gap-2">
                <span className="figure flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-secondary text-xs text-foreground">
                  {index + 1}
                </span>
                <h4 className="text-foreground">{group.title}</h4>
              </div>
              <ul className="mt-2 space-y-1.5">
                {group.items.map((item) => (
                  <li key={item} className="flex gap-2 text-sm text-muted-foreground">
                    <span aria-hidden="true" className="mt-2 h-1 w-1 shrink-0 rounded-full bg-primary" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-lg text-foreground">Reconciliation</h3>
        <div className="measure space-y-3 text-muted-foreground">
          <p>
            Reconciliation is the process of comparing datasets from multiple systems to resolve a
            reporting inconsistency. In AdOps it is often manual: pull reports from both the
            publisher's and the advertiser's systems, match them by campaign ID, timestamp, and event
            type, and identify exactly where the impression, click, or conversion counts diverge.
          </p>
        </div>
      </section>
    </div>
  );
}

const lesson: LessonContent = {
  whyThisMatters: (
    <p>
      An advertiser will send you two numbers that do not match and ask which one is wrong. Usually
      neither is — the IAB's tolerance rule exists precisely because honest systems disagree by a
      predictable margin, and your job is to know whether the gap in front of you is normal or a real
      problem.
    </p>
  ),
  objectives: [
    "State the discrepancy formula and the IAB's 10 percent tolerance rule",
    "Name at least four concrete causes of a publisher-advertiser discrepancy across the three cause categories",
    "Describe what reconciliation actually involves in practice",
  ],
  Body,
  takeaways: [
    "Discrepancy is (publisher impressions minus advertiser impressions) divided by advertiser impressions, times 100, and the IAB recommends accepting anything up to 10 percent measured against the advertiser's number.",
    "Most discrepancies are not fraud or dishonesty — they trace back to human error, a configuration mismatch, or a client-side tracking limitation like an ad blocker, added latency, or a macro that never expanded.",
    "Reconciliation is the manual work of pulling both systems' reports, matching them by campaign ID, timestamp, and event type, and agreeing which number gets billed.",
  ],
  checkYourself: [
    {
      question: "A campaign shows a 7 percent discrepancy. Does it need investigation before billing?",
      answer: (
        <p>
          No. Seven percent sits inside the IAB's 10 percent tolerance, so the publisher's data is
          typically accepted for billing without further investigation.
        </p>
      ),
    },
    {
      question: "The same campaign later shows a 15 percent discrepancy. What changed from the 7 percent case?",
      answer: (
        <p>
          It crossed the tolerance line. Fifteen percent is outside the IAB-recommended 10 percent,
          which means it now needs investigation and reconciliation before either side's number is
          used for billing.
        </p>
      ),
    },
    {
      question:
        "You stack an ad blocker, a broken macro, and a counting-method mismatch, and the discrepancy crosses 10 percent. Which single cause would you investigate first, and why?",
      answer: (
        <p>
          The broken macro. It is a genuine implementation bug that a fix closes permanently, while
          the ad blocker and the counting-method mismatch are closer to expected, structural
          differences between systems that may never fully disappear. Fix what is actually broken
          before treating the rest as tolerance to live with.
        </p>
      ),
    },
  ],
};

export default lesson;

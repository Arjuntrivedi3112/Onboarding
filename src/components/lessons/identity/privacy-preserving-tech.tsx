import { useState } from "react";

import type { LessonContent } from "@/components/journey/lesson-content";
import { toggleClass } from "./_shared";

const SANDBOX_BENEFITS = [
  "Advertisers can better reach users likely to be interested in their products or services",
  "Publishers can combine interest data with contextual information to more effectively monetize content",
  "Even platforms with non-commercial or hard-to-monetize content can generate revenue from relevant ads",
];

const CLEAN_ROOM_USE_CASES = ["Targeted advertising", "Frequency capping", "Campaign measurement", "Attribution analysis"];
const CLEAN_ROOM_EXAMPLES = ["Google Ads Data Hub", "Amazon Marketing Cloud", "Snowflake Clean Room"];
const CLEAN_ROOM_ALTERNATIVES = ["Universal IDs", "Google's Privacy Sandbox", "Contextual targeting", "Crypto identities"];

const ADVERTISER_LIST_SIZE = 50_000;
const PUBLISHER_LIST_SIZE = 2_000_000;
const MATCHED_COUNT = 18_400;

function Body() {
  const [matched, setMatched] = useState(false);
  const [exportAttempted, setExportAttempted] = useState(false);

  return (
    <div className="space-y-8">
      <div className="measure space-y-4 text-muted-foreground">
        <p>
          As third-party cookies decline, two answers have emerged to the same problem: how does
          advertising keep working without individual, cross-site tracking? Google's Privacy Sandbox
          answers it on-device, inside the browser. Data clean rooms answer it between companies,
          inside a sealed environment.
        </p>
      </div>

      <section>
        <h3 className="mb-3 text-lg text-foreground">Privacy Sandbox</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-foreground">Topics API</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Assigns a user general interest categories — "Fitness," "Technology" — based on recent
              browsing behavior. Instead of tracking one individual, the browser shares a small,
              rotating set of these topics with the site: three per site visit. This is
              interest-based advertising, which is different from contextual advertising: contextual
              targets the content on the page in front of the user right now, while Topics targets the
              user's own recent interests wherever they go next.
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-foreground">Attribution Reporting API</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Measures whether an ad led to a conversion without cross-site tracking, using
              aggregated data with statistical noise added on purpose, so no single user's journey
              can be reconstructed from the report.
            </p>
          </div>
        </div>
        <p className="measure mt-4 text-muted-foreground">This benefits more than one side of the market:</p>
        <ul className="mt-2 space-y-2">
          {SANDBOX_BENEFITS.map((benefit) => (
            <li key={benefit} className="flex gap-3 text-muted-foreground">
              <span aria-hidden="true" className="mt-2 h-1 w-1 shrink-0 rounded-full bg-primary" />
              <span>{benefit}</span>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3 className="mb-3 text-lg text-foreground">Data clean rooms</h3>
        <p className="measure text-muted-foreground">
          A data clean room is software that lets brands and advertisers run targeted campaigns,
          apply frequency capping, and measure and attribute performance, all in a privacy-friendly
          way. Companies upload their first-party data and compare it against aggregated datasets
          from other participating organizations — matching happens without exposing personally
          identifiable information (PII), and no user-level data ever leaves the room. A clean room
          extends what a customer data platform (CDP) already does: a CDP collects and manages
          first-party, user-level data, while a clean room shifts the focus to anonymized, aggregated
          matching instead.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-sm text-foreground">Use cases</p>
            <ul className="mt-2 space-y-1">
              {CLEAN_ROOM_USE_CASES.map((item) => (
                <li key={item} className="text-sm text-muted-foreground">
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-sm text-foreground">Examples</p>
            <ul className="mt-2 space-y-1">
              {CLEAN_ROOM_EXAMPLES.map((item) => (
                <li key={item} className="text-sm text-muted-foreground">
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-sm text-foreground">Alternatives to a clean room</p>
            <ul className="mt-2 space-y-1">
              {CLEAN_ROOM_ALTERNATIVES.map((item) => (
                <li key={item} className="text-sm text-muted-foreground">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section>
        <h3 className="mb-1 text-lg text-foreground">Try it</h3>
        <p className="measure mb-4 text-sm text-muted-foreground">
          Load an advertiser's customer list and a publisher's audience list into a clean room, then
          try to get individual rows back out of it.
        </p>

        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setMatched(true)} className={toggleClass(matched)}>
            Match lists in the clean room
          </button>
          <button
            type="button"
            onClick={() => setExportAttempted(true)}
            disabled={!matched}
            className={toggleClass(exportAttempted)}
          >
            Export matched user rows
          </button>
          <button
            type="button"
            onClick={() => {
              setMatched(false);
              setExportAttempted(false);
            }}
            className={toggleClass(false)}
          >
            Reset
          </button>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs uppercase text-muted-foreground">Advertiser list</p>
            <p className="figure mt-1 text-foreground">{ADVERTISER_LIST_SIZE.toLocaleString()} hashed emails</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs uppercase text-muted-foreground">Publisher list</p>
            <p className="figure mt-1 text-foreground">{PUBLISHER_LIST_SIZE.toLocaleString()} audience profiles</p>
          </div>
        </div>

        {matched && (
          <div className="mt-3 rounded-lg border border-border-strong bg-card p-4">
            <p className="text-xs uppercase text-muted-foreground">Result released from the clean room</p>
            <p className="figure mt-1 text-2xl text-foreground">{MATCHED_COUNT.toLocaleString()} matched users</p>
            <p className="mt-1 text-sm text-muted-foreground">
              An aggregate overlap count, usable for targeting or measurement. No individual row is
              in this result.
            </p>
          </div>
        )}

        {exportAttempted && (
          <div className="mt-3 rounded-lg border border-border bg-secondary p-4">
            <p className="text-foreground">Export refused</p>
            <p className="mt-1 text-sm text-muted-foreground">
              A clean room releases aggregated results only. No user-level row — no email, no
              cookie ID, no name — ever leaves it, no matter who asks.
            </p>
          </div>
        )}
      </section>

      <div className="measure space-y-4 text-muted-foreground">
        <p>
          Universal IDs, Privacy Sandbox, contextual targeting, and clean rooms are competing — and
          sometimes complementary — answers to the same question: how does advertising keep working
          once individual, cross-site tracking is gone.
        </p>
      </div>
    </div>
  );
}

const lesson: LessonContent = {
  whyThisMatters: (
    <p>
      A partner asks to see the individual matched users from a clean-room deal "just to check the
      list." The correct answer is that this is not how a clean room works, and being able to say why
      — instead of just refusing — is what makes the answer credible.
    </p>
  ),
  objectives: [
    "Explain what the Topics API assigns and how it differs from contextual advertising",
    "Explain how the Attribution Reporting API measures conversions without cross-site tracking",
    "Define a data clean room and what specifically never leaves it",
    "Name at least one clean-room alternative besides Universal IDs",
  ],
  Body,
  takeaways: [
    "Privacy Sandbox replaces third-party-cookie-based targeting with on-device APIs: Topics assigns a rotating set of broad interest categories from recent browsing — three shared per site visit — instead of an individual identifier, and Attribution Reporting measures conversions with aggregated, noised data instead of cross-site tracking.",
    "A data clean room lets two parties match their first-party data against each other for targeting, frequency capping, measurement, or attribution, but only an aggregate result ever leaves the room — no user-level row is exported.",
    "Universal IDs, Privacy Sandbox, contextual targeting, and clean rooms are competing, sometimes complementary, answers to the same problem: how advertising keeps working once individual, cross-site tracking is gone.",
  ],
  checkYourself: [
    {
      question: "How does Topics-based advertising differ from contextual advertising?",
      answer: (
        <p>
          Topics infers a user's own recent interests from their browsing and shares those topics
          with whatever site they visit next, regardless of what that page is about. Contextual
          targeting ignores the user entirely and targets based only on the content of the page
          being viewed right now.
        </p>
      ),
    },
    {
      question:
        "An advertiser asks your clean-room provider for the individual list of matched emails so their sales team can call them directly. Can you provide it?",
      answer: (
        <p>
          No. That would defeat the purpose of a clean room. Only aggregated results — counts,
          campaign metrics — are ever released; user-level data never leaves the room, for any
          requester.
        </p>
      ),
    },
  ],
};

export default lesson;

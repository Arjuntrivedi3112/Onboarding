import { useState } from "react";

import type { LessonContent } from "@/components/journey/lesson-content";
import { cn } from "@/lib/utils";
import { DmpStageNav, DmpStageDetail, getDmpStage } from "./_shared";

type Need = "cookie" | "email" | "profile";

interface Segment {
  id: string;
  label: string;
  description: string;
  has: Record<Need, boolean>;
}

const SEGMENTS: Segment[] = [
  {
    id: "anon",
    label: "Anonymous site visitors",
    description: "Built purely from tracking-pixel cookie data. Nobody in it has ever logged in or given an email.",
    has: { cookie: true, email: false, profile: false },
  },
  {
    id: "known",
    label: "Logged-in customers",
    description: "Built from merged profiles keyed on a hashed email master ID.",
    has: { cookie: true, email: true, profile: true },
  },
];

interface Destination {
  id: string;
  label: string;
  needs: Need;
  detail: string;
}

const DESTINATIONS: Destination[] = [
  { id: "dsp", label: "DSP, for targeting", needs: "cookie", detail: "A demand-side platform only needs a cookie ID to bid against — it never sees an email." },
  { id: "personalization", label: "Publisher on-site personalization", needs: "profile", detail: "Personalizing a page in real time needs a persistent profile the publisher can look up the instant someone loads it." },
  { id: "social", label: "Social platform export", needs: "email", detail: "Social platforms match audiences by hashed email or phone number, not by cookie." },
  { id: "email", label: "Email targeting", needs: "email", detail: "An email campaign needs an email address to send to, hashed or not." },
];

const NEED_LABELS: Record<Need, string> = { cookie: "a cookie ID", email: "a hashed email", profile: "a persistent profile" };

const USE_CASES = [
  { title: "Targeting", description: "Improve online media campaign targeting." },
  { title: "Audience extension", description: "Find new users who look like your best customers." },
  { title: "Personalization", description: "Customize on-site experiences for a segment." },
  { title: "Measurement", description: "Analyze campaign performance by segment." },
];

function Body() {
  const [stage] = useState(5);
  const [segmentId, setSegmentId] = useState(SEGMENTS[0].id);
  const [destinationId, setDestinationId] = useState<string | null>(null);

  const currentStage = getDmpStage(stage);
  const segment = SEGMENTS.find((s) => s.id === segmentId) ?? SEGMENTS[0];
  const destination = DESTINATIONS.find((d) => d.id === destinationId) ?? null;
  const matches = destination ? segment.has[destination.needs] : null;

  return (
    <div className="space-y-8">
      <section>
        <h3 className="mb-1 text-lg text-foreground">The last stage</h3>
        <DmpStageNav activeIds={[5]} selected={stage} />
        <div className="mt-4">
          <DmpStageDetail stage={currentStage} />
        </div>
      </section>

      <div className="measure space-y-4 text-muted-foreground">
        <p>
          Once you've created audience segments, you can activate your data: push segments to
          demand-side platforms (DSPs) for targeting, sync with publishers for on-site
          personalization, export to social platforms, or use them for retargeting and email.
          Beyond straightforward targeting, DMP segments also power audience extension — finding new
          users who look like your best customers — on-site personalization, and measurement of
          campaign performance broken down by segment.
        </p>
      </div>

      <section>
        <h3 className="mb-1 text-lg text-foreground">Try it</h3>
        <p className="measure mb-4 text-sm text-muted-foreground">
          Pick a segment, then pick where to send it. Every destination expects a different
          identifier, and the wrong one means nobody gets reached.
        </p>

        <p className="text-xs uppercase text-muted-foreground">Segment</p>
        <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Choose a segment">
          {SEGMENTS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => {
                setSegmentId(s.id);
                setDestinationId(null);
              }}
              aria-pressed={segmentId === s.id}
              className={cn(
                "min-h-[2.75rem] rounded-lg border px-4 text-sm transition-colors",
                segmentId === s.id
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border text-muted-foreground hover:text-foreground"
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
        <p className="measure mt-2 text-sm text-muted-foreground">{segment.description}</p>

        <p className="mt-4 text-xs uppercase text-muted-foreground">Destination</p>
        <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Choose a destination">
          {DESTINATIONS.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => setDestinationId(d.id)}
              aria-pressed={destinationId === d.id}
              className={cn(
                "min-h-[2.75rem] rounded-lg border px-4 text-sm transition-colors",
                destinationId === d.id
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border text-muted-foreground hover:text-foreground"
              )}
            >
              Send it to {d.label.toLowerCase()}
            </button>
          ))}
        </div>

        {destination && (
          <div className="mt-4 rounded-lg border border-border bg-card p-5">
            <p className="text-xs uppercase text-muted-foreground">
              Needs {NEED_LABELS[destination.needs]}
            </p>
            <p className="measure mt-1 text-sm text-muted-foreground">{destination.detail}</p>
            <p className={cn("mt-3 text-sm", matches ? "text-foreground" : "text-foreground")}>
              {matches
                ? "This segment activates cleanly here."
                : `This segment has no ${NEED_LABELS[destination.needs]} to match on — nobody in it would be reached.`}
            </p>
          </div>
        )}
      </section>

      <section>
        <h3 className="mb-3 text-lg text-foreground">What a DMP is used for</h3>
        <ul className="grid gap-2 sm:grid-cols-2">
          {USE_CASES.map((u) => (
            <li key={u.title} className="rounded-lg border border-border bg-card p-3">
              <span className="block text-foreground">{u.title}</span>
              <span className="mt-0.5 block text-sm text-muted-foreground">{u.description}</span>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3 className="mb-3 text-lg text-foreground">DMP versus CDP</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-border bg-card p-5">
            <p className="text-foreground">Data management platform (DMP)</p>
            <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
              <li>Focused on anonymous audience data</li>
              <li>Primarily third-party data</li>
              <li>
                Short retention, typically about <span className="figure">90</span> days
              </li>
              <li>Optimized for advertising activation</li>
            </ul>
          </div>
          <div className="rounded-lg border border-border bg-card p-5">
            <p className="text-foreground">Customer data platform (CDP)</p>
            <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
              <li>Focused on known customer data</li>
              <li>Primarily first-party data</li>
              <li>Persistent storage</li>
              <li>Used for marketing and advertising</li>
            </ul>
          </div>
        </div>
        <p className="measure mt-3 text-sm text-muted-foreground">
          The anonymous segment above behaves like a DMP's population — cookie-based, short-lived.
          The logged-in segment behaves like data a CDP would hold — a persistent profile anchored to
          an email, ready for marketing as well as advertising.
        </p>
      </section>
    </div>
  );
}

const lesson: LessonContent = {
  whyThisMatters: (
    <p>
      A campaign manager hands you a finished segment and expects it to work everywhere — the DSP,
      the email tool, the on-site banner — but each destination needs a different kind of identifier,
      and the wrong one silently fails to match anyone.
    </p>
  ),
  objectives: [
    "Name at least three destinations a finished segment can be activated to",
    "Explain what identifier each activation destination actually needs to match a person",
    "State the main differences between a DMP and a CDP",
  ],
  Body,
  takeaways: [
    "Once segments exist, they can be activated: pushed to DSPs for targeting, synced with publishers for personalization, exported to social platforms, or used for retargeting and email.",
    "Each activation destination needs a different identifier — a DSP can work from an anonymous cookie ID, but social platforms, email and true personalization all need a hashed email or a persistent profile.",
    "A DMP mainly holds anonymous, largely third-party audience data with short retention for advertising; a CDP holds known, largely first-party customer data with persistent storage for both marketing and advertising.",
  ],
  checkYourself: [
    {
      question: "You try to export a segment built only from anonymous cookie data to a social platform for lookalike targeting. What goes wrong?",
      answer: (
        <p>
          Social platforms match audiences by hashed email, not cookie ID. A purely anonymous segment
          has nothing to match on there, so it would fail to reach anyone.
        </p>
      ),
    },
    {
      question: "What's the core difference between a DMP and a CDP?",
      answer: (
        <p>
          A DMP focuses on anonymous, largely third-party audience data with short retention, built
          for advertising activation. A CDP focuses on known, largely first-party customer data with
          persistent storage, used for marketing as well as advertising.
        </p>
      ),
    },
    {
      question: "Name two things a DMP's segments are used for besides straightforward ad targeting.",
      answer: (
        <p>
          Audience extension — finding new users who look like your best customers — and on-site
          personalization or measuring campaign performance broken down by segment.
        </p>
      ),
    },
  ],
};

export default lesson;

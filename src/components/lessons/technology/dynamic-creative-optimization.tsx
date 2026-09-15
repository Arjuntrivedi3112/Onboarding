import { useState } from "react";

import type { LessonContent } from "@/components/journey/lesson-content";
import { cn } from "@/lib/utils";

const RTB_STEPS = [
  {
    title: "User visit",
    detail: "A user loads a website. The SSP sends a bid request to an ad exchange, which forwards it to every connected DSP.",
  },
  {
    title: "Bid evaluation",
    detail: "Each DSP checks the available user data against its campaign's targeting criteria to decide whether to bid.",
  },
  {
    title: "Bid response",
    detail: "The DSPs submit their bids. The exchange picks the highest one, and the winning ad is cleared to run on the publisher's page.",
  },
  {
    title: "Dynamic creative generation",
    detail: "Before the ad is shown, the DSP calls the DCO tool. It assembles a creative from the user's data, in real time, and delivers it.",
  },
] as const;

const PROFILES = [
  {
    id: "runner",
    label: "Marathon trainee",
    geo: "Chicago",
    interest: "Running gear",
    behavior: "Visited a shoe review page yesterday",
    background: "Sunrise over a running trail",
    image: "A close-up of trail running shoes",
    valueProp: "Built for your next long run",
    cta: "Shop running shoes",
  },
  {
    id: "parent",
    label: "New parent",
    geo: "Austin",
    interest: "Strollers",
    behavior: "Added a stroller to a cart, did not check out",
    background: "A quiet park path",
    image: "A folded travel stroller",
    valueProp: "Finish what you started — free returns for 30 days",
    cta: "Complete your order",
  },
  {
    id: "traveler",
    label: "Frequent flyer",
    geo: "Miami",
    interest: "Luggage",
    behavior: "Searched flights to Chicago this week",
    background: "An airport departures board",
    image: "A carry-on suitcase",
    valueProp: "Pack light for your Chicago trip",
    cta: "Shop carry-ons",
  },
] as const;

/**
 * Illustrative A/B panel: a fixed control rate against a personalized rate
 * computed from it, so the lesson never states two numbers that could drift
 * apart from each other.
 */
const CONTROL_CTR = 0.9;
const PERSONALIZED_MULTIPLIER = 2.6;

function Body() {
  const [profileId, setProfileId] = useState<(typeof PROFILES)[number]["id"]>("runner");
  const [step, setStep] = useState(0);

  const profile = PROFILES.find((p) => p.id === profileId) ?? PROFILES[0];
  const done = step >= RTB_STEPS.length - 1;
  const assembled = done;
  const personalizedCtr = CONTROL_CTR * PERSONALIZED_MULTIPLIER;

  return (
    <div className="space-y-8">
      <div className="measure space-y-4 text-muted-foreground">
        <p>
          The last four lessons ended with a DSP winning a bid and an ad server delivering something.
          This lesson is about what happens in the gap between those two events —{" "}
          <span className="text-foreground">dynamic creative optimization (DCO)</span>, a process
          where advertisers show a personalized ad to an individual user, built from what is known
          about them.
        </p>
        <p>
          The software behind it, a DCO tool, creates, serves, and measures these ads. Its raw
          material is ad components — backgrounds, text, images, value propositions, and
          calls-to-action (CTAs) — dynamically assembled to make the most relevant message for one
          person, using demographic, geographic, interest, contextual, behavioral, and historical
          data about them.
        </p>
      </div>

      <section>
        <h3 className="mb-1 text-lg text-foreground">Try it</h3>
        <p className="measure mb-4 text-sm text-muted-foreground">
          Pick a user profile, then step through the bidding cycle from the earlier lessons. At the
          last step, watch the DCO tool assemble a creative from that specific profile's data.
        </p>

        <div className="flex flex-wrap gap-2" role="group" aria-label="Choose a user profile">
          {PROFILES.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                setProfileId(p.id);
                setStep(0);
              }}
              aria-pressed={profileId === p.id}
              className={cn(
                "min-h-[2.75rem] rounded-lg border px-4 text-sm transition-colors",
                profileId === p.id
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border text-muted-foreground hover:text-foreground"
              )}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="mt-3 rounded-lg border border-border bg-card p-4">
          <p className="text-xs uppercase text-muted-foreground">What the DCO tool knows</p>
          <ul className="mt-2 grid gap-1 sm:grid-cols-3">
            <li className="text-sm text-muted-foreground">
              <span className="text-foreground">Geographic:</span> {profile.geo}
            </li>
            <li className="text-sm text-muted-foreground">
              <span className="text-foreground">Interest:</span> {profile.interest}
            </li>
            <li className="text-sm text-muted-foreground">
              <span className="text-foreground">Behavioral:</span> {profile.behavior}
            </li>
          </ul>
        </div>

        <div
          className="mt-4 flex flex-wrap gap-2"
          role="group"
          aria-label="Step through the real-time bidding cycle"
        >
          <button
            type="button"
            onClick={() => setStep((s) => Math.min(s + 1, RTB_STEPS.length - 1))}
            disabled={done}
            className={cn(
              "min-h-[2.75rem] rounded-lg border px-4 text-sm transition-colors",
              done
                ? "border-border text-muted-foreground opacity-50"
                : "border-primary bg-primary/10 text-foreground"
            )}
          >
            Advance the auction
          </button>
          <button
            type="button"
            onClick={() => setStep(0)}
            className="min-h-[2.75rem] rounded-lg border border-border px-4 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Restart
          </button>
        </div>

        <ol className="mt-4 space-y-2">
          {RTB_STEPS.map((s, i) => (
            <li
              key={s.title}
              className={cn(
                "flex gap-3 rounded-lg border p-3",
                i === step ? "border-primary bg-primary/10" : "border-border bg-card",
                i > step && "opacity-50"
              )}
            >
              <span className="figure shrink-0 text-muted-foreground">{i + 1}</span>
              <span className="measure text-sm">
                <span className="text-foreground">{s.title}.</span>{" "}
                <span className="text-muted-foreground">{s.detail}</span>
              </span>
            </li>
          ))}
        </ol>

        {assembled && (
          <div className="mt-4 rounded-lg border border-primary/30 bg-primary/10 p-5">
            <p className="text-xs uppercase text-muted-foreground">Creative assembled for {profile.label}</p>
            <ul className="mt-2 space-y-1">
              <li className="measure text-sm text-foreground">
                <span className="text-muted-foreground">Background — </span>
                {profile.background}
              </li>
              <li className="measure text-sm text-foreground">
                <span className="text-muted-foreground">Image — </span>
                {profile.image}
              </li>
              <li className="measure text-sm text-foreground">
                <span className="text-muted-foreground">Value proposition — </span>
                {profile.valueProp}
              </li>
              <li className="measure text-sm text-foreground">
                <span className="text-muted-foreground">Call-to-action — </span>
                {profile.cta}
              </li>
            </ul>
          </div>
        )}

        <p className="measure mt-3 text-sm text-muted-foreground">
          Change the profile and repeat the last step — the auction mechanics from earlier lessons do
          not change at all. Only the fourth step, the one this lesson is about, produces a different
          result.
        </p>
      </section>

      <section>
        <h3 className="mb-3 text-lg text-foreground">What sets DCO apart</h3>
        <p className="measure mb-4 text-muted-foreground">
          The DCO tool takes the data above, forms a new creative out of it, tests variants against
          each other in real time (A/B testing), and shows the best-performing version at scale.
          Combining personalization with instant optimization is what raises the odds that a user
          clicks and eventually converts.
        </p>

        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs uppercase text-muted-foreground">Illustrative A/B result</p>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            <div>
              <span className="block text-sm text-muted-foreground">Generic control creative</span>
              <span className="figure text-lg text-foreground">{CONTROL_CTR.toFixed(1)}%</span>
              <span className="text-sm text-muted-foreground"> click-through rate</span>
            </div>
            <div>
              <span className="block text-sm text-muted-foreground">Personalized, DCO-assembled creative</span>
              <span className="figure text-lg text-foreground">{personalizedCtr.toFixed(1)}%</span>
              <span className="text-sm text-muted-foreground"> click-through rate</span>
            </div>
          </div>
          <p className="measure mt-3 text-sm text-muted-foreground">
            These figures are illustrative, not a benchmark for any real campaign. The direction is
            the point: real-time personalization tends to outperform a single generic creative shown
            to everyone.
          </p>
        </div>
      </section>

      <div className="measure space-y-4 text-muted-foreground">
        <p>
          To do any of this, a DCO tool has to integrate with the platforms already covered — DSPs
          and ad exchanges — and lean on data feeds and machine learning to assemble a creative fast
          enough to fit inside the auction that just ran. It is the last piece bolted onto the RTB
          cycle, not a separate one.
        </p>
      </div>
    </div>
  );
}

const lesson: LessonContent = {
  whyThisMatters: (
    <p>
      When two people see completely different versions of the "same" campaign, DCO is usually why —
      and if a personalized creative underperforms, the first question is not the auction, it is
      whether the DCO tool had good enough data to assemble something worth showing.
    </p>
  ),
  objectives: [
    "Define dynamic creative optimization and name the ad components it assembles",
    "List the categories of data a DCO tool draws on",
    "Place DCO's step correctly inside the four-step real-time bidding cycle",
  ],
  Body,
  takeaways: [
    "Dynamic creative optimization assembles an ad's background, image, value proposition, and call-to-action for one specific user, from data such as their location, interests, and past behavior.",
    "DCO runs as the fourth step of the real-time bidding cycle, after a bid has already won — the DSP calls the DCO tool, which builds and delivers the creative before the ad is shown.",
    "What distinguishes DCO from a simple set of banner variants is that it tests creatives in real time and keeps shifting toward whichever version is performing best, rather than picking one version in advance.",
  ],
  checkYourself: [
    {
      question: "At what point in the real-time bidding cycle does a DCO tool actually do its work?",
      answer: (
        <p>
          After the bid is won, not before. The user visit, bid evaluation, and bid response all
          happen first and decide who gets to show an ad at all; only then does the winning DSP call
          the DCO tool to assemble the actual creative for that specific user.
        </p>
      ),
    },
    {
      question: "A DCO campaign is underperforming a plain, single-version banner. What would you check first?",
      answer: (
        <p>
          The data feeding it. DCO's advantage depends entirely on having real, current data about
          the user — geographic, interest, behavioral, or historical. If that data is thin, stale, or
          missing, the tool has little to personalize with, and a well-made generic creative can
          outperform a poorly informed personalized one.
        </p>
      ),
    },
  ],
};

export default lesson;

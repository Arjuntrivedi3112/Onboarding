import { useState } from "react";

import type { LessonContent } from "@/components/journey/lesson-content";
import { cn } from "@/lib/utils";
import { ImpactCallout, NumberedSteps } from "./_shared";

/** What audience prediction knows about each visitor before any creative is picked. */
const PROFILES = [
  {
    id: "runner",
    label: "Marathon training",
    segment: "Frequent visits to running-tips content, owns a GPS watch",
    propensity: 88,
    creative: {
      headline: "Built for your next long run",
      image: "A runner mid-stride on a trail at sunrise",
      cta: "Find your pace",
    },
  },
  {
    id: "parent",
    label: "Parent shopping for kids' gear",
    segment: "Household with children, browsed kids' shoes twice this week",
    propensity: 72,
    creative: {
      headline: "Back-to-school shoes, sized for growing feet",
      image: "Kids running across a school playground",
      cta: "Shop kids' sizes",
    },
  },
  {
    id: "bargain",
    label: "Price comparer",
    segment: "Compared this exact product across three retailers this week",
    propensity: 41,
    creative: {
      headline: "Price match guaranteed this week",
      image: "A price tag with a percentage-off badge",
      cta: "See today's price",
    },
  },
  {
    id: "cold",
    label: "First-time visitor",
    segment: "No prior history with this brand",
    propensity: 12,
    creative: {
      headline: "Quality shoes for everyone",
      image: "A plain studio product shot",
      cta: "Shop now",
    },
  },
] as const;

const GENERIC_AD = {
  headline: "Quality shoes for everyone",
  image: "A plain studio product shot",
  cta: "Shop now",
};

function liftFor(propensity: number) {
  return Math.round(propensity * 0.5);
}

function DcoAssembler() {
  const [profileId, setProfileId] = useState<(typeof PROFILES)[number]["id"]>("runner");
  const [personalized, setPersonalized] = useState(true);

  const profile = PROFILES.find((p) => p.id === profileId) ?? PROFILES[0];
  const creative = personalized ? profile.creative : GENERIC_AD;
  const lift = personalized ? liftFor(profile.propensity) : 0;

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <p className="text-xs uppercase text-muted-foreground">Who just showed up</p>
      <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Choose a visitor profile">
        {PROFILES.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setProfileId(p.id)}
            aria-pressed={profileId === p.id}
            className={cn(
              "min-h-[2.75rem] rounded-lg border px-3 text-left text-sm transition-colors",
              profileId === p.id
                ? "border-primary bg-primary/10 text-foreground"
                : "border-border text-muted-foreground hover:text-foreground"
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="mt-4 rounded-lg border border-border bg-secondary p-4">
        <p className="text-xs uppercase text-muted-foreground">Audience prediction</p>
        <p className="measure mt-1 text-sm text-muted-foreground">{profile.segment}</p>
        <p className="mt-2 text-foreground">
          Propensity to convert: <span className="figure">{profile.propensity}</span>/100
        </p>
      </div>

      <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Choose how the creative is built">
        {[
          { id: true, label: "Dynamic creative (DCO)" },
          { id: false, label: "Same ad for everyone" },
        ].map((option) => (
          <button
            key={String(option.id)}
            type="button"
            onClick={() => setPersonalized(option.id)}
            aria-pressed={personalized === option.id}
            className={cn(
              "min-h-[2.75rem] rounded-lg border px-4 text-sm transition-colors",
              personalized === option.id
                ? "border-primary bg-primary/10 text-foreground"
                : "border-border text-muted-foreground hover:text-foreground"
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="mt-4 rounded-lg border border-border p-4">
        <p className="text-xs uppercase text-muted-foreground">Assembled creative</p>
        <p className="mt-2 text-lg text-foreground">{creative.headline}</p>
        <p className="mt-1 text-sm text-muted-foreground">Image: {creative.image}</p>
        <p className="mt-2 inline-block rounded-full border border-border bg-secondary px-3 py-1 text-sm text-foreground">
          {creative.cta}
        </p>
      </div>

      <div className="mt-4 flex items-center gap-4">
        <p className="text-xs uppercase text-muted-foreground">Predicted engagement lift</p>
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
          <div className="h-full rounded-full bg-primary" style={{ width: `${(lift / 50) * 100}%` }} />
        </div>
        <span className="figure text-foreground">+{lift}%</span>
      </div>
      <p className="measure mt-2 text-sm text-muted-foreground">
        {personalized
          ? "Every profile gets its own headline, image, and call to action, assembled from the same component library."
          : "One ad, built for no one in particular, shown to all four profiles — the lift disappears because nothing about it responds to who is looking."}
      </p>
    </div>
  );
}

function Body() {
  return (
    <div className="space-y-8">
      <div className="measure space-y-4 text-muted-foreground">
        <p>
          On social media platforms, AI enables hyper-personalized ad experiences by analyzing vast
          datasets on user interests, behaviors, and interactions. It drives dynamic creative
          optimization, where ad formats, visuals, and messaging are automatically adapted to each
          user's profile and real-time context, improving engagement and conversion rates.
        </p>
        <p>
          Two applications sit behind that sentence, in order. Something first has to decide who is
          worth reaching and how likely they are to convert — that is audience prediction. Only then
          does a second system decide what to actually show that person — that is dynamic creative
          optimization, or DCO.
        </p>
      </div>

      <section>
        <h3 className="mb-3 text-lg text-foreground">Audience prediction</h3>
        <p className="measure mb-3 text-muted-foreground">
          ML models identify high-value audiences and predict user behavior.
        </p>
        <NumberedSteps
          steps={[
            "Analyze first-party data to identify conversion patterns",
            "Build lookalike models to find similar high-value users",
            "Predict purchase intent and likelihood to convert",
            "Score users for propensity modeling",
          ]}
        />
        <div className="mt-4">
          <ImpactCallout
            figure={<><span className="figure">3-5x</span> improvement in targeting efficiency</>}
            description="From spending on the users a model expects to convert instead of spreading the same budget across everyone equally."
          />
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-lg text-foreground">Dynamic creative optimization</h3>
        <p className="measure mb-3 text-muted-foreground">
          AI assembles personalized ad creatives in real time based on user data.
        </p>
        <NumberedSteps
          steps={[
            "Combine creative elements — images, headlines, calls to action — dynamically",
            "Select components based on the user's profile and real-time context",
            "A/B test variations continuously, at scale",
            "Optimize toward the best-performing combinations",
          ]}
        />
        <p className="measure mt-3 text-sm text-muted-foreground">
          A DCO tool must integrate with existing AdTech platforms such as DSPs and ad exchanges. It
          then uses data feeds and machine learning algorithms to assemble personalized creatives —
          and it does this after the auction, not before: the DSP issues an ad call to the DCO only
          once the bid is won, and the DCO generates a hyper-relevant creative in real time and
          delivers it to the user.
        </p>
        <div className="mt-4">
          <ImpactCallout
            figure={<><span className="figure">Up to 50%</span> higher engagement</>}
            description="Through creatives personalized to the viewer instead of one version shown to everyone."
          />
        </div>
      </section>

      <section>
        <h3 className="mb-1 text-lg text-foreground">Try it</h3>
        <p className="measure mb-4 text-sm text-muted-foreground">
          Pick a visitor, see what audience prediction scored them, then switch the creative between
          fully personalized and one generic ad. Watch the predicted engagement lift move — and
          watch what stays fixed on the "same ad for everyone" baseline no matter who you pick.
        </p>
        <DcoAssembler />
      </section>

      <section>
        <h3 className="mb-2 text-lg text-foreground">A different kind of AI-made ad</h3>
        <p className="measure text-muted-foreground">
          Everything above is AI choosing among components a creative team already built — a
          headline from a list, an image from a library. A newer format goes further: as ad
          platforms evolve, brands are introducing AI-generated, immersive ads that seamlessly blend
          into the viewing experience — for example, pause-screen overlays with product placements,
          where the ad experience itself, not just the selection of it, is machine-generated. DCO
          personalizes a choice among options; this generates the option.
        </p>
      </section>
    </div>
  );
}

const lesson: LessonContent = {
  whyThisMatters: (
    <p>
      You will be shown a campaign where five people see five different versions of the same ad and
      asked which one "the algorithm" chose. It did not choose one — it assembled one, from parts,
      for that specific person, after first deciding that person was worth reaching at all.
    </p>
  ),
  objectives: [
    "Explain what audience prediction scores before any creative decision is made",
    "Describe how a DCO tool assembles a creative in real time, and when in the auction timeline that call fires",
    "Say what a 'same ad for everyone' baseline gets wrong that DCO fixes",
    "Distinguish AI that assembles a creative from components from AI that generates the ad experience itself",
  ],
  Body,
  takeaways: [
    "Audience prediction runs first: it analyzes first-party data, builds lookalike models, and scores each user's propensity to convert, before any creative is chosen.",
    "DCO fires after the bid is won, not before — the DSP issues an ad call to the DCO, which assembles a hyper-relevant creative from components in real time and delivers it.",
    "A 'same ad for everyone' baseline is not a personalization failure so much as a personalization absence — it shows the identical headline, image, and call to action to a marathon trainer and a first-time visitor alike.",
  ],
  checkYourself: [
    {
      question: "A DCO call fires and there is no winning bid yet. What does that tell you about the setup?",
      answer: (
        <p>
          Something is out of order. The DSP is only supposed to issue the ad call to the DCO after
          it has already won the auction — the creative is assembled for an impression that is
          already paid for, not one that might still be lost to a competing bidder.
        </p>
      ),
    },
    {
      question:
        "A first-time visitor with almost no browsing history gets the generic ad even when DCO is switched on. Is that a bug?",
      answer: (
        <p>
          No — it is audience prediction being honest about what it does not yet know. With a low
          propensity score and no segment to match against, DCO has nothing distinctive to assemble
          from, so the safest output is the same broad creative a cold visitor would have gotten
          anyway. Personalization needs a signal to personalize on.
        </p>
      ),
    },
  ],
};

export default lesson;

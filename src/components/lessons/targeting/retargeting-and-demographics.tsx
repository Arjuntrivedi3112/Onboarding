import { useState } from "react";

import type { LessonContent } from "@/components/journey/lesson-content";
import { cn } from "@/lib/utils";

interface RetargetingStep {
  title: string;
  line: string;
  cookie: { domain: string; stores: string } | null;
}

/** The book's own blueshoes.com → news.com worked example, one click at a time. */
const STEPS: RetargetingStep[] = [
  {
    title: "The shopper visits the advertiser's site",
    line: "An online shopper visits blueshoes.com and views a pair of shoes.",
    cookie: null,
  },
  {
    title: "A pixel request fires from the footer",
    line: "Retargeting service code placed between the <footer> tags sends a request for a 1×1 transparent pixel.",
    cookie: null,
  },
  {
    title: "The pixel returns, and a cookie is saved",
    line: "The retargeting service sends back the 1×1 pixel and saves a cookie to the shopper under its own domain.",
    cookie: { domain: "ads.retargetser.com", stores: "Product viewed: women's blue running shoes" },
  },
  {
    title: "The shopper sees the ad elsewhere",
    line: "The shopper leaves blueshoes.com, visits a different website — news.com — and sees an ad for the exact same pair of shoes.",
    cookie: { domain: "ads.retargetser.com", stores: "Product viewed: women's blue running shoes" },
  },
];

const DEMOGRAPHIC_EXAMPLES = [
  "Age",
  "Gender",
  "Annual income",
  "Marital status",
  "Parental status",
  "Occupation",
];

type Sourcing = "independent" | "walled-garden";

function Body() {
  const [step, setStep] = useState(0);
  const current = STEPS[step];

  const [sourcing, setSourcing] = useState<Sourcing>("independent");

  return (
    <div className="space-y-8">
      <div className="measure space-y-4 text-muted-foreground">
        <p>
          Retargeting is the practice of displaying ads to users who have previously interacted
          with a brand. If a visitor views a pair of shoes, they will likely see the same pair
          advertised on a different website soon after. The mechanism runs through a transparent
          1×1 image, known as a pixel, embedded on the page: when the page loads, the pixel sends a
          request to an AdTech platform such as a demand-side platform (DSP), and as the image is
          returned to the browser, the DSP places a cookie on the visitor's device if one does not
          already exist. Later, when that visitor browses another site, the DSP recognizes them via
          the cookie and displays the retargeted ad.
        </p>
      </div>

      <section>
        <h3 className="mb-1 text-lg text-foreground">Try it</h3>
        <p className="measure mb-4 text-sm text-muted-foreground">
          Walk through the book's own worked example one step at a time, and watch what gets
          written to the cookie along the way.
        </p>

        <div className="rounded-lg border border-border bg-card p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs uppercase text-muted-foreground">
              Step <span className="figure">{step + 1}</span> of{" "}
              <span className="figure">{STEPS.length}</span>
            </p>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Control the retargeting walkthrough">
              <button
                type="button"
                onClick={() => setStep((s) => Math.min(s + 1, STEPS.length - 1))}
                disabled={step === STEPS.length - 1}
                className="min-h-[2.75rem] rounded-lg border border-border bg-primary/10 px-4 text-sm text-foreground transition-colors hover:border-primary disabled:opacity-50"
              >
                Advance one step
              </button>
              <button
                type="button"
                onClick={() => setStep(0)}
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
            aria-valuemax={STEPS.length - 1}
            aria-valuenow={step}
            aria-label="Progress through the retargeting walkthrough"
          >
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${(step / (STEPS.length - 1)) * 100}%` }}
            />
          </div>

          <p className="mt-4 text-foreground">{current.title}</p>
          <p className="measure mt-1 text-sm text-muted-foreground">{current.line}</p>

          <div className="mt-4 rounded-lg border border-border-strong bg-secondary p-4">
            <p className="text-xs uppercase text-muted-foreground">Cookie set for this visitor</p>
            {current.cookie === null ? (
              <p className="measure mt-2 text-sm text-muted-foreground">Nothing written yet.</p>
            ) : (
              <p className="measure mt-2 text-sm">
                <span className="figure text-foreground">{current.cookie.domain}</span>
                <span className="text-muted-foreground"> — {current.cookie.stores}</span>
              </p>
            )}
          </div>
        </div>

        <p className="measure mt-4 text-sm text-muted-foreground">
          The DSP is able to identify the same visitor across different websites by syncing cookies
          with other AdTech platforms — for example, supply-side platforms (SSPs) and ad exchanges.
          That sync is what lets the cookie set on blueshoes.com be recognized on news.com, even
          though the two sites have no direct relationship with each other.
        </p>
      </section>

      <section>
        <h3 className="mb-3 text-lg text-foreground">Demographic targeting</h3>
        <p className="measure mb-4 text-sm text-muted-foreground">
          Demographic targeting is one of the most powerful and precise forms of audience
          targeting, and is often used alongside other methods to further refine reach. It is also
          challenging, because most publishers do not collect demographic data directly from
          visitors — Facebook and Google are the major exceptions, gathering it through user
          accounts. Common examples include:
        </p>
        <ul className="grid gap-2 sm:grid-cols-3">
          {DEMOGRAPHIC_EXAMPLES.map((item) => (
            <li key={item} className="rounded-lg border border-border bg-card p-3 text-sm text-muted-foreground">
              {item}
            </li>
          ))}
        </ul>
        <p className="measure mt-3 text-sm text-muted-foreground">
          For example, an advertiser promoting baby products could target female users aged 20 to
          40 who have one or more children. Combining a demographic filter with other targeting
          methods helps ensure ads reach the most relevant audience.
        </p>
      </section>

      <section>
        <h3 className="mb-1 text-lg text-foreground">Try it</h3>
        <p className="measure mb-4 text-sm text-muted-foreground">
          Where the demographic data comes from depends entirely on where the campaign runs.
        </p>

        <div className="flex flex-wrap gap-2" role="group" aria-label="Choose a platform">
          <button
            type="button"
            onClick={() => setSourcing("independent")}
            aria-pressed={sourcing === "independent"}
            className={cn(
              "min-h-[2.75rem] rounded-lg border px-4 text-sm transition-colors",
              sourcing === "independent"
                ? "border-primary bg-primary/10 text-foreground"
                : "border-border text-muted-foreground hover:text-foreground"
            )}
          >
            Independent AdTech platform
          </button>
          <button
            type="button"
            onClick={() => setSourcing("walled-garden")}
            aria-pressed={sourcing === "walled-garden"}
            className={cn(
              "min-h-[2.75rem] rounded-lg border px-4 text-sm transition-colors",
              sourcing === "walled-garden"
                ? "border-primary bg-primary/10 text-foreground"
                : "border-border text-muted-foreground hover:text-foreground"
            )}
          >
            Facebook or Google
          </button>
        </div>

        <div className="mt-4 rounded-lg border border-border bg-card p-5">
          <p className="text-xs uppercase text-muted-foreground">How targeting is applied</p>
          <p className="measure mt-1 text-foreground">
            {sourcing === "independent" ? (
              <>
                Advertisers apply demographic targeting using audience segments from a data
                management platform (DMP), or via demographic data contained in the User object of
                OpenRTB bid requests.
              </>
            ) : (
              <>
                Because Facebook and Google collect this data directly from user accounts,
                advertisers simply set up the targeting criteria inside the platform itself — no
                DMP segment or bid-request field is needed.
              </>
            )}
          </p>
        </div>
      </section>

      <section className="rounded-lg border border-border bg-card p-5">
        <p className="text-xs uppercase text-muted-foreground">Case study</p>
        <p className="measure mt-1 text-foreground">
          An email retargeting tool, rebuilt for eCommerce stores to recover revenue lost to cart
          abandonment, generated over <span className="figure">$56 million</span> in revenue for
          the client.
        </p>
      </section>
    </div>
  );
}

const lesson: LessonContent = {
  whyThisMatters: (
    <p>
      "Why is this shopper seeing our shoe ad on a news site?" is a question you will get asked in
      plain language by someone who has never heard of a cookie. Being able to trace the pixel,
      the cookie, and the cross-site sync in one breath — and to say honestly where a demographic
      claim came from — is what makes that answer credible.
    </p>
  ),
  objectives: [
    "Trace the retargeting mechanism from a page view through the pixel to a cookie recognized on another site",
    "Explain why the same visitor can be recognized across two unrelated websites",
    "Contrast how demographic targeting is sourced on an independent AdTech platform versus Facebook or Google",
  ],
  Body,
  takeaways: [
    "Retargeting works through a 1×1 pixel that sets a cookie on the first visit; a DSP recognizes that cookie later on a different site and serves the same ad the visitor saw before.",
    "A DSP identifies the same visitor across sites by syncing cookies with other AdTech platforms, such as SSPs and ad exchanges.",
    "Demographic targeting is precise but hard to source — most publishers don't collect it directly, so independent platforms rely on DMP segments or the OpenRTB User object, while Facebook and Google let advertisers set criteria directly because they collect it themselves.",
  ],
  checkYourself: [
    {
      question:
        "A shopper views shoes on blueshoes.com and later sees the same shoes advertised on news.com. Neither site shares a login or a direct relationship. How is that possible?",
      answer: (
        <p>
          Cookie syncing. The DSP that placed the cookie when the pixel fired on blueshoes.com
          syncs its identifiers with the SSPs and ad exchanges that serve news.com, so it recognizes
          the same visitor there even though the two publishers never exchanged data directly.
        </p>
      ),
    },
    {
      question:
        "An advertiser wants to target women aged 20 to 40 with children, but is running the campaign on an independent DSP rather than Facebook or Google. Where does that demographic data come from?",
      answer: (
        <p>
          Typically from a DMP audience segment built from data collected elsewhere, or from
          demographic fields carried in the User object of an OpenRTB bid request — not collected
          by the DSP itself, since most publishers don't gather demographic data directly.
        </p>
      ),
    },
  ],
};

export default lesson;

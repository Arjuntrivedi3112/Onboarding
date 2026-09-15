import { useState } from "react";

import type { LessonContent } from "@/components/journey/lesson-content";
import { cn } from "@/lib/utils";

/**
 * The six targeting methods this section covers, grouped by the one thing a
 * beginner actually needs to hold on to: which signal each method reads.
 */
const METHODS = [
  {
    id: "contextual",
    label: "Contextual",
    signal: "The page",
    summary:
      "Show ads that suit what the page is about rather than who is reading it. A web crawler categorizes the page, and that category travels with the ad request.",
    example: "Smartphone ads on a phone review, travel ads on a vacation blog, sports gear on sports news.",
    coveredIn: "Covered next, together with the IAB content taxonomy.",
  },
  {
    id: "geo",
    label: "Geolocation",
    signal: "The ad request",
    summary:
      "Read the device IP address, or exact GPS coordinates from a native mobile app, and serve ads that only make sense in that place.",
    example: "Restaurant ads within five miles of the restaurant, or offers only in one neighborhood.",
    coveredIn: "Covered in the ad request lesson, with device and time of day.",
  },
  {
    id: "device",
    label: "Device and browser",
    signal: "The ad request",
    summary:
      "Every ad request carries a user-agent header. It names the operating system, the browser and version, and the device type, brand and model.",
    example: "An Android game promoted only to people on Android phones and tablets.",
    coveredIn: "Covered in the ad request lesson, with geolocation and time of day.",
  },
  {
    id: "behavioral",
    label: "Behavioral",
    signal: "The person",
    summary:
      "Show ads based on browsing behavior — pages viewed, searches, purchases — collected into a profile and grouped into an audience.",
    example: "People who viewed a product more than three times this month.",
    coveredIn: "Covered in the behavioral targeting lesson.",
  },
  {
    id: "retargeting",
    label: "Retargeting",
    signal: "The person",
    summary:
      "Show ads to someone who already interacted with the brand. A pixel on the advertiser's page sets a cookie that is recognized again on a different site.",
    example: "The exact pair of shoes a shopper looked at yesterday, seen again on a news site.",
    coveredIn: "Covered with demographic targeting.",
  },
  {
    id: "demographic",
    label: "Demographic",
    signal: "The person",
    summary:
      "Target on age, gender, annual income, marital status, parental status or occupation. Precise, and hard to source, because most publishers never collect it.",
    example: "Baby products to women aged 20 to 40 with one or more children.",
    coveredIn: "Covered with retargeting.",
  },
] as const;

function Body() {
  const [methodId, setMethodId] = useState<(typeof METHODS)[number]["id"]>("contextual");
  const current = METHODS.find((m) => m.id === methodId) ?? METHODS[0];

  return (
    <div className="space-y-8">
      <div className="measure space-y-4 text-muted-foreground">
        <p>
          Targeting is how an ad reaches the right audience instead of everybody. Budget control is
          how the advertiser spends wisely once it does. The two belong in the same chapter because
          they solve the same problem from opposite ends — targeting decides who is worth paying
          for, and capping, pacing and frequency limits decide how much to pay and how fast.
        </p>
        <p>
          Every targeting method in this section is really an answer to one question: what does the
          buyer actually know at the moment the ad is requested? Sometimes the answer is only what
          the page is about. Sometimes it is the request itself — an IP address, a user-agent
          header, a timestamp. Sometimes it is a profile of the person built over months. The three
          groups differ enormously in precision, in privacy exposure, and in how much machinery it
          takes to run them.
        </p>
        <p>
          Two acronyms show up throughout. A demand-side platform (DSP) is the tool an advertiser
          uses to buy ads, and a supply-side platform (SSP) is the tool a publisher uses to sell
          them. Targeting criteria are set in the DSP; the signals they match against arrive from
          the publisher's side.
        </p>
      </div>

      <section>
        <h3 className="mb-1 text-lg text-foreground">Try it</h3>
        <p className="measure mb-4 text-sm text-muted-foreground">
          Pick a method and watch the signal line above the description. Notice that the six methods
          collapse into only three sources of knowledge — the page, the ad request, and the person —
          and that the later lessons are ordered from the least invasive source to the most.
        </p>

        <div className="flex flex-wrap gap-2" role="group" aria-label="Choose a targeting method">
          {METHODS.map((method) => (
            <button
              key={method.id}
              type="button"
              onClick={() => setMethodId(method.id)}
              aria-pressed={methodId === method.id}
              className={cn(
                "min-h-[2.75rem] rounded-lg border px-4 text-sm transition-colors",
                methodId === method.id
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border text-muted-foreground hover:text-foreground"
              )}
            >
              {method.label}
            </button>
          ))}
        </div>

        <div className="mt-4 rounded-lg border border-border bg-card p-5">
          <p className="text-xs uppercase text-muted-foreground">Signal it reads</p>
          <p className="mt-1 text-foreground">{current.signal}</p>

          <p className="mt-4 text-xs uppercase text-muted-foreground">What it does</p>
          <p className="measure mt-1 text-muted-foreground">{current.summary}</p>

          <p className="mt-4 text-xs uppercase text-muted-foreground">A typical use</p>
          <p className="measure mt-1 text-muted-foreground">{current.example}</p>

          <p className="mt-4 border-t border-border pt-3 text-sm text-muted-foreground">
            {current.coveredIn}
          </p>
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-lg text-foreground">The three sources, side by side</h3>
        <ul className="grid gap-2 sm:grid-cols-3">
          <li className="rounded-lg border border-border bg-card p-3">
            <span className="text-foreground">The page</span>
            <span className="mt-0.5 block text-sm text-muted-foreground">
              Contextual. No personal data, so the least regulatory exposure, and the least
              precision about who is actually reading.
            </span>
          </li>
          <li className="rounded-lg border border-border bg-card p-3">
            <span className="text-foreground">The ad request</span>
            <span className="mt-0.5 block text-sm text-muted-foreground">
              Geolocation, device and browser, day and time. All of it arrives for free with every
              request — nothing has to be stored about anyone.
            </span>
          </li>
          <li className="rounded-lg border border-border bg-card p-3">
            <span className="text-foreground">The person</span>
            <span className="mt-0.5 block text-sm text-muted-foreground">
              Behavioral, retargeting, demographic. The most precise, and the only group that needs
              a profile kept over time.
            </span>
          </li>
        </ul>
        <p className="measure mt-3 text-sm text-muted-foreground">
          In practice these are combined, not chosen. A single line item can require a Tier 2
          content category, a city, an Android phone, a Friday evening and membership of an
          audience segment all at once — and each condition it adds makes the audience smaller.
        </p>
      </section>

      <div className="measure space-y-4 text-muted-foreground">
        <p>
          The second half of the section is the other side of the same coin. Once targeting has
          narrowed the audience, budget capping limits total spend, pacing controls how fast the
          money goes out, and frequency capping limits how often one person sees the same ad. Get
          those wrong and a well-targeted campaign still wastes money.
        </p>
      </div>
    </div>
  );
}

const lesson: LessonContent = {
  whyThisMatters: (
    <p>
      On your first campaign call someone will list five targeting criteria in one breath and expect
      you to know which of them the platform can actually see. Knowing that targeting comes from
      only three places — the page, the ad request, or a stored profile — is what lets you tell a
      reasonable request from an impossible one.
    </p>
  ),
  objectives: [
    "State in one sentence what targeting and budget control are each for",
    "Name the six targeting methods this section covers",
    "Sort a given targeting criterion into the page, the ad request, or the person",
  ],
  Body,
  takeaways: [
    "Targeting makes sure ads reach the right audience, and budget control makes sure the money behind them is spent wisely.",
    "Every targeting method reads one of three sources: what the page is about, what the ad request carries, or what is stored about the person.",
    "Methods are combined rather than chosen, and every condition added makes the eligible audience smaller.",
  ],
  checkYourself: [
    {
      question:
        "An advertiser asks to reach women aged 25 to 34 who are reading recipe pages on their phones in Chicago on a Saturday morning. Which sources of knowledge is that request drawing on?",
      answer: (
        <p>
          All three. The recipe page is contextual; the phone, the city and the Saturday morning all
          come out of the ad request; the age and gender need a stored profile from a data provider
          or a platform that collects it. The first two are cheap, the third is the hard part.
        </p>
      ),
    },
    {
      question:
        "Why does a chapter about targeting also cover budget caps, pacing and frequency limits?",
      answer: (
        <p>
          Because narrowing the audience only decides who is eligible. Spend controls decide how
          much is paid to reach them and how fast — without them a precisely targeted campaign can
          still burn its budget in a day or show the same person the same ad twenty times.
        </p>
      ),
    },
  ],
};

export default lesson;

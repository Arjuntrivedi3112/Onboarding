import { useState } from "react";

import type { LessonContent } from "@/components/journey/lesson-content";
import { cn } from "@/lib/utils";

/** The two sides an AdTech stack serves, and what each gets out of it. */
const SIDES = [
  {
    id: "advertiser",
    label: "The advertiser buying",
    goal: "Reach the right audience at the right time, in the right place, on the right device.",
    jobs: [
      "Decide which ads to show which user groups, based on targeting criteria",
      "Deliver ads across channels and devices — web, in-app mobile, and more",
      "Optimize campaign performance",
      "Cap budget so a campaign cannot overspend",
    ],
  },
  {
    id: "publisher",
    label: "The publisher selling",
    goal: "Monetize their assets — primarily ad space.",
    jobs: [
      "Optimize yield across the inventory they have to sell",
      "Collect user data and build audiences",
      "Generate measurement and analytics reports",
      "Manage billing and media-buying processes",
    ],
  },
] as const;

const STACK_PIECES = [
  { term: "Demand-side platform", acronym: "DSP", gloss: "What an advertiser buys through." },
  { term: "Supply-side platform", acronym: "SSP", gloss: "What a publisher sells through." },
  { term: "Advertising networks", acronym: null, gloss: "Bundles of inventory sold as a package." },
  { term: "Creative optimization", acronym: null, gloss: "Choosing which version of an ad to show." },
  { term: "Digital-out-of-home", acronym: "DOOH", gloss: "Screens in public places." },
  { term: "Mobile app advertising", acronym: null, gloss: "Ads inside apps rather than web pages." },
  { term: "Budget capping", acronym: null, gloss: "Stopping a campaign from overspending." },
  { term: "Media-buying processes", acronym: null, gloss: "How inventory is actually purchased." },
];

function Body() {
  const [side, setSide] = useState<(typeof SIDES)[number]["id"]>("advertiser");
  const current = SIDES.find((s) => s.id === side) ?? SIDES[0];

  return (
    <div className="space-y-8">
      <div className="measure space-y-4 text-muted-foreground">
        <p>
          AdTech is short for advertising technology. It refers to the software, tools, and
          processes used to create, run, manage, measure, and optimize digital advertising
          campaigns.
        </p>
        <p>
          That is a broad definition because it covers a lot of separate pieces. None of them is
          the whole thing — an <span className="text-foreground">AdTech stack</span> is the
          collection of them a company has assembled for its own needs.
        </p>
      </div>

      <section>
        <h3 className="mb-3 text-lg text-foreground">Some of the pieces</h3>
        <ul className="grid gap-2 sm:grid-cols-2">
          {STACK_PIECES.map((piece) => (
            <li key={piece.term} className="rounded-lg border border-border bg-card p-3">
              <span className="text-foreground">
                {piece.term}
                {piece.acronym && (
                  <span className="figure ml-2 text-sm text-muted-foreground">{piece.acronym}</span>
                )}
              </span>
              <span className="mt-0.5 block text-sm text-muted-foreground">{piece.gloss}</span>
            </li>
          ))}
        </ul>
        <p className="measure mt-3 text-sm text-muted-foreground">
          Every one of these gets its own lesson later. The point right now is only that AdTech is
          a category, not a product.
        </p>
      </section>

      <section>
        <h3 className="mb-1 text-lg text-foreground">Try it</h3>
        <p className="measure mb-4 text-sm text-muted-foreground">
          The same stack serves two customers with opposite goals. Switch sides and watch what the
          software is being asked to do change completely — one side is trying to buy attention as
          cheaply as possible, the other is trying to sell it for as much as possible.
        </p>

        <div className="flex flex-wrap gap-2" role="group" aria-label="Choose a side of the market">
          {SIDES.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setSide(option.id)}
              aria-pressed={side === option.id}
              className={cn(
                "min-h-[2.75rem] rounded-lg border px-4 text-sm transition-colors",
                side === option.id
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border text-muted-foreground hover:text-foreground"
              )}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="mt-4 rounded-lg border border-border bg-card p-5">
          <p className="text-xs uppercase text-muted-foreground">What they want</p>
          <p className="measure mt-1 text-foreground">{current.goal}</p>

          <p className="mt-4 text-xs uppercase text-muted-foreground">
            What the stack does for them
          </p>
          <ul className="mt-2 space-y-2">
            {current.jobs.map((job) => (
              <li key={job} className="flex gap-3 text-muted-foreground">
                <span
                  aria-hidden="true"
                  className="mt-2 h-1 w-1 shrink-0 rounded-full bg-primary"
                />
                <span>{job}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <div className="measure space-y-4 text-muted-foreground">
        <p>
          A well-built stack helps an advertiser reach someone at the right time, in the right
          place, on the right device — during business hours at home on a laptop, or late at night
          in a city center on a phone. The same stack gives the publisher the tools to sell that
          moment.
        </p>
        <p>
          One warning before you go further: this industry has its own terminology and an endless
          supply of acronyms. Every acronym in these lessons is expanded the first time it appears,
          and the glossary has all of them in one place.
        </p>
      </div>
    </div>
  );
}

const lesson: LessonContent = {
  whyThisMatters: (
    <p>
      In your first week someone will say "our AdTech stack" and mean something specific by it. It
      is not one product you can point at — it is a set of tools two opposing sides use to trade
      the same thing, and knowing which side a tool serves tells you most of what it does.
    </p>
  ),
  objectives: [
    "Define AdTech in one sentence without using the word advertising technology",
    "Name at least four pieces that can sit in an AdTech stack",
    "Say whether a given tool serves the advertiser buying or the publisher selling",
  ],
  Body,
  takeaways: [
    "AdTech is the software, tools, and processes used to create, run, manage, measure, and optimize digital advertising campaigns.",
    "An AdTech stack always serves two sides at once: advertisers buying attention and publishers selling it.",
    "Advertisers use the stack to reach the right person at the right moment; publishers use it to monetize their ad space.",
  ],
  checkYourself: [
    {
      question: "Someone describes a tool that caps how much a campaign can spend per day. Which side of the market is it serving?",
      answer: (
        <p>
          The advertiser. Budget capping protects the buyer from overspending. A publisher's
          equivalent concern is yield — getting the highest price for the space they have.
        </p>
      ),
    },
    {
      question: "Your company sells ad space on its own website and also runs ad campaigns for its own products. Which side of the stack do you need?",
      answer: (
        <p>
          Both, and this is common. The same organization can be a publisher for its own inventory
          and an advertiser for its own marketing. They are separate jobs with separate tools, which
          is why people are careful to say which side they mean.
        </p>
      ),
    },
  ],
};

export default lesson;

import { useState } from "react";

import type { LessonContent } from "@/components/journey/lesson-content";
import { cn } from "@/lib/utils";
import { PlatformProfile, StackNode, ChainArrow } from "./_shared";

const DSP_FUNCTIONS = [
  "Create, run, and manage multiple campaigns simultaneously across SSPs and ad exchanges, all from a single user interface",
  "Auto-optimize campaigns using algorithms and machine learning to improve return on investment, viewability, conversions, cost per action (CPA), and more",
  "Leverage data from customer data platforms (CDPs) and data management platforms (DMPs) to enhance targeting",
  "Provide real-time reporting through advanced analytics",
];

const DSP_COMPONENTS = [
  { name: "Bidder", role: "Decides whether to bid, how much, and which creative." },
  { name: "Ad server", role: "Delivers the creative once a bid wins." },
  { name: "Campaign tracker", role: "Follows delivery against what the campaign promised." },
  { name: "Banker", role: "Holds the money: budgets, pacing, and what has been spent." },
  { name: "Reporting database", role: "Stores the events the reports are built from." },
  { name: "User profile database", role: "Holds what is known about the user in the request." },
  { name: "User interface", role: "Where a media buyer sets targeting and uploads creatives." },
  { name: "API connectors", role: "The plumbing out to every other platform." },
  { name: "Creative management tools", role: "Storing, versioning, and assigning the creatives." },
];

const DSP_INTEGRATIONS = [
  "SSPs and ad exchanges",
  "CDPs, DMPs, and data brokers",
  "Ad verification and creative optimization platforms",
  "Meta-DSP",
];

const DMP_PIPELINE = [
  "Data normalization and enrichment",
  "Profile merging",
  "Profile building",
  "Audience creation",
  "Data storage",
  "Data activation",
  "Data segmentation (classification) and taxonomies",
  "Analytics and reporting",
];

const DMP_USE_CASES = [
  {
    name: "Improving targeting for online media campaigns",
    note: "The original job, and still the main one.",
  },
  {
    name: "Audience extension",
    note: "Finding the same audience somewhere other than where you first met them.",
  },
  {
    name: "Onsite personalization",
    note: "Increasingly shifted to CDPs and personalization engines, which handle real-time, first-party data better than legacy DMPs.",
  },
  {
    name: "Content and product recommendations",
    note: "The same segments, used to decide what to show rather than what to buy.",
  },
];

const DMP_INTEGRATIONS = [
  "Advertising platforms: DSPs and SSPs",
  "CRM systems",
  "Marketing automation tools",
  "Analytics platforms",
  "Data warehouses",
  "Social media platforms",
  "Publishers, clean rooms, and consent management platforms (CMPs)",
];

const BROKER_TYPES = [
  {
    name: "Marketing and advertising",
    description: "Enhance ad targeting and campaign measurement for advertisers and platforms.",
  },
  {
    name: "Identity verification and fraud detection",
    description: "Help organizations such as banks confirm individual identities.",
  },
  {
    name: "People search",
    description:
      "Collect publicly available information about individuals from social media and other online sources.",
  },
];

/**
 * The bid arithmetic. A base value plus an uplift per matched signal — the
 * numbers are an illustration of the shape of the decision, and the lesson
 * says so on screen. Nothing here is a quoted market rate.
 */
const BASE_BID = 1.1;

const SIGNALS = [
  {
    id: "in-market",
    source: "DMP segment",
    label: "In-market for running shoes",
    uplift: 1.8,
    qualifying: true,
  },
  {
    id: "site-visit",
    source: "DMP segment",
    label: "Visited the advertiser's site in the last 7 days",
    uplift: 2.4,
    qualifying: true,
  },
  {
    id: "income",
    source: "Data broker",
    label: "Household income band",
    uplift: 0.6,
    qualifying: false,
  },
  {
    id: "geo",
    source: "Data broker",
    label: "Geolocation — a top-20 metro area",
    uplift: 0.9,
    qualifying: false,
  },
] as const;

function Body() {
  const [active, setActive] = useState<string[]>([]);

  const on = SIGNALS.filter((s) => active.includes(s.id));
  const qualifies = on.some((s) => s.qualifying);
  const bid = BASE_BID + on.reduce((sum, s) => sum + s.uplift, 0);

  const toggle = (id: string) =>
    setActive((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  return (
    <div className="space-y-8">
      <div className="measure space-y-4 text-muted-foreground">
        <p>
          A <span className="text-foreground">demand-side platform (DSP)</span> — the single
          interface an advertiser or agency buys inventory through — is the buy side of the whole
          chain in one box. It is where a campaign is set up, and it is what answers when a bid
          request arrives.
        </p>
        <p>
          The answer it gives depends almost entirely on what it knows about the person behind the
          request. That knowledge does not come from the DSP itself. It arrives from a data layer
          sitting alongside it, which is why this lesson covers the DSP and its data sources
          together.
        </p>
      </div>

      <PlatformProfile id="dsp" />

      <section>
        <h3 className="mb-3 text-lg text-foreground">What a DSP is actually for</h3>
        <ul className="space-y-2">
          {DSP_FUNCTIONS.map((fn) => (
            <li key={fn} className="flex gap-3 text-muted-foreground">
              <span aria-hidden="true" className="mt-2 h-1 w-1 shrink-0 rounded-full bg-primary" />
              <span className="measure">{fn}</span>
            </li>
          ))}
        </ul>
        <p className="measure mt-4 text-muted-foreground">
          The second of those is the one people underestimate. A DSP is not only a buying interface
          — it is an optimizer that keeps adjusting the campaign against a goal you gave it, whether
          that goal is a viewable impression, a conversion, or a cost per action.
        </p>
      </section>

      <section>
        <h3 className="mb-1 text-lg text-foreground">How a DSP works, once</h3>
        <p className="measure mb-4 text-muted-foreground">
          An advertiser sets up a campaign in the DSP, defining targeting criteria and uploading
          creatives. When an impression becomes available, the DSP receives a bid request from an
          SSP or an ad exchange containing contextual and user-related information. The bidder
          decides whether to bid, how much to bid, and which creative to serve. If the bid wins, the
          creative is delivered through the DSP's own ad server.
        </p>

        <h4 className="mb-2 text-foreground">The parts doing that work</h4>
        <ul className="grid gap-2 sm:grid-cols-2">
          {DSP_COMPONENTS.map((c) => (
            <li key={c.name} className="rounded-lg border border-border bg-card p-3">
              <span className="block text-foreground">{c.name}</span>
              <span className="mt-0.5 block text-sm text-muted-foreground">{c.role}</span>
            </li>
          ))}
        </ul>

        <h4 className="mb-2 mt-5 text-foreground">What it has to be plugged into</h4>
        <div className="flex flex-wrap gap-2">
          {DSP_INTEGRATIONS.map((item) => (
            <span
              key={item}
              className="rounded-lg border border-border bg-secondary px-3 py-1 text-sm text-muted-foreground"
            >
              {item}
            </span>
          ))}
        </div>
        <p className="measure mt-3 text-sm text-muted-foreground">
          A meta-DSP is a DSP that buys through other DSPs rather than connecting to exchanges
          directly. If you ever hear someone say there are two DSPs in the path, that is what they
          mean.
        </p>
      </section>

      <section>
        <h3 className="mb-3 text-lg text-foreground">Where the bid gets its opinion</h3>
        <p className="measure mb-4 text-muted-foreground">
          A <span className="text-foreground">data management platform (DMP)</span> — the system
          that collects audience data and turns it into segments a campaign can target — is the
          classic answer. It collects, stores, and organizes data from websites, mobile apps, and
          advertising campaigns, and advertisers, agencies, and publishers use it for ad targeting,
          advanced analytics, look-alike modeling, and audience extension.
        </p>

        <PlatformProfile id="dmp" />

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="rounded-lg border border-border bg-card p-4">
            <h4 className="mb-2 text-foreground">How the data gets in</h4>
            <p className="measure text-sm text-muted-foreground">
              A DMP collects data through integrations — either server-to-server or via an
              application programming interface (API) — with other AdTech and MarTech platforms such
              as DSPs, ad exchanges, SSPs, and customer relationship management (CRM) systems. It
              can also collect data by placing a tag, meaning a JavaScript snippet or an HTML pixel,
              on an advertiser's or publisher's website.
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <h4 className="mb-2 text-foreground">What happens to it next</h4>
            <ol className="space-y-1">
              {DMP_PIPELINE.map((step, i) => (
                <li key={step} className="flex gap-3 text-sm text-muted-foreground">
                  <span className="figure shrink-0">{i + 1}</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>

        <h4 className="mb-2 mt-5 text-foreground">What people use it for</h4>
        <ul className="grid gap-2 sm:grid-cols-2">
          {DMP_USE_CASES.map((u) => (
            <li key={u.name} className="rounded-lg border border-border bg-card p-3">
              <span className="block text-foreground">{u.name}</span>
              <span className="mt-0.5 block text-sm text-muted-foreground">{u.note}</span>
            </li>
          ))}
        </ul>
        <p className="measure mt-3 text-muted-foreground">
          That third one is a live migration you will hear argued about. A{" "}
          <span className="text-foreground">customer data platform (CDP)</span> — a store of a
          company's own known-customer data — and a{" "}
          <span className="text-foreground">clean room</span> — a controlled space where two parties
          compare data without either handing theirs over — have taken work that used to sit in a
          DMP. A <span className="text-foreground">consent management platform (CMP)</span>, which
          records what a user agreed to, now sits in front of all of it.
        </p>

        <h4 className="mb-2 mt-5 text-foreground">What a DMP connects to</h4>
        <div className="flex flex-wrap gap-2">
          {DMP_INTEGRATIONS.map((item) => (
            <span
              key={item}
              className="rounded-lg border border-border bg-secondary px-3 py-1 text-sm text-muted-foreground"
            >
              {item}
            </span>
          ))}
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-lg text-foreground">Data brokers</h3>
        <p className="measure mb-4 text-muted-foreground">
          A data broker is a company that collects and aggregates personal information — such as
          income, ethnicity, political beliefs, or geolocation data — and then sells or licenses this
          data to third parties. Data brokers typically compile information from multiple sources,
          segment it into categories, and sell those segments to other companies for use in online
          advertising campaigns.
        </p>
        <ul className="grid gap-2 md:grid-cols-3">
          {BROKER_TYPES.map((b) => (
            <li key={b.name} className="rounded-lg border border-border bg-card p-3">
              <span className="block text-foreground">{b.name}</span>
              <span className="mt-0.5 block text-sm text-muted-foreground">{b.description}</span>
            </li>
          ))}
        </ul>
        <p className="measure mt-3 text-sm text-muted-foreground">
          In the digital advertising and marketing industries, many DMPs act as data brokers — and
          vice versa. DSPs commonly integrate with both to enrich targeting.
        </p>
      </section>

      <section>
        <h3 className="mb-1 text-lg text-foreground">Try it</h3>
        <p className="measure mb-4 text-sm text-muted-foreground">
          A bid request just arrived for a running-shoe campaign. Switch each data signal on and off
          and watch two things: whether the bidder bids at all, and how far the price moves. The
          campaign targets people in market for running shoes, so without a qualifying segment there
          is nothing to bid on, however much the broker data says about the household.
        </p>

        <div className="flex flex-wrap gap-2" role="group" aria-label="Toggle data signals on the bid request">
          {SIGNALS.map((s) => {
            const isOn = active.includes(s.id);
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => toggle(s.id)}
                aria-pressed={isOn}
                className={cn(
                  "min-h-[2.75rem] rounded-lg border px-4 py-2 text-left text-sm transition-colors",
                  isOn
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border text-muted-foreground hover:text-foreground"
                )}
              >
                <span className="block text-xs uppercase text-muted-foreground">{s.source}</span>
                {s.label}
              </button>
            );
          })}
        </div>

        <div className="mt-4 rounded-lg border border-border bg-card p-5">
          <p className="text-xs uppercase text-muted-foreground">Bidder decision</p>
          {qualifies ? (
            <p className="mt-1 text-foreground">
              Bid <span className="figure text-2xl">${bid.toFixed(2)}</span>
              <span className="text-muted-foreground"> CPM</span>
            </p>
          ) : (
            <p className="mt-1 text-destructive">
              No bid — no segment matches the campaign targeting
            </p>
          )}

          <p className="measure mt-2 text-sm text-muted-foreground">
            {qualifies
              ? `Base value $${BASE_BID.toFixed(2)} plus ${on.length} matched signal${
                  on.length === 1 ? "" : "s"
                }. Cost per mille (CPM) is the price for a thousand impressions.`
              : "The broker attributes are worth nothing on their own here. They refine a bid the campaign was already willing to make; they do not create one."}
          </p>

          <p className="mt-4 text-xs uppercase text-muted-foreground">Components that ran</p>
          <div className="mt-2 flex flex-wrap items-center gap-1">
            <StackNode label="User profile database" active />
            <ChainArrow />
            <StackNode label="Bidder" active />
            <ChainArrow />
            <StackNode label="Banker" active={qualifies} dimmed={!qualifies} />
            <ChainArrow />
            <StackNode label="Ad server" active={qualifies} dimmed={!qualifies} />
          </div>
          <p className="measure mt-3 text-sm text-muted-foreground">
            {qualifies
              ? "The banker checks the campaign still has budget, then the DSP's ad server stands ready to deliver the creative if the bid wins."
              : "The chain stops at the bidder. No money is reserved and no creative is prepared."}
          </p>
        </div>

        <p className="measure mt-3 text-sm text-muted-foreground">
          The prices here are illustrative — they exist to show the shape of the decision, not to
          quote a market rate. What is real is the order of operations: qualify first, price second.
        </p>
      </section>

      <section>
        <h3 className="mb-2 text-lg text-foreground">In the wild</h3>
        <p className="measure text-muted-foreground">
          Not every DSP is bought off a shelf. The book describes a proprietary DSP built with a
          Softmax multi-armed bandit algorithm — a method that keeps shifting delivery toward
          whichever creative is converting best while still testing the others — used to optimize
          creatives against conversions. That is the auto-optimization bullet above, made concrete:
          the buying decision and the creative decision are the same decision.
        </p>
      </section>
    </div>
  );
}

const lesson: LessonContent = {
  whyThisMatters: (
    <p>
      The first campaign you are handed will underdeliver, and someone will ask why. The answer is
      almost always in this lesson: the targeting was too narrow for the bidder to find qualifying
      requests, or the data feeding it never arrived. Knowing which part of the DSP to look at saves
      you a week.
    </p>
  ),
  objectives: [
    "Describe what a DSP does between receiving a bid request and serving a creative",
    "Name the components of a DSP and say which one holds the budget",
    "Explain where a DSP gets its audience data, and what a DMP, CDP, and data broker each contribute",
    "Say why a data signal can raise a bid without being able to create one",
  ],
  takeaways: [
    "A DSP is one interface for buying across many exchanges and SSPs, and its bidder decides whether to bid, how much, and which creative to serve.",
    "A DSP is only as good as the data around it: DMPs, CDPs, and data brokers supply the segments that make one impression worth more than another.",
    "Targeting qualifies a request and data prices it — a signal that does not match the campaign's criteria cannot turn a no-bid into a bid.",
  ],
  Body,
  checkYourself: [
    {
      question:
        "Your campaign is spending far less than its daily budget. Which DSP component would you look at first, and what else would you check?",
      answer: (
        <p>
          Start with the bidder and the targeting behind it: if the criteria are narrow, very few
          incoming bid requests qualify, so there is nothing to spend on. Then check the data — if a
          DMP segment stopped syncing, the audience the campaign targets effectively disappeared.
          The banker will show budget sitting unspent, but it is rarely the cause.
        </p>
      ),
    },
    {
      question:
        "A vendor offers to sell you household income and political affiliation data to improve a campaign. What are you actually buying, and what should you check?",
      answer: (
        <p>
          You are buying from a data broker — a company that aggregates personal information and
          licenses it on. It can refine bids on requests you already wanted, but it will not find you
          new qualifying inventory. Check what consent that data was collected under, since a consent
          management platform in the chain may exclude the users it describes anyway, and check
          whether your DMP already carries something equivalent.
        </p>
      ),
    },
  ],
};

export default lesson;

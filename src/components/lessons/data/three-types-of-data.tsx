import { useState } from "react";

import type { LessonContent } from "@/components/journey/lesson-content";
import { cn } from "@/lib/utils";

type DataKind = "first" | "second" | "third";

const KIND_LABELS: Record<DataKind, string> = {
  first: "First-party",
  second: "Second-party",
  third: "Third-party",
};

interface Dataset {
  id: string;
  label: string;
  kind: DataKind;
  tell: string;
}

/** Six real-world datasets, two per data type, in the order a learner would meet them. */
const DATASETS: Dataset[] = [
  {
    id: "checkout-log",
    label: "Your own checkout log",
    kind: "first",
    tell: "Collected directly from people who bought from you — the clearest first-party data there is.",
  },
  {
    id: "email-signup",
    label: "Email addresses collected at your own signup form",
    kind: "first",
    tell: "You collected it directly, from someone who chose to interact with your brand.",
  },
  {
    id: "airline-hotel",
    label: "An airline's frequent-flyer list, shared with a partner hotel chain",
    kind: "second",
    tell: "First-party data for the airline, but the hotel chain only has it because the airline sold or traded it — that exchange is what makes it second-party.",
  },
  {
    id: "watch-brand",
    label: "A luxury watchmaker's list of high-income travelers, bought from an airline",
    kind: "second",
    tell: "Same pattern: someone else's first-party data, obtained through a partnership rather than collected directly.",
  },
  {
    id: "credit-bureau",
    label: "A credit bureau's estimated income band for a household",
    kind: "third",
    tell: "Neither collected directly nor obtained through a partnership — a broker inferred and enriched it from data you don't own.",
  },
  {
    id: "tracking-sdk",
    label: "A location feed from a tracking SDK, bought from a data broker",
    kind: "third",
    tell: "Supplied by a data broker from a tracker embedded in someone else's app — the most common route third-party data takes to reach a DMP.",
  },
];

function Body() {
  const [index, setIndex] = useState(0);
  const [chosen, setChosen] = useState<DataKind | null>(null);
  const [correctCount, setCorrectCount] = useState(0);

  const done = index >= DATASETS.length;
  const current = !done ? DATASETS[index] : null;

  function choose(kind: DataKind) {
    if (chosen || !current) return;
    setChosen(kind);
    if (kind === current.kind) setCorrectCount((c) => c + 1);
  }

  function next() {
    setChosen(null);
    setIndex((i) => i + 1);
  }

  function restart() {
    setIndex(0);
    setChosen(null);
    setCorrectCount(0);
  }

  return (
    <div className="space-y-8">
      <div className="measure space-y-4 text-muted-foreground">
        <p>
          Data is the backbone of AdTech, powering everything from targeting to measurement. Almost
          all of it falls into one of three types — first-party, second-party, and third-party — and
          the difference is simply how far the data has traveled from the person it describes before
          it reaches you.
        </p>
        <p>
          <span className="text-foreground">First-party data</span> is the most valuable of the three
          for both advertisers and publishers, because it is collected directly from people who have
          interacted with the brand — customers checking out, visitors browsing a site, users
          creating an account. It is typically collected through e-commerce and offline transactions,
          CRM systems tracking accounts and purchases, and website or app analytics, and it can
          originate from both online and offline sources. Brands use it to convert visitors into
          customers and to sell more to the customers they already have.
        </p>
        <p>
          <span className="text-foreground">Second-party data</span> is sometimes called partner
          data: it is first-party information collected by one company and sold or traded to another.
          These partnerships usually pair two non-competing companies that serve similar audiences —
          a hotel chain buying or exchanging an airline's first-party data, for instance, since
          travelers booking flights are often also booking a place to stay. The trade can be one-way,
          or reciprocal, with both companies exchanging information and advertising to each other's
          customers. First-party data remains more valuable, since it comes from known, engaged
          customers, but second-party data helps a brand reach new audiences that share real
          behaviors or interests with its own.
        </p>
        <p>
          <span className="text-foreground">Third-party data</span> ranks last in value of the three,
          since it is neither collected directly nor obtained through a partnership. It is typically
          supplied by data brokers, or added as a layer by a DMP vendor — the acronym for a{" "}
          <span className="text-foreground">data management platform</span>, software that collects,
          organizes and activates audience data. Many publishers and merchants monetize their traffic
          by adding third-party trackers to their websites or tracking SDKs — software development
          kits — to their apps, feeding data to brokers and DMPs. What gets collected includes
          browsing history and content interactions, purchase behavior, profile details users
          voluntarily entered such as gender or age, and GPS geolocation and device data. Brokers then
          infer further attributes — interests, purchasing intent, income group, demographics — and
          enrich the dataset with offline sources such as credit card companies, credit scoring
          agencies and telecommunications providers. Despite ranking last in value, its main advantage
          is scale: the ability to reach a much bigger audience than first- or second-party data alone
          could reach.
        </p>
      </div>

      <section>
        <h3 className="mb-1 text-lg text-foreground">Try it</h3>
        <p className="measure mb-4 text-sm text-muted-foreground">
          Six real datasets, one at a time. Decide whose data it really is before checking the tell.
        </p>

        {!done && current && (
          <div className="rounded-lg border border-border bg-card p-5">
            <p className="text-xs uppercase text-muted-foreground">
              Dataset <span className="figure">{index + 1}</span> of{" "}
              <span className="figure">{DATASETS.length}</span>
            </p>
            <p className="measure mt-1 text-foreground">{current.label}</p>

            <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Classify this dataset">
              {(Object.keys(KIND_LABELS) as DataKind[]).map((kind) => {
                const isChosen = chosen === kind;
                const isCorrectAnswer = chosen !== null && kind === current.kind;
                return (
                  <button
                    key={kind}
                    type="button"
                    onClick={() => choose(kind)}
                    disabled={chosen !== null}
                    aria-pressed={isChosen}
                    className={cn(
                      "min-h-[2.75rem] rounded-lg border px-4 text-sm transition-colors",
                      isCorrectAnswer
                        ? "border-primary bg-primary/10 text-foreground"
                        : isChosen
                          ? "border-border-strong text-foreground"
                          : "border-border text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Call it {KIND_LABELS[kind].toLowerCase()}
                  </button>
                );
              })}
            </div>

            {chosen && (
              <div className="mt-4 border-t border-border pt-4">
                <p className="text-sm text-foreground">
                  {chosen === current.kind ? "Correct." : `Actually ${KIND_LABELS[current.kind].toLowerCase()}.`}
                </p>
                <p className="measure mt-1 text-sm text-muted-foreground">{current.tell}</p>
                <button
                  type="button"
                  onClick={next}
                  className="mt-3 min-h-[2.75rem] rounded-lg border border-primary bg-primary/10 px-4 text-sm text-foreground transition-colors"
                >
                  Show the next dataset
                </button>
              </div>
            )}
          </div>
        )}

        {done && (
          <div className="rounded-lg border border-border bg-card p-5">
            <p className="text-foreground">
              You classified <span className="figure">{correctCount}</span> of{" "}
              <span className="figure">{DATASETS.length}</span> correctly.
            </p>
            <p className="measure mt-2 text-sm text-muted-foreground">
              Notice the trend: the first two datasets took no trust in anyone else, the middle two
              relied on one partner's honesty, and the last two relied on a broker you have never met.
              Value falls in that same order — first-party highest, third-party last — while reach
              runs the other way.
            </p>
            <button
              type="button"
              onClick={restart}
              className="mt-3 min-h-[2.75rem] rounded-lg border border-border px-4 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Restart the sort
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

const lesson: LessonContent = {
  whyThisMatters: (
    <p>
      A media planner will ask whether an audience is built on data you collected yourself or data
      you paid a broker for, and the answer changes what you can honestly promise a client. Mixing up
      first-party with third-party in a pitch is the kind of mistake that gets noticed.
    </p>
  ),
  objectives: [
    "Define first-party, second-party and third-party data in one sentence each",
    "Name at least two sources each type is typically collected from",
    "Explain why value falls and reach grows as data moves further from its original source",
  ],
  Body,
  takeaways: [
    "First-party data is collected directly from people who have interacted with your brand, and it is the most valuable of the three types.",
    "Second-party data is another company's first-party data, obtained through a purchase or a reciprocal partnership between two non-competing companies with similar audiences.",
    "Third-party data is supplied by brokers or added as a layer by a DMP vendor, and it trades away accuracy for the ability to reach a much bigger audience.",
  ],
  checkYourself: [
    {
      question:
        "A luxury travel brand buys a list of high-income airline passengers directly from the airline. What kind of data is this for the travel brand?",
      answer: (
        <p>
          Second-party data. It was the airline's first-party data, and the travel brand obtained it
          through a partnership or purchase rather than collecting it directly.
        </p>
      ),
    },
    {
      question:
        "A DMP vendor adds an inferred income group to your audience profiles, sourced from a credit scoring agency. What kind of data is this, and what is its main advantage despite ranking last in value?",
      answer: (
        <p>
          Third-party data. Its main advantage is reach — it lets you address a much bigger audience
          than first-party or second-party data alone could cover.
        </p>
      ),
    },
    {
      question:
        "If second-party data expands your reach to new, relevant audiences, why do most teams still treat first-party data as more valuable?",
      answer: (
        <p>
          Because it comes from people who actually engaged with your own brand — known customers,
          not someone else's. A partner's audience may share behaviors or interests with yours, but it
          was never collected from your own relationship with those people.
        </p>
      ),
    },
  ],
};

export default lesson;

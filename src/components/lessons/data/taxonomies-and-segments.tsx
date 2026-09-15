import { useState } from "react";

import type { LessonContent } from "@/components/journey/lesson-content";
import { cn } from "@/lib/utils";

const TAXONOMY_TERMS = ["User", "Visitor", "Customer", "Subscriber", "Lead"];
const TAXONOMY_POOL = 10000;

interface Condition {
  id: string;
  label: string;
  mult: number;
}

const CONDITIONS: Condition[] = [
  { id: "geo", label: "Country: United States", mult: 0.4 },
  { id: "device", label: "Device type: mobile", mult: 0.55 },
  { id: "referral", label: "Referral URL: paid search campaign", mult: 0.15 },
  { id: "demo", label: "Annual income: $60k–$90k", mult: 0.3 },
];

const FREQUENCIES = [
  { times: 1, mult: 0.8, relevance: -15 },
  { times: 3, mult: 0.35, relevance: 15 },
  { times: 5, mult: 0.12, relevance: 40 },
];

const RECENCIES = [
  { days: 7, mult: 0.5, relevance: 15 },
  { days: 30, mult: 1, relevance: 0 },
  { days: 90, mult: 1.7, relevance: -15 },
];

const BASE_POOL = 500000;
const EXCLUDE_MULT = 0.85;

function Body() {
  const [merged, setMerged] = useState(false);

  const [active, setActive] = useState<string[]>([]);
  const [frequencyIndex, setFrequencyIndex] = useState(0);
  const [recencyIndex, setRecencyIndex] = useState(1);
  const [exclude, setExclude] = useState(false);

  function toggleCondition(id: string) {
    setActive((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  const frequency = FREQUENCIES[frequencyIndex];
  const recency = RECENCIES[recencyIndex];

  const conditionMult = CONDITIONS.filter((c) => active.includes(c.id)).reduce((m, c) => m * c.mult, 1);
  const rawSize = BASE_POOL * conditionMult * frequency.mult * recency.mult * (exclude ? EXCLUDE_MULT : 1);
  const audienceSize = Math.max(1, Math.min(BASE_POOL, Math.round(rawSize)));
  const scopePct = Math.round((audienceSize / BASE_POOL) * 100);
  const relevance = Math.max(0, Math.min(100, Math.round(50 + frequency.relevance + recency.relevance)));

  return (
    <div className="space-y-8">
      <div className="measure space-y-4 text-muted-foreground">
        <p>
          Taxonomy, in a DMP, is just the naming convention used for a piece of data. Instead of
          maintaining two separate taxonomies like "user" and "visitor", you can define one taxonomy —
          say, "user" — that represents both. An ecommerce store might carry several overlapping terms
          for the same person at different stages of the relationship — user, visitor, customer,
          subscriber, lead — and every one it fails to collapse into a single taxonomy is a place its
          audience can quietly split in two.
        </p>
      </div>

      <section>
        <h3 className="mb-1 text-lg text-foreground">One naming problem, first</h3>
        <p className="measure mb-4 text-sm text-muted-foreground">
          The same <span className="figure">{TAXONOMY_POOL.toLocaleString()}</span> people, tagged by
          two rival taxonomies that both mean "someone who came to the site."
        </p>

        <div className="flex flex-wrap gap-2" role="group" aria-label="These terms mean the same thing">
          {TAXONOMY_TERMS.map((term) => (
            <span key={term} className="rounded-full border border-border bg-secondary px-3 py-1 text-sm text-foreground">
              {term}
            </span>
          ))}
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {!merged ? (
            <>
              <div className="rounded-lg border border-border bg-card p-4">
                <p className="text-xs uppercase text-muted-foreground">Taxonomy: "user"</p>
                <p className="mt-1 text-foreground">
                  <span className="figure text-2xl">{Math.round(TAXONOMY_POOL * 0.6).toLocaleString()}</span>
                </p>
              </div>
              <div className="rounded-lg border border-border bg-card p-4">
                <p className="text-xs uppercase text-muted-foreground">Taxonomy: "visitor"</p>
                <p className="mt-1 text-foreground">
                  <span className="figure text-2xl">{Math.round(TAXONOMY_POOL * 0.4).toLocaleString()}</span>
                </p>
              </div>
            </>
          ) : (
            <div className="rounded-lg border border-border bg-card p-4 sm:col-span-2">
              <p className="text-xs uppercase text-muted-foreground">Taxonomy: "user"</p>
              <p className="mt-1 text-foreground">
                <span className="figure text-2xl">{TAXONOMY_POOL.toLocaleString()}</span>
              </p>
            </div>
          )}
        </div>

        <p className="measure mt-3 text-sm text-muted-foreground">
          {merged
            ? "Same people, one taxonomy — nothing about the audience changed, only how it was named."
            : "These might well be the same 10,000 people, split into two undersized segments by an accident of labeling."}
        </p>

        <button
          type="button"
          onClick={() => setMerged((m) => !m)}
          className={cn(
            "mt-3 min-h-[2.75rem] rounded-lg border px-4 text-sm transition-colors",
            merged
              ? "border-border text-muted-foreground hover:text-foreground"
              : "border-primary bg-primary/10 text-foreground"
          )}
        >
          {merged ? "Split the taxonomies again" : "Merge the taxonomies"}
        </button>
      </section>

      <div className="measure space-y-4 text-muted-foreground">
        <p>
          Audience segmentation groups users by shared characteristics — age, location, behavior,
          interests — and those segments are the foundation for activation: ad targeting,
          personalization, and analytics. A DMP builds a segment from a series of conditions across
          three families: general information such as country, region or city, device type, operating
          system, and referral URL; behavioral signals such as events like button clicks and page
          views, conversions like downloads and purchases, and ads viewed; and demographics such as
          relationship status, interests, age group, gender, home value, and annual income. Advertisers
          then combine multiple segments to target exactly the audience they want.
        </p>
        <p>
          Beyond choosing who to include, you can also exclude users, and set the recency and
          frequency of a qualifying action — for instance, users who viewed the website at least{" "}
          <span className="figure">5</span> times in the past <span className="figure">30</span> days.
          These two settings trade off relevance against scope: raising the frequency required adds
          users who are highly engaged and likely to convert, while extending the time frame and
          lowering the frequency broadens the scope of the audience — useful for brand awareness, but
          not for driving conversions.
        </p>
      </div>

      <section>
        <h3 className="mb-1 text-lg text-foreground">Try it</h3>
        <p className="measure mb-4 text-sm text-muted-foreground">
          Build a segment out of a <span className="figure">{BASE_POOL.toLocaleString()}</span>-person
          pool, and watch relevance and scope move against each other.
        </p>

        <div className="flex flex-wrap gap-2" role="group" aria-label="Add a general or demographic condition">
          {CONDITIONS.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => toggleCondition(c.id)}
              aria-pressed={active.includes(c.id)}
              className={cn(
                "min-h-[2.75rem] rounded-lg border px-4 text-sm transition-colors",
                active.includes(c.id)
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border text-muted-foreground hover:text-foreground"
              )}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className="mt-4">
          <p className="text-xs uppercase text-muted-foreground">
            Behavioral: viewed the product page this often, in the past this many days
          </p>
          <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Set frequency">
            {FREQUENCIES.map((f, i) => (
              <button
                key={f.times}
                type="button"
                onClick={() => setFrequencyIndex(i)}
                aria-pressed={frequencyIndex === i}
                className={cn(
                  "min-h-[2.75rem] rounded-lg border px-4 text-sm transition-colors",
                  frequencyIndex === i
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border text-muted-foreground hover:text-foreground"
                )}
              >
                At least <span className="figure">{f.times}</span> time{f.times === 1 ? "" : "s"}
              </button>
            ))}
          </div>
          <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Set recency">
            {RECENCIES.map((r, i) => (
              <button
                key={r.days}
                type="button"
                onClick={() => setRecencyIndex(i)}
                aria-pressed={recencyIndex === i}
                className={cn(
                  "min-h-[2.75rem] rounded-lg border px-4 text-sm transition-colors",
                  recencyIndex === i
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border text-muted-foreground hover:text-foreground"
                )}
              >
                In the past <span className="figure">{r.days}</span> days
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setExclude((e) => !e)}
          aria-pressed={exclude}
          className={cn(
            "mt-4 min-h-[2.75rem] rounded-lg border px-4 text-sm transition-colors",
            exclude
              ? "border-primary bg-primary/10 text-foreground"
              : "border-border text-muted-foreground hover:text-foreground"
          )}
        >
          Exclude: already purchased
        </button>

        <div className="mt-4 rounded-lg border border-border bg-card p-5">
          <p className="text-xs uppercase text-muted-foreground">Segment size</p>
          <p className="mt-1 text-foreground">
            <span className="figure text-2xl">{audienceSize.toLocaleString()}</span>
            <span className="text-muted-foreground"> people</span>
          </p>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs uppercase text-muted-foreground">
                Scope <span className="figure">{scopePct}%</span>
              </p>
              <div className="mt-1 h-2 rounded-full bg-secondary">
                <div className="h-2 rounded-full bg-primary" style={{ width: `${scopePct}%` }} />
              </div>
            </div>
            <div>
              <p className="text-xs uppercase text-muted-foreground">
                Relevance <span className="figure">{relevance}%</span>
              </p>
              <div className="mt-1 h-2 rounded-full bg-secondary">
                <div className="h-2 rounded-full bg-primary" style={{ width: `${relevance}%` }} />
              </div>
            </div>
          </div>

          <p className="measure mt-4 text-sm text-muted-foreground">
            Raise the frequency and tighten the recency, and scope falls while relevance climbs —
            fewer people, but each one more likely to convert. Loosen both, and it runs the other way.
          </p>
        </div>
      </section>
    </div>
  );
}

const lesson: LessonContent = {
  whyThisMatters: (
    <p>
      Your team defines "user" one way in the CRM and "visitor" another way in analytics, and a
      campaign meant to reach 200,000 people quietly reaches half that, because the DMP thinks they
      are two different populations. A taxonomy is the boring fix for an expensive bug.
    </p>
  ),
  objectives: [
    "Explain what a data taxonomy is, and how mismatched taxonomies fragment an audience",
    "Name the three families of conditions a DMP segment can be built from",
    "Explain the trade-off between a segment's relevance and its scope",
  ],
  Body,
  takeaways: [
    "A taxonomy is just the naming convention a DMP uses for a piece of data — two labels for the same thing quietly split one audience into two undersized segments.",
    "A DMP builds a segment from three kinds of conditions — general information, behavioral signals, and demographics — and advertisers combine several segments at once.",
    "Recency and frequency trade relevance against scope: tightening them narrows a segment to highly engaged, likely-to-convert users, while loosening them broadens it for brand awareness.",
  ],
  checkYourself: [
    {
      question: "Your DMP has separate taxonomies for \"user\" and \"visitor\" that actually describe the same people. What does merging them into one taxonomy fix?",
      answer: (
        <p>
          It repairs the audience back to its true size and improves segmentation accuracy — the
          people were never really split, only their label was.
        </p>
      ),
    },
    {
      question:
        "You raise a segment's frequency requirement from \"viewed once\" to \"viewed 5 times in the past 30 days.\" What happens to its size and its likely conversion rate?",
      answer: (
        <p>
          The segment gets smaller, but the people left in it are more engaged and more likely to
          convert — you traded scope for relevance.
        </p>
      ),
    },
    {
      question: "Can a DMP segment remove people as well as add them?",
      answer: (
        <p>
          Yes. Alongside the conditions that include users, you can add exclusion filters to remove
          users from a segment.
        </p>
      ),
    },
  ],
};

export default lesson;

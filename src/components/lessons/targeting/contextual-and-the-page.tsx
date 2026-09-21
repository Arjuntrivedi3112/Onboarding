import { useState } from "react";

import { IqmSpotlight } from "@/components/journey/IqmSpotlight";
import type { LessonContent } from "@/components/journey/lesson-content";
import { cn } from "@/lib/utils";

interface Tier2Node {
  name: string;
  tier3: string[];
}

interface Tier1Node {
  tier1: string;
  tier2: Tier2Node[];
}

interface Selection {
  tier1: string;
  tier2: string;
  tier3: string;
}

/**
 * Four sample verticals from the Interactive Advertising Bureau (IAB) content
 * taxonomy, tier 1 through tier 3. The book names the taxonomy but does not
 * print these trees — they are a worked illustration of the tiered structure.
 */
const TAXONOMY: Tier1Node[] = [
  {
    tier1: "Technology and computing",
    tier2: [
      {
        name: "Consumer electronics",
        tier3: ["Smartphones", "Wearable technology", "Home entertainment systems"],
      },
      { name: "Computing", tier3: ["Laptops", "Computer peripherals", "Data storage"] },
    ],
  },
  {
    tier1: "Automotive",
    tier2: [
      { name: "Auto body styles", tier3: ["SUVs", "Sedans", "Pickup trucks"] },
      { name: "Auto type", tier3: ["Budget cars", "Luxury cars", "Green vehicles"] },
    ],
  },
  {
    tier1: "Sports",
    tier2: [
      { name: "Soccer", tier3: ["World Cup", "Club soccer"] },
      { name: "Motorsports", tier3: ["Auto racing", "Motorcycle sports"] },
    ],
  },
  {
    tier1: "Travel",
    tier2: [
      { name: "Travel type", tier3: ["Family travel", "Business travel", "Adventure travel"] },
      { name: "Travel locations", tier3: ["Europe travel", "Asia travel", "Beach travel"] },
    ],
  },
];

const HOW_IT_WORKS = [
  "A web crawler scans URLs and categorizes the content and the ad placements on the page.",
  "When a visitor accesses the website, the information associated with that URL is passed to the ad server via the ad request.",
  "The ad request and its contextual information are passed on to other AdTech platforms, such as ad exchanges and supply-side platforms (SSPs).",
  "The ad exchanges and SSPs relay this information to demand-side platforms (DSPs), which bid on the impression.",
  "The winning DSP sends its ad back to the publisher, which displays it to the visitor.",
];

const BENEFITS = [
  "Most contextual ads do not rely on personal data, which helps advertisers and publishers reduce their exposure to privacy regulation such as the General Data Protection Regulation (GDPR).",
  "Contextual ads can offer safer brand protection.",
  "They are proven to increase purchase intent.",
  "They are found to be less unnerving than behaviorally targeted ads, while still reflecting a reader's interests — for example, showing smartphone-plan ads to people reading an article about smartphones.",
];

function Body() {
  const [mode, setMode] = useState<"buy" | "block">("buy");
  const [expandedTier1, setExpandedTier1] = useState<string | null>(TAXONOMY[0].tier1);
  const [expandedTier2, setExpandedTier2] = useState<string | null>(null);
  const [selected, setSelected] = useState<Selection | null>(null);

  const toggleTier1 = (name: string) => {
    setExpandedTier1((prev) => (prev === name ? null : name));
    setExpandedTier2(null);
  };
  const toggleTier2 = (name: string) => {
    setExpandedTier2((prev) => (prev === name ? null : name));
  };

  return (
    <div className="space-y-8">
      <div className="measure space-y-4 text-muted-foreground">
        <p>
          Contextual targeting displays ads that are relevant to a website's content rather than
          relying on visitor data. The approach has long been common in traditional media, such as
          magazines and newspapers, and continues to be effective online. Advertisers and
          publishers often use it on its own or alongside other targeting methods, since it is
          particularly effective for content tied to a specific topic or theme.
        </p>
      </div>

      <IqmSpotlight>
        IQM built a proprietary natural language processing tool for exactly this: it reads a
        page's actual content to gauge topical relevance, rather than relying only on
        publisher-supplied category tags — useful anywhere the declared category and the real
        content can drift apart.
      </IqmSpotlight>

      <section>
        <h3 className="mb-3 text-lg text-foreground">How contextual targeting works</h3>
        <ol className="space-y-2">
          {HOW_IT_WORKS.map((step, index) => (
            <li key={step} className="flex gap-3 text-muted-foreground">
              <span className="figure shrink-0 text-sm text-muted-foreground">{index + 1}.</span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </section>

      <section>
        <h3 className="mb-3 text-lg text-foreground">Benefits of contextual targeting</h3>
        <ul className="grid gap-2 sm:grid-cols-2">
          {BENEFITS.map((benefit) => (
            <li key={benefit} className="rounded-lg border border-border bg-card p-3">
              <span className="text-sm text-muted-foreground">{benefit}</span>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3 className="mb-3 text-lg text-foreground">Three more ways to read the page</h3>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-foreground">Keywords</p>
            <p className="measure mt-1 text-sm text-muted-foreground">
              An ad server learns a page's keywords from tags the editor applied to highlight the
              key topics, or by extracting them with JavaScript or server-side crawling. The
              keywords are passed to the ad tag, so the ad server receives them in the ad request
              and uses them when deciding which ad to serve — for example, targeting readers of
              articles containing "smartphone" or "mobile phone."
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-foreground">Ad slot and ad position</p>
            <p className="measure mt-1 text-sm text-muted-foreground">
              Advertisers can also target a specific creative size or location on a page — a{" "}
              <span className="figure">728×90</span> px banner positioned at the top, say. This
              form of targeting is fairly broad, so it is typically combined with other methods.
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-foreground">Publisher's URL</p>
            <p className="measure mt-1 text-sm text-muted-foreground">
              Targeting specific domains, URLs or sections of a site works much like buying space
              in print media. It lets an advertiser reach a broad range of consumers based on
              their interests, rather than on demographic information such as age or gender.
            </p>
          </div>
        </div>
      </section>

      <section>
        <h3 className="mb-1 text-lg text-foreground">The IAB content taxonomy</h3>
        <p className="measure mb-4 text-sm text-muted-foreground">
          The IAB provides a standard for categorizing websites, called content taxonomy. It gives
          buyers and sellers a shared vocabulary for describing what a page is about. Advertisers
          can purchase ad space based on the categories supplied in the ad request, and can also
          choose not to show ads on sites that fall under certain categories. The taxonomy is a
          hierarchy: a broad tier 1 category contains narrower tier 2 subcategories, which in turn
          contain tier 3 topics — a buyer picks the tier that matches how precise it wants to be.
        </p>
      </section>

      <section>
        <h3 className="mb-1 text-lg text-foreground">Try it</h3>
        <p className="measure mb-4 text-sm text-muted-foreground">
          Choose whether your campaign is buying or blocking on category, then drill down through
          tier 1 to tier 2 to tier 3 and select a topic to see how the same taxonomy reads in
          either direction.
        </p>

        <div className="flex flex-wrap gap-2" role="group" aria-label="Choose how to use the category">
          <button
            type="button"
            onClick={() => setMode("buy")}
            aria-pressed={mode === "buy"}
            className={cn(
              "min-h-[2.75rem] rounded-lg border px-4 text-sm transition-colors",
              mode === "buy"
                ? "border-primary bg-primary/10 text-foreground"
                : "border-border text-muted-foreground hover:text-foreground"
            )}
          >
            Buy this category
          </button>
          <button
            type="button"
            onClick={() => setMode("block")}
            aria-pressed={mode === "block"}
            className={cn(
              "min-h-[2.75rem] rounded-lg border px-4 text-sm transition-colors",
              mode === "block"
                ? "border-primary bg-primary/10 text-foreground"
                : "border-border text-muted-foreground hover:text-foreground"
            )}
          >
            Block this category
          </button>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="space-y-2">
            {TAXONOMY.map((category) => (
              <div key={category.tier1} className="rounded-lg border border-border bg-card">
                <button
                  type="button"
                  onClick={() => toggleTier1(category.tier1)}
                  aria-expanded={expandedTier1 === category.tier1}
                  className={cn(
                    "min-h-[2.75rem] w-full rounded-lg px-4 text-left text-sm transition-colors",
                    expandedTier1 === category.tier1
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <span>{category.tier1}</span>
                  <span className="ml-2 text-xs uppercase text-muted-foreground">Tier 1</span>
                </button>

                {expandedTier1 === category.tier1 && (
                  <div className="space-y-2 px-3 pb-3">
                    {category.tier2.map((sub) => (
                      <div key={sub.name} className="rounded-lg bg-muted/50">
                        <button
                          type="button"
                          onClick={() => toggleTier2(sub.name)}
                          aria-expanded={expandedTier2 === sub.name}
                          className={cn(
                            "min-h-[2.75rem] w-full px-3 text-left text-sm transition-colors",
                            expandedTier2 === sub.name
                              ? "text-primary"
                              : "text-muted-foreground hover:text-foreground"
                          )}
                        >
                          <span>{sub.name}</span>
                          <span className="ml-2 text-xs uppercase text-muted-foreground">
                            Tier 2
                          </span>
                        </button>

                        {expandedTier2 === sub.name && (
                          <ul className="space-y-1 px-3 pb-2">
                            {sub.tier3.map((leaf) => (
                              <li key={leaf}>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setSelected({ tier1: category.tier1, tier2: sub.name, tier3: leaf })
                                  }
                                  aria-pressed={selected?.tier3 === leaf}
                                  className={cn(
                                    "min-h-[2.75rem] w-full rounded-md px-2 text-left text-sm transition-colors",
                                    selected?.tier3 === leaf
                                      ? "bg-primary/10 text-foreground"
                                      : "text-muted-foreground hover:text-foreground"
                                  )}
                                >
                                  {leaf}
                                  <span className="ml-2 text-xs uppercase text-muted-foreground/70">
                                    Tier 3
                                  </span>
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="rounded-lg border border-border bg-card p-5">
            <p className="text-xs uppercase text-muted-foreground">What the ad request carries</p>
            {selected === null ? (
              <p className="measure mt-2 text-sm text-muted-foreground">
                Select a tier 3 topic on the left to see how it would apply to a campaign.
              </p>
            ) : (
              <>
                <p className="measure mt-2 text-foreground">
                  {selected.tier1} → {selected.tier2} → {selected.tier3}
                </p>
                <p className="measure mt-3 text-sm text-muted-foreground">
                  {mode === "buy" ? (
                    <>
                      Buying on this category means the campaign targets every page the crawler has
                      classified under <span className="text-foreground">{selected.tier3}</span>,
                      without the buyer ever naming an individual URL.
                    </>
                  ) : (
                    <>
                      Blocking on this category means the campaign is kept off every page classified
                      under <span className="text-foreground">{selected.tier3}</span> — the same
                      standard, run in reverse, to protect the brand.
                    </>
                  )}
                </p>
              </>
            )}
          </div>
        </div>
      </section>

      <div className="measure space-y-4 text-muted-foreground">
        <p>
          Contextual, keyword, ad-slot, publisher-URL and IAB-category targeting all read the same
          source: the page, not the person. That is what makes them the least invasive methods in
          this section, and also why they are so often layered together rather than used alone.
        </p>
      </div>
    </div>
  );
}

const lesson: LessonContent = {
  whyThisMatters: (
    <p>
      A client asks why their smartphone ad is running on a recipe blog. The answer is almost
      always contextual targeting gone wrong — the wrong keyword, the wrong IAB category, or a
      publisher's URL that reads differently than expected. Knowing how the page becomes a
      targeting signal is what lets you diagnose that instead of just apologizing for it.
    </p>
  ),
  objectives: [
    "Explain the five steps that turn a page's content into a targeting signal in the ad request",
    "Name at least three benefits of contextual targeting over targeting based on visitor data",
    "Use the IAB content taxonomy's tier structure to buy or block a category rather than a URL",
  ],
  Body,
  takeaways: [
    "Contextual targeting matches ads to what the page is about, not who is reading it, using a crawler-assigned category, keywords, ad slot, or publisher URL.",
    "Because it does not rely on personal data, contextual targeting carries less privacy exposure and is judged less unnerving than behaviorally targeted ads, while still increasing purchase intent.",
    "The IAB content taxonomy is a tiered vocabulary — tier 1 down to tier 3 — that lets a buyer target or block a whole category of pages instead of naming individual URLs.",
  ],
  checkYourself: [
    {
      question:
        "An advertiser wants to keep its ads off gambling-related content without naming every offending site. What targeting method solves this, and how?",
      answer: (
        <p>
          The IAB content taxonomy, used as a block list. The same category standard that lets a
          buyer target pages works in reverse: choosing a tier 1 or tier 2 category to exclude
          keeps the brand off every page the crawler has classified into it, present and future,
          without maintaining a URL list by hand.
        </p>
      ),
    },
    {
      question:
        "A publisher's page has no editor-applied tags at all. Can contextual targeting still work on it?",
      answer: (
        <p>
          Often yes. When on-page tags are not available, keywords can still be extracted with
          JavaScript or server-side crawling and passed to the ad tag the same way, so the ad
          server receives them in the ad request and can use them in decisioning regardless of
          whether an editor tagged the page.
        </p>
      ),
    },
  ],
};

export default lesson;

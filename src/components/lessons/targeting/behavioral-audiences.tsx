import { useState } from "react";

import type { LessonContent } from "@/components/journey/lesson-content";
import { cn } from "@/lib/utils";

type Stage = "collection" | "creation" | "application";

interface StageInfo {
  id: Stage;
  step: number;
  title: string;
  summary: string;
  detail: string[];
  output: string;
}

const STAGES: StageInfo[] = [
  {
    id: "collection",
    step: 1,
    title: "Data collection",
    summary:
      "Advertisers, publishers and data management platforms (DMPs) collect data about the actions users carry out across different websites.",
    detail: [
      "This data is often called event data, and includes page views, product views, products purchased, and other interactions on a website or mobile app.",
      "Events are tied together via identifiers stored inside third-party and first-party cookies in web browsers, or mobile IDs in mobile apps.",
      "User profiles consolidate each user's event data, and identifiers such as cookie IDs or mobile device IDs link future activity back to the same profile.",
    ],
    output: "Output: a persistent user profile that new event data is correctly assigned to.",
  },
  {
    id: "creation",
    step: 2,
    title: "Audience creation",
    summary:
      "Advertisers and publishers then create audiences made up of individual user profiles that share a set of behavioral traits.",
    detail: [
      "An audience is defined by a set of behavioral rules applied to those profiles.",
      "The book's own example: people who have viewed a given product more than three times a month, signed up for the newsletter, and visited the website at least fifteen times in the past sixty days.",
    ],
    output: "Output: a reusable, addressable audience segment.",
  },
  {
    id: "application",
    step: 3,
    title: "Application of data",
    summary: "The advertiser then uses those audiences for ad targeting in its online media campaigns.",
    detail: [
      "Ads become more relevant to the users who see them.",
      "Relevance increases the chances of those users converting — for example, purchasing a product.",
    ],
    output: "Output: more relevant impressions, and a higher likelihood of conversion.",
  },
];

const DATA_TYPES = [
  "Pages viewed",
  "Previous search terms",
  "Amount of time spent on a website",
  "Ads and buttons clicked",
  "Content viewed and downloaded",
  "Purchases",
  "Date of the last website visit",
  "Other interactions with various websites",
];

interface AudienceRule {
  id: string;
  label: string;
  fraction: number;
}

/**
 * The book's own audience-creation example, cut into three toggleable rules.
 * Each fraction is a fixed share of the base pool that matches the rule —
 * deterministic, not a random walk, so the same combination always narrows
 * the audience to the same count.
 */
const RULES: AudienceRule[] = [
  { id: "views", label: "Viewed the product more than three times this month", fraction: 0.18 },
  { id: "newsletter", label: "Signed up for the newsletter", fraction: 0.35 },
  { id: "visits", label: "Visited the site fifteen or more times in the past sixty days", fraction: 0.22 },
];

const BASE_PROFILES = 250_000;

function Body() {
  const [activeStage, setActiveStage] = useState<Stage>("collection");
  const stage = STAGES.find((s) => s.id === activeStage) ?? STAGES[0];

  const [activeRules, setActiveRules] = useState<string[]>([]);
  const toggleRule = (id: string) => {
    setActiveRules((prev) => (prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]));
  };
  const matching = Math.max(
    1,
    Math.round(
      RULES.filter((rule) => activeRules.includes(rule.id)).reduce(
        (count, rule) => count * rule.fraction,
        BASE_PROFILES
      )
    )
  );

  return (
    <div className="space-y-8">
      <div className="measure space-y-4 text-muted-foreground">
        <p>
          Behavioral targeting — also known as online behavioral advertising (OBA) — lets
          advertisers and publishers display relevant ads based on a user's web-browsing behavior.
          The data types collected for it include:
        </p>
      </div>

      <ul className="grid gap-2 sm:grid-cols-2">
        {DATA_TYPES.map((item) => (
          <li key={item} className="rounded-lg border border-border bg-card p-3 text-sm text-muted-foreground">
            {item}
          </li>
        ))}
      </ul>

      <section>
        <h3 className="mb-1 text-lg text-foreground">From raw events to a targetable audience</h3>
        <p className="measure mb-4 text-sm text-muted-foreground">
          That raw data becomes something targetable in three stages. Select a stage to see what
          happens inside it.
        </p>

        <div className="flex flex-wrap gap-2" role="group" aria-label="Choose a pipeline stage">
          {STAGES.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setActiveStage(s.id)}
              aria-pressed={activeStage === s.id}
              className={cn(
                "min-h-[2.75rem] flex-1 rounded-lg border px-4 text-left text-sm transition-colors",
                activeStage === s.id
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border text-muted-foreground hover:text-foreground"
              )}
            >
              <span className="block text-xs uppercase text-muted-foreground">
                Stage <span className="figure">{s.step}</span>
              </span>
              <span>{s.title}</span>
            </button>
          ))}
        </div>

        <div className="mt-4 rounded-lg border border-border bg-card p-5">
          <p className="text-foreground">
            <span className="figure">{stage.step}</span>. {stage.title}
          </p>
          <p className="measure mt-1 text-sm text-muted-foreground">{stage.summary}</p>

          <ul className="mt-4 space-y-2">
            {stage.detail.map((line, index) => (
              <li key={line} className="flex gap-3 text-sm text-muted-foreground">
                <span className="figure mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs text-primary">
                  {index + 1}
                </span>
                <span className="measure">{line}</span>
              </li>
            ))}
          </ul>

          <p className="measure mt-4 rounded-lg bg-muted/50 p-3 text-sm text-primary">{stage.output}</p>

          {stage.id === "creation" && (
            <div className="mt-5 border-t border-border pt-4">
              <p className="measure mb-3 text-sm text-muted-foreground">
                Toggle the book's own rules and watch how many of the {" "}
                <span className="figure">{BASE_PROFILES.toLocaleString()}</span> starting profiles
                still match as each condition is added.
              </p>
              <div className="flex flex-wrap gap-2" role="group" aria-label="Toggle audience rules">
                {RULES.map((rule) => (
                  <button
                    key={rule.id}
                    type="button"
                    onClick={() => toggleRule(rule.id)}
                    aria-pressed={activeRules.includes(rule.id)}
                    className={cn(
                      "min-h-[2.75rem] rounded-full border px-3 text-sm transition-colors",
                      activeRules.includes(rule.id)
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border text-muted-foreground hover:border-primary/50"
                    )}
                  >
                    {rule.label}
                  </button>
                ))}
              </div>

              <div className="mt-4 flex items-center gap-4">
                <div className="h-4 flex-1 overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${(matching / BASE_PROFILES) * 100}%` }}
                  />
                </div>
                <div className="text-right">
                  <p className="figure text-2xl text-primary">{matching.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">matching profiles</p>
                </div>
              </div>
              {activeRules.length >= 2 && matching < BASE_PROFILES * 0.05 && (
                <p className="measure mt-3 text-sm text-muted-foreground">
                  This audience is now small enough that a campaign could struggle to spend its
                  daily budget against it — a problem the pacing lesson covers next.
                </p>
              )}
            </div>
          )}
        </div>
      </section>

      <div className="measure space-y-4 text-muted-foreground">
        <p>
          The vast amount of data available to marketers enables them to build highly detailed
          user profiles and deliver ads tailored to each audience segment. The core idea behind
          behavioral targeting is mutual benefit — users see ads that match their interests, while
          websites improve engagement and overall user experience.
        </p>
        <p>
          However, online users have become aware of how online advertising companies collect and
          use their data, which has made some users concerned about this type of targeting and
          contributed to the rise of ad-blocking software.
        </p>
      </div>
    </div>
  );
}

const lesson: LessonContent = {
  whyThisMatters: (
    <p>
      When a targeting brief says "people likely to buy again," someone has to turn that sentence
      into rules a platform can evaluate. Knowing the three stages between a raw click and a usable
      audience is what lets you build that rule set instead of guessing at it.
    </p>
  ),
  objectives: [
    "Name the three stages that turn browsing events into a targetable audience",
    "List at least four types of data collected for behavioral targeting",
    "Explain the mutual-benefit argument for behavioral targeting, and the concern it has provoked",
  ],
  Body,
  takeaways: [
    "Behavioral targeting, or online behavioral advertising (OBA), targets users on their web-browsing behavior — pages viewed, searches, time on site, purchases and more.",
    "Raw events become a targetable audience in three stages: data collection builds a persistent user profile, audience creation groups profiles by behavioral rules, and application of data uses that audience as live campaign targeting.",
    "The benefit is mutual — more relevant ads for users, better engagement for sites — but rising awareness of data collection has fueled concern and ad-blocking software.",
  ],
  checkYourself: [
    {
      question:
        "A profile shows three product views this month but no newsletter signup and only four site visits in sixty days. Does it match the book's example audience?",
      answer: (
        <p>
          No. The example audience requires all three conditions at once — three-plus views a
          month, a newsletter signup, and fifteen-plus visits in sixty days. A profile meeting only
          one condition belongs to a different, broader audience, not this one.
        </p>
      ),
    },
    {
      question: "What ties a user's behavior across multiple visits back to the same profile?",
      answer: (
        <p>
          Identifiers stored in first-party and third-party cookies on the web, or mobile IDs
          inside apps. Whichever identifier is present links new event data to the existing
          profile, which is exactly what a cookie block or an ad blocker interrupts.
        </p>
      ),
    },
  ],
};

export default lesson;

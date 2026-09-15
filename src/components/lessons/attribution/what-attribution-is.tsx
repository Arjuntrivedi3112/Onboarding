import { useState } from "react";

import type { LessonContent } from "@/components/journey/lesson-content";
import { cn } from "@/lib/utils";

type Scope = "inter" | "intra";

interface JourneyQuiz {
  id: string;
  chain: string[];
  correct: Scope;
  explanation: string;
}

const QUIZZES: JourneyQuiz[] = [
  {
    id: "clean-inter",
    chain: ["Display ad", "Social ad", "Paid search"],
    correct: "inter",
    explanation:
      "Every hop moves to a different channel — display, then social, then paid search — so this whole journey is inter-channel.",
  },
  {
    id: "clean-intra",
    chain: ["Display — site A", "Display — site B", "Display — site C"],
    correct: "intra",
    explanation:
      "All three touchpoints are the same channel, just different placements. Comparing them to each other is intra-channel.",
  },
  {
    id: "mixed",
    chain: ["Display ad", "Display ad — a different site", "Social ad"],
    correct: "inter",
    explanation:
      "This one is a trick: the first hop is intra-channel (display to display), but the journey as a whole ends on a different channel than it started, so it is classified inter-channel. A single real journey can contain both kinds of hop — the label describes the comparison you are making, not a property of the journey itself.",
  },
];

function Body() {
  const [openId, setOpenId] = useState<string | null>(null);
  const [guesses, setGuesses] = useState<Record<string, Scope>>({});

  const guess = (id: string, scope: Scope) => {
    setGuesses((g) => ({ ...g, [id]: scope }));
    setOpenId(id);
  };

  return (
    <div className="space-y-8">
      <div className="measure space-y-4 text-muted-foreground">
        <p>
          Attribution is the process of identifying which touchpoints a consumer interacted with,
          or was exposed to, before they completed a goal that an advertiser or marketer set —
          usually a purchase, a sign-up, or a download. Once you know that, you can make
          improvements to a campaign by understanding which touchpoints are working and which
          aren't.
        </p>
        <p>
          Attribution itself is not new — advertisers have always tried to figure out what made a
          sale happen. What is new is the data and technology available today, which is what lets
          advertisers and marketers attribute conversions far more accurately than they used to.
        </p>
      </div>

      <section className="rounded-lg border border-border bg-card p-5">
        <p className="text-sm uppercase text-muted-foreground">Case study</p>
        <h3 className="mt-1 text-lg text-foreground">TV ad analytics platform</h3>
        <p className="measure mt-2 text-muted-foreground">
          One team built a solution to measure TV ad impact on web traffic and conversions —
          something a browser-based referrer can never see on its own, since nobody clicks a
          television. The client's media agency gained next-day insights and handled hundreds of
          thousands of visits daily. There were two primary components to the solution: a
          cookie-less tracking technology, and a web analytics platform to make sense of what it
          collected.
        </p>
      </section>

      <div className="measure space-y-4 text-muted-foreground">
        <p>
          Since most online ad campaigns aim to drive users to a website, advertisers and marketers
          rely on attribution reports from web analytics tools, MarTech platforms, and AdTech
          platforms to identify which touchpoints a user had before completing a goal — this is
          online-to-online attribution. It splits into two kinds: inter-channel and intra-channel.
        </p>
        <ul className="space-y-2">
          <li className="flex gap-3">
            <span aria-hidden="true" className="mt-2 h-1 w-1 shrink-0 rounded-full bg-primary" />
            <span>
              <span className="text-foreground">Inter-channel</span> attribution looks at
              touchpoints across different channels — a display ad, then a social ad, then a paid
              search click.
            </span>
          </li>
          <li className="flex gap-3">
            <span aria-hidden="true" className="mt-2 h-1 w-1 shrink-0 rounded-full bg-primary" />
            <span>
              <span className="text-foreground">Intra-channel</span> attribution looks at
              touchpoints on the same channel — three separate display placements before the
              conversion.
            </span>
          </li>
        </ul>
      </div>

      <section>
        <h3 className="mb-1 text-lg text-foreground">Try it</h3>
        <p className="measure mb-4 text-sm text-muted-foreground">
          Three journeys. For each one, decide whether comparing its touchpoints is an inter-channel
          or an intra-channel question, then check your answer.
        </p>

        <div className="space-y-4">
          {QUIZZES.map((quiz) => {
            const revealed = openId === quiz.id;
            const picked = guesses[quiz.id];
            return (
              <div key={quiz.id} className="rounded-lg border border-border bg-card p-4">
                <div className="flex flex-wrap items-center gap-2">
                  {quiz.chain.map((step, i) => (
                    <span key={step} className="flex items-center gap-2">
                      <span className="rounded-full bg-secondary px-3 py-1 text-sm text-foreground">
                        {step}
                      </span>
                      {i < quiz.chain.length - 1 && (
                        <span aria-hidden="true" className="text-muted-foreground">
                          →
                        </span>
                      )}
                    </span>
                  ))}
                  <span aria-hidden="true" className="text-muted-foreground">
                    →
                  </span>
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-sm text-primary">
                    Conversion
                  </span>
                </div>

                <div
                  className="mt-3 flex flex-wrap gap-2"
                  role="group"
                  aria-label={`Classify this journey`}
                >
                  {(["inter", "intra"] as const).map((scope) => (
                    <button
                      key={scope}
                      type="button"
                      onClick={() => guess(quiz.id, scope)}
                      aria-pressed={picked === scope}
                      className={cn(
                        "min-h-[2.75rem] rounded-lg border px-4 text-sm transition-colors",
                        picked === scope
                          ? "border-primary bg-primary/10 text-foreground"
                          : "border-border text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {scope === "inter" ? "Inter-channel" : "Intra-channel"}
                    </button>
                  ))}
                </div>

                {revealed && (
                  <p className="measure mt-3 text-sm text-muted-foreground">
                    {picked === quiz.correct ? "Correct. " : "Not quite. "}
                    {quiz.explanation}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

const lesson: LessonContent = {
  whyThisMatters: (
    <p>
      Someone will ask "which channel actually drove that sale," and the honest answer starts with
      what attribution can and cannot claim to know. Before any model or number means anything, you
      need to be able to say whether you are comparing channels against each other or comparing a
      channel against itself — that is the difference between inter-channel and intra-channel
      attribution, and it decides what question you are even answering.
    </p>
  ),
  objectives: [
    "Define attribution in one sentence, tied to a completed goal rather than a click",
    "Explain why data and technology, not attribution itself, are what changed",
    "Classify a customer journey as inter-channel or intra-channel",
  ],
  Body,
  takeaways: [
    "Attribution identifies which touchpoints a consumer interacted with, or was exposed to, before completing an advertiser's goal, so campaigns can be improved.",
    "Attribution has always been part of advertising and marketing — what makes today's attribution more accurate is the data and technology now available to capture and analyze it.",
    "Inter-channel attribution compares touchpoints across different channels, intra-channel attribution compares touchpoints within the same channel, and a single real journey can contain both kinds of hop.",
  ],
  checkYourself: [
    {
      question:
        "A journey is: display ad on site A, display ad on site B, then a paid search click, then conversion. Is the hop from site A to site B inter-channel or intra-channel? What about the hop from site B to paid search?",
      answer: (
        <p>
          Site A to site B is intra-channel — same channel, different placement. Site B to paid
          search is inter-channel — a different channel entirely. Nothing stops one journey from
          containing both kinds of comparison.
        </p>
      ),
    },
    {
      question:
        "Your dashboard only reports online-to-online attribution. The case study above paired cookie-less tracking with a web analytics platform to answer whether a TV spot drove web traffic. What's missing from your dashboard before it could answer that same question?",
      answer: (
        <p>
          A way to connect exposure that happens outside a browser — a TV spot, in this case — to
          what happens afterward inside one. Online-to-online attribution alone has no mechanism
          for that; it is the subject of the offline-to-online lesson later in this section.
        </p>
      ),
    },
  ],
};

export default lesson;

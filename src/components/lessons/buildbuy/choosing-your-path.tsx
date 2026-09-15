import { useState } from "react";

import type { LessonContent } from "@/components/journey/lesson-content";
import { cn } from "@/lib/utils";
import type { StrategyId } from "./_shared";

interface Question {
  id: string;
  question: string;
  answers: { label: string; scores: Record<StrategyId, number> }[];
}

const QUESTIONS: Question[] = [
  {
    id: "maturity",
    question: "What stage is your business at?",
    answers: [
      { label: "Just starting out in AdTech", scores: { rent: 3, buy: 0, build: 0 } },
      { label: "Established, with a clear picture of our needs", scores: { rent: 1, buy: 2, build: 2 } },
      { label: "Mature, with in-house engineering capacity", scores: { rent: 0, buy: 2, build: 3 } },
    ],
  },
  {
    id: "budget",
    question: "What does your budget look like?",
    answers: [
      { label: "Tight — we need low upfront cost", scores: { rent: 3, buy: 0, build: 0 } },
      { label: "Moderate — we can invest, within reason", scores: { rent: 1, buy: 2, build: 2 } },
      { label: "Substantial — upfront investment is acceptable", scores: { rent: 0, buy: 3, build: 3 } },
    ],
  },
  {
    id: "urgency",
    question: "How urgently do you need to launch?",
    answers: [
      { label: "Days or weeks", scores: { rent: 3, buy: 0, build: 0 } },
      { label: "A few months", scores: { rent: 1, buy: 3, build: 1 } },
      { label: "We can wait six-plus months for the right thing", scores: { rent: 0, buy: 1, build: 3 } },
    ],
  },
  {
    id: "control",
    question: "How much long-term strategic control do you need?",
    answers: [
      { label: "Low — a vendor's roadmap is fine", scores: { rent: 3, buy: 0, build: 0 } },
      { label: "High — we need to own features and data", scores: { rent: 0, buy: 3, build: 2 } },
      { label: "Total — the platform is our differentiator", scores: { rent: 0, buy: 1, build: 3 } },
    ],
  },
];

const RECOMMENDATION_COPY: Record<StrategyId, string> = {
  rent: "Start by renting. A SaaS platform gets you live quickly with minimal commitment, and the learning period will tell you what you genuinely need before you invest in anything larger.",
  buy: "Buying looks like the strongest fit. Acquiring an existing platform gets you ownership and roadmap control far faster than building from scratch — budget for the integration work and the retention risk.",
  build: "Building is worth it for you. You have the maturity, budget, and control requirements that justify a custom platform — keep the initial scope narrow so the first version ships in months, not years.",
};

const COLUMN_LABELS: Record<StrategyId, string> = { rent: "Rent", buy: "Buy", build: "Build" };

function Body() {
  const [answers, setAnswers] = useState<Record<string, number>>({});

  const answeredCount = Object.keys(answers).length;
  const allAnswered = answeredCount === QUESTIONS.length;

  const scores = QUESTIONS.reduce(
    (acc, q) => {
      const answerIdx = answers[q.id];
      if (answerIdx === undefined) return acc;
      const picked = q.answers[answerIdx].scores;
      return { rent: acc.rent + picked.rent, buy: acc.buy + picked.buy, build: acc.build + picked.build };
    },
    { rent: 0, buy: 0, build: 0 } as Record<StrategyId, number>
  );

  const winner = (Object.keys(scores) as StrategyId[]).reduce((a, b) =>
    scores[a] >= scores[b] ? a : b
  );
  const maxScore = Math.max(scores.rent, scores.buy, scores.build, 1);

  return (
    <div className="space-y-8">
      <div className="measure space-y-4 text-muted-foreground">
        <p>
          Your choice between rent, buy, and build depends on four things: your stage of business
          maturity, your budget, your urgency to launch, and how much long-term strategic control
          you need. Answer honestly rather than aspirationally — the recommendation is only as good
          as the inputs.
        </p>
      </div>

      <section>
        <h3 className="mb-1 text-lg text-foreground">Try it</h3>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <p className="measure text-sm text-muted-foreground">
            Answer all four questions to see a recommendation and how strongly each path scored.
          </p>
          {answeredCount > 0 && (
            <button
              type="button"
              onClick={() => setAnswers({})}
              className="min-h-[2.75rem] rounded-lg border border-border px-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Start over
            </button>
          )}
        </div>

        <div className="mt-4 space-y-5">
          {QUESTIONS.map((q) => (
            <div key={q.id}>
              <p className="mb-2 text-foreground">{q.question}</p>
              <div className="flex flex-wrap gap-2" role="group" aria-label={q.question}>
                {q.answers.map((a, i) => (
                  <button
                    key={a.label}
                    type="button"
                    onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: i }))}
                    aria-pressed={answers[q.id] === i}
                    className={cn(
                      "min-h-[2.75rem] rounded-lg border px-3 text-left text-sm transition-colors",
                      answers[q.id] === i
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-border text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {allAnswered && (
          <div className="mt-6 rounded-lg border border-primary/30 bg-primary/5 p-5">
            <h4 className="text-foreground">
              Recommended: <span className="text-primary">{COLUMN_LABELS[winner]}</span>
            </h4>

            <div className="mt-4 space-y-2">
              {(["rent", "buy", "build"] as StrategyId[]).map((id) => (
                <div key={id} className="flex items-center gap-3">
                  <span className="w-12 text-xs text-muted-foreground">{COLUMN_LABELS[id]}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-300",
                        id === winner ? "bg-primary" : "bg-muted-foreground/40"
                      )}
                      style={{ width: `${(scores[id] / maxScore) * 100}%` }}
                    />
                  </div>
                  <span className="figure w-6 text-right text-xs text-muted-foreground">
                    {scores[id]}
                  </span>
                </div>
              ))}
            </div>

            <p className="measure mt-4 text-sm text-muted-foreground">
              {RECOMMENDATION_COPY[winner]}
            </p>

            <p className="measure mt-3 text-sm text-muted-foreground">
              Now try changing just one answer — urgency, say, from days to six-plus months — and
              watch the bars move. The recommendation is a weighting of four factors, not a fixed
              verdict, so it should move when a real fact about your business changes.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

const lesson: LessonContent = {
  whyThisMatters: (
    <p>
      Leadership will eventually ask you to make this call, and "it depends" is not an answer they
      can act on. This lesson gives you the four factors that actually decide it, so your answer is
      a weighting of real inputs rather than a guess.
    </p>
  ),
  objectives: [
    "Name the four factors that decide between renting, buying, and building",
    "Produce a recommendation for a given business situation using those four factors",
    "Explain why changing one factor can flip the recommendation",
  ],
  Body,
  takeaways: [
    "The choice between rent, buy, and build depends on stage of business maturity, budget, urgency to launch, and long-term strategic control needs.",
    "A company just starting out, on a tight budget, needing to launch fast, with low control needs, points at renting; the more each factor shifts toward maturity, budget, patience, and control, the more it points toward buying or building.",
    "The recommendation is a weighting of four factors, not a verdict — change one honest answer and it can change the recommended path.",
  ],
  checkYourself: [
    {
      question: "A mature company with a substantial budget still wants to launch in weeks. Would you expect the helper to recommend building?",
      answer: (
        <p>
          Not on urgency alone. Maturity and budget both favor buy or build, but "a few months" or
          faster favors buying over building, since buying is faster than building from scratch.
          Building only wins when urgency also allows six-plus months — otherwise the timeline
          argument favors an acquisition instead.
        </p>
      ),
    },
  ],
};

export default lesson;

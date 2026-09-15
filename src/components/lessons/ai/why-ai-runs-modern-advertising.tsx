import { useEffect, useRef, useState } from "react";

import type { LessonContent } from "@/components/journey/lesson-content";
import { cn } from "@/lib/utils";

/** The three model families the module's key-technology cards named. */
const FAMILIES = [
  {
    id: "ml",
    name: "Machine learning",
    line: "Supervised and unsupervised models that improve automatically through experience. Used for prediction, classification, and clustering.",
  },
  {
    id: "dl",
    name: "Deep learning",
    line: "Neural networks for complex pattern recognition. Powers computer vision for creative analysis and natural-language processing for contextual understanding.",
  },
  {
    id: "rl",
    name: "Reinforcement learning",
    line: "Algorithms that learn optimal actions through trial and error. Used for real-time bidding and budget allocation.",
  },
] as const;

type FamilyId = (typeof FAMILIES)[number]["id"];

/** One impression's decision, staged as the signals a model would actually see arrive. */
const TICKER_STEPS: Array<{ ms: number; signal: string; family: FamilyId }> = [
  { ms: 20, signal: "User signal arrives: device type, past clicks, time of day", family: "ml" },
  { ms: 45, signal: "Context read: the page's image and the words around the ad slot", family: "dl" },
  { ms: 70, signal: "History checked: what happened the last hundred times this ad ran here", family: "rl" },
  { ms: 100, signal: "Decision made: bid a price, serve a creative", family: "ml" },
];

/** The six AI applications the rest of this section teaches, one lesson each. */
const UPCOMING_JOBS: Array<{ job: string; family: FamilyId; lesson: string }> = [
  { job: "Predicting click-through rate to price a bid", family: "ml", lesson: "How AI decides what to bid" },
  { job: "Assembling a creative from image, headline, and CTA components", family: "dl", lesson: "Finding the right person and building the right ad" },
  { job: "Reading a video's frames to match it with a brand-safe ad", family: "dl", lesson: "The same AI, every channel" },
  { job: "Shifting budget toward whichever campaign is converting best", family: "rl", lesson: "How AI decides what to bid" },
  { job: "Spotting a click pattern that looks like a bot, not a person", family: "ml", lesson: "Catching the traffic that was never real" },
  { job: "Learning how much credit a touchpoint deserves from past journeys", family: "ml", lesson: "Proving which ad actually worked" },
];

function familyName(id: FamilyId) {
  return FAMILIES.find((f) => f.id === id)?.name ?? id;
}

function Ticker() {
  const [stepIndex, setStepIndex] = useState(-1);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const start = () => {
    if (timer.current) clearInterval(timer.current);
    setStepIndex(0);
    let i = 0;
    timer.current = setInterval(() => {
      i += 1;
      if (i >= TICKER_STEPS.length) {
        setStepIndex(TICKER_STEPS.length - 1);
        if (timer.current) clearInterval(timer.current);
        timer.current = null;
        return;
      }
      setStepIndex(i);
    }, 500);
  };

  useEffect(() => {
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, []);

  const done = stepIndex === TICKER_STEPS.length - 1;
  const visible = stepIndex >= 0 ? TICKER_STEPS.slice(0, stepIndex + 1) : [];

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs uppercase text-muted-foreground">One impression, real time</p>
        <button
          type="button"
          onClick={start}
          className="min-h-[2.75rem] rounded-lg border border-primary bg-primary/10 px-4 text-sm text-foreground transition-colors hover:bg-primary/20"
        >
          Run one impression
        </button>
      </div>

      {visible.length === 0 ? (
        <p className="measure mt-4 text-sm text-muted-foreground">
          Nothing has run yet. Press the button and watch what has to happen before a single ad can
          render — all of it inside a hundred milliseconds.
        </p>
      ) : (
        <ol className="mt-4 space-y-2">
          {visible.map((step, i) => (
            <li
              key={step.ms}
              className={cn(
                "rounded-lg border p-3",
                i === visible.length - 1 && !done ? "border-primary bg-primary/10" : "border-border"
              )}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs uppercase text-muted-foreground">
                  <span className="figure">{step.ms}</span>ms
                </span>
                <span className="text-xs uppercase text-primary">{familyName(step.family)}</span>
              </div>
              <p className="mt-1 text-sm text-foreground">{step.signal}</p>
            </li>
          ))}
        </ol>
      )}

      {done && (
        <p className="measure mt-3 text-sm text-muted-foreground">
          Three model families touched that one decision, and it still finished inside the time a
          page is willing to wait. Multiply this by every impression on every page loading right
          now, and a fixed rule table stops being an option — there is no table big enough, and no
          person fast enough to write one row per user.
        </p>
      )}
    </div>
  );
}

function JobQuiz() {
  const [guesses, setGuesses] = useState<Record<number, FamilyId>>({});

  return (
    <div className="space-y-3">
      {UPCOMING_JOBS.map((item, i) => {
        const guess = guesses[i];
        return (
          <div key={item.job} className="rounded-lg border border-border bg-card p-4">
            <p className="text-foreground">{item.job}</p>
            <div
              className="mt-3 flex flex-wrap gap-2"
              role="group"
              aria-label={`Guess the model family for: ${item.job}`}
            >
              {FAMILIES.map((f) => {
                const selected = guess === f.id;
                const isCorrect = f.id === item.family;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setGuesses((prev) => ({ ...prev, [i]: f.id }))}
                    aria-pressed={selected}
                    className={cn(
                      "min-h-[2.75rem] rounded-lg border px-3 text-sm transition-colors",
                      guess
                        ? selected && isCorrect
                          ? "border-primary bg-primary/10 text-foreground"
                          : selected
                            ? "border-destructive text-destructive"
                            : "border-border text-muted-foreground"
                        : "border-border text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {f.name}
                  </button>
                );
              })}
            </div>
            {guess && (
              <p className="measure mt-2 text-sm text-muted-foreground">
                {guess === item.family ? "Right." : `Not quite — this one is ${familyName(item.family)}.`}{" "}
                Covered in <span className="text-foreground">{item.lesson}</span>.
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

function Body() {
  return (
    <div className="space-y-8">
      <div className="measure space-y-4 text-muted-foreground">
        <p>
          Every lesson before this one described a chain of platforms — DSPs, SSPs, ad servers,
          exchanges — trading a single impression. This section is about what runs inside those
          platforms once the chain gets busy: AI is transforming digital advertising by enabling
          smarter, faster, and more precise campaign execution across the entire advertising
          lifecycle, and it is the reason a DSP can auto-optimize a campaign — improving return on
          investment, viewability, conversions, and cost per action — using algorithms and machine
          learning instead of a media buyer adjusting settings by hand.
        </p>
        <p>
          None of that is a separate system bolted onto AdTech. It is the same DSPs, SSPs, and ad
          servers from earlier lessons, with a model deciding what they do at each step.
        </p>
      </div>

      <section>
        <h3 className="mb-3 text-lg text-foreground">Three model families, three jobs</h3>
        <p className="measure mb-4 text-muted-foreground">
          "AI" in an AdTech conversation almost always means one of three things. They are not
          interchangeable — each is good at a different kind of question.
        </p>
        <div className="grid gap-3 md:grid-cols-3">
          {FAMILIES.map((f) => (
            <div key={f.id} className="rounded-lg border border-border bg-card p-4">
              <h4 className="text-foreground">{f.name}</h4>
              <p className="mt-1 text-sm text-muted-foreground">{f.line}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h3 className="mb-1 text-lg text-foreground">Try it</h3>
        <p className="measure mb-4 text-sm text-muted-foreground">
          Run one impression through the timeline below. Each signal it reads gets handled by a
          different model family — watch which one lights up at each step.
        </p>
        <Ticker />
      </section>

      <section>
        <h3 className="mb-1 text-lg text-foreground">Which model family would you use?</h3>
        <p className="measure mb-4 text-sm text-muted-foreground">
          The next five lessons each teach one AI application in detail. Guess which family powers
          each job before you get there.
        </p>
        <JobQuiz />
      </section>
    </div>
  );
}

const lesson: LessonContent = {
  whyThisMatters: (
    <p>
      Someone on your team will say "the model decided" about a bid, a creative, or a budget move,
      and expect you to know roughly what that means. It is not one technology — it is three
      different kinds of model, each answering a different question, all running inside platforms
      you already know from earlier lessons.
    </p>
  ),
  objectives: [
    "Explain why AdTech decisions run through models instead of a fixed rule table",
    "Name the three model families used in AdTech and match each to the kind of question it answers",
    "Predict which model family powers a given AI application before reading its dedicated lesson",
  ],
  Body,
  takeaways: [
    "AI runs modern advertising because decisions happen at a volume and speed a fixed rule table could never keep up with — the same DSP auto-optimization the book describes for return on investment, viewability, conversions, and cost per action.",
    "Three model families do different jobs: machine learning predicts and classifies, deep learning reads unstructured content like images and audio, and reinforcement learning improves a strategy from the outcomes it causes.",
    "The same three families reappear across every AI application ahead — bidding, creative, audience targeting, every channel, fraud detection, and attribution all reduce to one of these three questions.",
  ],
  checkYourself: [
    {
      question:
        "An ad server examines a video's frames to decide the content is brand-safe before placing an ad next to it. Which model family is that?",
      answer: (
        <p>
          Deep learning. Reading an image, a video frame, or a page of text for meaning is pattern
          recognition over unstructured content, which is what neural networks are built for —
          machine learning's classic strength is structured, tabular prediction, and reinforcement
          learning is about learning from outcomes, not reading content.
        </p>
      ),
    },
    {
      question:
        "A budget-allocation system keeps shifting spend toward whichever campaign converted best last week, and adjusts again the week after. What is it doing that a one-time prediction would not?",
      answer: (
        <p>
          It is learning from its own past actions and their results, then acting again — that loop
          of action, outcome, adjustment is reinforcement learning. A one-time prediction model would
          set the split once and never revisit it as conditions changed.
        </p>
      ),
    },
  ],
};

export default lesson;

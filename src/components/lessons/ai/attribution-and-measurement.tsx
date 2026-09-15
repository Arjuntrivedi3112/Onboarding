import { useState } from "react";

import type { LessonContent } from "@/components/journey/lesson-content";
import { cn } from "@/lib/utils";
import { ImpactCallout, NumberedSteps } from "./_shared";

interface Touch {
  channel: string;
  device: string;
  action: string;
  isView: boolean;
}

/** One person's path to a purchase, in order. The purchase itself is not a touch. */
const JOURNEY: Touch[] = [
  { channel: "Display", device: "Mobile phone", action: "Saw the ad, did not click", isView: true },
  { channel: "Social", device: "Desktop", action: "Clicked the ad", isView: false },
  { channel: "Search", device: "Desktop", action: "Clicked a branded search ad", isView: false },
];

const PURCHASE_VALUE = 120;

type ModelId = "last-click" | "linear" | "ai";

const MODELS: Array<{ id: ModelId; label: string; blurb: string }> = [
  {
    id: "last-click",
    label: "Last-click",
    blurb: "All credit goes to the final touch before the purchase click.",
  },
  {
    id: "linear",
    label: "Linear",
    blurb: "Credit is split evenly across every touch that is counted.",
  },
  {
    id: "ai",
    label: "AI, data-driven",
    blurb: "Credit is weighted by each touch's estimated contribution, learned from many journeys.",
  },
];

/** AI weights are illustrative estimates, not a quoted industry figure — the shape is what matters. */
const AI_WEIGHTS: Record<string, number> = { Display: 20, Social: 30, Search: 50 };

function creditFor(model: ModelId, touches: Touch[]): Record<string, number> {
  if (touches.length === 0) return {};

  if (model === "last-click") {
    const last = touches[touches.length - 1];
    return { [last.channel]: 100 };
  }

  if (model === "linear") {
    const share = Math.round(100 / touches.length);
    const result: Record<string, number> = {};
    touches.forEach((t, i) => {
      result[t.channel] = i === touches.length - 1 ? 100 - share * (touches.length - 1) : share;
    });
    return result;
  }

  const total = touches.reduce((s, t) => s + (AI_WEIGHTS[t.channel] ?? 0), 0);
  const result: Record<string, number> = {};
  touches.forEach((t) => {
    result[t.channel] = Math.round(((AI_WEIGHTS[t.channel] ?? 0) / total) * 100);
  });
  return result;
}

function ModelSwitcher() {
  const [model, setModel] = useState<ModelId>("last-click");
  const [viewThrough, setViewThrough] = useState(true);
  const [crossDevice, setCrossDevice] = useState(true);

  const displayTouchVisible = viewThrough && crossDevice;
  const touches = displayTouchVisible ? JOURNEY : JOURNEY.filter((t) => !t.isView);
  const credit = creditFor(model, touches);
  const activeModel = MODELS.find((m) => m.id === model) ?? MODELS[0];

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Choose an attribution model">
        {MODELS.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setModel(m.id)}
            aria-pressed={model === m.id}
            className={cn(
              "min-h-[2.75rem] rounded-lg border px-4 text-sm transition-colors",
              model === m.id
                ? "border-primary bg-primary/10 text-foreground"
                : "border-border text-muted-foreground hover:text-foreground"
            )}
          >
            {m.label}
          </button>
        ))}
      </div>
      <p className="measure mt-2 text-sm text-muted-foreground">{activeModel.blurb}</p>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setViewThrough((v) => !v)}
          aria-pressed={viewThrough}
          className={cn(
            "min-h-[2.75rem] rounded-lg border px-4 text-sm transition-colors",
            viewThrough
              ? "border-primary bg-primary/10 text-foreground"
              : "border-border text-muted-foreground hover:text-foreground"
          )}
        >
          Count view-through impressions
        </button>
        <button
          type="button"
          onClick={() => setCrossDevice((v) => !v)}
          aria-pressed={crossDevice}
          className={cn(
            "min-h-[2.75rem] rounded-lg border px-4 text-sm transition-colors",
            crossDevice
              ? "border-primary bg-primary/10 text-foreground"
              : "border-border text-muted-foreground hover:text-foreground"
          )}
        >
          Match this person across devices
        </button>
      </div>

      <ol className="mt-4 space-y-2">
        {JOURNEY.map((t) => {
          const visible = t.isView ? displayTouchVisible : true;
          return (
            <li
              key={t.channel}
              className={cn(
                "rounded-lg border p-3",
                visible ? "border-border" : "border-border opacity-40"
              )}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-foreground">{t.channel}</span>
                <span className="figure text-muted-foreground">
                  {visible ? `${credit[t.channel] ?? 0}% credit` : "not captured"}
                </span>
              </div>
              <span className="text-sm text-muted-foreground">
                {t.device} — {t.action}
              </span>
            </li>
          );
        })}
        <li className="rounded-lg border border-border bg-secondary p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-foreground">Purchase</span>
            <span className="figure text-foreground">${PURCHASE_VALUE}</span>
          </div>
          <span className="text-sm text-muted-foreground">Desktop</span>
        </li>
      </ol>

      <p className="measure mt-3 text-sm text-muted-foreground">
        {displayTouchVisible
          ? "Both toggles are on: the mobile view-through impression is captured and linked to the desktop purchase, so all three touches compete for credit."
          : "The display touch was only a view, on a different device from the purchase — turn off either toggle and it becomes invisible to every model below, not just this one."}
      </p>
    </div>
  );
}

function Body() {
  return (
    <div className="space-y-8">
      <div className="measure space-y-4 text-muted-foreground">
        <p>
          AI also plays a critical role in measurement and fraud prevention. It supports advanced
          attribution modeling, audience validation, and real-time anomaly detection to safeguard
          media investments and deliver more accurate insights into campaign performance.
        </p>
        <p>
          This lesson is about the attribution half of that sentence: once a purchase happens, who
          gets the credit for it, out of everyone who touched that person along the way.
        </p>
      </div>

      <section>
        <h3 className="mb-3 text-lg text-foreground">Attribution modeling</h3>
        <p className="measure mb-3 text-muted-foreground">
          AI determines the true impact of each marketing touchpoint.
        </p>
        <NumberedSteps
          steps={[
            "Analyze user journeys across all channels and devices",
            "Apply statistical models to determine credit allocation",
            "Account for view-through and cross-device conversions",
            "Provide incrementality measurement",
          ]}
        />
        <div className="mt-4">
          <ImpactCallout
            figure="More accurate budget allocation across channels"
            description="A model that tells the truth about which touchpoint earned the sale is what makes reallocating budget toward it defensible."
          />
        </div>
      </section>

      <section>
        <h3 className="mb-1 text-lg text-foreground">Try it</h3>
        <p className="measure mb-4 text-sm text-muted-foreground">
          One person's path to one purchase. Switch between three models and watch the credit — and
          the budget case it implies — move between channels. Then turn off view-through counting or
          cross-device matching and watch the earliest touch disappear entirely.
        </p>
        <ModelSwitcher />
      </section>

      <section>
        <h3 className="mb-2 text-lg text-foreground">Why the naive models disagree</h3>
        <p className="measure text-muted-foreground">
          Last-click and linear are fixed rules — they never ask whether display actually moved this
          person toward buying, only where display sits in the sequence. An AI, data-driven model
          instead estimates each touchpoint's real incremental contribution from patterns across many
          journeys like this one, which is why its split rarely matches a fixed rule's split, and why
          it is the version this section keeps calling more accurate rather than merely different.
        </p>
      </section>
    </div>
  );
}

const lesson: LessonContent = {
  whyThisMatters: (
    <p>
      Marketing will ask you to defend a budget shift based on "what the attribution model says," and
      the honest answer is that a different model would have said something else. Knowing which
      model you are looking at, and what it cannot see, is the whole job.
    </p>
  ),
  objectives: [
    "Explain what an attribution model does: assign credit for a conversion across the touchpoints in a journey",
    "Compare last-click, linear, and an AI, data-driven model over the same journey, and say how the budget case differs",
    "Explain why view-through and cross-device conversions make naive attribution models understate true impact",
  ],
  Body,
  takeaways: [
    "An attribution model's job is to split credit for one conversion across every touchpoint that led to it, and different models split it differently — that is the entire disagreement.",
    "Last-click and linear are fixed rules that ignore how touchpoints actually behaved together; an AI, data-driven model estimates each touchpoint's real incremental contribution from patterns across many journeys.",
    "A touchpoint that was only a view, or that happened on a different device, is invisible to every model unless view-through tracking and cross-device matching are both switched on — no model can credit a touch it never captured.",
  ],
  checkYourself: [
    {
      question:
        "Last-click gives search all the credit whether or not you count the view-through impression. Why doesn't that toggle change last-click's answer?",
      answer: (
        <p>
          Because last-click only ever looks at the final touch before conversion — an earlier
          view-through impression was never part of its calculation to begin with. Linear and the
          AI model both change when the toggle changes, because both of them do consider every touch
          they can see.
        </p>
      ),
    },
    {
      question:
        "Marketing wants to cut the display budget because 'last-click shows it drives zero percent of conversions.' What would you check first?",
      answer: (
        <p>
          Whether view-through tracking and cross-device matching are actually capturing display's
          touches at all, and what a linear or AI, data-driven model says once they are. Last-click
          structurally cannot credit an impression-only touch, so zero percent from that model is not
          evidence display did nothing — it is evidence of what last-click is built to ignore.
        </p>
      ),
    },
  ],
};

export default lesson;

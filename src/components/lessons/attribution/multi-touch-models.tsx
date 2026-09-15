import type { LessonContent } from "@/components/journey/lesson-content";
import { AttributionSimulator, MULTI_TOUCH_MODELS } from "./_shared";

function Body() {
  return (
    <div className="space-y-8">
      <div className="measure space-y-4 text-muted-foreground">
        <p>
          A multi-touch model spreads a conversion's credit across more than one touchpoint instead
          of handing all of it to a single winner. The four models here disagree about how that
          split should be shaped.
        </p>
        <ul className="space-y-2">
          <li className="flex gap-3 text-muted-foreground">
            <span aria-hidden="true" className="mt-2 h-1 w-1 shrink-0 rounded-full bg-primary" />
            <span>
              <span className="text-foreground">Linear</span> splits credit evenly — every
              touchpoint counts the same.
            </span>
          </li>
          <li className="flex gap-3 text-muted-foreground">
            <span aria-hidden="true" className="mt-2 h-1 w-1 shrink-0 rounded-full bg-primary" />
            <span>
              <span className="text-foreground">Time decay</span> weights touchpoints by how
              recently they happened, using a <span className="figure">7-day</span> half-life — a
              touchpoint's weight is cut in half for every week further back it sits.
            </span>
          </li>
          <li className="flex gap-3 text-muted-foreground">
            <span aria-hidden="true" className="mt-2 h-1 w-1 shrink-0 rounded-full bg-primary" />
            <span>
              <span className="text-foreground">Position based</span> fixes{" "}
              <span className="figure">40%</span> on the first touchpoint and{" "}
              <span className="figure">40%</span> on the last, sharing the remaining{" "}
              <span className="figure">20%</span> across whatever sits between them.
            </span>
          </li>
          <li className="flex gap-3 text-muted-foreground">
            <span aria-hidden="true" className="mt-2 h-1 w-1 shrink-0 rounded-full bg-primary" />
            <span>
              <span className="text-foreground">Custom</span> keeps position based's shape but lets
              you set the first- and last-touchpoint weight yourself.
            </span>
          </li>
        </ul>
      </div>

      <section>
        <h3 className="mb-1 text-lg text-foreground">Try it</h3>
        <p className="measure mb-4 text-sm text-muted-foreground">
          Same journey as the single-touch lesson, same live math. Switch models and watch a single
          touchpoint's credit stretch or shrink instead of jumping to 0% or 100%. Drag the custom
          sliders and the middle touchpoints absorb whatever weight is left over.
        </p>
        <AttributionSimulator models={MULTI_TOUCH_MODELS} defaultModelId="linear" allowCompareAll />
      </section>

      <div className="measure space-y-4 text-muted-foreground">
        <p>
          Every model taught so far in this section — the three single-touch models and these four
          — has the same blind spot: each one only sees a single device and a single web browser.
          If a user researches on a phone and buys on a laptop the next day, none of these seven
          models can tell you that the phone session happened at all, because as far as the cookie
          on that laptop is concerned, the journey started there. That is the problem cross-device
          attribution exists to solve.
        </p>
      </div>
    </div>
  );
}

const lesson: LessonContent = {
  whyThisMatters: (
    <p>
      Someone will ask why a display ad's reported contribution swings from 0% to 40% between two
      dashboards showing the same campaign. It is rarely a tracking bug — it is almost always two
      different multi-touch models applied to the same journey. Knowing what each model actually
      does to the numbers is what lets you answer that question instead of just re-running the
      report and hoping it changes.
    </p>
  ),
  objectives: [
    "Explain what distinguishes a multi-touch model from a single-touch model",
    "Compute how linear splits credit, and how time decay changes that split using a 7-day half-life",
    "Explain the 40/40/20 shape of position-based attribution and how the custom model's sliders relate to it",
    "State the single-device limitation shared by every model in this lesson and the one before it",
  ],
  Body,
  takeaways: [
    "Multi-touch models split a conversion's credit across more than one touchpoint, instead of awarding all of it to one, the way single-touch models do.",
    "Linear splits credit evenly; time decay weights recent touchpoints more heavily on a repeating half-life (7 days here, so a touchpoint's weight halves every 7 days further from conversion); position based fixes 40% on the first touchpoint and 40% on the last, dividing the remaining 20% across whatever sits between them.",
    "The custom model just lets an advertiser pick the first- and last-touchpoint weight themselves — but every model covered so far, single touch or multi touch, still only sees a single device and browser, which is exactly the gap cross-device attribution is built to close.",
  ],
  checkYourself: [
    {
      question:
        "A journey has four touchpoints. Under the linear model, what does each one get credited?",
      answer: (
        <p>
          <span className="figure">25%</span> each. Linear divides 100% by the number of
          touchpoints with no regard for position or timing, so four touchpoints means a quarter of
          the credit apiece.
        </p>
      ),
    },
    {
      question:
        "Under time decay, a touchpoint 7 days before conversion is compared to a touchpoint 0 days before conversion (conversion day itself). Roughly what is the ratio of their weights?",
      answer: (
        <p>
          About 1 to 2. The half-life is 7 days, so the touchpoint exactly one half-life back
          carries half the weight of a touchpoint on conversion day itself — before the two get
          normalized against whatever else is in the journey.
        </p>
      ),
    },
    {
      question:
        "Use the compare-all view in the simulator above. Which model gives the very first touchpoint in the default journey the least credit, and which gives it the most? What does that tell you about picking a model for a report?",
      answer: (
        <p>
          Last click (from the previous lesson) gives it 0%, and first click gives it 100% — the
          two most extreme single-touch models. Among the models in this lesson, position based
          typically gives it the most weight and linear the least, once the journey has more than a
          couple of touchpoints. The model you pick is not a neutral technical choice: it decides,
          before you have looked at a single number, roughly how much credit early-funnel channels
          are allowed to receive.
        </p>
      ),
    },
  ],
};

export default lesson;

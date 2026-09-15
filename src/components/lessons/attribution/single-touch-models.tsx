import type { LessonContent } from "@/components/journey/lesson-content";
import { AttributionSimulator, SINGLE_TOUCH_MODELS } from "./_shared";

function Body() {
  return (
    <div className="space-y-8">
      <div className="measure space-y-4 text-muted-foreground">
        <p>
          A single-touch model gives <span className="figure">100%</span> of a conversion's credit
          to exactly one touchpoint in the journey and <span className="figure">0%</span> to every
          other one. The three models below disagree only about which touchpoint deserves that
          credit.
        </p>
        <p>
          Take a real example: a user clicks a link on Facebook, browses the site, and leaves
          without converting. Days later they type your URL directly into their browser and
          download an eBook. Last click credits the direct visit — the last thing that happened
          before the conversion, even though it was nothing but the user remembering your name.
          Last non-direct skips that direct visit and credits Facebook instead. First click would
          also credit Facebook here, since it happens to be the first touchpoint too — that will
          not always be the case once a journey has more than two touchpoints.
        </p>
      </div>

      <section>
        <h3 className="mb-1 text-lg text-foreground">Try it</h3>
        <p className="measure mb-4 text-sm text-muted-foreground">
          The journey below ends the same way the eBook example does — a direct visit right before
          conversion. Switch models and watch the <span className="figure">100%</span> bar jump
          between touchpoints. Add or remove touchpoints, or drag one into the middle, and the
          credit recomputes from each model's actual rule, live.
        </p>
        <AttributionSimulator models={SINGLE_TOUCH_MODELS} defaultModelId="last-click" />
      </section>

      <div className="measure space-y-4 text-muted-foreground">
        <p>
          Last click is still the default reporting model in many web analytics, MarTech, and
          AdTech platforms, mostly because it is the simplest thing to compute — it needs to
          remember only the most recent touchpoint, not the whole journey. That simplicity is also
          its weakness: every other model on this page exists because last click throws away
          information a business might actually want.
        </p>
      </div>
    </div>
  );
}

const lesson: LessonContent = {
  whyThisMatters: (
    <p>
      A dashboard will tell you which channel "drove" a conversion without ever saying which model
      decided that. Two platforms disagreeing about whether Facebook or a direct visit gets the
      credit for the same sale are very likely just running different single-touch models — and
      until you know which one, you cannot tell whether either number means what it claims to.
    </p>
  ),
  objectives: [
    "State what single-touch attribution means in one sentence",
    "Name the three single-touch models and say which touchpoint each one rewards",
    "Explain why last non-direct is considered an improvement over last click, and what limitation it still shares with it",
  ],
  Body,
  takeaways: [
    "All three single-touch models give 100% of a conversion's credit to exactly one touchpoint and 0% to every other touchpoint in the journey.",
    "Last click credits the final touchpoint even when that touchpoint is a direct visit; last non-direct skips over a trailing direct visit to find the last real referral instead; first click credits whichever touchpoint started the journey.",
    "Whichever single-touch model is chosen, every touchpoint that is not the chosen one is treated as if it contributed nothing to the sale — that is the limitation all three models share.",
  ],
  checkYourself: [
    {
      question:
        "A user clicks a Facebook link, leaves without converting, and later types your URL directly and downloads an eBook. Under last click, who gets the credit? Under last non-direct?",
      answer: (
        <p>
          Last click credits the direct visit — the final touchpoint before conversion, full stop.
          Last non-direct skips that direct visit because it isn't a real referral, and instead
          credits Facebook with all of it.
        </p>
      ),
    },
    {
      question: "When might first click actually be the model you want to report on?",
      answer: (
        <p>
          When the question is about awareness rather than closing — which channels are
          introducing people to the brand in the first place, not which one happened to be present
          at the end. A media plan built to grow reach is better judged by first click than by
          last click.
        </p>
      ),
    },
  ],
};

export default lesson;

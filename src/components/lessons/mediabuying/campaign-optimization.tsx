import { useState } from "react";

import type { LessonContent } from "@/components/journey/lesson-content";
import { cn } from "@/lib/utils";

const MANUAL_TASKS = [
  "Adjusting cost per click (CPC), cost per mille (CPM), or cost per action (CPA) bids based on performance",
  "Filtering out low-performing segments — underperforming publishers, devices, or geographies",
  "Testing different ad creatives (A/B testing)",
  "Reviewing campaign breakdowns to identify patterns and trends",
  "Personalizing creatives for specific audiences, such as geo-targeted messages",
  "Experimenting with new platforms or inventory sources",
];

const AUTOMATED_SIGNALS = [
  "Conversion probability",
  "Click-through rate (CTR)",
  "Engagement level",
  "Cost-efficiency, such as reducing effective cost per action (eCPA)",
];

const COMPARISON_ROWS = [
  { dimension: "Control", manual: "Full control over every change", automated: "Limited — the algorithm decides within set parameters" },
  { dimension: "Speed", manual: "Slower, changes are applied by hand", automated: "Fast, adjustments happen in real time" },
  { dimension: "Scalability", manual: "Harder — needs human input per change", automated: "Easy — works well across many campaigns at once" },
  { dimension: "Flexibility", manual: "High — strategic and nuanced decisions", automated: "Lower — follows algorithmic logic" },
  { dimension: "Responsiveness", manual: "Delayed reaction to performance trends", automated: "Instant reaction to performance changes" },
  { dimension: "Data dependence", manual: "Works with smaller data sets and judgment", automated: "Needs a large amount of high-quality data" },
  { dimension: "Use case", manual: "Small, sensitive, or brand-critical campaigns", automated: "Large-scale or always-on campaigns" },
  { dimension: "Human effort", manual: "High — daily monitoring and tweaking", automated: "Low — monitored, not constantly adjusted" },
];

type ActionId = "lower-bid" | "exclude" | "swap-creative" | "automate" | "hybrid";

interface Action {
  id: ActionId;
  label: string;
  kind: "manual" | "automated" | "hybrid";
  pathRich: number[];
  pathThin: number[];
  note: string;
}

const TARGET_ECPA = 20;
const BASELINE_ECPA = 34;

const ACTIONS: Action[] = [
  {
    id: "lower-bid",
    label: "Lower the bid in Brazil",
    kind: "manual",
    pathRich: [34, 28, 24],
    pathThin: [34, 28, 24],
    note: "A direct, deliberate change. It takes a day to show up in the numbers and needs someone watching it.",
  },
  {
    id: "exclude",
    label: "Exclude Brazil entirely",
    kind: "manual",
    pathRich: [34, 0, 0],
    pathThin: [34, 0, 0],
    note: "Spend in Brazil drops to zero immediately. Effective, but it gives up that audience completely rather than fixing the number.",
  },
  {
    id: "swap-creative",
    label: "Swap the creative in Brazil",
    kind: "manual",
    pathRich: [34, 29, 22],
    pathThin: [34, 29, 22],
    note: "Slower to move than a bid cut, but it addresses the likely cause instead of just paying less for the same ad.",
  },
  {
    id: "automate",
    label: "Hand Brazil to the algorithm",
    kind: "automated",
    pathRich: [34, 24, 19],
    pathThin: [34, 40, 36],
    note: "",
  },
  {
    id: "hybrid",
    label: "Automate bidding and pacing, refine targeting by hand",
    kind: "hybrid",
    pathRich: [34, 23, 18],
    pathThin: [34, 26, 20],
    note: "The algorithm handles real-time bid and pacing adjustments at scale, while a person still owns which audience and creative it's allowed to work with.",
  },
];

function Body() {
  const [actionId, setActionId] = useState<ActionId | null>(null);
  const [day, setDay] = useState(0);
  const [dataVolume, setDataVolume] = useState<"thin" | "rich">("rich");

  const action = ACTIONS.find((a) => a.id === actionId) ?? null;
  const path = action ? (dataVolume === "thin" ? action.pathThin : action.pathRich) : null;
  const ecpa = path ? path[Math.min(day, path.length - 1)] : null;

  const selectAction = (id: ActionId) => {
    setActionId(id);
    setDay(0);
  };

  return (
    <div className="space-y-8">
      <div className="measure space-y-4 text-muted-foreground">
        <p>
          Once a campaign is live, someone still has to keep it healthy. Two approaches exist, and
          most real campaigns end up running both at once.
        </p>
      </div>

      <section>
        <h3 className="mb-3 text-lg text-foreground">Manual optimization</h3>
        <p className="measure mb-3 text-muted-foreground">
          A member of the advertiser's team reviews campaign data and makes strategic adjustments —
          full control, but it takes time and constant monitoring. It works best on smaller or
          highly strategic campaigns, where nuance matters more than scale.
        </p>
        <ul className="space-y-1.5">
          {MANUAL_TASKS.map((t) => (
            <li key={t} className="flex gap-2 text-sm text-muted-foreground">
              <span aria-hidden="true" className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" />
              <span>{t}</span>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3 className="mb-3 text-lg text-foreground">Automated optimization</h3>
        <p className="measure mb-3 text-muted-foreground">
          A system built into a DSP or another AdTech platform uses historical and real-time data to
          make performance-based decisions — adjusting bids per impression, reallocating budget,
          serving the best creative — without a person in the loop. It typically optimizes on:
        </p>
        <ul className="space-y-1.5">
          {AUTOMATED_SIGNALS.map((s) => (
            <li key={s} className="flex gap-2 text-sm text-muted-foreground">
              <span aria-hidden="true" className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" />
              <span>{s}</span>
            </li>
          ))}
        </ul>
        <p className="measure mt-3 text-sm text-muted-foreground">
          Automation is only as good as the data behind it. Without enough high-quality history, an
          algorithm can misread a trend or fail to optimize at all — which is why it performs best
          once a campaign has accumulated real performance data.
        </p>
      </section>

      <section>
        <h3 className="mb-3 text-lg text-foreground">Manual vs. automated, side by side</h3>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[32rem] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="py-2 pr-4 font-normal">Dimension</th>
                <th className="py-2 pr-4 font-normal">Manual</th>
                <th className="py-2 pr-4 font-normal">Automated</th>
              </tr>
            </thead>
            <tbody className="text-muted-foreground">
              {COMPARISON_ROWS.map((row) => (
                <tr key={row.dimension} className="border-b border-border">
                  <td className="py-2 pr-4 text-foreground">{row.dimension}</td>
                  <td className="py-2 pr-4">{row.manual}</td>
                  <td className="py-2 pr-4">{row.automated}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="measure mt-3 text-muted-foreground">
          Most modern campaigns use a hybrid approach: automation for scale and speed, manual input
          for strategy, troubleshooting, and fine-tuning. A DSP might adjust bids and pacing in real
          time while a person refines audience targeting or creative messaging to match context an
          algorithm can't see.
        </p>
      </section>

      <section>
        <h3 className="mb-1 text-lg text-foreground">Try it</h3>
        <p className="measure mb-4 text-sm text-muted-foreground">
          A five-country campaign is running, and Brazil's effective cost per action (eCPA) has
          climbed to <span className="figure">${BASELINE_ECPA}</span> against a{" "}
          <span className="figure">${TARGET_ECPA}</span> target. Choose how to respond, then advance
          a few days and see what happens.
        </p>

        <div className="mb-3 flex flex-wrap gap-2" role="group" aria-label="Choose how much performance history the campaign has">
          {(["thin", "rich"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => {
                setDataVolume(v);
                setDay(0);
              }}
              aria-pressed={dataVolume === v}
              className={cn(
                "min-h-[2.75rem] rounded-lg border px-4 text-sm transition-colors",
                dataVolume === v
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border text-muted-foreground hover:text-foreground"
              )}
            >
              {v === "thin" ? "Only a few days of history" : "Weeks of clean history"}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-2" role="group" aria-label="Choose how to respond in Brazil">
          {ACTIONS.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => selectAction(a.id)}
              aria-pressed={actionId === a.id}
              className={cn(
                "min-h-[2.75rem] rounded-lg border px-4 py-2 text-left text-sm transition-colors",
                actionId === a.id
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border text-muted-foreground hover:text-foreground"
              )}
            >
              <span className="block text-foreground">{a.label}</span>
              <span className="text-xs uppercase text-muted-foreground">{a.kind}</span>
            </button>
          ))}
        </div>

        {action && path && ecpa !== null && (
          <div className="mt-4 rounded-lg border border-border bg-card p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase text-muted-foreground">Brazil eCPA, day {day}</p>
              <button
                type="button"
                onClick={() => setDay((d) => Math.min(d + 1, path.length - 1))}
                disabled={day >= path.length - 1}
                className="min-h-[2.75rem] rounded-lg border border-border px-3 text-sm text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
              >
                Advance a day
              </button>
            </div>
            <p className="mt-1 text-foreground">
              <span className="figure text-2xl">${ecpa}</span>
              <span className="text-muted-foreground"> against a </span>
              <span className="figure">${TARGET_ECPA}</span>
              <span className="text-muted-foreground"> target</span>
            </p>

            {action.kind === "automated" && dataVolume === "thin" && day > 0 && (
              <p className="measure mt-3 text-sm text-nobid">
                With only a few days of history, the algorithm reads a temporary dip as a real
                trend and pushes harder in the wrong direction before it has enough data to
                correct itself.
              </p>
            )}
            {action.kind === "automated" && dataVolume === "rich" && day > 0 && (
              <p className="measure mt-3 text-sm text-muted-foreground">
                With weeks of clean history behind it, the algorithm converges on the target
                quickly and with no one adjusting a single bid by hand.
              </p>
            )}
            {action.kind === "manual" && (
              <p className="measure mt-3 text-sm text-muted-foreground">{action.note}</p>
            )}
            {action.kind === "hybrid" && (
              <p className="measure mt-3 text-sm text-muted-foreground">{action.note}</p>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

const lesson: LessonContent = {
  whyThisMatters: (
    <p>
      Your first live campaign will have one country dragging down the average, and someone will
      ask what you're going to do about it before the day is out. "Wait and see" is rarely the
      right answer, and neither is always "automate it."
    </p>
  ),
  objectives: [
    "List at least four tasks that fall under manual campaign optimization",
    "Name the signals an automated optimization algorithm typically optimizes against",
    "Explain why automated optimization needs enough data, and what a hybrid approach adds that neither manual nor automated can alone",
  ],
  Body,
  takeaways: [
    "Manual optimization means a person adjusts bids, excludes weak segments, tests creatives, and reviews breakdowns by hand, trading speed for full strategic control.",
    "Automated optimization adjusts on conversion probability, click-through rate, engagement, and cost-efficiency in real time, but it needs enough high-quality data or it can misread a trend.",
    "Most modern campaigns run a hybrid: the algorithm handles bidding and pacing at scale, while a person still owns the strategy, creative, and audience calls the algorithm can't see the context for.",
  ],
  checkYourself: [
    {
      question: "A campaign launched three days ago and one geography is already underperforming. Should you hand it to the algorithm right away?",
      answer: (
        <p>
          Probably not yet. Three days is thin history, and an automated system can misread normal
          early noise as a real trend and overcorrect. A manual adjustment, or simply waiting for
          more data, is usually the safer call until the campaign has accumulated enough
          performance history.
        </p>
      ),
    },
    {
      question: "What does a hybrid approach actually divide between the algorithm and a person?",
      answer: (
        <p>
          The algorithm handles what it does well at scale — real-time bid and pacing adjustments
          across every impression. The person keeps the decisions that need context the algorithm
          doesn't have: which audiences to target, which creative to run, and when the strategy
          itself needs to change.
        </p>
      ),
    },
  ],
};

export default lesson;

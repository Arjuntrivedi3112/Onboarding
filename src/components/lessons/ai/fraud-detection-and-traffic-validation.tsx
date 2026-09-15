import { useState } from "react";

import type { LessonContent } from "@/components/journey/lesson-content";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { ImpactCallout, NumberedSteps } from "./_shared";

interface TrafficEvent {
  id: number;
  label: string;
  suspicionScore: number;
  isBot: boolean;
  cost: number;
}

const TRAFFIC_EVENTS: TrafficEvent[] = [
  { id: 1, label: "Known return visitor, residential IP", suspicionScore: 8, isBot: false, cost: 0.6 },
  { id: 2, label: "New visitor, mobile carrier IP", suspicionScore: 15, isBot: false, cost: 0.55 },
  { id: 3, label: "Rapid repeat clicks, same IP, forty a minute", suspicionScore: 92, isBot: true, cost: 0.6 },
  { id: 4, label: "Datacenter IP, no mouse movement recorded", suspicionScore: 88, isBot: true, cost: 0.6 },
  { id: 5, label: "Shared office VPN, several employees behind one address", suspicionScore: 65, isBot: false, cost: 0.5 },
  { id: 6, label: "Click timing matches a known bot signature", suspicionScore: 95, isBot: true, cost: 0.6 },
  { id: 7, label: "Mobile app session, normal length", suspicionScore: 12, isBot: false, cost: 0.45 },
  { id: 8, label: "Ad injected outside the publisher's own page", suspicionScore: 80, isBot: true, cost: 0.6 },
  { id: 9, label: "Spoofed domain declared in the bid request", suspicionScore: 85, isBot: true, cost: 0.6 },
  { id: 10, label: "Slow, human-paced scroll and dwell time", suspicionScore: 20, isBot: false, cost: 0.5 },
];

const SPIKE_EVENTS: TrafficEvent[] = Array.from({ length: 5 }, (_, i) => ({
  id: 100 + i,
  label: `Burst request ${i + 1} of 5, identical timing, one IP range`,
  suspicionScore: 97,
  isBot: true,
  cost: 0.6,
}));

function currency(n: number) {
  return `$${n.toFixed(2)}`;
}

function TrafficFilter() {
  const [threshold, setThreshold] = useState(70);
  const [spike, setSpike] = useState(false);

  const events = spike ? [...TRAFFIC_EVENTS, ...SPIKE_EVENTS] : TRAFFIC_EVENTS;
  const blocked = events.filter((e) => e.suspicionScore >= threshold);
  const allowed = events.filter((e) => e.suspicionScore < threshold);

  const botsCaught = blocked.filter((e) => e.isBot);
  const botsMissed = allowed.filter((e) => e.isBot);
  const realBlocked = blocked.filter((e) => !e.isBot);

  const spendSaved = botsCaught.reduce((s, e) => s + e.cost, 0);
  const spendWasted = botsMissed.reduce((s, e) => s + e.cost, 0);
  const legitimateBlockedCost = realBlocked.reduce((s, e) => s + e.cost, 0);

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="flex items-baseline justify-between">
        <label htmlFor="sensitivity-slider" className="text-sm text-muted-foreground">
          Invalid-traffic sensitivity threshold
        </label>
        <span className="figure text-foreground">{threshold}</span>
      </div>
      <Slider
        id="sensitivity-slider"
        className="mt-3 min-h-[2.75rem]"
        min={0}
        max={100}
        step={1}
        value={[threshold]}
        onValueChange={([v]) => setThreshold(v)}
        aria-label="Invalid-traffic sensitivity threshold"
      />
      <p className="measure mt-2 text-sm text-muted-foreground">
        Any event scoring at or above this number is blocked before it is counted or charged.
      </p>

      <button
        type="button"
        onClick={() => setSpike((s) => !s)}
        aria-pressed={spike}
        className={cn(
          "mt-4 min-h-[2.75rem] rounded-lg border px-4 text-sm transition-colors",
          spike
            ? "border-primary bg-primary/10 text-foreground"
            : "border-border text-muted-foreground hover:text-foreground"
        )}
      >
        {spike ? "Remove the anomaly spike" : "Simulate an anomaly spike"}
      </button>

      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div>
          <p className="text-xs uppercase text-muted-foreground">Bots caught</p>
          <p className="figure mt-1 text-foreground">{botsCaught.length}</p>
        </div>
        <div>
          <p className="text-xs uppercase text-muted-foreground">Bots missed</p>
          <p className="figure mt-1 text-foreground">{botsMissed.length}</p>
        </div>
        <div>
          <p className="text-xs uppercase text-muted-foreground">Real users blocked</p>
          <p className="figure mt-1 text-foreground">{realBlocked.length}</p>
        </div>
        <div>
          <p className="text-xs uppercase text-muted-foreground">Spend saved</p>
          <p className="figure mt-1 text-foreground">{currency(spendSaved)}</p>
        </div>
      </div>

      <p className="measure mt-3 text-sm text-muted-foreground">
        At this threshold, fraud still slipping through wastes{" "}
        <span className="figure">{currency(spendWasted)}</span>, and blocking real users alongside
        the bots costs <span className="figure">{currency(legitimateBlockedCost)}</span> in reach
        this filter turned away. Neither number reaches zero at the same setting as the other.
      </p>

      <ul className="mt-4 space-y-1">
        {events.map((e) => {
          const isBlocked = e.suspicionScore >= threshold;
          const wrong = isBlocked && !e.isBot;
          return (
            <li key={e.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <span className={wrong ? "text-foreground" : "text-muted-foreground"}>{e.label}</span>
              <span className="figure text-muted-foreground">
                {e.suspicionScore} — {isBlocked ? "blocked" : "allowed"}
                {wrong ? ", wrongly" : ""}
              </span>
            </li>
          );
        })}
      </ul>
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
          This lesson is about the fraud-prevention half of that sentence: catching traffic that was
          never a person before it is counted, and what it costs to set that filter too tight or too
          loose.
        </p>
      </div>

      <section>
        <h3 className="mb-3 text-lg text-foreground">Fraud detection</h3>
        <p className="measure mb-3 text-muted-foreground">
          AI identifies invalid traffic and fraudulent activity in real time.
        </p>
        <NumberedSteps
          steps={[
            "Analyze behavioral patterns to detect bot traffic",
            "Identify suspicious click patterns and IP addresses",
            "Flag domain spoofing and ad injection",
            "Block fraudulent impressions before they are counted",
          ]}
        />
        <div className="mt-4">
          <ImpactCallout
            figure={<>Save <span className="figure">10-30%</span> of ad spend from fraud waste</>}
            description="By refusing to count or charge for impressions that were never seen by a person."
          />
        </div>
      </section>

      <section>
        <h3 className="mb-1 text-lg text-foreground">Try it</h3>
        <p className="measure mb-4 text-sm text-muted-foreground">
          Move the sensitivity threshold and watch four numbers move with it: bots caught, bots
          still getting through, real users wrongly blocked, and the spend saved. Then simulate a
          coordinated burst from one IP range and see whether a single threshold is enough to catch
          it.
        </p>
        <TrafficFilter />
      </section>

      <section>
        <h3 className="mb-2 text-lg text-foreground">Fraud detection is not the whole job</h3>
        <p className="measure text-muted-foreground">
          The book's measurement sentence names two other jobs alongside blocking bots. Audience
          validation checks that the humans an audience segment claims to contain are real and
          match, which is a different question from whether one impression is fraudulent. Real-time
          anomaly detection looks for a pattern across many events — like the burst above — rather
          than scoring one event at a time, which is why a single sensitivity slider, however well
          tuned, is a complement to anomaly detection rather than a replacement for it.
        </p>
      </section>
    </div>
  );
}

const lesson: LessonContent = {
  whyThisMatters: (
    <p>
      Someone will hand you a fraud dashboard and ask why the sensitivity is not simply turned up to
      catch everything. It is because every setting trades one cost for another, and the dashboard
      only ever shows you the cost you asked it to measure.
    </p>
  ),
  objectives: [
    "Name the signals AI fraud detection screens for: behavioral bot patterns, suspicious click and IP patterns, domain spoofing, and ad injection",
    "Explain the tradeoff a sensitivity threshold creates between fraud blocked, real users wrongly blocked, and spend saved",
    "Explain what audience validation and real-time anomaly detection add beyond blocking individual bot impressions",
  ],
  Body,
  takeaways: [
    "AI fraud detection screens behavioral patterns, click and IP patterns, and domain spoofing or ad injection signals, then blocks fraudulent impressions before they are counted or charged.",
    "Every sensitivity threshold trades two costs against each other — fraud that slips through when it is loose, and real users wrongly blocked when it is tight — there is no setting that eliminates both.",
    "The book folds fraud detection into a broader measurement job alongside attribution modeling and audience validation, because a valid impression and a valid audience are two different things AI has to check.",
  ],
  checkYourself: [
    {
      question: "You tighten the sensitivity slider and the spend-saved number goes up. What other number should you check before celebrating?",
      answer: (
        <p>
          Real users wrongly blocked. If that number also rose sharply, the spend you saved on fraud
          is being partly offset by turning away real customers, which shows up as lost reach and
          revenue elsewhere, not on this dashboard.
        </p>
      ),
    },
    {
      question:
        "A burst of near-identical requests arrives from one IP range in the space of a minute. Is a static sensitivity slider enough to catch that?",
      answer: (
        <p>
          Not on its own. A per-event threshold catches individual high-suspicion events, but a
          coordinated burst is a pattern across events happening together — that is what real-time
          anomaly detection is for, and it works alongside a sensitivity slider rather than being
          replaced by one.
        </p>
      ),
    },
  ],
};

export default lesson;

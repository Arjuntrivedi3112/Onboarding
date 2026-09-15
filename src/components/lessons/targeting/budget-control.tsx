import { useMemo, useState } from "react";

import type { LessonContent } from "@/components/journey/lesson-content";
import { cn } from "@/lib/utils";

const TOTAL_CAP = 1000;
const FLIGHT_DAYS = 7;
const CPM = 8;
const AUDIENCE_POOL = 40_000;

/**
 * Inventory value available each day of the flight — a stand-in for the
 * intraday traffic fluctuations and shifting availability of impressions
 * that meet the campaign's targeting criteria, which the book says pacing
 * must account for.
 */
const AVAILABLE_PER_DAY = [180, 230, 260, 240, 200, 150, 120];

const DAILY_CAP_OPTIONS = [100, 150, 200] as const;
const FREQUENCY_CAP_OPTIONS = [1, 2, 3, 4] as const;

type Pacing = "asap" | "uniform";

function simulateSpend(dailyCap: number, buffer: boolean, pacing: Pacing) {
  const effectiveDailyCap = buffer ? dailyCap * 1.2 : dailyCap;
  const uniformTarget = TOTAL_CAP / FLIGHT_DAYS;
  let remaining = TOTAL_CAP;
  const spends: number[] = [];

  for (let day = 0; day < FLIGHT_DAYS; day++) {
    const dayCeiling = pacing === "uniform" ? Math.min(effectiveDailyCap, uniformTarget) : effectiveDailyCap;
    const spend = Math.max(0, Math.min(dayCeiling, AVAILABLE_PER_DAY[day], remaining));
    spends.push(spend);
    remaining -= spend;
  }

  return { spends, totalSpent: TOTAL_CAP - remaining, effectiveDailyCap };
}

function Body() {
  const [dailyCap, setDailyCap] = useState<(typeof DAILY_CAP_OPTIONS)[number]>(150);
  const [buffer, setBuffer] = useState(false);
  const [pacing, setPacing] = useState<Pacing>("asap");
  const [freqCap, setFreqCap] = useState<(typeof FREQUENCY_CAP_OPTIONS)[number]>(3);

  const { spends, totalSpent, effectiveDailyCap } = useMemo(
    () => simulateSpend(dailyCap, buffer, pacing),
    [dailyCap, buffer, pacing]
  );
  const daysActive = spends.filter((spend) => spend > 0).length;
  const maxDayForChart = Math.max(...AVAILABLE_PER_DAY, effectiveDailyCap);

  const impressions = Math.floor((totalSpent / CPM) * 1000);
  const uniqueReach = Math.min(AUDIENCE_POOL, Math.floor(impressions / freqCap));

  return (
    <div className="space-y-8">
      <div className="measure space-y-4 text-muted-foreground">
        <p>
          When running a campaign, advertisers focus not only on improving performance — by
          refining messaging, placement and targeting — but also on reducing ad waste. Ad waste is
          paid impressions that fail to reach the intended audience, due to factors such as fraud,
          low viewability, or mistargeting. Every control below is configured inside an ad server
          or a demand-side platform (DSP).
        </p>
      </div>

      <section>
        <h3 className="mb-3 text-lg text-foreground">Budget capping</h3>
        <p className="measure text-sm text-muted-foreground">
          A budget cap sets a limit on how much money a campaign will spend. A daily cap of{" "}
          <span className="figure">$150</span>, for example, means that once the campaign has
          spent that amount, no more ads run that day — on top of a separate total cap for the
          whole flight. Some platforms add a percentage, such as{" "}
          <span className="figure">20%</span>, to the daily budget to help advertisers get the most
          out of their campaign. Raising the daily cap can compensate for under-delivery on slow
          days, but it can also cause the total budget to run out before the flight ends.
        </p>
      </section>

      <section>
        <h3 className="mb-3 text-lg text-foreground">Pacing (budget distribution)</h3>
        <p className="measure text-sm text-muted-foreground">
          Pacing is how quickly or slowly a campaign's budget is spent, which controls how many
          impressions are served over any given period. ASAP pacing delivers the maximum number of
          impressions as soon as possible. Uniform pacing spreads delivery evenly across the
          campaign's proposed dates. In practice, pacing must also account for fluctuations in
          traffic throughout the day and the availability of impressions that meet the targeting
          criteria — ad platforms dynamically adjust how fast they spend based on performance,
          traffic volume, and the cost of the inventory or audience segments involved.
        </p>
      </section>

      <section>
        <h3 className="mb-1 text-lg text-foreground">Try it</h3>
        <p className="measure mb-4 text-sm text-muted-foreground">
          Set a daily cap, an optional buffer, and a pacing mode, then watch a seven-day flight
          spend against inventory that is not the same size every day.
        </p>

        <div className="space-y-4 rounded-lg border border-border bg-card p-5">
          <div>
            <p className="mb-2 text-xs uppercase text-muted-foreground">Daily cap</p>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Choose a daily budget cap">
              {DAILY_CAP_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setDailyCap(option)}
                  aria-pressed={dailyCap === option}
                  className={cn(
                    "min-h-[2.75rem] rounded-lg border px-4 text-sm transition-colors",
                    dailyCap === option
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border text-muted-foreground hover:text-foreground"
                  )}
                >
                  Set cap to <span className="figure">${option}</span>
                </button>
              ))}
              <button
                type="button"
                onClick={() => setBuffer((prev) => !prev)}
                aria-pressed={buffer}
                className={cn(
                  "min-h-[2.75rem] rounded-lg border px-4 text-sm transition-colors",
                  buffer
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border text-muted-foreground hover:text-foreground"
                )}
              >
                Add a <span className="figure">20%</span> buffer
              </button>
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs uppercase text-muted-foreground">Pacing</p>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Choose a pacing mode">
              <button
                type="button"
                onClick={() => setPacing("asap")}
                aria-pressed={pacing === "asap"}
                className={cn(
                  "min-h-[2.75rem] rounded-lg border px-4 text-sm transition-colors",
                  pacing === "asap"
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border text-muted-foreground hover:text-foreground"
                )}
              >
                Choose ASAP pacing
              </button>
              <button
                type="button"
                onClick={() => setPacing("uniform")}
                aria-pressed={pacing === "uniform"}
                className={cn(
                  "min-h-[2.75rem] rounded-lg border px-4 text-sm transition-colors",
                  pacing === "uniform"
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border text-muted-foreground hover:text-foreground"
                )}
              >
                Choose uniform pacing
              </button>
            </div>
          </div>

          <div className="flex items-end gap-2" aria-hidden="false">
            {spends.map((spend, index) => (
              <div key={index} className="flex flex-1 flex-col items-center gap-1">
                <div className="flex h-24 w-full items-end overflow-hidden rounded-md bg-secondary">
                  <div
                    className="w-full bg-primary transition-all duration-300"
                    style={{ height: `${(spend / maxDayForChart) * 100}%` }}
                  />
                </div>
                <p className="text-xs uppercase text-muted-foreground">
                  Day <span className="figure">{index + 1}</span>
                </p>
                <p className="figure text-sm text-foreground">${Math.round(spend)}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
            <p className="measure text-sm text-muted-foreground">
              Spent <span className="figure text-foreground">${Math.round(totalSpent)}</span> of a{" "}
              <span className="figure">${TOTAL_CAP}</span> total cap, over{" "}
              <span className="figure">{daysActive}</span> of{" "}
              <span className="figure">{FLIGHT_DAYS}</span> flight days.
            </p>
          </div>

          {pacing === "asap" && daysActive < FLIGHT_DAYS && (
            <p className="measure rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
              ASAP pacing spent the total cap in <span className="figure">{daysActive}</span> days
              — the campaign has nothing left to spend for the rest of the flight. Raising the
              daily cap made this happen faster, which is exactly the premature-depletion risk the
              book warns about.
            </p>
          )}
          {pacing === "uniform" && daysActive === FLIGHT_DAYS && (
            <p className="measure rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
              Uniform pacing held the campaign to roughly{" "}
              <span className="figure">${Math.round(TOTAL_CAP / FLIGHT_DAYS)}</span> a day, using
              every day of the flight instead of finishing early.
            </p>
          )}
        </div>
      </section>

      <section className="rounded-lg border border-border bg-card p-5">
        <p className="text-xs uppercase text-muted-foreground">Case study</p>
        <p className="measure mt-1 text-foreground">
          Ad Banker is a DSP component that lets several bidders receive and respond to bid
          requests simultaneously while preventing budget overspending. It reduced budget overspend
          by <span className="figure">36%</span> — from <span className="figure">37.2%</span> down
          to just <span className="figure">1.2%</span>.
        </p>
      </section>

      <section>
        <h3 className="mb-3 text-lg text-foreground">Frequency capping</h3>
        <p className="measure mb-4 text-sm text-muted-foreground">
          Frequency capping limits how many times the same ad is shown to a given visitor — three
          impressions per visitor per 24 hours, say. Each time the cap is evaluated, the system
          counts impressions served within that window: with a 24-hour cap of three, ads could show
          at 7:00, 19:00 and 1:00 the following day, after which the visitor sees nothing more until
          the next 24-hour cycle begins. Frequency capping limits budget waste, helps improve a
          campaign's overall reach, and prevents "overexposure" — a user's frustration at seeing
          the same ad over and over.
        </p>

        <div className="flex flex-wrap gap-2" role="group" aria-label="Choose a frequency cap">
          {FREQUENCY_CAP_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setFreqCap(option)}
              aria-pressed={freqCap === option}
              className={cn(
                "min-h-[2.75rem] rounded-lg border px-4 text-sm transition-colors",
                freqCap === option
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border text-muted-foreground hover:text-foreground"
              )}
            >
              Cap at <span className="figure">{option}</span> per 24 hours
            </button>
          ))}
        </div>

        <div className="mt-4 rounded-lg border border-border bg-card p-5">
          <p className="text-xs uppercase text-muted-foreground">
            From this flight's <span className="figure">{impressions.toLocaleString()}</span>{" "}
            impressions
          </p>
          <p className="measure mt-1 text-foreground">
            Roughly <span className="figure">{uniqueReach.toLocaleString()}</span> unique visitors
            reached, out of a <span className="figure">{AUDIENCE_POOL.toLocaleString()}</span>{" "}
            person audience pool.
          </p>
          <p className="measure mt-2 text-sm text-muted-foreground">
            A tighter cap spreads the same impressions across more people instead of repeating on
            fewer of them — more reach, less overexposure, at the same spend.
          </p>
        </div>
      </section>
    </div>
  );
}

const lesson: LessonContent = {
  whyThisMatters: (
    <p>
      A perfectly targeted campaign can still lose money — by burning its budget in a day, by
      showing the same person the same ad twenty times, or by spending unevenly across a flight
      nobody double-checked. Caps, pacing and frequency limits are the three dials that keep
      targeting's precision from being wasted.
    </p>
  ),
  objectives: [
    "Define ad waste and name the controls that reduce it",
    "Contrast ASAP pacing with uniform pacing and explain the premature-depletion risk of raising a daily cap",
    "Explain how frequency capping is evaluated within a time window, and why it improves reach",
  ],
  Body,
  takeaways: [
    "Ad waste is paid impressions that fail to reach the intended audience because of fraud, low viewability or mistargeting, and every control here is configured in an ad server or DSP.",
    "Budget capping limits total and daily spend; pacing decides whether that budget goes out as fast as possible (ASAP) or evenly across the flight (uniform), and raising a daily cap risks spending the total early.",
    "Frequency capping limits how many times one visitor sees the same ad within a time window, which reduces waste, improves overall reach, and prevents overexposure.",
  ],
  checkYourself: [
    {
      question:
        "A campaign manager raises the daily cap to fix a slow-delivering campaign. A week later, the campaign has stopped serving three days before the flight ends. What happened?",
      answer: (
        <p>
          Premature budget depletion. Raising the daily cap compensated for under-delivery on the
          slow days, but it also let the campaign spend its total budget faster than the flight was
          designed for — exactly the trade-off the book warns comes with a higher daily cap.
        </p>
      ),
    },
    {
      question:
        "With a frequency cap of three impressions per 24 hours, an ad shows at 7:00, then again at 19:00 the same day. Can it show once more before the cap resets?",
      answer: (
        <p>
          Yes, once more within that same rolling 24-hour window — the book's own example has the
          third impression landing at 1:00 the next day. After that third impression, the visitor
          sees nothing further until a new 24-hour cycle begins.
        </p>
      ),
    },
  ],
};

export default lesson;

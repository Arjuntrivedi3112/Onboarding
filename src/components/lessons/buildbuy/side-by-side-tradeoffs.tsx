import { useState } from "react";

import type { LessonContent } from "@/components/journey/lesson-content";
import { cn } from "@/lib/utils";
import type { StrategyId } from "./_shared";

interface ComparisonRow {
  label: string;
  rent: string;
  buy: string;
  build: string;
  /** Which column comes out ahead on this criterion, 1 (best) to 3 (worst). Used only to tally the "Try it" score below — the cell text above is the book's own words. */
  rank: Record<StrategyId, number>;
}

const ROWS: ComparisonRow[] = [
  {
    label: "Time to market",
    rent: "Fast (days/weeks)",
    buy: "Moderate (weeks/months)",
    build: "Slow (3 to 6 months for MVP)",
    rank: { rent: 1, buy: 2, build: 3 },
  },
  {
    label: "Upfront cost",
    rent: "Low",
    buy: "Medium to high",
    build: "High",
    rank: { rent: 1, buy: 2, build: 3 },
  },
  {
    label: "Ongoing costs",
    rent: "High (scales with usage)",
    buy: "Medium",
    build: "Low to medium (maintenance)",
    rank: { rent: 3, buy: 2, build: 1 },
  },
  {
    label: "Control over features",
    rent: "Low",
    buy: "High",
    build: "Very high",
    rank: { rent: 3, buy: 2, build: 1 },
  },
  {
    label: "Scalability",
    rent: "Limited by vendor's roadmap",
    buy: "Flexible after integration",
    build: "Fully customizable",
    rank: { rent: 3, buy: 2, build: 1 },
  },
  {
    label: "Transparency",
    rent: "Low",
    buy: "High",
    build: "Very high",
    rank: { rent: 3, buy: 2, build: 1 },
  },
  {
    label: "Integration complexity",
    rent: "Low",
    buy: "High",
    build: "Medium",
    rank: { rent: 1, buy: 3, build: 2 },
  },
  {
    label: "Risk",
    rent: "Low initially, higher long-term",
    buy: "Medium",
    build: "High initially, lower long-term",
    rank: { rent: 1, buy: 2, build: 3 },
  },
];

const COLUMN_LABELS: Record<StrategyId, string> = { rent: "Rent", buy: "Buy", build: "Build" };

function Body() {
  const [chosen, setChosen] = useState<string[]>([]);

  const toggle = (label: string) =>
    setChosen((prev) => (prev.includes(label) ? prev.filter((x) => x !== label) : [...prev, label]));

  const activeRows = ROWS.filter((row) => chosen.includes(row.label));
  const tally: Record<StrategyId, number> = { rent: 0, buy: 0, build: 0 };
  for (const row of activeRows) {
    for (const id of Object.keys(tally) as StrategyId[]) {
      if (row.rank[id] === 1) tally[id] += 1;
    }
  }
  const hasChosen = chosen.length > 0;
  const leader = (Object.keys(tally) as StrategyId[]).reduce((a, b) => (tally[a] >= tally[b] ? a : b));
  const leaderTied =
    hasChosen && (Object.keys(tally) as StrategyId[]).filter((id) => tally[id] === tally[leader]).length > 1;

  return (
    <div className="space-y-8">
      <div className="measure space-y-4 text-muted-foreground">
        <p>
          Every earlier lesson looked at one path at a time. Put next to each other, the same eight
          criteria the book uses — time to market, cost, control, scalability, transparency,
          integration, and risk — make the tradeoff concrete instead of abstract.
        </p>
      </div>

      <section>
        <h3 className="mb-1 text-lg text-foreground">Try it</h3>
        <p className="measure mb-4 text-sm text-muted-foreground">
          Mark the criteria that actually matter for your business. The rest of the table dims, and
          the tally below shows which path wins on the criteria you picked — not on all eight
          equally.
        </p>

        <div className="flex flex-wrap gap-2" role="group" aria-label="Choose the criteria that matter to you">
          {ROWS.map((row) => (
            <button
              key={row.label}
              type="button"
              onClick={() => toggle(row.label)}
              aria-pressed={chosen.includes(row.label)}
              className={cn(
                "min-h-[2.75rem] rounded-lg border px-3 text-sm transition-colors",
                chosen.includes(row.label)
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border text-muted-foreground hover:text-foreground"
              )}
            >
              {row.label}
            </button>
          ))}
        </div>

        <div className="mt-4 overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="p-3 text-left font-normal text-muted-foreground"></th>
                <th className="p-3 text-left text-foreground">Rent</th>
                <th className="p-3 text-left text-foreground">Buy</th>
                <th className="p-3 text-left text-foreground">Build</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row) => {
                const isActive = chosen.includes(row.label);
                const dimmed = hasChosen && !isActive;
                return (
                  <tr
                    key={row.label}
                    className={cn(
                      "border-b border-border/50 transition-colors",
                      isActive && "bg-primary/5"
                    )}
                  >
                    <td
                      className={cn(
                        "p-3 text-foreground",
                        dimmed && "text-muted-foreground/60"
                      )}
                    >
                      {row.label}
                    </td>
                    {(["rent", "buy", "build"] as StrategyId[]).map((id) => (
                      <td
                        key={id}
                        className={cn(
                          "p-3 text-muted-foreground",
                          dimmed && "text-muted-foreground/40"
                        )}
                      >
                        {row[id]}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-4 rounded-lg border border-border bg-card p-5">
          <p className="text-xs uppercase text-muted-foreground">Best fit on your criteria</p>
          {hasChosen ? (
            <>
              <p className="mt-1 text-foreground">
                {leaderTied ? "It's a tie" : COLUMN_LABELS[leader]}
              </p>
              <div className="mt-3 space-y-2">
                {(["rent", "buy", "build"] as StrategyId[]).map((id) => (
                  <div key={id} className="flex items-center gap-3">
                    <span className="w-12 text-xs text-muted-foreground">{COLUMN_LABELS[id]}</span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
                      <div
                        className="h-full rounded-full bg-primary transition-all duration-300"
                        style={{ width: `${(tally[id] / activeRows.length) * 100}%` }}
                      />
                    </div>
                    <span className="figure w-6 text-right text-xs text-muted-foreground">
                      {tally[id]}
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="measure mt-1 text-muted-foreground">
              Pick at least one criterion above to see a tally.
            </p>
          )}
        </div>
      </section>

      <p className="measure text-sm text-muted-foreground">
        Notice that no single path wins on every row. Build wins on control, scalability, and
        transparency; rent wins on time to market, upfront cost, and integration complexity. The
        table is not there to declare an overall winner — it is there to make you name what you are
        optimizing for before you choose.
      </p>
    </div>
  );
}

const lesson: LessonContent = {
  whyThisMatters: (
    <p>
      Whichever path a stakeholder prefers, they will justify it with one criterion — usually cost
      or speed — and skip the other seven. Having the full comparison in front of you is how you
      catch that and ask what they are trading away.
    </p>
  ),
  objectives: [
    "Name the eight criteria the book uses to compare rent, buy, and build",
    "Say which path leads on cost, which leads on control, and which leads on speed",
    "Explain why the comparison has no single winner across all eight criteria",
  ],
  Body,
  takeaways: [
    "Rent, buy, and build are compared across eight criteria: time to market, upfront cost, ongoing costs, control over features, scalability, transparency, integration complexity, and risk.",
    "Rent wins on speed, upfront cost, and integration simplicity; build wins on control, scalability, and transparency; buy sits between them on most rows.",
    "No path wins on every criterion, so the comparison only becomes a decision once you know which criteria matter most to your business.",
  ],
  checkYourself: [
    {
      question: "A colleague argues for buying a platform purely because it's faster than building. Using the comparison table, what would you push back with?",
      answer: (
        <p>
          Buying is faster than building, but rent is faster still — days or weeks against weeks or
          months. If speed is the only criterion, rent wins outright. Buying only makes sense once
          you also weight the criteria it actually leads on: ownership, transparency, and roadmap
          control from day one.
        </p>
      ),
    },
  ],
};

export default lesson;

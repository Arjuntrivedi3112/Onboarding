import { useEffect, useMemo, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Building2, CheckCircle2, Circle, Crown, Hammer, KeyRound, Rocket, ShoppingCart } from "lucide-react";

import { cn } from "@/lib/utils";
import { AnimatedNumber } from "@/simulations/build-rent-buy/AnimatedNumber";
import { ChallengeMet, CHAIN, Meter, Panel, Segmented, SimButton, SimSlider, SimStage, Stat, pct, useChallenge, useDescribe } from "@/simulations/kit";
import type { SimulationProps } from "@/simulations/types";
import {
  BUDGET_LABELS,
  CONTROL_LABELS,
  DEFAULT_ANSWERS,
  ENGINEERING_LABELS,
  PATHS,
  PATH_LABELS,
  PATH_TAGLINES,
  PRESETS,
  SCALE_LABELS,
  URGENCY_LABELS,
  allThreeFound,
  cheapestOverFiveYears,
  confidence,
  costCurve,
  profile,
  recommend,
  recordWinner,
  scoreAnswers,
  type Answers,
  type Engineering,
  type PathId,
  type Urgency,
} from "@/simulations/build-rent-buy/logic";

/**
 * Build, rent or buy, rebuilt from the original BuildBuyModule's scoring
 * helper and comparison matrix: five questions about the company move four
 * trade-off meters per path, an animated recommendation and three five-year
 * cost curves. All figures are illustrative.
 */

const TONE: Record<PathId, string> = {
  rent: CHAIN.adserver,
  buy: CHAIN.advertiser,
  build: "var(--primary)",
};

const ICON: Record<PathId, (cls: string) => ReactNode> = {
  rent: (c) => <KeyRound className={c} aria-hidden="true" />,
  buy: (c) => <ShoppingCart className={c} aria-hidden="true" />,
  build: (c) => <Hammer className={c} aria-hidden="true" />,
};

const COPY: Record<PathId, string> = {
  rent: "Start by renting. A SaaS platform gets you live in weeks with little upfront cost, and the learning period shows what you really need before you commit to more.",
  buy: "Buying fits best. Acquiring an existing platform gives you ownership and roadmap control far sooner than building — budget for integration work and the risk of key people leaving.",
  build:
    "Building is worth it. Your budget, patience, control needs and team justify a custom platform — keep the first version's scope narrow so it ships in months, not years.",
};

const level = (labels: string[], v: number) => labels[Math.max(0, Math.min(labels.length - 1, Math.round(v) - 1))];
const thousands = (v: number) => (v >= 1000 ? `$${(v / 1000).toFixed(2)}M` : `$${Math.round(v)}k`);
const riskWord = (v: number) => (v < 35 ? "Low" : v < 60 ? "Medium" : "High");
const controlWord = (v: number) => (v < 40 ? "Low" : v < 85 ? "High" : "Very high");

/* -------------------------------------------------------------------------- */
/* Five-year cost chart                                                        */
/* -------------------------------------------------------------------------- */

function niceMax(v: number): number {
  const steps = [250, 500, 750, 1000, 1500, 2000, 2500, 3000, 4000, 5000];
  return steps.find((s) => s >= v) ?? Math.ceil(v / 1000) * 1000;
}

function CostChart({ answers, winner }: { answers: Answers; winner: PathId }) {
  const reduce = useReducedMotion();
  const curves = useMemo(() => Object.fromEntries(PATHS.map((p) => [p, costCurve(p, answers)])) as Record<PathId, number[]>, [answers]);
  const max = niceMax(Math.max(...PATHS.flatMap((p) => curves[p])) * 1.05);
  const point = (v: number, i: number) => ({ x: (i / 20) * 100, y: 100 - (v / max) * 100 });
  const pathOf = (p: PathId) =>
    curves[p]
      .map((v, i) => {
        const { x, y } = point(v, i);
        return `${i === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
      })
      .join(" ");

  return (
    <div>
      <div className="flex gap-2">
        {/* y-axis labels */}
        <div className="figure flex h-48 w-12 shrink-0 flex-col justify-between text-right text-xs text-muted-foreground sm:h-56" aria-hidden="true">
          <span>{thousands(max)}</span>
          <span>{thousands(max / 2)}</span>
          <span>$0</span>
        </div>
        <div className="relative h-48 min-w-0 flex-1 sm:h-56">
          {/* Lines draw in left-to-right via a clip, which (unlike pathLength) works with non-scaling strokes. */}
          <motion.div
            className="absolute inset-0"
            initial={reduce ? false : { clipPath: "inset(-10% 100% -10% 0)" }}
            animate={{ clipPath: "inset(-10% -2% -10% 0)" }}
            transition={{ duration: 1.6, ease: "easeOut" }}
          >
            <svg className="absolute inset-0 h-full w-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
              {[0, 25, 50, 75, 100].map((y) => (
                <line key={y} x1={0} x2={100} y1={y} y2={y} stroke="hsl(var(--border))" strokeWidth={1} vectorEffect="non-scaling-stroke" />
              ))}
              {PATHS.map((p) => (
                <motion.path
                  key={p}
                  fill="none"
                  stroke={`hsl(${TONE[p]})`}
                  strokeWidth={p === winner ? 3.5 : 2}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                  style={{ filter: p === winner ? `drop-shadow(0 0 6px hsl(${TONE[p]} / 0.7))` : undefined }}
                  initial={false}
                  animate={{ d: pathOf(p), opacity: p === winner ? 1 : 0.7 }}
                  transition={{ d: { duration: reduce ? 0 : 0.6, ease: "easeInOut" }, opacity: { duration: 0.3 } }}
                />
              ))}
            </svg>
          </motion.div>
          {/* end-of-line markers (HTML so they stay round at any aspect ratio) */}
          {PATHS.map((p) => {
            const end = point(curves[p][20], 20);
            return (
              <motion.span
                key={p}
                aria-hidden="true"
                className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-card"
                style={{ background: `hsl(${TONE[p]})`, boxShadow: `0 0 12px hsl(${TONE[p]} / 0.8)` }}
                initial={false}
                animate={{ left: `${end.x}%`, top: `${end.y}%`, scale: p === winner && !reduce ? [1, 1.4, 1] : 1 }}
                transition={{
                  left: { duration: 0.6 },
                  top: { duration: 0.6 },
                  scale: p === winner && !reduce ? { duration: 1.4, repeat: Infinity, ease: "easeInOut" } : { duration: 0.2 },
                }}
              />
            );
          })}
        </div>
      </div>
      <div className="figure ml-14 mt-1 flex justify-between text-xs text-muted-foreground" aria-hidden="true">
        {[0, 1, 2, 3, 4, 5].map((y) => (
          <span key={y}>{y === 0 ? "Now" : `Y${y}`}</span>
        ))}
      </div>
      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
        {PATHS.map((p) => (
          <li key={p} className="flex items-center gap-1.5 text-sm text-foreground">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: `hsl(${TONE[p]})` }} aria-hidden="true" />
            {PATH_LABELS[p]}
            <span className="figure text-muted-foreground">
              <AnimatedNumber value={curves[p][20]} format={thousands} />
            </span>
          </li>
        ))}
      </ul>
      <p className="sr-only">Five-year cost: {PATHS.map((p) => `${PATH_LABELS[p]} ${thousands(curves[p][20])}`).join(", ")}.</p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Simulation                                                                  */
/* -------------------------------------------------------------------------- */

export default function Simulation({ onChallengePassed, challengePassed, onDescribe }: SimulationProps) {
  const reduce = useReducedMotion();
  const [answers, setAnswers] = useState<Answers>(DEFAULT_ANSWERS);
  const [seen, setSeen] = useState<PathId[]>([]);
  const set = <K extends keyof Answers>(key: K, value: Answers[K]) => setAnswers((a) => ({ ...a, [key]: value }));

  const scores = useMemo(() => scoreAnswers(answers), [answers]);
  const winner = recommend(scores);
  const conf = confidence(scores);
  const profiles = useMemo(() => Object.fromEntries(PATHS.map((p) => [p, profile(p, answers)])) as Record<PathId, ReturnType<typeof profile>>, [answers]);
  const cheapest = cheapestOverFiveYears(answers);
  const maxScore = Math.max(...PATHS.map((p) => scores[p]), 1);

  useEffect(() => {
    setSeen((s) => recordWinner(s, winner));
  }, [winner]);

  const met = allThreeFound(seen);
  useChallenge(met, onChallengePassed, challengePassed);

  useDescribe(
    onDescribe,
    `Company answers: budget ${level(BUDGET_LABELS, answers.budget)}, launch needed in ${URGENCY_LABELS[answers.urgency].toLowerCase()}, control need ${level(
      CONTROL_LABELS,
      answers.control,
    )}, in-house engineering ${ENGINEERING_LABELS[answers.engineering].toLowerCase()}, scale ${level(SCALE_LABELS, answers.scale)}. Scores: Rent ${scores.rent}, Buy ${
      scores.buy
    }, Build ${scores.build}, so ${PATH_LABELS[winner]} is recommended. Illustrative five-year cost: ${PATHS.map(
      (p) => `${PATH_LABELS[p]} ${thousands(profiles[p].fiveYearCost)}`,
    ).join(", ")}. Paths recommended so far this session: ${seen.map((p) => PATH_LABELS[p]).join(", ") || "none"}.`,
  );

  return (
    <div className="space-y-4">
      <SimStage label="Build, rent or buy: the three paths compared">
        <div className="grid gap-3 sm:grid-cols-3">
          {PATHS.map((p) => {
            const isWinner = p === winner;
            const pr = profiles[p];
            const tone = TONE[p];
            return (
              <motion.article
                key={p}
                aria-label={`${PATH_LABELS[p]}${isWinner ? ", recommended" : ""}`}
                className={cn("relative rounded-xl border-2 bg-card p-3 transition-colors", isWinner ? "" : "border-border")}
                style={{
                  borderColor: isWinner ? `hsl(${tone})` : undefined,
                  boxShadow: isWinner ? `0 0 0 4px hsl(${tone} / 0.15), 0 0 32px hsl(${tone} / 0.35)` : undefined,
                }}
                animate={{ scale: isWinner ? 1 : 0.98, opacity: isWinner ? 1 : 0.85 }}
                transition={{ type: "spring", stiffness: 260, damping: 22 }}
              >
                {isWinner && !reduce && (
                  <motion.span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 rounded-xl border-2"
                    style={{ borderColor: `hsl(${tone})` }}
                    initial={{ opacity: 0.6, scale: 1 }}
                    animate={{ opacity: 0, scale: 1.06 }}
                    transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
                  />
                )}
                <div className="flex items-center gap-2">
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                    style={{ background: `linear-gradient(135deg, hsl(${tone} / 0.25), hsl(${tone} / 0.08))`, color: `hsl(${tone})` }}
                  >
                    {ICON[p]("h-5 w-5")}
                  </span>
                  <div className="min-w-0">
                    <p className="text-base text-foreground">{PATH_LABELS[p]}</p>
                    <p className="text-xs leading-tight text-muted-foreground">{PATH_TAGLINES[p]}</p>
                  </div>
                  {isWinner && (
                    <motion.span
                      layoutId="brb-crown"
                      className="ml-auto flex h-7 items-center gap-1 rounded-full bg-primary px-2 text-xs text-primary-foreground shadow-[0_0_18px_hsl(var(--primary)/0.5)]"
                      transition={{ type: "spring", stiffness: 300, damping: 26 }}
                    >
                      <Crown className="h-3.5 w-3.5" aria-hidden="true" />
                      Pick
                    </motion.span>
                  )}
                </div>

                {/* Score */}
                <div className="mt-3">
                  <div className="flex items-baseline justify-between text-xs text-muted-foreground">
                    <span>Fit score</span>
                    <span className={cn("figure text-sm", isWinner ? "text-primary" : "text-foreground")}>
                      <AnimatedNumber value={scores[p]} format={(v) => `${Math.round(v)} pts`} />
                    </span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-secondary">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: `linear-gradient(90deg, hsl(${tone} / 0.6), hsl(${tone}))` }}
                      initial={false}
                      animate={{ width: `${(scores[p] / maxScore) * 100}%` }}
                      transition={{ type: "spring", stiffness: 140, damping: 20 }}
                    />
                  </div>
                </div>

                {/* Trade-off meters */}
                <dl className="mt-3 space-y-2 border-t border-border pt-3">
                  {[
                    { k: "Five-year cost", v: thousands(pr.fiveYearCost), m: pr.cost, tone: "floor" as const },
                    { k: "Time to market", v: pr.months <= 1 ? "weeks" : `~${pr.months} months`, m: pr.speed, tone: "primary" as const },
                    { k: "Control", v: controlWord(pr.control), m: pr.control, tone: "primary" as const },
                    { k: "Risk", v: riskWord(pr.risk), m: pr.risk, tone: "nobid" as const },
                  ].map((row) => (
                    <div key={row.k}>
                      <div className="flex items-baseline justify-between gap-2 text-xs">
                        <dt className="text-muted-foreground">{row.k}</dt>
                        <dd className="figure text-foreground">{row.v}</dd>
                      </div>
                      <div className="mt-1">
                        <Meter value={row.m} tone={row.tone} label={`${PATH_LABELS[p]} ${row.k.toLowerCase()}`} />
                      </div>
                    </div>
                  ))}
                </dl>
              </motion.article>
            );
          })}
        </div>

        <div className="mt-4 rounded-lg border border-primary/30 bg-primary/10 p-3" aria-live="polite">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={winner}
              initial={reduce ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <p className="flex items-center gap-2 text-sm text-foreground">
                <span style={{ color: `hsl(${TONE[winner]})` }}>{ICON[winner]("h-4 w-4")}</span>
                Recommended: <span className="text-primary">{PATH_LABELS[winner]}</span>
                <span className="figure text-xs text-muted-foreground">({pct(conf)} of the points)</span>
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{COPY[winner]}</p>
            </motion.div>
          </AnimatePresence>
        </div>
      </SimStage>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Your company">
          <div className="space-y-4">
            <SimSlider label="Budget" value={answers.budget} min={1} max={5} onChange={(v) => set("budget", v)} format={(v) => level(BUDGET_LABELS, v)} />
            <div>
              <p className="mb-2 text-sm text-foreground">How soon must you launch?</p>
              <Segmented<Urgency>
                label="How soon must you launch?"
                size="sm"
                value={answers.urgency}
                onChange={(v) => set("urgency", v)}
                options={[
                  { value: "weeks", label: "Weeks" },
                  { value: "months", label: "Months" },
                  { value: "patient", label: "6+ months" },
                ]}
              />
            </div>
            <SimSlider
              label="Need for control and customisation"
              value={answers.control}
              min={1}
              max={5}
              onChange={(v) => set("control", v)}
              format={(v) => level(CONTROL_LABELS, v)}
            />
            <div>
              <p className="mb-2 text-sm text-foreground">In-house engineering</p>
              <Segmented<Engineering>
                label="In-house engineering"
                size="sm"
                value={answers.engineering}
                onChange={(v) => set("engineering", v)}
                options={(["none", "small", "strong"] as Engineering[]).map((e) => ({ value: e, label: ENGINEERING_LABELS[e] }))}
              />
            </div>
            <SimSlider
              label="Scale (monthly volume)"
              value={answers.scale}
              min={1}
              max={5}
              onChange={(v) => set("scale", v)}
              format={(v) => level(SCALE_LABELS, v)}
            />
            <div className="flex flex-wrap gap-2 border-t border-border pt-3">
              {PRESETS.map((pr) => (
                <SimButton key={pr.id} onClick={() => setAnswers(pr.answers)}>
                  {pr.id === "startup" ? <Rocket className="h-4 w-4" aria-hidden="true" /> : <Building2 className="h-4 w-4" aria-hidden="true" />}
                  Answer as a {pr.label.toLowerCase()}
                </SimButton>
              ))}
            </div>
          </div>
        </Panel>

        <div className="space-y-4">
          <Panel title="Five-year cost (illustrative)">
            <CostChart answers={answers} winner={winner} />
            <p className="mt-2 text-xs text-muted-foreground">
              Renting starts cheap but its bill grows with volume; buying front-loads the purchase; building front-loads a team, then runs cheapest. The amounts
              are made up — the shapes are the point.
            </p>
          </Panel>

          <Panel title="Three companies, three answers">
            <ul className="grid grid-cols-3 gap-2">
              {PATHS.map((p) => {
                const found = seen.includes(p);
                return (
                  <li
                    key={p}
                    className={cn(
                      "flex flex-col items-center gap-1 rounded-lg border p-2 text-center",
                      found ? "border-primary/40 bg-primary/10" : "border-border",
                    )}
                  >
                    <AnimatePresence mode="wait" initial={false}>
                      {found ? (
                        <motion.span
                          key="yes"
                          initial={reduce ? false : { scale: 0, rotate: -90 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ type: "spring", stiffness: 400, damping: 15 }}
                        >
                          <CheckCircle2 className="h-6 w-6 text-primary" aria-hidden="true" />
                        </motion.span>
                      ) : (
                        <motion.span key="no">
                          <Circle className="h-6 w-6 text-muted-foreground/40" aria-hidden="true" />
                        </motion.span>
                      )}
                    </AnimatePresence>
                    <span className="text-sm text-foreground">{PATH_LABELS[p]}</span>
                    <span className="text-xs text-muted-foreground">{found ? "found" : "not yet"}</span>
                  </li>
                );
              })}
            </ul>
            <p className="mt-2 text-xs text-muted-foreground">
              {met ? "All three paths have topped the list." : `${seen.length} of 3 found. Change the answers until each path comes out on top.`}
            </p>
          </Panel>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Recommended" value={PATH_LABELS[winner]} tone="primary" sub={`${scores[winner]} of ${PATHS.reduce((a, p) => a + scores[p], 0)} points`} />
        <Stat
          label="Live in"
          value={profiles[winner].months <= 1 ? "Weeks" : `~${profiles[winner].months} mo`}
          sub={`with ${PATH_LABELS[winner].toLowerCase()}`}
        />
        <Stat
          label="Cheapest at 5 yrs"
          value={PATH_LABELS[cheapest]}
          tone={cheapest === winner ? "primary" : "floor"}
          sub={cheapest === winner ? "matches the pick" : "not the pick"}
        />
        <Stat label="Paths found" value={`${seen.length} of 3`} tone={met ? "primary" : "muted"} sub="challenge progress" />
      </div>

      <ChallengeMet show={met}>Build, Rent and Buy have each been the top recommendation. Challenge complete!</ChallengeMet>
    </div>
  );
}

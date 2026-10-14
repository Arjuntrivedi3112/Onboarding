import { useCallback, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Clock, Globe, Heart, RotateCcw, Smartphone, UserRound, Users, X } from "lucide-react";

import { enumCodec, numberCodec, useShareableState } from "@/hooks/useShareableState";
import { cn } from "@/lib/utils";
import {
  ChallengeMet,
  Meter,
  Panel,
  PlaybackControls,
  Segmented,
  SimButton,
  SimSlider,
  SimStage,
  SimToggle,
  Stat,
  int,
  money,
  pct,
  useChallenge,
  useDescribe,
  usePlayback,
} from "@/simulations/kit";
import type { SimulationProps } from "@/simulations/types";
import { CountUp } from "@/simulations/audience-narrowing/CountUp";
import {
  CROWD_COLS,
  CROWD_ROWS,
  CROWD_SIZE,
  FILTERS,
  FILTER_IDS,
  MINUTES_PER_DAY,
  PEOPLE_PER_DOT,
  audience,
  clock,
  filterById,
  generateCrowd,
  hourlyTrafficShare,
  matches,
  rightSizedAndEven,
  simulatePacing,
  type FilterId,
  type Pacing,
} from "@/simulations/audience-narrowing/logic";

/**
 * "Watch the audience narrow", rebuilt from the original targeting module's
 * filter demo with a real, seeded crowd: every dot is a user with a country,
 * device, interests, usual hour online, visit history and age band. Below the
 * crowd, the same audience has to absorb a daily budget — ASAP or evenly.
 */

const CROWD = generateCrowd();
const TRAFFIC = hourlyTrafficShare();
const DAY_MS = 6000; // one simulated day takes six seconds at 1×

const ICONS: Record<FilterId, typeof Globe> = {
  geo: Globe,
  device: Smartphone,
  daypart: Clock,
  interest: Heart,
  retargeting: RotateCcw,
  demographic: UserRound,
};

/** Ordered list of filter ids in the URL ("geo,device"), so a link reproduces the waterfall. */
const filtersCodec = {
  serialize: (v: FilterId[]) => v.join(","),
  deserialize: (raw: string): FilterId[] | null => {
    const ids = raw.split(",").filter((id): id is FilterId => (FILTER_IDS as string[]).includes(id));
    return ids.length ? Array.from(new Set(ids)) : null;
  },
};
const NO_FILTERS: FilterId[] = [];
const pacingCodec = enumCodec(["asap", "even"] as const);
const budgetCodec = numberCodec(50, 300);

/* -------------------------------------------------------------------------- */
/* The crowd                                                                  */
/* -------------------------------------------------------------------------- */

const CELL = 10;

function Crowd({ active, revealBuyers }: { active: FilterId[]; revealBuyers: boolean }) {
  const reduce = useReducedMotion();
  const key = active.join(",");
  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${CROWD_COLS * CELL} ${CROWD_ROWS * CELL}`}
        className="block h-auto w-full"
        aria-hidden="true"
      >
        <defs>
          <radialGradient id="an-glow" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.14" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="an-scan" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0" />
            <stop offset="80%" stopColor="hsl(var(--primary))" stopOpacity="0.22" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.55" />
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#an-glow)" />
        <g style={{ filter: "drop-shadow(0 0 1.6px hsl(var(--primary) / 0.55))" }}>
          {CROWD.map((u) => {
            const col = u.id % CROWD_COLS;
            const row = Math.floor(u.id / CROWD_COLS);
            const on = matches(u, active);
            const buyer = revealBuyers && u.buyer;
            return (
              <circle
                key={u.id}
                cx={col * CELL + CELL / 2}
                cy={row * CELL + CELL / 2}
                r={3.3}
                style={{
                  fill: buyer ? "hsl(var(--floor))" : on ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))",
                  opacity: on ? 1 : buyer ? 0.4 : 0.16,
                  transform: on ? "scale(1)" : "scale(0.5)",
                  transformBox: "fill-box",
                  transformOrigin: "center",
                  transition: reduce
                    ? undefined
                    : `transform 520ms cubic-bezier(.2,.8,.2,1) ${col * 14}ms, opacity 520ms ease ${col * 14}ms, fill 300ms ease`,
                }}
              />
            );
          })}
        </g>
        {!reduce && (
          <motion.rect
            key={key}
            y={0}
            width={40}
            height={CROWD_ROWS * CELL}
            fill="url(#an-scan)"
            initial={{ x: -40, opacity: 1 }}
            animate={{ x: CROWD_COLS * CELL, opacity: [1, 1, 0] }}
            transition={{ duration: 0.75, ease: "easeInOut" }}
          />
        )}
      </svg>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Pacing chart                                                               */
/* -------------------------------------------------------------------------- */

const STEP = 10; // minutes between plotted points

function curvePath(cum: number[], upTo: number, yMax: number): string {
  const pts: string[] = [];
  for (let m = 0; m <= upTo; m += STEP) pts.push(`${((m / MINUTES_PER_DAY) * 100).toFixed(2)},${(100 - (cum[m] / yMax) * 100).toFixed(2)}`);
  const end = Math.floor(upTo);
  if (end % STEP !== 0) pts.push(`${((end / MINUTES_PER_DAY) * 100).toFixed(2)},${(100 - (cum[end] / yMax) * 100).toFixed(2)}`);
  return pts.length ? `M${pts.join(" L")}` : "";
}

function PacingChart({
  t,
  budget,
  current,
  other,
  exhaustedAt,
  pacing,
  reachPct,
}: {
  t: number;
  budget: number;
  current: number[];
  other: number[];
  exhaustedAt: number | null;
  pacing: Pacing;
  reachPct: number;
}) {
  const reduce = useReducedMotion();
  const yMax = budget * 1.18;
  const shownTo = Math.floor(t);
  const line = curvePath(current, shownTo, yMax);
  const area = line ? `${line} L${((shownTo / MINUTES_PER_DAY) * 100).toFixed(2)},100 L0,100 Z` : "";
  const ghost = curvePath(other, MINUTES_PER_DAY, yMax);
  const headX = (shownTo / MINUTES_PER_DAY) * 100;
  const headY = 100 - (current[shownTo] / yMax) * 100;
  const budgetY = 100 - (budget / yMax) * 100;
  const maxShare = Math.max(...TRAFFIC);
  const gone = exhaustedAt !== null && t >= exhaustedAt;

  return (
    <div>
      <div className="relative h-48 rounded-lg border border-border bg-background/60 sm:h-56">
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <linearGradient id="an-area" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.35" />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.02" />
            </linearGradient>
          </defs>
          {/* Matching traffic per hour */}
          {TRAFFIC.map((share, h) => {
            const height = (share / maxShare) * 34 * Math.max(0.15, Math.min(1, reachPct / 40));
            return (
              <rect
                key={h}
                x={(h / 24) * 100 + 0.4}
                width={100 / 24 - 0.8}
                y={100 - height}
                height={height}
                fill="hsl(var(--secondary-foreground) / 0.12)"
              />
            );
          })}
          <line x1="0" x2="100" y1={budgetY} y2={budgetY} stroke="hsl(var(--floor))" strokeWidth={1.5} strokeDasharray="5 4" vectorEffect="non-scaling-stroke" />
          <path d={ghost} fill="none" stroke="hsl(var(--muted-foreground))" strokeOpacity={0.6} strokeWidth={1.5} strokeDasharray="3 4" vectorEffect="non-scaling-stroke" />
          {area && <path d={area} fill="url(#an-area)" />}
          {line && <path d={line} fill="none" stroke="hsl(var(--primary))" strokeWidth={2.5} vectorEffect="non-scaling-stroke" />}
          {gone && exhaustedAt !== null && (
            <line
              x1={(exhaustedAt / MINUTES_PER_DAY) * 100}
              x2={(exhaustedAt / MINUTES_PER_DAY) * 100}
              y1={0}
              y2={100}
              stroke="hsl(var(--nobid))"
              strokeWidth={1.5}
              strokeDasharray="2 3"
              vectorEffect="non-scaling-stroke"
            />
          )}
        </svg>
        <span className="figure absolute right-2 -translate-y-full pb-0.5 text-xs text-floor" style={{ top: `${budgetY}%` }}>
          daily budget {money(budget, 0)}
        </span>
        {gone && exhaustedAt !== null && (
          <motion.span
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="figure absolute top-2 whitespace-nowrap rounded-md border border-nobid/40 bg-card px-1.5 py-0.5 text-xs text-nobid"
            style={exhaustedAt / MINUTES_PER_DAY > 0.6 ? { right: `${100 - (exhaustedAt / MINUTES_PER_DAY) * 100 + 1}%` } : { left: `${(exhaustedAt / MINUTES_PER_DAY) * 100 + 1}%` }}
          >
            budget gone {clock(exhaustedAt)}
          </motion.span>
        )}
        {t > 0 && (
          <span
            className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary"
            style={{ left: `${headX}%`, top: `${headY}%`, boxShadow: "0 0 14px hsl(var(--primary) / 0.9)" }}
          >
            {!reduce && t < MINUTES_PER_DAY && !gone && (
              <motion.span
                className="absolute inset-0 rounded-full bg-primary"
                animate={{ scale: [1, 2.4], opacity: [0.6, 0] }}
                transition={{ duration: 1.1, repeat: Infinity, ease: "easeOut" }}
              />
            )}
          </span>
        )}
      </div>
      <div className="figure mt-1 flex justify-between text-xs text-muted-foreground" aria-hidden="true">
        <span>00:00</span>
        <span>06:00</span>
        <span>12:00</span>
        <span>18:00</span>
        <span>24:00</span>
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-0.5 w-4 rounded bg-primary" aria-hidden="true" />
          {pacing === "asap" ? "ASAP" : "Even"} spend so far
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-0 w-4 border-t-2 border-dashed border-muted-foreground" aria-hidden="true" />
          {pacing === "asap" ? "Even" : "ASAP"} for comparison
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-3 rounded-sm bg-secondary-foreground/15" aria-hidden="true" />
          matching traffic per hour
        </span>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Simulator                                                                  */
/* -------------------------------------------------------------------------- */

export default function Simulation({ onChallengePassed, challengePassed, onDescribe }: SimulationProps) {
  const reduce = useReducedMotion();
  const [active, setActive] = useShareableState<FilterId[]>("filters", NO_FILTERS, filtersCodec);
  const [pacing, setPacing] = useShareableState<Pacing>("pacing", "asap", pacingCodec);
  const [budget, setBudget] = useShareableState("budget", 150, budgetCodec);
  const [revealBuyers, setRevealBuyers] = useState(false);
  const [lastChange, setLastChange] = useState<string | null>(null);
  const playback = usePlayback(MINUTES_PER_DAY, { realMsPerSimMs: DAY_MS / MINUTES_PER_DAY });

  const result = useMemo(() => audience(CROWD, active), [active]);
  const asap = useMemo(() => simulatePacing(budget, result.reachPct, "asap"), [budget, result.reachPct]);
  const even = useMemo(() => simulatePacing(budget, result.reachPct, "even"), [budget, result.reachPct]);
  const run = pacing === "asap" ? asap : even;
  const other = pacing === "asap" ? even : asap;

  const toggle = useCallback(
    (id: FilterId) => {
      const on = active.includes(id);
      const next = on ? active.filter((x) => x !== id) : [...active, id];
      const after = audience(CROWD, next);
      const f = filterById(id);
      setActive(next);
      setLastChange(
        `${on ? "Removed" : "Added"} ${f.method.toLowerCase()} (${f.rule}): ${after.matched} of ${CROWD_SIZE} users left, ${pct(after.reachPct)} reach.`
      );
    },
    [active, setActive]
  );

  const met = rightSizedAndEven(result.reachPct, pacing);
  useChallenge(met, onChallengePassed, challengePassed);

  const underDelivers = run.totalSpent < budget - 0.5;
  const budgetVerdict =
    pacing === "asap"
      ? run.exhaustedAt !== null
        ? `ASAP pacing spends the whole ${money(budget, 0)} by ${clock(run.exhaustedAt)}, then shows no ads for the rest of the day.`
        : `ASAP pacing only manages ${money(run.totalSpent, 0)} of ${money(budget, 0)} — the audience is too small to absorb the budget.`
      : underDelivers
        ? `Even pacing only manages ${money(run.totalSpent, 0)} of ${money(budget, 0)} — the audience is too small to absorb the budget.`
        : `Even pacing spreads ${money(budget, 0)} across the whole day, about ${money(budget / 24)} an hour.`;

  useDescribe(
    onDescribe,
    `Crowd of ${CROWD_SIZE} users (each about ${int(PEOPLE_PER_DOT)} people). Targeting filters on: ${
      active.length ? active.map((id) => `${filterById(id).method} = ${filterById(id).rule}`).join("; ") : "none"
    }. ${result.matched} users match (${pct(result.reachPct, 1)} reach), and ${pct(result.precisionPct)} of them are would-be buyers. Daily budget ${money(
      budget,
      0
    )} with ${pacing === "asap" ? "ASAP" : "even"} pacing: ${budgetVerdict} The day clock is at ${clock(playback.t)}.`
  );

  const reachTone = result.reachPct >= 10 && result.reachPct <= 25 ? "primary" : result.reachPct < 10 ? "nobid" : "muted";

  return (
    <div className="space-y-4">
      <SimStage label="Audience narrowing and budget pacing">
        {/* Filter chips: the main controls sit right on top of the crowd */}
        <div className="flex flex-wrap gap-2" role="group" aria-label="Targeting filters">
          {FILTERS.map((f) => {
            const Icon = ICONS[f.id];
            const on = active.includes(f.id);
            return (
              <button
                key={f.id}
                type="button"
                aria-pressed={on}
                onClick={() => toggle(f.id)}
                className={cn(
                  "interactive inline-flex min-h-[2.5rem] items-center gap-2 rounded-full border px-3 text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  on
                    ? "border-primary bg-primary text-primary-foreground shadow-[0_0_18px_hsl(var(--primary)/0.4)]"
                    : "border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {f.rule}
              </button>
            );
          })}
        </div>

        <div className="mt-5 grid gap-5 md:grid-cols-[minmax(0,1fr)_14rem]">
          <div>
            <Crowd active={active} revealBuyers={revealBuyers} />
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-primary" aria-hidden="true" /> matches every rule
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" aria-hidden="true" /> filtered out
              </span>
              {revealBuyers && (
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-floor" aria-hidden="true" /> would-be buyer
                </span>
              )}
              <span>1 dot ≈ {int(PEOPLE_PER_DOT)} people</span>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Reach</p>
              <p className={cn("figure text-4xl", reachTone === "primary" ? "text-primary" : reachTone === "nobid" ? "text-nobid" : "text-foreground")}>
                <CountUp value={result.reachPct} format={(v) => pct(v, 1)} />
              </p>
              <p className="figure text-sm text-muted-foreground">
                <CountUp value={result.matched} format={(v) => int(v)} /> of {CROWD_SIZE} users
              </p>
              <div className="relative mt-2">
                <Meter value={result.reachPct} label="Reach" tone={reachTone === "nobid" ? "nobid" : "primary"} />
                {/* The challenge's 10–25% band */}
                <span className="pointer-events-none absolute -top-1 h-[1.1rem] rounded-sm border border-dashed border-floor" style={{ left: "10%", width: "15%" }} aria-hidden="true" />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Dashed box: the 10–25% target band</p>
            </div>
            <div>
              <div className="flex items-baseline justify-between">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Precision</p>
                <p className="figure text-sm text-floor">
                  <CountUp value={result.precisionPct} format={(v) => pct(v)} />
                </p>
              </div>
              <div className="mt-1">
                <Meter value={result.precisionPct} label="Precision" tone="floor" />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Share of the reached users who would actually buy</p>
            </div>

            {/* Narrowing waterfall */}
            <ol className="space-y-1.5" aria-label="How each filter narrowed the crowd">
              <li className="text-xs">
                <div className="flex justify-between text-muted-foreground">
                  <span>Everyone</span>
                  <span className="figure">{CROWD_SIZE}</span>
                </div>
                <div className="mt-0.5 h-1.5 rounded-full bg-primary/30" />
              </li>
              <AnimatePresence initial={false}>
                {result.waterfall.map((step) => (
                  <motion.li
                    key={step.id}
                    layout={!reduce}
                    initial={reduce ? false : { opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={reduce ? undefined : { opacity: 0, x: 8 }}
                    className="text-xs"
                  >
                    <div className="flex justify-between gap-2 text-foreground">
                      <span className="truncate">+ {filterById(step.id).rule}</span>
                      <span className="figure">{step.remaining}</span>
                    </div>
                    <div className="mt-0.5 h-1.5 rounded-full bg-secondary">
                      <motion.div
                        className="h-full rounded-full bg-primary"
                        initial={false}
                        animate={{ width: `${(step.remaining / CROWD_SIZE) * 100}%` }}
                        transition={{ type: "spring", stiffness: 140, damping: 22 }}
                      />
                    </div>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ol>
          </div>
        </div>

        <p className="mt-4 min-h-[1.5rem] text-sm text-foreground" aria-live="polite">
          {lastChange ?? "Switch on a targeting rule and watch the crowd narrow. Each rule must be true for a user to stay."}
        </p>

        {/* Budget pacing across one day */}
        <div className="mt-6 border-t border-border pt-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm uppercase tracking-wide text-muted-foreground">One day of spend</h3>
            <Segmented
              label="Pacing"
              value={pacing}
              onChange={setPacing}
              size="sm"
              options={[
                { value: "asap", label: "ASAP" },
                { value: "even", label: "Even" },
              ]}
            />
          </div>
          <PlaybackControls playback={playback} clock={<span className="text-lg text-foreground">{clock(playback.t)}</span>} />
          <div className="mt-4">
            <PacingChart
              t={playback.t}
              budget={budget}
              current={run.cumulative}
              other={other.cumulative}
              exhaustedAt={run.exhaustedAt}
              pacing={pacing}
              reachPct={result.reachPct}
            />
          </div>
          <p className="mt-3 min-h-[3rem] text-sm text-foreground" aria-live="polite">
            <span className="figure text-primary">
              {money(run.cumulative[Math.floor(playback.t)], 0)} spent by {clock(playback.t)} ·{" "}
            </span>
            {playback.t === 0
              ? "Press Play to run the day."
              : playback.done || (run.exhaustedAt !== null && playback.t >= run.exhaustedAt)
                ? budgetVerdict
                : pacing === "asap"
                  ? "ASAP pacing is buying every matching impression it can find…"
                  : "Even pacing is holding spend to a straight line, catching up after the quiet night hours…"}
          </p>
        </div>
      </SimStage>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel
          title="Targeting rules"
          actions={
            active.length > 0 ? (
              <SimButton
                variant="ghost"
                onClick={() => {
                  setActive(NO_FILTERS);
                  setLastChange(`Cleared every rule: all ${CROWD_SIZE} users are back.`);
                }}
                className="min-h-[2rem] px-2 text-xs"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
                Clear all
              </SimButton>
            ) : undefined
          }
        >
          <ul className="-mx-3 space-y-1" aria-label="Targeting rules">
            {FILTERS.map((f) => {
              const alone = audience(CROWD, [f.id]).reachPct;
              const on = active.includes(f.id);
              return (
                <li key={f.id}>
                  <button
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggle(f.id)}
                    className={cn(
                      "interactive flex w-full items-center justify-between gap-3 rounded-lg border px-3 py-2 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      on ? "border-primary/50 bg-primary/5" : "border-transparent hover:border-border"
                    )}
                  >
                    <span className="min-w-0">
                      <span className={cn("block", on ? "text-foreground" : "text-muted-foreground")}>
                        {f.method}: <span className="text-foreground">{f.rule}</span>
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        Reads {f.source.toLowerCase()} · keeps <span className="figure">{pct(alone)}</span> on its own
                      </span>
                    </span>
                    <span className={cn("figure shrink-0 rounded-full px-2 py-0.5 text-xs", on ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground")}>
                      {on ? "on" : "off"}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </Panel>

        <Panel title="Budget and pacing">
          <div className="space-y-4">
            <div>
              <p className="mb-2 text-sm text-foreground">Pacing</p>
              <Segmented
                label="Pacing mode"
                value={pacing}
                onChange={setPacing}
                options={[
                  { value: "asap", label: "ASAP" },
                  { value: "even", label: "Even (uniform)" },
                ]}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                {pacing === "asap"
                  ? "Buy every matching impression until the money runs out."
                  : "Aim for a straight line: the same share of budget every hour, catching up after quiet nights."}
              </p>
            </div>
            <SimSlider label="Daily budget cap" value={budget} min={50} max={300} step={10} onChange={setBudget} format={(v) => money(v, 0)} />
            <SimToggle
              label="Reveal would-be buyers"
              checked={revealBuyers}
              onChange={setRevealBuyers}
              hint="Show who would really buy the running shoe — the truth targeting is guessing at."
            />
          </div>
        </Panel>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Reach" value={pct(result.reachPct, 1)} tone={reachTone} sub={`${result.matched} of ${CROWD_SIZE} users`} />
        <Stat label="People reached" value={int(result.matched * PEOPLE_PER_DOT)} sub="estimated audience" />
        <Stat label="Precision" value={pct(result.precisionPct)} tone="floor" sub={`${result.buyers} would-be buyers`} />
        <Stat
          label={pacing === "asap" ? "Budget runs out" : "Budget lasts"}
          value={run.exhaustedAt !== null ? clock(run.exhaustedAt) : underDelivers ? "Under-spends" : "All day"}
          tone={run.exhaustedAt !== null ? "nobid" : underDelivers ? "floor" : "primary"}
          sub={`${money(run.totalSpent, 0)} of ${money(budget, 0)} spent`}
        />
      </div>

      <ChallengeMet show={met}>
        <span className="inline-flex items-center gap-1.5">
          <Users className="h-4 w-4" aria-hidden="true" />
          {pct(result.reachPct, 1)} of the crowd, paced evenly across the day. Challenge complete!
        </span>
      </ChallengeMet>
    </div>
  );
}

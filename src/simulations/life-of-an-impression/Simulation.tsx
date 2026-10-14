import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Eye, EyeOff, Globe, LogOut, MousePointerClick, RefreshCw, ShoppingCart } from "lucide-react";

import { enumCodec, numberCodec, useShareableState } from "@/hooks/useShareableState";
import { cn } from "@/lib/utils";
import {
  CHAIN,
  ChallengeMet,
  Meter,
  Panel,
  PlaybackControls,
  Segmented,
  SimButton,
  SimSlider,
  SimStage,
  Stat,
  int,
  money,
  pct,
  useChallenge,
  useDescribe,
  usePlayback,
} from "@/simulations/kit";
import type { SimulationProps } from "@/simulations/types";
import {
  DEFAULT_RATES,
  IMPRESSION_AT,
  LOAD_MS,
  MODELS,
  SCROLL_AT,
  TAG_AT,
  VIEWABILITY,
  VIEWABLE_RULE,
  buildFunnel,
  campaignCosts,
  cheapestModels,
  inViewAt,
  isCheapestPick,
  sessionCounts,
  unseenCpmSpend,
  viewableAt,
  type Model,
  type Rates,
  type SlotPosition,
} from "@/simulations/life-of-an-impression/logic";

/**
 * Life of an impression: one visitor at a time loads a page, the slot fills
 * and an impression counts; whether it becomes *viewable* depends on where
 * the slot sits. Then the same funnel is scaled up to a campaign and priced
 * under CPM, CPC and CPA, using the basics lessons' rates as defaults.
 */

const MAX_LOADS = 10;
const slotCodec = enumCodec(["above", "below"] as const);
const ctrCodec = numberCodec(0.1, 2);

/** How long a visitor who never sees the ad stays before leaving (within a load). */
const leaveAt = (slot: SlotPosition) => (slot === "above" ? IMPRESSION_AT + 550 : 1750);

type VisitState = "idle" | "loading" | "requesting" | "rendered" | "inview" | "viewable" | "left";

function visitState(index: number, phase: number, slot: SlotPosition, started: boolean): VisitState {
  if (!started) return "idle";
  if (phase < TAG_AT) return "loading";
  if (phase < IMPRESSION_AT) return "requesting";
  const v = viewableAt(index, slot);
  if (v !== null && phase >= v) return "viewable";
  if (v === null && phase >= leaveAt(slot)) return "left";
  const inView = inViewAt(index, slot);
  if (inView !== null && phase >= inView) return "inview";
  return "rendered";
}

function narrate(state: VisitState, slot: SlotPosition, visit: number): string {
  const where = slot === "above" ? "above the fold" : "below the fold";
  switch (state) {
    case "idle":
      return `Press “Load the page” to send a visitor. The ad slot sits ${where}.`;
    case "loading":
      return `Visit ${visit}: the page loads. The ad slot is reserved, but empty.`;
    case "requesting":
      return "The slot's ad tag calls the ad server and asks for something to render.";
    case "rendered":
      return "The creative rendered, so an impression is counted — but the slot is below the fold, off screen.";
    case "inview":
      return `The ad is on screen. It needs ${VIEWABLE_RULE.share}% of its pixels in view for ${VIEWABLE_RULE.seconds} second to count as viewable.`;
    case "viewable":
      return `Held in view for ${VIEWABLE_RULE.seconds} second: one impression, and it is viewable.`;
    case "left":
      return "The visitor left before the ad spent a second in view: the impression still counts, but it is not viewable.";
  }
}

/* -------------------------------------------------------------------------- */
/* The browser mock-up                                                         */
/* -------------------------------------------------------------------------- */

function TextLines({ count, widths = ["w-full", "w-11/12", "w-4/5", "w-full", "w-3/4"] }: { count: number; widths?: string[] }) {
  return (
    <div className="space-y-2" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className={cn("h-2 rounded bg-muted-foreground/20", widths[i % widths.length])} />
      ))}
    </div>
  );
}

function AdSlot({ state, visit }: { state: VisitState; visit: number }) {
  const reduce = useReducedMotion();
  const filled = state !== "idle" && state !== "loading" && state !== "requesting";
  return (
    <div className="relative h-16 overflow-hidden rounded-lg border-2 border-dashed border-border-strong bg-secondary/60">
      <AnimatePresence initial={false}>
        {state === "requesting" && (
          <motion.div
            key="req"
            className="absolute inset-0 flex items-center justify-center gap-2 text-xs text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.1 } }}
          >
            {!reduce && (
              <motion.span
                className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-primary/20 to-transparent"
                initial={{ left: "-35%" }}
                animate={{ left: "105%" }}
                transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
              />
            )}
            <span className="figure relative">ad tag → ad server…</span>
          </motion.div>
        )}
        {filled && (
          <motion.div
            key={`ad-${visit}`}
            className="absolute inset-0 flex items-center justify-between gap-2 px-3 text-primary-foreground"
            style={{ background: `linear-gradient(120deg, hsl(${CHAIN.advertiser}), hsl(var(--primary)))` }}
            initial={reduce ? false : { opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.1 } }}
            transition={{ opacity: { duration: 0.15 }, scale: { type: "spring", stiffness: 260, damping: 18 } }}
          >
            <span className="text-sm">Trail runners, 30% off</span>
            <span className="rounded-md bg-card/90 px-2 py-1 text-xs text-foreground">Shop now</span>
          </motion.div>
        )}
        {(state === "idle" || state === "loading") && (
          <motion.span
            key="empty"
            className="figure absolute inset-0 flex items-center justify-center text-xs text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.1 } }}
          >
            ad slot · 728×90
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}

/** A ring that fills over the 1-second viewability hold. Decorative; the narration says the same. */
function HoldRing({ progress, done }: { progress: number; done: boolean }) {
  const r = 15;
  const c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 40 40" className="h-10 w-10" aria-hidden="true">
      <circle cx="20" cy="20" r={r} fill="none" stroke="hsl(var(--border))" strokeWidth="4" />
      <circle
        cx="20"
        cy="20"
        r={r}
        fill="none"
        stroke={done ? "hsl(var(--primary))" : "hsl(var(--floor))"}
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - Math.max(0, Math.min(1, progress)))}
        transform="rotate(-90 20 20)"
        style={done ? { filter: "drop-shadow(0 0 6px hsl(var(--primary) / 0.7))" } : undefined}
      />
    </svg>
  );
}

function BrowserMock({ state, slot, visit, phase, index }: { state: VisitState; slot: SlotPosition; visit: number; phase: number; index: number }) {
  const reduce = useReducedMotion();
  const inView = inViewAt(index, slot);
  const scrolled = slot === "below" && inView !== null && phase >= inView - 300 && state !== "idle";
  const holdStart = inView ?? 0;
  const holdProgress = state === "viewable" ? 1 : state === "inview" || (state === "left" && slot === "above") ? (Math.min(phase, leaveAt(slot)) - holdStart) / 1000 : 0;
  const loading = state === "loading" || state === "requesting";
  const slotEl = <AdSlot state={state} visit={visit} />;

  return (
    <div className="rounded-xl border border-border bg-background shadow-[0_0_32px_hsl(var(--primary)/0.12)]">
      <div className="flex items-center gap-2 border-b border-border px-3 py-2" aria-hidden="true">
        <span className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <span key={i} className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30" />
          ))}
        </span>
        <span className="figure flex min-w-0 flex-1 items-center gap-1.5 truncate rounded-md bg-secondary px-2 py-1 text-xs text-muted-foreground">
          <Globe className="h-3 w-3 shrink-0" />
          news.example/trail-running
        </span>
        <motion.span animate={loading && !reduce ? { rotate: 360 } : { rotate: 0 }} transition={loading && !reduce ? { duration: 0.8, repeat: Infinity, ease: "linear" } : { duration: 0 }}>
          <RefreshCw className={cn("h-3.5 w-3.5", loading ? "text-primary" : "text-muted-foreground")} />
        </motion.span>
      </div>

      <div className="relative h-60 overflow-hidden">
        <motion.div
          key={visit}
          className="space-y-3 p-4"
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: state === "idle" ? 0.5 : 1, y: scrolled ? -150 : 0 }}
          transition={{ opacity: { duration: 0.25 }, y: { duration: reduce ? 0 : 0.5, ease: "easeInOut" } }}
        >
          <div className="h-3.5 w-2/3 rounded bg-foreground/25" aria-hidden="true" />
          {slot === "above" && slotEl}
          <TextLines count={slot === "above" ? 9 : 12} />
          {slot === "below" && slotEl}
          <TextLines count={5} />
        </motion.div>

        {/* A mini scrollbar: where the viewport and the slot sit on the whole page. */}
        <div className="absolute bottom-3 right-1.5 top-3 w-1.5 rounded-full bg-secondary" aria-hidden="true">
          <motion.span
            className="absolute inset-x-0 h-[57%] rounded-full bg-muted-foreground/35"
            initial={false}
            animate={{ top: scrolled ? "36%" : "0%" }}
            transition={{ duration: reduce ? 0 : 0.5, ease: "easeInOut" }}
          />
          <span
            className="absolute -left-[3px] h-3 w-3 rounded-full bg-primary shadow-[0_0_10px_hsl(var(--primary)/0.8)]"
            style={{ top: slot === "above" ? "12%" : "74%" }}
          />
        </div>

        {/* The fold: the bottom edge of what the visitor can see without scrolling. */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-end border-b-2 border-dashed border-floor/70" aria-hidden="true">
          <span className="figure mb-1 mr-2 rounded bg-card/90 px-1.5 text-xs text-floor">the fold</span>
        </div>

        {/* Viewability hold indicator */}
        <AnimatePresence>
          {(state === "inview" || state === "viewable" || (state === "left" && slot === "above")) && (
            <motion.div
              className="absolute right-2 top-2 flex items-center gap-1.5 rounded-full border border-border bg-card/95 py-0.5 pl-0.5 pr-2.5 shadow-sm"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              aria-hidden="true"
            >
              <HoldRing progress={holdProgress} done={state === "viewable"} />
              <span className={cn("figure text-xs", state === "viewable" ? "text-primary" : "text-muted-foreground")}>
                {state === "viewable" ? "viewable" : `${Math.max(0, Math.min(1, holdProgress)).toFixed(1)} s in view`}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* +1 impression chip */}
        <AnimatePresence>
          {state !== "idle" && phase >= IMPRESSION_AT && phase < IMPRESSION_AT + 900 && (
            <motion.span
              key={`imp-${visit}`}
              className="figure absolute left-1/2 top-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs text-primary-foreground shadow-[0_0_24px_hsl(var(--primary)/0.6)]"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: [0, 1, 1, 0], y: reduce ? 0 : -40 }}
              transition={{ duration: 0.9 }}
              aria-hidden="true"
            >
              +1 impression
            </motion.span>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {state === "left" && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center bg-card/70 backdrop-blur-[1px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              aria-hidden="true"
            >
              <span className="flex items-center gap-2 rounded-full border border-nobid/40 bg-card px-3 py-1.5 text-xs text-nobid">
                <LogOut className="h-3.5 w-3.5" />
                visitor left — not viewable
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Funnel and pricing                                                          */
/* -------------------------------------------------------------------------- */

function FunnelBars({ rows, base }: { rows: Array<{ label: string; value: number; icon: ReactNode; tone: string }>; base: number }) {
  const scale = (v: number) => (v <= 0 ? 0 : Math.max(5, (Math.log10(v + 1) / Math.log10(base + 1)) * 100));
  return (
    <ul className="space-y-2.5">
      {rows.map((row) => (
        <li key={row.label}>
          <div className="mb-1 flex items-baseline justify-between gap-2 text-sm">
            <span className="flex items-center gap-1.5 text-foreground">
              <span className="text-muted-foreground" aria-hidden="true">
                {row.icon}
              </span>
              {row.label}
            </span>
            <span className="figure text-foreground">{int(row.value)}</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-secondary">
            <motion.div
              className="h-full rounded-full"
              style={{ background: row.tone, boxShadow: `0 0 12px ${row.tone}` }}
              initial={false}
              animate={{ width: `${scale(row.value)}%` }}
              transition={{ type: "spring", stiffness: 120, damping: 20 }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

export default function Simulation({ onChallengePassed, challengePassed, onDescribe }: SimulationProps) {
  const [slot, setSlot] = useShareableState<SlotPosition>("slot", "above", slotCodec);
  const [ctr, setCtr] = useShareableState("ctr", 0.2, ctrCodec);
  const [convRate, setConvRate] = useState(5);
  const [bought, setBought] = useState(50000);
  const [rates, setRates] = useState<Rates>(DEFAULT_RATES);
  const [pick, setPick] = useState<Model | null>(null);

  /* ---- visitor-by-visitor playback ---- */
  const playback = usePlayback(MAX_LOADS * LOAD_MS);
  const { pause, seek, play, reset } = playback;
  const [stopAt, setStopAt] = useState<number | null>(null);
  useEffect(() => {
    if (stopAt !== null && playback.t >= stopAt) {
      pause();
      seek(stopAt);
      setStopAt(null);
    }
  }, [playback.t, stopAt, pause, seek]);

  const started = playback.t > 0;
  const index = Math.min(MAX_LOADS - 1, Math.floor(playback.t / LOAD_MS));
  const phase = playback.t - index * LOAD_MS;
  const visit = index + 1;
  const state = visitState(index, phase, slot, started);
  const session = sessionCounts(playback.t, slot, MAX_LOADS);
  const nextIndex = started ? Math.floor((playback.t + 1) / LOAD_MS) : 0;

  const loadOnce = () => {
    if (nextIndex >= MAX_LOADS) return;
    seek(nextIndex * LOAD_MS);
    setStopAt((nextIndex + 1) * LOAD_MS - 1);
    play();
  };

  /* Moving the slot starts a fresh session, remembering the last one for comparison. */
  const [previous, setPrevious] = useState<{ slot: SlotPosition; impressions: number; viewable: number } | null>(null);
  const sessionRef = useRef({ slot, ...session });
  sessionRef.current = { slot, ...session };
  const changeSlot = useCallback(
    (next: SlotPosition) => {
      if (next === sessionRef.current.slot) return;
      if (sessionRef.current.impressions > 0) setPrevious({ ...sessionRef.current });
      setStopAt(null);
      reset();
      setSlot(next);
    },
    [reset, setSlot]
  );

  const controls = {
    ...playback,
    toggle: () => {
      setStopAt(null);
      playback.toggle();
    },
  };

  /* ---- the campaign at scale ---- */
  const funnel = useMemo(() => buildFunnel(bought, ctr, convRate, slot), [bought, ctr, convRate, slot]);
  const costs = useMemo(() => campaignCosts(funnel, rates), [funnel, rates]);
  const cheapest = cheapestModels(costs);
  const revealed = pick !== null;
  const correct = isCheapestPick(pick, costs);
  const maxCost = Math.max(costs.cpm, costs.cpc, costs.cpa, 0.01);

  useChallenge(correct, onChallengePassed, challengePassed);

  const label = (m: Model) => MODELS.find((x) => x.id === m)?.label ?? m;
  useDescribe(
    onDescribe,
    `Ad slot ${slot === "above" ? "above" : "below"} the fold. Visitor session: ${session.impressions} impressions, ${session.viewable} viewable; current visit is "${state}". Campaign: ${int(
      funnel.impressions
    )} impressions, ${int(funnel.viewable)} viewable (${pct(VIEWABILITY[slot] * 100)}), CTR ${ctr.toFixed(1)}% gives ${int(funnel.clicks)} clicks, ${convRate}% convert for ${int(
      funnel.conversions
    )} conversions. Rates: ${money(rates.cpm)} CPM, ${money(rates.cpc)} CPC, ${money(rates.cpa)} CPA. ${
      revealed
        ? `Costs: CPM ${money(costs.cpm)}, CPC ${money(costs.cpc)}, CPA ${money(costs.cpa)}. Learner picked ${label(pick!)}, which is ${correct ? "the cheapest" : `not the cheapest (${cheapest.map(label).join(" or ")} is)`}.`
        : "The learner hasn't picked the cheapest model yet, so the totals are hidden."
    }`
  );

  const formulas: Record<Model, string> = {
    cpm: `${int(funnel.impressions)} ÷ 1,000 × ${money(rates.cpm)}`,
    cpc: `${int(funnel.clicks)} clicks × ${money(rates.cpc)}`,
    cpa: `${int(funnel.conversions)} conversions × ${money(rates.cpa)}`,
  };
  const rateSetters: Record<Model, (v: number) => void> = {
    cpm: (v) => setRates((r) => ({ ...r, cpm: v })),
    cpc: (v) => setRates((r) => ({ ...r, cpc: v })),
    cpa: (v) => setRates((r) => ({ ...r, cpa: v })),
  };
  const rateRange: Record<Model, { min: number; max: number; step: number }> = {
    cpm: { min: 0.5, max: 20, step: 0.5 },
    cpc: { min: 0.1, max: 5, step: 0.05 },
    cpa: { min: 2, max: 100, step: 1 },
  };

  return (
    <div className="space-y-4">
      <SimStage label="One visitor loads the page">
        <div className="flex flex-wrap items-center gap-2">
          <SimButton variant="primary" onClick={loadOnce} disabled={nextIndex >= MAX_LOADS || playback.playing}>
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Load the page
          </SimButton>
          <Segmented
            label="Ad slot position"
            value={slot}
            onChange={changeSlot}
            options={[
              { value: "above", label: "Above the fold" },
              { value: "below", label: "Below the fold" },
            ]}
          />
        </div>
        <div className="mt-3">
          <PlaybackControls
            playback={controls}
            clock={
              <span>
                visit <span className="text-lg text-foreground">{started ? visit : 0}</span> / {MAX_LOADS}
              </span>
            }
          />
        </div>

        <div className="mt-5 grid gap-5 md:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
          <BrowserMock state={state} slot={slot} visit={visit} phase={phase} index={index} />

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg border border-border bg-background/70 p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Impressions</p>
                <motion.p key={session.impressions} initial={{ scale: 1.25 }} animate={{ scale: 1 }} className="figure mt-1 origin-left text-2xl text-foreground">
                  {session.impressions}
                </motion.p>
              </div>
              <div className="rounded-lg border border-primary/40 bg-primary/5 p-3 shadow-[0_0_20px_hsl(var(--primary)/0.15)]">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Viewable</p>
                <motion.p key={session.viewable} initial={{ scale: 1.25 }} animate={{ scale: 1 }} className="figure mt-1 origin-left text-2xl text-primary">
                  {session.viewable}
                </motion.p>
              </div>
            </div>
            <div>
              <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                <span>Viewability this session</span>
                <span className="figure">{session.impressions ? pct((session.viewable / session.impressions) * 100) : "—"}</span>
              </div>
              <Meter value={session.impressions ? (session.viewable / session.impressions) * 100 : 0} label="Viewability this session" />
              {previous && (
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Last session, slot {previous.slot === "above" ? "above" : "below"} the fold:{" "}
                  <span className="figure text-foreground">{pct(previous.impressions ? (previous.viewable / previous.impressions) * 100 : 0)}</span> viewable.
                </p>
              )}
            </div>
            <ol className="space-y-1.5" aria-label="Visits so far">
              <AnimatePresence initial={false}>
                {Array.from({ length: session.impressions }, (_, i) => i)
                  .slice(-4)
                  .reverse()
                  .map((i) => {
                    const v = viewableAt(i, slot);
                    const settled = i < index || state === "viewable" || state === "left";
                    const ok = v !== null;
                    return (
                      <motion.li
                        key={i}
                        layout
                        initial={{ opacity: 0, x: 12 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center justify-between gap-2 rounded-md border border-border bg-background/60 px-2.5 py-1.5 text-xs"
                      >
                        <span className="figure text-muted-foreground">visit {i + 1}</span>
                        {!settled ? (
                          <span className="text-muted-foreground">watching…</span>
                        ) : ok ? (
                          <span className="flex items-center gap-1 text-primary">
                            <Eye className="h-3.5 w-3.5" aria-hidden="true" /> viewable
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-nobid">
                            <EyeOff className="h-3.5 w-3.5" aria-hidden="true" /> not viewable
                          </span>
                        )}
                      </motion.li>
                    );
                  })}
              </AnimatePresence>
            </ol>
          </div>
        </div>

        <p className="mt-4 min-h-[3rem] text-sm text-foreground" aria-live="polite">
          <span className="figure text-primary">{started ? `visit ${visit} · ` : ""}</span>
          {narrate(state, slot, visit)}
        </p>
      </SimStage>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Scale it up: the campaign">
          <div className="space-y-4">
            <SimSlider label="Impressions bought" value={bought} min={10000} max={200000} step={10000} onChange={setBought} format={int} />
            <SimSlider
              label="Click-through rate"
              value={ctr}
              min={0.1}
              max={2}
              step={0.1}
              onChange={(v) => setCtr(Number(v.toFixed(1)))}
              format={(v) => `${v.toFixed(1)}%`}
              hint="Clicks ÷ impressions. A typical CTR sits around 0.1–0.3%."
            />
            <SimSlider label="Conversion rate on clicks" value={convRate} min={1} max={20} onChange={setConvRate} format={(v) => `${v}%`} />
            <FunnelBars
              base={funnel.impressions}
              rows={[
                { label: "Impressions", value: funnel.impressions, icon: <Globe className="h-4 w-4" />, tone: `hsl(${CHAIN.publisher})` },
                { label: "Viewable", value: funnel.viewable, icon: <Eye className="h-4 w-4" />, tone: "hsl(var(--primary))" },
                { label: "Clicks", value: funnel.clicks, icon: <MousePointerClick className="h-4 w-4" />, tone: `hsl(${CHAIN.dsp})` },
                { label: "Conversions", value: funnel.conversions, icon: <ShoppingCart className="h-4 w-4" />, tone: `hsl(${CHAIN.advertiser})` },
              ]}
            />
            <p className="text-xs text-muted-foreground">
              Bars use a log scale so clicks stay visible. Viewable share by slot position is illustrative: {pct(VIEWABILITY.above * 100)} above the fold,{" "}
              {pct(VIEWABILITY.below * 100)} below.
            </p>
          </div>
        </Panel>

        <Panel title="Scenario rates (quoted to the advertiser)">
          <div className="space-y-4">
            {MODELS.map((m) => (
              <SimSlider
                key={m.id}
                label={`${m.label} rate, ${m.unit}`}
                value={rates[m.id]}
                min={rateRange[m.id].min}
                max={rateRange[m.id].max}
                step={rateRange[m.id].step}
                onChange={rateSetters[m.id]}
                format={(v) => money(v)}
              />
            ))}
            <SimButton variant="ghost" onClick={() => setRates(DEFAULT_RATES)} className="px-0">
              Back to the lesson's rates
            </SimButton>
            <div className="border-t border-border pt-3">
              <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">Who carries the risk</p>
              <ul className="space-y-1.5 text-sm">
                {MODELS.map((m) => (
                  <li key={m.id} className="flex justify-between gap-3">
                    <span className="text-foreground">{m.label}</span>
                    <span className="text-right text-muted-foreground">{m.risk}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-xs text-muted-foreground">The further down the funnel payment triggers, the more risk moves from advertiser to seller.</p>
            </div>
          </div>
        </Panel>
      </div>

      <Panel title="Which deal costs the advertiser least?">
        <p className="mb-3 text-sm text-muted-foreground">Work it out from the funnel and the rates, then make your pick — the totals reveal once you choose.</p>
        <div className="grid gap-3 md:grid-cols-3">
          {MODELS.map((m) => {
            const isPick = pick === m.id;
            const isBest = revealed && cheapest.includes(m.id);
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setPick(m.id)}
                aria-pressed={isPick}
                className={cn(
                  "interactive relative flex flex-col gap-2 overflow-hidden rounded-xl border-2 bg-background p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  isPick ? (isBest ? "border-primary shadow-[0_0_24px_hsl(var(--primary)/0.4)]" : "border-nobid") : "border-border hover:border-primary/50"
                )}
              >
                <span>
                  <span className="block text-lg text-foreground">{m.label}</span>
                  <span className="block text-xs text-muted-foreground">Pays on {m.trigger}</span>
                </span>
                <span className="figure text-xs text-muted-foreground">{formulas[m.id]}</span>
                <span className={cn("figure text-2xl", isBest ? "text-primary" : "text-foreground")}>{revealed ? money(costs[m.id]) : "= ?"}</span>
                <span className="h-2 overflow-hidden rounded-full bg-secondary" aria-hidden="true">
                  <motion.span
                    className={cn("block h-full rounded-full", isBest ? "bg-primary" : "bg-muted-foreground/50")}
                    initial={false}
                    animate={{ width: revealed ? `${(costs[m.id] / maxCost) * 100}%` : "0%" }}
                    transition={{ type: "spring", stiffness: 120, damping: 20 }}
                  />
                </span>
                <span className="sr-only">{isPick ? "Your pick." : "Pick this model."}</span>
              </button>
            );
          })}
        </div>
        <p className="mt-3 min-h-[1.5rem] text-sm" aria-live="polite">
          {pick === null ? (
            <span className="text-muted-foreground">No pick yet.</span>
          ) : correct ? (
            <span className="text-primary">
              Right — {label(pick)} is cheapest at {money(costs[pick])}. Change the CTR or a rate and the answer can flip.
            </span>
          ) : (
            <span className="text-nobid">
              Not this time: {label(pick)} costs {money(costs[pick])}, but {cheapest.map(label).join(" or ")} costs {money(costs[cheapest[0]])}. Try another pick.
            </span>
          )}
        </p>
      </Panel>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Viewable" value={int(funnel.viewable)} tone="primary" sub={`${pct(VIEWABILITY[slot] * 100)} of impressions`} />
        <Stat label="One impression" value={money(rates.cpm / 1000, 3)} sub={`${money(rates.cpm)} CPM ÷ 1,000`} />
        <Stat label="Conversions" value={int(funnel.conversions)} sub={`${int(funnel.clicks)} clicks × ${convRate}%`} />
        <Stat label="CPM spend unseen" value={money(unseenCpmSpend(funnel, rates))} tone={slot === "below" ? "nobid" : "floor"} sub="paid for, never viewable" />
      </div>

      <ChallengeMet show={correct}>
        {pick ? `${label(pick)} is the cheapest deal for this campaign at ${money(costs[pick])}. Challenge complete!` : "Challenge complete!"}
      </ChallengeMet>
    </div>
  );
}

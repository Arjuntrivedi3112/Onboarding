import { useMemo, type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Building2, DollarSign, Eye, MousePointerClick, Scale, ShoppingCart, Store } from "lucide-react";

import { enumCodec, numberCodec, useShareableState } from "@/hooks/useShareableState";
import { cn } from "@/lib/utils";
import {
  CHAIN,
  ChallengeMet,
  FlowNode,
  Panel,
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
  type ChainRole,
} from "@/simulations/kit";
import type { SimulationProps } from "@/simulations/types";
import { CountUp } from "@/simulations/metrics-lab/CountUp";
import {
  AD_BLOCK_LOSS,
  BOT_SHARE,
  IAB_TOLERANCE,
  LATENCY_LOSS,
  PRESETS,
  VIEWABLE_RATE,
  effectiveMetrics,
  reconcile,
  reconciledAndPriced,
  withinTolerance,
  type Counting,
} from "@/simulations/metrics-lab/logic";

/**
 * The metrics and reconciliation lab, rebuilt from the original tracking
 * module's eCPM/eCPC/eCPA calculator and discrepancy calculator. Numbers
 * and formulas follow the tracking lessons: the three book campaigns as
 * presets, the IAB's 10% tolerance measured against the advertiser's count.
 */

const countingCodec = enumCodec(["mixed", "pixel", "server"] as const);
const spendCodec = numberCodec(0, 20_000);
const imprCodec = numberCodec(0, 3_000_000);
const clicksCodec = numberCodec(0, 10_000);
const convCodec = numberCodec(0, 200);
const boolCodec = {
  serialize: (v: boolean) => (v ? "1" : "0"),
  deserialize: (raw: string) => (raw === "1" ? true : raw === "0" ? false : null),
};

/** Whole dollars with thousands separators. */
const dollars = (v: number) => `$${int(v)}`;

/** Funnel nodes shrink a little on tablets so four fit in a row. */
const NODE = "sm:min-w-[5.5rem] sm:px-2";

const COUNTING: Record<Counting, { label: string; detail: string }> = {
  mixed: {
    label: "Server vs pixel",
    detail: "The publisher's ad server counts each request it serves; the advertiser's ad server counts only when its pixel fires in the browser.",
  },
  pixel: {
    label: "Dual pixel",
    detail: "Both sides embed a 1×1 pixel in the same markup. When a browser fails to render, both lose the impression together.",
  },
  server: {
    label: "Both server-side",
    detail: "Both sides count on the server, so nothing in the browser has to succeed for either count to happen.",
  },
};

/* -------------------------------------------------------------------------- */
/* Funnel                                                                     */
/* -------------------------------------------------------------------------- */

/** A connector between funnel nodes: horizontal on wide screens, vertical on phones, with dots flowing along it. */
function Connector({ dots, label, color }: { dots: number; label?: ReactNode; color: string }) {
  const reduce = useReducedMotion();
  const n = Math.max(1, Math.min(5, dots));
  const flow = (vertical: boolean) => (
    <>
      <span
        className={cn("absolute rounded-full", vertical ? "left-1/2 top-0 h-full w-0.5 -translate-x-1/2" : "left-0 top-1/2 h-0.5 w-full -translate-y-1/2")}
        style={{ background: `linear-gradient(${vertical ? "180deg" : "90deg"}, hsl(${color} / 0.15), hsl(${color} / 0.6))` }}
      />
      {!reduce &&
        Array.from({ length: n }, (_, i) => (
          <motion.span
            key={i}
            className="absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{
              background: `hsl(${color})`,
              boxShadow: `0 0 10px hsl(${color} / 0.9)`,
              ...(vertical ? { left: "50%" } : { top: "50%" }),
            }}
            initial={vertical ? { top: "0%", opacity: 0 } : { left: "0%", opacity: 0 }}
            animate={vertical ? { top: ["0%", "100%"], opacity: [0, 1, 1, 0] } : { left: ["0%", "100%"], opacity: [0, 1, 1, 0] }}
            transition={{ duration: 1.4, delay: (i * 1.4) / n, repeat: Infinity, ease: "linear" }}
          />
        ))}
    </>
  );
  return (
    <div className="flex flex-col items-center justify-center gap-1 sm:min-w-[2.5rem] sm:flex-1" aria-hidden="true">
      <div className="relative h-8 w-full sm:hidden">{flow(true)}</div>
      <div className="relative hidden h-4 w-full sm:block">{flow(false)}</div>
      {label && <span className="figure whitespace-nowrap text-xs text-muted-foreground">{label}</span>}
    </div>
  );
}

function MetricCard({ label, value, formula, tone }: { label: string; value: ReactNode; formula: ReactNode; tone: ChainRole }) {
  return (
    <div
      className="relative overflow-hidden rounded-xl border bg-card p-3"
      style={{ borderColor: `hsl(${CHAIN[tone]} / 0.5)`, boxShadow: `0 0 24px hsl(${CHAIN[tone]} / 0.18)` }}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-12"
        style={{ background: `linear-gradient(180deg, hsl(${CHAIN[tone]} / 0.14), transparent)` }}
        aria-hidden="true"
      />
      <p className="relative text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="figure relative mt-1 text-2xl text-foreground">{value}</p>
      <p className="figure relative mt-1 text-xs text-muted-foreground">{formula}</p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Reconciliation columns                                                     */
/* -------------------------------------------------------------------------- */

function Rain({ lostShare, color, running }: { lostShare: number; color: string; running: boolean }) {
  const reduce = useReducedMotion();
  if (reduce || !running) return null;
  const n = 6;
  const lost = Math.round(n * Math.min(1, lostShare));
  return (
    <div className="pointer-events-none absolute inset-x-0 -top-8 h-8" aria-hidden="true">
      {Array.from({ length: n }, (_, i) => {
        const dies = i < lost;
        return (
          <motion.span
            key={`${i}-${dies}`}
            className="absolute h-1.5 w-1.5 rounded-full"
            style={{
              left: `${12 + ((i * 37) % 76)}%`,
              background: dies ? "hsl(var(--nobid))" : `hsl(${color})`,
              boxShadow: dies ? undefined : `0 0 8px hsl(${color} / 0.9)`,
            }}
            initial={{ top: "0%", opacity: 0 }}
            animate={dies ? { top: ["0%", "55%"], opacity: [0, 1, 0], scale: [1, 1, 0.2] } : { top: ["0%", "120%"], opacity: [0, 1, 0] }}
            transition={{ duration: 1.1, delay: i * 0.19, repeat: Infinity, ease: "easeIn" }}
          />
        );
      })}
    </div>
  );
}

function Columns({ publisher, advertiser, gap }: { publisher: number; advertiser: number; gap: { bots: number; renders: number; viewability: number } }) {
  const max = Math.max(publisher, advertiser, 1);
  const h = (v: number) => `${(v / max) * 100}%`;
  const spring = { type: "spring", stiffness: 110, damping: 20 } as const;
  const segments = [
    { key: "viewability", value: gap.viewability, className: "bg-muted-foreground/35", label: "not viewable" },
    { key: "renders", value: gap.renders, className: "bg-floor/70", label: "pixel never fired" },
    { key: "bots", value: gap.bots, className: "bg-nobid/70", label: "bots" },
  ];
  return (
    <div className="grid grid-cols-2 gap-4 sm:gap-6">
      {[
        { id: "pub", title: "Publisher's ad server", icon: <Store className="h-4 w-4" aria-hidden="true" />, color: CHAIN.publisher, value: publisher },
        { id: "adv", title: "Advertiser's ad server", icon: <Building2 className="h-4 w-4" aria-hidden="true" />, color: CHAIN.advertiser, value: advertiser },
      ].map((col) => (
        <div key={col.id} className="flex flex-col">
          <p className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-muted-foreground">
            <span style={{ color: `hsl(${col.color})` }}>{col.icon}</span>
            {col.title}
          </p>
          <p className="figure mt-1 text-lg text-foreground">
            <CountUp value={col.value} format={int} />
          </p>
          <div className="relative mt-10 h-40 rounded-lg border border-border bg-background/60 sm:h-48">
            <Rain lostShare={col.id === "adv" ? 1 - advertiser / max : 0} color={col.color} running />
            <div className="absolute inset-x-3 bottom-0 top-0 flex flex-col justify-end">
              {col.id === "pub" &&
                segments.map((s) => (
                  <motion.div
                    key={s.key}
                    className={cn("w-full first:rounded-t-md", s.className)}
                    initial={false}
                    animate={{ height: h(s.value) }}
                    transition={spring}
                    title={s.label}
                  />
                ))}
              <motion.div
                className="w-full rounded-t-md"
                style={{
                  background: `linear-gradient(180deg, hsl(${col.color}), hsl(${col.color} / 0.55))`,
                  boxShadow: `0 0 22px hsl(${col.color} / 0.35)`,
                }}
                initial={false}
                animate={{ height: h(col.id === "pub" ? publisher - gap.bots - gap.renders - gap.viewability : advertiser) }}
                transition={spring}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/** A half-dial from 0% to 20%, green up to the IAB's 10% (straight up), red beyond. */
function ToleranceGauge({ discrepancy }: { discrepancy: number }) {
  const reduce = useReducedMotion();
  const MAX = 20;
  const clamped = Math.max(0, Math.min(MAX, Math.abs(discrepancy)));
  const angle = -90 + (clamped / MAX) * 180;
  const ok = withinTolerance(discrepancy);
  const arc = (from: number, to: number) => {
    const a0 = Math.PI * (1 - from / MAX);
    const a1 = Math.PI * (1 - to / MAX);
    const r = 80;
    const p = (a: number) => `${100 + r * Math.cos(a)},${100 - r * Math.sin(a)}`;
    return `M${p(a0)} A${r},${r} 0 0 1 ${p(a1)}`;
  };
  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 200 112" className="w-44 sm:w-52" aria-hidden="true">
        <path d={arc(0, MAX)} fill="none" stroke="hsl(var(--secondary))" strokeWidth={16} strokeLinecap="round" />
        <path d={arc(0, IAB_TOLERANCE)} fill="none" stroke="hsl(var(--primary))" strokeWidth={16} strokeLinecap="round" />
        <path d={arc(IAB_TOLERANCE + 0.6, MAX)} fill="none" stroke="hsl(var(--nobid) / 0.35)" strokeWidth={16} />
        <motion.g
          initial={false}
          animate={{ rotate: angle }}
          transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 90, damping: 14 }}
          style={{ originX: 0.5, originY: 1 }}
        >
          <line x1={100} y1={100} x2={100} y2={30} stroke={ok ? "hsl(var(--primary))" : "hsl(var(--nobid))"} strokeWidth={4} strokeLinecap="round" />
        </motion.g>
        <circle cx={100} cy={100} r={8} fill="hsl(var(--card))" stroke={ok ? "hsl(var(--primary))" : "hsl(var(--nobid))"} strokeWidth={3} />
      </svg>
      <div className="figure -mt-1 flex w-44 justify-between text-xs text-muted-foreground sm:w-52" aria-hidden="true">
        <span>0%</span>
        <span>10%</span>
        <span>20%+</span>
      </div>
      <p className={cn("figure mt-2 text-3xl", ok ? "text-primary" : "text-nobid")}>
        <CountUp value={discrepancy} format={(v) => `${v >= 0 ? "+" : ""}${v.toFixed(1)}%`} />
      </p>
      <p className={cn("mt-0.5 text-center text-sm", ok ? "text-foreground" : "text-nobid")}>
        {ok ? "Within the IAB's 10% tolerance" : "Outside tolerance: investigate first"}
      </p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Simulator                                                                  */
/* -------------------------------------------------------------------------- */

export default function Simulation({ onChallengePassed, challengePassed, onDescribe }: SimulationProps) {
  const [spend, setSpend] = useShareableState("spend", PRESETS[0].spend, spendCodec);
  const [impressions, setImpressions] = useShareableState("impr", PRESETS[0].impressions, imprCodec);
  const [clicks, setClicks] = useShareableState("clicks", PRESETS[0].clicks, clicksCodec);
  const [conversions, setConversions] = useShareableState("conv", PRESETS[0].conversions, convCodec);
  const [counting, setCounting] = useShareableState<Counting>("counting", "mixed", countingCodec);
  const [botsFiltered, setBotsFiltered] = useShareableState("bots", false, boolCodec);
  const [clientIssues, setClientIssues] = useShareableState("blockers", true, boolCodec);
  const [viewableOnly, setViewableOnly] = useShareableState("viewable", false, boolCodec);

  const m = useMemo(() => effectiveMetrics({ spend, impressions, clicks, conversions }), [spend, impressions, clicks, conversions]);
  const rec = useMemo(
    () => reconcile(impressions, { counting, publisherFiltersBots: botsFiltered, clientIssues, advertiserViewableOnly: viewableOnly }),
    [impressions, counting, botsFiltered, clientIssues, viewableOnly]
  );
  const ok = withinTolerance(rec.discrepancyPct);
  const met = reconciledAndPriced(m.eCPM, rec.discrepancyPct);
  useChallenge(met, onChallengePassed, challengePassed);

  const preset = PRESETS.find((p) => p.spend === spend && p.impressions === impressions && p.clicks === clicks && p.conversions === conversions);
  const loadPreset = (p: (typeof PRESETS)[number]) => {
    setSpend(p.spend);
    setImpressions(p.impressions);
    setClicks(p.clicks);
    setConversions(p.conversions);
  };

  const gapParts = [
    rec.gap.bots > 0 && `${int(rec.gap.bots)} bot impressions only the advertiser's verification filtered`,
    rec.gap.renders > 0 && `${int(rec.gap.renders)} served ads whose pixel never fired (ad blockers, slow connections)`,
    rec.gap.viewability > 0 && `${int(rec.gap.viewability)} impressions that weren't viewable`,
  ].filter(Boolean) as string[];
  const explanation =
    gapParts.length === 0
      ? "Both systems count the same way and filter the same traffic, so the reports agree."
      : `The gap is ${gapParts.join("; ")}.`;

  useDescribe(
    onDescribe,
    `Campaign: ${dollars(spend)} spend, ${int(impressions)} impressions, ${int(clicks)} clicks, ${int(conversions)} conversions. eCPM ${money(m.eCPM)}, eCPC ${money(
      m.eCPC
    )}, eCPA ${money(m.eCPA)}, CTR ${pct(m.ctr, 2)}, CVR ${pct(m.cvr, 2)}. Reconciliation: counting method "${COUNTING[counting].label}", publisher ${
      botsFiltered ? "filters" : "does not filter"
    } bots, ad blockers and slow connections ${clientIssues ? "present" : "absent"}, advertiser ${viewableOnly ? "counts only viewable impressions" : "counts every rendered impression"}. Publisher counted ${int(
      rec.publisher
    )}, advertiser ${int(rec.advertiser)}: a ${rec.discrepancyPct.toFixed(1)}% discrepancy, ${ok ? "within" : "outside"} the IAB's 10% tolerance. ${explanation}`
  );

  return (
    <div className="space-y-4">
      <SimStage label="Effective metrics and report reconciliation">
        <h3 className="text-sm uppercase tracking-wide text-muted-foreground">From raw counts to effective metrics</h3>
        <div className="mt-4 flex flex-col items-stretch sm:flex-row sm:items-center">
          <FlowNode label="Spend" sublabel={dollars(spend)} role="advertiser" icon={<DollarSign className="h-5 w-5" />} active className={NODE} />
          <Connector dots={4} color={CHAIN.advertiser} label="buys" />
          <FlowNode label="Impressions" sublabel={int(impressions)} role="publisher" icon={<Eye className="h-5 w-5" />} active={impressions > 0} className={NODE} />
          <Connector dots={Math.ceil(m.ctr * 2)} color={CHAIN.publisher} label={`CTR ${pct(m.ctr, 2)}`} />
          <FlowNode label="Clicks" sublabel={int(clicks)} role="user" icon={<MousePointerClick className="h-5 w-5" />} active={clicks > 0} className={NODE} />
          <Connector dots={Math.ceil(m.cvr)} color={CHAIN.user} label={`CVR ${pct(m.cvr, 2)}`} />
          <FlowNode label="Conversions" sublabel={int(conversions)} role="advertiser" icon={<ShoppingCart className="h-5 w-5" />} active={conversions > 0} className={NODE} />
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <MetricCard
            label="eCPM"
            tone="publisher"
            value={<CountUp value={m.eCPM} format={(v) => money(v)} />}
            formula={`${dollars(spend)} ÷ ${int(impressions)} × 1,000`}
          />
          <MetricCard label="eCPC" tone="user" value={<CountUp value={m.eCPC} format={(v) => money(v)} />} formula={`${dollars(spend)} ÷ ${int(clicks)} clicks`} />
          <MetricCard
            label="eCPA"
            tone="advertiser"
            value={<CountUp value={m.eCPA} format={(v) => money(v)} />}
            formula={`${dollars(spend)} ÷ ${int(conversions)} conversions`}
          />
        </div>

        <div className="mt-8 border-t border-border pt-5">
          <h3 className="flex items-center gap-2 text-sm uppercase tracking-wide text-muted-foreground">
            <Scale className="h-4 w-4" aria-hidden="true" />
            Two reports, one campaign
          </h3>
          <div className="mt-4 grid items-end gap-6 md:grid-cols-[minmax(0,1fr)_auto]">
            <Columns publisher={rec.publisher} advertiser={rec.advertiser} gap={rec.gap} />
            <ToleranceGauge discrepancy={rec.discrepancyPct} />
          </div>
          <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <li className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-nobid/70" aria-hidden="true" /> bots: <span className="figure text-foreground">{int(rec.gap.bots)}</span>
            </li>
            <li className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-floor/70" aria-hidden="true" /> pixel never fired: <span className="figure text-foreground">{int(rec.gap.renders)}</span>
            </li>
            <li className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-muted-foreground/35" aria-hidden="true" /> not viewable: <span className="figure text-foreground">{int(rec.gap.viewability)}</span>
            </li>
          </ul>
          <p className="mt-3 min-h-[3rem] text-sm text-foreground" aria-live="polite">
            <span className="figure text-primary">(publisher − advertiser) ÷ advertiser · </span>
            {explanation}
          </p>
        </div>
      </SimStage>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Campaign inputs">
          <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="Load a campaign from the lesson">
            {PRESETS.map((p) => (
              <SimButton key={p.id} onClick={() => loadPreset(p)} pressed={preset?.id === p.id} className={cn("text-xs", preset?.id === p.id && "border-primary bg-primary/10")}>
                {p.label}
              </SimButton>
            ))}
          </div>
          <div className="space-y-4">
            <SimSlider label="Spend" value={spend} min={0} max={20_000} step={100} onChange={setSpend} format={dollars} />
            <SimSlider label="Impressions" value={impressions} min={0} max={3_000_000} step={10_000} onChange={setImpressions} format={int} />
            <SimSlider label="Clicks" value={clicks} min={0} max={10_000} step={50} onChange={setClicks} format={int} />
            <SimSlider label="Conversions" value={conversions} min={0} max={200} step={1} onChange={setConversions} format={int} />
          </div>
        </Panel>

        <Panel title="Why the reports differ">
          <div className="space-y-4">
            <div>
              <p className="mb-2 text-sm text-foreground">Counting method</p>
              <Segmented
                label="Counting method"
                value={counting}
                onChange={setCounting}
                size="sm"
                options={(Object.keys(COUNTING) as Counting[]).map((k) => ({ value: k, label: COUNTING[k].label }))}
              />
              <p className="mt-1 text-xs text-muted-foreground">{COUNTING[counting].detail}</p>
            </div>
            <SimToggle
              label="Publisher filters bots too"
              checked={botsFiltered}
              onChange={setBotsFiltered}
              hint={`The advertiser's verification vendor always strips the ${pct(BOT_SHARE * 100)} of traffic that is bots.`}
            />
            <SimToggle
              label="Ad blockers and slow connections"
              checked={clientIssues}
              onChange={setClientIssues}
              hint={`An ad blocker strips ${pct(AD_BLOCK_LOSS * 100)} of pixels; added latency drops ${pct(LATENCY_LOSS * 100)} of renders.`}
            />
            <SimToggle
              label="Advertiser counts only viewable impressions"
              checked={viewableOnly}
              onChange={setViewableOnly}
              hint={`50% of pixels in view for 1 second — about ${pct(VIEWABLE_RATE * 100)} qualify. A different question, not an error.`}
            />
          </div>
        </Panel>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Stat label="eCPM" value={money(m.eCPM)} tone={m.eCPM >= 2 && m.eCPM <= 5 ? "primary" : "floor"} sub="target $2–$5" />
        <Stat label="eCPC" value={money(m.eCPC)} sub="cost per click" />
        <Stat label="eCPA" value={money(m.eCPA)} sub="cost per conversion" />
        <Stat label="CTR" value={pct(m.ctr, 2)} sub="clicks ÷ impressions" />
        <Stat label="CVR" value={pct(m.cvr, 2)} sub="conversions ÷ clicks" />
        <Stat label="Discrepancy" value={`${rec.discrepancyPct >= 0 ? "+" : ""}${rec.discrepancyPct.toFixed(1)}%`} tone={ok ? "primary" : "nobid"} sub="IAB tolerance 10%" />
      </div>

      <ChallengeMet show={met}>
        Reports within {rec.discrepancyPct.toFixed(1)}% of each other at a {money(m.eCPM)} eCPM. Challenge complete!
      </ChallengeMet>
    </div>
  );
}

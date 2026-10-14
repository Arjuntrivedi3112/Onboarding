import { useMemo, useState, type ReactNode } from "react";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight, Globe, Mail, Monitor, RotateCcw, Search, Share2, ShoppingCart, Sparkles, X } from "lucide-react";

import { enumCodec, useShareableState } from "@/hooks/useShareableState";
import { cn } from "@/lib/utils";
import { AnimatedNumber } from "@/simulations/attribution-lab/AnimatedNumber";
import { CHAIN, ChallengeMet, Panel, Segmented, SimButton, SimSlider, SimStage, Stat, pct, useChallenge, useDescribe } from "@/simulations/kit";
import type { SimulationProps } from "@/simulations/types";
import {
  DEFAULT_CUSTOM_WEIGHTS,
  DEFAULT_JOURNEY,
  INTRA_JOURNEY,
  KINDS,
  KIND_LABELS,
  KIND_SHORT,
  MAX_DAYS,
  MAX_TOUCHPOINTS,
  MIN_TOUCHPOINTS,
  MODELS,
  TIME_DECAY_HALF_LIFE_DAYS,
  bestChannel,
  clampCustom,
  computeCredit,
  creditByChannel,
  displayMatters,
  displayShare,
  intraChannel,
  nextDaysAgo,
  placements,
  sortJourney,
  type CustomWeights,
  type ModelId,
  type TouchKind,
  type Touchpoint,
} from "@/simulations/attribution-lab/logic";

/**
 * The attribution model lab, rebuilt from the original AttributionModule:
 * an editable journey of two to six touchpoints, seven models (with the
 * lessons' 7-day half-life time decay and custom first/last weights) and an
 * inter- vs intra-channel view of the result. All credit numbers come from
 * the lessons' own computeCredit.
 */

/** Channel colours: theme tokens only, one distinct hue per channel. */
const KIND_TONE: Record<TouchKind, string> = {
  display: "var(--primary)",
  social: CHAIN.agency,
  search: CHAIN.dsp,
  email: CHAIN.adserver,
  direct: "var(--muted-foreground)",
};

const KIND_ICON: Record<TouchKind, (cls: string) => ReactNode> = {
  display: (c) => <Monitor className={c} aria-hidden="true" />,
  social: (c) => <Share2 className={c} aria-hidden="true" />,
  search: (c) => <Search className={c} aria-hidden="true" />,
  email: (c) => <Mail className={c} aria-hidden="true" />,
  direct: (c) => <Globe className={c} aria-hidden="true" />,
};

const MODEL_IDS = MODELS.map((m) => m.id);
const modelCodec = enumCodec(MODEL_IDS);
const one = (v: number) => pct(v, 1);
const whole = (v: number) => pct(v, 0);

let nextId = 100;
const freshId = () => `tp${nextId++}`;

/** Particles travelling the journey line toward the conversion. */
function JourneyParticles({ running }: { running: boolean }) {
  const reduce = useReducedMotion();
  if (!running || reduce) return null;
  return (
    <>
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          aria-hidden="true"
          className="absolute top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-primary shadow-[0_0_12px_hsl(var(--primary)/0.9)]"
          initial={{ left: "0%", opacity: 0 }}
          animate={{ left: ["0%", "100%"], opacity: [0, 1, 1, 0] }}
          transition={{ duration: 3, delay: i, repeat: Infinity, ease: "linear" }}
        />
      ))}
    </>
  );
}

export default function Simulation({ onChallengePassed, challengePassed, onDescribe }: SimulationProps) {
  const reduce = useReducedMotion();
  const [modelId, setModelId] = useShareableState<ModelId>("model", "last-click", modelCodec);
  const [journey, setJourney] = useState<Touchpoint[]>(DEFAULT_JOURNEY);
  const [custom, setCustom] = useState<CustomWeights>(DEFAULT_CUSTOM_WEIGHTS);
  const [scope, setScope] = useState<"inter" | "intra">("inter");
  const [intraKind, setIntraKind] = useState<TouchKind | null>(null);

  const model = MODELS.find((m) => m.id === modelId) ?? MODELS[0];
  const credit = useMemo(() => computeCredit(journey, modelId, custom), [journey, modelId, custom]);
  const byChannel = useMemo(() => creditByChannel(journey, credit), [journey, credit]);
  const best = bestChannel(byChannel);
  const display = displayShare(journey, credit);
  const letters = placements(journey);
  const n = journey.length;

  const met = displayMatters(journey, credit, modelId);
  useChallenge(met, onChallengePassed, challengePassed);

  // Intra-channel lens: default to the channel with the most touchpoints.
  const kindsPresent = KINDS.filter((k) => journey.some((t) => t.kind === k));
  const mostTouched = [...byChannel].sort((a, b) => b.touches - a.touches)[0]?.kind ?? "display";
  const lensKind = intraKind && kindsPresent.includes(intraKind) ? intraKind : mostTouched;
  const intraRows = intraChannel(journey, credit, lensKind);
  const lensTotal = byChannel.find((r) => r.kind === lensKind)?.credit ?? 0;

  /* ----------------------------- journey edits ----------------------------- */
  const update = (next: Touchpoint[]) => setJourney(sortJourney(next));
  const setKind = (id: string, kind: TouchKind) => update(journey.map((t) => (t.id === id ? { ...t, kind, channel: KIND_LABELS[kind] } : t)));
  const setDays = (id: string, daysAgo: number) => update(journey.map((t) => (t.id === id ? { ...t, daysAgo: Math.max(0, Math.min(MAX_DAYS, daysAgo)) } : t)));
  const remove = (id: string) => n > MIN_TOUCHPOINTS && update(journey.filter((t) => t.id !== id));
  const add = (kind: TouchKind) =>
    n < MAX_TOUCHPOINTS && update([...journey, { id: freshId(), kind, channel: KIND_LABELS[kind], daysAgo: nextDaysAgo(journey) }]);
  const load = (preset: Touchpoint[]) => update(preset.map((t) => ({ ...t, id: freshId() })));

  const label = (t: Touchpoint, i: number) => {
    const sameKind = journey.filter((x) => x.kind === t.kind).length > 1;
    return sameKind ? `${KIND_SHORT[t.kind]} ${letters[i]}` : KIND_SHORT[t.kind];
  };

  const bestName = best ? KIND_LABELS[best] : "No single channel";
  const narration = (() => {
    const top = byChannel[0];
    if (!top) return "";
    const lead = best
      ? `${KIND_LABELS[best]} looks best, with ${one(top.credit)} of the credit.`
      : `${KIND_LABELS[top.kind]} and ${KIND_LABELS[byChannel[1].kind]} tie for the most credit.`;
    const why: Record<ModelId, string> = {
      "last-click": "Last click hands everything to the final touch, even a direct visit.",
      "last-non-direct": "Last non-direct skips direct visits and credits the last real channel.",
      "first-click": "First click rewards whatever started the journey.",
      linear: `Linear splits the credit evenly: ${one(100 / n)} per touch.`,
      "time-decay": `Time decay halves a touch's weight for every ${TIME_DECAY_HALF_LIFE_DAYS} days before the conversion, so recent touches gain.`,
      position:
        n === 2
          ? "With only two touches, position based splits them 50/50."
          : "Position based gives 40% each to the first and last touch and shares 20% across the middle.",
      custom: `Your custom rule gives the first touch ${custom.first}% and the last ${custom.last}%.`,
    };
    return `${why[modelId]} ${lead}`;
  })();

  useDescribe(
    onDescribe,
    `${model.name} attribution on a ${n}-touch journey: ${journey
      .map((t, i) => `${label(t, i)} (${t.daysAgo === 0 ? "conversion day" : `${t.daysAgo} days before`}) ${one(credit[i])}`)
      .join(", ")}. ${best ? `${KIND_LABELS[best]} looks best.` : "Two channels tie for best."} Display earns ${one(display)} in total.${
      modelId === "custom" ? ` Custom weights: first ${custom.first}%, last ${custom.last}%.` : ""
    } Viewing the ${scope === "inter" ? "inter-channel" : "intra-channel"} breakdown.`,
  );

  return (
    <div className="space-y-4">
      <SimStage label="Customer journey and attribution credit">
        {/* Model picker */}
        <div role="radiogroup" aria-label="Attribution model" className="flex flex-wrap gap-1.5">
          {MODELS.map((m) => {
            const active = m.id === modelId;
            return (
              <button
                key={m.id}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setModelId(m.id)}
                className={cn(
                  "interactive relative min-h-[2.25rem] rounded-full border px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  active ? "border-primary text-primary-foreground" : "border-border bg-background text-muted-foreground hover:text-foreground",
                )}
              >
                {active && (
                  <motion.span
                    layoutId="attr-model-pill"
                    className="absolute inset-0 rounded-full bg-primary shadow-[0_0_20px_hsl(var(--primary)/0.45)]"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <span className="relative">{m.name}</span>
              </button>
            );
          })}
        </div>
        <AnimatePresence mode="wait" initial={false}>
          <motion.p
            key={modelId}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18 }}
            className="mt-2 text-sm text-muted-foreground"
          >
            {model.summary}.
          </motion.p>
        </AnimatePresence>

        {modelId === "custom" && (
          <div className="mt-4 grid gap-4 rounded-lg border border-border bg-background/70 p-3 sm:grid-cols-2">
            <SimSlider
              label="First-touch weight"
              value={custom.first}
              min={0}
              max={100}
              onChange={(v) => setCustom((c) => clampCustom({ ...c, first: v }, "first"))}
              format={whole}
            />
            <SimSlider
              label="Last-touch weight"
              value={custom.last}
              min={0}
              max={100}
              onChange={(v) => setCustom((c) => clampCustom({ ...c, last: v }, "last"))}
              format={whole}
            />
            <p className="text-xs text-muted-foreground sm:col-span-2">
              {n > 2 ? (
                <>
                  The remaining <span className="figure">{whole(Math.max(0, 100 - custom.first - custom.last))}</span> is shared evenly across the middle
                  touches.
                </>
              ) : (
                "With two touches, the two weights are scaled to add up to 100%."
              )}
            </p>
          </div>
        )}

        {/* The journey, with credit columns rising off the timeline */}
        <LayoutGroup>
          <div className="relative">
            {/* The timeline, drawn behind the node row, with the journey flowing toward the conversion */}
            <div
              className="pointer-events-none absolute bottom-[3.375rem] h-0.5 sm:bottom-[3.625rem]"
              style={{ left: `${50 / (n + 1)}%`, right: `${50 / (n + 1)}%` }}
              aria-hidden="true"
            >
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-border via-primary/50 to-primary" />
              <JourneyParticles running />
            </div>
            <ol
              className="mt-6 grid items-end gap-1.5 sm:gap-3"
              style={{ gridTemplateColumns: `repeat(${n + 1}, minmax(0, 1fr))` }}
              aria-label={`Journey of ${n} touchpoints with ${model.name} credit`}
            >
              {journey.map((t, i) => {
                const c = credit[i] ?? 0;
                const tone = KIND_TONE[t.kind];
                const isTop = best !== null && t.kind === best && c > 0;
                return (
                  <motion.li
                    key={t.id}
                    layout={!reduce}
                    transition={{ type: "spring", stiffness: 260, damping: 28 }}
                    className="flex min-w-0 flex-col items-center"
                  >
                    <span className={cn("figure text-sm sm:text-base", c > 0 ? "text-foreground" : "text-muted-foreground")}>
                      <AnimatedNumber value={c} format={(v) => (v >= 99.95 ? "100%" : `${v.toFixed(v < 10 ? 1 : 0)}%`)} />
                    </span>
                    <div className="relative mt-1 h-32 w-full max-w-[3.5rem] overflow-hidden rounded-t-md bg-secondary sm:h-40">
                      <motion.div
                        className="absolute inset-x-0 bottom-0 rounded-t-md"
                        style={{
                          background: `linear-gradient(to top, hsl(${tone} / 0.55), hsl(${tone}))`,
                          boxShadow: c >= 30 ? `0 0 22px hsl(${tone} / 0.55)` : undefined,
                        }}
                        initial={false}
                        animate={{ height: `${c}%` }}
                        transition={{ type: "spring", stiffness: 140, damping: 18 }}
                      />
                    </div>
                    <div className="relative mt-2 flex w-full justify-center">
                      <motion.span
                        className="relative z-10 flex h-9 w-9 items-center justify-center rounded-full border-2 bg-card sm:h-11 sm:w-11"
                        style={{
                          borderColor: `hsl(${tone})`,
                          color: `hsl(${tone})`,
                          boxShadow: isTop ? `0 0 0 4px hsl(${tone} / 0.18), 0 0 24px hsl(${tone} / 0.5)` : undefined,
                        }}
                        animate={isTop && !reduce ? { scale: [1, 1.08, 1] } : { scale: 1 }}
                        transition={isTop && !reduce ? { duration: 1.6, repeat: Infinity, ease: "easeInOut" } : { duration: 0.2 }}
                      >
                        {KIND_ICON[t.kind]("h-4 w-4 sm:h-5 sm:w-5")}
                      </motion.span>
                    </div>
                    <span className="mt-1 w-full truncate text-center text-xs text-foreground">{label(t, i)}</span>
                    <span className="figure w-full truncate text-center text-xs text-muted-foreground">
                      {t.daysAgo === 0 ? (
                        "day 0"
                      ) : (
                        <>
                          {t.daysAgo}d<span className="hidden sm:inline"> before</span>
                        </>
                      )}
                    </span>
                  </motion.li>
                );
              })}
              <li className="flex min-w-0 flex-col items-center" aria-label="Conversion">
                <span className="figure text-sm text-primary sm:text-base">100%</span>
                <div className="mt-1 flex h-32 w-full max-w-[3.5rem] items-end justify-center sm:h-40">
                  <span className="mb-1 text-center text-xs text-muted-foreground">credit to share</span>
                </div>
                <div className="mt-2 flex w-full justify-center">
                  <motion.span
                    className="relative z-10 flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_0_24px_hsl(var(--primary)/0.5)] sm:h-11 sm:w-11"
                    animate={
                      reduce
                        ? undefined
                        : { boxShadow: ["0 0 12px hsl(var(--primary) / 0.35)", "0 0 30px hsl(var(--primary) / 0.7)", "0 0 12px hsl(var(--primary) / 0.35)"] }
                    }
                    transition={reduce ? undefined : { duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
                  </motion.span>
                </div>
                <span className="mt-1 text-xs text-foreground">Converts</span>
                <span className="text-xs text-muted-foreground" aria-hidden="true">
                  &nbsp;
                </span>
              </li>
            </ol>
          </div>
        </LayoutGroup>
        <p className="mt-2 min-h-[2.5rem] text-sm text-foreground" aria-live="polite">
          {narration}
        </p>
      </SimStage>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel
          title="Edit the journey"
          actions={
            <span className="figure text-xs text-muted-foreground">
              {n} of {MAX_TOUCHPOINTS}
            </span>
          }
        >
          <motion.ul className="space-y-2" layout={!reduce}>
            <AnimatePresence initial={false}>
              {journey.map((t, i) => (
                <motion.li
                  key={t.id}
                  layout={!reduce}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 12 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-background/70 p-2"
                >
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2"
                    style={{ borderColor: `hsl(${KIND_TONE[t.kind]})`, color: `hsl(${KIND_TONE[t.kind]})` }}
                  >
                    {KIND_ICON[t.kind]("h-4 w-4")}
                  </span>
                  <label className="sr-only" htmlFor={`kind-${t.id}`}>
                    Channel of touchpoint {i + 1}
                  </label>
                  <select
                    id={`kind-${t.id}`}
                    value={t.kind}
                    onChange={(e) => setKind(t.id, e.target.value as TouchKind)}
                    className="min-h-[2.25rem] min-w-0 flex-1 rounded-md border border-border bg-background px-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {KINDS.map((k) => (
                      <option key={k} value={k}>
                        {KIND_SHORT[k]}
                      </option>
                    ))}
                  </select>
                  <div className="flex items-center gap-1" role="group" aria-label={`Timing of touchpoint ${i + 1}`}>
                    <button
                      type="button"
                      onClick={() => setDays(t.id, t.daysAgo + 1)}
                      disabled={t.daysAgo >= MAX_DAYS}
                      aria-label={`Move touchpoint ${i + 1} one day earlier`}
                      className="interactive flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40"
                    >
                      <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                    </button>
                    <span className="figure w-14 text-center text-xs text-foreground">{t.daysAgo === 0 ? "day 0" : `${t.daysAgo}d`}</span>
                    <button
                      type="button"
                      onClick={() => setDays(t.id, t.daysAgo - 1)}
                      disabled={t.daysAgo <= 0}
                      aria-label={`Move touchpoint ${i + 1} one day later`}
                      className="interactive flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40"
                    >
                      <ChevronRight className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => remove(t.id)}
                    disabled={n <= MIN_TOUCHPOINTS}
                    aria-label={`Remove touchpoint ${i + 1}, ${KIND_LABELS[t.kind]}`}
                    className="interactive flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:text-nobid focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40"
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                  </button>
                </motion.li>
              ))}
            </AnimatePresence>
          </motion.ul>
          <p className="mt-2 text-xs text-muted-foreground">
            Days count back from the conversion. Touchpoints stay in time order: the earliest is the first touch.
          </p>

          <p className="mb-2 mt-4 text-sm text-foreground">Add a touchpoint</p>
          <div className="flex flex-wrap gap-1.5">
            {KINDS.map((k) => (
              <SimButton
                key={k}
                onClick={() => add(k)}
                disabled={n >= MAX_TOUCHPOINTS}
                className="min-h-[2.25rem] px-2.5"
                ariaLabel={`Add a ${KIND_LABELS[k]} touchpoint`}
              >
                <span style={{ color: `hsl(${KIND_TONE[k]})` }}>{KIND_ICON[k]("h-4 w-4")}</span>
                {KIND_SHORT[k]}
              </SimButton>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-2 border-t border-border pt-3">
            <SimButton variant="ghost" onClick={() => load(DEFAULT_JOURNEY)}>
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              Default journey
            </SimButton>
            <SimButton variant="ghost" onClick={() => load(INTRA_JOURNEY)}>
              <Monitor className="h-4 w-4" aria-hidden="true" />
              Three display sites
            </SimButton>
          </div>
        </Panel>

        <Panel title="Who gets the credit">
          <div className="mb-3">
            <Segmented<"inter" | "intra">
              label="Breakdown"
              size="sm"
              value={scope}
              onChange={setScope}
              options={[
                { value: "inter", label: "Inter-channel" },
                { value: "intra", label: "Intra-channel" },
              ]}
            />
          </div>
          <AnimatePresence mode="wait" initial={false}>
            {scope === "inter" ? (
              <motion.div key="inter" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                <p className="text-xs text-muted-foreground">Inter-channel: comparing different channels against each other.</p>
                <motion.ul className="mt-3 space-y-2.5" layout={!reduce}>
                  {byChannel.map((row) => (
                    <motion.li key={row.kind} layout={!reduce} transition={{ type: "spring", stiffness: 300, damping: 30 }}>
                      <div className="flex items-baseline justify-between gap-2 text-sm">
                        <span className="flex items-center gap-1.5 text-foreground">
                          <span style={{ color: `hsl(${KIND_TONE[row.kind]})` }}>{KIND_ICON[row.kind]("h-3.5 w-3.5")}</span>
                          {KIND_LABELS[row.kind]}
                          {row.touches > 1 && <span className="text-xs text-muted-foreground">×{row.touches}</span>}
                        </span>
                        <span className="figure text-foreground">
                          <AnimatedNumber value={row.credit} format={one} />
                        </span>
                      </div>
                      <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-secondary">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ background: `hsl(${KIND_TONE[row.kind]})` }}
                          initial={false}
                          animate={{ width: `${row.credit}%` }}
                          transition={{ type: "spring", stiffness: 140, damping: 20 }}
                        />
                      </div>
                    </motion.li>
                  ))}
                </motion.ul>
              </motion.div>
            ) : (
              <motion.div key="intra" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                <p className="text-xs text-muted-foreground">Intra-channel: comparing placements inside one channel.</p>
                <div className="mt-3">
                  <Segmented<TouchKind>
                    label="Channel to break down"
                    size="sm"
                    value={lensKind}
                    onChange={(k) => setIntraKind(k)}
                    options={kindsPresent.map((k) => ({ value: k, label: KIND_SHORT[k] }))}
                  />
                </div>
                <ul className="mt-3 space-y-2.5">
                  {intraRows.map((r) => (
                    <li key={r.id}>
                      <div className="flex items-baseline justify-between gap-2 text-sm">
                        <span className="text-foreground">
                          {KIND_SHORT[lensKind]} · placement {r.placement}
                        </span>
                        <span className="figure text-foreground">
                          <AnimatedNumber value={r.share} format={whole} /> <span className="text-xs text-muted-foreground">of {KIND_SHORT[lensKind]}</span>
                        </span>
                      </div>
                      <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-secondary">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ background: `hsl(${KIND_TONE[lensKind]})` }}
                          initial={false}
                          animate={{ width: `${r.share}%` }}
                          transition={{ type: "spring", stiffness: 140, damping: 20 }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-xs text-muted-foreground">
                  {intraRows.length < 2
                    ? `Only one ${KIND_SHORT[lensKind]} placement in this journey — add another, or load "Three display sites", to compare placements.`
                    : `${KIND_SHORT[lensKind]} earns ${one(lensTotal)} overall; this splits that share between its placements.`}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div
            key={`${modelId}-${best}`}
            initial={reduce ? false : { opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-4 flex items-start gap-2 rounded-lg border border-primary/30 bg-primary/10 p-3 text-sm text-foreground"
          >
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
            <span>
              Which channel looks best? Under <span className="text-primary">{model.name}</span>,{" "}
              {best ? <strong className="font-semibold">{KIND_LABELS[best]}</strong> : "no single channel"}
              {best ? " gets the biggest share — and would win next month's budget if this report decided it." : " — the credit is tied at the top."}
            </span>
          </motion.div>
        </Panel>
      </div>

      <Panel title="Same journey, all seven models">
        <ul className="space-y-1.5">
          {MODELS.map((m) => {
            const row = computeCredit(journey, m.id, custom);
            const rowBest = bestChannel(creditByChannel(journey, row));
            const rowDisplay = displayShare(journey, row);
            const active = m.id === modelId;
            return (
              <li key={m.id}>
                <button
                  type="button"
                  onClick={() => setModelId(m.id)}
                  aria-pressed={active}
                  aria-label={`${m.name}: ${rowBest ? `${KIND_LABELS[rowBest]} looks best` : "tie"}, Display ${one(rowDisplay)}`}
                  className={cn(
                    "interactive grid w-full grid-cols-[6.5rem_minmax(0,1fr)_3.5rem] items-center gap-2 rounded-lg border px-2 py-1.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:grid-cols-[8rem_minmax(0,1fr)_6rem]",
                    active ? "border-primary/60 bg-primary/5" : "border-transparent hover:border-border",
                  )}
                >
                  <span className={cn("truncate text-xs sm:text-sm", active ? "text-primary" : "text-foreground")}>{m.name}</span>
                  <span className="flex h-3 overflow-hidden rounded-full bg-secondary" aria-hidden="true">
                    {journey.map((t, i) => (
                      <motion.span
                        key={t.id}
                        className="h-full border-r border-card last:border-r-0"
                        style={{ background: `hsl(${KIND_TONE[t.kind]})` }}
                        initial={false}
                        animate={{ width: `${row[i]}%` }}
                        transition={{ type: "spring", stiffness: 160, damping: 22 }}
                      />
                    ))}
                  </span>
                  <span className={cn("figure text-right text-xs", rowDisplay >= 40 ? "text-primary" : "text-muted-foreground")}>
                    <span className="hidden sm:inline">Display </span>
                    {whole(rowDisplay)}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
        <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1">
          {KINDS.filter((k) => kindsPresent.includes(k)).map((k) => (
            <span key={k} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="h-2 w-2 rounded-full" style={{ background: `hsl(${KIND_TONE[k]})` }} aria-hidden="true" />
              {KIND_LABELS[k]}
            </span>
          ))}
        </div>
      </Panel>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Model" value={model.name} tone="primary" />
        <Stat label="Looks best" value={best ? KIND_SHORT[best] : "Tie"} sub={bestName === "No single channel" ? "top shares are equal" : "most credit"} />
        <Stat label="Display credit" value={one(display)} tone={display >= 40 ? "primary" : "muted"} sub="challenge needs 40%" />
        <Stat label="Touchpoints" value={`${n} of ${MAX_TOUCHPOINTS}`} sub={`${kindsPresent.length} channel${kindsPresent.length === 1 ? "" : "s"}`} />
      </div>

      <ChallengeMet show={met}>
        Display earns {one(display)} under {model.name}, alongside {journey.filter((t) => t.kind !== "display").length} other touch
        {journey.filter((t) => t.kind !== "display").length === 1 ? "" : "es"}. Challenge complete!
      </ChallengeMet>
    </div>
  );
}

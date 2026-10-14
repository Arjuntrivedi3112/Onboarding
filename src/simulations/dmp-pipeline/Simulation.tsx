import { useMemo, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowDown, Database, Filter, Send, Server, Sparkles, Users } from "lucide-react";

import { DMP_STAGES } from "@/components/lessons/data/_shared";
import { enumCodec, useShareableState } from "@/hooks/useShareableState";
import { cn } from "@/lib/utils";
import {
  CHAIN,
  ChallengeMet,
  Panel,
  PlaybackControls,
  Segmented,
  SimButton,
  SimStage,
  SimToggle,
  Stat,
  int,
  useChallenge,
  useDescribe,
  usePlayback,
} from "@/simulations/kit";
import type { SimulationProps } from "@/simulations/types";
import { CountUp } from "@/simulations/dmp-pipeline/CountUp";
import {
  POPULATION,
  RULES,
  RULE_IDS,
  SOURCES,
  SOURCE_IDS,
  buildSegment,
  buildWorld,
  latestIndex,
  sampleRecord,
  segmentKey,
  storeAt,
  usableFirstPartySegment,
  type Activation,
  type MatchMode,
  type RuleId,
  type SourceId,
} from "@/simulations/dmp-pipeline/logic";

/**
 * "Inside the data pipeline", rebuilt from the original data module's
 * five-stage DMP stepper: the same five stages the data lessons use, run on
 * a seeded stream of first-, second- and third-party events.
 */

const WORLD = buildWorld();
const STREAM_UNITS = 1000;
const STREAM_MS = 12_000;

/** Colour per source: first-party is the valuable one, so it gets the primary hue. */
const SOURCE_COLOR: Record<SourceId, string> = {
  first: "var(--primary)",
  second: CHAIN.adserver,
  third: "var(--floor)",
};
const SOURCE_NOTE: Record<SourceId, string> = {
  first: "Collected directly from your own customers. The most valuable.",
  second: "Another company's first-party data, through a partnership.",
  third: "Bought from a data broker. The most scale, the least value.",
};

const listCodec = <T extends string>(allowed: readonly T[]) => ({
  serialize: (v: T[]) => (v.length ? v.join(",") : "none"),
  deserialize: (raw: string): T[] | null => (raw === "none" ? [] : raw.split(",").filter((x): x is T => allowed.includes(x as T))),
});
const sourcesCodec = listCodec(SOURCE_IDS);
const rulesCodec = listCodec(RULE_IDS);
const modeCodec = enumCodec(["all", "any"] as const);
const ALL_SOURCES: SourceId[] = ["first", "second", "third"];
const DEFAULT_RULES: RuleId[] = ["country", "visits"];

const STAGE = (n: number) => DMP_STAGES[n - 1];

/* -------------------------------------------------------------------------- */
/* Pieces                                                                     */
/* -------------------------------------------------------------------------- */

function StageLabel({ n, active, icon }: { n: number; active: boolean; icon: ReactNode }) {
  return (
    <p className={cn("flex items-center gap-2 text-xs uppercase tracking-wide", active ? "text-primary" : "text-muted-foreground")}>
      <span
        className={cn(
          "figure flex h-5 w-5 items-center justify-center rounded-full border text-xs",
          active ? "border-primary bg-primary text-primary-foreground shadow-[0_0_12px_hsl(var(--primary)/0.5)]" : "border-border"
        )}
      >
        {n}
      </span>
      {icon}
      {STAGE(n).title}
    </p>
  );
}

/** Particles falling from the three source columns into the normalizer. */
function Funnel({ enabled, running }: { enabled: SourceId[]; running: boolean }) {
  const reduce = useReducedMotion();
  return (
    <div className="relative h-10" aria-hidden="true">
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        {SOURCE_IDS.map((s, i) => (
          <line
            key={s}
            x1={(i * 2 + 1) * (100 / 6)}
            y1={0}
            x2={50}
            y2={100}
            stroke={`hsl(${SOURCE_COLOR[s]})`}
            strokeOpacity={enabled.includes(s) ? 0.45 : 0.08}
            strokeWidth={1.5}
            strokeDasharray="4 4"
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>
      {running &&
        !reduce &&
        SOURCE_IDS.filter((s) => enabled.includes(s)).flatMap((s) => {
          const i = SOURCE_IDS.indexOf(s);
          const x0 = (i * 2 + 1) * (100 / 6);
          return [0, 1, 2].map((k) => (
            <motion.span
              key={`${s}-${k}`}
              className="absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{ background: `hsl(${SOURCE_COLOR[s]})`, boxShadow: `0 0 10px hsl(${SOURCE_COLOR[s]} / 0.9)` }}
              initial={{ left: `${x0}%`, top: "0%", opacity: 0 }}
              animate={{ left: [`${x0}%`, "50%"], top: ["0%", "100%"], opacity: [0, 1, 1, 0] }}
              transition={{ duration: 0.9, delay: k * 0.3 + i * 0.1, repeat: Infinity, ease: "easeIn" }}
            />
          ));
        })}
    </div>
  );
}

/** A short flowing connector: vertical on phones (or always, with `vertical`), horizontal from `sm` up. */
function Pipe({ running, color = "var(--primary)", vertical = false }: { running: boolean; color?: string; vertical?: boolean }) {
  const reduce = useReducedMotion();
  const dots = (vertical: boolean) =>
    running &&
    !reduce &&
    [0, 1, 2].map((k) => (
      <motion.span
        key={k}
        className="absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ background: `hsl(${color})`, boxShadow: `0 0 10px hsl(${color} / 0.9)`, ...(vertical ? { left: "50%" } : { top: "50%" }) }}
        initial={vertical ? { top: "0%", opacity: 0 } : { left: "0%", opacity: 0 }}
        animate={vertical ? { top: ["0%", "100%"], opacity: [0, 1, 0] } : { left: ["0%", "100%"], opacity: [0, 1, 0] }}
        transition={{ duration: 0.9, delay: k * 0.3, repeat: Infinity, ease: "linear" }}
      />
    ));
  return (
    <div className="flex items-center justify-center" aria-hidden="true">
      <div className={cn("relative h-8 w-full", !vertical && "sm:hidden")}>
        <span className="absolute left-1/2 top-0 h-full w-0.5 -translate-x-1/2 bg-border" />
        {dots(true)}
      </div>
      <div className={cn("relative hidden h-4 w-6", !vertical && "sm:block")}>
        <span className="absolute left-0 top-1/2 h-0.5 w-full -translate-y-1/2 bg-border" />
        {dots(false)}
      </div>
    </div>
  );
}

const CELLS = 120;

/** The profile store as a matrix of cells, coloured by where each block of profiles first came from. */
function StoreMatrix({ counts }: { counts: Record<SourceId, number> }) {
  const per = POPULATION / CELLS;
  const filled: SourceId[] = [];
  for (const s of SOURCE_IDS) for (let i = 0; i < Math.round(counts[s] / per); i++) filled.push(s);
  return (
    <div className="grid grid-cols-[repeat(20,minmax(0,1fr))] gap-[2px]" aria-hidden="true">
      {Array.from({ length: CELLS }, (_, i) => {
        const s = filled[i];
        return (
          <span
            key={i}
            className="aspect-square rounded-[2px] transition-colors duration-300"
            style={{
              background: s ? `hsl(${SOURCE_COLOR[s]})` : "hsl(var(--secondary))",
              boxShadow: s ? `0 0 6px hsl(${SOURCE_COLOR[s]} / 0.5)` : undefined,
            }}
          />
        );
      })}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Simulator                                                                  */
/* -------------------------------------------------------------------------- */

export default function Simulation({ onChallengePassed, challengePassed, onDescribe }: SimulationProps) {
  const reduce = useReducedMotion();
  const playback = usePlayback(STREAM_UNITS, { realMsPerSimMs: STREAM_MS / STREAM_UNITS });
  const [enabled, setEnabled] = useShareableState<SourceId[]>("sources", ALL_SOURCES, sourcesCodec);
  const [rules, setRules] = useShareableState<RuleId[]>("rules", DEFAULT_RULES, rulesCodec);
  const [mode, setMode] = useShareableState<MatchMode>("match", "all", modeCodec);
  const [activation, setActivation] = useState<Activation | null>(null);
  const [sends, setSends] = useState(0);

  const progress = playback.t / STREAM_UNITS;
  const store = useMemo(() => storeAt(WORLD, enabled, progress), [enabled, progress]);
  const segment = useMemo(() => buildSegment(store, enabled, rules, mode), [store, enabled, rules, mode]);
  const key = segmentKey(enabled, rules, mode);
  const current = activation !== null && activation.key === key;
  const stale = activation !== null && !current;
  const firstPartyOnly = enabled.length === 1 && enabled[0] === "first";

  // Profiles by the first enabled source that knew them (1P before 2P before 3P).
  const composition = useMemo(() => {
    const c: Record<SourceId, number> = { first: 0, second: 0, third: 0 };
    for (const p of store.profiles) {
      const s = SOURCE_IDS.find((x) => enabled.includes(x) && p.firstSeen[x] < store.cutoff);
      if (s) c[s]++;
    }
    return c;
  }, [store, enabled]);

  // Show a new raw → clean record roughly every 0.7 s of streaming.
  const sampleAt = Math.floor((Math.floor(playback.t / 60) * 60 * WORLD.events.length) / STREAM_UNITS);
  const sample = useMemo(() => {
    if (sampleAt === 0) return null;
    const i = latestIndex(WORLD, enabled, sampleAt);
    return i >= 0 ? { i, ...sampleRecord(WORLD, i)! } : null;
  }, [enabled, sampleAt]);

  const streaming = playback.playing;
  const met = usableFirstPartySegment(activation, key);
  useChallenge(met, onChallengePassed, challengePassed);

  const activate = () => {
    setActivation({ key, size: segment.size, matchedInDsp: segment.matchedInDsp, firstPartyOnly });
    setSends((n) => n + 1);
  };

  const toggleSource = (s: SourceId, on: boolean) => setEnabled(SOURCE_IDS.filter((x) => (x === s ? on : enabled.includes(x))));
  const toggleRule = (r: RuleId) => setRules(RULE_IDS.filter((x) => (x === r ? !rules.includes(r) : rules.includes(x))));

  const ruleText = rules.length ? rules.map((r) => RULES.find((x) => x.id === r)!.label).join(mode === "all" ? " AND " : " OR ") : "no rules";
  const narration =
    playback.t === 0
      ? "Press Play to start streaming raw events into the DMP."
      : stale
        ? "The segment changed since you activated it. Activate again to send the new version to the DSP."
        : current
          ? `Activated ${int(activation!.size)} profiles to the DSP; ${int(activation!.matchedInDsp)} matched a cookie ID it can bid on.`
          : playback.done
            ? `Stream complete: ${int(store.eventsIn)} events became ${int(store.profiles.length)} profiles. Build a segment and activate it.`
            : `Collecting: ${int(store.eventsIn)} events in, ${int(store.duplicatesRemoved)} duplicates removed, ${int(store.profiles.length)} profiles built.`;

  useDescribe(
    onDescribe,
    `DMP pipeline. Sources on: ${enabled.length ? enabled.map((s) => SOURCES.find((x) => x.id === s)!.label).join(", ") : "none"}. Stream ${Math.round(
      progress * 100
    )}% through: ${int(store.eventsIn)} events collected, ${int(store.duplicatesRemoved)} redundant records removed, ${int(store.profiles.length)} profiles (${int(
      store.merged
    )} merged across sources). Segment rule: ${ruleText} → ${int(segment.size)} profiles${
      segment.unanswerable.length ? ` (no enabled source supplies: ${segment.unanswerable.join(", ")})` : ""
    }. ${current ? `Activated to a DSP: ${int(activation!.size)} sent, ${int(activation!.matchedInDsp)} matched.` : stale ? "An earlier activation is out of date." : "Not activated yet."}`
  );

  return (
    <div className="space-y-4">
      <SimStage label="DMP data pipeline">
        <PlaybackControls
          playback={playback}
          clock={
            <span>
              <span className="text-lg text-foreground">{int(store.eventsIn)}</span> events
            </span>
          }
        />

        {/* 1 · Collection */}
        <div className="mt-5">
          <StageLabel n={1} active={streaming} icon={<Database className="h-3.5 w-3.5" aria-hidden="true" />} />
          <div className="mt-2 grid grid-cols-3 gap-2">
            {SOURCES.map((s) => {
              const on = enabled.includes(s.id);
              const color = SOURCE_COLOR[s.id];
              return (
                <div
                  key={s.id}
                  className={cn("relative overflow-hidden rounded-xl border-2 bg-card p-2 text-center transition-opacity sm:p-3", !on && "opacity-40")}
                  style={{ borderColor: `hsl(${color} / ${on ? 0.8 : 0.3})`, boxShadow: on && streaming ? `0 0 22px hsl(${color} / 0.35)` : undefined }}
                >
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-8" style={{ background: `linear-gradient(180deg, hsl(${color} / 0.16), transparent)` }} aria-hidden="true" />
                  <p className="figure relative text-lg" style={{ color: `hsl(${color})` }}>
                    {s.short}
                  </p>
                  <p className="relative text-xs text-foreground sm:text-sm">{s.origin}</p>
                  <p className="figure relative mt-1 text-xs text-muted-foreground">{on ? `${int(store.bySource[s.id])} events` : "off"}</p>
                </div>
              );
            })}
          </div>
        </div>

        <Funnel enabled={enabled} running={streaming} />

        {/* 2 · Normalization */}
        <div className="rounded-xl border border-border bg-background/70 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <StageLabel n={2} active={streaming} icon={<Sparkles className="h-3.5 w-3.5" aria-hidden="true" />} />
            <p className="figure text-xs text-muted-foreground">
              {int(store.duplicatesRemoved)} duplicates removed · {enabled.length} schema{enabled.length === 1 ? "" : "s"} → 1
            </p>
          </div>
          <div className="mt-2 min-h-[5.5rem]">
            <AnimatePresence mode="wait" initial={false}>
              {sample ? (
                <motion.div
                  key={sample.i}
                  initial={reduce ? false : { opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduce ? undefined : { opacity: 0, y: 6 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-1"
                >
                  <p
                    className="figure break-all rounded-md border-l-4 bg-secondary/60 px-2 py-1 text-xs text-muted-foreground"
                    style={{ borderLeftColor: `hsl(${SOURCE_COLOR[sample.source]})` }}
                  >
                    {sample.raw}
                  </p>
                  <p className="flex items-center gap-1 pl-2 text-xs text-muted-foreground">
                    <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
                    {sample.duplicate ? "duplicate — dropped" : "gather IDs, map to the DMP schema, enrich"}
                  </p>
                  <p className={cn("figure break-all rounded-md border border-primary/40 bg-primary/5 px-2 py-1 text-xs", sample.duplicate ? "text-muted-foreground line-through" : "text-primary")}>
                    {sample.clean}
                  </p>
                </motion.div>
              ) : (
                <motion.p key="empty" className="pt-6 text-center text-sm text-muted-foreground">
                  {enabled.length ? "Waiting for the first raw event…" : "Every source is off — nothing to collect."}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </div>

        <Pipe running={streaming} vertical />

        {/* 3 · Profiles → 4 · Segment → 5 · Activation */}
        <div className="grid items-stretch sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_auto_minmax(0,1fr)]">
          <div className="rounded-xl border border-border bg-background/70 p-3">
            <StageLabel n={3} active={streaming} icon={<Users className="h-3.5 w-3.5" aria-hidden="true" />} />
            <p className="figure mt-2 text-2xl text-foreground">
              <CountUp value={store.profiles.length} format={int} duration={300} />
            </p>
            <p className="text-xs text-muted-foreground">profiles · {int(store.merged)} merged</p>
            <div className="mt-2">
              <StoreMatrix counts={composition} />
            </div>
          </div>

          <Pipe running={streaming || segment.size > 0} />

          <div className={cn("rounded-xl border bg-background/70 p-3", segment.size > 0 ? "border-primary/50" : "border-border")}>
            <StageLabel n={4} active={segment.size > 0 && !current} icon={<Filter className="h-3.5 w-3.5" aria-hidden="true" />} />
            <p className={cn("figure mt-2 text-2xl", segment.size >= 500 ? "text-primary" : "text-foreground")}>
              <CountUp value={segment.size} format={int} duration={300} />
            </p>
            <p className="text-xs text-muted-foreground">in the segment</p>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-secondary">
              <motion.div
                className="h-full rounded-full bg-primary"
                initial={false}
                animate={{ width: `${store.profiles.length ? (segment.size / store.profiles.length) * 100 : 0}%` }}
                transition={{ type: "spring", stiffness: 120, damping: 20 }}
              />
            </div>
            <p className="mt-2 line-clamp-3 text-xs text-muted-foreground">{ruleText}</p>
            {segment.unanswerable.length > 0 && (
              <p className="mt-1 text-xs text-nobid">
                No source on supplies: {segment.unanswerable.map((r) => RULES.find((x) => x.id === r)!.label).join(", ")}
              </p>
            )}
          </div>

          <Pipe running={current} color={CHAIN.dsp} />

          <div
            className="relative overflow-hidden rounded-xl border-2 bg-card p-3"
            style={{
              borderColor: `hsl(${CHAIN.dsp} / ${current ? 0.9 : 0.35})`,
              boxShadow: current ? `0 0 0 3px hsl(${CHAIN.dsp} / 0.15), 0 0 26px hsl(${CHAIN.dsp} / 0.45)` : undefined,
            }}
          >
            <StageLabel n={5} active={current} icon={<Send className="h-3.5 w-3.5" aria-hidden="true" />} />
            <div className="mt-2 flex items-center gap-2">
              <Server className="h-5 w-5" style={{ color: `hsl(${CHAIN.dsp})` }} aria-hidden="true" />
              <span className="text-sm text-foreground">DSP</span>
            </div>
            <AnimatePresence mode="wait">
              {current ? (
                <motion.div key={`sent-${sends}`} initial={reduce ? false : { opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="mt-1">
                  <p className="figure text-2xl text-foreground">
                    <CountUp value={activation!.matchedInDsp} format={int} />
                  </p>
                  <p className="text-xs text-muted-foreground">matched of {int(activation!.size)} sent</p>
                </motion.div>
              ) : (
                <motion.p key="idle" className="mt-1 text-xs text-muted-foreground" initial={false} animate={{ opacity: 1 }}>
                  {stale ? "Out of date — activate again." : "Nothing activated yet."}
                </motion.p>
              )}
            </AnimatePresence>
            <SimButton variant="primary" onClick={activate} disabled={segment.size === 0} className="mt-3 w-full">
              <Send className="h-4 w-4" aria-hidden="true" />
              {current ? "Re-send" : "Activate"}
            </SimButton>
            {/* a burst of packets each time a segment is sent */}
            <AnimatePresence>
              {!reduce && sends > 0 && current && (
                <motion.span
                  key={`burst-${sends}`}
                  className="pointer-events-none absolute inset-0 rounded-xl"
                  style={{ boxShadow: `inset 0 0 0 2px hsl(${CHAIN.dsp})` }}
                  initial={{ opacity: 1 }}
                  animate={{ opacity: 0 }}
                  transition={{ duration: 1.2 }}
                  aria-hidden="true"
                />
              )}
            </AnimatePresence>
          </div>
        </div>

        <p className="mt-4 min-h-[3rem] text-sm text-foreground" aria-live="polite">
          {narration}
        </p>
      </SimStage>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Data sources">
          <div className="space-y-4">
            {SOURCES.map((s) => (
              <SimToggle key={s.id} label={`${s.label} · ${s.origin}`} checked={enabled.includes(s.id)} onChange={(v) => toggleSource(s.id, v)} hint={SOURCE_NOTE[s.id]} />
            ))}
          </div>
        </Panel>

        <Panel
          title="Segment builder"
          actions={
            <Segmented
              label="Combine rules with"
              value={mode}
              onChange={setMode}
              size="sm"
              options={[
                { value: "all", label: "Match all" },
                { value: "any", label: "Match any" },
              ]}
            />
          }
        >
          <ul className="-mx-3 space-y-1" aria-label="Segment rules">
            {RULES.map((r) => {
              const on = rules.includes(r.id);
              const answerable = r.providers.some((p) => enabled.includes(p));
              return (
                <li key={r.id}>
                  <button
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggleRule(r.id)}
                    className={cn(
                      "interactive flex w-full items-center justify-between gap-3 rounded-lg border px-3 py-2 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      on ? "border-primary/50 bg-primary/5" : "border-transparent hover:border-border"
                    )}
                  >
                    <span className="min-w-0">
                      <span className={cn("block", on ? "text-foreground" : "text-muted-foreground")}>{r.label}</span>
                      <span className="block text-xs text-muted-foreground">
                        {r.family} · known by{" "}
                        {r.providers.map((p) => (
                          <span key={p} className="figure mr-1" style={{ color: enabled.includes(p) ? `hsl(${SOURCE_COLOR[p]})` : undefined }}>
                            {SOURCES.find((x) => x.id === p)!.short}
                          </span>
                        ))}
                        {!answerable && <span className="text-nobid">(source off)</span>}
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
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Events in" value={int(store.eventsIn)} sub={`${int(store.duplicatesRemoved)} duplicates dropped`} />
        <Stat label="Profiles" value={int(store.profiles.length)} sub={`${int(store.merged)} merged`} />
        <Stat label="Segment" value={int(segment.size)} tone={segment.size >= 500 ? "primary" : "muted"} sub={firstPartyOnly ? "first-party only" : `${enabled.length} source${enabled.length === 1 ? "" : "s"}`} />
        <Stat
          label="Matched in DSP"
          value={current ? int(activation!.matchedInDsp) : "—"}
          tone={current ? "primary" : "muted"}
          sub={current ? `of ${int(activation!.size)} activated` : stale ? "activation out of date" : "not activated"}
        />
      </div>

      <ChallengeMet show={met}>
        {int(activation?.size ?? 0)} first-party profiles activated to the DSP. Challenge complete!
      </ChallengeMet>
    </div>
  );
}

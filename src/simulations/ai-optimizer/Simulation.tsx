import { useMemo, useState, type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { BrainCircuit, ChevronLeft, ChevronRight, Flag, Ruler } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  CHAIN,
  ChallengeMet,
  Meter,
  Panel,
  PlaybackControls,
  SimButton,
  SimSlider,
  SimStage,
  SimToggle,
  Stat,
  money,
  pct,
  useChallenge,
  useDescribe,
  usePlayback,
} from "@/simulations/kit";
import type { SimulationProps } from "@/simulations/types";
import {
  CHANNELS,
  DAY_MINUTES,
  DEFAULT_SETTINGS,
  allocationAt,
  arrivedBy,
  beatsTheRules,
  bidFor,
  channelSpendAt,
  clockLabel,
  generateDay,
  improvementOf,
  laneAt,
  simulateDay,
  type ChannelId,
  type Impression,
  type LaneResult,
  type Settings,
} from "@/simulations/ai-optimizer/logic";

/**
 * AI bidding and budget optimizer. One seeded day of ~500 auctions plays out
 * for two buyers side by side: fixed rules (a flat bid, budget split evenly)
 * against a model (bid = predicted conversion probability × target CPA,
 * capped, with optional budget reallocation). Ideas from the AI lesson's
 * BidPricer and BudgetAllocator, scaled up to a whole day.
 */

const TONE: Record<ChannelId, string> = {
  search: CHAIN.dsp,
  social: CHAIN.agency,
  display: "var(--primary)",
  video: CHAIN.adserver,
};

const STREAM = 22;
const cpaText = (spend: number, conv: number) => (conv > 0 ? money(spend / conv) : "—");

/* -------------------------------------------------------------------------- */
/* One lane of the race                                                        */
/* -------------------------------------------------------------------------- */

function Lane({
  name,
  icon,
  sub,
  lane,
  day,
  count,
  budget,
  raceMax,
  leading,
}: {
  name: string;
  icon: ReactNode;
  sub: string;
  lane: LaneResult;
  day: Impression[];
  count: number;
  budget: number;
  raceMax: number;
  leading: boolean;
}) {
  const reduce = useReducedMotion();
  const now = laneAt(lane, count);
  const recent = day.slice(Math.max(0, count - STREAM), count);

  return (
    <div
      className={cn(
        "relative min-w-0 rounded-xl border-2 bg-card/90 p-3 transition-shadow",
        leading ? "border-primary/60 shadow-[0_0_28px_hsl(var(--primary)/0.3)]" : "border-border",
      )}
    >
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
            leading ? "bg-primary text-primary-foreground shadow-[0_0_16px_hsl(var(--primary)/0.5)]" : "bg-secondary text-foreground",
          )}
        >
          {icon}
        </span>
        <div className="min-w-0">
          <p className="text-sm text-foreground">{name}</p>
          <p className="truncate text-xs text-muted-foreground">{sub}</p>
        </div>
        {leading && count > 0 && (
          <motion.span
            layoutId="ai-leader"
            className="ml-auto rounded-full bg-primary/15 px-2 py-0.5 text-xs text-primary"
            transition={{ type: "spring", stiffness: 300, damping: 26 }}
          >
            cheaper per conversion
          </motion.span>
        )}
      </div>

      {/* Impression stream: newest on the right */}
      <div className="mt-3 flex h-6 items-center justify-end gap-1 overflow-hidden" aria-hidden="true">
        {recent.map((imp) => {
          const f = lane.frames[imp.index];
          const tone = TONE[imp.channel];
          return (
            <motion.span
              key={imp.index}
              initial={reduce ? false : { scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.2 }}
              className={cn(
                "block shrink-0 rounded-full",
                f.outcome === "won" ? "h-3.5 w-3.5" : f.outcome === "lost" ? "h-3 w-3 border-2" : "h-1 w-2.5 bg-muted-foreground/30",
              )}
              style={
                f.outcome === "won"
                  ? {
                      background: `hsl(${tone})`,
                      boxShadow: f.converted ? "0 0 0 3px hsl(var(--primary) / 0.35), 0 0 14px hsl(var(--primary) / 0.9)" : undefined,
                    }
                  : f.outcome === "lost"
                    ? { borderColor: `hsl(${tone} / 0.45)` }
                    : undefined
              }
            />
          );
        })}
      </div>

      {/* Counters */}
      <dl className="mt-3 grid grid-cols-4 gap-2 text-center">
        {[
          { k: "Spend", v: money(now.spend, 0) },
          { k: "Won", v: String(now.won) },
          { k: "Conv.", v: String(now.conversions) },
          { k: "CPA", v: cpaText(now.spend, now.conversions) },
        ].map((c) => (
          <div key={c.k} className="rounded-md bg-secondary/70 px-1 py-1.5">
            <dt className="text-xs text-muted-foreground">{c.k}</dt>
            <dd className={cn("figure text-sm sm:text-base", c.k === "CPA" && leading ? "text-primary" : "text-foreground")}>{c.v}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-3 space-y-2">
        <div>
          <div className="mb-1 flex justify-between text-xs text-muted-foreground">
            <span>Budget used</span>
            <span className="figure">{pct((now.spend / budget) * 100)}</span>
          </div>
          <Meter value={now.spend} max={budget} tone="floor" label={`${name} budget used`} />
        </div>
        {/* The race: conversions so far */}
        <div>
          <div className="mb-1 flex justify-between text-xs text-muted-foreground">
            <span>Conversions</span>
            <span className="figure">{now.conversions}</span>
          </div>
          <div className="relative h-5 rounded-full bg-secondary">
            <motion.div
              className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-primary/30 to-primary"
              initial={false}
              animate={{ width: `${(now.conversions / raceMax) * 100}%` }}
              transition={{ type: "spring", stiffness: 160, damping: 22 }}
            />
            <motion.span
              className="absolute top-1/2 flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-primary bg-card text-primary shadow-[0_0_14px_hsl(var(--primary)/0.6)]"
              initial={false}
              animate={{ left: `${Math.max(4, (now.conversions / raceMax) * 100)}%` }}
              transition={{ type: "spring", stiffness: 160, damping: 22 }}
              aria-hidden="true"
            >
              <Flag className="h-3 w-3" />
            </motion.span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Budget by channel                                                          */
/* -------------------------------------------------------------------------- */

function ChannelBudgets({ title, lane, day, count, budget }: { title: string; lane: LaneResult; day: Impression[]; count: number; budget: number }) {
  const alloc = allocationAt(lane, Math.max(0, count - 1)).budget;
  const spent = channelSpendAt(day, lane, count);
  const max = budget * 0.75;
  return (
    <div>
      <p className="mb-2 text-sm text-foreground">{title}</p>
      <ul className="space-y-2">
        {CHANNELS.map((c) => (
          <li key={c.id}>
            <div className="flex items-baseline justify-between text-xs">
              <span className="flex items-center gap-1.5 text-foreground">
                <span className="h-2 w-2 rounded-full" style={{ background: `hsl(${TONE[c.id]})` }} aria-hidden="true" />
                {c.name}
              </span>
              <span className="figure text-muted-foreground">
                {money(spent[c.id], 0)} / {money(alloc[c.id], 0)}
              </span>
            </div>
            <div
              className="relative mt-1 h-2.5 overflow-hidden rounded-full bg-secondary"
              role="meter"
              aria-label={`${title}: ${c.name} spent ${money(spent[c.id], 0)} of ${money(alloc[c.id], 0)}`}
              aria-valuenow={Math.round(spent[c.id])}
              aria-valuemin={0}
              aria-valuemax={Math.round(alloc[c.id])}
            >
              <motion.div
                className="absolute inset-y-0 left-0 rounded-full"
                style={{ background: `hsl(${TONE[c.id]} / 0.25)` }}
                initial={false}
                animate={{ width: `${Math.min(100, (alloc[c.id] / max) * 100)}%` }}
                transition={{ type: "spring", stiffness: 120, damping: 18 }}
              />
              <motion.div
                className="absolute inset-y-0 left-0 rounded-full"
                style={{ background: `hsl(${TONE[c.id]})` }}
                initial={false}
                animate={{ width: `${Math.min(100, (spent[c.id] / max) * 100)}%` }}
                transition={{ duration: 0.1 }}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Simulation                                                                  */
/* -------------------------------------------------------------------------- */

export default function Simulation({ onChallengePassed, challengePassed, onDescribe }: SimulationProps) {
  const reduce = useReducedMotion();
  const playback = usePlayback(DAY_MINUTES, { realMsPerSimMs: 9 });
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const set = <K extends keyof Settings>(key: K, value: Settings[K]) => setSettings((s) => ({ ...s, [key]: value }));

  const day = useMemo(() => generateDay(settings.seed), [settings.seed]);
  const result = useMemo(() => simulateDay(settings, day), [settings, day]);
  const count = arrivedBy(day, playback.t);
  const rulesNow = laneAt(result.rules, count);
  const modelNow = laneAt(result.model, count);
  const raceMax = Math.max(4, result.rules.conversions, result.model.conversions);

  const liveImprovement = improvementOf(
    rulesNow.conversions ? rulesNow.spend / rulesNow.conversions : Infinity,
    modelNow.conversions ? modelNow.spend / modelNow.conversions : Infinity,
  );
  const modelLeads = count > 0 && Number.isFinite(liveImprovement) && liveImprovement > 0.001;
  const rulesLead = count > 0 && Number.isFinite(liveImprovement) && liveImprovement < -0.001;

  const met = playback.done && beatsTheRules(result, settings.modelBidding, settings.dailyBudget);
  useChallenge(met, onChallengePassed, challengePassed);

  // "Now bidding": the latest impression, sampled so it is readable while playing.
  const shownIndex = count === 0 ? 0 : Math.max(0, Math.floor((count - 1) / 10) * 10);
  const cur = day[shownIndex];
  const flat = settings.flatBid;
  const modelBid = bidFor(cur, { bidding: settings.modelBidding ? "model" : "flat", flatBid: flat, targetCpa: settings.targetCpa, bidCap: settings.bidCap });
  const scaleMax = Math.max(3.5, settings.bidCap, flat, cur.market) * 1.05;

  const finalImprovement = result.improvement;
  const improvementLabel = (v: number) => (Number.isFinite(v) ? `${v >= 0 ? "" : "−"}${Math.abs(v * 100).toFixed(0)}%` : "—");
  const modelName = settings.modelBidding ? "Model" : "Model (off)";

  // Narration: only at coarse moments so screen readers aren't flooded.
  const bucket = playback.done ? "done" : playback.t === 0 ? "start" : `h${Math.floor(playback.t / 120)}`;
  const narration = useMemo(() => {
    if (bucket === "start") return "Press Play to run the day. Both buyers see exactly the same 500 auctions.";
    if (bucket === "done")
      return `Day over. Rules paid ${cpaText(result.rules.spend, result.rules.conversions)} per conversion, the ${settings.modelBidding ? "model" : "second lane"} paid ${cpaText(
        result.model.spend,
        result.model.conversions,
      )} — ${Number.isFinite(finalImprovement) ? `${Math.abs(finalImprovement * 100).toFixed(0)}% ${finalImprovement >= 0 ? "cheaper" : "dearer"}` : "no conversions"}.`;
    return `${clockLabel(playback.t)}. Rules: ${money(rulesNow.spend, 0)} spent, ${rulesNow.conversions} conversions. ${modelName}: ${money(modelNow.spend, 0)} spent, ${modelNow.conversions} conversions.`;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bucket, result, settings.modelBidding]);

  useDescribe(
    onDescribe,
    `A simulated day of 500 auctions (day #${settings.seed}), ${playback.done ? "finished" : `at ${clockLabel(playback.t)}`}. Rules lane: flat ${money(flat)} bid, budget split evenly — ${money(
      rulesNow.spend,
      0,
    )} spent, ${rulesNow.won} won, ${rulesNow.conversions} conversions, CPA ${cpaText(rulesNow.spend, rulesNow.conversions)}. Model lane: ${
      settings.modelBidding
        ? `bids predicted conversion × ${money(settings.targetCpa, 0)} target CPA, capped at ${money(settings.bidCap)}`
        : "model bidding off (flat bid)"
    }, budget reallocation ${settings.reallocate ? "on" : "off"} — ${money(modelNow.spend, 0)} spent, ${modelNow.won} won, ${modelNow.conversions} conversions, CPA ${cpaText(
      modelNow.spend,
      modelNow.conversions,
    )}. Full-day improvement in cost per conversion: ${improvementLabel(finalImprovement)}.`,
  );

  return (
    <div className="space-y-4">
      <SimStage label="Rules versus model: a day of auctions">
        <PlaybackControls
          playback={playback}
          speeds={[1, 2, 4]}
          clock={
            <span>
              <span className={cn("text-lg", playback.done ? "text-primary" : "text-foreground")}>
                {clockLabel(playback.done ? DAY_MINUTES - 1 : playback.t)}
              </span>
              <span className="ml-2">{count}/500</span>
            </span>
          }
        />

        {/* Day progress */}
        <div className="relative mt-4 h-1.5 overflow-hidden rounded-full bg-secondary" aria-hidden="true">
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-primary/40 to-primary"
            style={{ width: `${(playback.t / DAY_MINUTES) * 100}%` }}
          />
        </div>

        {/* Now bidding */}
        <div className="mt-4 rounded-lg border border-border bg-background/80 p-3">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
            <span className="text-xs uppercase tracking-wide text-muted-foreground">Now bidding</span>
            <span className="flex items-center gap-1.5 text-foreground">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: `hsl(${TONE[cur.channel]})` }} aria-hidden="true" />
              {CHANNELS.find((c) => c.id === cur.channel)?.name} impression
            </span>
            <span className="text-muted-foreground">
              predicted conversion <span className="figure text-foreground">{pct(cur.pConv * 100, 1)}</span>
            </span>
          </div>
          <div className="relative mt-4 h-2 rounded-full bg-secondary" aria-hidden="true">
            {[
              { k: "market", v: cur.market, cls: "h-5 w-1 bg-muted-foreground" },
              { k: "rules", v: flat, cls: "h-3.5 w-3.5 rounded-full border-2 border-card bg-floor" },
              { k: "model", v: modelBid, cls: "h-3.5 w-3.5 rounded-full border-2 border-card bg-primary shadow-[0_0_12px_hsl(var(--primary)/0.8)]" },
            ].map((m) => (
              <motion.span
                key={m.k}
                className="absolute top-1/2"
                initial={false}
                animate={{ left: `${(m.v / scaleMax) * 100}%` }}
                transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 220, damping: 24 }}
              >
                <span className={cn("block -translate-x-1/2 -translate-y-1/2 rounded-full", m.cls)} />
              </motion.span>
            ))}
          </div>
          <ul className="mt-3 flex flex-wrap gap-2 text-xs">
            {[
              { k: "Market price", v: cur.market, dot: "bg-muted-foreground", out: null },
              { k: "Rules bid", v: flat, dot: "bg-floor", out: result.rules.frames[shownIndex].outcome },
              { k: settings.modelBidding ? "Model bid" : "Lane 2 bid", v: modelBid, dot: "bg-primary", out: result.model.frames[shownIndex].outcome },
            ].map((m) => (
              <li key={m.k} className="flex items-center gap-1.5 rounded-full border border-border bg-card px-2 py-0.5">
                <span className={cn("h-2 w-2 rounded-full", m.dot)} aria-hidden="true" />
                <span className="text-muted-foreground">{m.k}</span>
                <span className="figure text-foreground">{money(m.v)}</span>
                {m.out && (
                  <span className={m.out === "won" ? "text-primary" : m.out === "lost" ? "text-nobid" : "text-muted-foreground"}>
                    {m.out === "won" ? "wins" : m.out === "lost" ? "loses" : "out of budget"}
                  </span>
                )}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-muted-foreground">
            A bid wins if it meets the market price, and the winner pays its own bid.{" "}
            {settings.modelBidding
              ? `Model bid = ${pct(cur.pConv * 100, 1)} × ${money(settings.targetCpa, 0)}${cur.pConv * settings.targetCpa > settings.bidCap ? `, capped at ${money(settings.bidCap)}` : ""}.`
              : "Model bidding is off, so both lanes bid the same flat price."}
          </p>
        </div>

        {/* The race */}
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <Lane
            name="Rules"
            icon={<Ruler className="h-5 w-5" aria-hidden="true" />}
            sub={`Flat ${money(flat)} bid · even split`}
            lane={result.rules}
            day={day}
            count={count}
            budget={settings.dailyBudget}
            raceMax={raceMax}
            leading={rulesLead}
          />
          <Lane
            name={modelName}
            icon={<BrainCircuit className="h-5 w-5" aria-hidden="true" />}
            sub={`${settings.modelBidding ? `pConv × ${money(settings.targetCpa, 0)}, cap ${money(settings.bidCap)}` : `Flat ${money(flat)} bid`} · ${settings.reallocate ? "reallocating" : "even split"}`}
            lane={result.model}
            day={day}
            count={count}
            budget={settings.dailyBudget}
            raceMax={raceMax}
            leading={modelLeads}
          />
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground" aria-hidden="true">
          {CHANNELS.map((c) => (
            <span key={c.id} className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: `hsl(${TONE[c.id]})` }} />
              {c.name}
            </span>
          ))}
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full border-2 border-muted-foreground/50" />
            lost
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-primary shadow-[0_0_8px_hsl(var(--primary)/0.9)]" />
            converted
          </span>
        </div>

        <p className="mt-3 min-h-[2.5rem] text-sm text-foreground" aria-live="polite">
          {narration}
        </p>
      </SimStage>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Bidding">
          <div className="space-y-4">
            <SimSlider label="Rules: flat bid per impression" value={flat} min={0.4} max={2.5} step={0.05} onChange={(v) => set("flatBid", v)} format={money} />
            <SimToggle
              label="Model bidding"
              checked={settings.modelBidding}
              onChange={(v) => set("modelBidding", v)}
              hint="Bid = predicted conversion probability × target CPA, capped."
            />
            <div className={cn("space-y-4 transition-opacity", !settings.modelBidding && "opacity-50")}>
              <SimSlider
                label="Target cost per conversion (CPA)"
                value={settings.targetCpa}
                min={5}
                max={40}
                onChange={(v) => set("targetCpa", v)}
                format={(v) => money(v, 0)}
                hint="Too high and the model overpays; too low and it barely buys."
              />
              <SimSlider label="Bid cap" value={settings.bidCap} min={1} max={5} step={0.25} onChange={(v) => set("bidCap", v)} format={money} />
            </div>
          </div>
        </Panel>

        <Panel title="Budget">
          <SimToggle
            label="Budget reallocation (model lane)"
            checked={settings.reallocate}
            onChange={(v) => set("reallocate", v)}
            hint="Every three hours, move unspent budget toward the channels with the best expected conversions per dollar."
          />
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <ChannelBudgets title="Rules" lane={result.rules} day={day} count={count} budget={settings.dailyBudget} />
            <ChannelBudgets title={modelName} lane={result.model} day={day} count={count} budget={settings.dailyBudget} />
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Faint bar: budget assigned to the channel. Solid bar: spent so far. Daily budget {money(settings.dailyBudget, 0)}.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
            <span className="text-sm text-foreground">Traffic</span>
            <SimButton ariaLabel="Previous day" onClick={() => set("seed", Math.max(1, settings.seed - 1))} disabled={settings.seed <= 1} className="w-10 px-0">
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </SimButton>
            <span className="figure min-w-[4rem] text-center text-sm text-foreground">Day #{settings.seed}</span>
            <SimButton ariaLabel="Next day" onClick={() => set("seed", Math.min(99, settings.seed + 1))} className="w-10 px-0">
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </SimButton>
            <span className="text-xs text-muted-foreground">Same day, same auctions — every time.</span>
          </div>
        </Panel>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Rules CPA" value={cpaText(rulesNow.spend, rulesNow.conversions)} tone="floor" sub={`${rulesNow.conversions} conversions`} />
        <Stat
          label={`${settings.modelBidding ? "Model" : "Lane 2"} CPA`}
          value={cpaText(modelNow.spend, modelNow.conversions)}
          tone="primary"
          sub={`${modelNow.conversions} conversions`}
        />
        <Stat
          label="CPA saving"
          value={count > 0 ? improvementLabel(liveImprovement) : "—"}
          tone={
            Number.isFinite(liveImprovement) && liveImprovement >= 0.25
              ? "primary"
              : Number.isFinite(liveImprovement) && liveImprovement < 0
                ? "nobid"
                : "muted"
          }
          sub={playback.done ? "full day · challenge needs 25%" : "so far today"}
        />
        <Stat
          label={`${settings.modelBidding ? "Model" : "Lane 2"} budget used`}
          value={pct((modelNow.spend / settings.dailyBudget) * 100)}
          tone={playback.done && modelNow.spend < settings.dailyBudget * 0.5 ? "floor" : "muted"}
          sub={
            playback.done && modelNow.spend < settings.dailyBudget * 0.5
              ? "cheap, but barely buying"
              : `rules used ${pct((rulesNow.spend / settings.dailyBudget) * 100)}`
          }
        />
      </div>

      <ChallengeMet show={met}>
        Model bidding paid {cpaText(result.model.spend, result.model.conversions)} per conversion against the rules'{" "}
        {cpaText(result.rules.spend, result.rules.conversions)} — {Math.round(finalImprovement * 100)}% cheaper. Challenge complete!
      </ChallengeMet>
    </div>
  );
}

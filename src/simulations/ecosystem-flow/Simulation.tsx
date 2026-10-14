import { useEffect, useMemo, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Briefcase, Castle, CheckCircle2, Gavel, Megaphone, Newspaper, Server, Store, XCircle } from "lucide-react";

import { enumCodec, useShareableState } from "@/hooks/useShareableState";
import { cn } from "@/lib/utils";
import {
  CHAIN,
  ChallengeMet,
  FlowNode,
  Panel,
  PlaybackControls,
  Segmented,
  SimStage,
  SimToggle,
  Stat,
  money,
  pct,
  stepAt,
  stepStarts,
  useChallenge,
  useDescribe,
  usePlayback,
} from "@/simulations/kit";
import type { SimulationProps } from "@/simulations/types";
import {
  OPEN_CHAIN,
  QUIZ_OPTIONS,
  between,
  chainFor,
  dollarTrail,
  publisherShare,
  traceTheDollarMet,
  type Hop,
  type Mode,
} from "@/simulations/ecosystem-flow/logic";

/**
 * The AdTech stack in motion: a dollar travels from the advertiser down the
 * open-web chain (agency trading desk, DSP, exchange, SSP) to the publisher,
 * each platform lighting up with what it adds and what it keeps. Walled-garden
 * mode collapses the middle into one company. Fees are illustrative.
 */

const HOP_MS = 1700;
const COIN_MS = 650;
const ANSWER_ID = between(OPEN_CHAIN, "dsp", "ssp")?.id;
const modeCodec = enumCodec(["open", "walled"] as const);

const ICONS: Record<string, ReactNode> = {
  advertiser: <Megaphone className="h-5 w-5" />,
  atd: <Briefcase className="h-5 w-5" />,
  dsp: <Server className="h-5 w-5" />,
  exchange: <Gavel className="h-5 w-5" />,
  ssp: <Store className="h-5 w-5" />,
  publisher: <Newspaper className="h-5 w-5" />,
  platform: <Castle className="h-5 w-5" />,
};

const PLATFORM_PARTS = ["buying tools", "auction", "inventory", "user data"];

/** The vertical wire between two hops, with a coin dropping down it as money moves on. */
function Wire({ moving, amount, lit }: { moving: boolean; amount: number; lit: boolean }) {
  const reduce = useReducedMotion();
  return (
    <div className="relative mx-auto h-7 w-0.5" aria-hidden="true">
      <span className={cn("absolute inset-0 rounded-full", lit ? "bg-primary/60" : "bg-border")} />
      <AnimatePresence>
        {moving && !reduce && (
          <motion.span
            className="figure absolute left-1/2 z-10 flex h-6 -translate-x-1/2 items-center rounded-full bg-primary px-2 text-xs text-primary-foreground shadow-[0_0_16px_hsl(var(--primary)/0.7)]"
            initial={{ top: "-60%", opacity: 0 }}
            animate={{ top: "60%", opacity: [0, 1, 1] }}
            exit={{ opacity: 0 }}
            transition={{ duration: COIN_MS / 1000, ease: "easeIn" }}
          >
            {money(amount)}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Simulation({ onChallengePassed, challengePassed, onDescribe }: SimulationProps) {
  const reduce = useReducedMotion();
  const [mode, setModeRaw] = useShareableState<Mode>("mode", "open", modeCodec);
  const [feesOn, setFeesRaw] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);
  const [ranOpenWithFees, setRanOpenWithFees] = useState(false);

  const chain = chainFor(mode);
  const steps = useMemo(() => chain.map((h) => ({ ...h, duration: HOP_MS })), [chain]);
  const starts = stepStarts(steps);
  const total = steps.length * HOP_MS;
  const playback = usePlayback(total);
  const { reset } = playback;

  // A run only counts for the configuration it was played with.
  const setMode = (m: Mode) => {
    reset();
    setModeRaw(m);
  };
  const setFees = (v: boolean) => {
    reset();
    setFeesRaw(v);
  };

  useEffect(() => {
    if (playback.done && mode === "open" && feesOn) setRanOpenWithFees(true);
  }, [playback.done, mode, feesOn]);

  const trail = useMemo(() => dollarTrail(chain, feesOn), [chain, feesOn]);
  const share = publisherShare(chain, feesOn);
  const started = playback.t > 0;
  const active = started ? stepAt(steps, playback.t) : -1;
  const inStep = started ? playback.t - starts[active] : 0;
  const [selected, setSelected] = useState(0);
  const focus = active >= 0 ? active : Math.min(selected, chain.length - 1);
  const hop: Hop = chain[focus];
  const hopTrail = trail[focus];

  const met = traceTheDollarMet(ranOpenWithFees, answer);
  useChallenge(met, onChallengePassed, challengePassed);

  useDescribe(
    onDescribe,
    `${mode === "open" ? "Open-web" : "Walled-garden"} chain: ${chain.map((h) => h.label).join(" → ")}. Fees ${feesOn ? "on (illustrative)" : "off"}; ${money(share)} of each $1 reaches ${
      mode === "open" ? "the publisher" : "the platform"
    }. ${started ? `The flow is at ${hop.label}${playback.done ? " (finished)" : ""}.` : `Not playing; showing ${hop.label}.`} ${
      ranOpenWithFees ? "An open-web run with fees on has finished." : "No open-web run with fees on yet."
    } ${answer ? `Quiz answer chosen: ${QUIZ_OPTIONS.find((o) => o.id === answer)?.label}.` : ""}`
  );

  const kept = trail.filter((t) => t.kept > 0);
  const middleCount = chain.length - 2;

  return (
    <div className="space-y-4">
      <SimStage label="Money and data flowing through the AdTech stack">
        <PlaybackControls
          playback={playback}
          onStep={() => playback.seek(active + 1 < steps.length ? starts[active + 1] : total)}
          clock={
            <span>
              hop <span className="text-lg text-foreground">{started ? active + 1 : 0}</span> / {steps.length}
            </span>
          }
        />
        <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-3">
          <Segmented
            label="Ecosystem"
            value={mode}
            onChange={setMode}
            options={[
              { value: "open", label: "Open web" },
              { value: "walled", label: "Walled garden" },
            ]}
          />
          <div className="min-w-[12rem]">
            <SimToggle label="Fees on" checked={feesOn} onChange={setFees} hint="Illustrative take rates" />
          </div>
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
          {/* The chain, top to bottom: money flows down. */}
          <ol className="relative" aria-label="Platforms in the chain">
            <AnimatePresence initial={false} mode="popLayout">
              {chain.map((h, i) => {
                const t = trail[i];
                const isActive = i === active && !playback.done;
                const passed = started && (i < active || playback.done);
                const showFee = feesOn && h.fee > 0 && (passed || isActive || !started);
                return (
                  <motion.li
                    key={h.id}
                    layout={!reduce}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: reduce ? 0 : 0.35 }}
                  >
                    {i > 0 && <Wire moving={isActive && playback.playing && inStep < COIN_MS} amount={trail[i - 1].passes} lit={passed || isActive} />}
                    <div className="flex items-start gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSelected(i);
                          if (started) playback.seek(starts[i] + COIN_MS + 1);
                          playback.pause();
                        }}
                        aria-label={`${h.label}: show what it adds and takes`}
                        aria-current={i === focus ? "true" : undefined}
                        className="min-w-0 flex-1 rounded-xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
                      >
                        <FlowNode
                          label={h.label}
                          role={h.role}
                          icon={ICONS[h.id]}
                          active={isActive || (!started && i === focus)}
                          dimmed={started && !passed && !isActive}
                          className="w-full flex-row justify-start gap-3 py-2.5 text-left"
                        />
                        {h.id === "platform" && (
                          <span className="mt-1.5 flex flex-wrap gap-1 pl-1">
                            {PLATFORM_PARTS.map((p) => (
                              <motion.span
                                key={p}
                                initial={reduce ? false : { opacity: 0, y: -4 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="rounded-full border border-border bg-secondary px-2 py-0.5 text-xs text-muted-foreground"
                              >
                                {p}
                              </motion.span>
                            ))}
                          </span>
                        )}
                      </button>
                      <div className="w-[4.5rem] shrink-0 pt-3 text-right">
                        <span className="figure block text-sm text-foreground">{money(t.arrives)}</span>
                        <AnimatePresence>
                          {showFee && (
                            <motion.span
                              initial={{ opacity: 0, x: 8 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0 }}
                              className="figure block text-xs text-nobid"
                            >
                              −{money(t.kept)}
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ol>

          {/* What the focused platform adds and takes */}
          <div className="space-y-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={`${mode}-${hop.id}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="relative overflow-hidden rounded-xl border border-border bg-background/80 p-4"
                style={{ boxShadow: `0 0 32px hsl(${CHAIN[hop.role]} / 0.18)` }}
              >
                <span className="absolute inset-y-0 left-0 w-1" style={{ background: `hsl(${CHAIN[hop.role]})` }} aria-hidden="true" />
                <div className="flex items-center gap-2">
                  <span style={{ color: `hsl(${CHAIN[hop.role]})` }} aria-hidden="true">
                    {ICONS[hop.id]}
                  </span>
                  <h3 className="text-lg text-foreground">{hop.label}</h3>
                </div>
                <dl className="mt-3 space-y-3 text-sm">
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-primary">What it adds</dt>
                    <dd className="mt-0.5 text-foreground">{hop.adds}</dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-nobid">What it takes</dt>
                    <dd className="mt-0.5 text-foreground">
                      {hop.takes}
                      {hop.fee > 0 && (
                        <span className="figure ml-1 text-muted-foreground">
                          {feesOn ? `${pct(hop.fee * 100)} of what arrives: ${money(hopTrail.kept)}` : `(${pct(hop.fee * 100)}, fees off)`}
                        </span>
                      )}
                    </dd>
                  </div>
                </dl>
              </motion.div>
            </AnimatePresence>

            {/* Where the dollar goes */}
            <div className="rounded-xl border border-border bg-background/80 p-4">
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Where $1.00 goes</p>
                <p className="text-xs text-muted-foreground">{feesOn ? "illustrative fees" : "fees off"}</p>
              </div>
              <div className="mt-2 flex h-6 overflow-hidden rounded-full bg-secondary" role="img" aria-label={`${money(share)} of each dollar reaches the ${mode === "open" ? "publisher" : "platform"}`}>
                {kept.map((k) => {
                  const h = chain.find((x) => x.id === k.id)!;
                  return (
                    <motion.span
                      key={k.id}
                      initial={false}
                      animate={{ width: `${k.kept * 100}%` }}
                      className="h-full border-r border-card"
                      style={{ background: `hsl(${CHAIN[h.role]} / 0.75)` }}
                    />
                  );
                })}
                <motion.span
                  initial={false}
                  animate={{ width: `${share * 100}%` }}
                  className="figure flex h-full items-center justify-end bg-primary px-2 text-xs text-primary-foreground"
                  style={{ boxShadow: "inset 0 0 12px hsl(var(--primary-foreground) / 0.25)" }}
                >
                  {money(share)}
                </motion.span>
              </div>
              <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                {kept.map((k) => {
                  const h = chain.find((x) => x.id === k.id)!;
                  return (
                    <li key={k.id} className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full" style={{ background: `hsl(${CHAIN[h.role]})` }} aria-hidden="true" />
                      {h.label} <span className="figure">{money(k.kept)}</span>
                    </li>
                  );
                })}
                <li className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-primary" aria-hidden="true" />
                  {mode === "open" ? "Publisher" : "Platform"} <span className="figure">{money(share)}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <p className="mt-4 min-h-[3rem] text-sm text-foreground" aria-live="polite">
          {!started
            ? mode === "open"
              ? "Press Play to send a dollar from the advertiser down the open-web chain. Select any platform to read its job."
              : "In a walled garden one company owns the users, the data, the buying tools and the inventory, so the chain collapses."
            : playback.done
              ? `${money(share)} of the dollar reached the ${mode === "open" ? "publisher" : "platform"}${feesOn ? ` — ${money(1 - share)} stayed with the platforms in between` : ""}.`
              : `${hop.label}: ${hop.adds}`}
        </p>
      </SimStage>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Open web vs walled garden">
          <ul className="space-y-3 text-sm">
            <li className="flex gap-3">
              <span className="figure w-10 shrink-0 text-lg text-foreground">{OPEN_CHAIN.length}</span>
              <span className="text-muted-foreground">
                companies on the open web, each a separate business with its own data — independent AdTech.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="figure w-10 shrink-0 text-lg text-foreground">{chainFor("walled").length}</span>
              <span className="text-muted-foreground">
                in a walled garden. GAMA — Google, Apple, Meta, Amazon — keep the audience and the data inside and make advertisers buy through their own tools.
              </span>
            </li>
          </ul>
        </Panel>

        <Panel title="Quick check">
          <p className="text-sm text-foreground">Which platform sits between the DSP and the SSP?</p>
          {!ranOpenWithFees && <p className="mt-1 text-xs text-muted-foreground">Run the open-web flow with fees on to the end to unlock this.</p>}
          <div className="mt-3 grid grid-cols-2 gap-2" role="group" aria-label="Which platform sits between the DSP and the SSP?">
            {QUIZ_OPTIONS.map((o) => {
              const chosen = answer === o.id;
              const right = chosen && o.id === ANSWER_ID;
              return (
                <button
                  key={o.id}
                  type="button"
                  disabled={!ranOpenWithFees}
                  aria-pressed={chosen}
                  onClick={() => setAnswer(o.id)}
                  className={cn(
                    "interactive flex min-h-[2.75rem] items-center justify-between gap-2 rounded-lg border px-3 text-left text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50",
                    chosen
                      ? right
                        ? "border-primary bg-primary/10 text-foreground shadow-[0_0_18px_hsl(var(--primary)/0.35)]"
                        : "border-nobid bg-nobid/10 text-foreground"
                      : "border-border bg-background text-foreground hover:border-primary/50"
                  )}
                >
                  {o.label}
                  {chosen && (right ? <CheckCircle2 className="h-4 w-4 text-primary" aria-hidden="true" /> : <XCircle className="h-4 w-4 text-nobid" aria-hidden="true" />)}
                </button>
              );
            })}
          </div>
          <p className="mt-2 min-h-[1.25rem] text-sm" aria-live="polite">
            {answer && (met ? <span className="text-primary">Yes — the exchange runs the auction between buyers and sellers.</span> : answer !== ANSWER_ID && <span className="text-nobid">Not that one. Look at the chain between DSP and SSP.</span>)}
          </p>
        </Panel>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label={mode === "open" ? "Reaches publisher" : "Reaches platform"} value={money(share)} tone="primary" sub="of each $1.00" />
        <Stat label="Kept in between" value={money(1 - share)} tone={feesOn ? "nobid" : "muted"} sub={feesOn ? "illustrative fees" : "fees off"} />
        <Stat label="Companies in chain" value={chain.length} sub={`${middleCount} between the ends`} />
        <Stat label="Open run, fees on" value={ranOpenWithFees ? "Done" : "Not yet"} tone={ranOpenWithFees ? "primary" : "muted"} sub="needed for the challenge" />
      </div>

      <ChallengeMet show={met}>You traced the dollar and named the ad exchange — the auction between DSP and SSP. Challenge complete!</ChallengeMet>
    </div>
  );
}

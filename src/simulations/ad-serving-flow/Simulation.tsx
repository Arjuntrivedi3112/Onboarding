import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Signal, Timer } from "lucide-react";

import { enumCodec, useShareableState } from "@/hooks/useShareableState";
import { cn } from "@/lib/utils";
import {
  CHAIN,
  ChallengeMet,
  Panel,
  PlaybackControls,
  SimStage,
  SimToggle,
  Stat,
  money,
  stepAt,
  stepStarts,
  useChallenge,
  useDescribe,
  usePlayback,
} from "@/simulations/kit";
import type { SimulationProps } from "@/simulations/types";
import {
  AUCTION_BEST,
  BUDGET_MS,
  DEFAULT_CONFIG,
  DIRECT_CAMPAIGN,
  MOBILE_RTT_MS,
  ORIGIN_PENALTY_MS,
  decide,
  serveSteps,
  totalMs,
  under200,
  type Component,
  type ServeConfig,
  type ServeStep,
} from "@/simulations/ad-serving-flow/logic";

/**
 * Serve an ad, step by step: the tag fires, the publisher's ad server and its
 * decision engine choose between a booked direct campaign and a programmatic
 * auction, the creative is fetched and rendered, and the impression pixel
 * fires — drawn as a network-style waterfall against a 200 ms budget. Step
 * times come from the ad-serving lessons; the 4G and origin-fetch penalties
 * are illustrative.
 */

const REAL_MS_PER_SIM_MS = 28;
const onOff = enumCodec(["on", "off"] as const);

const COMPONENT: Record<Component, { label: string; color: string }> = {
  browser: { label: "Browser", color: CHAIN.user },
  adserver: { label: "Publisher ad server", color: CHAIN.adserver },
  auction: { label: "SSP / exchange / DSPs", color: CHAIN.exchange },
  advertiser: { label: "Advertiser ad server", color: CHAIN.advertiser },
  cdn: { label: "CDN", color: "var(--primary)" },
};

type SlotState = "empty" | "waiting" | "auction" | "redirect" | "fetching" | "rendered" | "counted" | "nofill";

function slotState(steps: ServeStep[], starts: number[], t: number, served: boolean): SlotState {
  if (t <= 0) return "empty";
  const i = stepAt(steps, t);
  const id = steps[i].id;
  const end = starts[i] + steps[i].duration;
  if (!served && id === "select" && t >= end) return "nofill";
  if (id === "tag") return "empty";
  if (id === "auction") return "auction";
  if (id === "redirect") return "redirect";
  if (id === "fetch") return t - starts[i] > steps[i].duration * 0.55 ? "rendered" : "fetching";
  if (id === "track") return "counted";
  return "waiting";
}

function PhoneMock({ state, impressions }: { state: SlotState; impressions: number }) {
  const reduce = useReducedMotion();
  const busy = state === "waiting" || state === "auction" || state === "redirect" || state === "fetching";
  const waitingText: Record<string, string> = {
    waiting: "ad server deciding…",
    auction: "auction running…",
    redirect: "→ advertiser's server…",
    fetching: "fetching creative…",
  };
  return (
    <div className="mx-auto w-full max-w-[14rem]">
      <div className="relative overflow-hidden rounded-[2rem] border-[6px] border-border-strong bg-background shadow-[0_0_40px_hsl(var(--primary)/0.18)]">
        <div className="flex items-center justify-between px-4 pt-2 text-xs text-muted-foreground">
          <span className="figure">9:41</span>
          <span className="flex items-center gap-1">
            <Signal className="h-3 w-3" aria-hidden="true" />
            <span className="figure">4G</span>
          </span>
        </div>
        <div className="figure mx-3 mt-2 truncate rounded-md bg-secondary px-2 py-1 text-xs text-muted-foreground">news.example/match-report</div>
        <div className="space-y-2 p-3" aria-hidden="true">
          <div className="h-3 w-4/5 rounded bg-foreground/25" />
          {["w-full", "w-11/12", "w-3/4"].map((w, i) => (
            <div key={i} className={cn("h-1.5 rounded bg-muted-foreground/20", w)} />
          ))}
        </div>

        <div className="relative mx-3">
          <motion.div
            className="relative overflow-hidden rounded-md border border-dashed border-border-strong bg-secondary/60"
            initial={false}
            animate={{ height: state === "nofill" ? 6 : 52, opacity: state === "nofill" ? 0.4 : 1 }}
            transition={{ duration: reduce ? 0 : 0.3 }}
          >
            {busy && !reduce && (
              <motion.span
                className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-primary/25 to-transparent"
                initial={{ left: "-35%" }}
                animate={{ left: "105%" }}
                transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
              />
            )}
            <AnimatePresence>
              {(state === "rendered" || state === "counted") && (
                <motion.div
                  className="absolute inset-0 flex items-center justify-between px-2.5 text-primary-foreground"
                  style={{ background: `linear-gradient(120deg, hsl(${CHAIN.advertiser}), hsl(var(--primary)))` }}
                  initial={reduce ? false : { opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <span className="text-xs">Matchday kits −20%</span>
                  <span className="rounded bg-card/90 px-1.5 text-xs text-foreground">Shop</span>
                </motion.div>
              )}
            </AnimatePresence>
            {state !== "rendered" && state !== "counted" && state !== "nofill" && (
              <span className="figure absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">
                {busy ? waitingText[state] : "ad slot · 320×50"}
              </span>
            )}
          </motion.div>
          {state === "nofill" && <p className="mt-1 text-center text-xs text-nobid">no ad — slot collapsed</p>}
          <AnimatePresence>
            {state === "counted" && (
              <motion.span
                className="figure absolute -top-3 right-1 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground shadow-[0_0_18px_hsl(var(--primary)/0.7)]"
                initial={{ opacity: 0, y: 6, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0 }}
              >
                1×1 pixel ✓
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        <div className="space-y-2 p-3 pb-6" aria-hidden="true">
          {["w-full", "w-5/6", "w-full", "w-2/3", "w-11/12"].map((w, i) => (
            <div key={i} className={cn("h-1.5 rounded bg-muted-foreground/20", w)} />
          ))}
        </div>
      </div>
      <p className="mt-2 text-center text-xs text-muted-foreground">
        Impressions counted: <span className="figure text-foreground">{impressions}</span>
      </p>
    </div>
  );
}

/** A network-tab style waterfall of the serve against the 200 ms budget. */
function Waterfall({ steps, starts, t, onSeek, activeIndex }: { steps: ServeStep[]; starts: number[]; t: number; onSeek: (i: number) => void; activeIndex: number }) {
  const total = totalMs(steps);
  const scale = Math.max(total, BUDGET_MS) * 1.06;
  const budgetPct = (BUDGET_MS / scale) * 100;
  return (
    <div className="relative mt-5">
      <ol className="space-y-1" aria-label="Serve steps and their timing">
        <AnimatePresence initial={false}>
          {steps.map((s, i) => {
            const start = starts[i];
            const fill = Math.max(0, Math.min(1, (t - start) / s.duration));
            const active = i === activeIndex;
            const color = COMPONENT[s.component].color;
            return (
              <motion.li key={s.id} layout initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.25 }}>
                <button
                  type="button"
                  onClick={() => onSeek(i)}
                  aria-current={active ? "step" : undefined}
                  className={cn(
                    "block w-full rounded-md px-1.5 py-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    active ? "bg-primary/10" : "hover:bg-secondary/60"
                  )}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="flex min-w-0 items-center gap-1.5">
                      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: `hsl(${color})`, boxShadow: active ? `0 0 10px hsl(${color})` : undefined }} aria-hidden="true" />
                      <span className={cn("truncate text-sm", active ? "text-foreground" : "text-muted-foreground")}>{s.label}</span>
                    </span>
                    <span className="figure shrink-0 text-xs text-foreground">{s.duration} ms</span>
                  </span>
                  <span className="relative mt-1 block h-2.5 rounded bg-secondary/70" aria-hidden="true">
                    <span
                      className="absolute inset-y-0 overflow-hidden rounded"
                      style={{ left: `${(start / scale) * 100}%`, width: `${(s.duration / scale) * 100}%`, background: `hsl(${color} / 0.22)` }}
                    >
                      <span
                        className="absolute inset-y-0 left-0"
                        style={{
                          width: `${fill * 100}%`,
                          background: `hsl(${color})`,
                          boxShadow: active ? `0 0 14px hsl(${color} / 0.9)` : undefined,
                        }}
                      />
                      {s.network > 0 && (
                        <span
                          className="absolute inset-y-0 left-0 bg-[repeating-linear-gradient(135deg,hsl(var(--background)/0.55)_0_3px,transparent_3px_6px)]"
                          style={{ width: `${(s.network / s.duration) * 100}%` }}
                        />
                      )}
                    </span>
                  </span>
                </button>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ol>
      {/* Budget line across the bar track */}
      <div className="pointer-events-none absolute inset-x-1.5 bottom-0 top-0" aria-hidden="true">
        <span className="absolute -top-5 bottom-0 border-l-2 border-dashed border-floor" style={{ left: `${budgetPct}%` }}>
          <span className="figure absolute -left-6 -top-0.5 whitespace-nowrap rounded bg-card px-1 text-xs text-floor">200 ms</span>
        </span>
      </div>
    </div>
  );
}

export default function Simulation({ onChallengePassed, challengePassed, onDescribe }: SimulationProps) {
  const [auction, setAuction] = useShareableState<"on" | "off">("auction", "on", onOff);
  const [direct, setDirect] = useState(DEFAULT_CONFIG.direct);
  const [redirect, setRedirect] = useState(DEFAULT_CONFIG.redirect);
  const [cdnCache, setCdnCache] = useState(DEFAULT_CONFIG.cdnCache);
  const config: ServeConfig = useMemo(() => ({ direct, programmatic: auction === "on", redirect, cdnCache }), [direct, auction, redirect, cdnCache]);

  const steps = useMemo(() => serveSteps(config), [config]);
  const starts = useMemo(() => stepStarts(steps), [steps]);
  const total = totalMs(steps);
  const winner = decide(config);
  const served = winner !== null;
  const network = steps.reduce((s, x) => s + x.network, 0);

  const playback = usePlayback(total, { realMsPerSimMs: REAL_MS_PER_SIM_MS });
  const { reset } = playback;
  // A run only counts for the configuration it was played with.
  useEffect(() => {
    reset();
  }, [config, reset]);

  const [impressions, setImpressions] = useState(0);
  const wasDone = useRef(false);
  useEffect(() => {
    if (playback.done && !wasDone.current && served) setImpressions((n) => n + 1);
    wasDone.current = playback.done;
  }, [playback.done, served]);

  const started = playback.t > 0;
  const index = stepAt(steps, playback.t);
  const step = steps[index];
  const state = slotState(steps, starts, playback.t, served);
  const over = total >= BUDGET_MS;

  const met = playback.done && under200(config);
  useChallenge(met, onChallengePassed, challengePassed);

  useDescribe(
    onDescribe,
    `Ad serve on a mobile article page over 4G. Direct campaigns ${direct ? "on" : "off"}, programmatic auction ${auction}, third-party redirect ${redirect ? "on" : "off"}, CDN-cached creative ${
      cdnCache ? "on" : "off"
    }. Steps: ${steps.map((s) => `${s.label} ${s.duration} ms`).join("; ")}. Total ${total} ms (${over ? "over" : "under"} the 200 ms budget). ${
      winner === "programmatic" ? `The auction wins at ${money(AUCTION_BEST.cpm)} CPM.` : winner === "direct" ? `The direct campaign wins at ${money(DIRECT_CAMPAIGN.cpm)} CPM.` : "No eligible demand, so no ad is served."
    } Playback at ${Math.round(playback.t)} ms${started ? `, on "${step.label}"` : ""}.`
  );

  const toggles: Array<{ label: string; hint: string; checked: boolean; onChange: (v: boolean) => void }> = [
    { label: "Direct campaigns", hint: `${DIRECT_CAMPAIGN.name}, ${money(DIRECT_CAMPAIGN.cpm)} CPM`, checked: direct, onChange: setDirect },
    { label: "Programmatic auction joins in", hint: `+50 ms server-to-server · best bid ${money(AUCTION_BEST.cpm)} CPM`, checked: auction === "on", onChange: (v) => setAuction(v ? "on" : "off") },
  ];
  const delivery: typeof toggles = [
    { label: "Third-party ad server redirect", hint: `+25 ms, plus a ${MOBILE_RTT_MS} ms 4G round trip`, checked: redirect, onChange: setRedirect },
    { label: "CDN-cached creative", hint: `Off: fetched from origin, +${ORIGIN_PENALTY_MS} ms (illustrative)`, checked: cdnCache, onChange: setCdnCache },
  ];

  return (
    <div className="space-y-4">
      <SimStage label="Ad serving sequence">
        <PlaybackControls
          playback={playback}
          onStep={() => playback.seek(index + 1 < steps.length ? starts[index + 1] + 0.001 : total)}
          clock={
            <span className="flex items-center gap-1.5">
              <Timer className="h-4 w-4" aria-hidden="true" />
              <span className={cn("text-lg", playback.done ? (over ? "text-nobid" : "text-primary") : "text-foreground")}>{Math.round(playback.t)}</span> / {total} ms
            </span>
          }
        />

        <div className="mt-5 grid gap-6 md:grid-cols-[minmax(0,14rem)_minmax(0,1fr)]">
          <PhoneMock state={state} impressions={impressions} />

          <div className="min-w-0 space-y-4">
            <Waterfall steps={steps} starts={starts} t={playback.t} activeIndex={started && !playback.done ? index : -1} onSeek={(i) => playback.seek(starts[i] + steps[i].duration * 0.6)} />

            <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
              {(Object.keys(COMPONENT) as Component[])
                .filter((c) => steps.some((s) => s.component === c))
                .map((c) => (
                  <span key={c} className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full" style={{ background: `hsl(${COMPONENT[c].color})` }} aria-hidden="true" />
                    {COMPONENT[c].label}
                  </span>
                ))}
              <span className="flex items-center gap-1">
                <span className="h-2 w-3 rounded-sm bg-[repeating-linear-gradient(135deg,hsl(var(--muted-foreground)/0.6)_0_2px,transparent_2px_4px)]" aria-hidden="true" />
                4G round trip
              </span>
            </div>

            {/* The decision engine's choice */}
            <div className={cn("rounded-xl border p-3 transition-shadow", ["match", "auction", "select"].includes(step.id) && started ? "border-primary/50 shadow-[0_0_24px_hsl(var(--primary)/0.25)]" : "border-border")}>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Decision engine</p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {[
                  { id: "direct", on: direct, name: "Direct campaign", cpm: DIRECT_CAMPAIGN.cpm, color: CHAIN.advertiser },
                  { id: "programmatic", on: auction === "on", name: "Programmatic", cpm: AUCTION_BEST.cpm, color: CHAIN.exchange },
                ].map((d) => {
                  const wins = winner === d.id;
                  return (
                    <div
                      key={d.id}
                      className={cn("rounded-lg border px-2.5 py-2", !d.on && "opacity-40", wins ? "border-primary bg-primary/10" : "border-border bg-background/70")}
                      style={wins ? { boxShadow: `0 0 18px hsl(${d.color} / 0.45)` } : undefined}
                    >
                      <p className="text-sm text-foreground">{d.name}</p>
                      <p className="figure text-xs text-muted-foreground">{d.on ? `${money(d.cpm)} CPM` : "switched off"}</p>
                      {wins && <p className="mt-0.5 text-xs text-primary">wins</p>}
                    </div>
                  );
                })}
              </div>
              {!served && <p className="mt-2 text-xs text-nobid">No eligible demand — nothing to serve.</p>}
            </div>
          </div>
        </div>

        <p className="mt-4 min-h-[3rem] text-sm text-foreground" aria-live="polite">
          {started && (
            <span className="figure text-primary">
              {starts[index]}–{starts[index] + step.duration} ms ·{" "}
            </span>
          )}
          {!started
            ? `Press Play to fire the ad tag. This configuration takes ${total} ms — ${over ? "over" : "under"} the 200 ms budget.`
            : playback.done
              ? served
                ? `Done in ${total} ms — ${over ? `${total - BUDGET_MS} ms over budget. Which hops can this placement do without?` : "inside the 200 ms budget."}`
                : `The sequence ended in ${total} ms without an ad: fast, but the slot is empty and nothing was earned.`
              : step.detail}
        </p>
      </SimStage>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Demand: who can fill the slot">
          <div className="space-y-4">
            {toggles.map((x) => (
              <SimToggle key={x.label} label={x.label} hint={x.hint} checked={x.checked} onChange={x.onChange} />
            ))}
          </div>
        </Panel>
        <Panel title="Delivery: how the creative arrives">
          <div className="space-y-4">
            {delivery.map((x) => (
              <SimToggle key={x.label} label={x.label} hint={x.hint} checked={x.checked} onChange={x.onChange} />
            ))}
          </div>
          <p className="mt-4 border-t border-border pt-3 text-xs text-muted-foreground">
            Scenario: a mobile article page with the visitor on 4G. Every browser round trip adds {MOBILE_RTT_MS} ms (illustrative). Base step times come from the ad-serving lessons.
          </p>
        </Panel>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Serve time" value={`${total} ms`} tone={over ? "nobid" : "primary"} sub={over ? `${total - BUDGET_MS} ms over budget` : `${BUDGET_MS - total} ms to spare`} />
        <Stat label="Ad served" value={served ? "Yes" : "No fill"} tone={served ? "primary" : "nobid"} sub={served ? "impression counted" : "slot collapses"} />
        <Stat
          label="Winner"
          value={winner === "programmatic" ? "Auction" : winner === "direct" ? "Direct" : "—"}
          sub={winner === "programmatic" ? `${money(AUCTION_BEST.cpm)} CPM` : winner === "direct" ? `${money(DIRECT_CAMPAIGN.cpm)} CPM` : "no demand"}
        />
        <Stat label="4G round trips" value={`${network} ms`} tone="floor" sub={`${network / MOBILE_RTT_MS} trips × ${MOBILE_RTT_MS} ms`} />
      </div>

      <ChallengeMet show={met}>Served in {total} ms — under 200 ms with an ad in the slot. Challenge complete!</ChallengeMet>
      {under200(config) && !playback.done && (
        <p className="text-sm text-muted-foreground">This setup fits the budget — play it through to the impression to confirm.</p>
      )}
    </div>
  );
}

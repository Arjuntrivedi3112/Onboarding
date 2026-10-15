import { useMemo } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Gavel, Globe, Monitor, Server, Store, User } from "lucide-react";

import { DEFAULT_BIDS } from "@/components/lessons/mediabuying/_shared";
import { enumCodec, numberCodec, useShareableState } from "@/hooks/useShareableState";
import { cn } from "@/lib/utils";
import {
  ChallengeMet,
  FlowNode,
  Panel,
  PlaybackControls,
  Segmented,
  SimSlider,
  SimStage,
  Stat,
  money,
  stepAt,
  stepStarts,
  useChallenge,
  useDescribe,
  usePlayback,
} from "@/simulations/kit";
import type { SimulationProps } from "@/simulations/types";
import { betaWinsCheaply, runAuction, type AuctionType } from "@/simulations/rtb-auction/logic";

/**
 * The 100 ms real-time bidding auction, rebuilt from the original RTB module
 * with live controls: three DSP bids, a floor price and the auction type.
 * Bids reuse the media-buying lessons' numbers so learners recognise them.
 */

const STEPS = [
  { id: "load", label: "Page loads, ad slot found", duration: 10, detail: "The browser renders the page and finds an empty ad slot. The publisher's tag wakes up." },
  { id: "request", label: "SSP sends the bid request", duration: 10, detail: "The publisher's SSP packages what it knows — page, slot size, device, location — into an OpenRTB bid request." },
  { id: "fanout", label: "Exchange fans out to DSPs", duration: 10, detail: "The exchange forwards the request to every DSP that might want this impression, all at once." },
  { id: "bid", label: "DSPs evaluate and bid", duration: 30, detail: "Each DSP checks its campaigns, scores the user and returns a price — or no bid — before the deadline." },
  { id: "auction", label: "Auction runs against the floor", duration: 10, detail: "The exchange discards bids under the publisher's floor and picks the highest of the rest." },
  { id: "win", label: "Winner pays the clearing price", duration: 10, detail: "The winning DSP is notified with the price it will pay. In second-price, that's just above the runner-up." },
  { id: "serve", label: "Creative served, impression counted", duration: 20, detail: "The winner's ad markup goes back to the page, the creative renders, and the impression pixel fires." },
];
const TOTAL = STEPS.reduce((a, s) => a + s.duration, 0);
const STARTS = stepStarts(STEPS);
const AUCTION_AT = STARTS[4];

const DSPS = DEFAULT_BIDS.map((b) => ({ id: b.id, name: b.dsp }));

const bidCodec = numberCodec(0.5, 6);

/* Approximate centres (percent of the diagram box) for the wire overlay. */
const SSP_AT = { x: 22, y: 83 };
const EXCHANGE_AT = { x: 50, y: 50 };
const DSP_AT = [
  { x: 72, y: 16 },
  { x: 72, y: 50 },
  { x: 72, y: 84 },
];

/**
 * Wires between SSP, exchange and DSPs, with packets travelling the right
 * way for the current phase: requests out, bids back, the win notice to the
 * winner only. Drawn behind the nodes.
 */
function Wires({ phase, winnerIndex }: { phase: string; winnerIndex: number }) {
  const reduce = useReducedMotion();
  const lit = phase !== "idle";
  const packets: Array<{ from: { x: number; y: number }; to: { x: number; y: number }; tone: string; key: string }> = [];
  if (phase === "request") packets.push({ from: SSP_AT, to: EXCHANGE_AT, tone: "var(--chain-ssp)", key: "req" });
  if (phase === "fanout") DSP_AT.forEach((d, i) => packets.push({ from: EXCHANGE_AT, to: d, tone: "var(--primary)", key: `out${i}` }));
  if (phase === "bid") DSP_AT.forEach((d, i) => packets.push({ from: d, to: EXCHANGE_AT, tone: "var(--chain-dsp)", key: `bid${i}` }));
  if (phase === "win" && winnerIndex >= 0) packets.push({ from: EXCHANGE_AT, to: DSP_AT[winnerIndex], tone: "var(--primary)", key: "win" });
  if (phase === "serve") packets.push({ from: EXCHANGE_AT, to: SSP_AT, tone: "var(--primary)", key: "ad" });

  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        {[SSP_AT, ...DSP_AT].map((p, i) => (
          <line
            key={i}
            x1={EXCHANGE_AT.x}
            y1={EXCHANGE_AT.y}
            x2={p.x}
            y2={p.y}
            stroke={lit ? "hsl(var(--primary))" : "hsl(var(--border-strong, var(--border)))"}
            strokeOpacity={lit ? 0.45 : 0.8}
            strokeWidth={2}
            strokeDasharray="6 6"
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>
      {!reduce &&
        packets.map((p, i) => (
          <motion.span
            key={`${phase}-${p.key}`}
            className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{ background: `hsl(${p.tone})`, boxShadow: `0 0 12px hsl(${p.tone} / 0.9)` }}
            initial={{ left: `${p.from.x}%`, top: `${p.from.y}%`, opacity: 0 }}
            animate={{ left: [`${p.from.x}%`, `${p.to.x}%`], top: [`${p.from.y}%`, `${p.to.y}%`], opacity: [0, 1, 1, 0] }}
            transition={{ duration: 0.9, delay: i * 0.08, repeat: Infinity, ease: "easeInOut" }}
          />
        ))}
    </div>
  );
}

export default function Simulation({ onChallengePassed, challengePassed, onDescribe }: SimulationProps) {
  const reduce = useReducedMotion();
  const playback = usePlayback(TOTAL, { realMsPerSimMs: 60 });
  const [type, setType] = useShareableState<AuctionType>("type", "second", enumCodec(["second", "first"] as const));
  const [floor, setFloor] = useShareableState("floor", 1.5, numberCodec(0, 6));
  const [alpha, setAlpha] = useShareableState("alpha", DEFAULT_BIDS[0].amount, bidCodec);
  const [beta, setBeta] = useShareableState("beta", DEFAULT_BIDS[1].amount, bidCodec);
  const [gamma, setGamma] = useShareableState("gamma", DEFAULT_BIDS[2].amount, bidCodec);

  const bids = useMemo(() => ({ alpha, beta, gamma }), [alpha, beta, gamma]);
  const setters: Record<string, (v: number) => void> = { alpha: setAlpha, beta: setBeta, gamma: setGamma };
  const outcome = useMemo(() => runAuction(bids, floor, type), [bids, floor, type]);

  const step = stepAt(STEPS, playback.t);
  const resolved = playback.t >= AUCTION_AT;
  const showBids = playback.t >= STARTS[3] + 8;
  const nameOf = (id: string | null) => DSPS.find((d) => d.id === id)?.name ?? "No one";

  const met = resolved && betaWinsCheaply(outcome);
  useChallenge(met, onChallengePassed, challengePassed);

  useDescribe(
    onDescribe,
    `${type === "second" ? "Second" : "First"}-price auction, floor ${money(floor)}. Bids: Alpha ${money(alpha)}, Beta ${money(beta)}, Gamma ${money(
      gamma
    )}. ${outcome.winner ? `${nameOf(outcome.winner)} wins and pays ${money(outcome.price ?? 0)} CPM.` : "Every bid is under the floor, so the impression goes unsold."} The timeline is at ${Math.round(
      playback.t
    )} ms, on "${STEPS[step].label}".`
  );

  const phase = STEPS[step].id;
  const active = (ids: string[]) => playback.t > 0 && ids.includes(phase);

  return (
    <div className="space-y-4">
      <SimStage label="Real-time bidding auction">
        <PlaybackControls
          playback={playback}
          onStep={() => playback.seek(step + 1 < STEPS.length ? STARTS[step + 1] : TOTAL)}
          clock={
            <span>
              <span className={cn("text-lg", playback.done ? "text-primary" : "text-foreground")}>{Math.round(playback.t)}</span> / {TOTAL} ms
            </span>
          }
        />

        {/* The chain */}
        <div className="relative mt-6 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1.2fr)] items-center gap-2 sm:gap-6">
          <Wires phase={playback.t > 0 && !playback.done ? phase : playback.done ? "done" : "idle"} winnerIndex={DSPS.findIndex((d) => d.id === outcome.winner)} />
          <div className="flex flex-col items-center gap-3">
            <FlowNode label="User" sublabel="browser" role="user" icon={<User className="h-5 w-5" />} active={active(["load", "serve"])} />
            <FlowNode label="Publisher" sublabel="news site" role="publisher" icon={<Globe className="h-5 w-5" />} active={active(["load", "request"])} />
            <FlowNode label="SSP" role="ssp" icon={<Store className="h-5 w-5" />} active={active(["request"])} />
          </div>

          <div className="flex flex-col items-center gap-2">
            <FlowNode
              label="Exchange"
              sublabel={resolved ? (outcome.winner ? `cleared ${money(outcome.price ?? 0)}` : "unsold") : `floor ${money(floor)}`}
              role="exchange"
              icon={<Gavel className="h-5 w-5" />}
              active={active(["fanout", "auction", "win"])}
              className="min-w-0 sm:min-w-[8rem]"
            />
            <AnimatePresence>
              {phase === "fanout" && !reduce && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  className="figure rounded-full bg-primary/15 px-2 py-0.5 text-xs text-primary"
                >
                  bid request →
                </motion.span>
              )}
            </AnimatePresence>
          </div>

          <ul className="flex flex-col gap-3">
            {DSPS.map((dsp) => {
              const amount = bids[dsp.id as keyof typeof bids];
              const below = amount < floor;
              const isWinner = resolved && outcome.winner === dsp.id;
              return (
                <li key={dsp.id} className="flex items-center gap-2">
                  <FlowNode
                    label={dsp.name}
                    role="dsp"
                    icon={<Server className="hidden h-5 w-5 sm:block" />}
                    active={active(["fanout", "bid"]) || (isWinner && active(["win", "serve"]))}
                    dimmed={resolved && !isWinner}
                    className={cn("min-w-0 flex-1", isWinner && "ring-2 ring-primary ring-offset-2 ring-offset-card")}
                  />
                  <AnimatePresence>
                    {showBids && (
                      <motion.span
                        initial={{ opacity: 0, scale: 0.6, x: -8 }}
                        animate={{ opacity: 1, scale: 1, x: 0 }}
                        exit={{ opacity: 0 }}
                        className={cn(
                          "figure w-12 shrink-0 rounded-md border px-1 py-1 text-center text-xs sm:w-16 sm:px-1.5 sm:text-sm",
                          below
                            ? "border-nobid/40 text-nobid line-through"
                            : isWinner
                              ? "border-primary bg-primary text-primary-foreground shadow-[0_0_18px_hsl(var(--primary)/0.5)]"
                              : "border-border text-foreground"
                        )}
                      >
                        {money(amount)}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </li>
              );
            })}
          </ul>

        </div>

        {/* Timeline */}
        <ol className="mt-8 grid grid-cols-7 gap-1" aria-label="Auction timeline">
          {STEPS.map((s, i) => {
            const done = playback.t >= STARTS[i] + s.duration;
            const current = i === step && playback.t > 0 && !playback.done;
            return (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => playback.seek(STARTS[i] + s.duration / 2)}
                  aria-current={current ? "step" : undefined}
                  className="group block w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span className="block h-2 overflow-hidden rounded-full bg-secondary">
                    <motion.span
                      className="block h-full bg-primary"
                      initial={false}
                      animate={{ width: done ? "100%" : current ? `${((playback.t - STARTS[i]) / s.duration) * 100}%` : "0%" }}
                      transition={{ duration: 0.05 }}
                    />
                  </span>
                  <span className={cn("mt-1.5 hidden text-xs leading-tight sm:block", current ? "text-foreground" : "text-muted-foreground")}>
                    {s.label}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
        <p className="mt-3 min-h-[3rem] text-sm text-foreground" aria-live="polite">
          <span className="figure text-primary">{STARTS[step]}–{STARTS[step] + STEPS[step].duration} ms · </span>
          {playback.t === 0 ? "Press Play to send the bid request." : STEPS[step].detail}
        </p>
      </SimStage>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Auction rules">
          <div className="space-y-4">
            <div>
              <p className="mb-2 text-sm text-foreground">Auction type</p>
              <Segmented
                label="Auction type"
                value={type}
                onChange={setType}
                options={[
                  { value: "second", label: "Second-price" },
                  { value: "first", label: "First-price" },
                ]}
              />
            </div>
            <SimSlider label="Publisher floor price" value={floor} min={0} max={6} step={0.1} onChange={setFloor} format={(v) => `${money(v)} CPM`} />
          </div>
        </Panel>

        <Panel title="DSP bids (CPM)">
          <div className="space-y-4">
            {DSPS.map((dsp) => (
              <SimSlider
                key={dsp.id}
                label={dsp.name}
                value={bids[dsp.id as keyof typeof bids]}
                min={0.5}
                max={6}
                step={0.05}
                onChange={setters[dsp.id]}
                format={money}
              />
            ))}
          </div>
        </Panel>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Winner" value={resolved ? nameOf(outcome.winner) : "—"} tone={resolved && outcome.winner ? "primary" : "muted"} />
        <Stat
          label="Clearing price"
          value={resolved && outcome.price !== null ? money(outcome.price) : "—"}
          sub={type === "second" ? "runner-up + $0.01" : "winner's own bid"}
        />
        <Stat
          label="Winner saved"
          value={resolved && outcome.winner && outcome.price !== null ? money(bids[outcome.winner as keyof typeof bids] - outcome.price) : "—"}
          sub="bid minus price paid"
        />
        <Stat
          label="Bids over floor"
          value={`${outcome.eligible.length} of 3`}
          tone={outcome.eligible.length === 0 ? "nobid" : outcome.eligible.length < 3 ? "floor" : "muted"}
        />
      </div>

      <ChallengeMet show={met}>DSP Beta won for {money(outcome.price ?? 0)} — under $3.50. Challenge complete!</ChallengeMet>
      {!resolved && playback.t === 0 && (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Monitor className="h-4 w-4" aria-hidden="true" />
          Results appear once the auction step runs. Change the controls any time and replay.
        </p>
      )}
    </div>
  );
}

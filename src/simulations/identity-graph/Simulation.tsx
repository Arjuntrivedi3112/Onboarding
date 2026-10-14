import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Ban, Cookie, Fingerprint, KeyRound, Laptop, MapPin, Plus, Smartphone, Tv, Wifi, X, type LucideIcon } from "lucide-react";

import { useShareableState } from "@/hooks/useShareableState";
import { cn } from "@/lib/utils";
import { ChallengeMet, Meter, Panel, SimStage, SimToggle, Stat, pct, useChallenge, useDescribe } from "@/simulations/kit";
import type { SimulationProps } from "@/simulations/types";
import { CountUp } from "@/simulations/identity-graph/CountUp";
import {
  DEVICES,
  PAIRS,
  SIGNALS,
  SIGNAL_IDS,
  blockedReason,
  buildGraph,
  matchingMode,
  oneProfileWithoutCookies,
  signalById,
  type Conditions,
  type DeviceId,
  type PairId,
  type Signal,
  type SignalId,
} from "@/simulations/identity-graph/logic";

/**
 * "Build an identity graph", rebuilt from the original identity module's
 * identifier picker and matching modes. Identifiers are buttons on the graph
 * itself; links snap in solid (deterministic) or dashed (probabilistic), and
 * the two privacy switches break exactly the links that depend on them.
 */

const DEVICE_ICON: Record<DeviceId, LucideIcon> = { laptop: Laptop, phone: Smartphone, tv: Tv };
const SIGNAL_ICON: Record<SignalId, LucideIcon> = {
  email: KeyRound,
  thirdParty: Cookie,
  firstParty: Cookie,
  maid: Smartphone,
  ip: Wifi,
  location: MapPin,
  userAgent: Fingerprint,
};

/** Positions on the graph, in percent of its box. */
const DEVICE_AT: Record<DeviceId, { x: number; y: number }> = {
  laptop: { x: 50, y: 30 },
  phone: { x: 18, y: 72 },
  tv: { x: 82, y: 72 },
};
const SIGNAL_AT: Record<SignalId, { x: number; y: number }> = {
  email: { x: 50, y: 6 },
  thirdParty: { x: 15, y: 20 },
  firstParty: { x: 85, y: 20 },
  ip: { x: 12, y: 45 },
  location: { x: 88, y: 45 },
  userAgent: { x: 33, y: 93 },
  maid: { x: 67, y: 93 },
};
const HUB = { x: 50, y: 58 };

const KIND_COLOR: Record<Signal["kind"], string> = {
  deterministic: "var(--primary)",
  probabilistic: "var(--floor)",
  anchor: "var(--muted-foreground)",
};
const KIND_LABEL: Record<Signal["kind"], string> = {
  deterministic: "Deterministic",
  probabilistic: "Probabilistic",
  anchor: "Persistent ID",
};

const signalsCodec = {
  serialize: (v: SignalId[]) => (v.length ? v.join(",") : "none"),
  deserialize: (raw: string): SignalId[] | null =>
    raw === "none" ? [] : raw.split(",").filter((id): id is SignalId => (SIGNAL_IDS as string[]).includes(id)),
};
const boolCodec = {
  serialize: (v: boolean) => (v ? "1" : "0"),
  deserialize: (raw: string) => (raw === "1" ? true : raw === "0" ? false : null),
};
const DEFAULT_SIGNALS: SignalId[] = ["thirdParty", "ip"];

const mid = (a: { x: number; y: number }, b: { x: number; y: number }) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });

/* -------------------------------------------------------------------------- */
/* Graph                                                                      */
/* -------------------------------------------------------------------------- */

function Graph({
  added,
  conditions,
  broken,
  onToggle,
}: {
  added: SignalId[];
  conditions: Conditions;
  broken: PairId[];
  onToggle: (id: SignalId) => void;
}) {
  const reduce = useReducedMotion();
  const g = useMemo(() => buildGraph(added, conditions), [added, conditions]);
  const inProfile = (d: DeviceId) => g.profileDevices.includes(d);
  const strong = g.profileDevices.length === 3 && g.confidence >= 0.8;

  return (
    <div className="relative h-[25rem] sm:h-[27rem]">
      {/* Lines */}
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        {/* identifier → device attachments */}
        {SIGNALS.filter((s) => added.includes(s.id)).flatMap((s) => {
          const blocked = !!blockedReason(s, conditions);
          return s.seenOn.map((d) => (
            <line
              key={`${s.id}-${d}`}
              x1={SIGNAL_AT[s.id].x}
              y1={SIGNAL_AT[s.id].y}
              x2={DEVICE_AT[d].x}
              y2={DEVICE_AT[d].y}
              stroke={blocked ? "hsl(var(--nobid))" : `hsl(${KIND_COLOR[s.kind]})`}
              strokeOpacity={blocked ? 0.35 : 0.3}
              strokeWidth={1}
              strokeDasharray={blocked ? "2 4" : undefined}
              vectorEffect="non-scaling-stroke"
            />
          ));
        })}
        {/* device ↔ device links */}
        {g.links.map((l) => {
          const a = DEVICE_AT[l.a];
          const b = DEVICE_AT[l.b];
          const det = l.kind === "deterministic";
          const color = det ? "var(--primary)" : "var(--floor)";
          return (
            <motion.line
              key={`${l.pair}-${l.kind}`}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke={`hsl(${color})`}
              strokeWidth={1.5 + l.confidence * 3}
              strokeDasharray={det ? undefined : "7 5"}
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
              style={{ filter: `drop-shadow(0 0 4px hsl(${color} / 0.6))` }}
              initial={reduce ? false : { opacity: 0 }}
              animate={{ opacity: 0.35 + l.confidence * 0.65 }}
              transition={{ duration: 0.5 }}
            />
          );
        })}
        {/* recently broken links */}
        {broken.map((p) => {
          const pair = PAIRS.find((x) => x.id === p)!;
          const a = DEVICE_AT[pair.a];
          const b = DEVICE_AT[pair.b];
          return (
            <motion.line
              key={`broken-${p}`}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke="hsl(var(--nobid))"
              strokeWidth={2}
              strokeDasharray="3 6"
              vectorEffect="non-scaling-stroke"
              initial={{ opacity: 0.9 }}
              animate={{ opacity: 0 }}
              transition={{ duration: 1.6, ease: "easeIn" }}
            />
          );
        })}
      </svg>

      {/* Packets travelling along live links */}
      {!reduce &&
        g.links.map((l, i) => {
          const a = DEVICE_AT[l.a];
          const b = DEVICE_AT[l.b];
          const color = l.kind === "deterministic" ? "var(--primary)" : "var(--floor)";
          return (
            <motion.span
              key={`pkt-${l.pair}-${l.kind}`}
              className="pointer-events-none absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{ background: `hsl(${color})`, boxShadow: `0 0 12px hsl(${color} / 0.9)` }}
              initial={{ left: `${a.x}%`, top: `${a.y}%`, opacity: 0 }}
              animate={{ left: [`${a.x}%`, `${b.x}%`, `${a.x}%`], top: [`${a.y}%`, `${b.y}%`, `${a.y}%`], opacity: [0, 1, 1, 0] }}
              transition={{ duration: 3.2, delay: i * 0.5, repeat: Infinity, ease: "easeInOut" }}
              aria-hidden="true"
            />
          );
        })}

      {/* Link confidence pills */}
      <AnimatePresence>
        {g.links.map((l) => {
          const m = mid(DEVICE_AT[l.a], DEVICE_AT[l.b]);
          const det = l.kind === "deterministic";
          return (
            <motion.span
              key={`pill-${l.pair}`}
              className={cn(
                "figure pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full border bg-card px-1.5 py-0.5 text-xs",
                det ? "border-primary/60 text-primary" : "border-floor/60 text-floor"
              )}
              style={{ left: `${m.x}%`, top: `${m.y}%` }}
              initial={reduce ? false : { opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={reduce ? undefined : { opacity: 0, scale: 0.6 }}
            >
              {Math.round(l.confidence * 100)}%
            </motion.span>
          );
        })}
        {broken.map((p) => {
          const pair = PAIRS.find((x) => x.id === p)!;
          const m = mid(DEVICE_AT[pair.a], DEVICE_AT[pair.b]);
          return (
            <motion.span
              key={`x-${p}`}
              className="pointer-events-none absolute flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-nobid bg-card text-nobid shadow-[0_0_16px_hsl(var(--nobid)/0.5)]"
              style={{ left: `${m.x}%`, top: `${m.y}%` }}
              initial={{ opacity: 0, scale: 1.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              aria-hidden="true"
            >
              <X className="h-3.5 w-3.5" />
            </motion.span>
          );
        })}
      </AnimatePresence>

      {/* Profile hub */}
      <div className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${HUB.x}%`, top: `${HUB.y}%` }}>
        <motion.div
          className="relative flex h-[3.75rem] w-[3.75rem] items-center justify-center rounded-full sm:h-[4.5rem] sm:w-[4.5rem]"
          style={{
            background: `conic-gradient(hsl(var(--primary)) ${g.confidence * 360}deg, hsl(var(--secondary)) 0deg)`,
            boxShadow: strong ? "0 0 0 4px hsl(var(--primary) / 0.15), 0 0 32px hsl(var(--primary) / 0.5)" : undefined,
          }}
          animate={strong && !reduce ? { scale: [1, 1.06, 1] } : { scale: 1 }}
          transition={strong && !reduce ? { duration: 1.6, repeat: Infinity, ease: "easeInOut" } : { duration: 0.2 }}
          aria-hidden="true"
        >
          <div className="flex h-[3rem] w-[3rem] flex-col items-center justify-center rounded-full bg-card sm:h-[3.6rem] sm:w-[3.6rem]">
            <span className="figure text-sm text-foreground">
              <CountUp value={g.confidence * 100} format={(v) => `${Math.round(v)}%`} />
            </span>
            <span className="hidden text-xs text-muted-foreground sm:block">profile</span>
          </div>
        </motion.div>
      </div>

      {/* Devices */}
      {DEVICES.map((d) => {
        const Icon = DEVICE_ICON[d.id];
        const on = inProfile(d.id);
        const anchored = g.anchored[d.id];
        return (
          <div key={d.id} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${DEVICE_AT[d.id].x}%`, top: `${DEVICE_AT[d.id].y}%` }}>
            <motion.div
              className={cn(
                "flex w-[5.5rem] flex-col items-center gap-0.5 rounded-xl border-2 bg-card px-2 py-1.5 text-center sm:w-28",
                !anchored && "border-dashed opacity-60"
              )}
              style={{
                borderColor: on ? "hsl(var(--chain-user))" : "hsl(var(--border))",
                boxShadow: on ? "0 0 0 3px hsl(var(--chain-user) / 0.15), 0 0 24px hsl(var(--chain-user) / 0.4)" : undefined,
              }}
              animate={on && !reduce ? { y: [0, -3, 0] } : { y: 0 }}
              transition={on && !reduce ? { duration: 2.4, repeat: Infinity, ease: "easeInOut" } : { duration: 0.2 }}
            >
              <Icon className="h-5 w-5" style={{ color: on ? "hsl(var(--chain-user))" : "hsl(var(--muted-foreground))" }} aria-hidden="true" />
              <span className="text-sm leading-tight text-foreground">{d.label}</span>
              <span className={cn("text-xs leading-tight", anchored ? "text-muted-foreground" : "text-nobid")}>{anchored ? (on ? "linked" : "not linked") : "no ID"}</span>
            </motion.div>
          </div>
        );
      })}

      {/* Identifier buttons */}
      {SIGNALS.map((s) => {
        const Icon = SIGNAL_ICON[s.id];
        const on = added.includes(s.id);
        const reason = on ? blockedReason(s, conditions) : null;
        const color = KIND_COLOR[s.kind];
        return (
          <div key={s.id} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${SIGNAL_AT[s.id].x}%`, top: `${SIGNAL_AT[s.id].y}%` }}>
            <button
              type="button"
              aria-pressed={on}
              aria-label={`${s.label}${reason ? ` (blocked: ${reason})` : ""}`}
              onClick={() => onToggle(s.id)}
              className={cn(
                "interactive flex min-h-[2.25rem] items-center gap-1 whitespace-nowrap rounded-full border bg-card px-2 text-xs transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                !on && "border-dashed border-border-strong text-muted-foreground hover:border-primary/60 hover:text-foreground",
                on && !reason && "text-foreground",
                reason && "border-nobid/60 text-nobid line-through"
              )}
              style={on && !reason ? { borderColor: `hsl(${color})`, boxShadow: `0 0 14px hsl(${color} / 0.35)` } : undefined}
            >
              {reason ? (
                <Ban className="h-3.5 w-3.5" aria-hidden="true" />
              ) : on ? (
                <Icon className="h-3.5 w-3.5" style={{ color: `hsl(${color})` }} aria-hidden="true" />
              ) : (
                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              {s.short}
            </button>
          </div>
        );
      })}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Simulator                                                                  */
/* -------------------------------------------------------------------------- */

export default function Simulation({ onChallengePassed, challengePassed, onDescribe }: SimulationProps) {
  const [added, setAdded] = useShareableState<SignalId[]>("signals", DEFAULT_SIGNALS, signalsCodec);
  const [thirdPartyCookies, setThirdPartyCookies] = useShareableState("cookies", true, boolCodec);
  const [consent, setConsent] = useShareableState("consent", true, boolCodec);
  const [lastChange, setLastChange] = useState<string | null>(null);
  const [broken, setBroken] = useState<PairId[]>([]);
  const timer = useRef<number>();
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const conditions = useMemo<Conditions>(() => ({ thirdPartyCookies, consent }), [thirdPartyCookies, consent]);
  const g = useMemo(() => buildGraph(added, conditions), [added, conditions]);
  const mode = matchingMode(g);
  const unanchored = DEVICES.filter((d) => !g.anchored[d.id]).map((d) => d.label);
  const summary = `${
    g.profileDevices.length === 3 ? "All three devices are" : g.profileDevices.length === 2 ? "Two devices are" : "No devices are"
  } linked${g.profileDevices.length ? ` at ${pct(g.confidence * 100)} confidence` : ""}.${
    unanchored.length ? ` ${unanchored.join(" and ")} ${unanchored.length > 1 ? "have" : "has"} no persistent ID yet, so no signal can attach to ${unanchored.length > 1 ? "them" : "it"}.` : ""
  }`;

  /** Apply a change, narrate it, and flash any links it broke. */
  const apply = useCallback(
    (nextAdded: SignalId[], nextCond: Conditions, what: string) => {
      const before = buildGraph(added, conditions);
      const after = buildGraph(nextAdded, nextCond);
      const lost = before.links.filter((l) => !after.links.some((m) => m.pair === l.pair)).map((l) => l.pair);
      const formed = after.links.filter((l) => !before.links.some((m) => m.pair === l.pair));
      const label = (p: PairId) => p.replace("-", "–").replace("tv", "TV").replace("phone", "Phone").replace("laptop", "Laptop");
      const parts = [what];
      if (formed.length)
        parts.push(`New ${formed.map((l) => `${l.kind} ${label(l.pair)} link at ${pct(l.confidence * 100)}`).join(", ")}.`);
      if (lost.length) parts.push(`Broke the ${lost.map(label).join(" and ")} link${lost.length > 1 ? "s" : ""}.`);
      parts.push(
        after.profileDevices.length === 3
          ? `All three devices form one profile at ${pct(after.confidence * 100)} confidence.`
          : after.profileDevices.length === 2
            ? `Two devices linked at ${pct(after.confidence * 100)}.`
            : "No devices are linked."
      );
      setLastChange(parts.join(" "));
      if (lost.length) {
        setBroken(lost);
        window.clearTimeout(timer.current);
        timer.current = window.setTimeout(() => setBroken([]), 1700);
      }
    },
    [added, conditions]
  );

  const toggleSignal = (id: SignalId) => {
    const on = added.includes(id);
    const next = on ? added.filter((x) => x !== id) : SIGNAL_IDS.filter((x) => x === id || added.includes(x));
    const s = signalById(id);
    const reason = !on ? blockedReason(s, conditions) : null;
    apply(next, conditions, `${on ? "Removed" : "Added"} ${s.label[0].toLowerCase()}${s.label.slice(1)}${reason ? `, but it can't be used: ${reason.toLowerCase()}` : ""}.`);
    setAdded(next);
  };
  const setCookies = (v: boolean) => {
    apply(added, { ...conditions, thirdPartyCookies: v }, v ? "Third-party cookies are back." : "Third-party cookies switched off.");
    setThirdPartyCookies(v);
  };
  const setConsentOn = (v: boolean) => {
    apply(added, { ...conditions, consent: v }, v ? "The user gave consent." : "The user withdrew consent.");
    setConsent(v);
  };

  const met = oneProfileWithoutCookies(g, conditions);
  useChallenge(met, onChallengePassed, challengePassed);

  useDescribe(
    onDescribe,
    `Identity graph for one person's laptop, phone and connected TV. Third-party cookies ${thirdPartyCookies ? "available" : "blocked"}; user consent ${
      consent ? "given" : "not given"
    }. Identifiers added: ${added.length ? added.map((id) => signalById(id).label).join(", ") : "none"}${
      g.blocked.length ? ` (blocked: ${g.blocked.map((b) => `${signalById(b.id).label} — ${b.reason}`).join("; ")})` : ""
    }. Links: ${g.links.length ? g.links.map((l) => `${l.pair} ${l.kind} ${Math.round(l.confidence * 100)}%`).join(", ") : "none"}. Profile: ${
      g.profileDevices.length
    } of 3 devices at ${Math.round(g.confidence * 100)}% confidence (${mode === "none" ? "no matching" : `${mode} matching`}).`
  );

  return (
    <div className="space-y-4">
      <SimStage label="Identity graph">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>Tap an identifier to add or remove it.</span>
          <span className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-0.5 w-5 rounded bg-primary" aria-hidden="true" /> deterministic
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-0 w-5 border-t-2 border-dashed border-floor" aria-hidden="true" /> probabilistic
            </span>
          </span>
        </div>
        <div className="mt-2">
          <Graph added={added} conditions={conditions} broken={broken} onToggle={toggleSignal} />
        </div>
        <div className="mt-2">
          <div className="mb-1 flex items-baseline justify-between text-sm">
            <span className="text-foreground">Profile confidence</span>
            <span className="figure text-xs text-muted-foreground">
              {g.profileDevices.length} of 3 devices · target 80%
            </span>
          </div>
          <div className="relative">
            <Meter value={g.confidence * 100} label="Profile confidence" tone={g.profileDevices.length === 3 && g.confidence >= 0.8 ? "primary" : "floor"} />
            <span className="absolute -top-1 h-[1.1rem] w-0.5 rounded bg-foreground/60" style={{ left: "80%" }} aria-hidden="true" />
          </div>
        </div>
        <p className="mt-3 min-h-[3rem] text-sm text-foreground" aria-live="polite">
          {lastChange ?? summary}
        </p>
      </SimStage>

      <div className="space-y-4">
        <Panel title="Privacy conditions">
          <div className="grid gap-4 sm:grid-cols-2">
            <SimToggle
              label="Third-party cookies available"
              checked={thirdPartyCookies}
              onChange={setCookies}
              hint="Browsers are phasing them out. Cookie-synced matches go with them."
            />
            <SimToggle
              label="User consent given"
              checked={consent}
              onChange={setConsentOn}
              hint="GDPR consent covers IP and location; the ATT opt-in covers mobile ad IDs; using a hashed email for ads needs consent too."
            />
          </div>
          <p className="mt-4 rounded-lg bg-secondary/60 p-3 text-sm text-muted-foreground">
            A signal can only be tied to a device that has a <span className="text-foreground">persistent ID</span> — a cookie, a login or a mobile ad ID. Take
            that away and the device drops out of the graph.
          </p>
        </Panel>

        <Panel title="Identifiers">
          <ul className="-mx-3 grid gap-1 sm:grid-cols-2" aria-label="Identifiers">
            {SIGNALS.map((s) => {
              const on = added.includes(s.id);
              const reason = blockedReason(s, conditions);
              const Icon = SIGNAL_ICON[s.id];
              return (
                <li key={s.id}>
                  <button
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggleSignal(s.id)}
                    className={cn(
                      "interactive flex h-full w-full items-start gap-3 rounded-lg border px-3 py-2 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      on ? "border-primary/40 bg-primary/5" : "border-transparent hover:border-border"
                    )}
                  >
                    <Icon className="mt-0.5 h-4 w-4 shrink-0" style={{ color: `hsl(${KIND_COLOR[s.kind]})` }} aria-hidden="true" />
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-x-2">
                        <span className={on ? "text-foreground" : "text-muted-foreground"}>{s.label}</span>
                        <span className="text-xs text-muted-foreground">{KIND_LABEL[s.kind]}</span>
                      </span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">{s.detail}</span>
                      {on && reason && <span className="mt-0.5 block text-xs text-nobid">Blocked: {reason.toLowerCase()}</span>}
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
        <Stat label="Devices linked" value={`${g.profileDevices.length} of 3`} tone={g.profileDevices.length === 3 ? "primary" : "muted"} />
        <Stat label="Confidence" value={pct(g.confidence * 100)} tone={g.confidence >= 0.8 && g.profileDevices.length === 3 ? "primary" : "floor"} sub="all links right" />
        <Stat
          label="Solid / dashed"
          value={`${g.links.filter((l) => l.kind === "deterministic").length} / ${g.links.filter((l) => l.kind === "probabilistic").length}`}
          sub={mode === "none" ? "no matching yet" : `${mode} matching`}
        />
        <Stat label="Blocked" value={String(g.blocked.length)} tone={g.blocked.length ? "nobid" : "muted"} sub="identifiers unusable" />
      </div>

      <ChallengeMet show={met}>
        Phone, laptop and TV in one profile at {pct(g.confidence * 100)} — without a single third-party cookie. Challenge complete!
      </ChallengeMet>
    </div>
  );
}

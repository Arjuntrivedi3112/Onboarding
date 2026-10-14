/**
 * Building blocks shared by every simulator in the Lab, so twelve different
 * simulations feel like one instrument panel.
 *
 * Visual latitude: the Lab is the one place where glows, gradients and
 * looping motion are allowed (see design-rules.test.ts), but colours still
 * come from theme tokens so light and dark both work, and every looping
 * effect stops when the OS asks for reduced motion.
 */
import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { CheckCircle2, Pause, Play, RotateCcw, SkipForward, Trophy } from "lucide-react";

import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/* Playback                                                                   */
/* -------------------------------------------------------------------------- */

export interface Playback {
  /** Elapsed simulated time in ms. */
  t: number;
  playing: boolean;
  done: boolean;
  speed: number;
  play: () => void;
  pause: () => void;
  toggle: () => void;
  reset: () => void;
  seek: (t: number) => void;
  setSpeed: (speed: number) => void;
}

/**
 * A requestAnimationFrame clock over a fixed duration. `realMsPerSimMs`
 * stretches short simulated spans (a 100 ms auction) into something a human
 * can watch.
 */
export function usePlayback(durationMs: number, { realMsPerSimMs = 1, autoPlay = false } = {}): Playback {
  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState(autoPlay);
  const [speed, setSpeed] = useState(1);
  const last = useRef<number | null>(null);

  useEffect(() => {
    if (!playing) {
      last.current = null;
      return;
    }
    let raf = 0;
    const tick = (now: number) => {
      const prev = last.current ?? now;
      last.current = now;
      setT((cur) => {
        const next = Math.min(durationMs, cur + ((now - prev) * speed) / realMsPerSimMs);
        if (next >= durationMs) setPlaying(false);
        return next;
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, speed, durationMs, realMsPerSimMs]);

  const play = useCallback(() => {
    setT((cur) => (cur >= durationMs ? 0 : cur));
    setPlaying(true);
  }, [durationMs]);
  const pause = useCallback(() => setPlaying(false), []);
  const reset = useCallback(() => {
    setPlaying(false);
    setT(0);
  }, []);
  const seek = useCallback((value: number) => setT(Math.max(0, Math.min(durationMs, value))), [durationMs]);

  return {
    t,
    playing,
    done: t >= durationMs,
    speed,
    play,
    pause,
    toggle: () => (playing ? pause() : play()),
    reset,
    seek,
    setSpeed,
  };
}

/** Which step of a timeline is active at time t (steps have durations). */
export function stepAt<T extends { duration: number }>(steps: T[], t: number): number {
  let acc = 0;
  for (let i = 0; i < steps.length; i++) {
    acc += steps[i].duration;
    if (t < acc) return i;
  }
  return steps.length - 1;
}

/** Start time of each step. */
export function stepStarts<T extends { duration: number }>(steps: T[]): number[] {
  const out: number[] = [];
  let acc = 0;
  for (const s of steps) {
    out.push(acc);
    acc += s.duration;
  }
  return out;
}

/* -------------------------------------------------------------------------- */
/* Layout                                                                     */
/* -------------------------------------------------------------------------- */

/** The stage a simulation draws on: a subtly gridded, raised surface. */
export function SimStage({ children, className, label }: { children: ReactNode; className?: string; label?: string }) {
  return (
    <div
      role="group"
      aria-label={label}
      className={cn(
        "relative overflow-hidden rounded-xl border border-border bg-card p-4 sm:p-6",
        "bg-[linear-gradient(hsl(var(--border)/0.45)_1px,transparent_1px),linear-gradient(90deg,hsl(var(--border)/0.45)_1px,transparent_1px)] bg-[size:28px_28px]",
        className
      )}
    >
      {children}
    </div>
  );
}

export function Panel({ title, children, className, actions }: { title?: string; children: ReactNode; className?: string; actions?: ReactNode }) {
  return (
    <section className={cn("rounded-xl border border-border bg-card p-4", className)}>
      {(title || actions) && (
        <div className="mb-3 flex items-center justify-between gap-2">
          {title && <h3 className="text-sm uppercase tracking-wide text-muted-foreground">{title}</h3>}
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Controls                                                                   */
/* -------------------------------------------------------------------------- */

const buttonBase =
  "interactive inline-flex min-h-[2.5rem] items-center justify-center gap-2 rounded-lg px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50";

export function SimButton({
  children,
  onClick,
  variant = "secondary",
  disabled,
  pressed,
  className,
  ariaLabel,
}: {
  children: ReactNode;
  onClick: () => void;
  variant?: "primary" | "secondary" | "ghost";
  disabled?: boolean;
  pressed?: boolean;
  className?: string;
  ariaLabel?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={pressed}
      aria-label={ariaLabel}
      className={cn(
        buttonBase,
        variant === "primary" && "bg-primary text-primary-foreground shadow-[0_0_20px_hsl(var(--primary)/0.35)] hover:bg-primary/90",
        variant === "secondary" && "border border-border bg-background text-foreground hover:border-primary/50",
        variant === "ghost" && "text-muted-foreground hover:text-foreground",
        className
      )}
    >
      {children}
    </button>
  );
}

/** Play / pause / step / reset, plus an optional speed picker and clock. */
export function PlaybackControls({
  playback,
  onStep,
  clock,
  speeds = [0.5, 1, 2],
}: {
  playback: Playback;
  onStep?: () => void;
  clock?: ReactNode;
  speeds?: number[];
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <SimButton variant="primary" onClick={playback.toggle} ariaLabel={playback.playing ? "Pause" : "Play"}>
        {playback.playing ? <Pause className="h-4 w-4" aria-hidden="true" /> : <Play className="h-4 w-4" aria-hidden="true" />}
        {playback.playing ? "Pause" : playback.done ? "Replay" : playback.t > 0 ? "Resume" : "Play"}
      </SimButton>
      {onStep && (
        <SimButton onClick={onStep} disabled={playback.playing || playback.done}>
          <SkipForward className="h-4 w-4" aria-hidden="true" />
          Step
        </SimButton>
      )}
      <SimButton onClick={playback.reset} ariaLabel="Reset">
        <RotateCcw className="h-4 w-4" aria-hidden="true" />
        Reset
      </SimButton>
      <Segmented
        label="Speed"
        value={String(playback.speed)}
        onChange={(v) => playback.setSpeed(Number(v))}
        options={speeds.map((s) => ({ value: String(s), label: `${s}×` }))}
        size="sm"
      />
      {clock && <div className="figure ml-auto text-sm text-muted-foreground">{clock}</div>}
    </div>
  );
}

/** A labelled range slider with the current value shown. */
export function SimSlider({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  format = (v) => String(v),
  hint,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  format?: (value: number) => string;
  hint?: string;
}) {
  const id = useId();
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={id} className="text-sm text-foreground">
          {label}
        </label>
        <span className="figure text-sm text-primary">{format(value)}</span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="sim-range mt-2 w-full"
        style={{ ["--sim-range-pct" as string]: `${pct}%` }}
      />
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

/** Mutually exclusive options as a segmented control. */
export function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
  size = "md",
}: {
  label: string;
  value: T;
  options: Array<{ value: T; label: ReactNode }>;
  onChange: (value: T) => void;
  size?: "sm" | "md";
}) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex rounded-lg border border-border bg-background p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "interactive rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            size === "sm" ? "min-h-[2rem] px-2 text-xs" : "min-h-[2.25rem] px-3 text-sm",
            value === o.value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** An on/off switch with a visible label. */
export function SimToggle({ label, checked, onChange, hint }: { label: string; checked: boolean; onChange: (v: boolean) => void; hint?: string }) {
  const id = useId();
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <label htmlFor={id} className="text-sm text-foreground">
          {label}
        </label>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "interactive relative h-6 w-11 shrink-0 rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          checked ? "border-primary bg-primary" : "border-border-strong bg-secondary"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-4 w-4 rounded-full bg-card shadow transition-transform",
            checked ? "translate-x-[1.35rem]" : "translate-x-0.5"
          )}
        />
      </button>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Readouts                                                                   */
/* -------------------------------------------------------------------------- */

export type Tone = "primary" | "floor" | "nobid" | "muted";

const toneText: Record<Tone, string> = {
  primary: "text-primary",
  floor: "text-floor",
  nobid: "text-nobid",
  muted: "text-foreground",
};

/** A number with a label: the Lab's KPI tile. Animates when the value changes. */
export function Stat({ label, value, tone = "muted", sub }: { label: string; value: ReactNode; tone?: Tone; sub?: ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-background/70 p-3">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <motion.p
        key={String(value)}
        initial={{ opacity: 0.4, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn("figure mt-1 text-xl", toneText[tone])}
      >
        {value}
      </motion.p>
      {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

/** Horizontal bar with an animated fill, for shares and budgets. */
export function Meter({ value, max = 100, tone = "primary", label }: { value: number; max?: number; tone?: Tone; label?: string }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const fill = { primary: "bg-primary", floor: "bg-floor", nobid: "bg-nobid", muted: "bg-muted-foreground" }[tone];
  return (
    <div
      role="meter"
      aria-label={label}
      aria-valuenow={Math.round(value)}
      aria-valuemin={0}
      aria-valuemax={max}
      className="h-2.5 w-full overflow-hidden rounded-full bg-secondary"
    >
      <motion.div className={cn("h-full rounded-full", fill)} initial={false} animate={{ width: `${pct}%` }} transition={{ type: "spring", stiffness: 120, damping: 20 }} />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Diagram pieces                                                             */
/* -------------------------------------------------------------------------- */

/** CSS colour for a chain role (supply-chain tokens are allowed in the Lab). */
export const CHAIN = {
  advertiser: "var(--chain-advertiser)",
  agency: "var(--chain-agency)",
  dsp: "var(--chain-dsp)",
  dmp: "var(--chain-dmp)",
  exchange: "var(--chain-exchange)",
  ssp: "var(--chain-ssp)",
  adserver: "var(--chain-adserver)",
  publisher: "var(--chain-publisher)",
  user: "var(--chain-user)",
} as const;

export type ChainRole = keyof typeof CHAIN;

/**
 * A platform node: a rounded tile in its chain colour that glows and pulses
 * while active.
 */
export function FlowNode({
  label,
  sublabel,
  role,
  active,
  dimmed,
  icon,
  className,
}: {
  label: string;
  sublabel?: ReactNode;
  role: ChainRole;
  active?: boolean;
  dimmed?: boolean;
  icon?: ReactNode;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const color = `hsl(${CHAIN[role]})`;
  return (
    <motion.div
      className={cn(
        "relative flex min-w-[6.5rem] flex-col items-center gap-1 rounded-xl border-2 bg-card px-3 py-2 text-center transition-opacity",
        dimmed && "opacity-35",
        className
      )}
      style={{ borderColor: color, boxShadow: active ? `0 0 0 4px hsl(${CHAIN[role]} / 0.18), 0 0 28px hsl(${CHAIN[role]} / 0.45)` : undefined }}
      animate={active && !reduce ? { scale: [1, 1.05, 1] } : { scale: 1 }}
      transition={active && !reduce ? { duration: 1.2, repeat: Infinity, ease: "easeInOut" } : { duration: 0.2 }}
    >
      {icon && <span style={{ color }}>{icon}</span>}
      <span className="text-sm text-foreground">{label}</span>
      {sublabel && <span className="figure text-xs text-muted-foreground">{sublabel}</span>}
    </motion.div>
  );
}

/**
 * A dot travelling between two points of an SVG, looping while `running`.
 * Coordinates are in the parent SVG's viewBox.
 */
export function Particle({
  from,
  to,
  running,
  color = "var(--primary)",
  duration = 1.2,
  delay = 0,
  r = 5,
}: {
  from: [number, number];
  to: [number, number];
  running: boolean;
  color?: string;
  duration?: number;
  delay?: number;
  r?: number;
}) {
  const reduce = useReducedMotion();
  if (!running || reduce) return null;
  return (
    <motion.circle
      r={r}
      fill={`hsl(${color})`}
      style={{ filter: `drop-shadow(0 0 6px hsl(${color} / 0.8))` }}
      initial={{ cx: from[0], cy: from[1], opacity: 0 }}
      animate={{ cx: [from[0], to[0]], cy: [from[1], to[1]], opacity: [0, 1, 1, 0] }}
      transition={{ duration, delay, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}

/* -------------------------------------------------------------------------- */
/* Challenge                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Fires onPass exactly once when `met` first becomes true. Simulators call
 * this with their own success condition.
 */
export function useChallenge(met: boolean, onPass: () => void, alreadyPassed: boolean) {
  const fired = useRef(alreadyPassed);
  useEffect(() => {
    if (met && !fired.current) {
      fired.current = true;
      onPass();
    }
  }, [met, onPass]);
}

/** Inline "challenge met" banner for inside a simulator. */
export function ChallengeMet({ show, children = "Challenge complete!" }: { show: boolean; children?: ReactNode }) {
  if (!show) return null;
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex items-center gap-2 rounded-lg border border-primary/40 bg-primary/10 px-3 py-2 text-sm text-foreground shadow-[0_0_24px_hsl(var(--primary)/0.25)]"
      role="status"
    >
      <Trophy className="h-4 w-4 text-primary" aria-hidden="true" />
      {children}
    </motion.div>
  );
}

/** A small checklist row used for "Try this" steps inside a simulator. */
export function CheckRow({ done, children }: { done: boolean; children: ReactNode }) {
  return (
    <li className="flex items-start gap-2 text-sm">
      <CheckCircle2 className={cn("mt-0.5 h-4 w-4 shrink-0", done ? "text-primary" : "text-muted-foreground/40")} aria-hidden="true" />
      <span className={done ? "text-foreground" : "text-muted-foreground"}>{children}</span>
    </li>
  );
}

/** Report a description to the shell whenever it changes. */
export function useDescribe(onDescribe: (d: string) => void, description: string) {
  useEffect(() => {
    onDescribe(description);
  }, [onDescribe, description]);
}

/** Currency helpers used across simulators. */
export const money = (v: number, digits = 2) => `$${v.toFixed(digits)}`;
export const pct = (v: number, digits = 0) => `${v.toFixed(digits)}%`;
export const int = (v: number) => Math.round(v).toLocaleString();

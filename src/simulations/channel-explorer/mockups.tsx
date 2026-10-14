/**
 * Live mock-ups of the same campaign in each channel. Every looping effect
 * goes through useLoop, which stops when the OS asks for reduced motion.
 */
import { useEffect, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CloudRain, Coins, Globe, Heart, MessageCircle, Play, Search, Sun, Volume2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { CHAIN, Segmented } from "@/simulations/kit";
import { QUARTILES, firedQuartiles } from "@/simulations/channel-explorer/logic";

/** A counter that ticks every `periodMs` while motion is allowed. */
export function useLoop(periodMs: number, active = true) {
  const reduce = useReducedMotion();
  const [n, setN] = useState(0);
  useEffect(() => {
    if (reduce || !active) return;
    const id = setInterval(() => setN((x) => x + 1), periodMs);
    return () => clearInterval(id);
  }, [periodMs, reduce, active]);
  return { n, reduce: !!reduce };
}

const brandGradient = `linear-gradient(125deg, hsl(${CHAIN.advertiser}), hsl(var(--primary)))`;
const altGradient = `linear-gradient(125deg, hsl(${CHAIN.dsp}), hsl(${CHAIN.ssp}))`;

function Lines({ n, className }: { n: number; className?: string }) {
  const w = ["w-full", "w-11/12", "w-4/5", "w-full", "w-2/3"];
  return (
    <div className={cn("space-y-1.5", className)} aria-hidden="true">
      {Array.from({ length: n }, (_, i) => (
        <div key={i} className={cn("h-1.5 rounded bg-muted-foreground/20", w[i % w.length])} />
      ))}
    </div>
  );
}

/** The brand creative used everywhere: same campaign, different channel. */
function Creative({ className, children, compact }: { className?: string; children?: ReactNode; compact?: boolean }) {
  return (
    <div className={cn("relative flex items-center justify-between gap-2 overflow-hidden rounded-md text-primary-foreground", compact ? "px-2" : "px-3", className)} style={{ background: brandGradient }}>
      {children ?? (
        <>
          <span className={compact ? "text-xs" : "text-sm"}>Trailhead runners</span>
          <span className="rounded bg-card/90 px-1.5 py-0.5 text-xs text-foreground">Shop</span>
        </>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */

export function DisplayMock() {
  const { n, reduce } = useLoop(3200);
  return (
    <div className="mx-auto w-full max-w-md rounded-xl border border-border bg-background shadow-[0_0_32px_hsl(var(--primary)/0.12)]">
      <div className="flex items-center gap-2 border-b border-border px-3 py-2" aria-hidden="true">
        <span className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <span key={i} className="h-2 w-2 rounded-full bg-muted-foreground/30" />
          ))}
        </span>
        <span className="figure flex flex-1 items-center gap-1 truncate rounded bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
          <Globe className="h-3 w-3" /> outdoors.example
        </span>
      </div>
      <div className="space-y-3 p-3">
        <AdBox key={`lb-${n}`} label="728×90" className="h-10" reduce={reduce} delay={0.1} />
        <div className="grid grid-cols-[1fr_7rem] gap-3">
          <div className="space-y-2">
            <div className="h-2.5 w-3/4 rounded bg-foreground/25" />
            <Lines n={7} />
          </div>
          <AdBox key={`mpu-${n}`} label="300×250" className="h-24" reduce={reduce} delay={0.5} tall />
        </div>
        <p className="figure text-center text-xs text-muted-foreground">each ad: tag → RTB → CDN → its own iframe</p>
      </div>
    </div>
  );
}

function AdBox({ label, className, reduce, delay, tall }: { label: string; className?: string; reduce: boolean; delay: number; tall?: boolean }) {
  return (
    <div className={cn("relative overflow-hidden rounded-md border border-dashed border-border-strong bg-secondary/60", className)}>
      <span className="figure absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">{label}</span>
      <motion.div
        className="absolute inset-0"
        initial={reduce ? false : { opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: reduce ? 0 : delay + 0.4, type: "spring", stiffness: 220, damping: 18 }}
      >
        <Creative className={cn("h-full", tall && "flex-col justify-center")} compact={tall} />
      </motion.div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

/** VAST quartile pixels lighting up as a player-based ad plays. */
export function QuartileTrack({ progress, started, seconds }: { progress: number; started: boolean; seconds: number }) {
  const fired = firedQuartiles(progress, started);
  return (
    <ol className="grid grid-cols-5 gap-1.5" aria-label="VAST tracking events">
      {QUARTILES.map((q) => {
        const on = fired.includes(q.event);
        return (
          <li key={q.event}>
            <motion.div
              className={cn(
                "flex flex-col items-center rounded-lg border px-1 py-1.5 text-center",
                on ? "border-primary bg-primary/10 shadow-[0_0_16px_hsl(var(--primary)/0.35)]" : "border-border bg-background/70"
              )}
              animate={on ? { scale: [1, 1.08, 1] } : { scale: 1 }}
              transition={{ duration: 0.35 }}
            >
              <span className={cn("figure text-xs", on ? "text-primary" : "text-muted-foreground")}>{q.label}</span>
              <span className="figure text-xs text-muted-foreground">{(q.at * seconds).toFixed(q.at === 0 || q.at === 1 ? 0 : 1)}s</span>
              <span className="sr-only">{on ? "fired" : "not yet"}</span>
            </motion.div>
          </li>
        );
      })}
    </ol>
  );
}

function ProgressBar({ progress }: { progress: number }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-card/40">
      <div className="h-full rounded-full bg-floor" style={{ width: `${progress * 100}%` }} />
    </div>
  );
}

export function VideoMock({ progress, started, seconds }: { progress: number; started: boolean; seconds: number }) {
  const remaining = Math.ceil(seconds * (1 - progress));
  return (
    <div className="mx-auto w-full max-w-md space-y-3">
      <div className="relative aspect-video overflow-hidden rounded-xl border border-border shadow-[0_0_32px_hsl(var(--primary)/0.15)]" style={{ background: altGradient }}>
        <div className="absolute inset-0 bg-background/30" />
        {!started ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-primary-foreground">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-card/90 text-foreground shadow-[0_0_24px_hsl(var(--primary)/0.5)]">
              <Play className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="text-sm">Pre-roll ready — press Play</span>
          </div>
        ) : (
          <>
            <Creative className="absolute inset-4 flex-col justify-center gap-2 text-center">
              <span className="text-lg">Trailhead runners</span>
              <span className="text-xs">Built for the long way round</span>
            </Creative>
            <span className="figure absolute left-2 top-2 rounded bg-card/90 px-1.5 py-0.5 text-xs text-foreground">Ad · {remaining}s</span>
          </>
        )}
        <div className="absolute inset-x-2 bottom-2">
          <ProgressBar progress={progress} />
        </div>
      </div>
      <QuartileTrack progress={progress} started={started} seconds={seconds} />
    </div>
  );
}

export function CtvMock({ progress, started, seconds }: { progress: number; started: boolean; seconds: number }) {
  const [home, setHome] = useState<"a" | "b">("a");
  return (
    <div className="mx-auto w-full max-w-md space-y-3">
      <div className="flex justify-end">
        <Segmented<"a" | "b">
          label="Household watching"
          size="sm"
          value={home}
          onChange={setHome}
          options={[
            { value: "a", label: "Household A" },
            { value: "b", label: "Household B" },
          ]}
        />
      </div>
      <div className="relative">
        <div className="relative aspect-video overflow-hidden rounded-lg border-[6px] border-border-strong bg-secondary shadow-[0_0_40px_hsl(var(--primary)/0.2)]">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${home}-${started}`}
              className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-center text-primary-foreground"
              style={{ background: home === "a" ? brandGradient : altGradient }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <span className="text-lg">{home === "a" ? "The new Volta EV" : "Happy Paws food"}</span>
              <span className="text-xs">{home === "a" ? "Test drive this weekend" : "For fussy eaters"}</span>
            </motion.div>
          </AnimatePresence>
          <span className="figure absolute left-2 top-2 rounded bg-card/90 px-1.5 py-0.5 text-xs text-foreground">
            {started ? `Mid-roll · ${Math.ceil(seconds * (1 - progress))}s` : "Mid-roll · ready"}
          </span>
          <div className="absolute inset-x-3 bottom-2">
            <ProgressBar progress={progress} />
          </div>
        </div>
        <div className="mx-auto h-3 w-16 rounded-b-md bg-border-strong" aria-hidden="true" />
      </div>
      <p className="text-center text-xs text-muted-foreground">Same programme, two homes, two ads — addressable TV.</p>
      <QuartileTrack progress={progress} started={started} seconds={seconds} />
    </div>
  );
}

export function AudioMock({ progress, started, playing, seconds }: { progress: number; started: boolean; playing: boolean; seconds: number }) {
  const reduce = useReducedMotion();
  const [city, setCity] = useState<"Miami" | "Chicago">("Miami");
  const bars = 28;
  return (
    <div className="mx-auto w-full max-w-md space-y-3">
      <div className="rounded-xl border border-border bg-background p-3 shadow-[0_0_32px_hsl(var(--primary)/0.12)]">
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg text-primary-foreground" style={{ background: altGradient }}>
            <Volume2 className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-[8rem] flex-1">
            <p className="truncate text-sm text-foreground">The Commute Show · ep. 112</p>
            <p className="figure text-xs text-floor">{started ? `Ad · ${Math.ceil(seconds * (1 - progress))}s left` : "Pre-roll ad ready"}</p>
          </div>
          <Segmented<"Miami" | "Chicago"> label="Listener city" size="sm" value={city} onChange={setCity} options={[{ value: "Miami", label: "Miami" }, { value: "Chicago", label: "Chicago" }]} />
        </div>
        <div className="mt-3 flex h-12 items-center gap-[3px]" aria-hidden="true">
          {Array.from({ length: bars }, (_, i) => {
            const base = 0.3 + 0.6 * Math.abs(Math.sin(i * 1.7));
            const done = i / bars < progress;
            return (
              <motion.span
                key={i}
                className={cn("flex-1 rounded-full", done ? "bg-primary" : "bg-muted-foreground/30")}
                style={{ height: `${base * 100}%` }}
                animate={playing && !reduce ? { scaleY: [1, 0.35 + (i % 4) * 0.2, 1] } : { scaleY: 1 }}
                transition={playing && !reduce ? { duration: 0.6 + (i % 5) * 0.08, repeat: Infinity, ease: "easeInOut" } : { duration: 0.2 }}
              />
            );
          })}
        </div>
        <p className="mt-2 rounded-lg bg-secondary px-3 py-2 text-sm text-foreground">
          “{city === "Miami" ? "Too hot to cook in Miami? Fresh meal kits, at your door by six." : "Chicago wind got you? Warm, ready-to-cook kits, delivered tonight."}”
        </p>
      </div>
      <Creative className="h-10">
        <span className="text-xs">Companion banner · FreshBox meal kits</span>
        <span className="rounded bg-card/90 px-1.5 py-0.5 text-xs text-foreground">Order</span>
      </Creative>
      <QuartileTrack progress={progress} started={started} seconds={seconds} />
    </div>
  );
}

/* -------------------------------------------------------------------------- */

export function DoohMock() {
  const { n, reduce } = useLoop(4000);
  const [time, setTime] = useState<"morning" | "evening">("morning");
  const [rain, setRain] = useState(false);
  const message = rain ? "Rainy start? Hot drinks, 2 for 1" : time === "morning" ? "Breakfast to go — $3 combo" : "Wind down: iced decaf, half price";
  return (
    <div className="mx-auto w-full max-w-md space-y-3">
      <div className="flex flex-wrap justify-end gap-2">
        <Segmented<"morning" | "evening"> label="Time of day" size="sm" value={time} onChange={setTime} options={[{ value: "morning", label: "Morning" }, { value: "evening", label: "Evening" }]} />
        <Segmented
          label="Weather"
          size="sm"
          value={rain ? "rain" : "sun"}
          onChange={(v) => setRain(v === "rain")}
          options={[
            {
              value: "sun",
              label: (
                <span className="flex items-center gap-1">
                  <Sun className="h-3.5 w-3.5" aria-hidden="true" /> Sunny
                </span>
              ),
            },
            {
              value: "rain",
              label: (
                <span className="flex items-center gap-1">
                  <CloudRain className="h-3.5 w-3.5" aria-hidden="true" /> Rain
                </span>
              ),
            },
          ]}
        />
      </div>
      <div className={cn("relative h-56 overflow-hidden rounded-xl border border-border", time === "morning" ? "bg-secondary" : "bg-muted")}>
        {/* skyline */}
        <div className="absolute inset-x-0 bottom-0 flex items-end gap-1 px-2" aria-hidden="true">
          {[40, 64, 52, 80, 46, 70, 58, 36].map((h, i) => (
            <span key={i} className="flex-1 rounded-t bg-muted-foreground/20" style={{ height: h }} />
          ))}
        </div>
        {rain && !reduce && (
          <div className="absolute inset-0" aria-hidden="true">
            {Array.from({ length: 18 }, (_, i) => (
              <motion.span
                key={i}
                className="absolute h-3 w-px bg-primary/50"
                style={{ left: `${(i * 37) % 100}%` }}
                initial={{ top: "-10%" }}
                animate={{ top: "110%" }}
                transition={{ duration: 0.9 + (i % 4) * 0.15, repeat: Infinity, delay: (i % 6) * 0.15, ease: "linear" }}
              />
            ))}
          </div>
        )}
        {/* billboard */}
        <div className="absolute left-1/2 top-5 w-[78%] -translate-x-1/2">
          <div className="rounded-lg border-4 border-border-strong bg-background p-1 shadow-[0_0_36px_hsl(var(--primary)/0.35)]">
            <AnimatePresence mode="wait">
              <motion.div key={`${message}-${n}`} initial={reduce ? false : { opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.35 }}>
                <Creative className="h-20 flex-col justify-center gap-1 text-center">
                  <span className="text-xs">Corner Coffee</span>
                  <span className="text-sm">{message}</span>
                </Creative>
              </motion.div>
            </AnimatePresence>
          </div>
          <div className="mx-auto h-16 w-2 bg-border-strong" aria-hidden="true" />
        </div>
        <span className="figure absolute right-2 top-2 rounded bg-card/90 px-1.5 py-0.5 text-xs text-muted-foreground">plays: {n + 1}</span>
      </div>
    </div>
  );
}

export function MobileMock() {
  const { n, reduce } = useLoop(3000);
  const showOffer = n % 3 === 2;
  return (
    <div className="mx-auto w-52">
      <div className="relative h-96 overflow-hidden rounded-[2rem] border-[6px] border-border-strong bg-background shadow-[0_0_40px_hsl(var(--primary)/0.2)]">
        <div className="mx-auto mt-1.5 h-1.5 w-16 rounded-full bg-border-strong" aria-hidden="true" />
        <div className="flex items-center justify-between px-3 pt-2 text-xs text-muted-foreground">
          <span>Block Drop</span>
          <span className="figure flex items-center gap-1 text-floor">
            <Coins className="h-3 w-3" aria-hidden="true" /> {120 + (n % 3 === 0 && n > 0 ? 50 : 0)}
          </span>
        </div>
        {/* game grid */}
        <div className="mx-3 mt-2 grid grid-cols-5 gap-1" aria-hidden="true">
          {Array.from({ length: 30 }, (_, i) => (
            <motion.span
              key={i}
              className="aspect-square rounded-sm"
              style={{ background: (i * 7 + n) % 5 === 0 ? `hsl(${CHAIN.dsp})` : (i * 3 + n) % 4 === 0 ? `hsl(${CHAIN.ssp})` : "hsl(var(--secondary))" }}
            />
          ))}
        </div>
        <AnimatePresence>
          {showOffer && (
            <motion.div
              className="absolute inset-x-3 top-24 rounded-xl border border-border bg-card p-3 text-center shadow-[0_0_24px_hsl(var(--primary)/0.4)]"
              initial={reduce ? false : { y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
            >
              <p className="text-xs text-muted-foreground">Rewarded video</p>
              <p className="text-sm text-foreground">Watch to earn 50 coins</p>
              <span className="mt-2 inline-block rounded-md bg-primary px-2 py-1 text-xs text-primary-foreground">Watch</span>
            </motion.div>
          )}
        </AnimatePresence>
        <div className="absolute inset-x-2 bottom-3">
          <Creative className="h-9" compact />
          <p className="figure mt-1 text-center text-xs text-muted-foreground">320×50 · rendered by SDK</p>
        </div>
      </div>
    </div>
  );
}

function ComponentTag({ show, children }: { show: boolean; children: ReactNode }) {
  return show ? <span className="figure ml-1 rounded bg-primary px-1 text-xs text-primary-foreground">{children}</span> : null;
}

function FeedCard({ ad, components }: { ad?: boolean; components: boolean }) {
  const outline = components ? "outline outline-2 outline-offset-2 outline-primary" : "";
  return (
    <div className={cn("rounded-lg border bg-background p-2.5", ad ? "border-primary/40 shadow-[0_0_20px_hsl(var(--primary)/0.2)]" : "border-border")}>
      {ad && <p className="mb-1 text-xs text-floor">Sponsored · Trailhead</p>}
      <div className="flex gap-2.5">
        <div className={cn("h-14 w-14 shrink-0 rounded-md", ad ? outline : "bg-muted-foreground/20")} style={ad ? { background: brandGradient } : undefined} />
        <div className="min-w-0 flex-1">
          {ad ? (
            <>
              <p className={cn("text-sm text-foreground", outline)}>
                Five trails worth the early alarm
                <ComponentTag show={components}>headline</ComponentTag>
              </p>
              <p className={cn("mt-1 text-xs text-muted-foreground", outline)}>
                Our guide to the best sunrise routes.
                <ComponentTag show={components}>description</ComponentTag>
              </p>
            </>
          ) : (
            <Lines n={3} />
          )}
        </div>
      </div>
      {ad && components && <span className="figure mt-1 inline-block rounded bg-primary px-1 text-xs text-primary-foreground">image</span>}
      <div className="mt-2 flex gap-3 text-muted-foreground" aria-hidden="true">
        <Heart className="h-3.5 w-3.5" />
        <MessageCircle className="h-3.5 w-3.5" />
      </div>
    </div>
  );
}

export function NativeMock() {
  const [components, setComponents] = useState(false);
  return (
    <div className="mx-auto w-full max-w-sm space-y-2">
      <div className="flex justify-end">
        <button
          type="button"
          aria-pressed={components}
          onClick={() => setComponents((c) => !c)}
          className="interactive min-h-[2rem] rounded-md border border-border bg-background px-2 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {components ? "Hide components" : "Show the components"}
        </button>
      </div>
      <FeedCard components={components} />
      <FeedCard ad components={components} />
      <FeedCard components={components} />
    </div>
  );
}

export function SearchMock() {
  const { n, reduce } = useLoop(110);
  const query = "trail running shoes";
  const cycle = query.length + 30;
  const typed = reduce ? query.length : Math.min(query.length, n % cycle);
  const done = typed >= query.length;
  return (
    <div className="mx-auto w-full max-w-md space-y-3 rounded-xl border border-border bg-background p-3 shadow-[0_0_32px_hsl(var(--primary)/0.12)]">
      <div className="flex items-center gap-2 rounded-full border border-border bg-secondary px-3 py-2">
        <Search className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        <span className="figure text-sm text-foreground">
          {query.slice(0, typed)}
          {!done && <span className="ml-px inline-block h-4 w-px translate-y-0.5 bg-primary" />}
        </span>
      </div>
      <AnimatePresence>
        {done && (
          <motion.div key={Math.floor(n / cycle)} initial={reduce ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">
            <div className="rounded-lg border border-primary/40 bg-primary/5 p-2.5 shadow-[0_0_20px_hsl(var(--primary)/0.2)]">
              <p className="text-xs text-floor">Sponsored · trailhead.example</p>
              <p className="text-sm text-primary">Trail Running Shoes — 30% Off This Week</p>
              <p className="text-xs text-muted-foreground">Grippy, light, built for mud. Free returns.</p>
            </div>
            {[0, 1].map((i) => (
              <div key={i} className="space-y-1 px-2.5" aria-hidden="true">
                <div className="h-2 w-1/3 rounded bg-muted-foreground/25" />
                <div className="h-2.5 w-3/4 rounded bg-foreground/20" />
                <Lines n={2} />
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

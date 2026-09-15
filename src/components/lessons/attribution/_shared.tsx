import { useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * The journey-builder attribution simulator, lifted out of the old
 * AttributionModule and shared by the single-touch and multi-touch lessons.
 *
 * Both lessons mount the same component with a different slice of `MODELS`
 * passed in, so the journey, the math, and the interaction all stay
 * identical — only which models are offered in the picker changes.
 */

export type TouchKind = "display" | "social" | "search" | "email" | "direct";

export interface Touchpoint {
  id: string;
  channel: string;
  kind: TouchKind;
  /** Days before the conversion this touchpoint happened. 0 is conversion day. */
  daysAgo: number;
}

export const KIND_LABELS: Record<TouchKind, string> = {
  display: "Display ad",
  social: "Social ad",
  search: "Paid search",
  email: "Email",
  direct: "Direct visit",
};

/** The journey both simulators start from. Ends in a direct visit on purpose —
 * that is the touchpoint last click and last non-direct disagree about. */
export const DEFAULT_JOURNEY: Touchpoint[] = [
  { id: "t1", channel: "Display ad", kind: "display", daysAgo: 12 },
  { id: "t2", channel: "Social ad", kind: "social", daysAgo: 8 },
  { id: "t3", channel: "Email", kind: "email", daysAgo: 3 },
  { id: "t4", channel: "Direct visit", kind: "direct", daysAgo: 0 },
];

export const ADD_PALETTE: { channel: string; kind: TouchKind }[] = [
  { channel: "Display ad", kind: "display" },
  { channel: "Social ad", kind: "social" },
  { channel: "Paid search", kind: "search" },
  { channel: "Email", kind: "email" },
  { channel: "Direct visit", kind: "direct" },
];

export const MAX_TOUCHPOINTS = 6;

export type ModelId =
  | "last-click"
  | "last-non-direct"
  | "first-click"
  | "linear"
  | "time-decay"
  | "position"
  | "custom";

export interface AttributionModel {
  id: ModelId;
  name: string;
  /** Short, digit-free line shown next to the button in the picker. */
  summary: string;
  /** "How it works." Can carry <span className="figure"> around real numbers. */
  detail: ReactNode;
  /** "What to watch out for." */
  caveat: ReactNode;
  group: "single" | "multi";
}

export const MODELS: AttributionModel[] = [
  {
    id: "last-click",
    name: "Last click",
    summary: "All credit to the final touchpoint",
    group: "single",
    detail: (
      <>
        Also called last interaction or last touchpoint. It is the oldest attribution model, and
        still the default in many web analytics, MarTech, and AdTech platforms. All of the credit
        for a conversion goes to the final known referral, click, or traffic source before the
        conversion happened — even if that final touchpoint was a direct visit.
      </>
    ),
    caveat: (
      <>
        It ignores every other touchpoint in the journey, which can lead to poor decisions about
        which channels are actually worth funding.
      </>
    ),
  },
  {
    id: "last-non-direct",
    name: "Last non-direct",
    summary: "All credit to the last non-direct touchpoint",
    group: "single",
    detail: (
      <>
        Nearly identical to last click, except direct visits are removed from consideration. If a
        user clicks a link on Facebook, leaves, and later types your URL directly into their
        browser to convert, the direct visit is skipped and Facebook receives all of the credit
        instead.
      </>
    ),
    caveat: (
      <>
        A real improvement over last click, but it still overlooks every touchpoint in the journey
        except the one it picks.
      </>
    ),
  },
  {
    id: "first-click",
    name: "First click",
    summary: "All credit to the first touchpoint",
    group: "single",
    detail: (
      <>
        Also called first interaction or first touch. It assigns all of the credit to the first
        click or referrer that started the customer journey — useful for understanding which
        channels create awareness.
      </>
    ),
    caveat: <>It ignores whatever actually closed the sale, over-rewarding top-of-funnel channels.</>,
  },
  {
    id: "linear",
    name: "Linear",
    summary: "Credit split evenly across every touchpoint",
    group: "multi",
    detail: (
      <>
        Every touchpoint in the journey receives an identical share of the conversion credit, no
        matter its position or timing. With four touchpoints, each one gets{" "}
        <span className="figure">25%</span>.
      </>
    ),
    caveat: (
      <>
        It treats every touchpoint as equally persuasive, which is rarely true — but it is a fast
        way to get an overview of a journey.
      </>
    ),
  },
  {
    id: "time-decay",
    name: "Time decay",
    summary: "Recent touchpoints earn more credit than distant ones",
    group: "multi",
    detail: (
      <>
        A variation of the linear model. The touchpoint closest to the conversion earns the most
        credit, and each earlier touchpoint earns progressively less — the farther back it sits,
        the more its influence decays. This lesson uses a{" "}
        <span className="figure">7-day</span> half-life, so a touchpoint's weight is cut in half
        for every <span className="figure">7</span> days between it and the conversion.
      </>
    ),
    caveat: <>It assumes the most recent touchpoints were the ones that persuaded the user, which may or may not be true.</>,
  },
  {
    id: "position",
    name: "Position based",
    summary: "First and last touchpoints outweigh everything between them",
    group: "multi",
    detail: (
      <>
        Weights the two interactions that usually matter most — the one that introduced the brand
        and the one that closed the conversion — while still crediting whatever happened in
        between. This lesson splits <span className="figure">40%</span> to the first touchpoint,{" "}
        <span className="figure">40%</span> to the last, and the remaining{" "}
        <span className="figure">20%</span> evenly across the middle.
      </>
    ),
    caveat: (
      <>
        Often a good default for advertisers: it credits the whole journey while still recognizing
        the two most important moments in it.
      </>
    ),
  },
  {
    id: "custom",
    name: "Custom",
    summary: "Advertiser-defined first and last weighting",
    group: "multi",
    detail: (
      <>
        Some AdTech and MarTech platforms let advertisers define their own attribution rules to fit
        a specific campaign structure, audience, and customer journey. Use the sliders below to set
        your own first- and last-touchpoint weight — whatever remains is divided evenly across the
        middle.
      </>
    ),
    caveat: (
      <>
        Every model on this page — single touch or multi touch — only sees a single device and
        browser. Measuring a journey that crosses devices needs cross-device attribution instead.
      </>
    ),
  },
];

export const SINGLE_TOUCH_MODELS = MODELS.filter((m) => m.group === "single");
export const MULTI_TOUCH_MODELS = MODELS.filter((m) => m.group === "multi");

export function findModel(id: ModelId): AttributionModel {
  return MODELS.find((m) => m.id === id) ?? MODELS[0];
}

export const TIME_DECAY_HALF_LIFE_DAYS = 7;

export interface CustomWeights {
  first: number;
  last: number;
}

export const DEFAULT_CUSTOM_WEIGHTS: CustomWeights = { first: 50, last: 30 };

/** The real math behind every credit bar. Shared so single-touch and
 * multi-touch models recompute from the same rules on the same journey. */
export function computeCredit(
  touchpoints: Touchpoint[],
  model: ModelId,
  custom: CustomWeights
): number[] {
  const n = touchpoints.length;
  if (n === 0) return [];
  if (n === 1) return [100];

  switch (model) {
    case "last-click":
      return touchpoints.map((_, i) => (i === n - 1 ? 100 : 0));

    case "last-non-direct": {
      let idx = -1;
      for (let i = n - 1; i >= 0; i--) {
        if (touchpoints[i].kind !== "direct") {
          idx = i;
          break;
        }
      }
      if (idx === -1) idx = n - 1;
      return touchpoints.map((_, i) => (i === idx ? 100 : 0));
    }

    case "first-click":
      return touchpoints.map((_, i) => (i === 0 ? 100 : 0));

    case "linear":
      return touchpoints.map(() => 100 / n);

    case "time-decay": {
      const weights = touchpoints.map((t) => Math.pow(0.5, t.daysAgo / TIME_DECAY_HALF_LIFE_DAYS));
      const total = weights.reduce((a, b) => a + b, 0);
      return weights.map((w) => (w / total) * 100);
    }

    case "position": {
      if (n === 2) return [50, 50];
      const middleShare = 20 / (n - 2);
      return touchpoints.map((_, i) => (i === 0 || i === n - 1 ? 40 : middleShare));
    }

    case "custom": {
      if (n === 2) {
        const total = custom.first + custom.last || 1;
        return [(custom.first / total) * 100, (custom.last / total) * 100];
      }
      const remainder = Math.max(0, 100 - custom.first - custom.last);
      const middleShare = remainder / (n - 2);
      return touchpoints.map((_, i) => (i === 0 ? custom.first : i === n - 1 ? custom.last : middleShare));
    }
  }
}

function toggleButtonClass(active: boolean) {
  return cn(
    "min-h-[2.75rem] rounded-lg border px-4 text-sm transition-colors",
    active
      ? "border-primary bg-primary/10 text-foreground"
      : "border-border text-muted-foreground hover:text-foreground"
  );
}

interface AttributionSimulatorProps {
  /** The models offered in the picker. A subset of MODELS. */
  models: AttributionModel[];
  defaultModelId: ModelId;
  /** Show a "compare every model at once" toggle beneath the main view. */
  allowCompareAll?: boolean;
}

/** The full interactive: model picker, live journey with credit bars, an
 * add/remove touchpoint palette, custom sliders, and the paired "how it
 * works" / "what to watch out for" cards. */
export function AttributionSimulator({
  models,
  defaultModelId,
  allowCompareAll = false,
}: AttributionSimulatorProps) {
  const [touchpoints, setTouchpoints] = useState<Touchpoint[]>(DEFAULT_JOURNEY);
  const [selectedModel, setSelectedModel] = useState<ModelId>(defaultModelId);
  const [customWeights, setCustomWeights] = useState<CustomWeights>(DEFAULT_CUSTOM_WEIGHTS);
  const [compareAll, setCompareAll] = useState(false);

  const model = findModel(selectedModel);
  const credit = computeCredit(touchpoints, selectedModel, customWeights);

  function addTouchpoint(channel: string, kind: TouchKind) {
    if (touchpoints.length >= MAX_TOUCHPOINTS) return;
    setTouchpoints((prev) => [
      ...prev,
      {
        id: `t${Date.now()}`,
        channel,
        kind,
        daysAgo: Math.max(0, (prev[prev.length - 1]?.daysAgo ?? 4) - 2),
      },
    ]);
  }

  function removeTouchpoint(id: string) {
    setTouchpoints((prev) => (prev.length <= 1 ? prev : prev.filter((t) => t.id !== id)));
  }

  function reset() {
    setTouchpoints(DEFAULT_JOURNEY);
    setCustomWeights(DEFAULT_CUSTOM_WEIGHTS);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <button
          type="button"
          onClick={reset}
          className="min-h-[2.75rem] rounded-lg border border-border px-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          Reset journey
        </button>
      </div>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Choose an attribution model">
        {models.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setSelectedModel(m.id)}
            aria-pressed={selectedModel === m.id}
            className={toggleButtonClass(selectedModel === m.id)}
          >
            {m.name}
          </button>
        ))}
      </div>

      <div className="rounded-lg border border-border bg-card p-4">
        <div className="mb-4 flex items-center justify-between gap-2">
          <span className="text-foreground">{model.name}</span>
          <span className="text-sm text-muted-foreground">{model.summary}</span>
        </div>

        <div
          className="grid gap-3"
          style={{ gridTemplateColumns: `repeat(${touchpoints.length}, minmax(0, 1fr))` }}
        >
          {touchpoints.map((tp, i) => (
            <div key={tp.id} className="min-w-0">
              <div className="mb-1 flex items-center justify-between gap-1">
                <span className="truncate text-sm text-muted-foreground">{tp.channel}</span>
                {touchpoints.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeTouchpoint(tp.id)}
                    className="flex min-h-[2.75rem] min-w-[2.75rem] shrink-0 items-center justify-center text-muted-foreground transition-colors hover:text-destructive"
                    aria-label={`Remove ${tp.channel}`}
                  >
                    ×
                  </button>
                )}
              </div>
              <div className="relative h-10 overflow-hidden rounded bg-secondary">
                <div
                  className="absolute inset-y-0 left-0 bg-primary/70 transition-[width] duration-300"
                  style={{ width: `${credit[i]}%` }}
                />
                <span className="figure absolute inset-0 flex items-center justify-center text-sm text-foreground">
                  {credit[i].toFixed(1)}%
                </span>
              </div>
              <p className="mt-1 text-center text-sm text-muted-foreground">
                {tp.daysAgo === 0 ? (
                  "Conversion day"
                ) : (
                  <>
                    <span className="figure">{tp.daysAgo}</span> days before
                  </>
                )}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-4 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm text-primary">
            Conversion
          </span>
        </div>
      </div>

      {selectedModel === "custom" && (
        <div className="grid grid-cols-1 gap-4 rounded-lg border border-border bg-card p-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm text-muted-foreground">
              First-touchpoint weight:{" "}
              <span className="figure text-foreground">{customWeights.first}%</span>
            </label>
            <div className="flex min-h-[2.75rem] items-center">
              <input
                type="range"
                min={0}
                max={100}
                value={customWeights.first}
                onChange={(e) => setCustomWeights((w) => ({ ...w, first: Number(e.target.value) }))}
                className="w-full accent-primary"
                aria-label="First-touchpoint weight"
              />
            </div>
          </div>
          <div>
            <label className="mb-2 block text-sm text-muted-foreground">
              Last-touchpoint weight:{" "}
              <span className="figure text-foreground">{customWeights.last}%</span>
            </label>
            <div className="flex min-h-[2.75rem] items-center">
              <input
                type="range"
                min={0}
                max={100}
                value={customWeights.last}
                onChange={(e) => setCustomWeights((w) => ({ ...w, last: Number(e.target.value) }))}
                className="w-full accent-primary"
                aria-label="Last-touchpoint weight"
              />
            </div>
          </div>
          <p className="measure text-sm text-muted-foreground md:col-span-2">
            The remaining{" "}
            <span className="figure">{Math.max(0, 100 - customWeights.first - customWeights.last)}%</span>{" "}
            is shared evenly across the middle touchpoints.
          </p>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-1 text-sm text-muted-foreground">Add a touchpoint:</span>
        {ADD_PALETTE.map((p) => (
          <button
            key={p.channel}
            type="button"
            onClick={() => addTouchpoint(p.channel, p.kind)}
            disabled={touchpoints.length >= MAX_TOUCHPOINTS}
            className="min-h-[2.75rem] rounded-lg border border-border px-3 text-sm text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
          >
            + {p.channel}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-border bg-card p-4">
          <h4 className="mb-2 text-foreground">How it works</h4>
          <p className="text-sm text-muted-foreground">{model.detail}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <h4 className="mb-2 text-foreground">What to watch out for</h4>
          <p className="text-sm text-muted-foreground">{model.caveat}</p>
        </div>
      </div>

      {allowCompareAll && (
        <div>
          <button
            type="button"
            onClick={() => setCompareAll((v) => !v)}
            aria-pressed={compareAll}
            className={cn(toggleButtonClass(compareAll), "w-full sm:w-auto")}
          >
            {compareAll ? "Hide the seven-model comparison" : "Compare all seven models at once"}
          </button>

          {compareAll && (
            <div className="mt-4 space-y-3 rounded-lg border border-border bg-card p-4">
              <p className="measure text-sm text-muted-foreground">
                Same journey, all seven models. Watch how far a single touchpoint's credit moves
                depending only on which rule you apply to it.
              </p>
              {MODELS.map((m) => {
                const rowCredit = computeCredit(touchpoints, m.id, customWeights);
                return (
                  <div
                    key={m.id}
                    className={cn(
                      "rounded-lg border p-2",
                      m.id === selectedModel ? "border-border-strong bg-secondary" : "border-border"
                    )}
                  >
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <span className="text-sm text-foreground">{m.name}</span>
                    </div>
                    <div className="flex h-3 gap-px overflow-hidden rounded">
                      {touchpoints.map((tp, i) => (
                        <div
                          key={tp.id}
                          className="h-full bg-primary"
                          style={{ width: `${rowCredit[i]}%`, opacity: 0.35 + i * 0.15 }}
                          title={`${tp.channel}: ${rowCredit[i].toFixed(1)}%`}
                        />
                      ))}
                    </div>
                    <p className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-sm text-muted-foreground">
                      {touchpoints.map((tp, i) => (
                        <span key={tp.id}>
                          {tp.channel} <span className="figure">{rowCredit[i].toFixed(0)}%</span>
                        </span>
                      ))}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

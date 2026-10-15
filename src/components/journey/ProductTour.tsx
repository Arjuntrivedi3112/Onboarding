import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Compass, X } from "lucide-react";

import { useAuth } from "@/lib/auth/AuthProvider";
import { track } from "@/lib/telemetry";

interface TourStep {
  /** Matches a `data-tour="…"` attribute on the element being highlighted. */
  target: string;
  title: string;
  body: string;
  /** Where the tooltip sits relative to the highlighted element. */
  placement: "bottom" | "top" | "left" | "right";
}

const STEPS: TourStep[] = [
  {
    target: "sidebar",
    title: "Your journey, always on the left",
    body: "Everything lives here: every section, every lesson, in book order. Nothing about this moves as you read.",
    placement: "right",
  },
  {
    target: "search-trigger",
    title: "Jump to anything — ⌘K",
    body: "Search isn't just titles — it searches the actual words in every lesson, and jumps straight to the paragraph, not just the page.",
    placement: "bottom",
  },
  {
    target: "section-list",
    title: "Sections, in book order",
    body: "Click a section to see its lessons, or open one directly. Nothing is locked — read in order, or jump around freely.",
    placement: "right",
  },
  {
    target: "lab-link",
    title: "The Simulation Lab",
    body: "Every section has a hands-on simulator: run an auction, build an identity graph, pace a budget. Each one ends with a challenge.",
    placement: "right",
  },
  {
    target: "next-action",
    title: "Your next lesson, always here",
    body: "This card follows your personal path and points at your next unfinished lesson. Same place on day one and day forty.",
    placement: "bottom",
  },
  {
    target: "sections",
    title: "Your path, section by section",
    body: "Sections are ordered for your team. \"Key\" sections matter most for your role; \"Skim\" ones cover what you said you know.",
    placement: "top",
  },
  {
    target: "notifications",
    title: "Assignments and nudges",
    body: "Your onboarding lead can assign lessons and simulators or send a note. They show up here and on your dashboard.",
    placement: "right",
  },
  {
    target: "user-menu",
    title: "Your profile",
    body: "Badges, streaks, reading time, your weekly goal, password and recovery code — all in your profile.",
    placement: "right",
  },
  {
    target: "ask-question",
    title: "Stuck? Ask the AI explainer",
    body: "It answers from the book first, and only reaches beyond it when the book doesn't cover something — and it'll say so when it does.",
    placement: "left",
  },
  {
    target: "theme-toggle",
    title: "Light, dark, or system",
    body: "Click to cycle through appearances. \"System\" follows whatever your OS is set to.",
    placement: "left",
  },
];

const MARGIN = 10;

const START_EVENT = "adtech:start-tour";

/** Ask the tour to start from anywhere (user menu, Help page). */
export function startProductTour() {
  window.dispatchEvent(new Event(START_EVENT));
}

function onStartProductTour(handler: () => void): () => void {
  window.addEventListener(START_EVENT, handler);
  return () => window.removeEventListener(START_EVENT, handler);
}

function useElementRect(selector: string | null): DOMRect | null {
  const [rect, setRect] = useState<DOMRect | null>(null);

  const measure = useCallback(() => {
    if (!selector) {
      setRect(null);
      return;
    }
    const el = document.querySelector(`[data-tour="${selector}"]`);
    const candidate = el ? el.getBoundingClientRect() : null;
    // A `display:none` element (e.g. the desktop sidebar, hidden below the
    // `lg` breakpoint) still resolves via querySelector and still returns a
    // rect — just a zero-size one at (0,0). Treat that as "not found" rather
    // than drawing a broken highlight box in the corner.
    setRect(candidate && candidate.width > 0 && candidate.height > 0 ? candidate : null);
  }, [selector]);

  useEffect(() => {
    measure();
    // A couple of follow-up measurements catch layout that settles after
    // the route change / mobile sheet animation this step may have caused.
    const timeouts = [50, 200, 500].map((ms) => window.setTimeout(measure, ms));
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      timeouts.forEach(window.clearTimeout);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [measure]);

  return rect;
}

/**
 * A walkthrough of the main navigational affordances. It runs once,
 * automatically, after onboarding (remembered on the profile as
 * tour_completed_at) and can be replayed from the "Take the tour" button. Deliberately anchored to real elements
 * (`data-tour="…"`) rather than a fixed script, so it can't drift out of
 * sync with a UI change the way a purely narrated tour could.
 */
export function ProductTour() {
  const { profile, updateProfile } = useAuth();
  const [active, setActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  const startedFromRef = useRef<string | null>(null);

  const step = active ? STEPS[stepIndex] : null;
  const rect = useElementRect(step?.target ?? null);

  const start = useCallback(() => {
    startedFromRef.current = location.pathname;
    setStepIndex(0);
    setActive(true);
    if (location.pathname !== "/dashboard") navigate("/dashboard");
  }, [location.pathname, navigate]);

  // Started on demand from anywhere via startProductTour().
  useEffect(
    () =>
      onStartProductTour(() => {
        startedFromRef.current = location.pathname;
        setStepIndex(0);
        setActive(true);
        if (location.pathname !== "/dashboard") navigate("/dashboard");
      }),
    [location.pathname, navigate]
  );

  // First visit after onboarding: run the tour once, automatically.
  const autoStarted = useRef(false);
  useEffect(() => {
    if (autoStarted.current || active) return;
    if (!profile?.onboarding_completed_at || profile.tour_completed_at) return;
    if (location.pathname !== "/dashboard") return;
    autoStarted.current = true;
    const timer = window.setTimeout(() => {
      startedFromRef.current = "/dashboard";
      setStepIndex(0);
      setActive(true);
    }, 900);
    return () => window.clearTimeout(timer);
  }, [profile?.onboarding_completed_at, profile?.tour_completed_at, location.pathname, active]);

  const stop = useCallback(() => {
    if (profile && !profile.tour_completed_at) {
      void updateProfile({ tour_completed_at: new Date().toISOString() }).catch(() => undefined);
      track("tour_complete");
    }
    setActive(false);
    // If the tour itself navigated to the dashboard, return to wherever the
    // learner actually was — starting a tour shouldn't relocate them.
    if (startedFromRef.current && startedFromRef.current !== "/dashboard") {
      navigate(startedFromRef.current);
    }
    startedFromRef.current = null;
  }, [navigate, profile, updateProfile]);

  useEffect(() => {
    if (!active) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") stop();
      if (event.key === "ArrowRight") next();
      if (event.key === "ArrowLeft") back();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, stepIndex]);

  function next() {
    if (stepIndex < STEPS.length - 1) setStepIndex((i) => i + 1);
    else stop();
  }

  function back() {
    setStepIndex((i) => Math.max(0, i - 1));
  }

  // The tour has no floating button of its own any more (it covered content,
  // especially on phones). It starts from the user menu or the Help page.
  if (!active) return null;

  return (
    <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label="Product tour">
      {/* Dimmed backdrop with a rectangular cut-out around the highlighted
          element, drawn via an oversized box-shadow rather than an SVG mask
          — simpler, and the same trick works in every browser. */}
      {rect ? (
        <div
          className="pointer-events-none absolute rounded-lg ring-2 ring-primary transition-all duration-200"
          style={{
            top: rect.top - MARGIN,
            left: rect.left - MARGIN,
            width: rect.width + MARGIN * 2,
            height: rect.height + MARGIN * 2,
            boxShadow: "0 0 0 9999px hsl(var(--foreground) / 0.55)",
          }}
        />
      ) : (
        <div className="absolute inset-0 bg-foreground/55" />
      )}

      {/* Click the dimmed area to exit, same as Escape. */}
      <button
        type="button"
        aria-label="Close tour"
        onClick={stop}
        className="absolute inset-0"
        style={rect ? { clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)" } : undefined}
      />

      {step && (
        <TourCard
          step={step}
          rect={rect}
          index={stepIndex}
          total={STEPS.length}
          onNext={next}
          onBack={stepIndex > 0 ? back : undefined}
          onClose={stop}
        />
      )}
    </div>
  );
}

function TourCard({
  step,
  rect,
  index,
  total,
  onNext,
  onBack,
  onClose,
}: {
  step: TourStep;
  rect: DOMRect | null;
  index: number;
  total: number;
  onNext: () => void;
  onBack?: () => void;
  onClose: () => void;
}) {
  const cardStyle = placementStyle(step.placement, rect);

  return (
    <div
      className="absolute w-[min(320px,calc(100vw-2rem))] rounded-lg border border-border bg-popover p-4 text-popover-foreground shadow-xl"
      style={cardStyle}
    >
      <div className="mb-2 flex items-start justify-between gap-3">
        <p className="text-xs uppercase text-muted-foreground">
          {index + 1} of {total}
        </p>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close tour"
          className="-m-1 rounded p-1 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
      <h3 className="font-display text-lg text-foreground">{step.title}</h3>
      <p className="mt-1.5 text-sm text-muted-foreground">{step.body}</p>
      <div className="mt-4 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onClose}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Skip tour
        </button>
        <div className="flex gap-2">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="interactive min-h-[2.25rem] rounded-lg border border-border px-3 text-sm text-foreground hover:border-border-strong"
            >
              Back
            </button>
          )}
          <button
            type="button"
            onClick={onNext}
            className="interactive min-h-[2.25rem] rounded-lg bg-primary px-3 text-sm text-primary-foreground hover:bg-primary/90"
          >
            {index === total - 1 ? "Done" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Positions the tooltip near the target, clamped so it never runs off-screen. */
function placementStyle(
  placement: TourStep["placement"],
  rect: DOMRect | null
): React.CSSProperties {
  if (!rect) {
    return {
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
    };
  }

  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const cardWidth = Math.min(320, vw - 32);

  if (placement === "left") {
    return {
      top: Math.min(Math.max(rect.top, 16), vh - 220),
      left: Math.max(16, rect.left - cardWidth - MARGIN * 2),
    };
  }
  if (placement === "right") {
    return {
      top: Math.min(Math.max(rect.top, 16), vh - 220),
      left: Math.min(rect.right + MARGIN * 2, vw - cardWidth - 16),
    };
  }
  if (placement === "top") {
    return {
      top: Math.max(16, rect.top - MARGIN * 2 - 180),
      left: Math.min(Math.max(16, rect.left), vw - cardWidth - 16),
    };
  }
  // bottom (default) and the same-shaped "right" cases used above
  return {
    top: Math.min(rect.bottom + MARGIN * 2, vh - 220),
    left: Math.min(Math.max(16, rect.left), vw - cardWidth - 16),
  };
}

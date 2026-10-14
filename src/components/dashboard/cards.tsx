import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BookCheck,
  Brain,
  CalendarClock,
  ClipboardList,
  Crown,
  Flag,
  FlaskConical,
  Flame,
  Footprints,
  GraduationCap,
  Megaphone,
  NotebookPen,
  Trophy,
  X,
} from "lucide-react";

import { curriculum, findLesson, findSection, lessonPath, sectionPath } from "@/curriculum";
import type { AssignmentRow } from "@/hooks/useLearnerData";
import { ACHIEVEMENTS, type Achievement } from "@/lib/achievements";
import { cn } from "@/lib/utils";
import { simulationById } from "@/simulations/registry";
import type { SimulationDefinition } from "@/simulations/types";

export const BADGE_ICONS: Record<Achievement["icon"], typeof Trophy> = {
  Footprints,
  BookCheck,
  Flag,
  GraduationCap,
  FlaskConical,
  Trophy,
  Crown,
  Flame,
  Brain,
  NotebookPen,
};

/** Minutes read this week against the weekly goal, as a ring. */
export function WeeklyGoal({ minutes, goal }: { minutes: number; goal: number }) {
  const pct = Math.min(1, goal > 0 ? minutes / goal : 0);
  const r = 34;
  const c = 2 * Math.PI * r;
  const met = minutes >= goal;
  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 80 80" className="h-20 w-20 shrink-0 -rotate-90" role="img" aria-label={`${minutes} of ${goal} minutes this week`}>
        <circle cx="40" cy="40" r={r} fill="none" strokeWidth="8" className="stroke-secondary" />
        <motion.circle
          cx="40"
          cy="40"
          r={r}
          fill="none"
          strokeWidth="8"
          strokeLinecap="round"
          className="stroke-primary"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - pct) }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </svg>
      <div>
        <p className="text-xs uppercase text-muted-foreground">This week</p>
        <p className="figure text-2xl text-foreground">
          {minutes}
          <span className="text-base text-muted-foreground"> / {goal} min</span>
        </p>
        <p className="text-sm text-muted-foreground">{met ? "Goal met — nice." : `${goal - minutes} min to your goal`}</p>
      </div>
    </div>
  );
}

export function StreakBadge({ streak }: { streak: number }) {
  return (
    <div className="flex items-center gap-3">
      <span
        className={cn(
          "flex h-12 w-12 shrink-0 items-center justify-center rounded-full",
          streak > 0 ? "bg-floor/15 text-floor" : "bg-secondary text-muted-foreground"
        )}
        aria-hidden="true"
      >
        <Flame className="h-6 w-6" />
      </span>
      <div>
        <p className="text-xs uppercase text-muted-foreground">Streak</p>
        <p className="figure text-2xl text-foreground">
          {streak} <span className="text-base text-muted-foreground">{streak === 1 ? "day" : "days"}</span>
        </p>
        <p className="text-sm text-muted-foreground">{streak > 0 ? "Learn today to keep it going." : "Learn today to start one."}</p>
      </div>
    </div>
  );
}

const DISMISSED_KEY = "adtech-dismissed-announcements";

function readDismissed(): string[] {
  try {
    return JSON.parse(localStorage.getItem(DISMISSED_KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function Announcements({ items }: { items: Array<{ id: string; title: string; body: string; published_at: string }> }) {
  const [dismissed, setDismissed] = useState<string[]>(readDismissed);
  const visible = items.filter((a) => !dismissed.includes(a.id));
  if (visible.length === 0) return null;
  const dismiss = (id: string) => {
    const next = [...dismissed, id];
    setDismissed(next);
    try {
      localStorage.setItem(DISMISSED_KEY, JSON.stringify(next));
    } catch {
      // Session-only dismissal.
    }
  };
  return (
    <div className="mb-6 space-y-2">
      {visible.map((a) => (
        <div key={a.id} className="flex gap-3 rounded-lg border border-primary/30 bg-primary/5 p-4" role="status">
          <Megaphone className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <p className="text-foreground">{a.title}</p>
            <p className="mt-0.5 whitespace-pre-line text-sm text-muted-foreground">{a.body}</p>
          </div>
          <button
            type="button"
            onClick={() => dismiss(a.id)}
            aria-label={`Dismiss ${a.title}`}
            className="-m-1 h-8 w-8 shrink-0 rounded-md p-1.5 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      ))}
    </div>
  );
}

/** Resolve an assignment's target to a title and a link. */
export function assignmentTarget(a: Pick<AssignmentRow, "target_type" | "target_id">): { title: string; to: string } | null {
  if (a.target_type === "lesson") {
    const ref = findLesson(curriculum, a.target_id);
    return ref ? { title: ref.lesson.title, to: lessonPath(ref) } : null;
  }
  if (a.target_type === "section") {
    const s = findSection(curriculum, a.target_id);
    return s ? { title: `${s.bookChapter > 0 ? `Section ${s.number}: ` : ""}${s.title}`, to: sectionPath(s) } : null;
  }
  const sim = simulationById(a.target_id);
  return sim ? { title: `Simulator: ${sim.title}`, to: `/lab/${sim.id}` } : null;
}

export function AssignedToYou({
  items,
  isDone,
}: {
  items: AssignmentRow[];
  isDone: (a: AssignmentRow) => boolean;
}) {
  const open = items.filter((a) => !isDone(a));
  if (items.length === 0) return null;
  const today = new Date().toISOString().slice(0, 10);
  return (
    <section className="mb-10">
      <h2 className="mb-3 flex items-center gap-2 text-xl text-foreground">
        <ClipboardList className="h-5 w-5 text-primary" aria-hidden="true" />
        Assigned to you
      </h2>
      {open.length === 0 ? (
        <p className="text-sm text-muted-foreground">All caught up — every assignment is done.</p>
      ) : (
        <ul className="space-y-2">
          {open.map((a) => {
            const target = assignmentTarget(a);
            if (!target) return null;
            const overdue = a.due_date !== null && a.due_date < today;
            return (
              <li key={a.id}>
                <Link
                  to={target.to}
                  className="interactive flex items-center gap-3 rounded-lg border border-border bg-card p-4 hover:border-primary/40"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block text-foreground">{target.title}</span>
                    {a.note && <span className="block text-sm text-muted-foreground">{a.note}</span>}
                  </span>
                  {a.due_date && (
                    <span className={cn("figure inline-flex shrink-0 items-center gap-1 text-sm", overdue ? "text-nobid" : "text-muted-foreground")}>
                      <CalendarClock className="h-4 w-4" aria-hidden="true" />
                      {overdue ? "Overdue · " : "Due "}
                      {new Date(a.due_date + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                    </span>
                  )}
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export function TrySimulation({ sim, passed }: { sim: SimulationDefinition; passed: boolean }) {
  return (
    <Link
      to={`/lab/${sim.id}`}
      className="interactive shadow-card flex h-full flex-col rounded-lg border border-border bg-card p-5 hover:border-primary/40"
    >
      <p className="flex items-center gap-2 text-xs uppercase text-muted-foreground">
        <FlaskConical className="h-4 w-4 text-primary" aria-hidden="true" />
        Try it in the Lab
      </p>
      <p className="mt-2 text-lg text-foreground">{sim.title}</p>
      <p className="mt-1 flex-1 text-sm text-muted-foreground">{sim.tagline}</p>
      <p className="mt-4 inline-flex items-center gap-1 text-sm text-primary">
        {passed ? "Play again" : `Beat the challenge: ${sim.challenge.title}`}
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </p>
    </Link>
  );
}

export function RecentBadges({ badges }: { badges: Array<{ badge_id: string; earned_at: string }> }) {
  const recent = [...badges].sort((a, b) => b.earned_at.localeCompare(a.earned_at)).slice(0, 6);
  if (recent.length === 0) return null;
  return (
    <section className="mb-10">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-xl text-foreground">Recent badges</h2>
        <Link to="/profile" className="text-sm text-primary hover:underline">
          All {badges.length} of {ACHIEVEMENTS.length}
        </Link>
      </div>
      <ul className="flex flex-wrap gap-3">
        {recent.map((b) => {
          const a = ACHIEVEMENTS.find((x) => x.id === b.badge_id);
          if (!a) return null;
          const Icon = BADGE_ICONS[a.icon];
          return (
            <li key={b.badge_id} className="flex items-center gap-2 rounded-full border border-border bg-card py-1.5 pl-1.5 pr-3" title={a.description}>
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/15 text-primary" aria-hidden="true">
                <Icon className="h-4 w-4" />
              </span>
              <span className="text-sm text-foreground">{a.title}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

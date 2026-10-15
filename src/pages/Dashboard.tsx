import { useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Check } from "lucide-react";

import {
  Announcements,
  AssignedToYou,
  RecentBadges,
  StreakBadge,
  TrySimulation,
  WeeklyGoal,
} from "@/components/dashboard/cards";
import { curriculum, lessonPath, sectionPath } from "@/curriculum";
import type { Section } from "@/curriculum/types";
import { useAnnouncements, useLearnerStats, useMyAssignments } from "@/hooks/useLearnerData";
import { useProgress } from "@/hooks/useProgress";
import { useSimProgress } from "@/hooks/useSimProgress";
import { firstNameFor, useAuth } from "@/lib/auth/AuthProvider";
import { buildLearningPath, nextOnPath, parseLearningPath, TEAMS, type Focus } from "@/lib/learningPath";
import { cn } from "@/lib/utils";
import { SIMULATIONS, simulationForSection } from "@/simulations/registry";

/**
 * The journey home.
 *
 * Day 0 deliberately shows no percentage, no 0-of-73 counter and no empty
 * meters: a zero scoreboard is a scoreboard of failure, shown to the most
 * anxious reader on their most anxious day. The next-action card sits in the
 * same place at the same size on day 0 and day 40, so the eye learns one
 * location.
 */
export default function Dashboard() {
  const { book, resume, hasStarted, forSection, isComplete } = useProgress();
  const { profile } = useAuth();
  const { data: stats } = useLearnerStats();
  const { data: assignments = [] } = useMyAssignments();
  const { data: announcements = [] } = useAnnouncements();
  const { progress: simProgress } = useSimProgress();
  const finishedBook = book.done === book.total && book.total > 0;
  const name = firstNameFor(profile);

  // The personalised path from onboarding orders the sections and picks the
  // next lesson; without one, the book's own order is the path.
  const path = useMemo(
    () => parseLearningPath(profile?.learning_path) ?? buildLearningPath(profile?.team ?? null, {}),
    [profile?.learning_path, profile?.team]
  );
  const allSections = curriculum.flatMap((part) => part.sections);
  const sections = path.order.map((id) => allSections.find((s) => s.id === id)).filter((s): s is Section => Boolean(s));
  const resumeDone = resume ? isComplete(resume.lesson.id) : false;
  const next = !hasStarted || resumeDone ? nextOnPath(path, isComplete) ?? resume : resume;

  // A simulator for where the learner is, preferring one not yet beaten.
  const currentSection = next?.section.id ?? path.order[0];
  const sim =
    [simulationForSection(currentSection), ...SIMULATIONS].find((s) => s && !simProgress[s.id]?.challenge_passed_at) ??
    simulationForSection(currentSection);

  const assignmentDone = (a: { target_type: string; target_id: string }) => {
    if (a.target_type === "lesson") return isComplete(a.target_id);
    if (a.target_type === "section") {
      const s = allSections.find((x) => x.id === a.target_id);
      return Boolean(s && s.lessons.every((l) => isComplete(l.id)));
    }
    return Boolean(simProgress[a.target_id]?.challenge_passed_at);
  };

  return (
    <div>
      <header className="mb-8">
        <h1 className="font-display text-3xl text-foreground">
          {hasStarted ? "Welcome back" : "Welcome"}
          {name ? `, ${name}` : ""}
        </h1>
        {hasStarted ? (
          <div className="mt-4 max-w-md">
            <div
              role="progressbar"
              aria-label="Book progress"
              aria-valuenow={book.pct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuetext={`${book.done} of ${book.total} lessons complete`}
              className="h-2 w-full overflow-hidden rounded-full bg-secondary"
            >
              <div className="h-full bg-primary transition-[width] duration-500 ease-out" style={{ width: `${book.pct}%` }} />
            </div>
            <p className="figure mt-2 text-sm text-muted-foreground">
              {book.done} of {book.total} lessons · {book.pct}% of the book
            </p>
          </div>
        ) : (
          <p className="measure mt-2 text-muted-foreground">
            This is the AdTech book, rebuilt as something you can click through. Eleven sections,{" "}
            {book.total} lessons, about {Math.round(book.minutesTotal / 60)} hours if you read every
            word — ordered for {profile?.team ? `your team (${profile.team})` : "you"}.
          </p>
        )}
      </header>

      {profile?.team && !(TEAMS as readonly string[]).includes(profile.team) && (
        <div className="mb-6 flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card p-4 text-sm">
          <span className="min-w-0 flex-1 text-muted-foreground">
            Your team is saved as “{profile.team}”, which is no longer on the team list. Pick your team to refresh your path.
          </span>
          <Link to="/welcome" className="interactive inline-flex min-h-[2.5rem] items-center rounded-lg border border-border px-3 text-foreground hover:border-primary/40">
            Update my team
          </Link>
        </div>
      )}

      <Announcements items={announcements} />

      {/* The next action. Same position, day 0 and day 40. */}
      {next && (
        <section className="shadow-card mb-10 rounded-lg border border-border bg-card p-6" data-tour="next-action">
          <p className="text-xs uppercase text-muted-foreground">
            {finishedBook
              ? "You've finished the book"
              : hasStarted
                ? "Pick up where you left off"
                : "Start here"}
          </p>
          <h2 className="mt-2 text-xl text-foreground">
            {next.section.bookChapter > 0
              ? `Section ${next.section.number} · ${next.section.title}`
              : next.section.title}
          </h2>
          <p className="measure mt-1 text-muted-foreground">{next.lesson.title}</p>
          <div className="mt-5 flex flex-wrap items-center gap-4">
            <Link
              to={lessonPath(next)}
              className="interactive inline-flex min-h-[2.75rem] items-center gap-2 rounded-lg bg-primary px-5 text-base text-primary-foreground hover:bg-primary/90"
            >
              {hasStarted ? (resumeDone ? "Up next" : "Continue") : `Start section ${next.section.number}`}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <span className="figure text-sm text-muted-foreground">
              ~{next.lesson.minutes} min
            </span>
          </div>
        </section>
      )}

      {/* Habit: weekly goal and streak, once there's something to show. */}
      {hasStarted && stats && (
        <section className="mb-10 grid gap-4 sm:grid-cols-2" aria-label="This week">
          <div className="rounded-lg border border-border bg-card p-5">
            <WeeklyGoal minutes={stats.weekMinutes} goal={profile?.weekly_minutes_goal ?? 60} />
          </div>
          <div className="rounded-lg border border-border bg-card p-5">
            <StreakBadge streak={stats.streak} />
          </div>
        </section>
      )}

      <AssignedToYou items={assignments} isDone={assignmentDone} />

      {sim && (
        <section className="mb-10">
          <TrySimulation sim={sim} passed={Boolean(simProgress[sim.id]?.challenge_passed_at)} />
        </section>
      )}

      {stats && <RecentBadges badges={stats.badges} />}

      <section>
        <h2 className="mb-4 text-xl text-foreground">
          {hasStarted ? "Your path" : "Your path through the book"}
        </h2>
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3" data-tour="sections">
          {sections.map((section) => (
            <SectionCard
              key={section.id}
              section={section}
              progress={forSection(section)}
              showProgress={hasStarted}
              focus={path.focus[section.id]}
              team={profile?.team ?? null}
            />
          ))}
        </ul>
      </section>

      <p className="measure mt-10 text-sm text-muted-foreground">
        Read in your path's order, or jump anywhere — nothing is locked. Progress is saved to your
        account so your onboarding lead can help you along; your notes stay private to you.
      </p>
    </div>
  );
}

function SectionCard({
  section,
  progress,
  showProgress,
  focus,
  team,
}: {
  section: Section;
  progress: { done: number; total: number };
  showProgress: boolean;
  focus?: Focus;
  team: string | null;
}) {
  const { done, total } = progress;
  const finished = done === total && total > 0;
  const Icon = section.icon;

  return (
    <li>
      <Link
        to={sectionPath(section)}
        className="interactive shadow-card flex h-full flex-col rounded-lg border border-border bg-card p-4 hover:border-primary/40"
      >
        <div className="flex items-center gap-2.5">
          <Icon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <span className="figure text-xs text-muted-foreground">
            {section.bookChapter > 0 ? `Section ${section.number}` : "Appendix"}
          </span>
          {finished && showProgress ? (
            <Check className="ml-auto h-4 w-4 text-primary" aria-hidden="true" />
          ) : focus === "core" ? (
            <span className="ml-auto rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-xs text-primary">
              {team ? `Key for ${team}` : "Key"}
            </span>
          ) : focus === "skim" ? (
            <span className="ml-auto rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground">Skim</span>
          ) : null}
        </div>

        <h3 className="mt-2 text-lg text-foreground">{section.title}</h3>
        <p className="mt-1 flex-1 text-sm text-muted-foreground">{section.summary}</p>

        {showProgress ? (
          <div className="mt-4">
            <div className="flex gap-0.5" aria-hidden="true">
              {section.lessons.map((lesson, i) => (
                <span
                  key={lesson.id}
                  className={cn(
                    "h-1 flex-1 rounded-full transition-colors duration-300",
                    i < done ? "bg-primary" : "bg-secondary"
                  )}
                />
              ))}
            </div>
            <p className="figure mt-1.5 text-xs text-muted-foreground">
              {done} of {total} lessons
            </p>
          </div>
        ) : (
          <p className="figure mt-4 text-xs text-muted-foreground">{total} lessons</p>
        )}
      </Link>
    </li>
  );
}

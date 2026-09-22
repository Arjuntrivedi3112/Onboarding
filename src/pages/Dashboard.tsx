import { Link } from "react-router-dom";
import { ArrowRight, Check } from "lucide-react";

import { curriculum, lessonPath, sectionPath } from "@/curriculum";
import type { Section } from "@/curriculum/types";
import { useProgress } from "@/hooks/useProgress";
import { cn } from "@/lib/utils";

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
  const { book, resume, hasStarted, forSection } = useProgress();
  const sections = curriculum.flatMap((part) => part.sections);
  const finishedBook = book.done === book.total && book.total > 0;

  return (
    <div>
      <header className="mb-8">
        <h1 className="font-display text-3xl text-foreground">
          {hasStarted ? "Welcome back" : "Welcome"}
        </h1>
        {hasStarted ? (
          <div className="mt-4 max-w-md">
            <div
              role="progressbar"
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
            word.
          </p>
        )}
      </header>

      {/* The next action. Same position, day 0 and day 40. */}
      {resume && (
        <section className="shadow-card mb-10 rounded-lg border border-border bg-card p-6" data-tour="next-action">
          <p className="text-xs uppercase text-muted-foreground">
            {finishedBook
              ? "You've finished the book"
              : hasStarted
                ? "Pick up where you left off"
                : "Start here"}
          </p>
          <h2 className="mt-2 text-xl text-foreground">
            {resume.section.bookChapter > 0
              ? `Section ${resume.section.number} · ${resume.section.title}`
              : resume.section.title}
          </h2>
          <p className="measure mt-1 text-muted-foreground">{resume.lesson.title}</p>
          <div className="mt-5 flex flex-wrap items-center gap-4">
            <Link
              to={lessonPath(resume)}
              className="interactive inline-flex min-h-[2.75rem] items-center gap-2 rounded-lg bg-primary px-5 text-base text-primary-foreground hover:bg-primary/90"
            >
              {hasStarted ? "Continue" : `Start section ${resume.section.number}`}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <span className="figure text-sm text-muted-foreground">
              ~{resume.lesson.minutes} min
            </span>
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-4 text-xl text-foreground">
          {hasStarted ? "Your sections" : "What's covered"}
        </h2>
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3" data-tour="sections">
          {sections.map((section) => (
            <SectionCard
              key={section.id}
              section={section}
              progress={forSection(section)}
              showProgress={hasStarted}
            />
          ))}
        </ul>
      </section>

      <p className="measure mt-10 text-sm text-muted-foreground">
        Read in order, or jump anywhere. Nothing is locked, nothing is timed, and nothing is
        reported to anyone.
      </p>
    </div>
  );
}

function SectionCard({
  section,
  progress,
  showProgress,
}: {
  section: Section;
  progress: { done: number; total: number };
  showProgress: boolean;
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
          {finished && showProgress && (
            <Check className="ml-auto h-4 w-4 text-primary" aria-hidden="true" />
          )}
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

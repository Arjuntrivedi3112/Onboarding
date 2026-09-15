import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, ChevronDown } from "lucide-react";

import { ChainRail } from "@/components/journey/ChainRail";
import type { LessonContent } from "@/components/journey/lesson-content";
import { chainFocusFor } from "@/curriculum/chain";
import { lessonPath, sectionPath } from "@/curriculum";
import type { LessonRef } from "@/curriculum/types";
import { cn } from "@/lib/utils";

interface LessonShellProps {
  refInfo: LessonRef;
  content: LessonContent;
  prev: LessonRef | null;
  next: LessonRef | null;
  isComplete: boolean;
  onToggleComplete: () => void;
}

/**
 * The chrome around every lesson, in one fixed vertical order.
 *
 * Predictability is the product here: a learner who has read two lessons
 * should know exactly where the takeaways and the next link will be in the
 * other 77.
 */
export function LessonShell({
  refInfo,
  content,
  prev,
  next,
  isComplete,
  onToggleComplete,
}: LessonShellProps) {
  const { lesson, section } = refInfo;
  const lessonNumber = section.lessons.findIndex((l) => l.id === lesson.id) + 1;
  const { Body } = content;

  return (
    <article className="pb-32">
      {/* 1. Eyebrow — the only position indicator inside a lesson. */}
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <Link
          to={sectionPath(section)}
          className="text-xs uppercase text-muted-foreground hover:text-foreground"
        >
          {section.bookChapter > 0 ? `Section ${section.number}` : "Appendix"} · {section.title}
        </Link>
        <span className="figure text-xs text-muted-foreground">
          Lesson {lessonNumber} of {section.lessons.length}
        </span>
      </div>

      {/* 2. Title, reading time, and the completed badge once earned. */}
      <h1 className="font-display text-3xl text-foreground">{lesson.title}</h1>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <span className="figure text-sm text-muted-foreground">~{lesson.minutes} min</span>
        {isComplete && (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-sm text-primary">
            <Check className="h-3.5 w-3.5" aria-hidden="true" />
            Completed
          </span>
        )}
      </div>

      {/* 3. The chain rail, dimmed except this section's links. */}
      <ChainRail focus={chainFocusFor(section.id)} className="my-6" />

      {/* 4. Why this matters. */}
      <section className="mb-8">
        <h2 className="mb-2 text-xl text-foreground">Why this matters</h2>
        <div className="measure text-muted-foreground">{content.whyThisMatters}</div>
      </section>

      {/* 5. What you'll be able to do. */}
      <section className="mb-10">
        <h2 className="mb-3 text-xl text-foreground">What you'll be able to do</h2>
        <ul className="measure space-y-2">
          {content.objectives.map((objective) => (
            <li key={objective} className="flex gap-3 text-muted-foreground">
              <span aria-hidden="true" className="mt-2 h-1 w-1 shrink-0 rounded-full bg-primary" />
              <span>{objective}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* 6. The lesson body. */}
      <section className="mb-12">
        <Body />
      </section>

      {/* 7. Key takeaways. */}
      <section className="mb-10 rounded-lg border border-border bg-card p-6">
        <h2 className="mb-4 text-xl text-foreground">Key takeaways</h2>
        <ol className="space-y-3">
          {content.takeaways.map((takeaway, i) => (
            <li key={takeaway} className="flex gap-3">
              <span className="figure shrink-0 text-sm text-primary">{i + 1}</span>
              <span className="text-foreground">{takeaway}</span>
            </li>
          ))}
        </ol>
      </section>

      {/* 8. Check yourself — self-scored, never stored. */}
      {content.checkYourself.length > 0 && (
        <section className="mb-12">
          <h2 className="mb-1 text-xl text-foreground">Check yourself</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Answer these in your head first. Nothing here is scored or recorded.
          </p>
          <div className="space-y-3">
            {content.checkYourself.map((item) => (
              <SelfCheck key={item.question} question={item.question} answer={item.answer} />
            ))}
          </div>
        </section>
      )}

      {/* An inline next-up card where reading naturally stops. */}
      {next && (
        <Link
          to={lessonPath(next)}
          className="mb-8 flex items-center justify-between gap-4 rounded-lg border border-border bg-card p-5 hover:border-border-strong"
        >
          <span className="min-w-0">
            <span className="block text-xs uppercase text-muted-foreground">Up next</span>
            <span className="mt-1 block text-foreground">{next.lesson.title}</span>
          </span>
          <span className="figure flex shrink-0 items-center gap-2 text-sm text-muted-foreground">
            ~{next.lesson.minutes} min
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </span>
        </Link>
      )}

      {/* 9. Footer: prev, mark complete, next. */}
      <LessonFooter
        prev={prev}
        next={next}
        isComplete={isComplete}
        onToggleComplete={onToggleComplete}
      />
    </article>
  );
}

function SelfCheck({ question, answer }: { question: string; answer: React.ReactNode }) {
  const [shown, setShown] = useState(false);

  return (
    <div className="rounded-lg border border-border bg-card">
      <p className="px-4 pt-4 text-foreground">{question}</p>
      <button
        type="button"
        onClick={() => setShown((value) => !value)}
        aria-expanded={shown}
        className="flex items-center gap-1.5 px-4 py-3 text-sm text-primary hover:underline"
      >
        {shown ? "Hide answer" : "Show answer"}
        <ChevronDown
          className={cn("h-4 w-4 transition-transform", shown && "rotate-180")}
          aria-hidden="true"
        />
      </button>
      {shown && <div className="measure border-t border-border px-4 py-3 text-muted-foreground">{answer}</div>}
    </div>
  );
}

function LessonFooter({
  prev,
  next,
  isComplete,
  onToggleComplete,
}: {
  prev: LessonRef | null;
  next: LessonRef | null;
  isComplete: boolean;
  onToggleComplete: () => void;
}) {
  return (
    <div className="border-t border-border pt-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={onToggleComplete}
          aria-pressed={isComplete}
          className={cn(
            "inline-flex min-h-[2.75rem] items-center justify-center gap-2 rounded-lg px-5 text-base transition-colors sm:order-2",
            isComplete
              ? "border border-border-strong text-foreground hover:bg-secondary"
              : "bg-primary text-primary-foreground hover:opacity-90"
          )}
        >
          {isComplete ? (
            <>
              <Check className="h-4 w-4" aria-hidden="true" />
              Completed — undo
            </>
          ) : (
            "Mark this lesson complete"
          )}
        </button>

        <div className="flex gap-3 sm:order-1 sm:flex-1">
          {prev && (
            <Link
              to={lessonPath(prev)}
              className="inline-flex min-h-[2.75rem] flex-1 items-center gap-2 rounded-lg border border-border px-4 text-sm text-muted-foreground hover:text-foreground sm:flex-none"
            >
              <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="truncate">{prev.lesson.title}</span>
            </Link>
          )}
        </div>

        <div className="flex gap-3 sm:order-3 sm:flex-1 sm:justify-end">
          {next && (
            <Link
              to={lessonPath(next)}
              className="inline-flex min-h-[2.75rem] flex-1 items-center justify-end gap-2 rounded-lg border border-border px-4 text-sm text-muted-foreground hover:text-foreground sm:flex-none"
            >
              <span className="truncate">{next.lesson.title}</span>
              <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

import { Link, Navigate, useParams } from "react-router-dom";
import { ArrowRight, Check } from "lucide-react";

import { ChainRail } from "@/components/journey/ChainRail";
import { chainFocusFor } from "@/curriculum/chain";
import { curriculum, findSection, lessonPath } from "@/curriculum";
import { useProgress } from "@/hooks/useProgress";
import { cn } from "@/lib/utils";

/** A section overview: what it covers, and every lesson inside it. */
export default function SectionPage() {
  const { sectionId } = useParams<{ sectionId: string }>();
  const section = sectionId ? findSection(curriculum, sectionId) : null;
  const { isComplete, isVisited, forSection } = useProgress();

  if (!section) return <Navigate to="/dashboard" replace />;

  const part = curriculum.find((p) => p.sections.some((s) => s.id === section.id))!;
  const { done, total } = forSection(section);
  const totalMinutes = section.lessons.reduce((n, lesson) => n + lesson.minutes, 0);
  const firstUnfinished = section.lessons.find((lesson) => !isComplete(lesson.id));

  return (
    <div>
      <p className="text-xs uppercase text-muted-foreground">
        {section.bookChapter > 0
          ? `Section ${section.number} · Chapter ${section.bookChapter} of the book`
          : "Appendix · not part of the book"}
      </p>
      <h1 className="mt-2 font-display text-3xl text-foreground">{section.title}</h1>
      <p className="measure mt-3 text-muted-foreground">{section.summary}</p>

      <div className="figure mt-4 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
        <span>
          {section.lessons.length} lessons · about {totalMinutes} min
        </span>
        {done > 0 && (
          <span className="text-primary">
            {done} of {total} complete
          </span>
        )}
      </div>

      <ChainRail focus={chainFocusFor(section.id)} className="my-8" />

      {firstUnfinished && (
        <Link
          to={lessonPath({ lesson: firstUnfinished, section, part, index: 0 })}
          className="interactive mb-8 inline-flex min-h-[2.75rem] items-center gap-2 rounded-lg bg-primary px-5 text-base text-primary-foreground hover:bg-primary/90"
        >
          {done > 0 ? "Continue this section" : "Start section"}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      )}

      <ol className="space-y-2">
        {section.lessons.map((lesson, i) => {
          const complete = isComplete(lesson.id);
          const visited = isVisited(lesson.id);

          return (
            <li key={lesson.id}>
              <Link
                to={lessonPath({ lesson, section, part, index: 0 })}
                className="interactive shadow-card flex items-start gap-4 rounded-lg border border-border bg-card p-4 hover:border-primary/40"
              >
                <span
                  className={cn(
                    "figure mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs",
                    complete
                      ? "bg-primary text-primary-foreground"
                      : "border border-border-strong text-muted-foreground"
                  )}
                >
                  {complete ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : i + 1}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block text-foreground">{lesson.title}</span>
                  <span className="mt-0.5 block text-sm text-muted-foreground">
                    {lesson.summary}
                  </span>
                </span>

                <span className="figure shrink-0 text-xs text-muted-foreground">
                  {complete ? "Done" : visited ? "Opened" : `~${lesson.minutes} min`}
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

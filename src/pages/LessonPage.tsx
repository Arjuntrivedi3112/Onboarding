import { Suspense, useEffect, useMemo } from "react";
import { Link, Navigate, useParams } from "react-router-dom";

import { LessonShell } from "@/components/journey/LessonShell";
import { loadLessonContent } from "@/components/journey/lesson-registry";
import { lessonBySlug, lessonPath, sectionPath } from "@/curriculum";
import { useAdjacentLessons, useProgress } from "@/hooks/useProgress";

export default function LessonPage() {
  const { sectionId, lessonSlug } = useParams<{ sectionId: string; lessonSlug: string }>();
  const refInfo = sectionId && lessonSlug ? lessonBySlug(sectionId, lessonSlug) : null;

  const { isComplete, toggleComplete, recordVisit } = useProgress();
  const { prev, next } = useAdjacentLessons(refInfo?.lesson.id ?? "");

  const LessonContentComponent = useMemo(
    () => (refInfo ? loadLessonContent(refInfo.section.id, refInfo.lesson.slug) : null),
    [refInfo]
  );

  const lessonId = refInfo?.lesson.id;
  const sectionKey = refInfo?.section.id;
  const path = refInfo ? lessonPath(refInfo) : null;

  useEffect(() => {
    if (lessonId && sectionKey && path) recordVisit(lessonId, sectionKey, path);
  }, [lessonId, sectionKey, path, recordVisit]);

  if (!refInfo) return <Navigate to="/dashboard" replace />;

  const complete = isComplete(refInfo.lesson.id);

  if (!LessonContentComponent) {
    return <LessonPlaceholder refInfo={refInfo} />;
  }

  return (
    <Suspense fallback={<LessonSkeleton />}>
      <LessonContentComponent
        render={(content) => (
          <LessonShell
            refInfo={refInfo}
            content={content}
            prev={prev}
            next={next}
            isComplete={complete}
            onToggleComplete={() => toggleComplete(refInfo.lesson.id)}
          />
        )}
      />
    </Suspense>
  );
}

function LessonSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-live="polite">
      <div className="h-3 w-40 rounded bg-secondary" />
      <div className="h-9 w-2/3 rounded bg-secondary" />
      <div className="h-24 rounded bg-secondary" />
      <span className="sr-only">Loading lesson</span>
    </div>
  );
}

/**
 * Shown when a lesson exists in the curriculum but has no content file yet.
 * The journey stays navigable rather than breaking on a missing import.
 */
function LessonPlaceholder({ refInfo }: { refInfo: NonNullable<ReturnType<typeof lessonBySlug>> }) {
  const { lesson, section } = refInfo;

  return (
    <div>
      <Link
        to={sectionPath(section)}
        className="text-xs uppercase text-muted-foreground hover:text-foreground"
      >
        {section.bookChapter > 0 ? `Section ${section.number}` : "Appendix"} · {section.title}
      </Link>
      <h1 className="mt-2 font-display text-3xl text-foreground">{lesson.title}</h1>
      <p className="measure mt-3 text-muted-foreground">{lesson.summary}</p>
      <div className="mt-8 rounded-lg border border-border bg-card p-6">
        <p className="text-foreground">This lesson is still being written.</p>
        <p className="measure mt-2 text-sm text-muted-foreground">
          The rest of the section is available now.
        </p>
        <Link
          to={sectionPath(section)}
          className="mt-4 inline-flex min-h-[2.75rem] items-center rounded-lg border border-border-strong px-4 text-sm text-foreground hover:bg-secondary"
        >
          Back to {section.title}
        </Link>
      </div>
    </div>
  );
}

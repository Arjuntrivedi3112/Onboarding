import { Suspense, useEffect, useMemo } from "react";
import { Link, Navigate, useLocation, useNavigate, useParams } from "react-router-dom";

import { LessonShell } from "@/components/journey/LessonShell";
import { loadLessonContent } from "@/components/journey/lesson-registry";
import { ReadingProgress } from "@/components/journey/ReadingProgress";
import { lessonBySlug, lessonPath, sectionPath } from "@/curriculum";
import type { LessonRef } from "@/curriculum/types";
import { useAdjacentLessons, useProgress } from "@/hooks/useProgress";
import { scrollToRenderedText } from "@/lib/scrollToText";

/**
 * When the command palette sends someone to a specific paragraph (not just
 * the lesson), the target text arrives as router state. The lazy-loaded
 * lesson component and the page's own enter transition both mount
 * asynchronously, so this polls briefly rather than assuming the DOM is
 * ready on the next tick. Consumes the state once so navigating away and
 * back, or hitting refresh, doesn't repeat the jump.
 */
function useScrollToSearchMatch() {
  const location = useLocation();
  const navigate = useNavigate();
  const target = (location.state as { scrollToText?: string } | null)?.scrollToText;

  useEffect(() => {
    if (!target) return;

    let attempts = 0;
    let cancelled = false;

    function tryScroll() {
      if (cancelled) return;
      const root = document.getElementById("main");
      const found = root ? scrollToRenderedText(root, target) : false;
      attempts += 1;
      if (!found && attempts < 30) {
        requestAnimationFrame(tryScroll);
      } else {
        // Clear the state either way so this never fires again for this entry.
        navigate(location.pathname, { replace: true, state: {} });
      }
    }

    const raf = requestAnimationFrame(tryScroll);
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
    // Only the target and pathname identify "a fresh jump to act on" — leaving
    // navigate/location.state out avoids re-running when this effect's own
    // state-clearing triggers a re-render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, location.pathname]);
}

/** True while the user is typing or interacting with a control — [ and ] must not hijack that. */
function isTypingTarget(el: Element | null): boolean {
  if (!el) return false;
  const tag = el.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    (el as HTMLElement).isContentEditable
  );
}

/** [ and ] move to the previous/next lesson — a quiet power-user shortcut, never the only way. */
function useLessonKeyboardNav(prev: LessonRef | null, next: LessonRef | null) {
  const navigate = useNavigate();

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (isTypingTarget(document.activeElement)) return;

      if (event.key === "[" && prev) {
        event.preventDefault();
        navigate(lessonPath(prev));
      } else if (event.key === "]" && next) {
        event.preventDefault();
        navigate(lessonPath(next));
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [prev, next, navigate]);
}

export default function LessonPage() {
  const { sectionId, lessonSlug } = useParams<{ sectionId: string; lessonSlug: string }>();
  const refInfo = sectionId && lessonSlug ? lessonBySlug(sectionId, lessonSlug) : null;

  const { isComplete, toggleComplete, recordVisit } = useProgress();
  const { prev, next } = useAdjacentLessons(refInfo?.lesson.id ?? "");
  useLessonKeyboardNav(prev, next);
  useScrollToSearchMatch();

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
    <>
      <ReadingProgress />
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
    </>
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

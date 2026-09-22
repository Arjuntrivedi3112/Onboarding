/**
 * React binding for the progress store.
 *
 * `useSyncExternalStore` keeps this correct across tabs and reads
 * synchronously on first paint, so the percentage never flickers 0% -> 34%.
 */

import { useCallback, useMemo, useSyncExternalStore } from "react";

import {
  addBookmark,
  getServerSnapshot,
  getSnapshot,
  markComplete,
  markIncomplete,
  recordScroll,
  recordVisit,
  removeBookmark,
  resetProgress,
  subscribe,
  toggleBookmark,
  toggleComplete,
} from "@/lib/progress";
import { curriculum, lessonList } from "@/curriculum";
import {
  adjacentLessons,
  bookProgress,
  overallProgress,
  resumeLesson,
  sectionProgress,
} from "@/curriculum/selectors";
import type { LessonRef, ProgressSummary, Section } from "@/curriculum/types";

export function useProgressState() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function useProgress() {
  const state = useProgressState();

  const book = useMemo(() => bookProgress(curriculum, state.completed), [state.completed]);
  const overall = useMemo(() => overallProgress(curriculum, state.completed), [state.completed]);

  const resume = useMemo(
    () => resumeLesson(curriculum, state.completed, state.resume?.lessonId ?? null),
    [state.completed, state.resume?.lessonId]
  );

  const isComplete = useCallback(
    (lessonId: string) => Boolean(state.completed[lessonId]),
    [state.completed]
  );

  const isVisited = useCallback(
    (lessonId: string) => Boolean(state.visited[lessonId]),
    [state.visited]
  );

  const forSection = useCallback(
    (section: Section): ProgressSummary => sectionProgress(section, state.completed),
    [state.completed]
  );

  const isBookmarked = useCallback(
    (lessonId: string) => Boolean(state.bookmarks[lessonId]),
    [state.bookmarks]
  );

  // Newest first, so a recently-starred lesson surfaces at the top of the
  // bookmarks page rather than getting buried in book order.
  const bookmarkedLessons = useMemo(() => {
    return lessonList
      .filter((ref) => state.bookmarks[ref.lesson.id])
      .sort(
        (a, b) =>
          new Date(state.bookmarks[b.lesson.id]).getTime() -
          new Date(state.bookmarks[a.lesson.id]).getTime()
      );
  }, [state.bookmarks]);

  return {
    state,
    /** Headline, minute-weighted, chapters 1-11 only. */
    book,
    /** Everything including the appendix. Not shown as the headline. */
    overall,
    /** Where "Continue" goes. */
    resume,
    /** True once any lesson has been completed or opened. */
    hasStarted: Boolean(state.startedAt),
    isComplete,
    isVisited,
    forSection,
    isBookmarked,
    bookmarkedLessons,
    markComplete,
    markIncomplete,
    toggleComplete,
    addBookmark,
    removeBookmark,
    toggleBookmark,
    recordVisit,
    recordScroll,
    resetProgress,
  };
}

/** Prev/next for a lesson, in journey order and across section boundaries. */
export function useAdjacentLessons(lessonId: string): {
  prev: LessonRef | null;
  next: LessonRef | null;
} {
  return useMemo(() => adjacentLessons(curriculum, lessonId), [lessonId]);
}

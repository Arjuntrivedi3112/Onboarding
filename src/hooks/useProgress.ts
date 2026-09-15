/**
 * React binding for the progress store.
 *
 * `useSyncExternalStore` keeps this correct across tabs and reads
 * synchronously on first paint, so the percentage never flickers 0% -> 34%.
 */

import { useCallback, useMemo, useSyncExternalStore } from "react";

import {
  getServerSnapshot,
  getSnapshot,
  markComplete,
  markIncomplete,
  recordScroll,
  recordVisit,
  resetProgress,
  subscribe,
  toggleComplete,
} from "@/lib/progress";
import { curriculum } from "@/curriculum/data";
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
    markComplete,
    markIncomplete,
    toggleComplete,
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

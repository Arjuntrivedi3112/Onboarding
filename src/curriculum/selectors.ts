/**
 * Pure derivations over the curriculum and a set of completed lesson ids.
 *
 * Kept free of React and of the storage layer so the progress maths can be
 * reasoned about (and tested) on its own.
 */

import type { Lesson, LessonRef, Part, ProgressSummary, Section } from "./types";

/** Every lesson in journey order, with its section and part attached. */
export function flattenLessons(parts: Part[]): LessonRef[] {
  const refs: LessonRef[] = [];
  parts.forEach((part) => {
    part.sections.forEach((section) => {
      section.lessons.forEach((lesson) => {
        refs.push({ lesson, section, part, index: refs.length });
      });
    });
  });
  return refs;
}

export function allSections(parts: Part[]): Section[] {
  return parts.flatMap((part) => part.sections);
}

/**
 * Round a completion fraction so the number never lies:
 * - nothing done reads 0
 * - anything done reads at least 1
 * - anything outstanding reads at most 99
 */
function honestPct(done: number, total: number): number {
  if (total <= 0) return 0;
  if (done <= 0) return 0;
  if (done >= total) return 100;
  return Math.min(99, Math.max(1, Math.round((done / total) * 100)));
}

function summarise(lessons: Lesson[], completed: Record<string, string>): ProgressSummary {
  const total = lessons.length;
  const doneLessons = lessons.filter((lesson) => Boolean(completed[lesson.id]));
  const minutesTotal = lessons.reduce((sum, lesson) => sum + lesson.minutes, 0);
  const minutesDone = doneLessons.reduce((sum, lesson) => sum + lesson.minutes, 0);
  return {
    done: doneLessons.length,
    total,
    pct: honestPct(doneLessons.length, total),
    minutesDone,
    minutesTotal,
  };
}

export function sectionProgress(
  section: Section,
  completed: Record<string, string>
): ProgressSummary {
  return summarise(section.lessons, completed);
}

export function overallProgress(
  parts: Part[],
  completed: Record<string, string>
): ProgressSummary {
  return summarise(
    flattenLessons(parts).map((ref) => ref.lesson),
    completed
  );
}

/**
 * The headline number: progress across book chapters 1-11 only.
 *
 * Minute-weighted, not lesson-counted. Lessons genuinely run 5 to 12 minutes,
 * so equal weighting would make the bar leap on cheap lessons and stall on
 * expensive ones. `minutes` is author-set and committed with the content, so
 * the denominator is stable.
 *
 * The appendix, ecosystem map, glossary, library and notes are all outside
 * this denominator — finishing the book must read 100%.
 */
export function bookProgress(
  parts: Part[],
  completed: Record<string, string>
): ProgressSummary {
  const lessons = allSections(parts)
    .filter((section) => section.bookChapter > 0)
    .flatMap((section) => section.lessons);

  const minutesTotal = lessons.reduce((sum, lesson) => sum + lesson.minutes, 0);
  const doneLessons = lessons.filter((lesson) => Boolean(completed[lesson.id]));
  const minutesDone = doneLessons.reduce((sum, lesson) => sum + lesson.minutes, 0);

  return {
    done: doneLessons.length,
    total: lessons.length,
    pct: honestPct(minutesDone, minutesTotal),
    minutesDone,
    minutesTotal,
  };
}

export function findLesson(parts: Part[], lessonId: string): LessonRef | null {
  return flattenLessons(parts).find((ref) => ref.lesson.id === lessonId) ?? null;
}

export function findSection(parts: Part[], sectionId: string): Section | null {
  return allSections(parts).find((section) => section.id === sectionId) ?? null;
}

export function adjacentLessons(
  parts: Part[],
  lessonId: string
): { prev: LessonRef | null; next: LessonRef | null } {
  const refs = flattenLessons(parts);
  const index = refs.findIndex((ref) => ref.lesson.id === lessonId);
  if (index === -1) return { prev: null, next: null };
  return {
    prev: index > 0 ? refs[index - 1] : null,
    next: index < refs.length - 1 ? refs[index + 1] : null,
  };
}

/**
 * Where to send someone who presses "Continue".
 *
 * Prefers the first unfinished lesson at or after wherever they last were, so
 * resuming feels like picking up rather than being thrown back to the start.
 * Falls back to the first unfinished lesson anywhere, then to the very first
 * lesson once everything is complete.
 */
export function resumeLesson(
  parts: Part[],
  completed: Record<string, string>,
  lastVisitedId?: string | null
): LessonRef | null {
  const refs = flattenLessons(parts);
  if (refs.length === 0) return null;

  const isDone = (ref: LessonRef) => Boolean(completed[ref.lesson.id]);

  if (lastVisitedId) {
    const from = refs.findIndex((ref) => ref.lesson.id === lastVisitedId);
    if (from !== -1) {
      const ahead = refs.slice(from).find((ref) => !isDone(ref));
      if (ahead) return ahead;
    }
  }

  return refs.find((ref) => !isDone(ref)) ?? refs[0];
}

/** Sections with at least one completed lesson but not yet finished. */
export function sectionsInProgress(
  parts: Part[],
  completed: Record<string, string>
): Section[] {
  return allSections(parts).filter((section) => {
    const { done, total } = sectionProgress(section, completed);
    return done > 0 && done < total;
  });
}

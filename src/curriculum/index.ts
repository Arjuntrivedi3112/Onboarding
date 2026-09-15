/**
 * Curriculum barrel. Import the journey from here, never from `./data`.
 */

import { curriculum } from "./data";
import { allSections, flattenLessons } from "./selectors";
import type { LessonRef, Section } from "./types";

export { curriculum };
export * from "./types";
export * from "./selectors";

/** Every lesson in journey order. Computed once — the curriculum is static. */
export const lessonList: LessonRef[] = flattenLessons(curriculum);

export const sectionList: Section[] = allSections(curriculum);

/** Sections that map to a book chapter, in chapter order. */
export const bookSections: Section[] = sectionList.filter((s) => s.bookChapter > 0);

/** Sections that are not part of the book. Excluded from progress. */
export const appendixSections: Section[] = sectionList.filter((s) => s.bookChapter === 0);

/** Lesson ids that count toward the headline percentage. */
export const bookLessonIds: string[] = bookSections.flatMap((s) => s.lessons.map((l) => l.id));

/** The denominator, stated once: minutes across book chapters 1-11 only. */
export const bookTotalMinutes: number = bookSections.reduce(
  (sum, section) => sum + section.lessons.reduce((n, lesson) => n + lesson.minutes, 0),
  0
);

export const bookTotalLessons: number = bookLessonIds.length;

/** Lookup by URL pair, which is how the router addresses a lesson. */
export function lessonBySlug(sectionId: string, lessonSlug: string): LessonRef | null {
  return (
    lessonList.find((ref) => ref.section.id === sectionId && ref.lesson.slug === lessonSlug) ?? null
  );
}

/** The path a lesson lives at. Appendix sections route under /appendix. */
export function lessonPath(ref: LessonRef): string {
  const base = ref.section.bookChapter === 0 ? "/appendix" : "/learn";
  return `${base}/${ref.section.id}/${ref.lesson.slug}`;
}

export function sectionPath(section: Section): string {
  const base = section.bookChapter === 0 ? "/appendix" : "/learn";
  return `${base}/${section.id}`;
}

/**
 * Structural invariants. These are the assumptions the rest of the app is
 * built on, so a bad edit to `data.ts` should fail loudly in development
 * rather than produce a subtly wrong percentage in production.
 */
if (import.meta.env.DEV) {
  const lessonIds = lessonList.map((ref) => ref.lesson.id);
  const duplicateIds = lessonIds.filter((id, i) => lessonIds.indexOf(id) !== i);
  if (duplicateIds.length > 0) {
    console.error("[curriculum] duplicate lesson ids:", [...new Set(duplicateIds)]);
  }

  sectionList.forEach((section) => {
    const slugs = section.lessons.map((l) => l.slug);
    const dupes = slugs.filter((s, i) => slugs.indexOf(s) !== i);
    if (dupes.length > 0) {
      console.error(`[curriculum] duplicate slugs in section "${section.id}":`, [
        ...new Set(dupes),
      ]);
    }
  });

  const sectionIds = sectionList.map((s) => s.id);
  const dupeSections = sectionIds.filter((id, i) => sectionIds.indexOf(id) !== i);
  if (dupeSections.length > 0) {
    console.error("[curriculum] duplicate section ids:", [...new Set(dupeSections)]);
  }

  bookSections.forEach((section) => {
    if (section.number !== section.bookChapter) {
      console.error(
        `[curriculum] section "${section.id}" breaks the number===bookChapter rule:`,
        section.number,
        section.bookChapter
      );
    }
  });
}

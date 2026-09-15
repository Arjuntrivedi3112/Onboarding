import { describe, expect, it } from "vitest";

import {
  bookLessonIds,
  bookSections,
  bookTotalLessons,
  bookTotalMinutes,
  curriculum,
  lessonBySlug,
  lessonList,
  lessonPath,
  sectionList,
} from "@/curriculum";
import { adjacentLessons, bookProgress, resumeLesson, sectionProgress } from "@/curriculum/selectors";

describe("curriculum structure", () => {
  it("matches the spec's totals", () => {
    expect(lessonList).toHaveLength(79);
    expect(bookTotalLessons).toBe(73);
    expect(bookTotalMinutes).toBe(633);
    expect(sectionList).toHaveLength(12);
    expect(bookSections).toHaveLength(11);
  });

  it("keeps section numbers equal to book chapters", () => {
    bookSections.forEach((section) => {
      expect(section.number).toBe(section.bookChapter);
    });
  });

  it("orders book sections 1 through 11", () => {
    expect(bookSections.map((s) => s.number)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
  });

  it("has globally unique lesson ids", () => {
    const ids = lessonList.map((ref) => ref.lesson.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("has slugs unique within each section", () => {
    sectionList.forEach((section) => {
      const slugs = section.lessons.map((l) => l.slug);
      expect(new Set(slugs).size, `duplicate slug in ${section.id}`).toBe(slugs.length);
    });
  });

  it("gives every lesson a positive duration and a summary", () => {
    lessonList.forEach(({ lesson }) => {
      expect(lesson.minutes, lesson.id).toBeGreaterThan(0);
      expect(lesson.summary.length, lesson.id).toBeGreaterThan(0);
    });
  });

  it("keeps slugs free of chapter numbers so resequencing cannot rot links", () => {
    lessonList.forEach(({ lesson }) => {
      expect(lesson.slug, lesson.id).not.toMatch(/^\d+[-_]/);
    });
  });

  it("routes appendix lessons outside /learn", () => {
    lessonList.forEach((ref) => {
      const path = lessonPath(ref);
      if (ref.section.bookChapter === 0) expect(path).toMatch(/^\/appendix\//);
      else expect(path).toMatch(/^\/learn\//);
    });
  });

  it("resolves every lesson from its URL pair", () => {
    lessonList.forEach((ref) => {
      expect(lessonBySlug(ref.section.id, ref.lesson.slug)?.lesson.id).toBe(ref.lesson.id);
    });
  });

  it("excludes the appendix from the book denominator", () => {
    const appendixIds = sectionList
      .filter((s) => s.bookChapter === 0)
      .flatMap((s) => s.lessons.map((l) => l.id));
    expect(appendixIds.length).toBeGreaterThan(0);
    appendixIds.forEach((id) => expect(bookLessonIds).not.toContain(id));
  });
});

describe("progress maths", () => {
  it("reads 0% with nothing done", () => {
    expect(bookProgress(curriculum, {}).pct).toBe(0);
  });

  it("reads 100% only when every book lesson is done", () => {
    const all = Object.fromEntries(bookLessonIds.map((id) => [id, "2026-01-01T00:00:00.000Z"]));
    expect(bookProgress(curriculum, all).pct).toBe(100);
  });

  it("never reads 100% while a lesson is outstanding", () => {
    const allButOne = Object.fromEntries(
      bookLessonIds.slice(0, -1).map((id) => [id, "2026-01-01T00:00:00.000Z"])
    );
    const { pct, done, total } = bookProgress(curriculum, allButOne);
    expect(done).toBe(total - 1);
    expect(pct).toBeLessThan(100);
    expect(pct).toBe(99);
  });

  it("never reads 0% once something is done", () => {
    const one = { [bookLessonIds[0]]: "2026-01-01T00:00:00.000Z" };
    expect(bookProgress(curriculum, one).pct).toBeGreaterThan(0);
  });

  it("weights by minutes, not lesson count", () => {
    const byMinutes = [...bookSections[0].lessons].sort((a, b) => b.minutes - a.minutes);
    const longest = byMinutes[0];
    const shortest = byMinutes[byMinutes.length - 1];
    expect(longest.minutes).toBeGreaterThan(shortest.minutes);

    const withLongest = bookProgress(curriculum, { [longest.id]: "x" }).pct;
    const withShortest = bookProgress(curriculum, { [shortest.id]: "x" }).pct;
    expect(withLongest).toBeGreaterThan(withShortest);
  });

  it("completing the appendix does not move the book percentage", () => {
    const appendix = sectionList.find((s) => s.bookChapter === 0)!;
    const done = Object.fromEntries(appendix.lessons.map((l) => [l.id, "x"]));
    expect(bookProgress(curriculum, done).pct).toBe(0);
  });

  it("counts section progress discretely", () => {
    const section = bookSections[0];
    const done = { [section.lessons[0].id]: "x" };
    expect(sectionProgress(section, done)).toMatchObject({ done: 1, total: section.lessons.length });
  });
});

describe("navigation", () => {
  it("chains prev/next across the whole journey", () => {
    expect(adjacentLessons(curriculum, lessonList[0].lesson.id).prev).toBeNull();
    expect(adjacentLessons(curriculum, lessonList.at(-1)!.lesson.id).next).toBeNull();

    const middle = lessonList[5];
    const { prev, next } = adjacentLessons(curriculum, middle.lesson.id);
    expect(prev?.lesson.id).toBe(lessonList[4].lesson.id);
    expect(next?.lesson.id).toBe(lessonList[6].lesson.id);
  });

  it("resumes at the first lesson when nothing is done", () => {
    expect(resumeLesson(curriculum, {}, null)?.lesson.id).toBe(lessonList[0].lesson.id);
  });

  it("resumes forward from where the learner was, not back to the start", () => {
    const done = { [lessonList[0].lesson.id]: "x", [lessonList[1].lesson.id]: "x" };
    const resumed = resumeLesson(curriculum, done, lessonList[1].lesson.id);
    expect(resumed?.lesson.id).toBe(lessonList[2].lesson.id);
  });

  it("falls back to the first unfinished lesson anywhere", () => {
    const done = Object.fromEntries(lessonList.slice(1, 5).map((r) => [r.lesson.id, "x"]));
    expect(resumeLesson(curriculum, done, null)?.lesson.id).toBe(lessonList[0].lesson.id);
  });
});
